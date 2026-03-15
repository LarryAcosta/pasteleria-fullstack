"use client";

import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PedidosPage() {
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [mensaje, setMensaje] = useState("");

    const [clienteId, setClienteId] = useState("");
    const [cliente, setCliente] = useState("");
    const [telefono, setTelefono] = useState("");
    const [correo, setCorreo] = useState("");

    const [productoId, setProductoId] = useState("");
    const [producto, setProducto] = useState("");
    const [sabor, setSabor] = useState("");
    const [relleno, setRelleno] = useState("");
    const [tamano, setTamano] = useState("");
    const [precio, setPrecio] = useState("");

    const [incluyeDomicilio, setIncluyeDomicilio] = useState(false);
    const [fechaEntrega, setFechaEntrega] = useState("");
    const [horaEntrega, setHoraEntrega] = useState("");
    const [direccionEntrega, setDireccionEntrega] = useState("");
    const [tipoEntrega, setTipoEntrega] = useState("sitio");
    const [metodoPago, setMetodoPago] = useState("abono");

    const [estadoId, setEstadoId] = useState("");
    const [estadoNuevo, setEstadoNuevo] = useState("pendiente");

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
                setMensaje("Error cargando clientes.");
                return;
            }

            const data = await resp.json();
            setClientes(data);
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API de clientes.");
        }
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
                setMensaje("Error cargando productos.");
                return;
            }

            const data = await resp.json();
            setProductos(data);
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API de productos.");
        }
    }

    async function cargarPedidos() {
        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/pedidos/mis-pedidos`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error cargando pedidos.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            const data = await resp.json();
            setPedidos(data);
            setMensaje(`Pedidos cargados: ${data.length}`);
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API de pedidos.");
        }
    }

    function usarCliente(id) {
        const clienteSeleccionado = clientes.find((c) => c.id === id);

        if (!clienteSeleccionado) {
            setMensaje("No se encontró el cliente seleccionado.");
            return;
        }

        setClienteId(clienteSeleccionado.id);
        setCliente(clienteSeleccionado.nombre || "");
        setTelefono(clienteSeleccionado.telefono || "");
        setCorreo(clienteSeleccionado.correo || "");
        setMensaje(`Cliente seleccionado: ${clienteSeleccionado.nombre}`);
    }

    function usarProducto(id) {
        const productoSeleccionado = productos.find((p) => p.id === id);

        if (!productoSeleccionado) {
            setMensaje("No se encontró el producto seleccionado.");
            return;
        }

        setProductoId(productoSeleccionado.id);
        setProducto(productoSeleccionado.nombre || "");
        setSabor(productoSeleccionado.sabor || "");
        setRelleno(productoSeleccionado.relleno || "");
        setTamano(productoSeleccionado.tamano || "");
        setMensaje(`Producto seleccionado: ${productoSeleccionado.nombre}`);
    }

    function resetFormularioPedido() {
        setClienteId("");
        setCliente("");
        setTelefono("");
        setCorreo("");

        setProductoId("");
        setProducto("");
        setSabor("");
        setRelleno("");
        setTamano("");
        setPrecio("");

        setIncluyeDomicilio(false);
        setFechaEntrega("");
        setHoraEntrega("");
        setDireccionEntrega("");
        setTipoEntrega("sitio");
        setMetodoPago("abono");
    }

    async function crearPedido(e) {
        e.preventDefault();

        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        if (
            !cliente ||
            !telefono ||
            !correo ||
            !producto ||
            !sabor ||
            !relleno ||
            !tamano ||
            !precio ||
            !fechaEntrega
        ) {
            setMensaje("Faltan datos obligatorios del pedido.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/pedidos/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cliente,
                    telefono,
                    correo_electronico: correo,
                    cliente_id: clienteId ? Number(clienteId) : null,
                    producto,
                    producto_id: productoId ? Number(productoId) : null,
                    sabor,
                    relleno,
                    tamano,
                    precio: Number(precio),
                    incluye_domicilio: incluyeDomicilio,
                    fecha_entrega: fechaEntrega,
                    hora_entrega: horaEntrega || null,
                    direccion_entrega: direccionEntrega || null,
                    tipo_entrega: tipoEntrega,
                    metodo_pago: metodoPago,
                }),
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error creando pedido.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            const data = await resp.json();
            setMensaje(`Pedido creado correctamente con ID ${data.id}`);
            resetFormularioPedido();
            await cargarPedidos();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API al crear pedido.");
        }
    }

    async function cambiarEstadoPedido(e) {
        e.preventDefault();

        const token = getToken();

        if (!token) {
            setMensaje("No hay token. Debes iniciar sesión.");
            return;
        }

        if (!estadoId) {
            setMensaje("Debes indicar el ID del pedido.");
            return;
        }

        try {
            const resp = await fetch(`${BASE_URL}/pedidos/${estadoId}/estado`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    estado: estadoNuevo,
                }),
            });

            if (!resp.ok) {
                const errorText = await resp.text();
                let detail = "Error actualizando estado.";
                try {
                    const data = JSON.parse(errorText);
                    detail = data.detail || detail;
                } catch { }
                setMensaje(detail);
                return;
            }

            setMensaje(`Estado actualizado correctamente a ${estadoNuevo}`);
            await cargarPedidos();
        } catch (error) {
            console.error(error);
            setMensaje("Error conectando con la API al cambiar estado.");
        }
    }

    useEffect(() => {
        cargarClientes();
        cargarProductos();
        cargarPedidos();
    }, []);

    return (
        <main style={{ padding: "40px", fontFamily: "Arial" }}>
            <h1>Pedidos</h1>

            {mensaje && <p style={{ fontWeight: "bold" }}>{mensaje}</p>}

            <h2>Seleccionar cliente</h2>
            <table border="1" cellPadding="8" style={{ marginBottom: "20px" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Acción</th>
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
                                <button type="button" onClick={() => usarCliente(c.id)}>
                                    Usar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Seleccionar producto</h2>
            <table border="1" cellPadding="8" style={{ marginBottom: "20px" }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Sabor</th>
                        <th>Relleno</th>
                        <th>Tamaño</th>
                        <th>Acción</th>
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
                                <button type="button" onClick={() => usarProducto(p.id)}>
                                    Usar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>Crear pedido</h2>
            <form
                onSubmit={crearPedido}
                style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "700px" }}
            >
                <input placeholder="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
                <input placeholder="Cliente ID" value={clienteId} onChange={(e) => setClienteId(e.target.value)} />
                <input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                <input placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />

                <input placeholder="Producto" value={producto} onChange={(e) => setProducto(e.target.value)} />
                <input placeholder="Producto ID" value={productoId} onChange={(e) => setProductoId(e.target.value)} />
                <input placeholder="Sabor" value={sabor} onChange={(e) => setSabor(e.target.value)} />
                <input placeholder="Relleno" value={relleno} onChange={(e) => setRelleno(e.target.value)} />
                <input placeholder="Tamaño" value={tamano} onChange={(e) => setTamano(e.target.value)} />
                <input placeholder="Precio" type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} />

                <label>
                    <input
                        type="checkbox"
                        checked={incluyeDomicilio}
                        onChange={(e) => setIncluyeDomicilio(e.target.checked)}
                    />
                    Incluye domicilio
                </label>

                <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} />
                <input type="time" value={horaEntrega} onChange={(e) => setHoraEntrega(e.target.value)} />
                <input
                    placeholder="Dirección de entrega"
                    value={direccionEntrega}
                    onChange={(e) => setDireccionEntrega(e.target.value)}
                />

                <select value={tipoEntrega} onChange={(e) => setTipoEntrega(e.target.value)}>
                    <option value="sitio">sitio</option>
                    <option value="domicilio">domicilio</option>
                </select>

                <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    <option value="abono">abono</option>
                    <option value="pago_total">pago_total</option>
                    <option value="transferencia">transferencia</option>
                </select>

                <button type="submit">Crear pedido</button>
            </form>

            <h2 style={{ marginTop: "30px" }}>Cambiar estado de pedido</h2>
            <form
                onSubmit={cambiarEstadoPedido}
                style={{ display: "flex", gap: "10px", marginBottom: "20px" }}
            >
                <input
                    placeholder="ID del pedido"
                    value={estadoId}
                    onChange={(e) => setEstadoId(e.target.value)}
                />
                <select value={estadoNuevo} onChange={(e) => setEstadoNuevo(e.target.value)}>
                    <option value="pendiente">pendiente</option>
                    <option value="confirmado">confirmado</option>
                    <option value="en_preparacion">en_preparacion</option>
                    <option value="entregado">entregado</option>
                    <option value="cancelado">cancelado</option>
                </select>
                <button type="submit">Actualizar estado</button>
            </form>

            <h2>Mis pedidos</h2>
            <button type="button" onClick={cargarPedidos} style={{ marginBottom: "15px" }}>
                Recargar pedidos
            </button>

            <table border="1" cellPadding="8">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Producto</th>
                        <th>Sabor</th>
                        <th>Relleno</th>
                        <th>Tamaño</th>
                        <th>Precio</th>
                        <th>Fecha entrega</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {pedidos.map((p) => (
                        <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.cliente}</td>
                            <td>{p.producto}</td>
                            <td>{p.sabor}</td>
                            <td>{p.relleno}</td>
                            <td>{p.tamano}</td>
                            <td>{p.precio}</td>
                            <td>{p.fecha_entrega}</td>
                            <td>{p.estado}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}