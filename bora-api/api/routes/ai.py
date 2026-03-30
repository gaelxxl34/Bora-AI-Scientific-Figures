# api/routes/ai.py — AI chat endpoint (Anthropic + OpenAI)
# Streams responses via SSE for real-time figure generation assistance

import os
import json
import logging
from typing import AsyncGenerator, List, Optional, Tuple

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Icon manifest (loaded once at import time for search) ──────
_icon_manifest: List[dict] = []

def _load_icon_manifest():
    """Load icon manifest from Supabase Storage, falling back to local file."""
    global _icon_manifest
    supabase_url = os.getenv("SUPABASE_URL")

    # Try Supabase Storage first (production)
    if supabase_url:
        try:
            import requests as _req
            manifest_url = f"{supabase_url}/storage/v1/object/public/icons/manifest.json"
            res = _req.get(manifest_url, timeout=15)
            if res.ok:
                _icon_manifest = res.json()
                logger.info("Loaded %d icons from Supabase Storage", len(_icon_manifest))
                return
        except Exception as e:
            logger.warning("Failed to load manifest from Supabase: %s", e)

    # Fallback: local file for development
    local_path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "bora-web", "public", "icons", "manifest.json")
    )
    if os.path.exists(local_path):
        try:
            with open(local_path, "r") as f:
                _icon_manifest = json.load(f)
            logger.info("Loaded %d icons from local manifest", len(_icon_manifest))
            return
        except Exception as e:
            logger.warning("Failed to load local icon manifest: %s", e)
    logger.warning("Icon manifest not found")

_load_icon_manifest()


@router.get("/icons/search")
async def search_icons(q: str, limit: int = 5):
    """Search the icon manifest by keyword. Returns matching icon paths."""
    if not q or not _icon_manifest:
        return {"results": []}
    
    query = q.lower().strip()
    terms = query.split()
    scored: List[Tuple[int, dict]] = []
    
    for icon in _icon_manifest:
        name = icon.get("name", "").lower()
        category = icon.get("category", "").lower()
        icon_id = icon.get("id", "").lower()
        
        score = 0
        # Exact name match
        if query == name:
            score += 100
        # Name contains full query
        elif query in name:
            score += 50
        # All terms appear in name
        elif all(t in name for t in terms):
            score += 40
        # Any term in name
        elif any(t in name for t in terms):
            score += 20
        # Category match
        if query in category or any(t in category for t in terms):
            score += 10
        # ID match
        if any(t in icon_id for t in terms):
            score += 5
            
        if score > 0:
            scored.append((score, icon))
    
    scored.sort(key=lambda x: -x[0])
    results = [
        {"name": s[1]["name"], "path": s[1]["path"], "category": s[1]["category"]}
        for s in scored[:limit]
    ]
    return {"results": results}


# ── Icon generation (when icon is not in the library) ──────────

ICON_GEN_PROMPT = """You are a scientific SVG icon designer. Generate a simple, clean, single-color SVG icon for the given concept.

Rules:
- Output ONLY the raw SVG code, no explanation, no markdown fences
- ViewBox: 0 0 100 100
- Use a single color: #333333 for strokes/fills
- Keep it simple: max 15 path elements
- Line-art style matching scientific publication figures
- No text elements, no embedded images
- Must be a valid standalone SVG

Concept: """


class IconGenRequest(BaseModel):
    name: str


@router.post("/generate-icon")
async def generate_icon(req: IconGenRequest):
    """Generate an SVG icon using AI when it doesn't exist in the library."""
    import re
    name = req.name.strip()
    if not name or len(name) > 100:
        raise HTTPException(status_code=400, detail="Invalid icon name")

    try:
        import openai
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": ICON_GEN_PROMPT + name}],
            max_tokens=2000,
            temperature=0.3,
        )
        svg_raw = response.choices[0].message.content or ""

        # Strip markdown fences if AI added them anyway
        svg_raw = re.sub(r"^```(?:svg|xml)?\s*\n?", "", svg_raw.strip())
        svg_raw = re.sub(r"\n?```\s*$", "", svg_raw.strip())

        if "<svg" not in svg_raw or "</svg>" not in svg_raw:
            raise HTTPException(status_code=500, detail="AI did not return valid SVG")

        return {"name": name, "svg": svg_raw}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Icon generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Icon generation failed")


