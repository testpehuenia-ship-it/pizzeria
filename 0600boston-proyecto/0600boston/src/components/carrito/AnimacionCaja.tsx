"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTiendaStore } from "@/lib/store";
import { generarMensajeWhatsApp } from "@/lib/whatsapp";

interface AnimacionCajaProps {
  pizzaNombre?: string;
  onCerrar: () => void;
}

export function AnimacionCaja({ pizzaNombre, onCerrar }: AnimacionCajaProps) {
  const router = useRouter();
  const {
    cliente,
    pizzas,
    bebidas,
    tipoEntrega,
    domicilioEntrega,
    calcularTotal,
    vaciarCarrito,
  } = useTiendaStore();

  const [fase, setFase] = useState<"empaque" | "consulta">("empaque");
  const total = calcularTotal();

  // Al abrirse, muestra la preparación en caja durante 1.2s y luego pasa a la consulta
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFase("consulta");
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleIrABebidas = () => {
    onCerrar();
    router.push("/bebidas");
  };

  const handleIrAPedido = () => {
    onCerrar();
    router.push("/pedido");
  };

  const handleSeguirPidiendo = () => {
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_25px_60px_rgba(20,83,45,0.25)] text-center fade-in-up">
        
        {fase === "empaque" ? (
          <div className="py-4">
            {/* Animación de la Caja cerrándose y subiendo al carrito */}
            <div className="relative w-36 h-36 mx-auto mb-4 flex items-center justify-center">
              {/* Vapores de calor */}
              <div className="absolute -top-3 flex gap-2 justify-center w-full">
                <span className="text-xl animate-bounce" style={{ animationDuration: "0.8s" }}>♨️</span>
                <span className="text-xl animate-bounce" style={{ animationDuration: "1.1s" }}>♨️</span>
              </div>

              {/* Caja de Pizza 0600Boston con trébol */}
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#c9935a] via-[#a66e38] to-[#78350f] border-2 border-emerald-600/60 shadow-xl flex flex-col items-center justify-center relative animate-pulse-subtle">
                <span className="text-4xl drop-shadow">🍕</span>
                <div className="mt-1 bg-white/95 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest text-[#15803d] shadow-sm uppercase flex items-center gap-1">
                  <span>🍀</span> 0600BOSTON
                </div>
              </div>
            </div>

            <h3 className="text-xl font-extrabold text-[#14532d] mb-1">
              ¡Guardando en la caja!
            </h3>
            <p className="text-xs text-[#4b6b55]">
              {pizzaNombre ? `Preparando ${pizzaNombre} y subiendo al pedido...` : "Subiendo pizza al carrito..."}
            </p>
          </div>
        ) : (
          /* Consulta por bebidas o finalizar pedido */
          <div className="py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              ✨
            </div>

            <h3 className="text-xl font-black text-[#14532d] mb-1.5">
              ¿Deseas agregar bebidas?
            </h3>
            <p className="text-xs text-[#4b6b55] mb-6 leading-relaxed">
              Podés sumar gaseosas, aguas o cervezas bien frías para acompañar tus pizzas.
            </p>

            <div className="space-y-2.5">
              {/* Opción 1: Ir a Bebidas */}
              <button
                type="button"
                onClick={handleIrABebidas}
                className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-md shadow-emerald-700/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>🥤 Ver Carta de Bebidas</span>
              </button>

              {/* Opción 2: Confirmar Dirección (Registrada vs Celular GPS) y Pedido */}
              <button
                type="button"
                onClick={handleIrAPedido}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-md shadow-emerald-700/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🛵 Elegir Entrega y Pedir (${total.toLocaleString("es-AR")})</span>
              </button>

              {/* Opción 3: Seguir en el Menú */}
              <button
                type="button"
                onClick={handleSeguirPidiendo}
                className="w-full py-2 text-xs font-semibold text-[#4b6b55] hover:text-[#14532d] transition-colors"
              >
                ← Seguir agregando pizzas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}