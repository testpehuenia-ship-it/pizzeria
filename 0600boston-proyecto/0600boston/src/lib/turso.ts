import { createClient, Client } from "@libsql/client";

// Obtenemos las credenciales de Turso desde variables de entorno
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;

export function getTursoClient(): Client | null {
  if (!tursoUrl) {
    return null;
  }
  if (!client) {
    client = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken,
    });
  }
  return client;
}

// Almacén en memoria de respaldo para cuando Turso aún no esté configurado en .env.local
interface ClienteRecord {
  id: string;
  nombre: string;
  apellido: string;
  usuario: string;
  password?: string;
  direccion: string;
  barrio: string;
  telefono: string;
  created_at: string;
}

interface ProductoRecord {
  id: string;
  nombre: string;
  descripcion: string;
  precio4: number;
  precio8: number;
  categoria: string;
  imagen_url: string;
  created_at: string;
}

const clientesMemoria: ClienteRecord[] = [];
const productosMemoria: ProductoRecord[] = [];

// Inicializar tablas en Turso si existe conexión
let tablasInicializadas = false;
export async function inicializarTablasTurso() {
  const db = getTursoClient();
  if (!db || tablasInicializadas) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        usuario TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        direccion TEXT NOT NULL,
        barrio TEXT NOT NULL,
        telefono TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        precio4 REAL,
        precio8 REAL,
        categoria TEXT DEFAULT 'pizza',
        imagen_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    tablasInicializadas = true;
    console.log("Tablas en Turso verificadas con éxito.");
  } catch (err) {
    console.error("Error al inicializar tablas en Turso:", err);
  }
}

// Servicios de Clientes
export async function registrarClienteDB(cliente: {
  nombre: string;
  apellido: string;
  usuario: string;
  password?: string;
  direccion: string;
  barrio: string;
  telefono: string;
}) {
  const db = getTursoClient();
  const id = "cli_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  if (db) {
    await inicializarTablasTurso();
    await db.execute({
      sql: `INSERT INTO clientes (id, nombre, apellido, usuario, password, direccion, barrio, telefono, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        cliente.nombre,
        cliente.apellido,
        cliente.usuario.toLowerCase().trim(),
        cliente.password || "",
        cliente.direccion,
        cliente.barrio,
        cliente.telefono,
        now,
      ],
    });
  } else {
    // Almacenamiento local fallback
    clientesMemoria.push({
      id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      usuario: cliente.usuario.toLowerCase().trim(),
      password: cliente.password || "",
      direccion: cliente.direccion,
      barrio: cliente.barrio,
      telefono: cliente.telefono,
      created_at: now,
    });
  }

  return { id, ...cliente };
}

export async function buscarClientePorUsuarioDB(usuario: string) {
  const db = getTursoClient();
  const u = usuario.toLowerCase().trim();

  if (db) {
    await inicializarTablasTurso();
    const res = await db.execute({
      sql: `SELECT * FROM clientes WHERE usuario = ? LIMIT 1`,
      args: [u],
    });
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: String(row.id),
        nombre: String(row.nombre),
        apellido: String(row.apellido),
        usuario: String(row.usuario),
        password: String(row.password),
        direccion: String(row.direccion),
        barrio: String(row.barrio),
        telefono: String(row.telefono),
        created_at: String(row.created_at),
      };
    }
    return null;
  } else {
    const c = clientesMemoria.find((x) => x.usuario === u);
    return c || null;
  }
}

export async function listarClientesDB() {
  const db = getTursoClient();
  if (db) {
    await inicializarTablasTurso();
    const res = await db.execute(`SELECT * FROM clientes ORDER BY created_at DESC`);
    return res.rows.map((row) => ({
      id: String(row.id),
      nombre: String(row.nombre),
      apellido: String(row.apellido),
      usuario: String(row.usuario),
      direccion: String(row.direccion),
      barrio: String(row.barrio),
      telefono: String(row.telefono),
      created_at: String(row.created_at),
    }));
  }
  return clientesMemoria;
}

// Servicios de Productos Nuevos (para Admin)
export async function crearProductoDB(producto: {
  nombre: string;
  descripcion: string;
  precio4: number;
  precio8: number;
  categoria: string;
  imagen_url: string;
}) {
  const db = getTursoClient();
  const id = "prod_" + Date.now();
  const now = new Date().toISOString();

  if (db) {
    await inicializarTablasTurso();
    await db.execute({
      sql: `INSERT INTO productos (id, nombre, descripcion, precio4, precio8, categoria, imagen_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        producto.nombre,
        producto.descripcion,
        producto.precio4,
        producto.precio8,
        producto.categoria || "pizza",
        producto.imagen_url,
        now,
      ],
    });
  } else {
    productosMemoria.push({
      id,
      ...producto,
      created_at: now,
    });
  }

  return { id, ...producto };
}

export async function listarProductosDB() {
  const db = getTursoClient();
  if (db) {
    await inicializarTablasTurso();
    const res = await db.execute(`SELECT * FROM productos ORDER BY created_at DESC`);
    return res.rows.map((row) => ({
      id: String(row.id),
      nombre: String(row.nombre),
      descripcion: String(row.descripcion),
      precio4: Number(row.precio4),
      precio8: Number(row.precio8),
      categoria: String(row.categoria),
      imagen_url: String(row.imagen_url),
      created_at: String(row.created_at),
    }));
  }
  return productosMemoria;
}
