// static/main.js

const BASE_URL = "http://127.0.0.1:8000";

let token = null;
let pedidosCache = [];
let clientesCache = [];
let productosCache = [];

// estados edición
let clienteEditandoId = null;
let productoEditandoId = null;

// ------------------ HELPERS UI ------------------
function setLoggedIn(logged) {
  const cardLogin = document.getElementById("card-login");
  const cardPedido = document.getElementById("card-pedido");
  const cardProductos = document.getElementById("card-productos");
  const cardCrearPedido = document.getElementById("card-crear-pedido");
  const cardMisPedidos = document.getElementById("card-mis-pedidos");

  if (cardLogin) cardLogin.style.display = "block";

  if (logged) {
    if (cardPedido) cardPedido.style.display = "block";
    if (cardProductos) cardProductos.style.display = "block";
    if (cardCrearPedido) cardCrearPedido.style.display = "block";
    if (cardMisPedidos) cardMisPedidos.style.display = "block";
  } else {
    if (cardPedido) cardPedido.style.display = "none";
    if (cardProductos) cardProductos.style.display = "none";
    if (cardCrearPedido) cardCrearPedido.style.display = "none";
    if (cardMisPedidos) cardMisPedidos.style.display = "none";
  }
}

function parseErrorMessage(text, fallback) {
  try {
    const data = JSON.parse(text);
    if (typeof data.detail === "string") return data.detail;
    return fallback;
  } catch {
    return fallback;
  }
}

function showMessage(elementId, message, type = "info") {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = message;
  el.style.padding = "10px 12px";
  el.style.borderRadius = "10px";
  el.style.marginTop = "10px";
  el.style.fontWeight = "600";

  if (type === "success") {
    el.style.background = "#dcfce7";
    el.style.color = "#166534";
    el.style.border = "1px solid #86efac";
  } else if (type === "error") {
    el.style.background = "#fee2e2";
    el.style.color = "#991b1b";
    el.style.border = "1px solid #fca5a5";
  } else {
    el.style.background = "#ede9fe";
    el.style.color = "#5b21b6";
    el.style.border = "1px solid #c4b5fd";
  }
}

