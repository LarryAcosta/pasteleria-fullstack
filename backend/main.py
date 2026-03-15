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
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "https://pasteleria-fullstack-7ljjsuuxf-larry-acostas-projects.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def read_root():
    return {
        "message": "API Pastelería funcionando",
        "env": settings.app_env,
    }


app.include_router(auth.router)
app.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
app.include_router(productos.router, prefix="/productos", tags=["Productos"])
app.include_router(pedidos.router)
