"use client";

import React, { useState } from "react";
import { ComboDataType, PizzaDataType, BebidaDataType, AderezoDataType } from "@/lib/catalog-db";

interface CombosAdminProps {
  combos: ComboDataType[];
  pizzas: PizzaDataType[];
  bebidas: BebidaDataType[];
  aderezos: AderezoDataType[];
  onRecargarCatalogo: () => void;
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

export function CombosAdmin({
  combos,
  pizzas,
  bebidas,
  aderezos,
  onRecargarCatalogo,
  onMostrarNotificacion,
}: CombosAdminProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario del Armador de Combos
  const [comboEditando, setComboEditando] = useState<ComboDataType | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPizzaId, setFormPizzaId] = useState("");
  const [formPizzaTamano, setFormPizzaTamano] = useState<"4" | "8">("8");
  const [formPizzaImagen, setFormPizzaImagen] = useState("");
  const [subiendoFotoPizza, setSubiendoFotoPizza] = useState(false);

  const [formBebidaId, setFormBebidaId] = useState("");
  const [formBebidaImagen, setFormBebidaImagen] = useState("");
  const [subiendoFotoBebida, setSubiendoFotoBebida] = useState(false);

  const [formPrecio, setFormPrecio] = useState<number>(0);
  const [formAderezos, setFormAderezos] = useState<string[]>([]);
  const [formPermitirModificar, setFormPermitirModificar] = useState(true);
  const [formOculto, setFormOculto] = useState(false);

  // Resolver la imagen real de la pizza del menú (nunca emoji o icono)
  const resolverImagenPizza = (p?: PizzaDataType): string => {
    if (!p) return "/images/pizzas/pizza_base_madera.png";
    if (p.imagen && (p.imagen.startsWith("/") || p.imagen.startsWith("http"))) {
      return p.imagen;
    }
    return "/images/pizzas/pizza_base_madera.png";
  };

  // Resolver la imagen real de la bebida o producto
  const resolverImagenBebida = (b?: BebidaDataType): string => {
    if (!b) return "";
    if (b.imagenUrl && (b.imagenUrl.startsWith("/") || b.imagenUrl.startsWith("http"))) {
      return b.imagenUrl;
    }
    return "";
  };

  const abrirModalCrear = () => {
    setComboEditando(null);
    const primeraPizza = pizzas[0];
    const primeraBebida = bebidas[0];

    const pId = primeraPizza ? primeraPizza.id : "";
    const bId = primeraBebida ? primeraBebida.id : "";

    setFormPizzaId(pId);
    setFormPizzaTamano("8");
    setFormPizzaImagen(resolverImagenPizza(primeraPizza));

    setFormBebidaId(bId);
    setFormBebidaImagen(resolverImagenBebida(primeraBebida));

    // Calcular precio promocional sugerido
    const precioP = primeraPizza ? primeraPizza.precio8 : 20000;
    const precioB = primeraBebida ? primeraBebida.precio : 2500;
    const sugerido = Math.round((precioP + precioB) * 0.9);

    setFormPrecio(sugerido);
    setFormNombre(
      primeraPizza && primeraBebida
        ? `Combo ${primeraPizza.nombre} + ${primeraBebida.nombre}`
        : "Nuevo Combo Promocional"
    );
    setFormDescripcion("Elegí tu combo con precio especial y aderezos a gusto");
    setFormAderezos(["Orégano", "Aceitunas extra"]);
    setFormPermitirModificar(true);
    setFormOculto(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (c: ComboDataType) => {
    setComboEditando(c);
    setFormNombre(c.nombre);
    setFormDescripcion(c.descripcion || "");
    setFormPizzaId(c.pizzaId);
    setFormPizzaTamano(c.pizzaTamano || "8");

    const pizzaAsoc = pizzas.find((p) => p.id === c.pizzaId);
    const imgP =
      c.pizzaImagen && (c.pizzaImagen.startsWith("/") || c.pizzaImagen.startsWith("http"))
        ? c.pizzaImagen
        : resolverImagenPizza(pizzaAsoc);
    setFormPizzaImagen(imgP);

    setFormBebidaId(c.bebidaId);
    const bebidaAsoc = bebidas.find((b) => b.id === c.bebidaId);
    const imgB =
      c.bebidaImagen && (c.bebidaImagen.startsWith("/") || c.bebidaImagen.startsWith("http"))
        ? c.bebidaImagen
        : resolverImagenBebida(bebidaAsoc);
    setFormBebidaImagen(imgB);

    setFormPrecio(c.precio);
    setFormAderezos(c.aderezosIncluidos ? [...c.aderezosIncluidos] : []);
    setFormPermitirModificar(c.ingredientesPermitidosModificar ?? true);
    setFormOculto(c.oculto ?? false);
    setModalAbierto(true);
  };

  // Objetos seleccionados para vista previa
  const pizzaSeleccionada = pizzas.find((p) => p.id === formPizzaId) || pizzas[0];
  const bebidaSeleccionada = bebidas.find((b) => b.id === formBebidaId) || bebidas[0];

  const handleCambioPizza = (pId: string) => {
    setFormPizzaId(pId);
    const p = pizzas.find((x) => x.id === pId);
    if (p) {
      setFormPizzaImagen(resolverImagenPizza(p));
      if (bebidaSeleccionada && !comboEditando) {
        setFormNombre(`Combo ${p.nombre} + ${bebidaSeleccionada.nombre}`);
        const precioP = formPizzaTamano === "4" ? p.precio4 : p.precio8;
        setFormPrecio(Math.round((precioP + bebidaSeleccionada.precio) * 0.9));
      }
    }
  };

  const handleCambioBebida = (bId: string) => {
    setFormBebidaId(bId);
    const b = bebidas.find((x) => x.id === bId);
    if (b) {
      setFormBebidaImagen(resolverImagenBebida(b));
      if (pizzaSeleccionada && !comboEditando) {
        setFormNombre(`Combo ${pizzaSeleccionada.nombre} + ${b.nombre}`);
        const precioP = formPizzaTamano === "4" ? pizzaSeleccionada.precio4 : pizzaSeleccionada.precio8;
        setFormPrecio(Math.round((precioP + b.precio) * 0.9));
      }
    }
  };

  const handleSubirFotoPizza = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("removeBg", "true");

    setSubiendoFotoPizza(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      setFormPizzaImagen(data.url);
      onMostrarNotificacion("Foto de pizza para el combo subida con éxito.", "exito");
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setSubiendoFotoPizza(false);
    }
  };

  const handleSubirFotoBebida = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("removeBg", "true");

    setSubiendoFotoBebida(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir imagen");
      setFormBebidaImagen(data.url);
      onMostrarNotificacion("Foto de producto/bebida para el combo subida con éxito.", "exito");
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setSubiendoFotoBebida(false);
    }
  };

