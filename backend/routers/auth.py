# routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Usuario
from schemas import (
    UsuarioCreate,
    UsuarioResponse,
    UsuarioLogin,
    TokenResponse,
)
from security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


# -------- REGISTRO --------
@router.post(
    "/register", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED
)
def register_user(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    # Validar username único
    if db.query(Usuario).filter(Usuario.username == usuario_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe",
        )

    # Validar correo único
    if db.query(Usuario).filter(Usuario.correo == usuario_in.correo).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado",
        )

    hashed = get_password_hash(usuario_in.password)

    nuevo_usuario = Usuario(
        nombre=usuario_in.nombre,
        username=usuario_in.username,
        correo=usuario_in.correo,
        hashed_password=hashed,
        is_active=True,
        rol=usuario_in.rol,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


# -------- LOGIN (JSON) --------
@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(Usuario.username == form_data.username).first()

    if not usuario or not verify_password(form_data.password, usuario.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    access_token = create_access_token(
        data={"sub": usuario.username, "id": usuario.id, "rol": usuario.rol.value}
    )

    return TokenResponse(access_token=access_token)
