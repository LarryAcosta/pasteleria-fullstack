# crud.py
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from sqlalchemy import asc, desc


import models
import schemas


def crear_pedido(db: Session, pedido_in: schemas.PedidoCreate) -> models.Pedido:
    pedido = models.Pedido(**pedido_in.dict())
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return pedido


def obtener_pedidos(db: Session) -> List[models.Pedido]:
    return db.query(models.Pedido).all()


def obtener_pedido(db: Session, pedido_id: int) -> Optional[models.Pedido]:
    return db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()


def obtener_pedidos_por_fecha(db: Session, fecha_entrega: date) -> List[models.Pedido]:
    return (
        db.query(models.Pedido)
        .filter(models.Pedido.fecha_entrega == fecha_entrega)
        .all()
    )


def obtener_pedidos_por_estado(
    db: Session, estado: models.EstadoPedido
) -> List[models.Pedido]:
    return db.query(models.Pedido).filter(models.Pedido.estado == estado).all()


def obtener_pedidos_ordenados(db: Session, orden: str = "asc") -> List[models.Pedido]:
    query = db.query(models.Pedido)

    if orden == "desc":
        query = query.order_by(desc(models.Pedido.fecha_entrega))
    else:
        query = query.order_by(asc(models.Pedido.fecha_entrega))

    return query.all()


def actualizar_pedido(
    db: Session, pedido_id: int, pedido_in: schemas.PedidoUpdate
) -> Optional[models.Pedido]:
    pedido = obtener_pedido(db, pedido_id)
    if not pedido:
        return None

    data = pedido_in.dict(exclude_unset=True)
    for campo, valor in data.items():
        setattr(pedido, campo, valor)

    db.commit()
    db.refresh(pedido)
    return pedido


def eliminar_pedido(db: Session, pedido_id: int) -> bool:
    pedido = obtener_pedido(db, pedido_id)
    if not pedido:
        return False

    db.delete(pedido)
    db.commit()
    return True
