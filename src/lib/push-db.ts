import fs from "fs/promises";
import path from "path";
import { getTursoClient } from "./turso";

export interface PushNotificationRecord {
  id: string;
  titulo: string;
  mensaje: string;
  url: string;
  icono: string;
  fecha: string;
  destinatarios: string;
  estado: "enviada" | "programada";
}

export interface PushTemplateItem {
  id: string;
  nombre?: string;
  titulo: string;
  mensaje: string;
  url: string;
  icono: string;
  destinatarios: string;
  fechaCreacion: string;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionItem {
  id: string;
  endpoint: string;
  keys?: PushSubscriptionKeys;
  created_at: string;
  userAgent?: string;
  clienteNombre?: string;
  clienteUsuario?: string;
  clienteTelefono?: string;
}

const PUSH_DATA_FILE = path.join(process.cwd(), "src", "data", "push-notifications.json");

interface PushDataStore {
  historial: PushNotificationRecord[];
  suscripciones: PushSubscriptionItem[];
  plantillas: PushTemplateItem[];
}

export const PLANTILLA_BIENVENIDA_NOMBRE: PushTemplateItem = {
  id: "tmpl_bienvenida_personalizada",
  nombre: "Bienvenida Personalizada {nombre}",
  titulo: "¡Bienvenido a 0600Boston, {nombre}! 🍕🍀",
  mensaje: "Hola {nombre}, gracias por sumarte a nuestra App. Mirá las pizzas y promos con descuento para vos hoy.",
  url: "/menu",
  icono: "🍀",
  destinatarios: "Todos los Clientes",
  fechaCreacion: new Date().toISOString(),
};

const DEFAULT_PUSH_DATA: PushDataStore = {
  historial: [
    {
      id: "push_1",
      titulo: "¡Bienvenido a 0600Boston! 🍕🍀",
      mensaje: "Gracias por sumarte. Mirá las pizzas artesanales y combos que tenemos para vos hoy.",
      url: "/menu",
      icono: "🍀",
      fecha: new Date(Date.now() - 86400000).toISOString(),
      destinatarios: "Nuevos Clientes",
      estado: "enviada",
    },
    {
      id: "push_2",
      titulo: "🔥 Promo Fin de Semana: 20% OFF en Napolitana",
      mensaje: "Aprovechá hoy tu pizza Napolitana grande 8 porciones a precio especial.",
      url: "/menu",
      icono: "🍕",
      fecha: new Date(Date.now() - 3600000).toISOString(),
      destinatarios: "Todos los Clientes",
      estado: "enviada",
    },
    {
      id: "push_3",
      titulo: "🛵 Delivery Express Sin Cargo en Combos",
      mensaje: "Pedí tu combo favorito hoy y te lo enviamos gratis a domicilio.",
      url: "/menu",
      icono: "🛵",
      fecha: new Date().toISOString(),
      destinatarios: "Todos los Clientes",
      estado: "enviada",
    },
  ],
  suscripciones: [],
  plantillas: [
    PLANTILLA_BIENVENIDA_NOMBRE,
    {
      id: "tmpl_1",
      nombre: "Promo Napolitana 20% OFF",
      titulo: "🔥 ¡20% OFF en Napolitana Grande!",
      mensaje: "Aprovechá hoy tu pizza Napolitana 8 porciones a precio especial.",
      url: "/menu",
      icono: "🍕",
      destinatarios: "Todos los Clientes",
      fechaCreacion: new Date().toISOString(),
    },
    {
      id: "tmpl_2",
      nombre: "Bebida Gratis con Pizza",
      titulo: "🎁 ¡Tu Bebida va de Regalo!",
      mensaje: "Con tu pedido de pizza grande recibís una gaseosa fría gratis.",
      url: "/bebidas",
      icono: "🥤",
      destinatarios: "Todos los Clientes",
      fechaCreacion: new Date().toISOString(),
    },
  ],
};

let memoryPushCache: PushDataStore | null = null;

async function persistPushData(data: PushDataStore): Promise<void> {
  memoryPushCache = data;
  try {
    const dir = path.dirname(PUSH_DATA_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(PUSH_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al guardar push-notifications.json:", err);
  }

  const db = getTursoClient();
  if (db) {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tienda_push (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute({
        sql: `INSERT INTO tienda_push (key, value, updated_at) VALUES ('main_push', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(data)],
      });
    } catch (e) {
      console.warn("Turso no disponible para push, usando almacenamiento local:", e);
    }
  }
}

export async function getPushData(): Promise<PushDataStore> {
  if (memoryPushCache) return memoryPushCache;

  const db = getTursoClient();
  if (db) {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tienda_push (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const res = await db.execute(`SELECT value FROM tienda_push WHERE key = 'main_push' LIMIT 1`);
      if (res.rows.length > 0 && res.rows[0].value) {
        const parsed = JSON.parse(String(res.rows[0].value)) as PushDataStore;
        if (!parsed.plantillas) parsed.plantillas = [];
        if (!parsed.plantillas.some((p) => p.id === "tmpl_bienvenida_personalizada")) {
          parsed.plantillas.unshift(PLANTILLA_BIENVENIDA_NOMBRE);
          await persistPushData(parsed);
        }
        memoryPushCache = parsed;
        return parsed;
      }
    } catch (e) {}
  }

  try {
    const content = await fs.readFile(PUSH_DATA_FILE, "utf-8");
    const parsed = JSON.parse(content) as PushDataStore;
    if (!parsed.plantillas) parsed.plantillas = [];
    if (!parsed.plantillas.some((p) => p.id === "tmpl_bienvenida_personalizada")) {
      parsed.plantillas.unshift(PLANTILLA_BIENVENIDA_NOMBRE);
      await persistPushData(parsed);
    }
    memoryPushCache = parsed;
    return parsed;
  } catch {
    await persistPushData(DEFAULT_PUSH_DATA);
    return DEFAULT_PUSH_DATA;
  }
}

export async function agregarNotificacionPush(
  notif: Omit<PushNotificationRecord, "id" | "fecha" | "estado">
): Promise<PushNotificationRecord> {
  const store = await getPushData();
  const nueva: PushNotificationRecord = {
    id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fecha: new Date().toISOString(),
    estado: "enviada",
    ...notif,
  };
  store.historial.unshift(nueva);
  // Mantener estrictamente las últimas 3 notificaciones push guardadas
  store.historial = store.historial.slice(0, 3);
  await persistPushData(store);
  return nueva;
}

export async function agregarPlantillaPush(
  plantilla: Omit<PushTemplateItem, "id" | "fechaCreacion">
): Promise<PushTemplateItem> {
  const store = await getPushData();
  if (!store.plantillas) store.plantillas = [];
  const nueva: PushTemplateItem = {
    id: `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    fechaCreacion: new Date().toISOString(),
    ...plantilla,
  };
  store.plantillas.unshift(nueva);
  await persistPushData(store);
  return nueva;
}

export async function eliminarPlantillaPush(id: string): Promise<boolean> {
  const store = await getPushData();
  if (!store.plantillas) return false;
  store.plantillas = store.plantillas.filter((p) => p.id !== id);
  await persistPushData(store);
  return true;
}

export async function registrarSuscripcionPush(
  sub: {
    endpoint: string;
    keys?: PushSubscriptionKeys;
  },
  userAgent?: string,
  infoCliente?: {
    nombre?: string;
    usuario?: string;
    telefono?: string;
  }
): Promise<boolean> {
  const store = await getPushData();
  if (!store.suscripciones) store.suscripciones = [];

  const index = store.suscripciones.findIndex((s) => s.endpoint === sub.endpoint);
  if (index >= 0) {
    store.suscripciones[index] = {
      ...store.suscripciones[index],
      keys: sub.keys || store.suscripciones[index].keys,
      userAgent: userAgent || store.suscripciones[index].userAgent,
      clienteNombre: infoCliente?.nombre || store.suscripciones[index].clienteNombre,
      clienteUsuario: infoCliente?.usuario || store.suscripciones[index].clienteUsuario,
      clienteTelefono: infoCliente?.telefono || store.suscripciones[index].clienteTelefono,
      created_at: new Date().toISOString(),
    };
  } else {
    store.suscripciones.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      endpoint: sub.endpoint,
      keys: sub.keys,
      created_at: new Date().toISOString(),
      userAgent,
      clienteNombre: infoCliente?.nombre,
      clienteUsuario: infoCliente?.usuario,
      clienteTelefono: infoCliente?.telefono,
    });
  }

  await persistPushData(store);
  return true;
}

export async function eliminarSuscripcionPush(endpoint: string): Promise<boolean> {
  const store = await getPushData();
  if (!store.suscripciones || store.suscripciones.length === 0) return false;
  const initialLength = store.suscripciones.length;
  store.suscripciones = store.suscripciones.filter((s) => s.endpoint !== endpoint);
  if (store.suscripciones.length !== initialLength) {
    await persistPushData(store);
    return true;
  }
  return false;
}
