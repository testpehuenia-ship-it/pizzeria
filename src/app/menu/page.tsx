"use client";

import React, { useState, useEffect } from "react";
import { useTiendaStore } from "@/lib/store";
import { PIZZAS_DATA, PizzaDataType } from "@/lib/data";
import { ComboDataType } from "@/lib/catalog-db";
import { CarruselPizzas3D } from "@/components/menu/CarruselPizzas3D";
import { AnimacionCaja } from "@/components/carrito/AnimacionCaja";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { salirYCerrarApp } from "@/lib/cerrar-app";
import FooterLegal from "@/components/layout/FooterLegal";

export default function MenuPage() {
  const router = useRouter();
  const {
    cliente,
    pizzas,
    bebidas,
    combos = [],
    agregarPizza,
    agregarCombo,
    calcularTotal,
  } = useTiendaStore();

  const [seccion, setSeccion] = useState<"pizzas" | "combos">("pizzas");
  const [listaPizzas, setListaPizzas] = useState<PizzaDataType[]>(
    PIZZAS_DATA.filter((p) => !p.oculto)
  );
  const [listaCombos, setListaCombos] = useState<ComboDataType[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  const [mostrarModalCaja, setMostrarModalCaja] = useState(false);
  const [ultimoItemAgregado, setUltimoItemAgregado] = useState<string>("");

  // Cargar catálogo actualizado desde el servidor
  useEffect(() => {
    const fetchCatalogo = async () => {
      try {
        setCargandoCatalogo(true);
        const res = await fetch("/api/catalog");
        const data = await res.json();
        if (data.success && data.catalog) {
          if (data.catalog.pizzas && data.catalog.pizzas.length > 0) {
            const pizzasVisibles = data.catalog.pizzas.filter((p: PizzaDataType) => !p.oculto);
            setListaPizzas(pizzasVisibles);
          }
          if (data.catalog.combos && data.catalog.combos.length > 0) {
            const combosVisibles = data.catalog.combos.filter((c: ComboDataType) => !c.oculto);
            setListaCombos(combosVisibles);
          }
        }
      } catch (err) {
        console.warn("Fallo carga dinámica de catálogo, usando datos precargados:", err);
      } finally {
        setCargandoCatalogo(false);
      }
    };
    fetchCatalogo();
  }, []);

  const handleAgregarPizza = (
    pizza: PizzaDataType,
    tamaño: "4" | "8",
    ingredientes: string[]
  ) => {
    agregarPizza(pizza, tamaño, ingredientes);
    setUltimoItemAgregado(`${pizza.nombre} (${tamaño}p)`);
    setMostrarModalCaja(true);
  };

  const handleAgregarCombo = (combo: ComboDataType) => {
    agregarCombo(combo, combo.aderezosIncluidos);
    setUltimoItemAgregado(combo.nombre);
    setMostrarModalCaja(true);
  };

  const total = calcularTotal();
  const totalItems =
    pizzas.length +
    bebidas.reduce((acc, b) => acc + b.cantidad, 0) +
    (combos || []).reduce((acc, c) => acc + c.cantidad, 0);

  const [notifStatusMsg, setNotifStatusMsg] = useState<string>("");

  const handlePushClick = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones push.");
      return;
    }
    if (Notification.permission === "granted") {
      setNotifStatusMsg("✅ Notificaciones activas: ¡Estás al día con las ofertas de 0600Boston!");
      setTimeout(() => setNotifStatusMsg(""), 3500);
    } else if (Notification.permission === "default") {
      try {
        const p = await Notification.requestPermission();
        if (p === "granted") {
          localStorage.setItem("pwa_notif_accepted", "true");
          setNotifStatusMsg("🎉 ¡Notificaciones activadas con éxito!");
          setTimeout(() => setNotifStatusMsg(""), 3500);
          new Notification("0600Boston 🍕🍀", {
            body: "¡Notificaciones activadas! Te avisaremos de nuestras mejores ofertas.",
            icon: "/images/brunoagradece.webp",
          });
        }
      } catch {}
    } else {
      setNotifStatusMsg("⚠️ Notificaciones pausadas en tu navegador.");
      setTimeout(() => setNotifStatusMsg(""), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#14532d] pb-28 select-none">
      {/* Toast flotante de estado de notificaciones */}
      {notifStatusMsg && (
        <div className="fixed top-14 inset-x-4 z-50 max-w-sm mx-auto animate-bounce">
          <div className="bg-[#14532d] text-white text-xs font-bold py-2.5 px-4 rounded-2xl shadow-xl border border-emerald-400/50 text-center">
            {notifStatusMsg}
          </div>
        </div>
      )}

      {/* Barra Superior Mobile */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <span className="text-xl">🍀</span>
            <span className="font-black text-lg text-[#14532d] tracking-tight">
              0600<span className="text-[#15803d]">Boston</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Notificaciones Push */}
            <button
              type="button"
              onClick={handlePushClick}
              title="Notificaciones Push de Promociones"
              className="text-xs font-bold text-[#15803d] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 rounded-xl transition-all"
            >
              🔔
            </button>

            {/* Acceso a Bebidas */}
            <Link
              href="/bebidas"
              className="text-xs font-bold text-[#15803d] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition-all"
            >
              🥤 Bebidas
            </Link>

            {/* Carrito Flotante */}
            <Link
              href="/carrito"
              className="flex items-center gap-1.5 bg-[#15803d] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 active:scale-95 transition-all"
            >
              <span>🛒</span>
              <span>{totalItems}</span>
              <span className="hidden sm:inline font-mono">(${total.toLocaleString("es-AR")})</span>
            </Link>

            {/* Botón Salir Destacado que cierra la app */}
            <button
              type="button"
              onClick={() => salirYCerrarApp()}
              title="Salir y cerrar la aplicación"
              className="text-xs font-black text-white bg-gradient-to-r from-red-600 to-rose-600 px-2.5 py-1.5 rounded-xl shadow-md shadow-red-700/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Mobile */}
      <main className="max-w-md mx-auto px-4 pt-3">
        {/* Selector de Sección: Pizzas vs Combos */}
        <div className="flex bg-emerald-100/70 p-1 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setSeccion("pizzas")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              seccion === "pizzas"
                ? "bg-white text-[#14532d] shadow-sm"
                : "text-[#4b6b55] hover:text-[#14532d]"
            }`}
          >
            <span>🍕</span>
            <span>Pizzas ({listaPizzas.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSeccion("combos")}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              seccion === "combos"
                ? "bg-white text-[#14532d] shadow-sm"
                : "text-[#4b6b55] hover:text-[#14532d]"
            }`}
          >
            <span>🎁</span>
            <span>Combos {listaCombos.length > 0 ? `(${listaCombos.length})` : "✨"}</span>
          </button>
        </div>

        {/* VISTA 1: CARRUSEL 3D DE PIZZAS */}
        {seccion === "pizzas" && (
          <CarruselPizzas3D
            pizzas={listaPizzas}
            onAgregarAlCarrito={handleAgregarPizza}
          />
        )}

        {/* VISTA 2: LISTA VISUAL DE COMBOS PROMOCIONALES */}
        {seccion === "combos" && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                🎁 Promos Especiales
              </span>
              <h2 className="text-2xl font-black text-[#14532d] mt-1 tracking-tight">
                Combos 0600Boston
              </h2>
              <p className="text-xs text-[#4b6b55] mt-0.5">
                Elegí tu combo favorito con pizza y bebida incluida al mejor precio
              </p>
            </div>

            {listaCombos.length === 0 ? (
              <div className="bg-white border border-emerald-100 rounded-3xl p-6 text-center text-slate-500">
                <span className="text-3xl block mb-2">🎁</span>
                <p className="text-sm font-bold">Pronto nuevos combos disponibles</p>
                <p className="text-xs mt-1">
                  Podés armar tu pedido eligiendo una pizza y una bebida en la carta.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {listaCombos.map((combo) => (
                  <div
                    key={combo.id}
                    className="bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-3xl p-4 shadow-sm transition-all"
                  >
                    {/* Visual Lado a Lado de la Pizza + Bebida */}
                    <div className="bg-emerald-50/60 rounded-2xl p-3 flex items-center justify-center gap-4 mb-3">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm overflow-hidden">
                          <img
                            src={
                              combo.pizzaImagen &&
                              (combo.pizzaImagen.startsWith("/") || combo.pizzaImagen.startsWith("http"))
                                ? combo.pizzaImagen
                                : "/images/pizzas/pizza_base_madera.png"
                            }
                            alt={combo.pizzaNombre}
                            className="w-full h-full object-cover filter drop-shadow"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#14532d] mt-1 max-w-[90px] truncate text-center">
                          {combo.pizzaNombre} ({combo.pizzaTamano}p)
                        </span>
                      </div>

                      <span className="text-xl font-black text-[#15803d]">+</span>

                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm overflow-hidden">
                          {combo.bebidaImagen &&
                          (combo.bebidaImagen.startsWith("/") || combo.bebidaImagen.startsWith("http")) ? (
                            <img
                              src={combo.bebidaImagen}
                              alt={combo.bebidaNombre}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <span className="text-3xl">{combo.bebidaImagen || "🥤"}</span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-[#14532d] mt-1 max-w-[90px] truncate text-center">
                          {combo.bebidaNombre}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-[#14532d] text-base leading-tight">
                          {combo.nombre}
                        </h3>
                        <span className="text-base font-black text-[#15803d] font-mono">
                          ${combo.precio.toLocaleString("es-AR")}
                        </span>
                      </div>
                      {combo.descripcion && (
                        <p className="text-xs text-[#4b6b55] mt-1 leading-relaxed">
                          {combo.descripcion}
                        </p>
                      )}

                      {combo.aderezosIncluidos && combo.aderezosIncluidos.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[10px] text-[#4b6b55] font-bold mr-1">
                            Incluye:
                          </span>
                          {combo.aderezosIncluidos.map((a, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-emerald-100/60 text-[#14532d] font-semibold px-2 py-0.5 rounded-md"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3.5 pt-3 border-t border-emerald-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleAgregarCombo(combo)}
                        className="w-full py-2.5 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white font-black text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>🛒</span>
                        <span>Agregar Combo al Carrito</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Banner Inferior: Ir a Bebidas o Finalizar */}
        {totalItems > 0 && (
          <div className="mt-6 bg-white border border-emerald-100 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-[#4b6b55] block">
                Total acumulado:
              </span>
              <span className="text-xl font-black text-[#15803d] font-mono">
                ${total.toLocaleString("es-AR")}
              </span>
            </div>

            <div className="flex gap-2">
              <Link
                href="/bebidas"
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-[#14532d] hover:bg-emerald-100 transition-all"
              >
                + Bebidas
              </Link>
              <Link
                href="/pedido"
                className="py-2.5 px-3.5 rounded-xl text-xs font-black text-white bg-[#15803d] hover:bg-[#16a34a] shadow-md shadow-emerald-700/20 transition-all"
              >
                Pedir →
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer Legal con Derechos y Enlace ADNQN.ar */}
      <FooterLegal theme="light" className="mt-8" />

      {/* Modal de Empaque y Consulta por Bebidas */}
      {mostrarModalCaja && (
        <AnimacionCaja
          pizzaNombre={ultimoItemAgregado}
          onCerrar={() => setMostrarModalCaja(false)}
        />
      )}
    </div>
  );
}