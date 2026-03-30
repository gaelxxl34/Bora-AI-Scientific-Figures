# scripts/seed_db.py — Dev database seeding
# Populate database with sample data for development

"""
Seeds:
- pgvector extension
- All tables
- 5 sample icons with real embeddings (for dev without full ingestion)
"""

import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models.database import SessionLocal, init_db
from models.icon import Icon
from services.icons.embedder import embed_batch
from services.icons.ingestor import stable_id

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Sample icons for dev — tiny inline SVGs
SAMPLE_ICONS = [
    {
        "name": "cell",
        "tags": ["cell", "biology", "membrane"],
        "category": "Cell Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="45" ry="35" fill="none" stroke="#333" stroke-width="2"/><ellipse cx="50" cy="50" rx="12" ry="10" fill="#6b7280"/></svg>',
    },
    {
        "name": "receptor",
        "tags": ["receptor", "membrane", "protein", "signaling"],
        "category": "Cell Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 60 100"><rect x="20" y="0" width="20" height="40" rx="4" fill="#3b82f6"/><rect x="15" y="40" width="30" height="3" fill="#333"/><rect x="22" y="43" width="16" height="50" rx="2" fill="#60a5fa"/><circle cx="30" cy="15" r="8" fill="none" stroke="#1d4ed8" stroke-width="2"/></svg>',
    },
    {
        "name": "DNA double helix",
        "tags": ["dna", "double helix", "genetics", "nucleic acid"],
        "category": "Genetics",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 60 120"><path d="M15 10 Q30 30 45 50 Q30 70 15 90" fill="none" stroke="#ef4444" stroke-width="2.5"/><path d="M45 10 Q30 30 15 50 Q30 70 45 90" fill="none" stroke="#3b82f6" stroke-width="2.5"/><line x1="20" y1="30" x2="40" y2="30" stroke="#9ca3af" stroke-width="1.5"/><line x1="20" y1="50" x2="40" y2="50" stroke="#9ca3af" stroke-width="1.5"/><line x1="20" y1="70" x2="40" y2="70" stroke="#9ca3af" stroke-width="1.5"/></svg>',
    },
    {
        "name": "mitochondria",
        "tags": ["mitochondria", "organelle", "energy", "atp", "cell"],
        "category": "Cell Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 120 60"><ellipse cx="60" cy="30" rx="55" ry="25" fill="#fbbf24" stroke="#92400e" stroke-width="2"/><path d="M20 30 Q35 15 50 30 Q65 45 80 30 Q95 15 100 30" fill="none" stroke="#92400e" stroke-width="1.5"/></svg>',
    },
    {
        "name": "antibody",
        "tags": ["antibody", "immunoglobulin", "immune", "y-shape"],
        "category": "Immunology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 80 100"><path d="M40 100 L40 55 L15 25 M40 55 L65 25" fill="none" stroke="#7c3aed" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="20" r="8" fill="#a78bfa"/><circle cx="65" cy="20" r="8" fill="#a78bfa"/></svg>',
    },
    {
        "name": "protein",
        "tags": ["protein", "enzyme", "molecular", "structure"],
        "category": "Molecular Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 80 80"><path d="M20 60 Q10 40 25 25 Q40 10 55 20 Q70 30 65 50 Q60 70 40 65 Q25 60 20 60Z" fill="#10b981" stroke="#065f46" stroke-width="2"/></svg>',
    },
    {
        "name": "nucleus",
        "tags": ["nucleus", "cell", "nuclear envelope", "chromatin"],
        "category": "Cell Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#dbeafe" stroke="#1e40af" stroke-width="2"/><circle cx="50" cy="50" r="12" fill="#1e40af" opacity="0.5"/><circle cx="35" cy="40" r="3" fill="#6b7280"/><circle cx="60" cy="55" r="2" fill="#6b7280"/></svg>',
    },
    {
        "name": "ribosome",
        "tags": ["ribosome", "translation", "protein synthesis", "rna"],
        "category": "Molecular Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 80 60"><ellipse cx="40" cy="35" rx="30" ry="18" fill="#f59e0b" stroke="#92400e" stroke-width="1.5"/><ellipse cx="40" cy="22" rx="22" ry="13" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/></svg>',
    },
    {
        "name": "virus",
        "tags": ["virus", "pathogen", "capsid", "microbiology"],
        "category": "Microbiology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="25" fill="#fca5a5" stroke="#dc2626" stroke-width="2"/><line x1="50" y1="15" x2="50" y2="5" stroke="#dc2626" stroke-width="2"/><circle cx="50" cy="3" r="3" fill="#dc2626"/><line x1="50" y1="85" x2="50" y2="95" stroke="#dc2626" stroke-width="2"/><circle cx="50" cy="97" r="3" fill="#dc2626"/><line x1="15" y1="50" x2="5" y2="50" stroke="#dc2626" stroke-width="2"/><circle cx="3" cy="50" r="3" fill="#dc2626"/><line x1="85" y1="50" x2="95" y2="50" stroke="#dc2626" stroke-width="2"/><circle cx="97" cy="50" r="3" fill="#dc2626"/></svg>',
    },
    {
        "name": "bacteria",
        "tags": ["bacteria", "prokaryote", "rod", "microbiology"],
        "category": "Microbiology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 120 50"><rect x="15" y="10" width="90" height="30" rx="15" fill="#86efac" stroke="#166534" stroke-width="2"/><line x1="30" y1="40" x2="25" y2="55" stroke="#166534" stroke-width="1.5"/><line x1="60" y1="40" x2="60" y2="55" stroke="#166534" stroke-width="1.5"/><line x1="90" y1="40" x2="95" y2="55" stroke="#166534" stroke-width="1.5"/></svg>',
    },
    {
        "name": "neuron",
        "tags": ["neuron", "nerve cell", "axon", "dendrite", "synapse"],
        "category": "Neuroscience",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 150 80"><circle cx="30" cy="40" r="15" fill="#c4b5fd" stroke="#5b21b6" stroke-width="2"/><line x1="45" y1="40" x2="120" y2="40" stroke="#5b21b6" stroke-width="2"/><path d="M120 40 L135 30 M120 40 L135 40 M120 40 L135 50" stroke="#5b21b6" stroke-width="2"/><path d="M15 40 L5 30 M15 40 L3 40 M15 40 L5 50" stroke="#5b21b6" stroke-width="1.5"/></svg>',
    },
    {
        "name": "membrane",
        "tags": ["membrane", "lipid bilayer", "phospholipid", "cell"],
        "category": "Cell Biology",
        "license": "CC0",
        "svg_content": '<svg viewBox="0 0 120 60"><circle cx="15" cy="15" r="5" fill="#60a5fa"/><line x1="15" y1="20" x2="15" y2="40" stroke="#60a5fa" stroke-width="1.5"/><circle cx="30" cy="15" r="5" fill="#60a5fa"/><line x1="30" y1="20" x2="30" y2="40" stroke="#60a5fa" stroke-width="1.5"/><circle cx="45" cy="15" r="5" fill="#60a5fa"/><line x1="45" y1="20" x2="45" y2="40" stroke="#60a5fa" stroke-width="1.5"/><circle cx="60" cy="45" r="5" fill="#f97316"/><line x1="60" y1="40" x2="60" y2="20" stroke="#f97316" stroke-width="1.5"/><circle cx="75" cy="45" r="5" fill="#f97316"/><line x1="75" y1="40" x2="75" y2="20" stroke="#f97316" stroke-width="1.5"/><circle cx="90" cy="45" r="5" fill="#f97316"/><line x1="90" y1="40" x2="90" y2="20" stroke="#f97316" stroke-width="1.5"/></svg>',
    },
]


async def main():
    await init_db()
    logger.info("Database initialised (tables + pgvector extension).")

    descriptions = [
        f"{ic['name']} {' '.join(ic['tags'])} {ic['category']} scientific illustration icon"
        for ic in SAMPLE_ICONS
    ]
    logger.info("Embedding %d sample icons …", len(SAMPLE_ICONS))
    embeddings = embed_batch(descriptions)

    async with SessionLocal() as session:
        from sqlalchemy import select
        existing = set()
        result = await session.execute(select(Icon.id))
        existing = {r[0] for r in result.all()}

        count = 0
        for ic, emb in zip(SAMPLE_ICONS, embeddings):
            iid = stable_id("seed", ic["name"])
            if iid in existing:
                continue
            icon = Icon(
                id=iid,
                name=ic["name"],
                description=f"{ic['name']} {' '.join(ic['tags'])}",
                tags=ic["tags"],
                category=ic["category"],
                license=ic["license"],
                source="seed",
                r2_key=f"seed/{ic['name']}.svg",
                svg_content=ic["svg_content"],
                embedding=emb,
            )
            session.add(icon)
            count += 1

        await session.commit()
        logger.info("Seeded %d sample icons.", count)


if __name__ == "__main__":
    asyncio.run(main())
