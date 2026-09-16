"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundVideo from "@/components/landing/BackgroundVideo";
import { useTiendaStore } from "@/lib/store";
import { salirYCerrarApp } from "@/lib/cerrar-app";
import FooterLegal from "@/components/layout/FooterLegal";

export default function HomePage() {
  const router = useRouter();
  const { cliente, setCliente, cerrarSesion } = useTiendaStore();

  // Estados visuales: "inicio", "registro", "login", "bienvenida"
  const [modo, setModo] = useState<"inicio" | "registro" | "login">("inicio");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Formulario de Alta / Registro
  const [formRegistro, setFormRegistro] = useState({
    nombre: "",
    apellido: "",
    usuario: "",
    password: "",
    direccion: "",
    barrio: "",
    telefono: "",
  });

  // Formulario de Login
  const [formLogin, setFormLogin] = useState({
    usuario: "",
    password: "",
  });

  const handleRegistroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formRegistro),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo completar el registro.");
      }

      // Guardamos la sesión en el store
      setCliente(data.cliente);
      setModo("inicio");

      // Disparar invitación a descargar la App únicamente si AÚN NO la ha descargado ni instalado
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const yaInstaladaODescargada =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true ||
            localStorage.getItem("pwa_installed") === "true" ||
            localStorage.getItem("pwa_downloaded") === "true";

          if (!yaInstaladaODescargada) {
            window.dispatchEvent(new CustomEvent("pwa:trigger-install-prompt"));
          }
        }
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error.");
    } finally {
      setCargando(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formLogin),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo iniciar sesión.");
      }

      setCliente(data.cliente);
      setModo("inicio");
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error.");
    } finally {
      setCargando(false);
    }
  };

  const handleEntrarAlMenu = () => {
    router.push("/menu");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden px-4 py-6 select-none">
      {/* Video de Fondo Nítido y Completo */}
      <BackgroundVideo />

      {/* Header Superior Translúcido */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/40">
          <span className="text-base">🍀</span>
          <span className="text-xs font-black text-white tracking-wide uppercase">
            0600 Boston
          </span>
        </div>

        {cliente && modo === "inicio" && (
          <button
            onClick={() => salirYCerrarApp()}
            className="text-xs font-black text-white bg-gradient-to-r from-red-600 via-rose-600 to-red-500 px-4 py-1.5 rounded-full border border-red-300/40 shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚪</span>
            <span>Salir</span>
          </button>
        )}
      </header>

      {/* ÁREA CENTRAL / INFERIOR */}
      <div className="relative z-10 w-full max-w-md mx-auto pb-4">
        
        {/* CASO 1: Si ya está registrado o logueado -> Mensaje de Bienvenida y Ver Carta */}
        {cliente && modo === "inicio" && (
          <div className="bg-black/15 backdrop-blur-md border border-emerald-400/50 rounded-3xl p-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.5)] text-center fade-in-up">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-emerald-400/60 text-emerald-300 text-xs font-bold mb-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <span>🍀</span>
              <span>Cliente Identificado</span>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight mb-1 drop-shadow-md">
              ¡Hola, <span className="text-emerald-400">{cliente.nombre}</span>!
            </h1>

            <p className="text-xs text-emerald-100/90 mb-4 leading-relaxed drop-shadow-sm">
              Tu pedido llegará a:{" "}
              <strong className="text-white">
                {cliente.direccion} {cliente.barrio ? `(${cliente.barrio})` : ""}
              </strong>
            </p>

            {/* Botón Verde: Ver la Carta y Armar Pedido */}
            <button
              onClick={handleEntrarAlMenu}
              className="w-full py-4 px-6 rounded-2xl font-black text-base text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_10px_25px_rgba(16,185,129,0.4)] border border-emerald-400/50 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ver la Carta & Armar Pedido</span>
              <span className="text-lg">🍕</span>
            </button>

            <button
              onClick={() => setModo("login")}
              className="mt-3 text-[11px] text-emerald-300/90 hover:text-emerald-200 underline cursor-pointer"
            >
              Ingresar con otro usuario
            </button>
          </div>
        )}

        {/* CASO 2: Portada Inicial Limpia -> Dos Botones Transparentes con Marco Verde */}
        {!cliente && modo === "inicio" && (
          <div className="text-center fade-in-up">
            <div className="mb-6">
              <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] tracking-tight">
                0600<span className="text-emerald-400">Boston</span>
              </h1>
              <p className="text-xs text-white/90 drop-shadow-md font-semibold mt-1">
                Gran Variedad de pizzas Artesanales
              </p>
            </div>

            {/* Dos Botones Transparentes con Marco Redondeado Verde */}
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setModo("registro");
                }}
                className="py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-black/20 backdrop-blur-sm border-2 border-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Crear Cuenta</span>
                <span>✨</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setModo("login");
                }}
                className="py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-black/20 backdrop-blur-sm border-2 border-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.4)] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Inicio</span>
                <span>🔑</span>
              </button>
            </div>
          </div>
        )}

        {/* CASO 3: Formulario de Alta / Registro de Cliente */}
        {modo === "registro" && (
          <div className="bg-black/20 backdrop-blur-md border border-emerald-400/50 rounded-3xl p-5 sm:p-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.6)] text-left fade-in-up">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-500/30 pb-2">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                  <span>🍀</span>
                  <span>Crear Cuenta de Cliente</span>
                </h2>
                <p className="text-[11px] text-emerald-200/80">
                  Completá tus datos para disfrutar 0600Boston
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModo("inicio")}
                className="text-white/70 hover:text-white text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full"
              >
                ✕ Volver
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 bg-red-900/60 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegistroSubmit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={formRegistro.nombre}
                    onChange={(e) => setFormRegistro({ ...formRegistro, nombre: e.target.value })}
                    placeholder="Ej: Juan"
                    className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={formRegistro.apellido}
                    onChange={(e) => setFormRegistro({ ...formRegistro, apellido: e.target.value })}
                    placeholder="Ej: Pérez"
                    className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                    Usuario
                  </label>
                  <input
                    type="text"
                    required
                    value={formRegistro.usuario}
                    onChange={(e) => setFormRegistro({ ...formRegistro, usuario: e.target.value })}
                    placeholder="juanperez"
                    className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={formRegistro.password}
                    onChange={(e) => setFormRegistro({ ...formRegistro, password: e.target.value })}
                    placeholder="••••••"
                    className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                    Dirección
                  </label>
                  <input
                    type="text"
                    required
                    value={formRegistro.direccion}
                    onChange={(e) => setFormRegistro({ ...formRegistro, direccion: e.target.value })}
                    placeholder="Av. San Martín 450"
                    className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                    Barrio
                  </label>
                  <input
                    type="text"
                    required
                    value={formRegistro.barrio}
                    onChange={(e) => setFormRegistro({ ...formRegistro, barrio: e.target.value })}
                    placeholder="Centro"
                    className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-0.5">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={formRegistro.telefono}
                  onChange={(e) => setFormRegistro({ ...formRegistro, telefono: e.target.value })}
                  placeholder="Ej: 02942-661000"
                  className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full mt-2 py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {cargando ? "Guardando en Base de Datos..." : "Completar Registro ✨"}
              </button>
            </form>
          </div>
        )}

        {/* CASO 4: Formulario de Inicio de Sesión (x Usuario) */}
        {modo === "login" && (
          <div className="bg-black/20 backdrop-blur-md border border-emerald-400/50 rounded-3xl p-5 sm:p-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.6)] text-left fade-in-up">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-500/30 pb-2">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-1.5">
                  <span>🔑</span>
                  <span>Iniciar Sesión</span>
                </h2>
                <p className="text-[11px] text-emerald-200/80">
                  Ingresa con tu usuario registrado
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModo("inicio")}
                className="text-white/70 hover:text-white text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full"
              >
                ✕ Volver
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 bg-red-900/60 border border-red-500 text-red-200 text-xs px-3 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  value={formLogin.usuario}
                  onChange={(e) => setFormLogin({ ...formLogin, usuario: e.target.value })}
                  placeholder="Tu nombre de usuario"
                  className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formLogin.password}
                  onChange={(e) => setFormLogin({ ...formLogin, password: e.target.value })}
                  placeholder="••••••"
                  className="w-full bg-black/40 border border-emerald-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full mt-2 py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {cargando ? "Verificando..." : "Ingresar a Mi Cuenta →"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setModo("registro");
                  }}
                  className="text-xs text-emerald-300 hover:underline"
                >
                  ¿No tienes cuenta? Registrate aquí
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer Legal con Derechos y Enlace ADNQN.ar */}
      <FooterLegal theme="dark" className="relative z-10 mt-6" />
    </div>
  );
}