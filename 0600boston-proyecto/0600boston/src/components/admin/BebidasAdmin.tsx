"use client";

import React, { useState } from "react";
import { BebidaDataType } from "@/lib/catalog-db";
import { subirImagenAlServidor } from "@/lib/client-image";

interface BebidasAdminProps {
  bebidas: BebidaDataType[];
  onRecargarCatalogo: () => void;
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

export function BebidasAdmin({
  bebidas,
  onRecargarCatalogo,
  onMostrarNotificacion,
}: BebidasAdminProps) {
  const [filtro, setFiltro] = useState<"todas" | "gaseosa" | "cerveza" | "agua">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Formulario
  const [bebidaEditando, setBebidaEditando] = useState<BebidaDataType | null>(null);
  const [formNombre, setFormNombre] = useState("");
  const [formCategoria, setFormCategoria] = useState<"gaseosa" | "cerveza" | "agua">("gaseosa");
  const [formPrecio, setFormPrecio] = useState<number>(1500);
  const [formImagenUrl, setFormImagenUrl] = useState("🥤");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formOculto, setFormOculto] = useState(false);

  const abrirModalCrear = () => {
    setBebidaEditando(null);
    setFormNombre("");
    setFormCategoria("gaseosa");
    setFormPrecio(2000);
    setFormImagenUrl("🥤");
    setFormDescripcion("");
    setFormOculto(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (b: BebidaDataType) => {
    setBebidaEditando(b);
    setFormNombre(b.nombre);
    setFormCategoria(b.categoria);
    setFormPrecio(b.precio);
    setFormImagenUrl(b.imagenUrl || "🥤");
    setFormDescripcion(b.descripcion || "");
    setFormOculto(b.oculto ?? false);
    setModalAbierto(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    e.target.value = "";

    setSubiendoFoto(true);
    try {
      const data = await subirImagenAlServidor(file, { removeBg: true, maxDimension: 1200 });
      setFormImagenUrl(data.url);
      onMostrarNotificacion("Foto de bebida procesada con fondo transparente.", "exito");
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleGuardarBebida = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const payload: BebidaDataType = {
      id: bebidaEditando ? bebidaEditando.id : `beb_${Date.now()}`,
      nombre: formNombre.trim(),
      categoria: formCategoria,
      precio: Number(formPrecio),
      imagenUrl: formImagenUrl,
      descripcion: formDescripcion.trim(),
      oculto: formOculto,
    };

    try {
      const res = await fetch("/api/catalog/bebidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");

      onMostrarNotificacion(
        bebidaEditando
          ? `Bebida "${formNombre}" actualizada.`
          : `Bebida "${formNombre}" dada de alta.`,
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

  const handleToggleOcultar = async (b: BebidaDataType) => {
    const nuevoEstado = !b.oculto;
    const payload: BebidaDataType = {
      ...b,
      oculto: nuevoEstado,
    };

    try {
      const res = await fetch("/api/catalog/bebidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo actualizar visibilidad");
      onMostrarNotificacion(
        nuevoEstado
          ? `Bebida "${b.nombre}" oculta del menú (Pausada por stock).`
          : `Bebida "${b.nombre}" republicada en el menú.`,
        "exito"
      );
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const handleEliminarBebida = async (b: BebidaDataType) => {
    if (!confirm(`¿Eliminar la bebida "${b.nombre}"?`)) return;

    try {
      const res = await fetch(`/api/catalog/bebidas?id=${b.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      onMostrarNotificacion(`Bebida "${b.nombre}" eliminada.`, "exito");
      onRecargarCatalogo();
    } catch (err: any) {
      onMostrarNotificacion(err.message, "error");
    }
  };

  const bebidasFiltradas = bebidas.filter((b) => {
    const coincideFiltro = filtro === "todas" ? true : b.categoria === filtro;
    const coincideBusqueda =
      b.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (b.descripcion && b.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideFiltro && coincideBusqueda;
  });

  return (
    <div className="space-y-6">
      {/* Barra superior de bebidas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🥤</span>
            <span>Bebidas ({bebidas.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Listá las bebidas, modificá sus imágenes, categorías y precios, o sumá nuevos productos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar bebida..."
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
            <span>Nueva Bebida</span>
          </button>
        </div>
      </div>

      {/* Filtros de Categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "todas", label: "Todas las Bebidas", icon: "✨" },
          { id: "gaseosa", label: "Gaseosas", icon: "🥤" },
          { id: "cerveza", label: "Cervezas", icon: "🍺" },
          { id: "agua", label: "Aguas", icon: "💧" },
        ].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFiltro(c.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filtro === c.id
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "bg-[#151f2e] text-slate-300 border border-white/10 hover:border-emerald-400/40"
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Grilla visual de bebidas: imagen, nombre, precio y edición */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {bebidasFiltradas.map((b) => (
          <div
            key={b.id}
            className={`bg-[#151f2e] border rounded-2xl p-4 shadow-xl flex flex-col justify-between transition-all ${
              b.oculto
                ? "border-red-500/40 bg-[#151f2e]/75 opacity-90 shadow-red-950/20"
                : "border-white/10 hover:border-emerald-500/30"
            }`}
          >
            <div>
              {/* Imagen, Categoría y Estado de Stock */}
              <div className="flex items-center justify-between gap-1 mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    {b.categoria}
                  </span>
                  {b.oculto && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 animate-pulse">
                      ⏸️ Sin Stock
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">ID: {b.id}</span>
              </div>

              {/* Foto o Emoji */}
              <div className="w-full h-24 bg-[#0d141e] rounded-xl border border-white/5 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                {b.imagenUrl && (b.imagenUrl.startsWith("/") || b.imagenUrl.startsWith("http")) ? (
                  <img
                    src={b.imagenUrl}
                    alt={b.nombre}
                    className="max-h-20 max-w-[80%] object-contain filter drop-shadow"
                  />
                ) : (
                  <span className="text-4xl">{b.imagenUrl || "🥤"}</span>
                )}
              </div>

              <h3 className="font-extrabold text-white text-sm truncate">{b.nombre}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{b.descripcion}</p>
            </div>

            {/* Precio y botones de modificación */}
            <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Precio:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ${b.precio.toLocaleString("es-AR")}
                  </span>
                </div>

                {/* Botón rápido para Ocultar / Publicar por falta de stock */}
                <button
                  type="button"
                  onClick={() => handleToggleOcultar(b)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                    b.oculto
                      ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
                  title={b.oculto ? "Hacer click para publicar en el menú" : "Hacer click para ocultar por falta de stock"}
                >
                  <span>{b.oculto ? "🔴 Oculto (Sin stock)" : "🟢 Publicado"}</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => abrirModalEditar(b)}
                  className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>✏️</span>
                  <span>Modificar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleEliminarBebida(b)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs p-1.5 rounded-xl cursor-pointer"
                  title="Eliminar bebida"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}

        {bebidasFiltradas.length === 0 && (
          <div className="col-span-full bg-[#151f2e] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
            <span className="text-3xl block mb-1">🥤</span>
            <p className="text-sm">No hay bebidas en esta categoría o búsqueda.</p>
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN / ALTA DE BEBIDA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151f2e] border-2 border-emerald-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🥤</span>
                <span>{bebidaEditando ? `Modificar "${bebidaEditando.nombre}"` : "Alta de Nueva Bebida"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarBebida} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  Nombre de la Bebida
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej: Coca-Cola 1.5L Original"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as any)}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="gaseosa">Gaseosa</option>
                    <option value="cerveza">Cerveza</option>
                    <option value="agua">Agua Mineral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(Number(e.target.value))}
                    placeholder="2800"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-emerald-400 mb-1">
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Ej: Botella familiar 1.5L bien helada"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Subir foto de la bebida con remoción de fondo */}
              <div className="bg-[#0d141e] border border-dashed border-emerald-500/40 rounded-xl p-3 text-center">
                <label className="block text-[11px] font-bold text-emerald-300 mb-1.5">
                  📸 Foto de la Bebida (Fondo Transparente Automático)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSubirFoto}
                  className="text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white cursor-pointer"
                />
                {subiendoFoto && (
                  <p className="text-xs text-emerald-400 mt-1.5 font-bold animate-pulse">
                    Procesando fondo transparente con Sharp...
                  </p>
                )}
                {formImagenUrl && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {formImagenUrl.startsWith("/") || formImagenUrl.startsWith("http") ? (
                      <img
                        src={formImagenUrl}
                        alt="Preview"
                        className="w-12 h-12 object-contain rounded-lg border border-emerald-500"
                      />
                    ) : (
                      <span className="text-3xl">{formImagenUrl}</span>
                    )}
                    <span className="text-[11px] text-emerald-400 font-bold">
                      Vista previa lista
                    </span>
                  </div>
                )}
              </div>

              {/* Ocultar publicación por falta de stock */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0d141e] border border-white/10">
                <input
                  type="checkbox"
                  id="chkOcultoBebida"
                  checked={formOculto}
                  onChange={(e) => setFormOculto(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 text-red-500 focus:ring-0 cursor-pointer accent-red-500"
                />
                <label htmlFor="chkOcultoBebida" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Ocultar publicación en el menú (Pausar por falta de stock o agotado)
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
                  {guardando ? "Guardando..." : "Guardar Bebida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
