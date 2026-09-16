"use client";

import React, { useState, useRef, useEffect } from "react";
import { PizzaDataType } from "@/lib/data";
import { PizzaInteractiva } from "./PizzaInteractiva";

interface CarruselPizzas3DProps {
  pizzas: PizzaDataType[];
  onAgregarAlCarrito: (
    pizza: PizzaDataType,
    tamaño: "4" | "8",
    ingredientes: string[]
  ) => void;
}

interface TransicionState {
  desdeIdx: number;
  haciaIdx: number;
  direccion: "exit-left-enter-right" | "exit-right-enter-left";
}

export function CarruselPizzas3D({
  pizzas,
  onAgregarAlCarrito,
}: CarruselPizzas3DProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tamañoSeleccionado, setTamañoSeleccionado] = useState<"4" | "8">("8");

  // Estado de transición de salida y entrada
  const [transicion, setTransicion] = useState<TransicionState | null>(null);
  const timerTransicion = useRef<NodeJS.Timeout | null>(null);

  // Guardamos los ingredientes decorados para cada pizza
  const [ingredientesActivosMap, setIngredientesActivosMap] = useState<
    Record<string, string[]>
  >({
    napolitana: ["tomate-rodajas", "albahaca", "aceitunas"],
    muzzarella: ["aceitunas", "oregano"],
  });

  const [animandoEmpaque, setAnimandoEmpaque] = useState(false);

  // Control de gestos táctiles (Swipe con dedo en Mobile)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const isTouchSwiping = useRef(false);

  // Control de arrastre con mouse en PC
  const mouseStartX = useRef<number | null>(null);
  const isMouseDragging = useRef(false);

  const minSwipeDistance = 40;

  // Limpiar timers en desmontaje
  useEffect(() => {
    return () => {
      if (timerTransicion.current) clearTimeout(timerTransicion.current);
    };
  }, []);

  // La pizza en exhibición (si está animando, muestra la que entra para datos e ingredientes)
  const pizzaExhibida =
    (transicion ? pizzas[transicion.haciaIdx] : pizzas[activeIndex]) || pizzas[0];

  const ingredientesVisibles = (pizzaExhibida.ingredientesDecorables || []).filter(
    (i) => !i.oculto
  );

  const ingredientesActivos =
    ingredientesActivosMap[pizzaExhibida.id] ||
    ingredientesVisibles.map((i) => i.id);

  const precioActual =
    tamañoSeleccionado === "4" ? pizzaExhibida.precio4 : pizzaExhibida.precio8;

  // Función principal para cambiar pizza con animación de salida y entrada
  const cambiarPizza = (
    nuevoIdx: number,
    direccionForzada?: "exit-left-enter-right" | "exit-right-enter-left"
  ) => {
    if (transicion !== null) return; // Evitar disparos múltiples durante la transición
    if (nuevoIdx === activeIndex) return;

    let direccion: "exit-left-enter-right" | "exit-right-enter-left";
    if (direccionForzada) {
      direccion = direccionForzada;
    } else {
      direccion =
        nuevoIdx > activeIndex ? "exit-left-enter-right" : "exit-right-enter-left";
    }

    setTransicion({
      desdeIdx: activeIndex,
      haciaIdx: nuevoIdx,
      direccion,
    });

    if (timerTransicion.current) clearTimeout(timerTransicion.current);
    timerTransicion.current = setTimeout(() => {
      setActiveIndex(nuevoIdx);
      setTransicion(null);
    }, 420);
  };

  // Clicks en PC / Táctil:
  // Lado izquierdo: sale a la izquierda e ingresa del lado derecho la siguiente
  const handleLeftClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMouseDragging.current || isTouchSwiping.current || transicion !== null) return;
    const nextIdx = (activeIndex + 1) % pizzas.length;
    cambiarPizza(nextIdx, "exit-left-enter-right");
  };

  // Lado derecho: sale a la derecha e ingresa del lado izquierdo la anterior
  const handleRightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMouseDragging.current || isTouchSwiping.current || transicion !== null) return;
    const prevIdx = activeIndex === 0 ? pizzas.length - 1 : activeIndex - 1;
    cambiarPizza(prevIdx, "exit-right-enter-left");
  };

  // Eventos táctiles (Touch Mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
    isTouchSwiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    if (
      touchStartX.current !== null &&
      Math.abs(touchEndX.current - touchStartX.current) > 10
    ) {
      isTouchSwiping.current = true;
    }
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;

    if (Math.abs(distance) >= minSwipeDistance) {
      if (distance > 0) {
        // Dedo desliza hacia la izquierda -> sale a la izquierda y entra por la derecha
        const target = (activeIndex + 1) % pizzas.length;
        cambiarPizza(target, "exit-left-enter-right");
      } else {
        // Dedo desliza hacia la derecha -> sale a la derecha y entra por la izquierda
        const target = activeIndex === 0 ? pizzas.length - 1 : activeIndex - 1;
        cambiarPizza(target, "exit-right-enter-left");
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
    setTimeout(() => {
      isTouchSwiping.current = false;
    }, 120);
  };

  // Eventos de Mouse Drag para PC
  const onMouseDown = (e: React.MouseEvent) => {
    mouseStartX.current = e.clientX;
    isMouseDragging.current = false;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (
      mouseStartX.current !== null &&
      Math.abs(e.clientX - mouseStartX.current) > 12
    ) {
      isMouseDragging.current = true;
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX.current !== null && isMouseDragging.current) {
      const diff = mouseStartX.current - e.clientX;
      if (Math.abs(diff) >= minSwipeDistance) {
        if (diff > 0) {
          const nextIdx = (activeIndex + 1) % pizzas.length;
          cambiarPizza(nextIdx, "exit-left-enter-right");
        } else {
          const prevIdx = activeIndex === 0 ? pizzas.length - 1 : activeIndex - 1;
          cambiarPizza(prevIdx, "exit-right-enter-left");
        }
      }
    }
    mouseStartX.current = null;
    setTimeout(() => {
      isMouseDragging.current = false;
    }, 120);
  };

  // Alternar ingrediente decorativo sobre la pizza
  const toggleIngrediente = (ingId: string) => {
    const actuales = ingredientesActivosMap[pizzaExhibida.id] || [];
    let nuevos: string[];
    if (actuales.includes(ingId)) {
      nuevos = actuales.filter((id) => id !== ingId);
    } else {
      nuevos = [...actuales, ingId];
    }
    setIngredientesActivosMap({
      ...ingredientesActivosMap,
      [pizzaExhibida.id]: nuevos,
    });
  };

  // Botón para decorar todos
  const decorarTodos = () => {
    setIngredientesActivosMap({
      ...ingredientesActivosMap,
      [pizzaExhibida.id]: ingredientesVisibles.map((i) => i.id),
    });
  };

  const handleAgregar = () => {
    setAnimandoEmpaque(true);
    setTimeout(() => {
      onAgregarAlCarrito(pizzaExhibida, tamañoSeleccionado, ingredientesActivos);
      setAnimandoEmpaque(false);
    }, 700);
  };

  const activeIdxEfectivo = transicion ? transicion.haciaIdx : activeIndex;

  return (
    <div className="w-full max-w-md mx-auto select-none">
      
      {/* Título de la Pizza y Guía */}
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
          🍀 Especialidad #{activeIdxEfectivo + 1} de {pizzas.length}
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14532d] mt-1 tracking-tight transition-all duration-200">
          {pizzaExhibida.nombre}
        </h2>
        <p className="text-xs text-[#4b6b55] max-w-xs mx-auto mt-1 leading-snug min-h-[30px]">
          {pizzaExhibida.descripcion}
        </p>
      </div>

      {/* SELECTOR DE ESPECIALIDAD DIRECTO CON MOUSE (PC / Móvil) */}
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#14532d] flex items-center gap-1">
            <span>🍕</span> Elegir Tipo de Pizza:
          </span>
          <span className="text-[10px] font-semibold text-[#4b6b55] hidden sm:inline">
            🖱️ Seleccioná con el mouse
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
          {pizzas.map((p, idx) => {
            const esActiva = idx === activeIdxEfectivo;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (idx === activeIndex || transicion !== null) return;
                  const dir =
                    idx > activeIndex
                      ? "exit-left-enter-right"
                      : "exit-right-enter-left";
                  cambiarPizza(idx, dir);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  esActiva
                    ? "bg-[#15803d] text-white shadow-md shadow-emerald-800/25 scale-[1.02] border border-emerald-600 ring-2 ring-emerald-400/30"
                    : "bg-white text-[#14532d] border border-emerald-200/80 hover:bg-emerald-50 hover:border-emerald-400 hover:scale-[1.01]"
                }`}
              >
                {p.imagen && (p.imagen.startsWith("/") || p.imagen.startsWith("http")) ? (
                  <img
                    src={p.imagen}
                    alt={p.nombre}
                    className="w-5 h-5 rounded-md object-cover shrink-0 border border-emerald-300 shadow-xs"
                  />
                ) : (
                  <span>{p.imagen || "🍕"}</span>
                )}
                <span>{p.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector Táctil de Porciones */}
      <div className="flex justify-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTamañoSeleccionado("4")}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
            tamañoSeleccionado === "4"
              ? "bg-[#15803d] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-[#4b6b55] border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          4 Porciones (${pizzaExhibida.precio4.toLocaleString("es-AR")})
        </button>
        <button
          type="button"
          onClick={() => setTamañoSeleccionado("8")}
          className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
            tamañoSeleccionado === "8"
              ? "bg-[#15803d] text-white shadow-md shadow-emerald-700/20"
              : "bg-white text-[#4b6b55] border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          8 Porciones Grande (${pizzaExhibida.precio8.toLocaleString("es-AR")})
        </button>
      </div>

      {/* ÁREA CENTRAL INTERACTIVA (TRANSICIÓN 3D SALIDA/ENTRADA, SWIPE DEDO Y CLICKS PC) */}
      <div
        className={`relative py-1 select-none overflow-hidden rounded-3xl transition-transform duration-300 ${
          animandoEmpaque ? "animate-fly-to-cart pointer-events-none" : ""
        }`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {/* ZONA DE CLICK IZQUIERDA (Invisible, sin flechas a la vista): Sale a la izquierda e ingresa del lado derecho la siguiente */}
        <div
          onClick={handleLeftClick}
          className="absolute left-0 top-0 bottom-0 w-1/2 z-20 cursor-pointer"
          title="Click lado izquierdo: girar hacia la izquierda"
          role="button"
          aria-label="Click lado izquierdo: pizza gira hacia la izquierda e ingresa la siguiente"
        />

        {/* ZONA DE CLICK DERECHA (Invisible, sin flechas a la vista): Sale a la derecha e ingresa del lado izquierdo la anterior */}
        <div
          onClick={handleRightClick}
          className="absolute right-0 top-0 bottom-0 w-1/2 z-20 cursor-pointer"
          title="Click lado derecho: girar hacia la derecha"
          role="button"
          aria-label="Click lado derecho: pizza gira hacia la derecha e ingresa la anterior"
        />

        {/* CONTENEDOR DE LA PIZZA CON ANIMACIÓN DE RUEDA DE PIZZA (ROLLING WHEEL) */}
        <div className="relative w-full flex items-center justify-center min-h-[290px] sm:min-h-[330px]">
          {transicion === null ? (
            // ESTADO NORMAL ESTABLE
            <div className="w-full flex items-center justify-center pointer-events-none">
              <PizzaInteractiva
                pizza={pizzaExhibida}
                ingredientesAgregados={ingredientesActivos}
                tamaño={tamañoSeleccionado}
              />
            </div>
          ) : (
            // ESTADO DE TRANSICIÓN: Rueda de pizza saliendo y nueva pizza rodando en entrada
            <>
              {/* Pizza que SALE rodando */}
              <div
                className={`w-full flex items-center justify-center pointer-events-none ${
                  transicion.direccion === "exit-left-enter-right"
                    ? "animate-pizza-wheel-exit-left"
                    : "animate-pizza-wheel-exit-right"
                }`}
              >
                <PizzaInteractiva
                  pizza={pizzas[transicion.desdeIdx]}
                  ingredientesAgregados={
                    ingredientesActivosMap[pizzas[transicion.desdeIdx].id] ||
                    (pizzas[transicion.desdeIdx].ingredientesDecorables || []).map(
                      (i) => i.id
                    )
                  }
                  tamaño={tamañoSeleccionado}
                />
              </div>

              {/* Pizza que ENTRA rodando */}
              <div
                className={`absolute inset-0 w-full flex items-center justify-center pointer-events-none ${
                  transicion.direccion === "exit-left-enter-right"
                    ? "animate-pizza-wheel-enter-right"
                    : "animate-pizza-wheel-enter-left"
                }`}
              >
                <PizzaInteractiva
                  pizza={pizzas[transicion.haciaIdx]}
                  ingredientesAgregados={
                    ingredientesActivosMap[pizzas[transicion.haciaIdx].id] ||
                    (pizzas[transicion.haciaIdx].ingredientesDecorables || []).map(
                      (i) => i.id
                    )
                  }
                  tamaño={tamañoSeleccionado}
                />
              </div>
            </>
          )}
        </div>

        {/* Guía Visual Interactiva sin flechas */}
        <div className="flex flex-col items-center justify-center gap-1 mt-2 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#14532d] bg-emerald-50/90 py-1 px-4 rounded-full border border-emerald-200/60 shadow-xs">
            <span>🍕 Deslizá con el dedo o hacé click para girar la pizza</span>
          </div>
          <span className="text-[10px] text-[#4b6b55]">
            En PC hacé click a los costados de la pizza o seleccioná arriba con el mouse
          </span>
        </div>
      </div>

      {/* BANDEJA TÁCTIL DE INGREDIENTES PARA DECORAR LA PIZZA */}
      <div className="bg-white rounded-3xl p-4 shadow-[0_10px_30px_rgba(21,128,61,0.06)] border border-emerald-100 mt-2">
        <div className="flex justify-between items-center mb-2.5 px-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14532d]">
              Topping & Ingredientes de la receta:
            </h3>
            <p className="text-[11px] text-[#4b6b55]">
              Tocá cada ingrediente para decorarlo en la pizza
            </p>
          </div>
          <button
            type="button"
            onClick={decorarTodos}
            className="text-[11px] font-bold text-[#15803d] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
          >
            Poner Todos ✨
          </button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
          {ingredientesVisibles.map((ing) => {
            const activo = ingredientesActivos.includes(ing.id);
            return (
              <button
                key={ing.id}
                type="button"
                onClick={() => toggleIngrediente(ing.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-all active:scale-95 group cursor-pointer ${
                  activo
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-800/20"
                    : "bg-[#f8fafc] text-[#14532d] border-emerald-200/80 hover:bg-emerald-50/80"
                }`}
              >
                {ing.imagenUrl ? (
                  <img
                    src={ing.imagenUrl}
                    alt={ing.nombre}
                    className="w-7 h-7 object-contain filter drop-shadow-sm transition-transform group-hover:scale-110"
                  />
                ) : (
                  <span className="text-lg">{ing.icono}</span>
                )}
                <span>{ing.nombre}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activo ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {activo ? "✓" : "+"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra Inferior: Precio y Botón Añadir al Carrito */}
      <div className="mt-4 flex items-center justify-between gap-3 bg-white p-3.5 rounded-3xl shadow-[0_10px_30px_rgba(21,128,61,0.08)] border border-emerald-100">
        <div className="pl-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4b6b55] block">
            Total {pizzaExhibida.nombre}:
          </span>
          <span className="text-2xl font-black text-[#15803d] font-mono leading-none">
            ${precioActual.toLocaleString("es-AR")}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAgregar}
          disabled={animandoEmpaque}
          className="flex-1 max-w-[200px] py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-lg shadow-emerald-700/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Añadir al Carrito</span>
          <span className="text-base">🛒</span>
        </button>
      </div>

      {/* Puntos de Paginación */}
      <div className="flex justify-center gap-1.5 mt-4">
        {pizzas.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              if (idx === activeIndex || transicion !== null) return;
              const dir =
                idx > activeIndex
                  ? "exit-left-enter-right"
                  : "exit-right-enter-left";
              cambiarPizza(idx, dir);
            }}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              activeIdxEfectivo === idx
                ? "w-6 bg-[#15803d]"
                : "w-1.5 bg-emerald-200 hover:bg-emerald-300"
            }`}
            aria-label={`Ir a pizza ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}