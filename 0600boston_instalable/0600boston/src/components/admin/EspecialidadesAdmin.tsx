"use client";

import React, { useState, useRef } from "react";
import { PizzaDataType, IngredienteCatalogItem } from "@/lib/catalog-db";
import { subirImagenAlServidor } from "@/lib/client-image";

interface EspecialidadesAdminProps {
  pizzas: PizzaDataType[];
  ingredientesCatalogo: IngredienteCatalogItem[];
  onRecargarCatalogo: () => void;
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

export function EspecialidadesAdmin({
  pizzas,
  ingredientesCatalogo,
  onRecargarCatalogo,
  onMostrarNotificacion,
}: EspecialidadesAdminProps) {
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [quitarFondoModal, setQuitarFondoModal] = useState(false);

  // Subida de foto directa desde la tarjeta de la lista
  const fileInputDirectoRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [pizzaParaFotoDirecta, setPizzaParaFotoDirecta] = useState<PizzaDataType | null>(null);
  const [subiendoFotoId, setSubiendoFotoId] = useState<string | null>(null);
  const [errorSubidaFoto, setErrorSubidaFoto] = useState<string | null>(null);

  // Estado del formulario de edición / alta
  const [pizzaEditando, setPizzaEditando] = useState<PizzaDataType | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formPrecio4, setFormPrecio4] = useState<number>(0);
  const [formPrecio8, setFormPrecio8] = useState<number>(0);
  const [formImagen, setFormImagen] = useState("");
  const [formOculto, setFormOculto] = useState(false);
  const [formIngredientes, setFormIngredientes] = useState<
    Array<{
      id: string;
      nombre: string;
      icono: string;
      color: string;
      imagenUrl?: string;
      posiciones: Array<{ x: number; y: number; rot: number; scale?: number }>;
    }>
  >([]);

  // Sub-formulario rápido para crear un nuevo ingrediente dentro de la pizza
  const [mostrarSubFormIng, setMostrarSubFormIng] = useState(false);
  const [nuevoIngNombre, setNuevoIngNombre] = useState("");
  const [nuevoIngIcono, setNuevoIngIcono] = useState("🍕");
  const [nuevoIngFotoUrl, setNuevoIngFotoUrl] = useState("");
  const [subiendoFotoIng, setSubiendoFotoIng] = useState(false);

  const abrirModalCrear = () => {
    setPizzaEditando(null);
    setFormNombre("");
    setFormDescripcion("");
    setFormPrecio4(12000);
    setFormPrecio8(24000);
    setFormImagen("🍕");
    setFormOculto(false);
    setFormIngredientes([]);
    setQuitarFondoModal(false);
    setErrorSubidaFoto(null);
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    setModalAbierto(true);
  };

