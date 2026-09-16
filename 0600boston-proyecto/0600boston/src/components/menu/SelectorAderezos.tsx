"use client";

import { ADEREZOS_DATA } from "@/lib/data";

interface SelectorAderezosProps {
  pizzaNombre: string;
  aderezosActuales: string[];
  onToggleAderezo: (aderezo: string) => void;
}

export function SelectorAderezos({
  pizzaNombre,
  aderezosActuales,
  onToggleAderezo,
}: SelectorAderezosProps) {
  return (
    <div className="max-w-md mx-auto bg-[#182030] p-6 rounded-2xl border border-white/10 fade-in-up">
      <h3 className="text-lg font-bold mb-4 text-center text-white">
        🌿 Aderezos para {pizzaNombre}
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {ADEREZOS_DATA.map((a) => {
          const seleccionado = aderezosActuales.includes(a.nombre);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onToggleAderezo(a.nombre)}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                seleccionado
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : "bg-[#0d121c] border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{a.nombre}</span>
              <span className="text-[10px] opacity-75">{seleccionado ? "✓" : "+"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}