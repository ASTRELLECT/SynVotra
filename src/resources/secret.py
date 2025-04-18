import secrets
import os

SECRET_KEY = os.getenv("SECRET_KEY", "yZosK3ELIrMRb2W3OjSesWGKg5V5-0ENqOZUIGAV4Dc")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)

SYSTEM_API_KEY = os.getenv("SYSTEM_API_KEY", "")

def generate_secret_key():
    return secrets.token_hex(32)