function clearMessage(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = "";
  el.style.background = "transparent";
  el.style.border = "none";
  el.style.padding = "0";
  el.style.marginTop = "8px";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureResumenPedidos() {
  let resumen = document.getElementById("resumen-pedidos");
  if (resumen) return resumen;

  const card = document.getElementById("card-mis-pedidos");
  if (!card) return null;

  resumen = document.createElement("div");
  resumen.id = "resumen-pedidos";
  resumen.style.display = "grid";
  resumen.style.gridTemplateColumns = "repeat(auto-fit, minmax(150px, 1fr))";
  resumen.style.gap = "10px";
  resumen.style.margin = "14px 0 18px 0";

  const refNode = card.querySelector("table");
  if (refNode) {
    card.insertBefore(resumen, refNode);
  } else {
    card.appendChild(resumen);
  }

  return resumen;
}

function renderResumenPedidos(total, activos, entregados) {
  const resumen = ensureResumenPedidos();
  if (!resumen) return;

  resumen.innerHTML = `
    <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:12px;padding:12px;">
      <div style="font-size:0.8rem;color:#6b7280;">Total pedidos</div>
      <div style="font-size:1.5rem;font-weight:700;color:#5b21b6;">${total}</div>
    </div>
    <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:12px;padding:12px;">
      <div style="font-size:0.8rem;color:#6b7280;">Activos</div>
      <div style="font-size:1.5rem;font-weight:700;color:#1d4ed8;">${activos}</div>
    </div>
    <div style="background:#dcfce7;border:1px solid #86efac;border-radius:12px;padding:12px;">
      <div style="font-size:0.8rem;color:#6b7280;">Entregados</div>
      <div style="font-size:1.5rem;font-weight:700;color:#166534;">${entregados}</div>
    </div>
  `;
}

function pedidoDateTimeValue(pedido) {
  const fecha = pedido.fecha_entrega || "2099-12-31";
  const hora = pedido.hora_entrega || "23:59:59";
  return new Date(`${fecha}T${hora}`);
}

// ------------------ HELPERS CLIENTE ------------------
function getClienteBodyFromForm() {
  return {
    nombre: document.getElementById("nuevo-cliente-nombre")?.value.trim() || "",
    telefono: document.getElementById("nuevo-cliente-telefono")?.value.trim() || "",
    correo: document.getElementById("nuevo-cliente-correo")?.value.trim() || "",
    direccion:
      document.getElementById("nuevo-cliente-direccion")?.value.trim() || null,
  };
}

function updateClienteActionButtons() {
  const btnCrear = document.getElementById("btn-crear-cliente");
  const contenedor = document.getElementById("cliente-action-buttons");

  if (btnCrear) {
    btnCrear.textContent = clienteEditandoId ? "Actualizar cliente" : "Crear cliente";
    btnCrear.setAttribute(
      "onclick",
      clienteEditandoId ? "actualizarCliente()" : "crearCliente()"
    );
  }

  if (clienteEditandoId) {
    if (!contenedor) return;

    let btnCancelar = document.getElementById("btn-cancelar-edicion-cliente");
    if (!btnCancelar) {
      btnCancelar = document.createElement("button");
      btnCancelar.type = "button";
      btnCancelar.id = "btn-cancelar-edicion-cliente";
      btnCancelar.textContent = "Cancelar edición";
      btnCancelar.onclick = cancelarEdicionCliente;
      btnCancelar.style.marginLeft = "8px";
      contenedor.appendChild(btnCancelar);
    }
  } else {
    const btnCancelar = document.getElementById("btn-cancelar-edicion-cliente");
    if (btnCancelar) btnCancelar.remove();
  }
}

function prepararEdicionCliente(id) {
  const cliente = clientesCache.find((c) => c.id === id);

  if (!cliente) {
    showMessage("cliente-status", "Cliente no encontrado para editar.", "error");
    return;
  }

  clienteEditandoId = id;

  const nombre = document.getElementById("nuevo-cliente-nombre");
  const telefono = document.getElementById("nuevo-cliente-telefono");
  const correo = document.getElementById("nuevo-cliente-correo");
  const direccion = document.getElementById("nuevo-cliente-direccion");

  if (nombre) nombre.value = cliente.nombre || "";
  if (telefono) telefono.value = cliente.telefono || "";
  if (correo) correo.value = cliente.correo || "";
  if (direccion) direccion.value = cliente.direccion || "";

  updateClienteActionButtons();
  showMessage(
    "cliente-status",
    `Editando cliente ID ${id}. Modifica los datos y pulsa "Actualizar cliente".`,
    "info"
  );
}

function cancelarEdicionCliente() {
  clienteEditandoId = null;
  resetClienteForm();
  updateClienteActionButtons();
  showMessage("cliente-status", "Edición cancelada.", "info");
}

// ------------------ HELPERS PRODUCTO ------------------
function getProductoBodyFromForm() {
  return {
    nombre: document.getElementById("nuevo-producto-nombre")?.value.trim() || "",
    sabor: document.getElementById("nuevo-producto-sabor")?.value.trim() || "",
    relleno: document.getElementById("nuevo-producto-relleno")?.value.trim() || "",
    tamano: document.getElementById("nuevo-producto-tamano")?.value.trim() || "",
  };
}

function updateProductoActionButtons() {
  const btnCrear = document.getElementById("btn-crear-producto");
  const contenedor = document.getElementById("producto-action-buttons");

  if (btnCrear) {
    btnCrear.textContent = productoEditandoId ? "Actualizar producto" : "Crear producto";
    btnCrear.setAttribute(
      "onclick",
      productoEditandoId ? "actualizarProducto()" : "crearProducto()"
    );
  }

  if (productoEditandoId) {
    if (!contenedor) return;

    let btnCancelar = document.getElementById("btn-cancelar-edicion-producto");
    if (!btnCancelar) {
      btnCancelar = document.createElement("button");
      btnCancelar.type = "button";
      btnCancelar.id = "btn-cancelar-edicion-producto";
      btnCancelar.textContent = "Cancelar edición";
      btnCancelar.onclick = cancelarEdicionProducto;
      btnCancelar.style.marginLeft = "8px";
      contenedor.appendChild(btnCancelar);
    }
  } else {
    const btnCancelar = document.getElementById("btn-cancelar-edicion-producto");
    if (btnCancelar) btnCancelar.remove();
  }
}

function prepararEdicionProducto(id) {
  const producto = productosCache.find((p) => p.id === id);

  if (!producto) {
    showMessage("producto-status", "Producto no encontrado para editar.", "error");
    return;
  }

  productoEditandoId = id;

  const nombre = document.getElementById("nuevo-producto-nombre");
  const sabor = document.getElementById("nuevo-producto-sabor");
  const relleno = document.getElementById("nuevo-producto-relleno");
  const tamano = document.getElementById("nuevo-producto-tamano");

  if (nombre) nombre.value = producto.nombre || "";
  if (sabor) sabor.value = producto.sabor || "";
  if (relleno) relleno.value = producto.relleno || "";
  if (tamano) tamano.value = producto.tamano || "";

  updateProductoActionButtons();
  showMessage(
    "producto-status",
    `Editando producto ID ${id}. Modifica los datos y pulsa "Actualizar producto".`,
    "info"
  );
}

function cancelarEdicionProducto() {
  productoEditandoId = null;
  resetProductoForm();
  updateProductoActionButtons();
  showMessage("producto-status", "Edición de producto cancelada.", "info");
}

// ------------------ LOGIN / LOGOUT ------------------
async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  clearMessage("login-status");

  if (!username || !password) {
    showMessage("login-status", "Debes ingresar usuario y contraseña.", "error");
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const resp = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "login-status",
        parseErrorMessage(errorText, "Login incorrecto."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    token = data.access_token;

    document.getElementById("login-password").value = "";
    showMessage("login-status", `Sesión iniciada como ${username}`, "success");

    setLoggedIn(true);
    await cargarMisPedidos();
  } catch (err) {
    console.error("Error en login:", err);
    showMessage("login-status", "Error al conectar con la API.", "error");
  }
}

function logout() {
  token = null;
  pedidosCache = [];
  clientesCache = [];
  productosCache = [];
  clienteEditandoId = null;
  productoEditandoId = null;

  const loginUsername = document.getElementById("login-username");
  const loginPassword = document.getElementById("login-password");
  if (loginUsername) loginUsername.value = "";
  if (loginPassword) loginPassword.value = "";

  clearMessage("login-status");
  clearMessage("pedido-status");
  clearMessage("estado-status");
  clearMessage("cliente-status");
  clearMessage("producto-status");

  resetPedidoForm();
  resetClienteForm();
  resetProductoForm();
  updateClienteActionButtons();
  updateProductoActionButtons();

  const jsonEl = document.getElementById("mis-pedidos-json");
  if (jsonEl) jsonEl.textContent = "";

  const tablaPedidosBody = document.getElementById("tabla-pedidos-body");
  if (tablaPedidosBody) tablaPedidosBody.innerHTML = "";

  const tbodyEnt = document.getElementById("tabla-pedidos-entregados-body");
  if (tbodyEnt) tbodyEnt.innerHTML = "";

  const detalleEl = document.getElementById("detalle-pedido");
  if (detalleEl) detalleEl.textContent = "";

  const clientesBody = document.getElementById("tabla-clientes-body");
  const productosBody = document.getElementById("tabla-productos-body");
  if (clientesBody) clientesBody.innerHTML = "";
  if (productosBody) productosBody.innerHTML = "";

  const resumen = document.getElementById("resumen-pedidos");
  if (resumen) resumen.innerHTML = "";

  const estadoId = document.getElementById("estado-id");
  const estadoNuevo = document.getElementById("estado-nuevo");
  if (estadoId) estadoId.value = "";
  if (estadoNuevo) estadoNuevo.value = "pendiente";

  setLoggedIn(false);
}

// ------------------ OJO DE CONTRASEÑA ------------------
function setupPasswordEye() {
  const input = document.getElementById("login-password");
  const btn = document.getElementById("btn-password-eye");
  const icon = document.getElementById("icon-password-eye");

  if (!input || !btn || !icon) return;

  const mostrar = () => {
    input.type = "text";
    icon.textContent = "🙈";
  };

  const ocultar = () => {
    input.type = "password";
    icon.textContent = "👁";
  };

  btn.addEventListener("mousedown", mostrar);
  btn.addEventListener("mouseup", ocultar);
  btn.addEventListener("mouseleave", ocultar);

  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mostrar();
  });
  btn.addEventListener("touchend", ocultar);
}

