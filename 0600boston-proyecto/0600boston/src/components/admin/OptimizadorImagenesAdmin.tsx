"use client";

import React, { useState } from "react";

interface OptimizadorImagenesAdminProps {
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
  onRecargarCatalogo: () => void;
}

export function OptimizadorImagenesAdmin({
  onMostrarNotificacion,
  onRecargarCatalogo,
}: OptimizadorImagenesAdminProps) {
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{
    totalProcesadas: number;
    totalSavedKb: number;
    detalles: Array<{ file: string; originalSize: number; newSize: number; savedKb: number }>;
    mensaje: string;
  } | null>(null);

  const ejecutarOptimizacionEnLote = async () => {
    setProcesando(true);
    setResultado(null);

    try {
      const res = await fetch("/api/admin/optimize-images", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al optimizar imágenes");

      setResultado(data);
      onMostrarNotificacion(data.mensaje, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de la Herramienta */}
      <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-4xl">⚡</span>
            <div>
              <h2 className="text-xl font-black text-white">
                Optimización Automática y Remoción de Fondo (Transparencia)
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Esta herramienta procesa todas las imágenes ya cargadas en el servidor con{" "}
                <strong className="text-emerald-300">Sharp</strong>: remueve fondos blancos/sólidos dejando un canal alfa transparente, recorta márgenes vacíos (trim) y reduce el peso hasta un 90% para que no tapen la pizza o el fondo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={ejecutarOptimizacionEnLote}
            disabled={procesando}
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap flex items-center gap-2"
          >
            <span>{procesando ? "Procesando imágenes..." : "⚡ Ejecutar en Todas las Imágenes"}</span>
          </button>
        </div>

        {/* Pilares del sistema de imágenes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-[#0d141e] border border-white/5 rounded-2xl p-3.5">
            <span className="text-xl block mb-1">🧼</span>
            <h4 className="font-bold text-white text-xs">Fondo Transparente</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Detección de bordes y chroma key para eliminar cualquier fondo blanco o sólido.
            </p>
          </div>

          <div className="bg-[#0d141e] border border-white/5 rounded-2xl p-3.5">
            <span className="text-xl block mb-1">📐</span>
            <h4 className="font-bold text-white text-xs">Recorte Ceñido (Trim)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ajusta el recuadro justo al contorno del ingrediente o pizza sin márgenes innecesarios.
            </p>
          </div>

          <div className="bg-[#0d141e] border border-white/5 rounded-2xl p-3.5">
            <span className="text-xl block mb-1">🚀</span>
            <h4 className="font-bold text-white text-xs">Carga Ultrarrápida</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Compresión PNG y WebP que convierte imágenes de 1MB a 50KB con máxima fidelidad visual.
            </p>
          </div>
        </div>

        {/* Resultados del procesamiento */}
        {resultado && (
          <div className="bg-[#0d141e] border border-emerald-500/30 rounded-2xl p-4 mt-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-black text-emerald-400">
                ✓ {resultado.mensaje}
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                Ahorro total: {resultado.totalSavedKb} KB
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto no-scrollbar">
              {resultado.detalles.map((d, idx) => (
                <div
                  key={idx}
                  className="bg-[#151f2e] border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-white block truncate">{d.file}</span>
                    <span className="text-[10px] text-slate-400">
                      {Math.round(d.originalSize / 1024)} KB → {Math.round(d.newSize / 1024)} KB
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 whitespace-nowrap">
                    -{d.savedKb} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
