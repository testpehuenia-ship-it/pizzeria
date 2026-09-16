"use client";

import React, { useState } from "react";
import { CategoriaConfig, IngredienteCatalogItem } from "@/lib/catalog-db";
import { subirImagenAlServidor } from "@/lib/client-image";

interface CategoriasNuevasAdminProps {
  categorias: CategoriaConfig[];
  ingredientesCatalogo: IngredienteCatalogItem[];
  onRecargarCatalogo: () => void;
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

export function CategoriasNuevasAdmin({
  categorias,
  ingredientesCatalogo,
  onRecargarCatalogo,
  onMostrarNotificacion,
}: CategoriasNuevasAdminProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Formulario de creación de categoría
  const [catEditando, setCatEditando] = useState<CategoriaConfig | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formIcono, setFormIcono] = useState("🍔");
  const [formBaseNombre, setFormBaseNombre] = useState("");
  const [formBaseDescripcion, setFormBaseDescripcion] = useState("");
  const [formBaseImagen, setFormBaseImagen] = useState("");
  const [formBasePrecio, setFormBasePrecio] = useState<number>(12000);
  const [formIngredientesPersonalizables, setFormIngredientesPersonalizables] = useState<string[]>([]);
  const [nuevoIngNombre, setNuevoIngNombre] = useState("");

  const abrirModalCrear = () => {
    setCatEditando(null);
    setFormNombre("Hamburguesas");
    setFormIcono("🍔");
    setFormBaseNombre("Hamburguesa Simple: Pan y Carne");
    setFormBaseDescripcion("Pan brioche artesanal tostado y medallón de carne 180g");
    setFormBaseImagen("/images/ingredientes/calabresa.png");
    setFormBasePrecio(12500);
    setFormIngredientesPersonalizables([
      "Queso Cheddar",
      "Cebolla Caramelizada",
      "Papas Fritas",
      "Panceta",
      "Huevo Frito",
    ]);
    setModalAbierto(true);
  };

  const abrirModalEditar = (c: CategoriaConfig) => {
    setCatEditando(c);
    setFormNombre(c.nombre);
    setFormIcono(c.icono);
    setFormBaseNombre(c.productoBase?.nombre || "");
    setFormBaseDescripcion(c.productoBase?.descripcionBase || "");
    setFormBaseImagen(c.productoBase?.imagenBase || "");
    setFormBasePrecio(c.productoBase?.precioBase || 0);
    setFormIngredientesPersonalizables(c.ingredientesPersonalizables ? [...c.ingredientesPersonalizables] : []);
    setModalAbierto(true);
  };

  const handleSubirFotoBase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    e.target.value = "";

    setSubiendoFoto(true);
    try {
      const data = await subirImagenAlServidor(file, { removeBg: true, maxDimension: 1200 });
      setFormBaseImagen(data.url);
      onMostrarNotificacion("Foto del producto base optimizada con fondo transparente.", "exito");
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const agregarIngredientePersonalizable = () => {
    if (!nuevoIngNombre.trim()) return;
    if (!formIngredientesPersonalizables.includes(nuevoIngNombre.trim())) {
      setFormIngredientesPersonalizables([...formIngredientesPersonalizables, nuevoIngNombre.trim()]);
    }
    setNuevoIngNombre("");
  };

  const toggleIngredienteCatalogo = (nombre: string) => {
    if (formIngredientesPersonalizables.includes(nombre)) {
      setFormIngredientesPersonalizables(formIngredientesPersonalizables.filter((i) => i !== nombre));
    } else {
      setFormIngredientesPersonalizables([...formIngredientesPersonalizables, nombre]);
    }
  };

  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const slug = formNombre
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "-");

    const payload: CategoriaConfig = {
      id: catEditando ? catEditando.id : `cat_${Date.now()}`,
      nombre: formNombre.trim(),
      slug,
      icono: formIcono.trim() || "🍽️",
      productoBase: {
        nombre: formBaseNombre.trim(),
        descripcionBase: formBaseDescripcion.trim(),
        imagenBase: formBaseImagen.trim(),
        precioBase: Number(formBasePrecio),
        ingredientesBase: ["Pan y Carne"],
      },
      ingredientesPersonalizables: formIngredientesPersonalizables,
    };

