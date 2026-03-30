# services/icons/embedder.py — sentence-transformers embedding pipeline
# Generates 384d vectors from text descriptions using all-MiniLM-L6-v2

import logging
from typing import List, Optional
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_model: Optional[SentenceTransformer] = None
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


def get_model() -> SentenceTransformer:
    """Lazy-load the sentence-transformers model (downloads on first use)."""
    global _model
    if _model is None:
        logger.info("Loading embedding model %s …", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)
        logger.info("Embedding model loaded.")
    return _model


def embed_text(text: str) -> List[float]:
    """Embed a single text string into a 384-dimensional vector."""
    model = get_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def embed_batch(texts: List[str], batch_size: int = 256) -> List[List[float]]:
    """Embed multiple texts in a single batch for efficiency."""
    model = get_model()
    return model.encode(texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=True).tolist()
