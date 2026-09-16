"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CatalogData, getInitialCatalogData } from "@/lib/catalog-db";
import { EspecialidadesAdmin } from "@/components/admin/EspecialidadesAdmin";
import { BebidasAdmin } from "@/components/admin/BebidasAdmin";
import { IngredientesAdmin } from "@/components/admin/IngredientesAdmin";
import { CombosAdmin } from "@/components/admin/CombosAdmin";
import { CategoriasNuevasAdmin } from "@/components/admin/CategoriasNuevasAdmin";
import { OptimizadorImagenesAdmin } from "@/components/admin/OptimizadorImagenesAdmin";
import { PushAdmin } from "@/components/admin/PushAdmin";
import { ConfiguracionAdmin } from "@/components/admin/ConfiguracionAdmin";

interface ClienteItem {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  telefono: string;
  direccion: string;
  barrio: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<
    "pizzas" | "bebidas" | "ingredientes" | "combos" | "categorias" | "optimizador" | "push" | "clientes" | "configuracion"
  >("pizzas");
  const [usuarioActual, setUsuarioActual] = useState("admin");

  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  // Clientes desde Turso
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // Sistema de notificaciones / toasts
  const [notificacion, setNotificacion] = useState<{ msg: string; tipo: "exito" | "error" } | null>(null);

