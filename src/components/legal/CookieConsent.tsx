"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [mostrarModalAjustes, setMostrarModalAjustes] = useState(false);

  // Opciones de configuración
  const [permitirAnaliticas, setPermitirAnaliticas] = useState(true);
  const [permitirPush, setPermitirPush] = useState(true);

  useEffect(() => {
    setMounted(true);
    const estado = localStorage.getItem("rgpd_consent_status");
    if (!estado) {
      // Pequeño delay de 1 segundo para no abrumar al ingresar
      const timer = setTimeout(() => {
        setMostrarBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!mounted || !mostrarBanner) return null;

  const handleAceptarTodo = () => {
    localStorage.setItem("rgpd_consent_status", "accepted");
    localStorage.setItem("rgpd_analytics_consent", "true");
    localStorage.setItem("rgpd_push_consent", "true");
    setMostrarBanner(false);
  };

  const handleSoloNecesarias = () => {
    localStorage.setItem("rgpd_consent_status", "essential_only");
    localStorage.setItem("rgpd_analytics_consent", "false");
    localStorage.setItem("rgpd_push_consent", "false");
    setMostrarBanner(false);
  };

  const handleGuardarPersonalizado = () => {
    localStorage.setItem("rgpd_consent_status", "custom");
    localStorage.setItem("rgpd_analytics_consent", permitirAnaliticas ? "true" : "false");
    localStorage.setItem("rgpd_push_consent", permitirPush ? "true" : "false");
    setMostrarModalAjustes(false);
    setMostrarBanner(false);
  };

  return (
    <>
      {/* Banner Flotante Inferior */}
      <div className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-auto sm:right-4 z-50 max-w-lg bg-[#0d141e]/95 backdrop-blur-md border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl text-slate-200 text-xs animate-fade-in select-none">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🍪</span>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-black text-white text-sm flex items-center gap-1.5">
              <span>Privacidad & Cookies</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                RGPD / LGPD
              </span>
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              En <strong>0600Boston</strong> utilizamos almacenamiento local y cookies técnicas para recordar tu pedido, guardar tu carrito y ofrecerte la mejor experiencia gastronómica. Cumplimos con las normativas internacionales de protección de datos (RGPD de la UE y LGPD).
            </p>
            <div className="text-[10px] text-emerald-400 font-semibold">
              <Link href="/privacidad" className="hover:underline flex items-center gap-1">
                <span>📄 Consultar Política de Privacidad y Derechos de Datos</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setMostrarModalAjustes(true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            ⚙️ Personalizar
          </button>
          <button
            type="button"
            onClick={handleSoloNecesarias}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            Solo Necesarias
          </button>
          <button
            type="button"
            onClick={handleAceptarTodo}
            className="px-4 py-1.5 rounded-xl text-[11px] font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            Aceptar Todo
          </button>
        </div>
      </div>

      {/* Modal de Preferencias Detalladas */}
      {mostrarModalAjustes && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>⚙️</span>
                <span>Configurar Preferencias de Privacidad</span>
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalAjustes(false)}
                className="text-slate-400 hover:text-white font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              {/* Cookies Técnicas (Obligatorias) */}
              <div className="p-3 rounded-2xl bg-[#0d141e] border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <span>Técnicas y de Carrito</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-black">
                      Obligatorias
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Necesarias para mantener tu sesión, recordar tu carrito y procesar tu pedido vía WhatsApp.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="rounded border-white/20 text-emerald-500 mt-1 cursor-not-allowed"
                />
              </div>

              {/* Notificaciones Push */}
              <div className="p-3 rounded-2xl bg-[#0d141e] border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <h5 className="font-bold text-white">Notificaciones Push & Ofertas</h5>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Permite enviarte avisos de pizzas calientes, combos especiales y estado de promociones.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permitirPush}
                  onChange={(e) => setPermitirPush(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-0 mt-1 cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Analíticas */}
              <div className="p-3 rounded-2xl bg-[#0d141e] border border-white/10 flex items-start justify-between gap-3">
                <div>
                  <h5 className="font-bold text-white">Rendimiento y Métricas Anónimas</h5>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nos ayuda a mejorar la velocidad y detectar fallas sin recopilar datos de identificación personal.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={permitirAnaliticas}
                  onChange={(e) => setPermitirAnaliticas(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-emerald-500 focus:ring-0 mt-1 cursor-pointer accent-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarModalAjustes(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarPersonalizado}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                Guardar Preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
