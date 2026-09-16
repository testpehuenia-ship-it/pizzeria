"use client";

import { BEBIDAS_DATA, BebidaDataType } from "@/lib/data";

interface BebidasSectionProps {
  onAgregarBebida: (bebida: BebidaDataType) => void;
  onQuitarBebida: (bebidaId: string) => void;
  cantidades: Record<string, number>;
}

export function BebidasSection({
  onAgregarBebida,
  onQuitarBebida,
  cantidades,
}: BebidasSectionProps) {
  return (
    <div className="w-full max-w-4xl mx-auto my-10">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
        <div>
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🥤 Bebidas Frías</span>
          </h3>
          <p className="text-xs text-slate-400">
            Acompañá tus pizzas con gaseosas, aguas y cervezas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {BEBIDAS_DATA.map((b) => {
          const qty = cantidades[b.id] || 0;
          return (
            <div
              key={b.id}
              className={`bg-[#121826]/80 border rounded-2xl p-4 flex flex-col justify-between transition-all backdrop-blur-md ${
                qty > 0
                  ? "border-[#ff5f3b]/70 bg-[#1c2438]/90 shadow-lg shadow-[#ff5f3b]/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <div>
                <div className="text-2xl mb-1">
                  {b.categoria === "cerveza" ? "🍺" : b.categoria === "agua" ? "💧" : "🥤"}
                </div>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {b.nombre}
                </h4>
                <p className="text-xs text-[#ff5f3b] font-mono font-bold mt-1">
                  ${b.precio.toLocaleString("es-AR")}
                </p>
              </div>

              {/* Botones de Cantidad */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                {qty > 0 ? (
                  <div className="flex items-center justify-between w-full bg-[#0d121c] rounded-xl p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => onQuitarBebida(b.id)}
                      className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-bold text-white">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAgregarBebida(b)}
                      className="w-7 h-7 rounded-lg bg-[#ff5f3b] text-white font-bold hover:brightness-110 transition-all"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAgregarBebida(b)}
                    className="w-full py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#ff5f3b] hover:border-[#ff5f3b] text-xs font-semibold text-white transition-all flex items-center justify-center gap-1"
                  >
                    <span>+ Agregar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}