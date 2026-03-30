# services/storage/r2_client.py — Cloudflare R2 upload/download
# Uses boto3-compatible S3 API for R2 operations

# TODO: Initialize boto3 S3 client with R2 credentials
# TODO: Upload SVG files, export files
# TODO: Generate signed download URLs


async def upload_file(key: str, data: bytes, content_type: str = "image/svg+xml") -> str:
    """
    Upload a file to Cloudflare R2.
    Returns the public URL.
    """
    # TODO: client.put_object(Bucket=BUCKET, Key=key, Body=data, ContentType=content_type)
    # TODO: Return public CDN URL
    _ = key, data, content_type
    return f"https://icons.bora.ai/{key}"


async def get_file(key: str) -> bytes:
    """Download a file from R2."""
    # TODO: response = client.get_object(Bucket=BUCKET, Key=key)
    # TODO: return response['Body'].read()
    _ = key
    return b""


async def generate_signed_url(key: str, expires_in: int = 3600) -> str:
    """Generate a pre-signed download URL for a file in R2."""
    # TODO: return client.generate_presigned_url('get_object', Params={...}, ExpiresIn=expires_in)
    _ = key, expires_in
    return f"https://icons.bora.ai/{key}?signed=placeholder"
