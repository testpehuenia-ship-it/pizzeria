"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BEBIDAS_DATA, BebidaDataType } from "@/lib/data";
import { useTiendaStore } from "@/lib/store";
import { generarMensajeWhatsApp } from "@/lib/whatsapp";
import Link from "next/link";
import FooterLegal from "@/components/layout/FooterLegal";

export default function BebidasPage() {
  const router = useRouter();
  const {
    cliente,
    pizzas,
    bebidas,
    combos = [],
    tipoEntrega,
    domicilioEntrega,
    agregarBebida,
    quitarBebida,
    calcularTotal,
    vaciarCarrito,
  } = useTiendaStore();

  const [listaBebidas, setListaBebidas] = useState<BebidaDataType[]>(BEBIDAS_DATA);
  const [filtro, setFiltro] = useState<"todas" | "gaseosa" | "cerveza" | "agua">("todas");
  const total = calcularTotal();

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.catalog?.bebidas && data.catalog.bebidas.length > 0) {
          setListaBebidas(data.catalog.bebidas);
        }
      })
      .catch(() => {});
  }, []);

  const cantidadesMap = bebidas.reduce((acc, b) => {
    acc[b.bebida.id] = b.cantidad;
    return acc;
  }, {} as Record<string, number>);

  const bebidasFiltradas = listaBebidas
    .filter((b) => !b.oculto)
    .filter((b) => {
      if (filtro === "todas") return true;
      return b.categoria === filtro;
    });

  const totalBebidasSeleccionadas = bebidas.reduce((acc, b) => acc + b.cantidad, 0);

  const handleFinalizarWhatsApp = () => {
    if (pizzas.length === 0 && bebidas.length === 0) {
      alert("Tu carrito está vacío. Sumá una pizza o bebida antes de finalizar.");
      return;
    }
    router.push("/pedido");
  };

  const handleEncargarOtraPizza = () => {
    router.push("/menu");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#14532d] pb-32 select-none">
      {/* Header Mobile */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={handleEncargarOtraPizza}
            className="text-xs font-bold text-[#15803d] flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <span>←</span>
            <span>Volver a Pizzas</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#4b6b55]">
              {totalBebidasSeleccionadas} {totalBebidasSeleccionadas === 1 ? "bebida" : "bebidas"}
            </span>
            <span className="text-xs font-mono font-black text-white bg-[#15803d] px-2.5 py-1 rounded-full">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto px-4 pt-6">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
            <span>🥤</span> Bebidas Frías
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#14532d] tracking-tight">
            Elegí tus Bebidas
          </h1>
          <p className="text-xs text-[#4b6b55] mt-1">
            Gaseosas de 500ml y 1.5L, cervezas heladas y aguas minerales
          </p>
        </div>

        {/* Filtros de Categoría */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {[
            { id: "todas", label: "Todas" },
            { id: "gaseosa", label: "Gaseosas" },
            { id: "cerveza", label: "Cervezas" },
            { id: "agua", label: "Aguas" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltro(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filtro === cat.id
                  ? "bg-[#15803d] text-white shadow-sm"
                  : "bg-white text-[#4b6b55] border border-emerald-200/80 hover:bg-emerald-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de Bebidas */}
        <div className="space-y-3">
          {bebidasFiltradas.map((b) => {
            const cantidad = cantidadesMap[b.id] || 0;
            return (
              <div
                key={b.id}
                className={`bg-white border rounded-2xl p-3.5 flex items-center justify-between shadow-sm transition-all ${
                  cantidad > 0 ? "border-[#15803d] shadow-emerald-700/5 bg-emerald-50/20" : "border-emerald-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl shadow-inner overflow-hidden flex-shrink-0">
                    {b.imagenUrl && (b.imagenUrl.startsWith("/") || b.imagenUrl.startsWith("http")) ? (
                      <img
                        src={b.imagenUrl}
                        alt={b.nombre}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span>{b.imagenUrl || "🥤"}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#14532d] leading-tight">
                      {b.nombre}
                    </h3>
                    <p className="text-[11px] text-[#4b6b55] line-clamp-1 mt-0.5">
                      {b.descripcion}
                    </p>
                    <span className="text-sm font-black text-[#15803d] font-mono block mt-0.5">
                      ${b.precio.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                {/* Controles Táctiles + y - */}
                <div className="flex items-center gap-2">
                  {cantidad > 0 ? (
                    <div className="flex items-center gap-2 bg-[#f8fafc] border border-emerald-200 rounded-xl p-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() => quitarBebida(b.id)}
                        className="w-8 h-8 rounded-lg bg-white border border-emerald-200 text-[#14532d] font-black text-sm flex items-center justify-center active:scale-95 shadow-sm"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-sm text-[#14532d]">
                        {cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => agregarBebida(b)}
                        className="w-8 h-8 rounded-lg bg-[#15803d] text-white font-black text-sm flex items-center justify-center active:scale-95 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => agregarBebida(b)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[#15803d] font-bold text-xs hover:bg-[#15803d] hover:text-white transition-all active:scale-95"
                    >
                      + Sumar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Legal con Derechos y Enlace ADNQN.ar */}
      <FooterLegal theme="light" className="mb-24 mt-8" />

      {/* Barra Fija Inferior Mobile: Pedir otro producto o Finalizar Pedido */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-emerald-100 p-4 shadow-[0_-10px_30px_rgba(20,83,45,0.08)] z-50">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-[#4b6b55]">Total Pedido Actual:</span>
            <span className="text-xl font-black text-[#15803d] font-mono">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Botón 1: Pedir o encargar otro producto (vuelve al menú) */}
            <button
              type="button"
              onClick={handleEncargarOtraPizza}
              className="py-3 px-3 rounded-2xl font-bold text-xs text-[#14532d] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <span>🍕 Pedir otra Pizza</span>
            </button>

            {/* Botón 2: Confirmar Entrega y Pedido */}
            <button
              type="button"
              onClick={handleFinalizarWhatsApp}
              className="py-3 px-3 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-lg shadow-emerald-700/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🛵 Elegir Entrega y Pedir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