    try {
      const res = await fetch("/api/catalog/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar categoría");

      onMostrarNotificacion(
        catEditando
          ? `Categoría "${formNombre}" actualizada.`
          : `Nueva categoría "${formNombre}" creada con éxito.`,
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

  const handleEliminarCategoria = async (cat: CategoriaConfig) => {
    if (cat.slug === "pizzas" || cat.slug === "bebidas" || cat.slug === "combos") {
      alert("Las categorías base del sistema (Pizzas, Bebidas, Combos) no pueden eliminarse.");
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;

    try {
      const res = await fetch(`/api/catalog/categorias?id=${cat.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      onMostrarNotificacion(`Categoría "${cat.nombre}" eliminada.`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🍔</span>
            <span>Nuevas Categorías y Productos Base ({categorias.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Creá categorías a futuro (ejemplo: <strong>Hamburguesas, Empanadas</strong>). Definí su producto base (ej. pan y carne con foto simple) y sus ingredientes configurables para agregar o quitar (queso, cebolla, papas, etc.).
          </p>
        </div>

        <button
          type="button"
          onClick={abrirModalCrear}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Crear Nueva Categoría</span>
        </button>
      </div>

      {/* Lista de Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categorias.map((cat) => {
          const esBase = cat.slug === "pizzas" || cat.slug === "bebidas" || cat.slug === "combos";

          return (
            <div
              key={cat.id}
              className="bg-[#151f2e] border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{cat.icono}</span>
                    <div>
                      <h3 className="font-black text-white text-base tracking-tight">{cat.nombre}</h3>
                      <span className="text-[10px] text-emerald-400 font-mono">Slug: /{cat.slug}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      esBase
                        ? "bg-slate-800 text-slate-400 border-white/10"
                        : "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {esBase ? "Categoría Principal" : "Categoría Personalizada"}
                  </span>
                </div>

                {/* Si tiene Producto Base (ejemplo Hamburguesas: pan y carne) */}
                {cat.productoBase ? (
                  <div className="bg-[#0d141e] border border-white/5 rounded-2xl p-3.5 mt-3 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-[#151f2e] border border-emerald-500/30 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                        {cat.productoBase.imagenBase ? (
                          <img
                            src={cat.productoBase.imagenBase}
                            alt={cat.productoBase.nombre}
                            className="w-full h-full object-contain p-1 filter drop-shadow"
                          />
                        ) : (
                          <span className="text-3xl">{cat.icono}</span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                          Producto Base:
                        </span>
                        <h4 className="font-extrabold text-white text-sm">
                          {cat.productoBase.nombre}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {cat.productoBase.descripcionBase}
                        </p>
                        <span className="text-xs font-mono font-black text-emerald-300 mt-0.5 block">
                          Precio base: ${cat.productoBase.precioBase.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>

                    {/* Ingredientes personalizables para agregar o quitar */}
                    {cat.ingredientesPersonalizables && cat.ingredientesPersonalizables.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Ingredientes a poder agregar o quitar:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cat.ingredientesPersonalizables.map((ing, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-lg"
                            >
                              + {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-2">
                    Categoría núcleo del menú de 0600Boston.
                  </p>
                )}
              </div>

              {!esBase && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(cat)}
                    className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                  >
                    <span>✏️</span>
                    <span>Modificar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarCategoria(cat)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs p-1.5 rounded-xl"
                    title="Eliminar categoría"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR O MODIFICAR CATEGORÍA NUEVA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{formIcono}</span>
                <span>{catEditando ? `Modificar "${catEditando.nombre}"` : "Crear Nueva Categoría y Producto Base"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCategoria} className="space-y-4">
              {/* Categoría general */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Hamburguesas, Empanadas, Sandwiches..."
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Icono
                  </label>
                  <input
                    type="text"
                    value={formIcono}
                    onChange={(e) => setFormIcono(e.target.value)}
                    placeholder="🍔"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Definición del Producto Base */}
              <div className="bg-[#0d141e] border border-emerald-500/30 rounded-2xl p-3.5 space-y-3">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  1. Configuración del Producto Base (ejemplo: Hamburguesa Simple: pan y carne)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nombre Producto Base
                    </label>
                    <input
                      type="text"
                      required
                      value={formBaseNombre}
                      onChange={(e) => setFormBaseNombre(e.target.value)}
                      placeholder="Ej: Hamburguesa Simple: Pan y Carne"
                      className="w-full bg-[#151f2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Precio Base ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={formBasePrecio}
                      onChange={(e) => setFormBasePrecio(Number(e.target.value))}
                      placeholder="12500"
                      className="w-full bg-[#151f2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Descripción de la Base
                  </label>
                  <input
                    type="text"
                    value={formBaseDescripcion}
                    onChange={(e) => setFormBaseDescripcion(e.target.value)}
                    placeholder="Pan brioche artesanal tostado y medallón de carne vacuna 180g..."
                    className="w-full bg-[#151f2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Subir foto simple con fondo transparente */}
                <div className="border border-dashed border-emerald-500/40 rounded-xl p-3 text-center">
                  <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                    📸 Foto Simple del Producto Base (Fondo Transparente Automático)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSubirFotoBase}
                    className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
                  />
                  {subiendoFoto && (
                    <p className="text-xs text-emerald-400 mt-1 font-bold animate-pulse">
                      Procesando transparencia con Sharp...
                    </p>
                  )}
                  {formBaseImagen && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <img
                        src={formBaseImagen}
                        alt="Preview Base"
                        className="w-12 h-12 object-contain rounded-lg border border-emerald-500"
                      />
                      <span className="text-[10px] text-emerald-400 font-bold">
                        Imagen base lista
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Ingredientes para agregar o quitar (queso, cebolla, papas, etc.) */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <span className="block text-[11px] font-bold uppercase text-emerald-400">
                  2. Ingredientes a poder agregar o quitar (Queso, Cebolla, Papas, etc.):
                </span>

                {/* Input para agregar ingrediente personalizado */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoIngNombre}
                    onChange={(e) => setNuevoIngNombre(e.target.value)}
                    placeholder="Ej: Queso Cheddar, Cebolla Crispy, Papas Fritas..."
                    className="flex-1 bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={agregarIngredientePersonalizable}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    + Agregar
                  </button>
                </div>

                {/* Chips de ingredientes seleccionados */}
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#0d141e] rounded-xl border border-white/5 min-h-[44px]">
                  {formIngredientesPersonalizables.map((ing, idx) => (
                    <span
                      key={idx}
                      className="bg-[#182333] border border-emerald-500/40 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    >
                      <span>{ing}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormIngredientesPersonalizables(
                            formIngredientesPersonalizables.filter((i) => i !== ing)
                          )
                        }
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {formIngredientesPersonalizables.length === 0 && (
                    <span className="text-xs text-slate-500 italic p-1">
                      Agregá los ingredientes que se podrán personalizar para esta categoría.
                    </span>
                  )}
                </div>

                {/* Sugerencias desde el banco de ingredientes */}
                <span className="text-[10px] text-slate-400 font-bold uppercase block mt-1">
                  O sumar desde el banco global:
                </span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto no-scrollbar">
                  {ingredientesCatalogo.map((catIng) => {
                    const activo = formIngredientesPersonalizables.includes(catIng.nombre);
                    return (
                      <button
                        key={catIng.id}
                        type="button"
                        onClick={() => toggleIngredienteCatalogo(catIng.nombre)}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                          activo
                            ? "bg-emerald-500 text-slate-950 font-bold"
                            : "bg-[#0d141e] text-slate-400 hover:text-white"
                        }`}
                      >
                        {catIng.icono} {catIng.nombre} {activo ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
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
                  {guardando ? "Guardando..." : "Guardar Categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
