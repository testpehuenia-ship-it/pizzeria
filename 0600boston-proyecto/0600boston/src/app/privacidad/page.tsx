"use client";

import React, { useState } from "react";
import Link from "next/link";
import FooterLegal from "@/components/layout/FooterLegal";

export default function PrivacidadPage() {
  const [limpiado, setLimpiado] = useState(false);

  const handleLimpiarMisDatos = () => {
    if (
      confirm(
        "¿Deseas eliminar tus datos guardados en este dispositivo (carrito, usuario recordado y preferencias)? Esta acción es irreversible."
      )
    ) {
      localStorage.clear();
      sessionStorage.clear();
      setLimpiado(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f141f] text-slate-100 flex flex-col justify-between select-none">
      {/* Barra de Navegación Superior */}
      <header className="sticky top-0 z-40 bg-[#151f2e]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-emerald-400 transition-colors">
            <span className="text-xl">🍀</span>
            <span className="font-black text-lg tracking-tight">
              0600<span className="text-emerald-400">Boston</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/menu"
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              Ver Menú 🍕
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal Legal */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8 flex-1">
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <span>🛡️</span>
            <span>Cumplimiento Legal RGPD (UE) & LGPD (LatAm)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            En <strong>0600Boston</strong> nos tomamos muy en serio la seguridad y confidencialidad de tu información personal de acuerdo con los estándares internacionales más rigurosos.
          </p>
        </div>

        {limpiado && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs text-center font-bold animate-pulse">
            ✅ Se han eliminado con éxito todos tus datos locales de este dispositivo. Redirigiendo al inicio...
          </div>
        )}

        {/* Artículos y Cláusulas */}
        <div className="space-y-6 bg-[#151f2e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* 1. Responsable del Tratamiento */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">1.</span>
              <span>Responsable del Tratamiento de Datos</span>
            </h2>
            <p>
              El responsable del tratamiento de los datos recabados en esta plataforma web y PWA es <strong>0600Boston</strong> (en adelante, "la Pizzería"), con domicilio operativo en Buenos Aires, Argentina. Para cualquier consulta o ejercicio de derechos, podés contactarnos directamente a través de nuestros canales oficiales de WhatsApp o por correo electrónico.
            </p>
          </section>

          {/* 2. Marco Normativo Aplicable */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">2.</span>
              <span>Marco Legal (RGPD, LGPD y Ley 25.326)</span>
            </h2>
            <p>
              Esta política cumple expresamente con:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-400">
              <li>
                <strong>RGPD (Reglamento General de Protección de Datos de la Unión Europea 2016/679):</strong> Principios de licitud, lealtad, transparencia, minimización de datos y limitación del plazo de conservación.
              </li>
              <li>
                <strong>LGPD (Lei Geral de Proteção de Dados - Brasil, Ley 13.709/2018):</strong> Protección de los derechos fundamentales de libertad, privacidad y el libre desarrollo de la personalidad.
              </li>
              <li>
                <strong>Ley 25.326 de Protección de Datos Personales (República Argentina):</strong> Garantía de confidencialidad, no comercialización a terceros y derecho de acceso y supresión.
              </li>
            </ul>
          </section>

          {/* 3. Datos que Recopilamos y Finalidad */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">3.</span>
              <span>Datos Recabados y Finalidad del Uso</span>
            </h2>
            <p>
              Solo recopilamos los datos estrictamente necesarios para prestar el servicio gastronómico:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[#0d141e] border border-white/5 space-y-1">
                <span className="font-bold text-white text-xs block">📦 Despacho de Pedidos:</span>
                <p className="text-[11px] text-slate-400">
                  Nombre, teléfono, dirección y barrio para coordinar la entrega o retiro en sucursal mediante WhatsApp.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0d141e] border border-white/5 space-y-1">
                <span className="font-bold text-white text-xs block">🛒 Carrito y Preferencias:</span>
                <p className="text-[11px] text-slate-400">
                  Pizzas decoradas, ingredientes elegidos y bebidas seleccionadas, conservados localmente para tu comodidad.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0d141e] border border-white/5 space-y-1">
                <span className="font-bold text-white text-xs block">🔔 Notificaciones Push Voluntarias:</span>
                <p className="text-[11px] text-slate-400">
                  Token de suscripción anónimo únicamente si aceptas explícitamente recibir novedades y promociones.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#0d141e] border border-white/5 space-y-1">
                <span className="font-bold text-white text-xs block">🚫 Sin Venta a Terceros:</span>
                <p className="text-[11px] text-slate-400">
                  Tus datos jamás se venden, ceden ni transfieren a redes publicitarias o corredores de datos externos.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Derechos ARCO y Ejercicio del Titular */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">4.</span>
              <span>Tus Derechos (Acceso, Rectificación y Supresión)</span>
            </h2>
            <p>
              Tenés derecho en todo momento a acceder a tus datos, solicitar su rectificación o exigir su eliminación total de nuestros registros (*Derecho al Olvido*):
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-black/30 border border-emerald-500/30">
              <div>
                <span className="font-black text-white block text-xs">
                  ¿Deseas borrar tus datos locales de este navegador?
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Elimina tu sesión de cliente, historial de pedidos y carrito en un solo clic.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLimpiarMisDatos}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                🗑️ Borrar Mis Datos Locales
              </button>
            </div>
          </section>

          {/* 5. Almacenamiento y Seguridad Técnica */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">5.</span>
              <span>Medidas de Seguridad y Encriptación</span>
            </h2>
            <p>
              Implementamos protocolos criptográficos SSL/TLS de grado bancario (HTTPS obligatorio con HSTS), protección contra ataques CSRF/XSS, limitación de subida de archivos con validación MIME estricta y aislamiento de credenciales en variables de entorno cifradas en la nube de Vercel y Turso DB.
            </p>
          </section>

          {/* 6. Desarrollo y Producción Tecnológica */}
          <section className="space-y-2 pt-2 border-t border-white/10">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span className="text-emerald-400">6.</span>
              <span>Créditos y Producción Tecnológica</span>
            </h2>
            <p>
              Esta plataforma web y aplicación progresiva (PWA) de comercio directo fue diseñada y desarrollada por{" "}
              <a
                href="https://adnqn.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-emerald-400 hover:text-emerald-300 underline"
              >
                ADNQN.ar
              </a>
              , garantizando el cumplimiento de estándares modernos de accesibilidad, velocidad, seguridad y privacidad de datos.
            </p>
          </section>
        </div>

        {/* Botón de Retorno */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <span>←</span>
            <span>Volver a la portada de 0600Boston</span>
          </Link>
        </div>
      </main>

      {/* Footer Legal Global */}
      <FooterLegal theme="dark" />
    </div>
  );
}
