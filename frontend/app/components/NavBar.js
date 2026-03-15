"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
    const pathname = usePathname();

    const linkStyle = (href) => ({
        padding: "10px 16px",
        borderRadius: "999px",
        textDecoration: "none",
        fontWeight: "bold",
        color: pathname === href ? "white" : "#111827",
        background: pathname === href ? "#7c3aed" : "#e5e7eb",
        display: "inline-block",
    });

    return (
        <nav
            style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "24px",
            }}
        >
            <Link href="/" style={linkStyle("/")}>
                Inicio
            </Link>
            <Link href="/clientes" style={linkStyle("/clientes")}>
                Clientes
            </Link>
            <Link href="/productos" style={linkStyle("/productos")}>
                Productos
            </Link>
            <Link href="/pedidos" style={linkStyle("/pedidos")}>
                Pedidos
            </Link>
        </nav>
    );
}