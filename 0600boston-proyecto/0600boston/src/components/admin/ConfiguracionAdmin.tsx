"use client";

import { useState, useEffect } from "react";
import { TiendaConfig, normalizarNumeroWhatsApp } from "@/lib/settings-utils";

interface UsuarioAdminItem {
  id: string;
  usuario: string;
  nombre: string;
  rol: "admin" | "operador";
  created_at: string;
}

interface ConfiguracionAdminProps {
  usuarioActual?: string;
  onUsuarioActualizado?: (nuevoUsuario: string) => void;
  onMostrarNotificacion: (msg: string, tipo?: "exito" | "error") => void;
}

export function ConfiguracionAdmin({
  usuarioActual = "admin",
  onUsuarioActualizado,
  onMostrarNotificacion,
}: ConfiguracionAdminProps) {
  // 1. Estado de Configuración de WhatsApp
  const [config, setConfig] = useState<TiendaConfig | null>(null);
  const [inputCelular, setInputCelular] = useState("");
  const [guardandoCelular, setGuardandoCelular] = useState(false);
  const [cargandoConfig, setCargandoConfig] = useState(true);

  // 2. Estado de Mi Cuenta (Usuario y Contraseña)
  const [miNombre, setMiNombre] = useState("");
  const [miUsuario, setMiUsuario] = useState(usuarioActual);
  const [miPasswordNuevo, setMiPasswordNuevo] = useState("");
  const [miPasswordConfirm, setMiPasswordConfirm] = useState("");
  const [guardandoMiCuenta, setGuardandoMiCuenta] = useState(false);

  // 3. Estado de Lista y Creación de Usuarios
  const [usuarios, setUsuarios] = useState<UsuarioAdminItem[]>([]);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);

  // Formulario de Crear Usuario
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [nuevoRol, setNuevoRol] = useState<"admin" | "operador">("admin");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Modal para Editar cualquier Usuario (Nombre, Username, Rol, Password)
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdminItem | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editUsuario, setEditUsuario] = useState("");
  const [editRol, setEditRol] = useState<"admin" | "operador">("admin");
  const [editPassword, setEditPassword] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Cargar configuración de WhatsApp
  const cargarConfig = async () => {
    setCargandoConfig(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setConfig(data.settings);
        setInputCelular(data.settings.whatsappNumero || "2942661000");
      }
    } catch (err) {
      console.error("Error al cargar config:", err);
    } finally {
      setCargandoConfig(false);
    }
  };

  // Cargar lista de usuarios
  const cargarUsuarios = async () => {
    setCargandoUsuarios(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success && data.usuarios) {
        setUsuarios(data.usuarios);
        // Autocompletar datos de mi cuenta
        const actual = data.usuarios.find(
          (u: UsuarioAdminItem) => u.usuario.toLowerCase() === usuarioActual.toLowerCase()
        );
        if (actual) {
          setMiNombre(actual.nombre);
          setMiUsuario(actual.usuario);
        } else if (data.usuarios.length > 0) {
          setMiNombre(data.usuarios[0].nombre);
          setMiUsuario(data.usuarios[0].usuario);
        }
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setCargandoUsuarios(false);
    }
  };

  useEffect(() => {
    cargarConfig();
    cargarUsuarios();
  }, [usuarioActual]);

  // Previsualización dinámica del número en tiempo real
  const previewNormalizado = normalizarNumeroWhatsApp(inputCelular);

  // Guardar Celular
  const handleGuardarCelular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCelular.trim()) {
      onMostrarNotificacion("Ingresá un número de celular válido.", "error");
      return;
    }

    setGuardandoCelular(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumero: inputCelular.trim() }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setConfig(data.settings);
        setInputCelular(data.settings.whatsappNumero);
        onMostrarNotificacion(`¡Número de WhatsApp guardado: ${data.settings.whatsappNumero}!`, "exito");
      } else {
        onMostrarNotificacion(data.error || "No se pudo guardar el número", "error");
      }
    } catch (err) {
      onMostrarNotificacion("Error al guardar número en el servidor", "error");
    } finally {
      setGuardandoCelular(false);
    }
  };

  // Guardar Cambios de Mi Cuenta (Cambio de Usuario y/o Contraseña)
  const handleGuardarMiCuenta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!miUsuario.trim()) {
      onMostrarNotificacion("El nombre de usuario no puede estar vacío.", "error");
      return;
    }

    if (miPasswordNuevo && miPasswordNuevo !== miPasswordConfirm) {
      onMostrarNotificacion("La nueva contraseña y su confirmación no coinciden.", "error");
      return;
    }

    if (miPasswordNuevo && miPasswordNuevo.length < 4) {
      onMostrarNotificacion("La contraseña debe tener al menos 4 caracteres.", "error");
      return;
    }

    // Buscar el ID del usuario actual
    const userItem = usuarios.find(
      (x) => x.usuario.toLowerCase() === usuarioActual.toLowerCase()
    );
    const userId = userItem?.id || "admin_default";

    setGuardandoMiCuenta(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "actualizar_usuario",
          id: userId,
          usuario: miUsuario.trim().toLowerCase(),
          nombre: miNombre.trim() || "Administrador",
          password: miPasswordNuevo || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onMostrarNotificacion("¡Tu usuario y contraseña se actualizaron con éxito!", "exito");
        setMiPasswordNuevo("");
        setMiPasswordConfirm("");

        const usernameFinal = miUsuario.trim().toLowerCase();
        if (typeof window !== "undefined") {
          localStorage.setItem("adminCurrentUsername", usernameFinal);
          if (miPasswordNuevo) {
            localStorage.setItem("adminPassword0600", miPasswordNuevo);
          }
        }
        if (onUsuarioActualizado) {
          onUsuarioActualizado(usernameFinal);
        }
        cargarUsuarios();
      } else {
        onMostrarNotificacion(data.error || "Error al actualizar cuenta", "error");
      }
    } catch (err) {
      onMostrarNotificacion("Error de conexión al actualizar mi cuenta", "error");
    } finally {
      setGuardandoMiCuenta(false);
    }
  };

  // Crear Nuevo Usuario
  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nuevoNombre.trim() || !nuevoUsuario.trim() || !nuevoPassword.trim()) {
      onMostrarNotificacion("Completá todos los campos para generar el usuario.", "error");
      return;
    }

    setCreandoUsuario(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          usuario: nuevoUsuario.trim().toLowerCase(),
          password: nuevoPassword,
          rol: nuevoRol,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onMostrarNotificacion(`¡Usuario @${nuevoUsuario} generado con éxito!`, "exito");
        setNuevoNombre("");
        setNuevoUsuario("");
        setNuevoPassword("");
        setNuevoRol("admin");
        cargarUsuarios();
      } else {
        onMostrarNotificacion(data.error || "Error al crear usuario", "error");
      }
    } catch (err) {
      onMostrarNotificacion("Error al crear usuario", "error");
    } finally {
      setCreandoUsuario(false);
    }
  };

  // Abrir modal para editar un usuario específico
  const handleAbrirEditar = (u: UsuarioAdminItem) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre);
    setEditUsuario(u.usuario);
    setEditRol(u.rol);
    setEditPassword("");
  };

  // Guardar edición del usuario desde el modal
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    if (!editUsuario.trim()) {
      onMostrarNotificacion("El nombre de usuario es obligatorio.", "error");
      return;
    }

    if (editPassword && editPassword.length < 4) {
      onMostrarNotificacion("La contraseña debe tener al menos 4 caracteres.", "error");
      return;
    }

    setGuardandoEdicion(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "actualizar_usuario",
          id: usuarioEditando.id,
          usuario: editUsuario.trim().toLowerCase(),
          nombre: editNombre.trim(),
          rol: editRol,
          password: editPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onMostrarNotificacion(`Usuario @${editUsuario} actualizado con éxito.`, "exito");
        setUsuarioEditando(null);
        cargarUsuarios();
      } else {
        onMostrarNotificacion(data.error || "Error al actualizar usuario", "error");
      }
    } catch (err) {
      onMostrarNotificacion("Error al comunicarse con el servidor", "error");
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Eliminar usuario
  const handleEliminarUsuario = async (id: string, username: string) => {
    if (!confirm(`¿Estás seguro de que querés eliminar el usuario @${username}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${id}&usuarioActual=${usuarioActual}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        onMostrarNotificacion(data.message, "exito");
        cargarUsuarios();
      } else {
        onMostrarNotificacion(data.error || "No se pudo eliminar el usuario", "error");
      }
    } catch (err) {
      onMostrarNotificacion("Error de servidor al eliminar", "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CABECERA */}
      <div className="bg-[#151f2e] border border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Configuración & Seguridad
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Administrá el celular de recepción de pedidos WhatsApp, tu usuario, contraseña y nuevos accesos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-emerald-300">
              Sesión activa: @{usuarioActual}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: CELULAR DE WHATSAPP DONDE SE RECIBEN PEDIDOS */}
      <div className="bg-[#151f2e] border border-emerald-500/20 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl">
              📱
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                N° de Celular WhatsApp de Pedidos
              </h3>
              <p className="text-xs text-slate-400">
                Los clientes de la tienda web y la app enviarán sus pedidos directamente a este número.
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
            <span className="text-xs text-slate-400">Actualmente configurado:</span>
            <span className="text-sm font-black font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              {cargandoConfig ? "Cargando..." : config?.whatsappNumero || "2942661000"}
            </span>
          </div>
        </div>

        <form onSubmit={handleGuardarCelular} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Ingresar o modificar Número de Celular
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                  🇦🇷
                </span>
                <input
                  type="text"
                  value={inputCelular}
                  onChange={(e) => setInputCelular(e.target.value)}
                  placeholder="Ej: 2942661000 o 02942-661000"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={guardandoCelular}
                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 text-sm whitespace-nowrap cursor-pointer"
              >
                {guardandoCelular ? "Guardando..." : "💾 Guardar Celular"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Podés escribir el número con o sin guiones, con o sin el 0 inicial (ej: <strong>2942661000</strong>). El sistema lo adapta automáticamente al estándar de WhatsApp internacional.
            </p>
          </div>

          {/* Previsualización en Tiempo Real */}
          <div className="bg-[#0d141e] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>👁️ Vista previa visible:</span>
                <strong className="text-white font-mono text-xs">{previewNormalizado.whatsappDisplay}</strong>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>🔗 Enlace WhatsApp:</span>
                <code className="text-emerald-400 font-mono text-[11px]">
                  https://wa.me/{previewNormalizado.whatsappNumeroWaMe}
                </code>
              </div>
            </div>

            <a
              href={`https://wa.me/${previewNormalizado.whatsappNumeroWaMe}?text=${encodeURIComponent(
                "¡Hola! Mensaje de prueba desde el Panel de Administración de 0600Boston."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
              title="Abrir WhatsApp en una pestaña nueva para verificar que recibe mensajes"
            >
              <span>📲</span>
              <span>Probar Enlace WhatsApp</span>
            </a>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2 Y 3 EN GRID DE 2 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PANEL: MI CUENTA (CAMBIO DE USUARIO Y CONTRASEÑA) */}
        <div className="bg-[#151f2e] border border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                👤
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Mi Cuenta (@{usuarioActual})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cambiá tu nombre de usuario, nombre visible o tu contraseña de acceso.
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarMiCuenta} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={miNombre}
                  onChange={(e) => setMiNombre(e.target.value)}
                  placeholder="Ej: Administrador Principal"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre de Usuario (Login)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-mono text-sm font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    value={miUsuario}
                    onChange={(e) => setMiUsuario(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono font-bold"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Podés cambiar tu usuario actual de login (ej: cambiar "admin" por otro nombre).
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] font-bold text-amber-400 block mb-2">
                  🔐 Cambio de Contraseña (opcional):
                </span>
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={miPasswordNuevo}
                      onChange={(e) => setMiPasswordNuevo(e.target.value)}
                      placeholder="Dejar vacío para conservar la actual"
                      className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  {miPasswordNuevo && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={miPasswordConfirm}
                        onChange={(e) => setMiPasswordConfirm(e.target.value)}
                        placeholder="Repetí la nueva contraseña"
                        className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={guardandoMiCuenta}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 text-xs mt-2 cursor-pointer"
              >
                {guardandoMiCuenta ? "Guardando Cambios..." : "💾 Guardar Cambios de Mi Cuenta"}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
            <span>ℹ️ Los cambios impactan de inmediato en la base de datos Turso y en tu sesión actual.</span>
          </div>
        </div>

        {/* PANEL: GENERAR NUEVO USUARIO */}
        <div className="bg-[#151f2e] border border-emerald-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl">
                ➕
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Generar Nuevo Usuario
                </h3>
                <p className="text-[11px] text-slate-400">
                  Creá nuevos usuarios para socios, encargados o cajeros del local.
                </p>
              </div>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Marcelo Gómez (Cajero)"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Usuario (Login)
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario}
                    onChange={(e) => setNuevoUsuario(e.target.value)}
                    placeholder="Ej: marcelo"
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rol / Nivel
                  </label>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value as "admin" | "operador")}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="operador">Operador (Solo Pedidos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Contraseña Inicial
                </label>
                <input
                  type="password"
                  value={nuevoPassword}
                  onChange={(e) => setNuevoPassword(e.target.value)}
                  placeholder="Clave para el nuevo usuario"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creandoUsuario}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-black py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 text-xs mt-2 cursor-pointer"
              >
                {creandoUsuario ? "Generando Usuario..." : "➕ Crear Nuevo Usuario"}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400">
            <span>ℹ️ El nuevo usuario podrá ingresar inmediatamente al panel con su nombre de usuario y clave.</span>
          </div>
        </div>
      </div>

      {/* TABLA DE USUARIOS ACTIVOS */}
      <div className="bg-[#151f2e] border border-emerald-500/20 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📋</span>
            <h3 className="text-base font-black text-white">
              Usuarios con Acceso al Panel ({usuarios.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={cargarUsuarios}
            disabled={cargandoUsuarios}
            className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-xl transition-all font-bold"
          >
            {cargandoUsuarios ? "Cargando..." : "🔄 Refrescar Lista"}
          </button>
        </div>

        {usuarios.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Cargando usuarios registrados...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Rol</th>
                  <th className="py-3 px-3">Fecha de Alta</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usuarios.map((u) => {
                  const esActual = u.usuario.toLowerCase() === usuarioActual.toLowerCase();
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2 font-mono font-bold text-white">
                          <span className="text-emerald-400">@{u.usuario}</span>
                          {esActual && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                              Vos
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-200">
                        {u.nombre}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            u.rol === "admin"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {u.rol === "admin" ? "Administrador" : "Operador"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("es-AR")
                          : "Inicial"}
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditar(u)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        {!esActual && (
                          <button
                            type="button"
                            onClick={() => handleEliminarUsuario(u.id, u.usuario)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA EDITAR CUALQUIER USUARIO (NOMBRE, LOGIN, ROL, CONTRASEÑA) */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#182030] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>✏️</span>
                <span>Editar Usuario @{usuarioEditando.usuario}</span>
              </h4>
              <button
                type="button"
                onClick={() => setUsuarioEditando(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Usuario (Login)
                  </label>
                  <input
                    type="text"
                    value={editUsuario}
                    onChange={(e) => setEditUsuario(e.target.value)}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rol
                  </label>
                  <select
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value as "admin" | "operador")}
                    className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="admin">Administrador</option>
                    <option value="operador">Operador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nueva Contraseña (Opcional)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full bg-[#0d141e] border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 py-2.5 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