// ------------------ FORM RESETS ------------------
function resetPedidoForm() {
  const ids = [
    "cliente",
    "telefono",
    "correo",
    "producto",
    "sabor",
    "relleno",
    "tamano",
    "precio",
    "cliente_id",
    "producto_id",
    "fecha_entrega",
    "hora_entrega",
    "direccion_entrega",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const incluyeDomicilio = document.getElementById("incluye_domicilio");
  const tipoEntrega = document.getElementById("tipo_entrega");
  const metodoPago = document.getElementById("metodo_pago");

  if (incluyeDomicilio) incluyeDomicilio.checked = false;
  if (tipoEntrega) tipoEntrega.value = "sitio";
  if (metodoPago) metodoPago.value = "abono";
}

function resetClienteForm() {
  const ids = [
    "nuevo-cliente-nombre",
    "nuevo-cliente-telefono",
    "nuevo-cliente-correo",
    "nuevo-cliente-direccion",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function resetProductoForm() {
  const ids = [
    "nuevo-producto-nombre",
    "nuevo-producto-sabor",
    "nuevo-producto-relleno",
    "nuevo-producto-tamano",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

// ------------------ DETALLE PEDIDO ------------------
function verDetallePedido(id) {
  const detalleEl = document.getElementById("detalle-pedido");
  const pedido = pedidosCache.find((p) => p.id === id);

  if (!detalleEl) return;

  if (!pedido) {
    detalleEl.textContent = "No se encontró el pedido seleccionado.";
    return;
  }

  const texto = `
ID: ${pedido.id}
Cliente: ${pedido.cliente}
Cliente ID: ${pedido.cliente_id ?? "-"}
Teléfono: ${pedido.telefono}
Correo: ${pedido.correo_electronico}

Producto: ${pedido.producto}
Producto ID: ${pedido.producto_id ?? "-"}
Sabor: ${pedido.sabor}
Relleno: ${pedido.relleno}
Tamaño: ${pedido.tamano}
Precio: ${pedido.precio}

Incluye domicilio: ${pedido.incluye_domicilio ? "Sí" : "No"}
Fecha entrega: ${pedido.fecha_entrega}
Hora entrega: ${pedido.hora_entrega ?? "-"}

Tipo entrega: ${pedido.tipo_entrega}
Dirección: ${pedido.direccion_entrega ?? "-"}

Método de pago: ${pedido.metodo_pago}
Estado: ${pedido.estado}
Gestor (usuario_id): ${pedido.usuario_id}
  `.trim();

  detalleEl.textContent = texto;
}

// ------------------ CLIENTES ------------------
async function crearCliente() {
  clearMessage("cliente-status");

  if (!token) {
    showMessage("cliente-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  const body = getClienteBodyFromForm();

  if (!body.nombre || !body.telefono || !body.correo) {
    showMessage(
      "cliente-status",
      "Nombre, teléfono y correo son obligatorios.",
      "error"
    );
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/clientes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "cliente-status",
        parseErrorMessage(errorText, "Error creando cliente."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    resetClienteForm();
    showMessage("cliente-status", `Cliente creado con ID ${data.id}`, "success");
    await cargarClientes();
  } catch (err) {
    console.error("Error en crearCliente:", err);
    showMessage(
      "cliente-status",
      "Error al conectar con la API para clientes.",
      "error"
    );
  }
}

async function actualizarCliente() {
  clearMessage("cliente-status");

  if (!token) {
    showMessage("cliente-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  if (!clienteEditandoId) {
    showMessage("cliente-status", "No hay un cliente seleccionado para editar.", "error");
    return;
  }

  const body = getClienteBodyFromForm();

  if (!body.nombre || !body.telefono || !body.correo) {
    showMessage(
      "cliente-status",
      "Nombre, teléfono y correo son obligatorios.",
      "error"
    );
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/clientes/${clienteEditandoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "cliente-status",
        parseErrorMessage(errorText, "Error actualizando cliente."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    clienteEditandoId = null;
    resetClienteForm();
    updateClienteActionButtons();
    showMessage(
      "cliente-status",
      `Cliente actualizado correctamente (ID ${data.id}).`,
      "success"
    );
    await cargarClientes();
  } catch (err) {
    console.error("Error en actualizarCliente:", err);
    showMessage(
      "cliente-status",
      "Error al conectar con la API para actualizar cliente.",
      "error"
    );
  }
}

async function eliminarCliente(id) {
  clearMessage("cliente-status");

  if (!token) {
    showMessage("cliente-status", "Debes iniciar sesión primero.", "error");
    alert("Debes iniciar sesión primero.");
    return;
  }

  const cliente = clientesCache.find((c) => c.id === id);
  const nombreCliente = cliente?.nombre || `ID ${id}`;

  const confirmado = confirm(`¿Seguro que deseas eliminar el cliente ${nombreCliente}?`);
  if (!confirmado) {
    showMessage("cliente-status", "Eliminación cancelada.", "info");
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/clientes/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      const mensaje = parseErrorMessage(
        errorText,
        "Error eliminando cliente."
      );
      showMessage("cliente-status", mensaje, "error");
      alert(mensaje);
      return;
    }

    if (clienteEditandoId === id) {
      cancelarEdicionCliente();
    }

    showMessage("cliente-status", `Cliente eliminado correctamente (ID ${id}).`, "success");
    await cargarClientes();
  } catch (err) {
    console.error("Error en eliminarCliente:", err);
    const mensaje = "Error al conectar con la API para eliminar cliente.";
    showMessage("cliente-status", mensaje, "error");
    alert(mensaje);
  }
}

async function cargarClientes() {
  const tbody = document.getElementById("tabla-clientes-body");
  if (tbody) tbody.innerHTML = "";
  clearMessage("cliente-status");

  try {
    const resp = await fetch(`${BASE_URL}/clientes/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!resp.ok) {
      showMessage("cliente-status", "Error cargando clientes.", "error");
      return;
    }

    const data = await resp.json();
    clientesCache = data;

    data.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${escapeHtml(c.nombre)}</td>
        <td>${escapeHtml(c.telefono)}</td>
        <td>${escapeHtml(c.correo)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button type="button" onclick="usarCliente(${c.id})">
            Usar
          </button>
          <button type="button" onclick="prepararEdicionCliente(${c.id})">
            Editar
          </button>
          <button type="button" onclick="eliminarCliente(${c.id})">
            Eliminar
          </button>
        </td>
      `;
      if (tbody) tbody.appendChild(tr);
    });

    showMessage("cliente-status", `Clientes cargados: ${data.length}`, "info");
  } catch (err) {
    console.error("Error en cargarClientes:", err);
    showMessage(
      "cliente-status",
      "Error al conectar con la API para clientes.",
      "error"
    );
  }
}

function usarCliente(id) {
  const clienteSeleccionado = clientesCache.find((c) => c.id === id);

  if (!clienteSeleccionado) {
    showMessage("pedido-status", "No se encontró el cliente seleccionado.", "error");
    return;
  }

  const clienteId = document.getElementById("cliente_id");
  const cliente = document.getElementById("cliente");
  const telefonoEl = document.getElementById("telefono");
  const correoEl = document.getElementById("correo");

  if (clienteId) clienteId.value = clienteSeleccionado.id;
  if (cliente) cliente.value = clienteSeleccionado.nombre || "";
  if (telefonoEl) telefonoEl.value = clienteSeleccionado.telefono || "";
  if (correoEl) correoEl.value = clienteSeleccionado.correo || "";

  showMessage(
    "pedido-status",
    `Cliente seleccionado: ${clienteSeleccionado.nombre} (ID ${clienteSeleccionado.id})`,
    "success"
  );
}

// ------------------ PRODUCTOS ------------------
async function crearProducto() {
  clearMessage("producto-status");

  if (!token) {
    showMessage("producto-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  const body = getProductoBodyFromForm();

  if (!body.nombre || !body.sabor || !body.relleno || !body.tamano) {
    showMessage(
      "producto-status",
      "Nombre, sabor, relleno y tamaño son obligatorios.",
      "error"
    );
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/productos/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "producto-status",
        parseErrorMessage(errorText, "Error creando producto."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    resetProductoForm();
    showMessage("producto-status", `Producto creado con ID ${data.id}`, "success");
    await cargarProductos();
  } catch (err) {
    console.error("Error en crearProducto:", err);
    showMessage(
      "producto-status",
      "Error al conectar con la API para productos.",
      "error"
    );
  }
}

async function actualizarProducto() {
  clearMessage("producto-status");

  if (!token) {
    showMessage("producto-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  if (!productoEditandoId) {
    showMessage("producto-status", "No hay un producto seleccionado para editar.", "error");
    return;
  }

  const body = getProductoBodyFromForm();

  if (!body.nombre || !body.sabor || !body.relleno || !body.tamano) {
    showMessage(
      "producto-status",
      "Nombre, sabor, relleno y tamaño son obligatorios.",
      "error"
    );
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/productos/${productoEditandoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "producto-status",
        parseErrorMessage(errorText, "Error actualizando producto."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    productoEditandoId = null;
    resetProductoForm();
    updateProductoActionButtons();
    showMessage(
      "producto-status",
      `Producto actualizado correctamente (ID ${data.id}).`,
      "success"
    );
    await cargarProductos();
  } catch (err) {
    console.error("Error en actualizarProducto:", err);
    showMessage(
      "producto-status",
      "Error al conectar con la API para actualizar producto.",
      "error"
    );
  }
}

async function eliminarProducto(id) {
  clearMessage("producto-status");

  if (!token) {
    showMessage("producto-status", "Debes iniciar sesión primero.", "error");
    alert("Debes iniciar sesión primero.");
    return;
  }

  const producto = productosCache.find((p) => p.id === id);
  const nombreProducto = producto?.nombre || `ID ${id}`;

  const confirmado = confirm(`¿Seguro que deseas eliminar el producto ${nombreProducto}?`);
  if (!confirmado) {
    showMessage("producto-status", "Eliminación cancelada.", "info");
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/productos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      const mensaje = parseErrorMessage(
        errorText,
        "Error eliminando producto."
      );
      showMessage("producto-status", mensaje, "error");
      alert(mensaje);
      return;
    }

    if (productoEditandoId === id) {
      cancelarEdicionProducto();
    }

    showMessage("producto-status", `Producto eliminado correctamente (ID ${id}).`, "success");
    await cargarProductos();
  } catch (err) {
    console.error("Error en eliminarProducto:", err);
    const mensaje = "Error al conectar con la API para eliminar producto.";
    showMessage("producto-status", mensaje, "error");
    alert(mensaje);
  }
}

async function cargarProductos() {
  const tbody = document.getElementById("tabla-productos-body");
  if (tbody) tbody.innerHTML = "";
  clearMessage("producto-status");

  try {
    const resp = await fetch(`${BASE_URL}/productos/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "producto-status",
        parseErrorMessage(errorText, "Error cargando productos."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    productosCache = data;

    data.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.nombre)}</td>
        <td>${escapeHtml(p.sabor)}</td>
        <td>${escapeHtml(p.relleno)}</td>
        <td>${escapeHtml(p.tamano)}</td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button type="button" onclick="usarProducto(${p.id})">
            Usar
          </button>
          <button type="button" onclick="prepararEdicionProducto(${p.id})">
            Editar
          </button>
          <button type="button" onclick="eliminarProducto(${p.id})">
            Eliminar
          </button>
        </td>
      `;
      if (tbody) tbody.appendChild(tr);
    });

    showMessage("producto-status", `Productos cargados: ${data.length}`, "success");
  } catch (err) {
    console.error("Error en cargarProductos:", err);
    showMessage(
      "producto-status",
      "Error al conectar con la API para productos.",
      "error"
    );
  }
}

function usarProducto(id) {
  const productoSeleccionado = productosCache.find((p) => p.id === id);

  if (!productoSeleccionado) {
    showMessage("pedido-status", "No se encontró el producto seleccionado.", "error");
    return;
  }

  const productoId = document.getElementById("producto_id");
  const producto = document.getElementById("producto");
  const sabor = document.getElementById("sabor");
  const relleno = document.getElementById("relleno");
  const tamano = document.getElementById("tamano");

  if (productoId) productoId.value = productoSeleccionado.id;
  if (producto) producto.value = productoSeleccionado.nombre || "";
  if (sabor) sabor.value = productoSeleccionado.sabor || "";
  if (relleno) relleno.value = productoSeleccionado.relleno || "";
  if (tamano) tamano.value = productoSeleccionado.tamano || "";

  showMessage(
    "pedido-status",
    `Producto seleccionado: ${productoSeleccionado.nombre} (ID ${productoSeleccionado.id})`,
    "success"
  );
}

// ------------------ CREAR PEDIDO ------------------
async function crearPedido() {
  clearMessage("pedido-status");

  if (!token) {
    showMessage("pedido-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  const clienteId = document.getElementById("cliente_id")?.value
    ? Number(document.getElementById("cliente_id").value)
    : null;

  const productoId = document.getElementById("producto_id")?.value
    ? Number(document.getElementById("producto_id").value)
    : null;

  const body = {
    cliente: document.getElementById("cliente")?.value.trim() || "",
    telefono: document.getElementById("telefono")?.value.trim() || "",
    correo_electronico: document.getElementById("correo")?.value.trim() || "",
    cliente_id: clienteId,
    producto: document.getElementById("producto")?.value.trim() || "",
    producto_id: productoId,
    sabor: document.getElementById("sabor")?.value.trim() || "",
    relleno: document.getElementById("relleno")?.value.trim() || "",
    tamano: document.getElementById("tamano")?.value.trim() || "",
    precio: parseFloat(document.getElementById("precio")?.value || "0"),
    incluye_domicilio:
      document.getElementById("incluye_domicilio")?.checked || false,
    fecha_entrega: document.getElementById("fecha_entrega")?.value || "",
    hora_entrega: document.getElementById("hora_entrega")?.value || null,
    direccion_entrega:
      document.getElementById("direccion_entrega")?.value || null,
    tipo_entrega: document.getElementById("tipo_entrega")?.value || "sitio",
    metodo_pago: document.getElementById("metodo_pago")?.value || "abono",
  };

  if (
    !body.cliente ||
    !body.telefono ||
    !body.correo_electronico ||
    !body.producto ||
    !body.sabor ||
    !body.relleno ||
    !body.tamano ||
    !body.precio ||
    !body.fecha_entrega
  ) {
    showMessage("pedido-status", "Faltan datos obligatorios del pedido.", "error");
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/pedidos/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "pedido-status",
        parseErrorMessage(errorText, "Error creando pedido."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    showMessage("pedido-status", `Pedido creado con ID ${data.id}`, "success");
    resetPedidoForm();
    await cargarMisPedidos();
  } catch (err) {
    console.error("Error en crearPedido:", err);
    showMessage("pedido-status", "Error al conectar con la API.", "error");
  }
}

// ------------------ MIS PEDIDOS ------------------
async function cargarMisPedidos() {
  clearMessage("estado-status");

  const tbody = document.getElementById("tabla-pedidos-body");
  const tbodyEnt = document.getElementById("tabla-pedidos-entregados-body");
  const jsonEl = document.getElementById("mis-pedidos-json");
  const detalleEl = document.getElementById("detalle-pedido");

  if (tbody) tbody.innerHTML = "";
  if (tbodyEnt) tbodyEnt.innerHTML = "";
  if (jsonEl) jsonEl.textContent = "";
  if (detalleEl) detalleEl.textContent = "";

  if (!token) {
    showMessage("estado-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  try {
    const resp = await fetch(`${BASE_URL}/pedidos/mis-pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "estado-status",
        parseErrorMessage(errorText, "Error cargando pedidos."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    pedidosCache = data;

    if (jsonEl) jsonEl.textContent = JSON.stringify(data, null, 2);

    const activos = data
      .filter((p) => p.estado !== "entregado")
      .sort((a, b) => pedidoDateTimeValue(a) - pedidoDateTimeValue(b));

    const entregados = data
      .filter((p) => p.estado === "entregado")
      .sort((a, b) => pedidoDateTimeValue(b) - pedidoDateTimeValue(a));

    activos.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.cliente)}</td>
        <td>${escapeHtml(p.producto)}</td>
        <td>${p.precio}</td>
        <td>${p.fecha_entrega}</td>
        <td>${p.estado}</td>
        <td>
          <button type="button" onclick="verDetallePedido(${p.id})">
            Ver detalle
          </button>
        </td>
      `;
      if (tbody) tbody.appendChild(tr);
    });

    entregados.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.cliente)}</td>
        <td>${escapeHtml(p.producto)}</td>
        <td>${p.precio}</td>
        <td>${p.fecha_entrega}</td>
        <td>${p.estado}</td>
      `;
      if (tbodyEnt) tbodyEnt.appendChild(tr);
    });

    const estadoId = document.getElementById("estado-id");
    if (estadoId) estadoId.value = activos.length > 0 ? activos[0].id : "";

    renderResumenPedidos(data.length, activos.length, entregados.length);
    showMessage(
      "estado-status",
      `Pedidos cargados correctamente. Total: ${data.length}`,
      "success"
    );
  } catch (err) {
    console.error("Error en cargarMisPedidos:", err);
    showMessage("estado-status", "Error al conectar con la API.", "error");
  }
}

// ------------------ CAMBIAR ESTADO ------------------
async function cambiarEstadoPedido() {
  clearMessage("estado-status");

  if (!token) {
    showMessage("estado-status", "Debes iniciar sesión primero.", "error");
    return;
  }

  const id = document.getElementById("estado-id")?.value;
  const estado = document.getElementById("estado-nuevo")?.value;

  if (!id) {
    showMessage("estado-status", "Debes indicar el ID del pedido.", "error");
    return;
  }

  const numId = Number(id);
  const pedido = pedidosCache.find((p) => p.id === numId);

  if (estado === "entregado" && pedido && pedido.metodo_pago === "abono") {
    const confirma = confirm(
      "Este pedido tiene método de pago 'abono'.\n" +
      "¿Confirmas que ya está pagado en su totalidad para marcarlo como ENTREGADO?"
    );
    if (!confirma) {
      showMessage(
        "estado-status",
        "Cambio de estado cancelado por el usuario.",
        "info"
      );
      return;
    }
  }

  try {
    const resp = await fetch(`${BASE_URL}/pedidos/${id}/estado`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      showMessage(
        "estado-status",
        parseErrorMessage(errorText, "Error actualizando estado."),
        "error"
      );
      return;
    }

    const data = await resp.json();
    showMessage("estado-status", `Estado actualizado a: ${data.estado}`, "success");
    await cargarMisPedidos();
  } catch (err) {
    console.error("Error en cambiarEstadoPedido:", err);
    showMessage("estado-status", "Error al conectar con la API.", "error");
  }
}

// ------------------ EXPORTAR A WINDOW ------------------
window.login = login;
window.logout = logout;

window.crearCliente = crearCliente;
window.actualizarCliente = actualizarCliente;
window.cargarClientes = cargarClientes;
window.usarCliente = usarCliente;
window.prepararEdicionCliente = prepararEdicionCliente;
window.cancelarEdicionCliente = cancelarEdicionCliente;
window.eliminarCliente = eliminarCliente;

window.crearProducto = crearProducto;
window.actualizarProducto = actualizarProducto;
window.cargarProductos = cargarProductos;
window.usarProducto = usarProducto;
window.prepararEdicionProducto = prepararEdicionProducto;
window.cancelarEdicionProducto = cancelarEdicionProducto;
window.eliminarProducto = eliminarProducto;

window.crearPedido = crearPedido;
window.cargarMisPedidos = cargarMisPedidos;
window.verDetallePedido = verDetallePedido;
window.cambiarEstadoPedido = cambiarEstadoPedido;

// ------------------ INIT ------------------
window.addEventListener("load", () => {
  setLoggedIn(false);
  setupPasswordEye();
  ensureResumenPedidos();
  updateClienteActionButtons();
  updateProductoActionButtons();
});