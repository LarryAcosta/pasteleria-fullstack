# routers/pedidos.py
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from dependencies import require_admin
from models import Cliente, EstadoPedido, Pedido, Producto, Usuario
from schemas import PedidoCreate, PedidoEstadoUpdate, PedidoResponse
from security import get_current_user

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def _pedido_to_dict(pedido: Pedido) -> dict:
    return {
        "id": pedido.id,
        "cliente": pedido.cliente,
        "telefono": pedido.telefono,
        "correo_electronico": pedido.correo_electronico,
        "cliente_id": pedido.cliente_id,
        "producto": pedido.producto,
        "producto_id": pedido.producto_id,
        "sabor": pedido.sabor,
        "relleno": pedido.relleno,
        "tamano": pedido.tamano,
        "precio": pedido.precio,
        "incluye_domicilio": pedido.incluye_domicilio,
        "fecha_entrega": pedido.fecha_entrega,
        "hora_entrega": pedido.hora_entrega,
        "direccion_entrega": pedido.direccion_entrega,
        "tipo_entrega": pedido.tipo_entrega,
        "metodo_pago": pedido.metodo_pago,
        "estado": pedido.estado,
        "usuario_id": pedido.usuario_id,
        "cliente_info": (
            {
                "id": pedido.cliente_rel.id,
                "nombre": pedido.cliente_rel.nombre,
                "telefono": pedido.cliente_rel.telefono,
                "correo": pedido.cliente_rel.correo,
            }
            if pedido.cliente_rel
            else None
        ),
        "producto_info": (
            {
                "id": pedido.producto_rel.id,
                "nombre": pedido.producto_rel.nombre,
                "sabor": pedido.producto_rel.sabor,
                "relleno": pedido.producto_rel.relleno,
                "tamano": pedido.producto_rel.tamano,
            }
            if pedido.producto_rel
            else None
        ),
    }


def _base_query(db: Session):
    return db.query(Pedido).options(
        joinedload(Pedido.cliente_rel),
        joinedload(Pedido.producto_rel),
    )


# ------------------ CREAR PEDIDO ------------------
@router.post("/", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    pedido_in: PedidoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
):
    cliente = None
    producto = None

    # Validar cliente_id si llega
    if pedido_in.cliente_id is not None:
        cliente = db.query(Cliente).filter(Cliente.id == pedido_in.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El cliente_id enviado no existe",
            )

    # Validar producto_id si llega
    if pedido_in.producto_id is not None:
        producto = (
            db.query(Producto).filter(Producto.id == pedido_in.producto_id).first()
        )
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El producto_id enviado no existe",
            )

    # Si llega producto_id, tomamos los datos del catálogo
    nombre_producto = producto.nombre if producto else pedido_in.producto
    sabor_producto = producto.sabor if producto else pedido_in.sabor
    relleno_producto = producto.relleno if producto else pedido_in.relleno
    tamano_producto = producto.tamano if producto else pedido_in.tamano

    nuevo_pedido = Pedido(
        # Datos del cliente
        cliente=pedido_in.cliente,
        telefono=pedido_in.telefono,
        correo_electronico=pedido_in.correo_electronico,
        cliente_id=pedido_in.cliente_id,
        # Producto
        producto=nombre_producto,
        producto_id=pedido_in.producto_id,
        sabor=sabor_producto,
        relleno=relleno_producto,
        tamano=tamano_producto,
        precio=pedido_in.precio,
        # Entrega
        incluye_domicilio=pedido_in.incluye_domicilio,
        fecha_entrega=pedido_in.fecha_entrega,
        hora_entrega=pedido_in.hora_entrega,
        direccion_entrega=pedido_in.direccion_entrega,
        tipo_entrega=pedido_in.tipo_entrega,
        # Pago
        metodo_pago=pedido_in.metodo_pago,
        # Estado inicial
        estado=EstadoPedido.pendiente,
        # Usuario gestor
        usuario_id=usuario.id,
    )

    db.add(nuevo_pedido)
    db.commit()
    db.refresh(nuevo_pedido)

    pedido_db = _base_query(db).filter(Pedido.id == nuevo_pedido.id).first()
    return _pedido_to_dict(pedido_db)


# ------------------ LISTAR TODOS LOS PEDIDOS ------------------
@router.get(
    "/",
    response_model=List[PedidoResponse],
    dependencies=[Depends(require_admin)],
)
def listar_pedidos(db: Session = Depends(get_db)):
    pedidos = _base_query(db).all()
    return [_pedido_to_dict(pedido) for pedido in pedidos]


# ------------------ LISTAR MIS PEDIDOS ------------------
@router.get("/mis-pedidos", response_model=List[PedidoResponse])
def listar_mis_pedidos(
    estado: Optional[EstadoPedido] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Security(get_current_user),
):
    query = _base_query(db)

    rol_usuario = (
        usuario.rol.value if hasattr(usuario.rol, "value") else str(usuario.rol)
    )
    if rol_usuario != "admin":
        query = query.filter(Pedido.usuario_id == usuario.id)

    if estado:
        query = query.filter(Pedido.estado == estado)

    pedidos = query.all()
    return [_pedido_to_dict(pedido) for pedido in pedidos]


# ------------------ FILTRAR POR ESTADO ------------------
@router.get("/estado/{estado}", response_model=List[PedidoResponse])
def pedidos_por_estado(estado: EstadoPedido, db: Session = Depends(get_db)):
    pedidos = _base_query(db).filter(Pedido.estado == estado).all()
    return [_pedido_to_dict(pedido) for pedido in pedidos]


# ------------------ FILTRAR POR FECHA ------------------
@router.get("/fecha/{fecha}", response_model=List[PedidoResponse])
def pedidos_por_fecha(fecha: date, db: Session = Depends(get_db)):
    pedidos = _base_query(db).filter(Pedido.fecha_entrega == fecha).all()
    return [_pedido_to_dict(pedido) for pedido in pedidos]


# ------------------ CAMBIAR ESTADO ------------------
@router.put(
    "/{pedido_id}/estado",
    response_model=PedidoResponse,
    dependencies=[Depends(require_admin)],
)
def cambiar_estado_pedido(
    pedido_id: int,
    estado_in: PedidoEstadoUpdate,
    db: Session = Depends(get_db),
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pedido no encontrado",
        )

    pedido.estado = estado_in.estado
    db.commit()
    db.refresh(pedido)

    pedido_db = _base_query(db).filter(Pedido.id == pedido.id).first()
    return _pedido_to_dict(pedido_db)
