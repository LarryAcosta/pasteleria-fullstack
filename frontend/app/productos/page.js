"use client";

import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProductosPage() {
    const [productos, setProductos] = useState([]);
    const [mensaje, setMensaje] = useState("");

    const [nombre, setNombre] = useState("");
    const [sabor, setSabor] = useState("");
    const [relleno, setRelleno] = useState("");
    const [tamano, setTamano] = useState("");

    const [editandoId, setEditandoId] = useState(null);

    function getToken() {
        return localStorage.getItem("token");
    }

    async function cargarProductos() {
        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/productos/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error al cargar productos.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            const data = await resp.json();
            setProductos(data);
            setMensaje(`Productos cargados: ${data.length}`);
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    async function crearProducto(e) {
        e.preventDefault();

        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        if (!nombre || !sabor || !relleno || !tamano) {
            setMensaje("Nombre, sabor, relleno y tamaño son obligatorios.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/productos/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre,
                    sabor,
                    relleno,
                    tamano,
                }),
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error creando producto.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            limpiarFormulario();
            setMensaje("Producto creado correctamente.");
            await cargarProductos();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    async function actualizarProducto(e) {
        e.preventDefault();

        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        if (!editandoId) {
            setMensaje("No hay producto seleccionado para editar.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/productos/${editandoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre,
                    sabor,
                    relleno,
                    tamano,
                }),
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error actualizando producto.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            limpiarFormulario();
            setEditandoId(null);
            setMensaje("Producto actualizado correctamente.");
            await cargarProductos();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    async function eliminarProducto(id) {
        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        const confirmado = confirm("¿Seguro que deseas eliminar este producto?");
        if (!confirmado) return;

        try {
            const resp = await fetch(`${BASE_URL}/productos/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error eliminando producto.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            if (editandoId === id) {
                limpiarFormulario();
                setEditandoId(null);
            }

            setMensaje("Producto eliminado correctamente.");
            await cargarProductos();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    function prepararEdicion(producto) {
        setEditandoId(producto.id);
        setNombre(producto.nombre || "");
        setSabor(producto.sabor || "");
        setRelleno(producto.relleno || "");
        setTamano(producto.tamano || "");
        setMensaje(`Editando producto ID ${producto.id}`);
    }

    function limpiarFormulario() {
        setNombre("");
        setSabor("");
        setRelleno("");
        setTamano("");
    }

    function cancelarEdicion() {
        setEditandoId(null);
        limpiarFormulario();
        setMensaje("Edición cancelada.");
    }

    useEffect(() => {
        cargarProductos();
    }, []);

    return (
        <main>
            <h2>Productos</h2>

            <form
                onSubmit={editandoId ? actualizarProducto : crearProducto}
                style={{
                    marginBottom: "20px",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                }}
            >
                <input
                    placeholder="Nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    style={{ padding: "8px", minWidth: "180px" }}
                />

                <input
                    placeholder="Sabor"
                    value={sabor}
                    onChange={(e) => setSabor(e.target.value)}
                    style={{ padding: "8px", minWidth: "180px" }}
                />

                <input
                    placeholder="Relleno"
                    value={relleno}
                    onChange={(e) => setRelleno(e.target.value)}
                    style={{ padding: "8px", minWidth: "180px" }}
                />

                <input
                    placeholder="Tamaño"
                    value={tamano}
                    onChange={(e) => setTamano(e.target.value)}
                    style={{ padding: "8px", minWidth: "180px" }}
                />

                <button type="submit" style={btnPrimary}>
                    {editandoId ? "Actualizar producto" : "Crear producto"}
                </button>

                {editandoId && (
                    <button type="button" onClick={cancelarEdicion} style={btnSecondary}>
                        Cancelar edición
                    </button>
                )}
            </form>

            {mensaje && <p style={{ fontWeight: "bold" }}>{mensaje}</p>}

            <button onClick={cargarProductos} style={{ ...btnPrimary, marginBottom: "20px" }}>
                Recargar productos
            </button>

            <table border="1" cellPadding="8">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Sabor</th>
                        <th>Relleno</th>
                        <th>Tamaño</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {productos.map((p) => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.nombre}</td>
                            <td>{p.sabor}</td>
                            <td>{p.relleno}</td>
                            <td>{p.tamano}</td>
                            <td>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button type="button" onClick={() => prepararEdicion(p)} style={btnPrimary}>
                                        Editar
                                    </button>
                                    <button type="button" onClick={() => eliminarProducto(p.id)} style={btnDanger}>
                                        Eliminar
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

const btnPrimary = {
    padding: "8px 16px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
};

const btnSecondary = {
    padding: "8px 16px",
    background: "#e5e7eb",
    color: "#111827",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
};

const btnDanger = {
    padding: "8px 16px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: "999px",
    cursor: "pointer",
};