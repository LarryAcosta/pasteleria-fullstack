import NavBar from "./components/NavBar";

export const metadata = {
  title: "Gestor de Pedidos Pastelería",
  description: "Frontend en Next.js conectado a FastAPI y PostgreSQL",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#f5f3ff",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
          <h1 style={{ marginBottom: "8px" }}>Gestor de Pedidos Pastelería</h1>
          <p style={{ color: "#6b7280", marginTop: 0 }}>
            Next.js + FastAPI + PostgreSQL
          </p>

          <NavBar />

          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            }}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}