@router.post("/save-icon")
async def save_generated_icon(req: dict):
    """Save an AI-generated SVG icon to Supabase Storage and update manifest."""
    import re
    name = req.get("name", "").strip()
    svg = req.get("svg", "").strip()

    if not name or not svg or "<svg" not in svg:
        raise HTTPException(status_code=400, detail="Invalid icon data")

    # Sanitize filename
    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", name.lower().strip()).strip("_")
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid icon name")

    # Upload to Supabase Storage
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    storage_path = f"ai-generated/{safe_name}.svg"
    public_url = f"{supabase_url}/storage/v1/object/public/icons/{storage_path}"

    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            sb = create_client(supabase_url, supabase_key)
            sb.storage.from_("icons").upload(
                path=storage_path,
                file=svg.encode("utf-8"),
                file_options={"content-type": "image/svg+xml", "upsert": "true"},
            )
            icon_path = public_url
        except Exception as e:
            logger.warning("Supabase upload failed, falling back to local: %s", e)
            icon_path = _save_icon_locally(safe_name, svg)
    else:
        icon_path = _save_icon_locally(safe_name, svg)

    # Update the in-memory manifest
    new_entry = {
        "id": f"ai-generated__{safe_name}",
        "name": name,
        "category": "AI Generated",
        "source": "ai-generated",
        "path": icon_path,
    }
    _icon_manifest.append(new_entry)

    # Also sync the Supabase manifest.json (fire-and-forget)
    try:
        _update_supabase_manifest(new_entry)
    except Exception as e:
        logger.warning("Failed to update Supabase manifest: %s", e)

    return {
        "saved": True,
        "path": icon_path,
        "existed": False,
    }


def _save_icon_locally(safe_name: str, svg: str) -> str:
    """Fallback: save icon to local filesystem."""
    icons_dir = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "bora-web", "public", "icons", "ai-generated")
    )
    os.makedirs(icons_dir, exist_ok=True)
    filepath = os.path.join(icons_dir, f"{safe_name}.svg")
    if not os.path.exists(filepath):
        with open(filepath, "w") as f:
            f.write(svg)
    return f"/icons/ai-generated/{safe_name}.svg"


def _update_supabase_manifest(new_entry: dict):
    """Download manifest from Supabase, append new entry, re-upload."""
    import requests
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        return

    manifest_url = f"{supabase_url}/storage/v1/object/public/icons/manifest.json"
    res = requests.get(manifest_url, timeout=10)
    if res.ok:
        manifest = res.json()
    else:
        manifest = []

    # Avoid duplicates
    if not any(e["id"] == new_entry["id"] for e in manifest):
        manifest.append(new_entry)
        from supabase import create_client
        sb = create_client(supabase_url, supabase_key)
        sb.storage.from_("icons").upload(
            path="manifest.json",
            file=json.dumps(manifest).encode("utf-8"),
            file_options={"content-type": "application/json", "upsert": "true"},
        )


# ── Available models ──────────────────────────────────────────
MODELS = {
    # Standard tier
    "claude-sonnet": {
        "provider": "anthropic",
        "model_id": "claude-sonnet-4-20250514",
        "label": "Claude Sonnet",
        "tier": "standard",
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "model_id": "gpt-4o-mini",
        "label": "GPT-4o Mini",
        "tier": "standard",
    },
    # Advanced tier
    "claude-opus": {
        "provider": "anthropic",
        "model_id": "claude-opus-4-20250514",
        "label": "Claude Opus",
        "tier": "advanced",
    },
    "gpt-4o": {
        "provider": "openai",
        "model_id": "gpt-4o",
        "label": "GPT-4o",
        "tier": "advanced",
    },
}

