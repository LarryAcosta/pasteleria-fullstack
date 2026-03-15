# routers/productos.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Producto, Pedido
from schemas import ProductoCreate, ProductoResponse
from dependencies import require_admin

router = APIRouter()


@router.post(
    "/",
    response_model=ProductoResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def crear_producto(producto_in: ProductoCreate, db: Session = Depends(get_db)):
    nuevo_producto = Producto(
        nombre=producto_in.nombre,
        sabor=producto_in.sabor,
        relleno=producto_in.relleno,
        tamano=producto_in.tamano,
    )

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return nuevo_producto


@router.get("/", response_model=List[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()


@router.put(
    "/{producto_id}",
    response_model=ProductoResponse,
    dependencies=[Depends(require_admin)],
)
def editar_producto(
    producto_id: int, producto_in: ProductoCreate, db: Session = Depends(get_db)
):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    producto.nombre = producto_in.nombre
    producto.sabor = producto_in.sabor
    producto.relleno = producto_in.relleno
    producto.tamano = producto_in.tamano

    db.commit()
    db.refresh(producto)

    return producto


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    pedido_asociado = db.query(Pedido).filter(Pedido.producto_id == producto_id).first()

    if pedido_asociado:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el producto porque tiene pedidos asociados",
        )

    db.delete(producto)
    db.commit()

    return None