  const mostrarNotificacion = (msg: string, tipo: "exito" | "error" = "exito") => {
    setNotificacion({ msg, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 4500);
  };

  // Cargar catálogo completo desde la API
  const cargarCatalogo = async () => {
    setCargandoCatalogo(true);
    try {
      const res = await fetch("/api/catalog");
      const data = await res.json();
      if (data.success && data.catalog) {
        setCatalog(data.catalog);
      }
    } catch (err) {
      console.error("Error al cargar catálogo:", err);
      mostrarNotificacion("Error al conectar con la base de datos de catálogo.", "error");
    } finally {
      setCargandoCatalogo(false);
    }
  };

  // Cargar clientes desde Turso
  const cargarClientes = async () => {
    setCargandoClientes(true);
    try {
      const res = await fetch("/api/clientes");
      const data = await res.json();
      if (data.clientes) {
        setClientes(data.clientes);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setCargandoClientes(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminAuth0600");
      localStorage.removeItem("adminCurrentUser");
      localStorage.removeItem("adminCurrentUsername");
    }
    router.push("/admin");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("adminAuth0600");
      if (!auth) {
        router.push("/admin");
        return;
      }
      const username = localStorage.getItem("adminCurrentUsername");
      if (username) setUsuarioActual(username);
    }
    cargarCatalogo();
    cargarClientes();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d141e] text-slate-100 pb-24 select-none">
      {/* Toast flotante de notificación */}
      {notificacion && (
        <div className="fixed top-4 right-4 z-[9999] animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border ${
              notificacion.tipo === "error"
                ? "bg-red-950/95 border-red-500 text-red-200"
                : "bg-emerald-950/95 border-emerald-500 text-emerald-200"
            }`}
          >
            <span>{notificacion.tipo === "error" ? "⚠️" : "✅"}</span>
            <span>{notificacion.msg}</span>
            <button
              onClick={() => setNotificacion(null)}
              className="ml-2 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Barra de Navegación Principal del Admin */}
      <nav className="bg-[#151f2e] border-b border-emerald-500/20 sticky top-0 z-40 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo / Título */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍀</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-wide">
                  0600Boston <span className="text-emerald-400">Panel Admin</span>
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  v2.0 Full Control
                </span>
              </div>
              <span className="block text-[10px] text-slate-400">
                Pizzas, Bebidas, Ingredientes, Combos & Nuevas Categorías
              </span>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setTab("pizzas")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "pizzas"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>🍕</span>
              <span>Especialidades ({catalog?.pizzas.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("bebidas")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "bebidas"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>🥤</span>
              <span>Bebidas ({catalog?.bebidas.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("ingredientes")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "ingredientes"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>🧅</span>
              <span>Ingredientes ({catalog?.ingredientes.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("combos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "combos"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>🎁</span>
              <span>Combos ({catalog?.combos.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("categorias")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "categorias"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>🍔</span>
              <span>Nuevas Categorías ({catalog?.categorias.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("optimizador")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "optimizador"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              <span>⚡</span>
              <span>Optimizar Fotos</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("push")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "push"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>🔔</span>
              <span>Mensajes Push</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("clientes");
                cargarClientes();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "clientes"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <span>👥</span>
              <span>Clientes ({clientes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("configuracion")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                tab === "configuracion"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
              }`}
            >
              <span>⚙️</span>
              <span>Ajustes & WhatsApp</span>
            </button>

            <Link
              href="/menu"
              className="ml-2 text-xs bg-emerald-700/60 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl transition-all font-bold flex items-center gap-1 shadow-sm"
            >
              <span>Ver Carta</span>
              <span>→</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 text-xs bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-xl transition-all font-bold flex items-center gap-1 shadow-sm cursor-pointer"
              title="Cerrar sesión de administración"
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Dinámico según la Pestaña */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {cargandoCatalogo && !catalog ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold">Cargando catálogo en tiempo real...</p>
          </div>
        ) : (
          <>
            {/* PESTAÑA 1: ESPECIALIDADES DE PIZZA */}
            {tab === "pizzas" && catalog && (
              <EspecialidadesAdmin
                pizzas={catalog.pizzas}
                ingredientesCatalogo={catalog.ingredientes}
                onRecargarCatalogo={cargarCatalogo}
                onMostrarNotificacion={mostrarNotificacion}
              />
            )}

            {/* PESTAÑA 2: BEBIDAS */}
            {tab === "bebidas" && catalog && (
              <BebidasAdmin
                bebidas={catalog.bebidas}
                onRecargarCatalogo={cargarCatalogo}
                onMostrarNotificacion={mostrarNotificacion}
              />
            )}

            {/* PESTAÑA 3: BANCO GLOBAL DE INGREDIENTES */}
            {tab === "ingredientes" && catalog && (
              <IngredientesAdmin
                ingredientes={catalog.ingredientes}
                pizzas={catalog.pizzas}
                categorias={catalog.categorias}
                onRecargarCatalogo={cargarCatalogo}
                onMostrarNotificacion={mostrarNotificacion}
              />
            )}

            {/* PESTAÑA 4: ARMADOR DE COMBOS */}
            {tab === "combos" && catalog && (
              <CombosAdmin
                combos={catalog.combos}
                pizzas={catalog.pizzas}
                bebidas={catalog.bebidas}
                aderezos={catalog.aderezos}
                onRecargarCatalogo={cargarCatalogo}
                onMostrarNotificacion={mostrarNotificacion}
              />
            )}

            {/* PESTAÑA 5: NUEVAS CATEGORÍAS (HAMBURGUESAS, EMPANADAS, ETC.) */}
            {tab === "categorias" && catalog && (
              <CategoriasNuevasAdmin
                categorias={catalog.categorias}
                ingredientesCatalogo={catalog.ingredientes}
                onRecargarCatalogo={cargarCatalogo}
                onMostrarNotificacion={mostrarNotificacion}
              />
            )}

            {/* PESTAÑA 6: HERRAMIENTA DE OPTIMIZACIÓN Y FONDOS */}
            {tab === "optimizador" && (
              <OptimizadorImagenesAdmin
                onMostrarNotificacion={mostrarNotificacion}
                onRecargarCatalogo={cargarCatalogo}
              />
            )}

            {/* PESTAÑA 7: ADMINISTRACIÓN DE MENSAJES PUSH */}
            {tab === "push" && (
              <PushAdmin onMostrarNotificacion={mostrarNotificacion} />
            )}

            {/* PESTAÑA 8: CLIENTES REGISTRADOS EN TURSO */}
            {tab === "clientes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <span>👥</span>
                      <span>Clientes Registrados ({clientes.length})</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Base de datos en tiempo real de clientes con pedidos y cuentas en 0600Boston
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={cargarClientes}
                    disabled={cargandoClientes}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                  >
                    {cargandoClientes ? "Actualizando..." : "🔄 Refrescar"}
                  </button>
                </div>

                {clientes.length === 0 ? (
                  <div className="bg-[#151f2e] border border-white/10 rounded-2xl p-8 text-center text-slate-400">
                    <span className="text-3xl block mb-2">📭</span>
                    <p className="text-sm">Aún no hay clientes registrados en la base de datos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientes.map((c) => (
                      <div
                        key={c.id || c.usuario}
                        className="bg-[#151f2e] border border-emerald-500/20 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                              @{c.usuario}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {c.created_at
                                ? new Date(c.created_at).toLocaleDateString("es-AR")
                                : "Reciente"}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-base">
                            {c.nombre} {c.apellido}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                            <span>🏠</span>
                            <span>
                              {c.direccion} {c.barrio ? `(${c.barrio})` : ""}
                            </span>
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono text-emerald-300 font-bold">
                              📱 {c.telefono}
                            </span>
                            <a
                              href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg transition-colors font-bold"
                            >
                              Chat WhatsApp
                            </a>
                          </div>

                          <a
                            href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `¡Hola ${c.nombre}! 🍕 Te escribimos de 0600Boston. Ya podés recibir nuestras promociones relámpago, cupones y novedades directamente en tu celular. Ingresá a la tienda y tocá "Permitir notificaciones": ${typeof window !== "undefined" ? window.location.origin : "https://0600boston.com"}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer"
                            title="Enviar invitación por WhatsApp para activar notificaciones push"
                          >
                            <span>🔔</span>
                            <span>Invitar a Notificaciones Push</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 9: AJUSTES, CONTRASEÑA, USUARIOS & WHATSAPP */}
            {tab === "configuracion" && (
              <ConfiguracionAdmin
                usuarioActual={usuarioActual}
                onUsuarioActualizado={(nuevoUser) => {
                  setUsuarioActual(nuevoUser);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("adminCurrentUsername", nuevoUser);
                  }
                }}
                onMostrarNotificacion={mostrarNotificacion}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}