  const abrirModalEditar = (p: PizzaDataType) => {
    setPizzaEditando(p);
    setFormNombre(p.nombre);
    setFormDescripcion(p.descripcion);
    setFormPrecio4(p.precio4);
    setFormPrecio8(p.precio8);
    setFormImagen(p.imagen || "🍕");
    setFormOculto(Boolean(p.oculto));
    setFormIngredientes(p.ingredientesDecorables ? [...p.ingredientesDecorables] : []);
    setQuitarFondoModal(false);
    setErrorSubidaFoto(null);
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    setModalAbierto(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>, esIngrediente = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reseteamos el valor en el DOM para permitir seleccionar el mismo archivo consecutivamente
    e.target.value = "";
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
    setErrorSubidaFoto(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("removeBg", esIngrediente ? "true" : (quitarFondoModal ? "true" : "false"));

    if (esIngrediente) setSubiendoFotoIng(true);
    else setSubiendoFoto(true);

    try {
      const data = await subirImagenAlServidor(file, {
        removeBg: esIngrediente ? true : quitarFondoModal,
        maxDimension: 1400,
      });

      if (esIngrediente) {
        setNuevoIngFotoUrl(data.url);
        onMostrarNotificacion("Foto de ingrediente optimizada y con fondo transparente.", "exito");
      } else {
        setFormImagen(data.url);
        setErrorSubidaFoto(null);
        onMostrarNotificacion("Foto de pizza cargada y optimizada con éxito.", "exito");
      }
    } catch (err: any) {
      setErrorSubidaFoto(err.message || "Error al subir la imagen");
      onMostrarNotificacion(err.message || "Error al subir la foto", "error");
    } finally {
      if (esIngrediente) setSubiendoFotoIng(false);
      else setSubiendoFoto(false);
    }
  };

  // Subida directa de foto para una pizza desde la lista sin abrir modal completo
  const handleSubirFotoDirecta = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pizzaParaFotoDirecta) return;

    e.target.value = "";
    if (fileInputDirectoRef.current) fileInputDirectoRef.current.value = "";

    setSubiendoFotoId(pizzaParaFotoDirecta.id);

    try {
      const data = await subirImagenAlServidor(file, {
        removeBg: false, // Mantener la foto completa de la pizza (en caja o tabla)
        maxDimension: 1400,
      });

      const payload: PizzaDataType = {
        ...pizzaParaFotoDirecta,
        imagen: data.url,
      };

      const saveRes = await fetch("/api/catalog/pizzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) throw new Error("Error al guardar la foto de la pizza");

      onMostrarNotificacion(`¡Foto de "${pizzaParaFotoDirecta.nombre}" actualizada con éxito!`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message || "Error al cargar la foto", "error");
    } finally {
      setSubiendoFotoId(null);
      setPizzaParaFotoDirecta(null);
      if (fileInputDirectoRef.current) fileInputDirectoRef.current.value = "";
    }
  };

  const handleGuardarPizza = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const payload: PizzaDataType = {
      id: pizzaEditando ? pizzaEditando.id : `pizza_${Date.now()}`,
      nombre: formNombre.trim(),
      descripcion: formDescripcion.trim(),
      precio4: Number(formPrecio4),
      precio8: Number(formPrecio8),
      imagen: formImagen,
      oculto: formOculto,
      ingredientesDecorables: formIngredientes,
    };

    try {
      const res = await fetch("/api/catalog/pizzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      onMostrarNotificacion(
        pizzaEditando
          ? `Especialidad "${formNombre}" actualizada con éxito.`
          : `Especialidad "${formNombre}" creada con éxito.`,
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

  const handleToggleOcultar = async (p: PizzaDataType) => {
    try {
      const res = await fetch("/api/catalog/pizzas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...p, oculto: !p.oculto }),
      });
      if (!res.ok) throw new Error("Error al modificar estado");
      onMostrarNotificacion(
        p.oculto
          ? `"${p.nombre}" ahora está visible y publicado en el menú.`
          : `"${p.nombre}" fue ocultado del menú (sin stock).`,
        "exito"
      );
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const handleEliminarPizza = async (p: PizzaDataType) => {
    if (!confirm(`¿Estás seguro de eliminar la especialidad "${p.nombre}"?`)) return;

    try {
      const res = await fetch(`/api/catalog/pizzas?id=${p.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      onMostrarNotificacion(`Especialidad "${p.nombre}" eliminada.`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  // Alternar o añadir ingrediente desde el banco global
  const toggleIngredienteCatalogo = (catIng: IngredienteCatalogItem) => {
    const yaExiste = formIngredientes.some((i) => i.id === catIng.id);
    if (yaExiste) {
      setFormIngredientes(formIngredientes.filter((i) => i.id !== catIng.id));
    } else {
      // Posiciones de decorado por defecto
      const posicionesDefault = [
        { x: 35, y: 35, rot: 15, scale: 1.0 },
        { x: 65, y: 35, rot: -20, scale: 1.0 },
        { x: 35, y: 65, rot: 30, scale: 1.0 },
        { x: 65, y: 65, rot: -15, scale: 1.0 },
        { x: 50, y: 50, rot: 5, scale: 1.1 },
      ];
      setFormIngredientes([
        ...formIngredientes,
        {
          id: catIng.id,
          nombre: catIng.nombre,
          icono: catIng.icono,
          color: catIng.color || "#15803d",
          imagenUrl: catIng.imagenUrl,
          posiciones: posicionesDefault,
        },
      ]);
    }
  };

  // Agregar ingrediente nuevo al vuelo
  const handleCrearIngredienteAlVuelo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoIngNombre.trim()) return;

    const id = `ing_${nuevoIngNombre.toLowerCase().replace(/[^a-z0-9]/g, "-")}_${Date.now().toString().slice(-4)}`;
    const nuevo: IngredienteCatalogItem = {
      id,
      nombre: nuevoIngNombre.trim(),
      icono: nuevoIngIcono || "🌿",
      imagenUrl: nuevoIngFotoUrl,
      categoriaAsignada: "pizzas",
      especialidadesAsignadas: pizzaEditando ? [pizzaEditando.id] : [],
    };

    try {
      const res = await fetch("/api/catalog/ingredientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo),
      });
      if (!res.ok) throw new Error("No se pudo guardar el nuevo ingrediente en el catálogo");

      // Sumarlo a la pizza actual directamente
      setFormIngredientes([
        ...formIngredientes,
        {
          id: nuevo.id,
          nombre: nuevo.nombre,
          icono: nuevo.icono,
          color: "#15803d",
          imagenUrl: nuevo.imagenUrl,
          posiciones: [
            { x: 35, y: 35, rot: 15, scale: 1.0 },
            { x: 65, y: 35, rot: -20, scale: 1.0 },
            { x: 50, y: 50, rot: 5, scale: 1.1 },
          ],
        },
      ]);

      setNuevoIngNombre("");
      setNuevoIngFotoUrl("");
      setMostrarSubFormIng(false);
      onMostrarNotificacion(`Ingrediente "${nuevo.nombre}" sumado al catálogo y a esta pizza.`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const pizzasFiltradas = pizzas.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barra superior de acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🍕</span>
            <span>Especialidades de Pizzas ({pizzas.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Podés modificar nombres (ej. Napolitana Boston), agregar ingredientes con foto, y fijar porciones e importes.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar especialidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 w-full sm:w-48"
          />
          <button
            type="button"
            onClick={abrirModalCrear}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Nueva Pizza</span>
          </button>
        </div>
      </div>

      {/* Lista detallada con imagen lado a lado, ingredientes con foto, porciones e importes */}
      <div className="space-y-3">
        {pizzasFiltradas.map((pizza) => (
          <div
            key={pizza.id}
            className={`bg-[#151f2e] border ${
              pizza.oculto
                ? "border-red-500/35 bg-[#151f2e]/75 opacity-85"
                : "border-white/10 hover:border-emerald-500/30"
            } rounded-2xl p-4 shadow-xl transition-all grid grid-cols-1 lg:grid-cols-12 gap-4 items-center`}
          >
            {/* Columna 1: Nombre + Imagen lado a lado */}
            <div className="lg:col-span-4 flex items-center gap-3.5">
              <div
                onClick={() => {
                  setPizzaParaFotoDirecta(pizza);
                  fileInputDirectoRef.current?.click();
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#0d141e] border-2 border-emerald-500/30 hover:border-emerald-400 flex items-center justify-center relative overflow-hidden flex-shrink-0 shadow-md group cursor-pointer transition-all hover:scale-105"
                title="Hacé clic para cargar o cambiar la foto de esta pizza"
              >
                {subiendoFotoId === pizza.id ? (
                  <div className="flex flex-col items-center justify-center text-center p-1">
                    <span className="animate-spin text-lg">⏳</span>
                    <span className="text-[8px] text-emerald-300 font-bold mt-1">Subiendo...</span>
                  </div>
                ) : pizza.imagen && (pizza.imagen.startsWith("/") || pizza.imagen.startsWith("http")) ? (
                  <>
                    <img
                      src={pizza.imagen}
                      alt={pizza.nombre}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      <span className="text-base">📸</span>
                      <span>Cambiar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-3xl sm:text-4xl">{pizza.imagen || "🍕"}</span>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-opacity">
                      <span className="text-base">📸</span>
                      <span>Subir Foto</span>
                    </div>
                  </>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-white text-base tracking-tight truncate">
                    {pizza.nombre}
                  </h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                    ID: {pizza.id}
                  </span>
                  {pizza.oculto && (
                    <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <span>⏸️</span>
                      <span>Sin Stock / Oculto</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {pizza.descripcion}
                </p>
              </div>
            </div>

            {/* Columna 2: Ingredientes en forma de lista y al lado su foto */}
            <div className="lg:col-span-4 bg-[#0d141e]/70 border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1.5">
                Ingredientes ({pizza.ingredientesDecorables?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                {(pizza.ingredientesDecorables || []).map((ing: any) => (
                  <div
                    key={ing.id}
                    className="flex items-center gap-1.5 bg-[#182333] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200"
                  >
                    {ing.imagenUrl ? (
                      <img
                        src={ing.imagenUrl}
                        alt={ing.nombre}
                        className="w-4 h-4 object-contain rounded-full"
                      />
                    ) : (
                      <span>{ing.icono}</span>
                    )}
                    <span className="truncate max-w-[110px]">{ing.nombre}</span>
                  </div>
                ))}
                {(!pizza.ingredientesDecorables || pizza.ingredientesDecorables.length === 0) && (
                  <span className="text-xs text-slate-500 italic">Sin ingredientes decorativos asignados</span>
                )}
              </div>
            </div>

            {/* Columna 3: Porciones y Precios */}
            <div className="lg:col-span-2 flex flex-col justify-center bg-[#0d141e]/50 border border-white/5 rounded-xl p-2.5 font-mono text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">4 porc.:</span>
                <span className="font-bold text-emerald-400">
                  ${pizza.precio4.toLocaleString("es-AR")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">8 porc.:</span>
                <span className="font-bold text-emerald-400">
                  ${pizza.precio8.toLocaleString("es-AR")}
                </span>
              </div>
            </div>

            {/* Columna 4: Acciones */}
            <div className="lg:col-span-2 flex lg:flex-col items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleToggleOcultar(pizza)}
                className={`flex-1 lg:w-full font-bold text-xs py-1.5 px-2.5 rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer border ${
                  pizza.oculto
                    ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40"
                    : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}
                title={pizza.oculto ? "Pausada por stock. Click para publicar en menú" : "Publicada. Click para ocultar por falta de stock"}
              >
                <span>{pizza.oculto ? "🔴" : "🟢"}</span>
                <span>{pizza.oculto ? "Oculto (Sin Stock)" : "Publicado"}</span>
              </button>
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setPizzaParaFotoDirecta(pizza);
                    fileInputDirectoRef.current?.click();
                  }}
                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  title="Cargar o cambiar foto desde archivo"
                >
                  <span>📸</span>
                  <span className="hidden sm:inline">Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => abrirModalEditar(pizza)}
                  className="flex-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs py-1.5 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>✏️</span>
                  <span>Modificar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminarPizza(pizza)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs p-1.5 rounded-xl transition-all cursor-pointer"
                  title="Eliminar especialidad"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {pizzasFiltradas.length === 0 && (
          <div className="bg-[#151f2e] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            <span className="text-3xl block mb-1">🔍</span>
            <p className="text-sm">No se encontraron especialidades con ese criterio.</p>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN / ALTA COMPLETA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🍕</span>
                <h3 className="text-lg font-black text-white">
                  {pizzaEditando ? `Modificar "${pizzaEditando.nombre}"` : "Alta de Nueva Especialidad"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-black px-2 py-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarPizza} className="space-y-4">
              {/* Ocultar publicación por falta de stock */}
              <div className="bg-[#0d141e] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chkOcultarPizza"
                    checked={formOculto}
                    onChange={(e) => setFormOculto(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 text-red-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chkOcultarPizza" className="text-xs text-white font-bold cursor-pointer">
                    Ocultar publicación en el menú (Pausar por falta de stock o agotado)
                  </label>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    formOculto
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {formOculto ? "🔴 Oculto" : "🟢 Visible"}
                </span>
              </div>
              {/* Nombre de la pizza (ejemplo: Napolitana Boston) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Nombre de la Especialidad
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Napolitana Boston"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Podés renombrarla temporalmente (ej: promociones de temporada).
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Emoji o Icono
                  </label>
                  <input
                    type="text"
                    value={formImagen}
                    onChange={(e) => setFormImagen(e.target.value)}
                    placeholder="🍕 o URL de imagen"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Subida de foto de la pizza */}
              <div className="bg-[#0d141e] border border-dashed border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>📸</span>
                    <span>Foto de la Pizza (Se mostrará en el menú del admin y de los clientes)</span>
                  </label>
                  <label className="text-[10px] text-slate-400 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quitarFondoModal}
                      onChange={(e) => setQuitarFondoModal(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 text-emerald-500"
                    />
                    <span>Quitar fondo (Solo para ingredientes aislados)</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">
                  💡 Para fotos de la pizza entera (en caja o plato), mantené la casilla de quitar fondo <strong>desmarcada</strong> para que la foto se vea completa.
                </p>

                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSubirFoto(e, false)}
                  className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer w-full"
                />

                {subiendoFoto && (
                  <p className="text-xs text-emerald-400 font-bold animate-pulse">
                    Optimizando y subiendo foto de la pizza...
                  </p>
                )}

                {errorSubidaFoto && (
                  <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>{errorSubidaFoto}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorSubidaFoto(null)}
                      className="text-red-400 hover:text-white font-bold ml-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {formImagen && (formImagen.startsWith("/") || formImagen.startsWith("http")) && (
                  <div className="mt-2.5 flex items-center gap-3 bg-[#151f2e] border border-emerald-500/40 rounded-xl p-2.5">
                    <img
                      src={formImagen}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-emerald-400 shadow-md shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-emerald-300 font-bold block">
                        Foto asignada a esta especialidad
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {formImagen}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormImagen("🍕");
                        setErrorSubidaFoto(null);
                        if (modalFileInputRef.current) modalFileInputRef.current.value = "";
                      }}
                      className="text-[10px] text-red-300 hover:text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 px-2 py-1 rounded-lg transition-all cursor-pointer font-bold shrink-0"
                    >
                      Quitar foto
                    </button>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  Descripción e Ingredientes Generales
                </label>
                <textarea
                  rows={2}
                  required
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Salsa de tomate casera, muzzarella, albahaca fresca..."
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Porciones e Importes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Precio 4 Porciones ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrecio4}
                    onChange={(e) => setFormPrecio4(Number(e.target.value))}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Precio 8 Porciones ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrecio8}
                    onChange={(e) => setFormPrecio8(Number(e.target.value))}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* SECCIÓN DE INGREDIENTES CON MINIATURA */}
              <div className="border-t border-white/10 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>🧅</span>
                    <span>Ingredientes de esta Especialidad ({formIngredientes.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setMostrarSubFormIng(!mostrarSubFormIng)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                  >
                    {mostrarSubFormIng ? "Cerrar alta de ingrediente" : "+ Agregar Nuevo Ingrediente con Foto"}
                  </button>
                </div>

                {/* Sub-formulario para agregar un ingrediente nuevo al vuelo */}
                {mostrarSubFormIng && (
                  <div className="bg-[#0d141e] border border-emerald-500/40 rounded-xl p-3 space-y-2.5">
                    <span className="text-[11px] font-bold text-white block">
                      Crear ingrediente y sumarlo a esta pizza:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre ingrediente (ej. Panceta)"
                        value={nuevoIngNombre}
                        onChange={(e) => setNuevoIngNombre(e.target.value)}
                        className="bg-[#151f2e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Emoji (ej. 🥓)"
                        value={nuevoIngIcono}
                        onChange={(e) => setNuevoIngIcono(e.target.value)}
                        className="bg-[#151f2e] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSubirFoto(e, true)}
                          className="text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-emerald-600 file:text-white cursor-pointer"
                        />
                      </div>
                    </div>
                    {subiendoFotoIng && (
                      <p className="text-[11px] text-emerald-400 font-bold animate-pulse">
                        Subiendo foto de ingrediente con fondo transparente...
                      </p>
                    )}
                    {nuevoIngFotoUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={nuevoIngFotoUrl}
                          alt="Ingrediente"
                          className="w-8 h-8 object-contain rounded-lg border border-emerald-500"
                        />
                        <span className="text-[10px] text-emerald-400 font-bold">
                          Foto con transparencia lista
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleCrearIngredienteAlVuelo}
                      className="bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-colors"
                    >
                      Sumar Ingrediente a la Pizza
                    </button>
                  </div>
                )}

                {/* Lista de ingredientes activos para esta pizza */}
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[#0d141e] rounded-xl border border-white/5">
                  {formIngredientes.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center gap-2 bg-[#182333] border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      {ing.imagenUrl ? (
                        <img
                          src={ing.imagenUrl}
                          alt={ing.nombre}
                          className="w-5 h-5 object-contain rounded-full"
                        />
                      ) : (
                        <span>{ing.icono}</span>
                      )}
                      <span>{ing.nombre}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormIngredientes(formIngredientes.filter((i) => i.id !== ing.id))
                        }
                        className="text-red-400 hover:text-red-300 ml-1 font-bold"
                        title="Quitar de esta pizza"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {formIngredientes.length === 0 && (
                    <p className="text-xs text-slate-500 p-2 italic">
                      Seleccioná ingredientes del banco inferior o creá uno nuevo.
                    </p>
                  )}
                </div>

                {/* Selector rápido desde el banco global de ingredientes */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-2">
                  Seleccionar del banco global de ingredientes:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-[#0d141e]/60 rounded-xl border border-white/5">
                  {ingredientesCatalogo.map((catIng) => {
                    const activo = formIngredientes.some((i) => i.id === catIng.id);
                    return (
                      <button
                        key={catIng.id}
                        type="button"
                        onClick={() => toggleIngredienteCatalogo(catIng)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          activo
                            ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                            : "bg-[#182333] text-slate-300 border border-white/10 hover:border-emerald-400/40"
                        }`}
                      >
                        {catIng.imagenUrl ? (
                          <img
                            src={catIng.imagenUrl}
                            alt={catIng.nombre}
                            className="w-3.5 h-3.5 object-contain"
                          />
                        ) : (
                          <span>{catIng.icono}</span>
                        )}
                        <span>{catIng.nombre}</span>
                        <span>{activo ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                >
                  <span>{guardando ? "Guardando..." : "Guardar Especialidad"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
