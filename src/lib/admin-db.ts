import fs from "fs/promises";
import path from "path";
import { getTursoClient } from "./turso";

export interface AdminUser {
  id: string;
  usuario: string;
  password?: string;
  nombre: string;
  rol: "admin" | "operador";
  created_at: string;
}

const ADMIN_USERS_FILE = path.join(process.cwd(), "src", "data", "admin-users.json");

const USUARIOS_DEFAULT: AdminUser[] = [
  {
    id: "admin_default",
    usuario: "admin",
    password: "0600boston",
    nombre: "Administrador Principal",
    rol: "admin",
    created_at: new Date().toISOString(),
  },
];

let memoriaUsuariosAdmin: AdminUser[] | null = null;
let tablaAdminInicializada = false;

// Inicialización de la tabla en Turso
async function inicializarTablaAdmin() {
  const db = getTursoClient();
  if (!db || tablaAdminInicializada) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_usuarios (
        id TEXT PRIMARY KEY,
        usuario TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        nombre TEXT NOT NULL,
        rol TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comprobar si ya existe algún usuario
    const res = await db.execute("SELECT COUNT(*) as cant FROM admin_usuarios");
    const count = Number(res.rows[0]?.cant || 0);
    if (count === 0) {
      await db.execute({
        sql: `INSERT INTO admin_usuarios (id, usuario, password, nombre, rol, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          USUARIOS_DEFAULT[0].id,
          USUARIOS_DEFAULT[0].usuario,
          USUARIOS_DEFAULT[0].password || "0600boston",
          USUARIOS_DEFAULT[0].nombre,
          USUARIOS_DEFAULT[0].rol,
          USUARIOS_DEFAULT[0].created_at,
        ],
      });
    }

    tablaAdminInicializada = true;
  } catch (err) {
    console.error("Error al inicializar admin_usuarios en Turso:", err);
  }
}

// Lectura desde archivo local fallback
async function leerArchivoLocal(): Promise<AdminUser[]> {
  try {
    const data = await fs.readFile(ADMIN_USERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Si no existe, lo creamos con el usuario default
  }

  try {
    const dir = path.dirname(ADMIN_USERS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(ADMIN_USERS_FILE, JSON.stringify(USUARIOS_DEFAULT, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al guardar admin-users.json default:", err);
  }

  return [...USUARIOS_DEFAULT];
}

// Guardado en archivo local fallback
async function guardarArchivoLocal(usuarios: AdminUser[]): Promise<void> {
  try {
    const dir = path.dirname(ADMIN_USERS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(ADMIN_USERS_FILE, JSON.stringify(usuarios, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al persistir admin-users.json:", err);
  }
}

// Obtener todos los usuarios (con password para uso interno del backend)
export async function obtenerUsuariosAdminInterno(): Promise<AdminUser[]> {
  const db = getTursoClient();
  if (db) {
    await inicializarTablaAdmin();
    try {
      const res = await db.execute("SELECT * FROM admin_usuarios ORDER BY created_at ASC");
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: String(row.id),
          usuario: String(row.usuario),
          password: String(row.password),
          nombre: String(row.nombre),
          rol: (String(row.rol) as "admin" | "operador") || "admin",
          created_at: String(row.created_at),
        }));
      }
    } catch (err) {
      console.warn("Turso no disponible para admin_usuarios, usando local:", err);
    }
  }

  if (!memoriaUsuariosAdmin) {
    memoriaUsuariosAdmin = await leerArchivoLocal();
  }
  return memoriaUsuariosAdmin;
}

// Listar usuarios sin exponer la contraseña
export async function listarUsuariosAdmin(): Promise<Omit<AdminUser, "password">[]> {
  const usuarios = await obtenerUsuariosAdminInterno();
  return usuarios.map(({ password, ...resto }) => resto);
}

// Autenticar credenciales
export async function autenticarAdmin(
  usuarioInput: string,
  passwordInput: string
): Promise<Omit<AdminUser, "password"> | null> {
  const u = usuarioInput.trim().toLowerCase();
  const usuarios = await obtenerUsuariosAdminInterno();

  // 1. Buscar usuario exacto
  let user = usuarios.find((item) => item.usuario.toLowerCase() === u);

  // 2. Si se ingresó sin usuario y la contraseña es la de admin o 0600boston
  if (!user && (u === "admin" || u === "")) {
    user = usuarios.find((item) => item.usuario.toLowerCase() === "admin");
  }

  if (user && user.password === passwordInput) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  // Respaldo de emergencia maestro para primer uso
  if ((u === "admin" || u === "") && passwordInput === "0600boston") {
    return {
      id: "admin_default",
      usuario: "admin",
      nombre: "Administrador Principal",
      rol: "admin",
      created_at: new Date().toISOString(),
    };
  }

  return null;
}

// Cambiar contraseña de un usuario
export async function cambiarPasswordAdmin(
  usuario: string,
  nuevoPassword: string
): Promise<boolean> {
  const u = usuario.trim().toLowerCase();
  const db = getTursoClient();

  if (db) {
    await inicializarTablaAdmin();
    try {
      const res = await db.execute({
        sql: "UPDATE admin_usuarios SET password = ? WHERE LOWER(usuario) = ?",
        args: [nuevoPassword, u],
      });
      if (res.rowsAffected > 0) {
        // También actualizar local en segundo plano si es posible
        try {
          const usuarios = await leerArchivoLocal();
          const idx = usuarios.findIndex((x) => x.usuario.toLowerCase() === u);
          if (idx !== -1) {
            usuarios[idx].password = nuevoPassword;
            await guardarArchivoLocal(usuarios);
          }
          memoriaUsuariosAdmin = usuarios;
        } catch {}
        return true;
      }
    } catch (err) {
      console.error("Error al actualizar password en Turso:", err);
    }
  }

  // Fallback local
  try {
    const usuarios = await leerArchivoLocal();
    const idx = usuarios.findIndex((x) => x.usuario.toLowerCase() === u);
    if (idx !== -1) {
      usuarios[idx].password = nuevoPassword;
      await guardarArchivoLocal(usuarios);
      memoriaUsuariosAdmin = usuarios;
      return true;
    }
  } catch {}

  return false;
}

// Modificar usuario existente (nombre, login, rol y/o contraseña)
export async function actualizarUsuarioAdmin(
  id: string,
  datos: {
    usuario?: string;
    nombre?: string;
    rol?: "admin" | "operador";
    password?: string;
  }
): Promise<{ exito: boolean; mensaje: string; usuario?: Omit<AdminUser, "password"> }> {
  const db = getTursoClient();
  const usuarios = await obtenerUsuariosAdminInterno();
  const usuarioExistente = usuarios.find((x) => x.id === id);

  if (!usuarioExistente) {
    return { exito: false, mensaje: "Usuario no encontrado." };
  }

  const nuevoUsuario = datos.usuario ? datos.usuario.trim().toLowerCase() : usuarioExistente.usuario;
  const nuevoNombre = datos.nombre ? datos.nombre.trim() : usuarioExistente.nombre;
  const nuevoRol = datos.rol || usuarioExistente.rol;
  const nuevoPassword = datos.password && datos.password.trim() ? datos.password.trim() : (usuarioExistente.password || "");

  if (datos.password && datos.password.trim().length < 4) {
    return { exito: false, mensaje: "La nueva contraseña debe tener al menos 4 caracteres." };
  }

  if (nuevoUsuario !== usuarioExistente.usuario) {
    if (usuarios.some((x) => x.id !== id && x.usuario.toLowerCase() === nuevoUsuario)) {
      return { exito: false, mensaje: `El nombre de usuario "${nuevoUsuario}" ya está en uso.` };
    }
  }

  if (db) {
    await inicializarTablaAdmin();
    try {
      await db.execute({
        sql: "UPDATE admin_usuarios SET usuario = ?, nombre = ?, rol = ?, password = ? WHERE id = ?",
        args: [nuevoUsuario, nuevoNombre, nuevoRol, nuevoPassword, id],
      });
    } catch (err) {
      console.error("Error al actualizar usuario en Turso:", err);
    }
  }

  // Actualizar en archivo local / memoria
  try {
    const localList = await leerArchivoLocal();
    const localIdx = localList.findIndex((x) => x.id === id);
    if (localIdx !== -1) {
      localList[localIdx] = {
        ...localList[localIdx],
        usuario: nuevoUsuario,
        nombre: nuevoNombre,
        rol: nuevoRol,
        password: nuevoPassword,
      };
      await guardarArchivoLocal(localList);
    }
    memoriaUsuariosAdmin = localList;
  } catch {}

  return {
    exito: true,
    mensaje: "Usuario y credenciales actualizados con éxito.",
    usuario: {
      id,
      usuario: nuevoUsuario,
      nombre: nuevoNombre,
      rol: nuevoRol,
      created_at: usuarioExistente.created_at,
    },
  };
}

// Crear nuevo usuario administrador u operador
export async function crearUsuarioAdmin(datos: {
  usuario: string;
  password: string;
  nombre: string;
  rol?: "admin" | "operador";
}): Promise<{ exito: boolean; mensaje: string; usuario?: Omit<AdminUser, "password"> }> {
  const u = datos.usuario.trim().toLowerCase();
  if (!u || !datos.password || !datos.nombre) {
    return { exito: false, mensaje: "Todos los campos son obligatorios." };
  }

  if (datos.password.length < 4) {
    return { exito: false, mensaje: "La contraseña debe tener al menos 4 caracteres." };
  }

  const usuarios = await obtenerUsuariosAdminInterno();
  if (usuarios.some((x) => x.usuario.toLowerCase() === u)) {
    return { exito: false, mensaje: `El nombre de usuario "${u}" ya existe.` };
  }

  const nuevoUsuario: AdminUser = {
    id: "usr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    usuario: u,
    password: datos.password,
    nombre: datos.nombre.trim(),
    rol: datos.rol || "admin",
    created_at: new Date().toISOString(),
  };

  const db = getTursoClient();
  if (db) {
    await inicializarTablaAdmin();
    try {
      await db.execute({
        sql: `INSERT INTO admin_usuarios (id, usuario, password, nombre, rol, created_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          nuevoUsuario.id,
          nuevoUsuario.usuario,
          nuevoUsuario.password || "",
          nuevoUsuario.nombre,
          nuevoUsuario.rol,
          nuevoUsuario.created_at,
        ],
      });
    } catch (err) {
      console.error("Error al insertar usuario en Turso:", err);
    }
  }

  // Persistir en local
  const localList = await leerArchivoLocal();
  localList.push(nuevoUsuario);
  await guardarArchivoLocal(localList);
  memoriaUsuariosAdmin = localList;

  const { password, ...safeUser } = nuevoUsuario;
  return { exito: true, mensaje: "Usuario generado con éxito.", usuario: safeUser };
}

