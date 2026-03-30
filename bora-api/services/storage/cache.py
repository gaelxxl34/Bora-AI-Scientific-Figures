# services/storage/cache.py — Redis get/set wrappers

from typing import Optional

# TODO: Initialize Redis client from REDIS_URL
# TODO: Provide get/set/delete with optional TTL

_redis = None


async def get_redis():
    """Get or create Redis connection."""
    global _redis
    # TODO: import redis.asyncio as redis
    # TODO: _redis = redis.from_url(REDIS_URL)
    return _redis


async def cache_get(key: str) -> Optional[str]:
    """Get a value from Redis cache."""
    # TODO: r = await get_redis()
    # TODO: return await r.get(key)
    _ = key
    return None


async def cache_set(key: str, value: str, ttl: int = 3600) -> None:
    """Set a value in Redis cache with TTL."""
    # TODO: r = await get_redis()
    # TODO: await r.set(key, value, ex=ttl)
    _ = key, value, ttl


async def cache_delete(key: str) -> None:
    """Delete a key from Redis cache."""
    # TODO: r = await get_redis()
    # TODO: await r.delete(key)
    _ = key
