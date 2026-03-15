from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database import Base, engine
from routers import auth, clientes, pedidos, productos

settings = get_settings()

app = FastAPI(title=settings.app_name, debug=settings.debug)

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return {
        "message": "API Pastelería funcionando",
        "env": settings.app_env,
        "cors_mode": "wildcard",
    }


app.include_router(auth.router)
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(productos.router, prefix="/productos", tags=["Productos"])
app.include_router(pedidos.router)
