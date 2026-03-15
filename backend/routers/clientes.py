# routers/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from database import get_db
from models import Cliente, Pedido
from schemas import ClienteCreate, ClienteResponse

router = APIRouter()


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(cliente_in: ClienteCreate, db: Session = Depends(get_db)):
    nuevo_cliente = Cliente(
        nombre=cliente_in.nombre,
        telefono=cliente_in.telefono,
        correo=cliente_in.correo,
        direccion=cliente_in.direccion,
    )

    try:
        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)
        return nuevo_cliente
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya existe un cliente con ese correo",
        )


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()


@router.put("/{cliente_id}", response_model=ClienteResponse)
def editar_cliente(
    cliente_id: int, cliente_in: ClienteCreate, db: Session = Depends(get_db)
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente.nombre = cliente_in.nombre
    cliente.telefono = cliente_in.telefono
    cliente.correo = cliente_in.correo
    cliente.direccion = cliente_in.direccion

    try:
        db.commit()
        db.refresh(cliente)
        return cliente
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ya existe otro cliente con ese correo",
        )


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    pedido_asociado = db.query(Pedido).filter(Pedido.cliente_id == cliente_id).first()

    if pedido_asociado:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el cliente porque tiene pedidos asociados",
        )

    db.delete(cliente)
    db.commit()

    return None