SYSTEM_PROMPT = """You are the AI engine inside Bora, a scientific figure platform.
You create publication-quality figures using canvas commands that place icons
from a library of 5,800+ professional scientific SVG icons.

═══ MANDATORY RESPONSE FORMAT ═══

When asked to create/draw/build/design a figure, you MUST respond in exactly
this two-part format:

PART 1 — BIOLOGICAL ANALYSIS (write this out, it ensures correctness):
State the complete pathway/mechanism as a numbered chain:
  Step 1: [Actor A] —[relationship]→ [Actor B] (connector style: X)
  Step 2: [Actor B] —[relationship]→ [Actor C] (connector style: Y)
  ...
For each step, state the connector style you will use and WHY.
Identify the endpoint (the last element should NOT have an outgoing arrow).
Count your total elements (N) and choose the layout:
  - N ≤ 5: single horizontal row
  - N = 6–10: two horizontal rows with step-down link
  - Hub with branches: radial/star layout
State your chosen layout and list the (x, y) position for each element.

PART 2 — FIGURE (the ```objects block):
Generate the JSON commands that implement your analysis from Part 1.
Every step from Part 1 must appear as icons + connectors.
The chain must be connected end-to-end with NO gaps or dangling arrows.

═══ EXAMPLES ═══

EXAMPLE 1 — HORIZONTAL FLOW (default for most pathways):

User: "Draw the apoptosis pathway showing caspase cascade activation from mitochondrial release of cytochrome-c to DNA fragmentation"

Step 1: Mitochondria —releases→ Cytochrome C (transport: moves out of organelle)
Step 2: Cytochrome C —activates→ Caspase Cascade (activation: triggers enzyme activity)  
Step 3: Caspase Cascade —leads to→ DNA Fragmentation (conversion: produces end result)
Endpoint: DNA Fragmentation (no outgoing arrow)
N = 4 elements → single row. Positions: x = 100, 353, 607, 860 at y = 320
Layout: horizontal flow (left-to-right, uses full canvas width)

```objects
[
  {"action":"addText","text":"Apoptosis Pathway","x":480,"y":65,"fontSize":18,"fontWeight":"600","fill":"#1a1a2e","fontFamily":"Inter"},
  {"action":"addShape","shape":"Rectangle","x":40,"y":90,"width":880,"height":460,"fill":"#fafcff","stroke":"#d0dce8","strokeWidth":1,"rx":14},
  {"action":"addIcon","icon":"mitochondria","x":100,"y":320,"scale":60},
  {"action":"addText","text":"Mitochondria","x":100,"y":365,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"cytokine","x":353,"y":320,"scale":50},
  {"action":"addText","text":"Cytochrome C","x":353,"y":360,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"proteasome","x":607,"y":320,"scale":55},
  {"action":"addText","text":"Caspase Cascade","x":607,"y":362,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"dna","x":860,"y":320,"scale":50},
  {"action":"addText","text":"DNA Fragmentation","x":860,"y":360,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":135,"y1":320,"x2":318,"y2":320,"stroke":"#0077b6","strokeWidth":2,"style":"transport","label":"releases"},
  {"action":"addConnector","x1":388,"y1":320,"x2":572,"y2":320,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"activates"},
  {"action":"addConnector","x1":642,"y1":320,"x2":825,"y2":320,"stroke":"#e76f51","strokeWidth":2,"style":"conversion","label":"leads to"}
]
```

EXAMPLE 2 — TWO-ROW FLOW (6+ elements wrapping to second row):

User: "Show tissue engineering: stem cells seed onto scaffold, scaffold provides differentiation signals, signals induce vascularization, vascularization enables implantation, implantation promotes bone regeneration"

Step 1: Stem Cells —seed on→ Hydrogel Scaffold (transport: moves into position)
Step 2: Hydrogel Scaffold —provides→ Differentiation Signals (activation: stimulates)
Step 3: Differentiation Signals —induce→ Vascularization (activation: blood vessel formation)
Step 4: Vascularization —enables→ Implantation (transport: moves to site)
Step 5: Implantation —promotes→ Bone Regeneration (conversion: produces end result)
Endpoint: Bone Regeneration (no outgoing arrow)
N = 6 elements → two rows. Row 1: 3 elements at y=230, Row 2: 3 elements at y=480
Row 1 positions: x = 100, 480, 860. Row 2 positions: x = 100, 480, 860

```objects
[
  {"action":"addText","text":"Tissue Engineering Scaffold","x":480,"y":65,"fontSize":18,"fontWeight":"600","fill":"#1a1a2e","fontFamily":"Inter"},
  {"action":"addShape","shape":"Rectangle","x":40,"y":100,"width":880,"height":510,"fill":"#fafcff","stroke":"#d0dce8","strokeWidth":1,"rx":14},
  {"action":"addIcon","icon":"stem cell","x":100,"y":230,"scale":65},
  {"action":"addText","text":"Stem Cells","x":100,"y":278,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"collagen","x":480,"y":230,"scale":60},
  {"action":"addText","text":"Hydrogel Scaffold","x":480,"y":276,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"cytokine","x":860,"y":230,"scale":55},
  {"action":"addText","text":"Differentiation Signals","x":860,"y":273,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"blood vessel","x":100,"y":480,"scale":60},
  {"action":"addText","text":"Vascularization","x":100,"y":526,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"bone section","x":480,"y":480,"scale":60},
  {"action":"addText","text":"Implantation","x":480,"y":526,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"bone","x":860,"y":480,"scale":60},
  {"action":"addText","text":"Bone Regeneration","x":860,"y":526,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":140,"y1":230,"x2":440,"y2":230,"stroke":"#0077b6","strokeWidth":2,"style":"transport","label":"seed on"},
  {"action":"addConnector","x1":520,"y1":230,"x2":820,"y2":230,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"provides"},
  {"action":"addConnector","x1":860,"y1":270,"x2":100,"y2":445,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"induce"},
  {"action":"addConnector","x1":140,"y1":480,"x2":440,"y2":480,"stroke":"#0077b6","strokeWidth":2,"style":"transport","label":"enables"},
  {"action":"addConnector","x1":520,"y1":480,"x2":820,"y2":480,"stroke":"#e76f51","strokeWidth":2,"style":"conversion","label":"promotes"}
]
```

EXAMPLE 3 — RADIAL/STAR (one hub fans out to branches):

User: "Show how a growth factor receptor activates three downstream signaling branches"

Step 1: Growth Factor —binds→ Receptor (binding)
Step 2: Receptor —activates→ MAPK (activation)
Step 3: Receptor —activates→ PI3K (activation)
Step 4: Receptor —activates→ JAK-STAT (activation)
N = 5 elements. Layout: radial/star (hub at center, 3 branches below)
Hub: Growth Factor at (480,160), Receptor at (480,300)
Targets: MAPK at (160,480), PI3K at (480,480), JAK-STAT at (800,480)

```objects
[
  {"action":"addText","text":"Growth Factor Receptor Signaling","x":480,"y":65,"fontSize":18,"fontWeight":"600","fill":"#1a1a2e","fontFamily":"Inter"},
  {"action":"addIcon","icon":"growth factor","x":480,"y":160,"scale":50},
  {"action":"addText","text":"Growth Factor","x":480,"y":200,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"receptor","x":480,"y":300,"scale":55},
  {"action":"addText","text":"Receptor","x":480,"y":343,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"kinase","x":160,"y":480,"scale":50},
  {"action":"addText","text":"MAPK","x":160,"y":520,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"kinase","x":480,"y":480,"scale":50},
  {"action":"addText","text":"PI3K","x":480,"y":520,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"kinase","x":800,"y":480,"scale":50},
  {"action":"addText","text":"JAK-STAT","x":800,"y":520,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":480,"y1":195,"x2":480,"y2":268,"stroke":"#6930c3","strokeWidth":2,"style":"binding","label":"binds"},
  {"action":"addConnector","x1":445,"y1":335,"x2":195,"y2":448,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"activates"},
  {"action":"addConnector","x1":480,"y1":335,"x2":480,"y2":448,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"activates"},
  {"action":"addConnector","x1":515,"y1":335,"x2":765,"y2":448,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"activates"}
]
```

═══ CANVAS ═══
960 × 672 px. Origin (0,0) is top-left.
Safe area: x=[40..920], y=[60..630]. NEVER place anything outside.
Icons and text are center-anchored at (x, y).
Shapes are placed with top-left at (x, y).

═══ ACTIONS ═══

1. addIcon — Place a scientific icon
   Fields: icon (search query), x, y, scale (px, default 60)

   CRITICAL: Use icon names that MATCH the library. The library has 5,800+ icons.
   Use these EXACT terms (they are real icon names in the library):

   Cells: "cell", "b cell", "t cell", "macrophage", "neutrophil", "neuron",
     "astrocyte", "adipocyte", "stem cell", "apoptotic cell", "cancerous cell",
     "oocyte", "fibroblast", "epithelial", "red blood cell", "platelet"
   Organelles: "mitochondria", "nucleus", "ribosome", "Endoplasmic Reticulum",
     "golgi", "lysosome", "vesicle", "exosome", "peroxisome", "centrosome"
   Proteins: "antibody", "receptor", "kinase", "proteasome", "actin",
     "insulin", "collagen", "cytokine", "growth factor", "transcription factor rna",
     "enzyme", "hemoglobin" (or use specific protein names like "abl", "akt", "bcr")
   Nucleic acids: "dna", "rna", "chromosome", "plasmid", "CRISPR Cas9",
     "nucleosome", "telomere"
   Molecules: "atp", "glucose", "lipid", "amino acid", "hormone"
   Lab: "flask", "beaker", "pipette", "syringe", "microscope", "centrifuge",
     "gel", "DNA sequencer", "well plate", "96 well"
   Tissues: "collagen", "blood vessel", "bone section", "alveolus",
     "blastocyst", "tumor"
   Organs: "liver", "kidney", "lung", "heart", "brain", "stomach", "intestine",
     "eye", "bone", "skin"
   Organisms: "mouse", "zebrafish", "fly", "bacteria", "virus", "SARS CoV 2"
   Nano: "Nanoparticle", "liposome"
   Connectors/other: "Proteoglycan", "cell membrane", "fibrin", "synapse"

   DO NOT invent terms. If unsure, use simple single-word queries like "cell",
   "receptor", "dna", "antibody" — these always match.

2. addText — Label (centered at x, top at y)
   Fields: text, x, y, fontSize (12), fontWeight, fontFamily ("Inter"), fill

3. addShape — Background rectangle/circle (top-left at x, y)
   Fields: shape, x, y, width, height, fill, stroke, strokeWidth, rx

4. addConnector — Connection with biological meaning
   Fields: x1, y1, x2, y2, stroke, strokeWidth, style, label

   STYLES — pick based on the BIOLOGY of each specific relationship:
   "activation"  #2d6a4f → arrow   | A activates/stimulates/promotes B
   "inhibition"  #c1121f ⊣ T-bar   | A blocks/inhibits/suppresses B
   "binding"     #6930c3 ◇ dashed  | A physically binds/attaches to B
   "transport"   #0077b6 ≫ chevron | A releases/moves/secretes/delivers B
   "conversion"  #e76f51 → arrow   | A converts/produces/becomes/causes B
   "default"     #4a5568 → arrow   | generic/informational

═══ LAYOUT ═══
The canvas is LANDSCAPE (960×672) — wider than tall. Default to horizontal.
Choose based on biology:
  HORIZONTAL FLOW — DEFAULT for most figures. Use for: pathways, cascades,
    signaling chains, metabolic processes, any A→B→C→D sequence.
    Place elements left-to-right across the full canvas width.

    ── EXACT POSITIONING FORMULAS ──
    Count your elements (N), then use these EXACT x positions.
    All elements share the same y center line for each row.

    SINGLE ROW (N ≤ 5):
      y = 320 (vertical center of canvas)
      Compute spacing: margin = 100, usable = 960 - 2*margin = 760
      gap = usable / (N - 1)   [if N=1, just center at x=480]
      x_i = margin + i * gap   (i = 0, 1, 2, ..., N-1)

      Quick reference:
        2 elements: x = 200, 760
        3 elements: x = 100, 480, 860
        4 elements: x = 100, 353, 607, 860
        5 elements: x = 100, 290, 480, 670, 860

    TWO ROWS (N = 6–10):
      Split elements: row1 gets ceil(N/2), row2 gets the rest.
      Row 1: y = 230, elements flow LEFT → RIGHT
      Row 2: y = 480, elements ALSO flow LEFT → RIGHT (NOT reversed)
      Use the single-row formula for each row independently.

      The LAST element on row 1 connects DOWN to the FIRST element on row 2
      with a vertical connector (a "step-down" link).

      Example for 6 elements (A→B→C→D→E→F):
        Row 1: A(x=100) → B(x=480) → C(x=860)   at y=230
        Row 2: D(x=100) → E(x=480) → F(x=860)   at y=480
        Step-down connector: C(860,230) → D(100,480)

      Example for 5+overflow:
        Row 1: A(x=100) → B(x=480) → C(x=860)   at y=230
        Row 2: D(x=290) → E(x=670)               at y=480
        Step-down connector: C(860,230) → D(290,480)

    THREE+ ROWS (N > 10): Not recommended. Group related elements instead.

  RADIAL/STAR — hub-and-spoke: one central element fans out to multiple targets.
    Hub at x=480, y=240. Targets evenly spaced below.
    For 3 targets: x = 160, 480, 800 at y=480
    For 4 targets: x = 100, 353, 607, 860 at y=480

  NESTED COMPARTMENTS — cell with organelles inside
  MULTI-ZONE — extracellular/membrane/cytoplasm/nucleus horizontal bands
  VERTICAL CASCADE — ONLY use when the user explicitly requests top-to-bottom
    layout. Do NOT default to vertical just because biology goes "upstream→downstream".

  ── ROW TRANSITION CONNECTORS ──
  When a pathway wraps from row 1 to row 2:
  - Draw a diagonal connector from the last element of row 1 to the first element of row 2.
  - The step-down connector style should match the biological relationship at that step.
  - Flow on row 2 continues LEFT → RIGHT (never right-to-left / backwards).

RULES:
  - USE THE FULL CANVAS (960×672). Spread elements across the ENTIRE width.
  - ALL elements inside safe area [40-920, 60-630].
  - Minimum 140px between icon centers in horizontal layouts.
  - Labels: same x as icon, y = icon_y + scale/2 + 14.
  - Connector endpoints: offset from icon center by ~(scale/2 + 10)px in the
    connection direction.
    For horizontal: x1 = leftIcon_x + 35, x2 = rightIcon_x - 35 (same y).
    For vertical: y1 = topIcon_y + 35, y2 = bottomIcon_y - 35 (same x).
    For diagonal (row transitions): offset both x and y by 35px toward the target.
  - NEVER draw a connector pointing RIGHT-TO-LEFT (x2 < x1) on the same row.
    Flow always goes left → right within each row.
  - Order: shapes FIRST → icons → labels → connectors LAST.
  - Endpoint rule: the LAST element in a pathway has NO outgoing arrow.
  - NEVER cluster elements in the center. Use the FULL canvas width.
  - Background shapes must be placed BEFORE icons and text.
  - Title goes at y=65, centered at x=480.
  - Optional background panel: a light rounded rect behind the main content area.

═══ SIZES ═══
  Cells: 80-100   Organelles: 50-70   Proteins: 40-55
  Small molecules: 30-45   Lab equipment: 50-65
  Labels: fontSize 11-12   Title: fontSize 18, fontWeight "600"

═══ ZONES ═══
  Extracellular: "#fff8e1" / "#e6a817"
  Cytoplasm: "#f0f4ff" / "#94b8db"
  Nucleus: "#f8f0ff" / "#9b5de5"
  Mitochondria: "#fff3e0" / "#e65100"

═══ ABSOLUTE RULES ═══
1. You MUST write the biological step-chain BEFORE the ```objects block
2. Every step in your chain MUST appear as connected icons+connectors
3. The chain must be CONTINUOUS — no gaps, no disconnected elements
4. Endpoint elements have NO outgoing arrows (they are the final result)
5. Each connector MUST use the correct biological style for its relationship
6. NEVER use the same style for all connectors — each relationship is different
7. Every icon MUST have a text label below it
8. NEVER drop elements the user described
9. Scale modestly: 40-65 for most elements
10. Count N elements and pick layout: N ≤ 5 = single row, N 6-10 = two rows
11. In your analysis, list the (x, y) position for every element BEFORE writing JSON
12. Flow is ALWAYS left-to-right within a row. NEVER draw right-to-left connectors
13. When wrapping to row 2, elements continue left-to-right (not reversed)
14. Use the FULL canvas width: first element near x=100, last near x=860"""


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "claude-sonnet"
    canvas_context: Optional[str] = None  # Current canvas state for context


