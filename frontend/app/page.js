"use client";

import { useEffect, useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [token, setToken] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMensaje("");

    if (!username || !password) {
      setMensaje("Debes ingresar usuario y contraseña.");
      setTipoMensaje("error");
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
        let detail = "Login incorrecto.";
        try {
          const data = JSON.parse(errorText);
          detail = data.detail || detail;
        } catch { }
        setMensaje(detail);
        setTipoMensaje("error");
        return;
      }

      const data = await resp.json();
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      setMensaje(`Sesión iniciada correctamente como ${username}`);
      setTipoMensaje("success");
      setPassword("");
    } catch (error) {
      console.error(error);
      setMensaje("Error al conectar con la API.");
      setTipoMensaje("error");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setUsername("");
    setPassword("");
    setMensaje("Sesión cerrada.");
    setTipoMensaje("info");
  }

  return (
    <main>
      <h2>Inicio / Login</h2>

      <form onSubmit={handleLogin} style={{ maxWidth: "520px" }}>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
            Usuario
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: larryadmin"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
          <button
            type="submit"
            style={{
              background: "#7c3aed",
              color: "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Iniciar sesión
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "#e5e7eb",
              color: "#111827",
              border: "none",
              padding: "10px 18px",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </form>

      {mensaje && (
        <div
          style={{
            marginTop: "18px",
            padding: "12px",
            borderRadius: "10px",
            background:
              tipoMensaje === "success"
                ? "#dcfce7"
                : tipoMensaje === "error"
                  ? "#fee2e2"
                  : "#ede9fe",
            color:
              tipoMensaje === "success"
                ? "#166534"
                : tipoMensaje === "error"
                  ? "#991b1b"
                  : "#5b21b6",
            border:
              tipoMensaje === "success"
                ? "1px solid #86efac"
                : tipoMensaje === "error"
                  ? "1px solid #fca5a5"
                  : "1px solid #c4b5fd",
            fontWeight: "bold",
          }}
        >
          {mensaje}
        </div>
      )}

      {token && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontWeight: "bold" }}>Token activo:</p>
          <textarea
            readOnly
            value={token}
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #ccc",
            }}
          />
        </div>
      )}
    </main>
  );
}