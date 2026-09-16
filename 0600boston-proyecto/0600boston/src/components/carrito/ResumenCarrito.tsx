"use client";

import React, { useState } from "react";
import { useTiendaStore } from "@/lib/store";
import { AnimacionCaja } from "./AnimacionCaja";
import Link from "next/link";

export function ResumenCarrito() {
  const { pizzas, bebidas, combos = [], quitarPizza, quitarBebida, quitarCombo, calcularTotal } = useTiendaStore();
  const [mostrarModal, setMostrarModal] = useState(false);
  const total = calcularTotal();

  const totalItems =
    pizzas.length +
    bebidas.reduce((acc, b) => acc + b.cantidad, 0) +
    combos.reduce((acc, c) => acc + c.cantidad, 0);

  if (totalItems === 0) {
    return (
      <div className="w-full max-w-md mx-auto my-8 bg-white border border-emerald-100 rounded-3xl p-8 text-center text-[#4b6b55] shadow-sm">
        <span className="text-4xl block mb-2">🛒</span>
        <h3 className="text-base font-bold text-[#14532d] mb-1">Tu carrito está vacío</h3>
        <p className="text-xs text-[#4b6b55] mb-4">¡Elegí tu pizza favorita en el menú para comenzar!</p>
        <Link
          href="/menu"
          className="inline-block py-2.5 px-5 rounded-full bg-[#15803d] text-white text-xs font-bold shadow-md shadow-emerald-700/20"
        >
          Ir al Menú 🍕
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto my-4 bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
          <h3 className="text-base font-extrabold text-[#14532d] flex items-center gap-2">
            <span>🛒 Tu Pedido</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono font-bold">
              {totalItems}
            </span>
          </h3>
          <Link
            href="/bebidas"
            className="text-xs font-bold text-[#15803d] hover:underline"
          >
            + Sumar Bebidas
          </Link>
        </div>

        {/* Lista de Pizzas */}
        {pizzas.length > 0 && (
          <div className="space-y-2.5 mb-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4b6b55]">
              Pizzas seleccionadas:
            </h4>
            {pizzas.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#f8fafc] border border-emerald-100"
              >
                <div className="flex-1 pr-3">
                  <div className="font-extrabold text-[#14532d] text-xs flex items-center gap-2">
                    {item.pizza.imagen && (item.pizza.imagen.startsWith("/") || item.pizza.imagen.startsWith("http")) ? (
                      <img
                        src={item.pizza.imagen}
                        alt={item.pizza.nombre}
                        className="w-6 h-6 rounded-lg object-cover shrink-0 border border-emerald-300 shadow-xs"
                      />
                    ) : (
                      <span>{item.pizza.imagen || "🍕"}</span>
                    )}
                    <span>{item.pizza.nombre}</span>
                    <span className="text-[11px] font-normal text-[#15803d]">
                      ({item.tamaño} porciones)
                    </span>
                  </div>
                  {item.aderezos.length > 0 && (
                    <div className="text-[10px] text-[#4b6b55] mt-0.5 line-clamp-1">
                      Topping: {item.aderezos.join(", ")}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-[#14532d]">
                    ${item.precio.toLocaleString("es-AR")}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarPizza(idx)}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Bebidas */}
        {bebidas.length > 0 && (
          <div className="space-y-2.5 mb-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4b6b55]">
              Bebidas:
            </h4>
            {bebidas.map((item) => (
              <div
                key={item.bebida.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#f8fafc] border border-emerald-100"
              >
                <div>
                  <span className="font-extrabold text-[#14532d] text-xs">
                    🥤 {item.cantidad}x {item.bebida.nombre}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-[#14532d]">
                    ${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarBebida(item.bebida.id)}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    -1
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista de Combos */}
        {combos.length > 0 && (
          <div className="space-y-2.5 mb-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4b6b55]">
              Combos Especiales:
            </h4>
            {combos.map((item) => (
              <div
                key={item.combo.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#f8fafc] border border-emerald-100"
              >
                <div className="flex-1 pr-3">
                  <span className="font-extrabold text-[#14532d] text-xs block">
                    🎁 {item.cantidad}x {item.combo.nombre}
                  </span>
                  <p className="text-[10px] text-[#4b6b55] mt-0.5">
                    {item.combo.pizzaNombre} + {item.combo.bebidaNombre}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-xs text-[#14532d]">
                    ${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarCombo(item.combo.id)}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded-lg"
                  >
                    -1
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total y Acciones */}
        <div className="pt-3 border-t border-emerald-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[#4b6b55]">Total a Pagar:</span>
            <span className="text-2xl font-black text-[#15803d] font-mono">
              ${total.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/menu"
              className="py-3 px-2 rounded-2xl text-center font-bold text-xs text-[#14532d] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all"
            >
              + Más Pizzas
            </Link>

            <Link
              href="/pedido"
              className="py-3 px-2 rounded-2xl text-center font-black text-xs text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-md shadow-emerald-700/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              Finalizar Pedido →
            </Link>
          </div>
        </div>
      </div>

      {mostrarModal && <AnimacionCaja onCerrar={() => setMostrarModal(false)} />}
    </>
  );
}