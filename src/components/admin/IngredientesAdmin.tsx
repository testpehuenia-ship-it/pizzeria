"use client";

import React, { useState } from "react";
import { IngredienteCatalogItem, PizzaDataType, CategoriaConfig } from "@/lib/catalog-db";
import { subirImagenAlServidor } from "@/lib/client-image";

interface IngredientesAdminProps {
  ingredientes: IngredienteCatalogItem[];
  pizzas: PizzaDataType[];
  categorias: CategoriaConfig[];
  onRecargarCatalogo: () => void;
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

export function IngredientesAdmin({
  ingredientes,
  pizzas,
  categorias,
  onRecargarCatalogo,
  onMostrarNotificacion,
}: IngredientesAdminProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroAsignacion, setFiltroAsignacion] = useState<"todos" | "pizzas" | "ninguno">("todos");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Formulario
  const [ingEditando, setIngEditando] = useState<IngredienteCatalogItem | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formIcono, setFormIcono] = useState("🌿");
  const [formImagenUrl, setFormImagenUrl] = useState("");
  const [formCategoriaAsignada, setFormCategoriaAsignada] = useState<string>("ninguno");
  const [formEspecialidades, setFormEspecialidades] = useState<string[]>([]);
  const [formOculto, setFormOculto] = useState(false);

  const abrirModalCrear = () => {
    setIngEditando(null);
    setFormNombre("");
    setFormIcono("🌿");
    setFormImagenUrl("");
    setFormCategoriaAsignada("ninguno"); // Por defecto ninguno como pidió el usuario
    setFormEspecialidades([]);
    setFormOculto(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (ing: IngredienteCatalogItem) => {
    setIngEditando(ing);
    setFormNombre(ing.nombre);
    setFormIcono(ing.icono || "🌿");
    setFormImagenUrl(ing.imagenUrl || "");
    setFormCategoriaAsignada(ing.categoriaAsignada || "ninguno");
    setFormEspecialidades(ing.especialidadesAsignadas ? [...ing.especialidadesAsignadas] : []);
    setFormOculto(ing.oculto ?? false);
    setModalAbierto(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    e.target.value = "";

    setSubiendoFoto(true);
    try {
      const data = await subirImagenAlServidor(file, { removeBg: true, maxDimension: 1000 });
      setFormImagenUrl(data.url);
      onMostrarNotificacion("Foto de ingrediente optimizada y con fondo transparente.", "exito");
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleGuardarIngrediente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const payload: IngredienteCatalogItem = {
      id: ingEditando ? ingEditando.id : `ing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nombre: formNombre.trim(),
      icono: formIcono.trim() || "🌿",
      imagenUrl: formImagenUrl.trim(),
      categoriaAsignada: formCategoriaAsignada,
      especialidadesAsignadas: formCategoriaAsignada === "pizzas" ? formEspecialidades : [],
      oculto: formOculto,
    };

    try {
      const res = await fetch("/api/catalog/ingredientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar ingrediente");

      onMostrarNotificacion(
        ingEditando
          ? `Ingrediente "${formNombre}" actualizado.`
          : `Ingrediente "${formNombre}" añadido al catálogo.`,
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

  const handleToggleOcultar = async (ing: IngredienteCatalogItem) => {
    const nuevoEstado = !ing.oculto;
    const payload: IngredienteCatalogItem = {
      ...ing,
      oculto: nuevoEstado,
    };

    try {
      const res = await fetch("/api/catalog/ingredientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo actualizar visibilidad");
      onMostrarNotificacion(
        nuevoEstado
          ? `Ingrediente "${ing.nombre}" ocultado (Pausado por stock).`
          : `Ingrediente "${ing.nombre}" publicado y visible.`,
        "exito"
      );
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const handleEliminarIngrediente = async (ing: IngredienteCatalogItem) => {
    if (!confirm(`¿Eliminar el ingrediente "${ing.nombre}" del banco global?`)) return;

    try {
      const res = await fetch(`/api/catalog/ingredientes?id=${ing.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      onMostrarNotificacion(`Ingrediente "${ing.nombre}" eliminado.`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const togglePizzaAsignada = (pizzaId: string) => {
    if (formEspecialidades.includes(pizzaId)) {
      setFormEspecialidades(formEspecialidades.filter((id) => id !== pizzaId));
    } else {
      setFormEspecialidades([...formEspecialidades, pizzaId]);
    }
  };

  const ingredientesFiltrados = ingredientes.filter((ing) => {
    const coincideBusqueda = ing.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (!coincideBusqueda) return false;
    if (filtroAsignacion === "pizzas") return ing.categoriaAsignada === "pizzas";
    if (filtroAsignacion === "ninguno") return ing.categoriaAsignada === "ninguno" || !ing.categoriaAsignada;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Barra superior del banco de ingredientes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🧅</span>
            <span>Banco Global de Ingredientes ({ingredientes.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Agregá ingredientes con su foto transparente. Asignalos a una categoría de Pizza o dejalos en{" "}
            <strong className="text-emerald-300">"Ninguno"</strong> para usarlos en futuras especialidades o categorías.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 w-full sm:w-44"
          />
          <button
            type="button"
            onClick={abrirModalCrear}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Nuevo Ingrediente</span>
          </button>
        </div>
      </div>

      {/* Filtros de Asignación */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFiltroAsignacion("todos")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filtroAsignacion === "todos"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "bg-[#151f2e] text-slate-300 border border-white/10 hover:border-emerald-400/40"
          }`}
        >
          Todos ({ingredientes.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroAsignacion("pizzas")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filtroAsignacion === "pizzas"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "bg-[#151f2e] text-slate-300 border border-white/10 hover:border-emerald-400/40"
          }`}
        >
          Asignados a Pizzas
        </button>
        <button
          type="button"
          onClick={() => setFiltroAsignacion("ninguno")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filtroAsignacion === "ninguno"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md"
              : "bg-[#151f2e] text-slate-300 border border-white/10 hover:border-emerald-400/40"
          }`}
        >
          ✨ Libres (Ninguno)
        </button>
      </div>

      {/* Grilla visual de ingredientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ingredientesFiltrados.map((ing) => (
          <div
            key={ing.id}
            className={`bg-[#151f2e] border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
              ing.oculto
                ? "border-red-500/40 bg-[#151f2e]/75 opacity-90 shadow-red-950/20"
                : "border-white/10 hover:border-emerald-500/30"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      ing.categoriaAsignada === "ninguno" || !ing.categoriaAsignada
                        ? "bg-amber-950/60 text-amber-300 border-amber-500/30"
                        : "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {ing.categoriaAsignada === "ninguno" || !ing.categoriaAsignada
                      ? "✨ Libre (Ninguno)"
                      : `Asignado: ${ing.categoriaAsignada}`}
                  </span>
                  {ing.oculto && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 animate-pulse">
                      ⏸️ Sin Stock
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ID: {ing.id}</span>
              </div>

              {/* Foto o Miniatura con fondo transparente */}
              <div className="w-full h-24 bg-[#0d141e] rounded-xl border border-white/5 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                {ing.imagenUrl ? (
                  <img
                    src={ing.imagenUrl}
                    alt={ing.nombre}
                    className="max-h-20 max-w-[80%] object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                  />
                ) : (
                  <span className="text-4xl">{ing.icono || "🌿"}</span>
                )}
              </div>

              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <span>{ing.icono}</span>
                <span className="truncate">{ing.nombre}</span>
              </h3>

              {ing.especialidadesAsignadas && ing.especialidadesAsignadas.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  En especialidades: {ing.especialidadesAsignadas.join(", ")}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleOcultar(ing)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    ing.oculto
                      ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
                  title={ing.oculto ? "Hacer click para volver a publicar este ingrediente" : "Hacer click para ocultar por falta de stock"}
                >
                  <span>{ing.oculto ? "🔴 Oculto (Sin stock)" : "🟢 Publicado"}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(ing)}
                    className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>✏️</span>
                    <span>Modificar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarIngrediente(ing)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs p-1.5 rounded-xl cursor-pointer"
                    title="Eliminar ingrediente"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {ingredientesFiltrados.length === 0 && (
          <div className="col-span-full bg-[#151f2e] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            <span className="text-3xl block mb-1">🧅</span>
            <p className="text-sm">No se encontraron ingredientes con ese filtro.</p>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN / ALTA DE INGREDIENTE */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🧅</span>
                <span>{ingEditando ? `Modificar "${ingEditando.nombre}"` : "Alta de Nuevo Ingrediente"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarIngrediente} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  Nombre del Ingrediente
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Panceta Ahumada Crocante"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Icono Emoji
                  </label>
                  <input
                    type="text"
                    value={formIcono}
                    onChange={(e) => setFormIcono(e.target.value)}
                    placeholder="🥓"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Asignación de Categoría
                  </label>
                  <select
                    value={formCategoriaAsignada}
                    onChange={(e) => setFormCategoriaAsignada(e.target.value)}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="ninguno">✨ Ninguno (Libre / Global)</option>
                    <option value="pizzas">Pizzas</option>
                    {categorias
                      .filter((c) => c.slug !== "pizzas" && c.slug !== "bebidas" && c.slug !== "combos")
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Subida de foto con remoción de fondo */}
              <div className="bg-[#0d141e] border border-dashed border-emerald-500/40 rounded-xl p-3 text-center">
                <label className="block text-[11px] font-bold text-emerald-300 mb-1.5">
                  📸 Foto del Ingrediente (Fondo Transparente Automático)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSubirFoto}
                  className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
                />
                {subiendoFoto && (
                  <p className="text-xs text-emerald-400 mt-1.5 font-bold animate-pulse">
                    Procesando y quitando fondo con Sharp...
                  </p>
                )}
                {formImagenUrl && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <img
                      src={formImagenUrl}
                      alt="Preview"
                      className="w-12 h-12 object-contain rounded-lg border border-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-400 font-bold">
                      Fondo transparente verificado
                    </span>
                  </div>
                )}
              </div>

              {/* Si asignó a Pizzas, permitir marcar en qué especialidades aparece */}
              {formCategoriaAsignada === "pizzas" && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase text-slate-300">
                    Asignar a Especialidades de Pizza específicas:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#0d141e] rounded-xl border border-white/5">
                    {pizzas.map((p) => {
                      const seleccionada = formEspecialidades.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePizzaAsignada(p.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                            seleccionada
                              ? "bg-emerald-500 text-slate-950 font-bold"
                              : "bg-[#182333] text-slate-300 border border-white/10"
                          }`}
                        >
                          {p.nombre} {seleccionada ? "✓" : "+"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ocultar publicación / Pausar por falta de stock */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0d141e] border border-white/10">
                <input
                  type="checkbox"
                  id="chkOcultoIng"
                  checked={formOculto}
                  onChange={(e) => setFormOculto(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-red-500 focus:ring-0 cursor-pointer accent-red-500"
                />
                <label htmlFor="chkOcultoIng" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Ocultar ingrediente en el menú (Pausar por falta de stock o agotado)
                </label>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  {guardando ? "Guardando..." : "Guardar Ingrediente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