@router.get("/models")
async def list_models():
    """Return available AI models grouped by tier."""
    return {
        "models": [
            {"id": k, "label": v["label"], "provider": v["provider"], "tier": v["tier"]}
            for k, v in MODELS.items()
        ]
    }


@router.post("/chat")
async def chat(request: ChatRequest):
    """Stream an AI chat response via SSE."""
    model_config = MODELS.get(request.model)
    if not model_config:
        raise HTTPException(status_code=400, detail=f"Unknown model: {request.model}")

    provider = model_config["provider"]
    model_id = model_config["model_id"]

    # Build messages
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    # Inject canvas context into the last user message if provided
    if request.canvas_context and messages:
        last = messages[-1]
        if last["role"] == "user":
            last["content"] = (
                f"{last['content']}\n\n[Current canvas has these elements: {request.canvas_context}]"
            )

    if provider == "anthropic":
        gen = _stream_anthropic(model_id, messages)
    elif provider == "openai":
        gen = _stream_openai(model_id, messages)
    else:
        raise HTTPException(status_code=500, detail="Unknown provider")

    return StreamingResponse(
        _sse_wrapper(gen),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


class _StreamError(Exception):
    """Sentinel raised inside generators so _sse_wrapper can emit an error event."""
    pass


async def _stream_anthropic(model_id: str, messages: List[dict]) -> AsyncGenerator[str, None]:
    """Stream from Anthropic Claude API."""
    import anthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "sk-ant-placeholder":
        raise _StreamError("Anthropic API key is not configured. Please add a valid key in the server settings.")

    client = anthropic.AsyncAnthropic(api_key=api_key)

    try:
        async with client.messages.stream(
            model=model_id,
            max_tokens=16384,
            system=SYSTEM_PROMPT,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except anthropic.AuthenticationError:
        logger.error("Anthropic authentication failed — invalid API key")
        raise _StreamError("Authentication failed. Please check your API key.")
    except anthropic.RateLimitError:
        logger.error("Anthropic rate limit exceeded")
        raise _StreamError("Rate limit reached. Please wait a moment and try again.")
    except anthropic.APIError as e:
        logger.error("Anthropic API error: %s", e)
        # Sanitize: never expose raw API error details to users
        msg = str(e.message) if hasattr(e, 'message') else str(e)
        if "credit" in msg.lower() or "balance" in msg.lower() or "billing" in msg.lower():
            raise _StreamError("This AI model is temporarily unavailable. Please try a different model.")
        elif "overloaded" in msg.lower() or "capacity" in msg.lower():
            raise _StreamError("This model is currently busy. Please try again in a moment or switch models.")
        elif "too long" in msg.lower() or "token" in msg.lower():
            raise _StreamError("Your request is too long. Please try a shorter description.")
        else:
            raise _StreamError("Something went wrong with the AI service. Please try again or switch to a different model.")
    except Exception as e:
        logger.error("Unexpected Anthropic error: %s", e)
        raise _StreamError("Something went wrong. Please try again or switch to a different model.")


async def _stream_openai(model_id: str, messages: List[dict]) -> AsyncGenerator[str, None]:
    """Stream from OpenAI API."""
    from openai import AsyncOpenAI, AuthenticationError, RateLimitError, APIError

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "sk-proj-placeholder":
        raise _StreamError("OpenAI API key is not configured. Please add a valid key in the server settings.")

    client = AsyncOpenAI(api_key=api_key)

    try:
        stream = await client.chat.completions.create(
            model=model_id,
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            max_tokens=16384,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if delta and delta.content:
                yield delta.content
    except AuthenticationError:
        logger.error("OpenAI authentication failed — invalid API key")
        raise _StreamError("Authentication failed. Please check your API key.")
    except RateLimitError:
        logger.error("OpenAI rate limit exceeded")
        raise _StreamError("Rate limit reached. Please wait a moment and try again.")
    except APIError as e:
        logger.error("OpenAI API error: %s", e)
        msg = str(e.message) if hasattr(e, 'message') else str(e)
        if "billing" in msg.lower() or "quota" in msg.lower() or "insufficient" in msg.lower():
            raise _StreamError("This AI model is temporarily unavailable. Please try a different model.")
        elif "overloaded" in msg.lower() or "capacity" in msg.lower():
            raise _StreamError("This model is currently busy. Please try again in a moment or switch models.")
        elif "too long" in msg.lower() or "token" in msg.lower():
            raise _StreamError("Your request is too long. Please try a shorter description.")
        else:
            raise _StreamError("Something went wrong with the AI service. Please try again or switch to a different model.")
    except Exception as e:
        logger.error("Unexpected OpenAI error: %s", e)
        raise _StreamError("Something went wrong. Please try again or switch to a different model.")


async def _sse_wrapper(stream: AsyncGenerator[str, None]) -> AsyncGenerator[str, None]:
    """Wrap text chunks as SSE data events."""
    try:
        async for text in stream:
            yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except _StreamError as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
    except Exception as e:
        logger.error("Unexpected SSE wrapper error: %s", e)
        yield f"data: {json.dumps({'type': 'error', 'content': 'An unexpected error occurred. Please try again.'})}\n\n"
