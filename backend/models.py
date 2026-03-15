# models.py
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Date,
    Time,
    Boolean,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from database import Base
import enum


# ----------------- ROLES DE USUARIO -----------------
class RolUsuario(str, enum.Enum):
    admin = "admin"
    gestor = "gestor"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    rol = Column(Enum(RolUsuario), default=RolUsuario.gestor, nullable=False)

    pedidos = relationship("Pedido", back_populates="usuario")


# ----------------- CATÁLOGO DE PRODUCTOS -----------------
class Producto(Base):
    """
    Catálogo base de productos de la pastelería.
    No guarda precio fijo; el precio real se define en el pedido.
    """

    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)  # Ej: Torta, Cheesecake
    sabor = Column(String, nullable=False)  # Ej: Vainilla, Chocolate
    relleno = Column(String, nullable=False)  # Ej: Frutos rojos, Pistacho
    tamano = Column(String, nullable=False)  # Ej: 1 libra, 6 porciones

    pedidos = relationship("Pedido", back_populates="producto_rel")


# ----------------- CLIENTES -----------------
class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    direccion = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    pedidos = relationship("Pedido", back_populates="cliente_rel")


# ----------------- ESTADO DEL PEDIDO -----------------
class EstadoPedido(str, enum.Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"
    en_preparacion = "en_preparacion"
    entregado = "entregado"
    cancelado = "cancelado"


# ----------------- PEDIDOS -----------------
class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)

    # Datos del cliente
    cliente = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo_electronico = Column(String, nullable=False)

    # Datos del producto
    producto = Column(String, nullable=False)
    sabor = Column(String, nullable=False)
    relleno = Column(String, nullable=False)
    tamano = Column(String, nullable=False)

    # El precio real se define en cada pedido
    precio = Column(Float, nullable=False)

    # Entrega
    incluye_domicilio = Column(Boolean, default=False)
    fecha_entrega = Column(Date, nullable=False)
    hora_entrega = Column(Time, nullable=True)
    direccion_entrega = Column(String, nullable=True)
    tipo_entrega = Column(String, nullable=False)  # "sitio" o "domicilio"

    # Pago
    metodo_pago = Column(
        String, nullable=False
    )  # "abono", "pago_total", "transferencia"

    # Estado del pedido
    estado = Column(Enum(EstadoPedido), default=EstadoPedido.pendiente, nullable=False)

    # Relación opcional con cliente del catálogo
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    cliente_rel = relationship("Cliente", back_populates="pedidos")

    # Relación opcional con producto del catálogo
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=True)
    producto_rel = relationship("Producto", back_populates="pedidos")

    # Relación con usuario gestor
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    usuario = relationship("Usuario", back_populates="pedidos")
