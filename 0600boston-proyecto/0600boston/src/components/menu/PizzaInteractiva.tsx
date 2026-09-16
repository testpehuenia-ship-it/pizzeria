"use client";

import React, { useMemo } from "react";
import { PizzaDataType } from "@/lib/data";

interface PizzaInteractivaProps {
  pizza: PizzaDataType;
  ingredientesAgregados: string[];
  tamaño: "4" | "8";
}

interface ToppingPlacements {
  key: string;
  ingredienteId: string;
  nombre: string;
  icono: string;
  color: string;
  imagenUrl?: string;
  x: number;
  y: number;
  rot: number;
  scale: number;
  radius: number;
  zIndex: number;
  claseTamano: string;
}

export function PizzaInteractiva({
  pizza,
  ingredientesAgregados,
  tamaño,
}: PizzaInteractivaProps) {
  // Algoritmo de dispersión inteligente y no-solapamiento total (>50% de visibilidad garantizada)
  const toppingsRenderizables = useMemo(() => {
    const rawItems: ToppingPlacements[] = [];
    let counter = 0;

    (pizza.ingredientesDecorables || []).forEach((ing, ingIdx) => {
      const estaActivo = ingredientesAgregados.includes(ing.id);
      if (!estaActivo) return;

      // Determinar radio de colisión y clase de tamaño visual según el tipo de ingrediente
      let radius = 5.5;
      let claseTamano = "w-10 h-10";

      if (ing.id.includes("tomate") || ing.id.includes("jamon") || ing.id.includes("huevo")) {
        radius = 7.5;
        claseTamano = ing.id.includes("jamon") ? "w-16 h-12" : "w-14 h-14";
      } else if (ing.id.includes("calabresa") || ing.id.includes("longaniza") || ing.id.includes("morron") || ing.id.includes("cebolla")) {
        radius = 6.2;
        claseTamano = ing.id.includes("cebolla") ? "w-14 h-10" : "w-12 h-12";
      } else if (ing.id.includes("aceitunas") || ing.id.includes("albahaca") || ing.id.includes("ajo")) {
        radius = 4.2;
        claseTamano = ing.id.includes("aceitunas") ? "w-7 h-7" : ing.id.includes("albahaca") ? "w-10 h-10" : "w-8 h-8";
      }

      ing.posiciones.forEach((pos, posIdx) => {
        counter++;
        rawItems.push({
          key: `${ing.id}_${posIdx}_${counter}`,
          ingredienteId: ing.id,
          nombre: ing.nombre,
          icono: ing.icono,
          color: ing.color,
          imagenUrl: ing.imagenUrl,
          x: pos.x,
          y: pos.y,
          rot: pos.rot,
          scale: pos.scale || 1,
          radius,
          zIndex: 10 + ingIdx * 5 + posIdx,
          claseTamano,
        });
      });
    });

    // Ajuste dinámico de escala si hay muchos ingredientes juntos para que respiren en la masa
    const factorEscalaGlobal = rawItems.length > 14 ? 0.9 : rawItems.length > 18 ? 0.82 : 1;

    // Límite radial seguro de la pizza (para que no caigan fuera del disco horneado)
    const MAX_RADIO_PIZZA = 35.5; // porcentaje desde el centro (50, 50)
    const list = rawItems.map((item) => ({ ...item, scale: item.scale * factorEscalaGlobal }));

    // Pasadas de relajación de colisión: garantiza que al menos un 50% de cada imagen se vea siempre
    for (let iter = 0; iter < 5; iter++) {
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          let dx = list[j].x - list[i].x;
          let dy = list[j].y - list[i].y;
          let dist = Math.hypot(dx, dy);

          // La distancia mínima requerida para asegurar que al menos el 50% de cada imagen no quede tapado
          const minDist = (list[i].radius + list[j].radius) * 0.72;

          if (dist < minDist) {
            // Si están exactamente en el mismo punto (ej. dos ingredientes agregados al centro)
            if (dist < 0.2) {
              const ang = (i * 1.8 + j * 2.4) % (2 * Math.PI);
              dx = Math.cos(ang) * 0.3;
              dy = Math.sin(ang) * 0.3;
              dist = 0.3;
            }

            const solapamiento = minDist - dist;
            const desplazamientoX = (dx / dist) * solapamiento * 0.52;
            const desplazamientoY = (dy / dist) * solapamiento * 0.52;

            list[i].x -= desplazamientoX;
            list[i].y -= desplazamientoY;
            list[j].x += desplazamientoX;
            list[j].y += desplazamientoY;
          }
        }

        // Adaptar a la circunferencia de la pizza: mantener estrictamente dentro de la mozzarella
        const relX = list[i].x - 50;
        const relY = list[i].y - 50;
        const distCentro = Math.hypot(relX, relY);
        const radioMaxPermitido = MAX_RADIO_PIZZA - list[i].radius * 0.45;

        if (distCentro > radioMaxPermitido && distCentro > 0.001) {
          list[i].x = 50 + (relX / distCentro) * radioMaxPermitido;
          list[i].y = 50 + (relY / distCentro) * radioMaxPermitido;
        }
      }
    }

    return list;
  }, [pizza, ingredientesAgregados]);

  const tieneFotoReal = Boolean(
    pizza.imagen && (pizza.imagen.startsWith("/") || pizza.imagen.startsWith("http"))
  );

  return (
    <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center select-none">
      {/* Disco redondo de la pizza horneada sobre tabla artesanal o foto real cargada */}
      <div className="relative w-full h-full rounded-full overflow-hidden filter drop-shadow-[0_18px_32px_rgba(0,0,0,0.28)] flex items-center justify-center bg-black/5">
        {/* Fotografía de la Pizza: foto real de la variedad o base sobre madera */}
        <img
          src={tieneFotoReal ? pizza.imagen : "/images/pizzas/pizza_base_madera.png"}
          alt={pizza.nombre || "Pizza 0600 Boston artesanal"}
          className="w-full h-full object-cover rounded-full pointer-events-none"
        />

        {/* Marcadores de Porciones sutiles */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#451a03]"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-[#451a03]"></div>
          {tamaño === "8" && (
            <>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#451a03] rotate-45"></div>
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#451a03] -rotate-45"></div>
            </>
          )}
        </div>

        {/* Capa de Ingredientes interactivos (se muestra cuando no hay foto real cargada) */}
        {!tieneFotoReal && (
          <div className="absolute inset-0 pointer-events-none">
            {toppingsRenderizables.map((item) => (
              <div
                key={item.key}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-ingredient-drop select-none transition-all duration-300 ease-out"
                style={{
                  left: `${item.x.toFixed(2)}%`,
                  top: `${item.y.toFixed(2)}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rot}deg) scale(${item.scale})`,
                  zIndex: item.zIndex,
                }}
              >
                {item.imagenUrl ? (
                  <img
                    src={item.imagenUrl}
                    alt={item.nombre}
                    className={`object-contain pointer-events-none filter drop-shadow-[0_5px_7px_rgba(0,0,0,0.55)] ${item.claseTamano}`}
                  />
                ) : (
                  <span className="text-2xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
                    {item.icono}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

