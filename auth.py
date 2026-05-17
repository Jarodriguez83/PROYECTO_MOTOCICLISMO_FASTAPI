"""
auth.py — Utilidades de autenticación para GP Colombia
Maneja: hashing de contraseñas, generación/validación de JWT, dependencias FastAPI
"""

import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Cookie, HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

# ─────────────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────────────
SECRET_KEY   = os.getenv("SECRET_KEY", "gp_colombia_secret_key_2026_cambiar_en_produccion")
ALGORITHM    = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 horas

# Credenciales del administrador (fijas, configurables por env)
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "GPColombia2026!")

# ─────────────────────────────────────────────
# HASHING
# ─────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hashea una contraseña en texto plano."""
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return pwd_context.verify(plain, hashed)

# ─────────────────────────────────────────────
# JWT
# ─────────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Genera un JWT firmado con los datos provistos."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decodifica y valida un JWT. Lanza JWTError si es inválido."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

# ─────────────────────────────────────────────
# DEPENDENCIAS FASTAPI (extraen token de cookie)
# ─────────────────────────────────────────────
def get_current_user(access_token: Optional[str] = Cookie(default=None)):
    """
    Dependencia para rutas de usuario autenticado.
    Lee la cookie 'access_token' y valida el JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_303_SEE_OTHER,
        headers={"Location": "/login"},
        detail="No autenticado"
    )
    if not access_token:
        raise credentials_exception
    try:
        payload = decode_token(access_token)
        user_id: int = payload.get("sub")
        role: str    = payload.get("role")
        if user_id is None or role != "user":
            raise credentials_exception
        return {"user_id": int(user_id), "role": role}
    except JWTError:
        raise credentials_exception

def get_current_admin(admin_token: Optional[str] = Cookie(default=None)):
    """
    Dependencia para rutas administrativas.
    Lee la cookie 'admin_token' y valida el JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_303_SEE_OTHER,
        headers={"Location": "/admin/login"},
        detail="Acceso denegado"
    )
    if not admin_token:
        raise credentials_exception
    try:
        payload = decode_token(admin_token)
        role: str = payload.get("role")
        if role != "admin":
            raise credentials_exception
        return {"username": payload.get("sub"), "role": role}
    except JWTError:
        raise credentials_exception

# ─────────────────────────────────────────────
# VALIDACIÓN ADMIN (credenciales fijas)
# ─────────────────────────────────────────────
def verify_admin_credentials(username: str, password: str) -> bool:
    """Valida las credenciales del administrador."""
    return username == ADMIN_USERNAME and password == ADMIN_PASSWORD