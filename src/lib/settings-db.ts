import fs from "fs/promises";
import path from "path";
import { getTursoClient } from "./turso";
import {
  TiendaConfig,
  CONFIG_DEFAULT,
  normalizarNumeroWhatsApp,
} from "./settings-utils";

export type { TiendaConfig };
export { CONFIG_DEFAULT, normalizarNumeroWhatsApp };

const CONFIG_FILE = path.join(process.cwd(), "src", "data", "tienda-config.json");

let memoriaConfig: TiendaConfig | null = null;
let tablaConfigInicializada = false;

async function inicializarTablaConfig() {
  const db = getTursoClient();
  if (!db || tablaConfigInicializada) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tienda_config (
        clave TEXT PRIMARY KEY,
        valor TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verificar si ya existe la configuración de whatsapp
    const res = await db.execute({
      sql: "SELECT valor FROM tienda_config WHERE clave = 'whatsapp_config' LIMIT 1",
      args: [],
    });

    if (res.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO tienda_config (clave, valor, updated_at) VALUES ('whatsapp_config', ?, CURRENT_TIMESTAMP)`,
        args: [JSON.stringify(CONFIG_DEFAULT)],
      });
    }

    tablaConfigInicializada = true;
  } catch (err) {
    console.error("Error al inicializar tienda_config en Turso:", err);
  }
}

async function leerArchivoLocal(): Promise<TiendaConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (parsed && parsed.whatsappNumero) {
      return parsed;
    }
  } catch {
    // Si no existe, crear el archivo con valor por defecto
  }

  try {
    const dir = path.dirname(CONFIG_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(CONFIG_DEFAULT, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al guardar tienda-config.json:", err);
  }

  return { ...CONFIG_DEFAULT };
}

async function guardarArchivoLocal(config: TiendaConfig): Promise<void> {
  try {
    const dir = path.dirname(CONFIG_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al persistir tienda-config.json:", err);
  }
}

export async function obtenerConfiguracionTienda(): Promise<TiendaConfig> {
  const db = getTursoClient();
  if (db) {
    await inicializarTablaConfig();
    try {
      const res = await db.execute("SELECT valor FROM tienda_config WHERE clave = 'whatsapp_config' LIMIT 1");
      if (res.rows.length > 0 && res.rows[0].valor) {
        const parsed = JSON.parse(String(res.rows[0].valor)) as TiendaConfig;
        memoriaConfig = parsed;
        return parsed;
      }
    } catch (err) {
      console.warn("Turso no disponible para tienda_config, usando archivo local:", err);
    }
  }

  if (!memoriaConfig) {
    memoriaConfig = await leerArchivoLocal();
  }
  return memoriaConfig;
}

export async function guardarConfiguracionTienda(datos: Partial<TiendaConfig>): Promise<TiendaConfig> {
  const actual = await obtenerConfiguracionTienda();

  let nuevoNumero = actual.whatsappNumero;
  let nuevoWaMe = actual.whatsappNumeroWaMe;
  let nuevoDisplay = actual.whatsappDisplay;

  if (datos.whatsappNumero) {
    const norm = normalizarNumeroWhatsApp(datos.whatsappNumero);
    nuevoNumero = norm.whatsappNumero;
    nuevoWaMe = norm.whatsappNumeroWaMe;
    nuevoDisplay = norm.whatsappDisplay;
  }

  const actualizada: TiendaConfig = {
    ...actual,
    ...datos,
    whatsappNumero: nuevoNumero,
    whatsappNumeroWaMe: nuevoWaMe,
    whatsappDisplay: nuevoDisplay,
    updated_at: new Date().toISOString(),
  };

  const db = getTursoClient();
  if (db) {
    await inicializarTablaConfig();
    try {
      await db.execute({
        sql: `INSERT INTO tienda_config (clave, valor, updated_at) VALUES ('whatsapp_config', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(actualizada)],
      });
    } catch (err) {
      console.error("Error al guardar en Turso tienda_config:", err);
    }
  }

  await guardarArchivoLocal(actualizada);
  memoriaConfig = actualizada;
  return actualizada;
}
