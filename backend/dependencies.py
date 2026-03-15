# dependencies.py
from typing import Generator

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import SessionLocal
from models import RolUsuario, Usuario
from security import get_current_user


# Sesión de base de datos
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Verificar que el usuario sea ADMIN
def require_admin(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    if current_user.rol != RolUsuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador",
        )
    return current_user
