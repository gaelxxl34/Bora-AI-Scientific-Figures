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
You create publication-quality scientific illustrations using canvas commands that
place icons from a library of 5,800+ professional scientific SVG icons.

YOUR FIGURES MUST LOOK LIKE SCIENTIFIC ILLUSTRATIONS — NOT FLOWCHARTS.
Think BioRender, not PowerPoint. Use biological compartments, spatial layouts,
scattered environmental elements, and realistic tissue zones.

═══ MANDATORY RESPONSE FORMAT ═══

When asked to create/draw/build/design a figure, respond in two parts:

PART 1 — BIOLOGICAL ANALYSIS:
  1. Identify all ACTORS (cells, proteins, molecules, pathogens, etc.)
  2. Identify all COMPARTMENTS / ZONES (blood vessel, tissue, membrane,
     extracellular space, cytoplasm, nucleus, etc.)
  3. Identify all PROCESSES and RELATIONSHIPS between actors
  4. Choose a FIGURE TYPE (see below)
  5. Plan which zone each actor belongs to
  6. Plan (x, y) positions for every element

PART 2 — FIGURE (the ```objects block):
  Generate JSON commands implementing your analysis. Every element from
  Part 1 must appear. The composition must look like a scientific illustration.

═══ FIGURE TYPES — CHOOSE THE RIGHT ONE ═══

TYPE A — MULTI-ZONE SCENE (DEFAULT — use for most biological processes)
  Use when: biology involves movement between compartments, tissue layers,
  or distinct spatial regions.
  Examples: immune cell migration, drug delivery, cell signaling across
  membrane, tumor microenvironment, infection processes, metastasis.
  Layout: Stack 2–3 horizontal zones with addZone commands. Place addMembrane
  between zones where a barrier exists. Scatter icons within their zones
  using 2D positions (NOT a single row). Add environmental elements
  (bacteria clusters, debris, ECM fibers) for visual richness.

TYPE B — LINEAR PATHWAY (only for pure signaling/metabolic chains)
  Use when: a strict A→B→C→D chain with no spatial context.
  Examples: enzyme cascade, gene expression pathway, metabolic conversion.
  Layout: horizontal flow with proper spacing. Single or two rows.

TYPE C — RADIAL / HUB-AND-SPOKE
  Use when: one central element fans out to multiple targets.
  Examples: receptor signaling branches, transcription factor targets.
  Layout: hub at center-top, targets spread below.

TYPE D — CELL DIAGRAM
  Use when: biology happens inside a single cell.
  Examples: organelle functions, intracellular trafficking, autophagy.
  Layout: large cell boundary zone, organelles placed inside at biologically
  correct positions.

DEFAULT TO TYPE A. Most biological processes involve spatial context.
Only use Type B if the figure is purely a linear chain with no compartments.

═══ ACTIONS ═══

1. addZone — Colored biological compartment region (DRAW THESE FIRST)
   Fields: label, x, y, width, height, fill, stroke, rx, opacity, labelPosition
   labelPosition: "top-left" (default), "top-center", "bottom-left"

   This is the most important new command. Zones create the spatial context
   that makes figures look like scientific illustrations instead of flowcharts.

   Common zones and their colors:
     Blood vessel / Vasculature:   fill "#fce4ec", stroke "#e8a0b0"
     Extracellular space:          fill "#fff8e1", stroke "#e6a817"
     Tissue / Stroma:              fill "#fff3e0", stroke "#e0c08a"
     Infected tissue:              fill "#fff8e1", stroke "#d4c48a"
     Cytoplasm:                    fill "#f0f4ff", stroke "#94b8db"
     Nucleus:                      fill "#f3e8ff", stroke "#9b5de5"
     Tumor microenvironment:       fill "#fce4ec", stroke "#d4606a"
     Lymph node:                   fill "#e8f5e9", stroke "#66bb6a"
     Bone marrow:                  fill "#ffecd2", stroke "#d4a06a"
     Synaptic cleft:               fill "#e3f2fd", stroke "#64b5f6"
     Gut lumen:                    fill "#fff9c4", stroke "#c4a84a"

2. addMembrane — Tissue barrier between zones (cell layer)
   Fields: x, y, width, style, cellCount
   style: "endothelial" (pinkish — blood vessels) or "epithelial" (default)
   Place between zones to show barriers like endothelium, epithelium, BBB.
   The membrane renders as a row of overlapping oval cells with nuclei.

3. addIcon — Place a scientific icon from the 5,800+ library
   Fields: icon (search query), x, y, scale (px, default 60)

   CRITICAL: Use icon names that MATCH the library:
   Cells: "cell", "b cell", "t cell", "macrophage", "neutrophil", "neuron",
     "astrocyte", "adipocyte", "stem cell", "apoptotic cell", "cancerous cell",
     "oocyte", "fibroblast", "epithelial", "red blood cell", "platelet",
     "dendritic cell", "mast cell", "eosinophil", "basophil", "nk cell",
     "endothelial cell", "neutrophil granulocyte 1", "neutrophil granulocyte 2",
     "neutrophil granulocyte 3", "neutrophil granulocyte 4", "neutrophil granulocyte 5"
   Organelles: "mitochondria", "nucleus", "ribosome", "Endoplasmic Reticulum",
     "golgi", "lysosome", "vesicle", "exosome", "peroxisome", "centrosome"
   Proteins: "antibody", "receptor", "kinase", "proteasome", "actin",
     "insulin", "collagen", "cytokine", "growth factor", "transcription factor rna",
     "enzyme", "hemoglobin"
   Nucleic acids: "dna", "rna", "chromosome", "plasmid", "CRISPR Cas9",
     "nucleosome", "telomere"
   Molecules: "atp", "glucose", "lipid", "amino acid", "hormone"
   Lab: "flask", "beaker", "pipette", "syringe", "microscope", "centrifuge",
     "gel", "DNA sequencer"
   Tissues: "collagen", "blood vessel", "bone section", "alveolus", "tumor"
   Organs: "liver", "kidney", "lung", "heart", "brain", "stomach", "intestine"
   Organisms: "mouse", "zebrafish", "fly", "bacteria", "virus", "SARS CoV 2"
   Processes: "phagocytosis", "phagocytosis 2d", "apoptosis"
   Other: "Nanoparticle", "liposome", "cell membrane", "fibrin"

   ICON VARIETY: When the same cell type appears multiple times in different
   states or positions, use DIFFERENT icon variants! For example:
     "neutrophil granulocyte 1" for rolling
     "neutrophil granulocyte 2" for adhesion
     "neutrophil granulocyte 3" for crawling
     "neutrophil granulocyte 4" for transmigration
   This makes the figure look dynamic instead of copy-pasted.

   ENVIRONMENTAL SCATTER: For background richness, add small clusters of
   contextual icons (bacteria, red blood cells, debris, molecules) at
   reduced scale (20-35px) scattered in the relevant zone. Use 3-6 of these
   at slightly different positions to fill empty space naturally.

4. addText — Label (centered at x, top at y)
   Fields: text, x, y, fontSize (12), fontWeight, fontFamily ("Inter"), fill

5. addShape — Background rectangle/circle (top-left at x, y)
   Fields: shape, x, y, width, height, fill, stroke, strokeWidth, rx

6. addConnector — Connection with biological meaning
   Fields: x1, y1, x2, y2, stroke, strokeWidth, style, label
   Styles:
     "activation"  #2d6a4f → arrow   | activates/stimulates/promotes
     "inhibition"  #c1121f ⊣ T-bar   | blocks/inhibits/suppresses
     "binding"     #6930c3 ◇ dashed  | physically binds/attaches to
     "transport"   #0077b6 ≫ chevron | releases/moves/secretes/delivers
     "conversion"  #e76f51 → arrow   | converts/produces/becomes/causes
     "default"     #4a5568 → arrow   | generic/informational

═══ EXAMPLES ═══

EXAMPLE 1 — MULTI-ZONE SCENE (neutrophil migration):

User: "Create a figure showing neutrophil migration to inflamed tissue"

Analysis:
  Actors: neutrophils (multiple states), bacteria, macrophage
  Zones: blood vessel (top), endothelial membrane (middle), infected tissue (bottom)
  Processes: rolling, adhesion, crawling, transmigration, chemotaxis,
    phagocytosis, degranulation, superoxide production
  Figure type: A — Multi-zone scene
  Positions: neutrophils at different stages in both zones,
    bacteria scattered in tissue, macrophage in tissue

```objects
[
  {"action":"addText","text":"Neutrophil Migration to Inflamed Tissue","x":480,"y":35,"fontSize":18,"fontWeight":"600","fill":"#1a1a2e","fontFamily":"Inter"},

  {"action":"addZone","label":"Blood Vessel","x":40,"y":60,"width":880,"height":190,"fill":"#fce4ec","stroke":"#e8a0b0","labelPosition":"top-left","opacity":0.55},
  {"action":"addMembrane","x":40,"y":270,"width":880,"style":"endothelial"},
  {"action":"addZone","label":"Infected Tissue","x":40,"y":300,"width":880,"height":330,"fill":"#fff8e1","stroke":"#d4c48a","labelPosition":"top-left","opacity":0.5},

  {"action":"addIcon","icon":"neutrophil granulocyte 1","x":140,"y":155,"scale":55},
  {"action":"addText","text":"Rolling","x":140,"y":192,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":175,"y1":155,"x2":315,"y2":155,"stroke":"#4a5568","strokeWidth":2,"style":"default"},
  {"action":"addIcon","icon":"neutrophil granulocyte 2","x":350,"y":155,"scale":55},
  {"action":"addText","text":"Adhesion","x":350,"y":192,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":385,"y1":155,"x2":525,"y2":155,"stroke":"#4a5568","strokeWidth":2,"style":"default"},
  {"action":"addIcon","icon":"neutrophil granulocyte 3","x":560,"y":155,"scale":55},
  {"action":"addText","text":"Crawling","x":560,"y":192,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":595,"y1":170,"x2":730,"y2":225,"stroke":"#0077b6","strokeWidth":2,"style":"transport"},
  {"action":"addIcon","icon":"neutrophil granulocyte 4","x":760,"y":240,"scale":48},
  {"action":"addText","text":"Transmigration","x":760,"y":212,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"red blood cell","x":100,"y":100,"scale":22},
  {"action":"addIcon","icon":"red blood cell","x":260,"y":115,"scale":18},
  {"action":"addIcon","icon":"red blood cell","x":420,"y":100,"scale":20},
  {"action":"addIcon","icon":"red blood cell","x":610,"y":108,"scale":24},
  {"action":"addIcon","icon":"red blood cell","x":780,"y":100,"scale":18},
  {"action":"addIcon","icon":"red blood cell","x":870,"y":120,"scale":22},
  {"action":"addIcon","icon":"platelet","x":200,"y":210,"scale":16},
  {"action":"addIcon","icon":"platelet","x":470,"y":200,"scale":18},
  {"action":"addIcon","icon":"platelet","x":680,"y":110,"scale":15},

  {"action":"addConnector","x1":760,"y1":270,"x2":680,"y2":370,"stroke":"#0077b6","strokeWidth":2,"style":"transport"},
  {"action":"addIcon","icon":"neutrophil granulocyte 5","x":660,"y":395,"scale":50},
  {"action":"addText","text":"Chemotactic Migration","x":660,"y":430,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addConnector","x1":625,"y1":400,"x2":440,"y2":490,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation"},
  {"action":"addIcon","icon":"phagocytosis","x":400,"y":510,"scale":60},
  {"action":"addText","text":"Phagocytosis","x":400,"y":552,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addConnector","x1":625,"y1":410,"x2":280,"y2":395,"stroke":"#e76f51","strokeWidth":2,"style":"conversion"},
  {"action":"addIcon","icon":"neutrophil granulocyte 1","x":240,"y":395,"scale":48},
  {"action":"addText","text":"Degranulation","x":240,"y":430,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addConnector","x1":215,"y1":430,"x2":150,"y2":510,"stroke":"#e76f51","strokeWidth":2,"style":"conversion"},
  {"action":"addIcon","icon":"macrophage","x":130,"y":535,"scale":55},
  {"action":"addText","text":"Superoxide Production","x":130,"y":575,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"neutrophil granulocyte 2","x":500,"y":395,"scale":40},
  {"action":"addText","text":"NET Formation","x":500,"y":425,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"gut bacteria","x":800,"y":360,"scale":28},
  {"action":"addIcon","icon":"gut bacteria","x":845,"y":400,"scale":24},
  {"action":"addIcon","icon":"gut bacteria","x":810,"y":440,"scale":26},
  {"action":"addIcon","icon":"gut bacteria","x":860,"y":480,"scale":22},
  {"action":"addIcon","icon":"gut bacteria","x":775,"y":500,"scale":20},
  {"action":"addIcon","icon":"gut bacteria","x":830,"y":530,"scale":25},
  {"action":"addIcon","icon":"gut bacteria","x":880,"y":550,"scale":18},
  {"action":"addIcon","icon":"gut bacteria","x":760,"y":560,"scale":22},

  {"action":"addIcon","icon":"cytokine","x":580,"y":480,"scale":20},
  {"action":"addIcon","icon":"cytokine","x":320,"y":540,"scale":18},
  {"action":"addIcon","icon":"cytokine","x":700,"y":540,"scale":22},
  {"action":"addIcon","icon":"vesicle","x":190,"y":480,"scale":16},
  {"action":"addIcon","icon":"vesicle","x":460,"y":570,"scale":18},
  {"action":"addIcon","icon":"cytokine","x":100,"y":440,"scale":15}
]
```

EXAMPLE 2 — MULTI-ZONE APOPTOSIS (intrinsic pathway with cellular context):

User: "Draw the apoptosis pathway showing caspase cascade activation"

Analysis:
  Actors: Death receptor, Mitochondria, Cytochrome C, Apoptosome, Caspases, DNA Fragmentation
  Zones: Cell membrane at top, cytoplasm, nucleus at bottom — intrinsic + extrinsic paths
  Figure type: A — Multi-zone with biological compartments
  Rich illustration showing cellular context

```objects
[
  {"action":"addText","text":"Apoptosis — Intrinsic & Extrinsic Pathways","x":480,"y":35,"fontSize":18,"fontWeight":"600","fill":"#1a1a2e","fontFamily":"Inter"},

  {"action":"addZone","label":"Extracellular","x":40,"y":60,"width":880,"height":100,"fill":"#e8f5e9","stroke":"#a5d6a7","labelPosition":"top-left","opacity":0.45},
  {"action":"addMembrane","x":40,"y":170,"width":880,"style":"endothelial"},
  {"action":"addZone","label":"Cytoplasm","x":40,"y":200,"width":880,"height":280,"fill":"#fff8e1","stroke":"#ffe082","labelPosition":"top-left","opacity":0.4},
  {"action":"addZone","label":"Nucleus","x":280,"y":500,"width":400,"height":130,"fill":"#e3f2fd","stroke":"#90caf9","labelPosition":"top-left","opacity":0.5},

  {"action":"addIcon","icon":"cytokine","x":160,"y":115,"scale":40},
  {"action":"addText","text":"FAS Ligand","x":160,"y":145,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"cytokine","x":100,"y":100,"scale":22},
  {"action":"addIcon","icon":"cytokine","x":230,"y":108,"scale":18},

  {"action":"addIcon","icon":"receptor","x":160,"y":185,"scale":35},
  {"action":"addText","text":"Death Receptor","x":160,"y":210,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":160,"y1":140,"x2":160,"y2":170,"stroke":"#c1121f","strokeWidth":2,"style":"activation"},

  {"action":"addConnector","x1":190,"y1":215,"x2":310,"y2":290,"stroke":"#c1121f","strokeWidth":2,"style":"activation","label":"activates"},
  {"action":"addIcon","icon":"proteasome","x":340,"y":300,"scale":45},
  {"action":"addText","text":"Caspase-8","x":340,"y":335,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"mitochondria","x":680,"y":280,"scale":65},
  {"action":"addText","text":"Mitochondria","x":680,"y":325,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"cytokine","x":580,"y":350,"scale":30},
  {"action":"addText","text":"Cytochrome C","x":580,"y":378,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":645,"y1":300,"x2":605,"y2":345,"stroke":"#0077b6","strokeWidth":2,"style":"transport","label":"releases"},

  {"action":"addIcon","icon":"proteasome","x":460,"y":385,"scale":55},
  {"action":"addText","text":"Apoptosome","x":460,"y":425,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":565,"y1":365,"x2":500,"y2":385,"stroke":"#0077b6","strokeWidth":2,"style":"transport"},
  {"action":"addConnector","x1":365,"y1":330,"x2":430,"y2":385,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"activates"},

  {"action":"addIcon","icon":"proteasome","x":300,"y":440,"scale":40},
  {"action":"addText","text":"Caspase-3","x":300,"y":470,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addConnector","x1":430,"y1":410,"x2":330,"y2":440,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"activates"},

  {"action":"addConnector","x1":315,"y1":465,"x2":400,"y2":530,"stroke":"#e76f51","strokeWidth":2,"style":"conversion","label":"cleaves"},
  {"action":"addIcon","icon":"dna","x":420,"y":555,"scale":50},
  {"action":"addText","text":"DNA Fragmentation","x":420,"y":590,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"dna","x":530,"y":545,"scale":35},
  {"action":"addText","text":"Chromatin\nCondensation","x":530,"y":580,"fontSize":9,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"vesicle","x":780,"y":230,"scale":18},
  {"action":"addIcon","icon":"vesicle","x":830,"y":350,"scale":20},
  {"action":"addIcon","icon":"ribosome","x":130,"y":380,"scale":16},
  {"action":"addIcon","icon":"ribosome","x":200,"y":300,"scale":18},
  {"action":"addIcon","icon":"vesicle","x":870,"y":260,"scale":22},
  {"action":"addIcon","icon":"mitochondria","x":820,"y":430,"scale":30},
  {"action":"addIcon","icon":"cytokine","x":730,"y":400,"scale":18},
  {"action":"addIcon","icon":"cytokine","x":550,"y":250,"scale":16},
  {"action":"addIcon","icon":"ribosome","x":440,"y":245,"scale":15},
  {"action":"addIcon","icon":"vesicle","x":100,"y":450,"scale":20},
  {"action":"addIcon","icon":"cytokine","x":400,"y":110,"scale":20},
  {"action":"addIcon","icon":"cytokine","x":600,"y":95,"scale":16},
  {"action":"addIcon","icon":"antibody","x":750,"y":110,"scale":22}
]
```

EXAMPLE 3 — MULTI-ZONE (tumor microenvironment):

User: "Show tumor microenvironment with immune cell infiltration"

```objects
[
  {"action":"addText","text":"Tumor Microenvironment — Immune Infiltration","x":480,"y":35,"fontSize":18,"fontWeight":"600","fill":"#1a1a2e","fontFamily":"Inter"},

  {"action":"addZone","label":"Blood Vessel","x":40,"y":60,"width":880,"height":140,"fill":"#fce4ec","stroke":"#e8a0b0","labelPosition":"top-left","opacity":0.5},
  {"action":"addMembrane","x":40,"y":215,"width":880,"style":"endothelial"},
  {"action":"addZone","label":"Tumor Stroma","x":40,"y":245,"width":440,"height":385,"fill":"#fff3e0","stroke":"#e0c08a","labelPosition":"top-left","opacity":0.45},
  {"action":"addZone","label":"Tumor Core","x":480,"y":245,"width":440,"height":385,"fill":"#fce4ec","stroke":"#d4606a","labelPosition":"top-left","opacity":0.45},

  {"action":"addIcon","icon":"t cell","x":200,"y":120,"scale":45},
  {"action":"addText","text":"Circulating T Cell","x":200,"y":152,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"nk cell","x":500,"y":115,"scale":40},
  {"action":"addText","text":"NK Cell","x":500,"y":145,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"monocyte","x":750,"y":120,"scale":38},
  {"action":"addText","text":"Monocyte","x":750,"y":150,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"red blood cell","x":100,"y":100,"scale":20},
  {"action":"addIcon","icon":"red blood cell","x":340,"y":110,"scale":18},
  {"action":"addIcon","icon":"red blood cell","x":630,"y":95,"scale":22},
  {"action":"addIcon","icon":"red blood cell","x":870,"y":115,"scale":16},
  {"action":"addIcon","icon":"red blood cell","x":410,"y":150,"scale":20},
  {"action":"addIcon","icon":"platelet","x":290,"y":135,"scale":15},
  {"action":"addIcon","icon":"platelet","x":580,"y":140,"scale":18},

  {"action":"addConnector","x1":200,"y1":155,"x2":180,"y2":310,"stroke":"#0077b6","strokeWidth":2,"style":"transport","label":"infiltrate"},
  {"action":"addConnector","x1":500,"y1":148,"x2":520,"y2":310,"stroke":"#0077b6","strokeWidth":2,"style":"transport"},

  {"action":"addIcon","icon":"t cell","x":140,"y":340,"scale":50},
  {"action":"addText","text":"TIL (CD8+)","x":140,"y":375,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"t cell","x":280,"y":310,"scale":40},
  {"action":"addText","text":"T-reg","x":280,"y":340,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"macrophage","x":300,"y":460,"scale":55},
  {"action":"addText","text":"TAM (M2)","x":300,"y":500,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"dendritic cell","x":120,"y":520,"scale":48},
  {"action":"addText","text":"Dendritic Cell","x":120,"y":555,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"macrophage","x":380,"y":560,"scale":42},
  {"action":"addText","text":"M1 Macrophage","x":380,"y":592,"fontSize":10,"fontWeight":"500","fill":"#1a1a2e"},

  {"action":"addIcon","icon":"cancerous cell","x":600,"y":330,"scale":70},
  {"action":"addText","text":"Tumor Cell","x":600,"y":378,"fontSize":11,"fontWeight":"500","fill":"#1a1a2e"},
  {"action":"addIcon","icon":"cancerous cell","x":790,"y":400,"scale":60},
  {"action":"addIcon","icon":"cancerous cell","x":710,"y":510,"scale":55},
  {"action":"addIcon","icon":"cancerous cell","x":570,"y":490,"scale":50},
  {"action":"addIcon","icon":"cancerous cell","x":850,"y":530,"scale":48},

  {"action":"addConnector","x1":175,"y1":345,"x2":560,"y2":340,"stroke":"#c1121f","strokeWidth":2,"style":"inhibition","label":"PD-1 / PD-L1"},
  {"action":"addConnector","x1":335,"y1":460,"x2":565,"y2":370,"stroke":"#2d6a4f","strokeWidth":2,"style":"activation","label":"promotes growth"},
  {"action":"addConnector","x1":155,"y1":520,"x2":180,"y2":380,"stroke":"#6a0dad","strokeWidth":2,"style":"activation","label":"presents antigen"},
  {"action":"addConnector","x1":305,"y1":320,"x2":270,"y2":465,"stroke":"#c1121f","strokeWidth":2,"style":"inhibition","label":"suppresses"},

  {"action":"addIcon","icon":"collagen","x":200,"y":420,"scale":25},
  {"action":"addIcon","icon":"collagen","x":400,"y":390,"scale":22},
  {"action":"addIcon","icon":"collagen","x":100,"y":460,"scale":20},
  {"action":"addIcon","icon":"collagen","x":350,"y":530,"scale":18},
  {"action":"addIcon","icon":"cytokine","x":240,"y":390,"scale":20},
  {"action":"addIcon","icon":"cytokine","x":340,"y":540,"scale":18},
  {"action":"addIcon","icon":"cytokine","x":450,"y":430,"scale":16},
  {"action":"addIcon","icon":"cytokine","x":660,"y":440,"scale":20},
  {"action":"addIcon","icon":"cytokine","x":750,"y":560,"scale":18},
  {"action":"addIcon","icon":"cytokine","x":880,"y":420,"scale":16},
  {"action":"addIcon","icon":"vesicle","x":520,"y":560,"scale":18},
  {"action":"addIcon","icon":"vesicle","x":820,"y":310,"scale":20},
  {"action":"addIcon","icon":"antibody","x":430,"y":310,"scale":18},
  {"action":"addIcon","icon":"antibody","x":680,"y":590,"scale":16}
]
```

═══ CANVAS ═══
960 × 672 px. Origin (0,0) is top-left.
Safe area: x=[40..920], y=[55..635]. NEVER place anything outside.
Icons and text are center-anchored at (x, y).
Shapes and zones use top-left at (x, y).

═══ LAYOUT PRINCIPLES FOR SCIENTIFIC ILLUSTRATIONS ═══

1. ZONES FIRST: Always start by laying out addZone and addMembrane commands.
   These create the colored compartment backgrounds that define spatial context.
   Stack zones vertically for layered biology (vessel → membrane → tissue).
   Place zones side-by-side for different regions (stroma | tumor core).

2. FILL EVERY ZONE: Each zone must contain at MINIMUM 3-5 icons. If a zone
   has only 1-2 icons it looks empty and barren. Add biological context:
   - Blood vessel zones: scatter 4-6 red blood cells at scale 18-25
   - Tissue zones: scatter 4-8 bacteria/debris/cytokine icons at scale 18-28
   - Stroma zones: scatter collagen fibers, cytokines, ECM molecules
   - Any zone: add relevant small molecules, vesicles, or signaling particles
   A zone with lots of white space is a VISUAL FAILURE.

3. ICONS IN CONTEXT: Place icons INSIDE their biological zone.
   Use 2D positions — scatter icons naturally within zones, not in rigid rows.
   Multiple icons of the same type at different positions look natural.

4. ENVIRONMENTAL SCATTER: For EVERY zone, add 4-8 small background icons
   (scale 18-30) scattered at varied positions. These fill empty space:
   - Use slightly different scales (18, 20, 22, 25, 28) for natural variety
   - Space them irregularly — NOT in a grid or row
   - Overlap some with zone edges for a "spilling out" effect
   Examples per zone type:
     Blood vessel: "red blood cell" × 5-6, "platelet" × 2-3
     Infected tissue: "bacteria" or "gut bacteria" × 5-8
     Tumor stroma: "collagen" × 3-4, "cytokine" × 2-3
     Extracellular: "vesicle" × 3, "cytokine" × 2, "antibody" × 2
     Inside a cell: "vesicle" × 2-3, "ribosome" × 2, "mitochondria" × 1-2

5. ICON VARIETY: When showing stages of a process, use different icon variants.
   Neutrophils have 5 variants. Cells have multiple versions. Use them.
   Never use the same icon ID more than twice — vary the number suffix.

6. PROCESSES IN SPACE: Show processes happening at specific locations —
   phagocytosis in tissue, rolling along vessel wall, transmigration at membrane.
   Place them where they biologically occur, not just connected in a chain.

7. CONNECTIONS CROSS ZONES: Connectors should cross between zones when biology
   crosses compartments (e.g., transmigration from vessel to tissue).
   Use curved paths — all connectors render as smooth bezier curves.

8. MINIMUM OBJECT COUNT: A good scientific illustration has 25-45 objects total.
   If your figure has fewer than 20 objects, you MUST add more environmental
   scatter elements. Count: zones + membrane + icons + labels + connectors.
   Aim for at LEAST 30 objects for a rich, publication-quality figure.

9. PROCESS COMPLETENESS: Always include ALL biologically relevant processes.
   For immune cell migration: include rolling, adhesion, crawling, transmigration,
   chemotaxis, phagocytosis, degranulation, NET formation, superoxide production.
   Never leave out processes just because the zone is getting full.

10. DEPTH & LAYERING: Place some scatter icons partially overlapping with
    main actors (small molecules near cells, cytokines near receptors).
    This creates depth. Keep scatter icons at lower scale (18-28) so they
    don't visually compete with main actors (scale 45-65).

═══ LINEAR LAYOUT RULES (for Type B only) ═══
  SINGLE ROW (N ≤ 5): y=320, x positions evenly spaced from 100 to 860
    2: x=200, 760  |  3: x=100, 480, 860  |  4: x=100, 353, 607, 860
    5: x=100, 290, 480, 670, 860
  TWO ROWS (N = 6–10): Row 1 y=230, Row 2 y=480
    Step-down from last in row 1 to first in row 2.
    Both rows flow left→right.

═══ SIZES ═══
  Cells (main actors): 50-70   Small environmental: 18-30
  Organelles: 45-60   Proteins: 35-50   Molecules: 25-40
  Labels: fontSize 10-12   Title: fontSize 18, fontWeight "600"
  Zone labels: automatic (built into addZone)

═══ ABSOLUTE RULES ═══
1. ALWAYS write biological analysis BEFORE the ```objects block
2. DEFAULT to Type A (multi-zone) — only use Type B for pure chains
3. Every zone must contain at LEAST 3-5 icons (main actors + scatter)
4. Add 4-8 environmental scatter icons PER ZONE (small, 18-30px) — this is MANDATORY
5. Total object count must be at LEAST 25 for any multi-zone figure
6. Use DIFFERENT icon variants for the same cell type in different states
7. Every main actor icon MUST have a text label below it
8. Place addZone and addMembrane commands FIRST in the JSON array
9. Connections must use correct biological style per relationship
10. NEVER make a flat horizontal row when zones are appropriate
11. Fill the entire canvas — NO large empty white areas in any zone
12. Connector endpoints offset ~35px from icon centers
13. Title at y=35, centered at x=480
14. NEVER drop elements or processes the user described
15. Use the FULL canvas space within the safe area
16. Include ALL biologically relevant processes, not just the main chain
17. Scatter icons at VARIED scales (18-28) and IRREGULAR positions"""


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