  const toggleAderezo = (nombreAderezo: string) => {
    if (formAderezos.includes(nombreAderezo)) {
      setFormAderezos(formAderezos.filter((a) => a !== nombreAderezo));
    } else {
      setFormAderezos([...formAderezos, nombreAderezo]);
    }
  };

  const handleGuardarCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const payload: ComboDataType = {
      id: comboEditando ? comboEditando.id : `combo_${Date.now()}`,
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
      pizzaId: formPizzaId,
      pizzaNombre: pizzaSeleccionada?.nombre || "Pizza",
      pizzaTamano: formPizzaTamano,
      pizzaImagen: formPizzaImagen || resolverImagenPizza(pizzaSeleccionada),
      bebidaId: formBebidaId,
      bebidaNombre: bebidaSeleccionada?.nombre || "Bebida",
      bebidaImagen: formBebidaImagen || resolverImagenBebida(bebidaSeleccionada),
      precio: Number(formPrecio),
      aderezosIncluidos: formAderezos,
      ingredientesPermitidosModificar: formPermitirModificar,
      oculto: formOculto,
    };

    try {
      const res = await fetch("/api/catalog/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar combo");

      onMostrarNotificacion(
        comboEditando ? `Combo "${formNombre}" actualizado.` : `Combo "${formNombre}" creado con éxito.`,
        "exito"
      );
      setModalAbierto(false);
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleOcultar = async (c: ComboDataType) => {
    const nuevoEstado = !c.oculto;
    const payload: ComboDataType = {
      ...c,
      oculto: nuevoEstado,
    };

    try {
      const res = await fetch("/api/catalog/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo actualizar visibilidad");
      onMostrarNotificacion(
        nuevoEstado
          ? `Combo "${c.nombre}" ocultado del menú (Pausado por stock).`
          : `Combo "${c.nombre}" republicado en el menú.`,
        "exito"
      );
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const handleEliminarCombo = async (c: ComboDataType) => {
    if (!confirm(`¿Eliminar el combo "${c.nombre}"?`)) return;

    try {
      const res = await fetch(`/api/catalog/combos?id=${c.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      onMostrarNotificacion(`Combo "${c.nombre}" eliminado.`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de Combos */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🎁</span>
            <span>Armador de Combos ({combos.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Seleccioná una especialidad de Pizza y un segundo producto (Bebida), fijá el precio y visualizá ambas fotos reales del menú o subí tus propias imágenes.
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        >
          <span>+</span>
          <span>Crear Nuevo Combo</span>
        </button>
      </div>

      {/* Lista visual de Combos activos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {combos.map((combo) => {
          const imgPizza =
            combo.pizzaImagen && (combo.pizzaImagen.startsWith("/") || combo.pizzaImagen.startsWith("http"))
              ? combo.pizzaImagen
              : "/images/pizzas/pizza_base_madera.png";

          return (
            <div
              key={combo.id}
              className={`bg-[#151f2e] border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
                combo.oculto
                  ? "border-red-500/40 bg-[#151f2e]/75 opacity-90 shadow-red-950/20"
                  : "border-white/10 hover:border-emerald-500/30"
              }`}
            >
              <div>
                {/* Header de la tarjeta del Combo con ID y estado de stock */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      Combo Especial
                    </span>
                    {combo.oculto && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 animate-pulse">
                        ⏸️ Sin Stock
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">ID: {combo.id}</span>
                </div>

                {/* Vista previa compuesta: Imagen Real Pizza + Imagen Real Bebida lado a lado */}
                <div className="bg-[#0d141e] border border-white/5 rounded-2xl p-3 flex items-center justify-center gap-4 mb-3 shadow-inner">
                  {/* Lado Izquierdo: Pizza con foto real del menú */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#151f2e] border border-emerald-500/30 flex items-center justify-center overflow-hidden shadow-md">
                      <img
                        src={imgPizza}
                        alt={combo.pizzaNombre}
                        className="w-full h-full object-cover filter drop-shadow"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1 max-w-[110px] truncate text-center">
                      {combo.pizzaNombre} ({combo.pizzaTamano}p)
                    </span>
                  </div>

                  <span className="text-xl font-black text-emerald-400">+</span>

                  {/* Lado Derecho: Bebida / Segundo Producto con foto */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#151f2e] border border-emerald-500/30 flex items-center justify-center overflow-hidden shadow-md">
                      {combo.bebidaImagen && (combo.bebidaImagen.startsWith("/") || combo.bebidaImagen.startsWith("http")) ? (
                        <img
                          src={combo.bebidaImagen}
                          alt={combo.bebidaNombre}
                          className="w-full h-full object-contain p-1 filter drop-shadow"
                        />
                      ) : (
                        <span className="text-3xl sm:text-4xl">{combo.bebidaImagen || "🥤"}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1 max-w-[110px] truncate text-center">
                      {combo.bebidaNombre}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-extrabold text-white text-base">{combo.nombre}</h3>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ${combo.precio.toLocaleString("es-AR")}
                  </span>
                </div>

                {combo.descripcion && (
                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">{combo.descripcion}</p>
                )}

                {/* Aderezos e Ingredientes modificables */}
                {combo.aderezosIncluidos && combo.aderezosIncluidos.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                      Incluye:
                    </span>
                    {combo.aderezosIncluidos.map((a, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleOcultar(combo)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                      combo.oculto
                        ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                    }`}
                    title={combo.oculto ? "Hacer click para publicar en el menú" : "Hacer click para ocultar por falta de stock"}
                  >
                    <span>{combo.oculto ? "🔴 Oculto (Sin stock)" : "🟢 Publicado"}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => abrirModalEditar(combo)}
                      className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>✏️</span>
                      <span>Modificar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarCombo(combo)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs p-1.5 rounded-xl cursor-pointer"
                      title="Eliminar combo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {combos.length === 0 && (
          <div className="col-span-full bg-[#151f2e] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            <span className="text-3xl block mb-1">🎁</span>
            <p className="text-sm">Aún no hay combos creados.</p>
            <p className="text-xs mt-1 text-slate-500">
              Presioná "+ Crear Nuevo Combo" para seleccionar una pizza y una bebida juntas.
            </p>
          </div>
        )}
      </div>

      {/* MODAL ARMADOR DE COMBOS */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🎁</span>
                <span>{comboEditando ? "Modificar Combo" : "Armador de Nuevo Combo"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCombo} className="space-y-4">
              {/* Vista previa visual interactiva lado a lado con fotos reales y carga de archivo */}
              <div className="bg-[#0d141e] border-2 border-emerald-500/40 rounded-2xl p-4 text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-2">
                  Vista Previa Visual del Combo (Fotos del Menú / Personalizadas)
                </span>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                  {/* Producto 1: Pizza */}
                  <div className="flex flex-col items-center">
                    <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-[#151f2e] border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden shadow-lg relative">
                      <img
                        src={formPizzaImagen || resolverImagenPizza(pizzaSeleccionada)}
                        alt={pizzaSeleccionada?.nombre}
                        className="w-full h-full object-cover filter drop-shadow"
                      />
                    </div>
                    <span className="text-xs font-bold text-white mt-1.5 text-center">
                      {pizzaSeleccionada?.nombre} ({formPizzaTamano}p)
                    </span>

                    {/* Botón para subir archivo de imagen de la pizza */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <label className="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs">
                        <span>📁</span>
                        <span>{subiendoFotoPizza ? "Subiendo..." : "Subir Imagen Pizza"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={subiendoFotoPizza}
                          onChange={handleSubirFotoPizza}
                          className="hidden"
                        />
                      </label>
                      {formPizzaImagen !== resolverImagenPizza(pizzaSeleccionada) && (
                        <button
                          type="button"
                          onClick={() => setFormPizzaImagen(resolverImagenPizza(pizzaSeleccionada))}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                          title="Restablecer imagen por defecto del menú"
                        >
                          ↺ Menú
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-2xl font-black text-emerald-400">+</span>

                  {/* Producto 2: Bebida u otro producto */}
                  <div className="flex flex-col items-center">
                    <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl bg-[#151f2e] border-2 border-emerald-500/50 flex items-center justify-center overflow-hidden shadow-lg relative">
                      {formBebidaImagen && (formBebidaImagen.startsWith("/") || formBebidaImagen.startsWith("http")) ? (
                        <img
                          src={formBebidaImagen}
                          alt={bebidaSeleccionada?.nombre}
                          className="w-full h-full object-contain p-1.5 filter drop-shadow"
                        />
                      ) : (
                        <span className="text-4xl">{bebidaSeleccionada?.imagenUrl || "🥤"}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white mt-1.5 text-center">
                      {bebidaSeleccionada?.nombre}
                    </span>

                    {/* Botón para subir archivo de imagen del segundo producto */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <label className="cursor-pointer text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 shadow-xs">
                        <span>📁</span>
                        <span>{subiendoFotoBebida ? "Subiendo..." : "Subir Imagen Bebida"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={subiendoFotoBebida}
                          onChange={handleSubirFotoBebida}
                          className="hidden"
                        />
                      </label>
                      {formBebidaImagen !== resolverImagenBebida(bebidaSeleccionada) && (
                        <button
                          type="button"
                          onClick={() => setFormBebidaImagen(resolverImagenBebida(bebidaSeleccionada))}
                          className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                          title="Restablecer imagen de catálogo"
                        >
                          ↺ Catálogo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 1: Elegir Pizza y Tamaño */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    1. Seleccionar Pizza
                  </label>
                  <select
                    value={formPizzaId}
                    onChange={(e) => handleCambioPizza(e.target.value)}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    {pizzas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (4p: ${p.precio4} / 8p: ${p.precio8})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Tamaño
                  </label>
                  <select
                    value={formPizzaTamano}
                    onChange={(e) => setFormPizzaTamano(e.target.value as "4" | "8")}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value="8">8 Porciones (Grande)</option>
                    <option value="4">4 Porciones (Chica)</option>
                  </select>
                </div>
              </div>

              {/* Paso 2: Elegir Bebida */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  2. Seleccionar Bebida
                </label>
                <select
                  value={formBebidaId}
                  onChange={(e) => handleCambioBebida(e.target.value)}
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {bebidas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nombre} (${b.precio}) - {b.categoria}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paso 3: Nombre y Precio Promocional */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Título del Combo
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Combo Boston: Napolitana 8p + Coca 1.5L"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Precio Combo ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(Number(e.target.value))}
                    placeholder="26500"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Paso 4: Aderezos e Ingredientes Modificables */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <span className="block text-[11px] font-bold uppercase text-emerald-400">
                  Aderezos e Ingredientes Incluidos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {aderezos.map((ad) => {
                    const activo = formAderezos.includes(ad.nombre);
                    return (
                      <button
                        key={ad.id}
                        type="button"
                        onClick={() => toggleAderezo(ad.nombre)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          activo
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-[#0d141e] text-slate-300 border border-white/10"
                        }`}
                      >
                        {ad.nombre} {activo ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="chkModif"
                    checked={formPermitirModificar}
                    onChange={(e) => setFormPermitirModificar(e.target.checked)}
                    className="rounded border-white/20 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chkModif" className="text-xs text-slate-300 cursor-pointer">
                    Permitir al cliente personalizar ingredientes o aderezos al encargar
                  </label>
                </div>
              </div>

              {/* Ocultar publicación / Pausar por falta de stock */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0d141e] border border-white/10">
                <input
                  type="checkbox"
                  id="chkOcultoCombo"
                  checked={formOculto}
                  onChange={(e) => setFormOculto(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-red-500 focus:ring-0 cursor-pointer accent-red-500"
                />
                <label htmlFor="chkOcultoCombo" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Ocultar publicación en el menú (Pausar combo por falta de stock o ingredientes agotados)
                </label>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || subiendoFotoPizza || subiendoFotoBebida}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar Combo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
