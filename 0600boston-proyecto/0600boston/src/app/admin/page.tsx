"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async () => {
    setError(null);
    setCargando(true);

    try {
      // 1. Intentar validar con la API del servidor
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuario.trim() || "admin",
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("adminAuth0600", "true");
          localStorage.setItem("adminCurrentUser", JSON.stringify(data.user));
          localStorage.setItem("adminCurrentUsername", data.user.usuario);
        }
        router.push("/admin/dashboard");
        return;
      }

      // 2. Fallback local de emergencia si el servidor responde con error de contraseña
      const passwordGuardado = typeof window !== "undefined" ? localStorage.getItem("adminPassword0600") : null;
      if (
        (usuario.toLowerCase() === "admin" || !usuario) &&
        (password === passwordGuardado || password === "0600boston")
      ) {
        if (typeof window !== "undefined") {
          localStorage.setItem("adminAuth0600", "true");
          localStorage.setItem(
            "adminCurrentUser",
            JSON.stringify({ usuario: "admin", nombre: "Administrador Principal", rol: "admin" })
          );
          localStorage.setItem("adminCurrentUsername", "admin");
        }
        router.push("/admin/dashboard");
        return;
      }

      setError(data.error || "Usuario o contraseña incorrectos");
    } catch {
      // 3. Fallback si no hay conexión a internet / servidor
      const passwordGuardado = typeof window !== "undefined" ? localStorage.getItem("adminPassword0600") : null;
      if (password === passwordGuardado || password === "0600boston") {
        if (typeof window !== "undefined") {
          localStorage.setItem("adminAuth0600", "true");
          localStorage.setItem(
            "adminCurrentUser",
            JSON.stringify({ usuario: "admin", nombre: "Administrador Principal", rol: "admin" })
          );
          localStorage.setItem("adminCurrentUsername", "admin");
        }
        router.push("/admin/dashboard");
      } else {
        setError("Error de conexión y contraseña incorrecta");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f141f] flex items-center justify-center p-4">
      <div className="bg-[#182030] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl fade-in-up">
        <div className="text-center mb-6">
          <span className="text-4xl inline-block mb-1">🔐</span>
          <h2 className="text-2xl font-extrabold text-white">Panel de Administración</h2>
          <p className="text-xs text-slate-400 mt-1">Ingresá tu usuario y clave de acceso</p>
        </div>

        {error && (
          <div className="mb-4 text-rose-400 text-xs text-center bg-rose-500/10 border border-rose-500/20 py-2.5 px-3 rounded-xl">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            manejarLogin();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className="w-full bg-[#0d121c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
              placeholder="Ej: admin"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0d121c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="Clave inicial: 0600boston"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 py-3.5 rounded-xl font-black shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-[0.99] transition-all text-sm disabled:opacity-50 cursor-pointer"
          >
            {cargando ? "Validando acceso..." : "Ingresar al Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}