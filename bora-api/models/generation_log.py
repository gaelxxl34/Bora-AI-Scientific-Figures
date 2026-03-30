# models/generation_log.py — AI call logs (tokens, latency, user rating)

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, ARRAY
from sqlalchemy.sql import func
from models.database import Base


class GenerationLog(Base):
    __tablename__ = "generation_logs"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("profiles.id"), nullable=False, index=True)
    figure_id = Column(String, ForeignKey("figures.id"), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    icon_ids_used = Column(ARRAY(String), default=[])
    user_rating = Column(Integer, nullable=True)  # 1–5
    created_at = Column(DateTime(timezone=True), server_default=func.now())
