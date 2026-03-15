"use client";

import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ClientesPage() {
    const [clientes, setClientes] = useState([]);
    const [mensaje, setMensaje] = useState("");

    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");

    const [editandoId, setEditandoId] = useState(null);

    function getToken() {
        return localStorage.getItem("token");
    }

    async function cargarClientes() {
        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/clientes/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                setMensaje("Error al cargar clientes.");
                return;
            }

            const data = await resp.json();
            setClientes(data);
            setMensaje(`Clientes cargados: ${data.length}`);
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    async function crearCliente(e) {
        e.preventDefault();

        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        if (!nombre || !telefono || !correo) {
            setMensaje("Nombre, teléfono y correo son obligatorios.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/clientes/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre,
                    telefono,
                    correo,
                    direccion: null,
                }),
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error creando cliente.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            limpiarFormulario();
            setMensaje("Cliente creado correctamente.");
            await cargarClientes();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    async function actualizarCliente(e) {
        e.preventDefault();

        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        if (!editandoId) {
            setMensaje("No hay cliente seleccionado para editar.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/clientes/${editandoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    nombre,
                    telefono,
                    correo,
                    direccion: null,
                }),
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error actualizando cliente.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            limpiarFormulario();
            setEditandoId(null);
            setMensaje("Cliente actualizado correctamente.");
            await cargarClientes();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    async function eliminarCliente(id) {
        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        const confirmado = confirm("¿Seguro que deseas eliminar este cliente?");
        if (!confirmado) return;

        try {
            const resp = await fetch(`${BASE_URL}/clientes/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error eliminando cliente.";
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

            setMensaje("Cliente eliminado correctamente.");
            await cargarClientes();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API.");
        }
    }

    function prepararEdicion(cliente) {
        setEditandoId(cliente.id);
        setNombre(cliente.nombre || "");
        setTelefono(cliente.telefono || "");
        setCorreo(cliente.correo || "");
        setMensaje(`Editando cliente ID ${cliente.id}`);
    }

    function limpiarFormulario() {
        setNombre("");
        setTelefono("");
        setCorreo("");
    }

    function cancelarEdicion() {
        setEditandoId(null);
        limpiarFormulario();
        setMensaje("Edición cancelada.");
    }

    useEffect(() => {
        cargarClientes();
    }, []);

    return (
        <main>
            <h2>Clientes</h2>

            <form
                onSubmit={editandoId ? actualizarCliente : crearCliente}
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
                    style={{ padding: "8px", minWidth: "200px" }}
                />

                <input
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    style={{ padding: "8px", minWidth: "180px" }}
                />

                <input
                    placeholder="Correo"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    style={{ padding: "8px", minWidth: "240px" }}
                />

                <button type="submit" style={btnPrimary}>
                    {editandoId ? "Actualizar cliente" : "Crear cliente"}
                </button>

                {editandoId && (
                    <button type="button" onClick={cancelarEdicion} style={btnSecondary}>
                        Cancelar edición
                    </button>
                )}
            </form>

            {mensaje && <p style={{ fontWeight: "bold" }}>{mensaje}</p>}

            <button onClick={cargarClientes} style={{ ...btnPrimary, marginBottom: "20px" }}>
                Recargar clientes
            </button>

            <table border="1" cellPadding="8">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {clientes.map((c) => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.nombre}</td>
                            <td>{c.telefono}</td>
                            <td>{c.correo}</td>
                            <td>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button type="button" onClick={() => prepararEdicion(c)} style={btnPrimary}>
                                        Editar
                                    </button>
                                    <button type="button" onClick={() => eliminarCliente(c.id)} style={btnDanger}>
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