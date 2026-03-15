# schemas.py
from datetime import date, time
from typing import Optional

from pydantic import BaseModel, EmailStr

from models import EstadoPedido, RolUsuario

# =======================
# USUARIOS / AUTENTICACIÓN
# =======================


class UsuarioBase(BaseModel):
    id: int
    nombre: str
    username: str
    correo: EmailStr
    is_active: bool
    rol: RolUsuario

    class Config:
        orm_mode = True


class UsuarioCreate(BaseModel):
    nombre: str
    username: str
    correo: EmailStr
    password: str
    rol: RolUsuario = RolUsuario.gestor


class UsuarioLogin(BaseModel):
    username: str
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    username: str
    correo: EmailStr
    rol: RolUsuario
    is_active: bool

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    id: Optional[int] = None
    rol: Optional[RolUsuario] = None


# ============
# PRODUCTOS (catálogo)
# ============


class ProductoBase(BaseModel):
    nombre: str
    sabor: str
    relleno: str
    tamano: str


class ProductoCreate(ProductoBase):
    pass


class ProductoResponse(ProductoBase):
    id: int

    class Config:
        orm_mode = True


# ============
# CLIENTES
# ============


class ClienteBase(BaseModel):
    nombre: str
    telefono: str
    correo: EmailStr
    direccion: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteResponse(ClienteBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True


class ClienteSimple(BaseModel):
    id: int
    nombre: str
    telefono: str
    correo: EmailStr

    class Config:
        orm_mode = True


class ProductoSimple(BaseModel):
    id: int
    nombre: str
    sabor: str
    relleno: str
    tamano: str

    class Config:
        orm_mode = True


# ============
# PEDIDOS
# ============


class PedidoBase(BaseModel):
    # Datos del cliente
    cliente: str
    telefono: str
    correo_electronico: EmailStr
    cliente_id: Optional[int] = None

    # Producto
    producto: str
    producto_id: Optional[int] = None
    sabor: str
    relleno: str
    tamano: str
    precio: float

    # Entrega
    incluye_domicilio: bool
    fecha_entrega: date
    hora_entrega: Optional[time] = None
    direccion_entrega: Optional[str] = None
    tipo_entrega: str  # "sitio" o "domicilio"

    # Pago
    metodo_pago: str  # "abono", "pago_total", "transferencia"


class PedidoCreate(PedidoBase):
    pass


class PedidoResponse(PedidoBase):
    id: int
    estado: EstadoPedido
    usuario_id: int
    cliente_info: Optional[ClienteSimple] = None
    producto_info: Optional[ProductoSimple] = None

    class Config:
        orm_mode = True


class PedidoEstadoUpdate(BaseModel):
    estado: EstadoPedido
