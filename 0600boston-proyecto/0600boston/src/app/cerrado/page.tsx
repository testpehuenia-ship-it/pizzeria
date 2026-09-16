"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import FooterLegal from "@/components/layout/FooterLegal";

export default function CerradoPage() {
  const [intentadoCierre, setIntentadoCierre] = useState(false);

  useEffect(() => {
    // Intentar cerrar la pestaña / app automáticamente al ingresar si es standalone PWA
    try {
      window.close();
    } catch {}
  }, []);

  const handleCerrarVentana = () => {
    setIntentadoCierre(true);

    // 1. Intentos de cierre por API del navegador
    try {
      window.close();
    } catch {}
    try {
      window.open("", "_self")?.close();
    } catch {}

    // 2. Si la política de seguridad del navegador bloquea scripts para cerrar pestañas directas:
    // Redirigir a una página en blanco limpia para salir del dominio 0600Boston
    setTimeout(() => {
      try {
        window.location.replace("about:blank");
      } catch {}
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#0a0f17] text-white flex items-center justify-center p-4 select-none">
      <div className="max-w-md w-full bg-[#131d2a] border border-red-500/30 rounded-3xl p-7 text-center shadow-[0_20px_50px_rgba(239,68,68,0.15)] space-y-4 fade-in-up">
        {/* Icono de Salida Destacado */}
        <div className="w-18 h-18 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-4xl shadow-inner animate-pulse-subtle">
          🚪
        </div>

        <div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-500/15 px-3 py-1 rounded-full border border-red-500/30 mb-2">
            Aplicación Cerrada
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            ¡Gracias por visitarnos!
          </h1>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Has salido de <strong>0600Boston</strong>. Tu sesión y pedidos activos han finalizado y tus datos se han limpiado.
          </p>
        </div>

        {/* Guía Clara de Cierre de Pestaña */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-[11px] text-slate-300 leading-relaxed text-left space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span>✅</span>
            <span>Sesión finalizada y carrito vaciado</span>
          </div>
          <p className="text-slate-400 text-[10.5px]">
            Hacé click en el botón rojo abajo para salir a pantalla en blanco, o cerrá esta pestaña presionando <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-600 rounded text-white font-mono font-bold">Ctrl+W</kbd> (o tocando la <strong className="text-white">✕</strong> de tu navegador).
          </p>
        </div>

        <div className="pt-1 space-y-2.5">
          <button
            type="button"
            onClick={handleCerrarVentana}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black shadow-lg shadow-red-700/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚪</span>
            <span>{intentadoCierre ? "Saliendo..." : "Cerrar esta Ventana / Pestaña"}</span>
          </button>

          <Link
            href="/"
            className="block w-full py-2.5 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-bold transition-all text-center"
          >
            🍀 Volver a Abrir la App
          </Link>
        </div>

        <div className="pt-2 border-t border-white/5">
          <FooterLegal theme="dark" className="bg-transparent border-0 py-1" />
        </div>
      </div>
    </div>
  );
}