// Eliminar un usuario admin (protegiendo el último admin y al usuario en sesión)
export async function eliminarUsuarioAdmin(
  idAEliminar: string,
  usuarioActual: string
): Promise<{ exito: boolean; mensaje: string }> {
  const usuarios = await obtenerUsuariosAdminInterno();
  const objetivo = usuarios.find((x) => x.id === idAEliminar);

  if (!objetivo) {
    return { exito: false, mensaje: "Usuario no encontrado." };
  }

  if (objetivo.usuario.toLowerCase() === usuarioActual.trim().toLowerCase()) {
    return { exito: false, mensaje: "No podés eliminar tu propia cuenta en uso." };
  }

  const adminsRestantes = usuarios.filter((x) => x.rol === "admin" && x.id !== idAEliminar);
  if (objetivo.rol === "admin" && adminsRestantes.length === 0) {
    return { exito: false, mensaje: "No podés eliminar el único administrador del sistema." };
  }

  const db = getTursoClient();
  if (db) {
    try {
      await db.execute({
        sql: "DELETE FROM admin_usuarios WHERE id = ?",
        args: [idAEliminar],
      });
    } catch (err) {
      console.error("Error al eliminar en Turso:", err);
    }
  }

  const localList = await leerArchivoLocal();
  const filtrados = localList.filter((x) => x.id !== idAEliminar);
  await guardarArchivoLocal(filtrados);
  memoriaUsuariosAdmin = filtrados;

  return { exito: true, mensaje: `Usuario "${objetivo.usuario}" eliminado correctamente.` };
}
