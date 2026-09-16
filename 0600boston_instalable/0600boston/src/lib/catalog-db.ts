import fs from "fs/promises";
import path from "path";
import { getTursoClient } from "./turso";
import {
  PIZZAS_DATA,
  BEBIDAS_DATA,
  ADEREZOS_DATA,
  PizzaDataType,
  BebidaDataType,
  AderezoDataType,
  IngredienteDecorativo,
} from "./data";

export type { PizzaDataType, BebidaDataType, AderezoDataType, IngredienteDecorativo };

export interface IngredienteCatalogItem {
  id: string;
  nombre: string;
  icono: string;
  color?: string;
  imagenUrl?: string;
  categoriaAsignada?: string; // "pizzas" | "hamburguesas" | "empanadas" | "ninguno"
  especialidadesAsignadas?: string[]; // IDs de pizzas asignadas
  oculto?: boolean;
}

export interface ComboDataType {
  id: string;
  nombre: string;
  descripcion?: string;
  pizzaId: string;
  pizzaNombre: string;
  pizzaTamano: "4" | "8";
  pizzaImagen?: string;
  bebidaId: string;
  bebidaNombre: string;
  bebidaImagen?: string;
  precio: number;
  aderezosIncluidos?: string[];
  ingredientesPermitidosModificar?: boolean;
  oculto?: boolean;
}

export interface CategoriaConfig {
  id: string;
  nombre: string;
  slug: string;
  icono: string;
  productoBase?: {
    nombre: string;
    descripcionBase: string;
    imagenBase: string;
    precioBase: number;
    ingredientesBase: string[];
  };
  ingredientesPersonalizables?: string[];
}

export interface CatalogData {
  pizzas: PizzaDataType[];
  bebidas: BebidaDataType[];
  aderezos: AderezoDataType[];
  ingredientes: IngredienteCatalogItem[];
  combos: ComboDataType[];
  categorias: CategoriaConfig[];
}

// Generador de Ingredientes Iniciales a partir de PIZZAS_DATA
function generarIngredientesIniciales(): IngredienteCatalogItem[] {
  const mapa = new Map<string, IngredienteCatalogItem>();

  PIZZAS_DATA.forEach((pizza) => {
    (pizza.ingredientesDecorables || []).forEach((ing) => {
      if (!mapa.has(ing.id)) {
        mapa.set(ing.id, {
          id: ing.id,
          nombre: ing.nombre,
          icono: ing.icono,
          color: ing.color,
          imagenUrl: ing.imagenUrl,
          categoriaAsignada: "pizzas",
          especialidadesAsignadas: [pizza.id],
        });
      } else {
        const item = mapa.get(ing.id)!;
        if (!item.especialidadesAsignadas) item.especialidadesAsignadas = [];
        if (!item.especialidadesAsignadas.includes(pizza.id)) {
          item.especialidadesAsignadas.push(pizza.id);
        }
      }
    });
  });

  // Agregamos ingredientes extra listos para usar en nuevas categorías o especialidades
  const extras: IngredienteCatalogItem[] = [
    {
      id: "papas-fritas",
      nombre: "Papas Fritas Rústicas",
      icono: "🍟",
      color: "#eab308",
      categoriaAsignada: "ninguno",
      especialidadesAsignadas: [],
    },
    {
      id: "queso-cheddar",
      nombre: "Queso Cheddar Cremoso",
      icono: "🧀",
      color: "#f59e0b",
      categoriaAsignada: "ninguno",
      especialidadesAsignadas: [],
    },
    {
      id: "panceta-crocante",
      nombre: "Bacon / Panceta Ahumada",
      icono: "🥓",
      color: "#ef4444",
      imagenUrl: "/images/ingredientes/jamon.png",
      categoriaAsignada: "ninguno",
      especialidadesAsignadas: [],
    },
  ];

  extras.forEach((ext) => {
    if (!mapa.has(ext.id)) {
      mapa.set(ext.id, ext);
    }
  });

  return Array.from(mapa.values());
}

// Combos iniciales
function generarCombosIniciales(): ComboDataType[] {
  return [
    {
      id: "combo-napolitana-coca",
      nombre: "Combo Clásico Boston: Napolitana 8p + Coca 1.5L",
      descripcion: "Pizza Napolitana grande 8 porciones recién horneada + Coca-Cola 1.5L bien helada",
      pizzaId: "napolitana",
      pizzaNombre: "Napolitana",
      pizzaTamano: "8",
      pizzaImagen: "/images/pizzas/pizza_base_madera.png",
      bebidaId: "coca-15l",
      bebidaNombre: "Coca-Cola 1.5L",
      bebidaImagen: "🍾",
      precio: 26500,
      aderezosIncluidos: ["Orégano", "Aceitunas extra", "Aceite de Oliva"],
      ingredientesPermitidosModificar: true,
    },
    {
      id: "combo-especial-patagonia",
      nombre: "Combo Gourmet: Especial 0600 + Cerveza Patagonia",
      descripcion: "Nuestra pizza Especial 0600 8 porciones + Cerveza Patagonia Amber Lager 473ml",
      pizzaId: "especial",
      pizzaNombre: "Especial 0600",
      pizzaTamano: "8",
      pizzaImagen: "/images/pizzas/pizza_base_madera.png",
      bebidaId: "patagonia-473",
      bebidaNombre: "Cerveza Patagonia 473ml",
      bebidaImagen: "🍻",
      precio: 33500,
      aderezosIncluidos: ["Orégano", "Ají Molido"],
      ingredientesPermitidosModificar: true,
    },
  ];
}

// Categorías iniciales
function generarCategoriasIniciales(): CategoriaConfig[] {
  return [
    {
      id: "cat-pizzas",
      nombre: "Pizzas Artesanales",
      slug: "pizzas",
      icono: "🍕",
    },
    {
      id: "cat-bebidas",
      nombre: "Bebidas Frías",
      slug: "bebidas",
      icono: "🥤",
    },
    {
      id: "cat-combos",
      nombre: "Combos Especiales",
      slug: "combos",
      icono: "🎁",
    },
    {
      id: "cat-hamburguesas",
      nombre: "Hamburguesas Gourmet (Próximamente)",
      slug: "hamburguesas",
      icono: "🍔",
      productoBase: {
        nombre: "Hamburguesa Simple: Pan Brioche y Medallón de Carne",
        descripcionBase: "Pan brioche artesanal tostado con manteca y medallón de carne vacuna 180g asado",
        imagenBase: "/images/ingredientes/calabresa.png",
        precioBase: 12500,
        ingredientesBase: ["Pan Brioche", "Medallón 180g"],
      },
      ingredientesPersonalizables: [
        "Queso Cheddar",
        "Cebolla Caramelizada",
        "Panceta Ahumada",
        "Papas Fritas",
        "Huevo Frito",
      ],
    },
  ];
}

const CATALOG_FILE_PATH = path.join(process.cwd(), "src", "data", "catalog.json");

let memoryCatalogCache: CatalogData | null = null;

export async function getInitialCatalogData(): Promise<CatalogData> {
  return {
    pizzas: PIZZAS_DATA,
    bebidas: BEBIDAS_DATA,
    aderezos: ADEREZOS_DATA,
    ingredientes: generarIngredientesIniciales(),
    combos: generarCombosIniciales(),
    categorias: generarCategoriasIniciales(),
  };
}

async function persistCatalog(data: CatalogData): Promise<void> {
  memoryCatalogCache = data;

  // 1. Guardar en JSON local para máxima velocidad y disponibilidad offline
  try {
    const dir = path.dirname(CATALOG_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CATALOG_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error al persistir catalog.json:", err);
  }

  // 2. Si Turso está conectado, sincronizar en la nube
  const db = getTursoClient();
  if (db) {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tienda_catalogo (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.execute({
        sql: `INSERT INTO tienda_catalogo (key, value, updated_at) VALUES ('main_catalog', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(data)],
      });
    } catch (dbErr) {
      console.warn("No se pudo sincronizar en Turso, se usó almacenamiento en disco local:", dbErr);
    }
  }
}

function sanitizarCatalog(data: CatalogData): CatalogData {
  if (!data) return data;
  if (data.combos && Array.isArray(data.combos)) {
    data.combos = data.combos.map((c) => ({
      ...c,
      pizzaImagen:
        c.pizzaImagen && (c.pizzaImagen.startsWith("/") || c.pizzaImagen.startsWith("http"))
          ? c.pizzaImagen
          : "/images/pizzas/pizza_base_madera.png",
    }));
  }
  return data;
}

export async function getCatalog(): Promise<CatalogData> {
  if (memoryCatalogCache) {
    return sanitizarCatalog(memoryCatalogCache);
  }

  // 1. Intentar leer de Turso si está disponible
  const db = getTursoClient();
  if (db) {
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS tienda_catalogo (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const res = await db.execute(`SELECT value FROM tienda_catalogo WHERE key = 'main_catalog' LIMIT 1`);
      if (res.rows.length > 0 && res.rows[0].value) {
        const parsed = JSON.parse(String(res.rows[0].value)) as CatalogData;
        const sanitized = sanitizarCatalog(parsed);
        memoryCatalogCache = sanitized;
        return sanitized;
      }
    } catch (tursoErr) {
      console.warn("Turso no disponible para catálogo, usando archivo local:", tursoErr);
    }
  }

  // 2. Intentar leer de archivo local
  try {
    const content = await fs.readFile(CATALOG_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content) as CatalogData;
    const sanitized = sanitizarCatalog(parsed);
    memoryCatalogCache = sanitized;
    return sanitized;
  } catch (err) {
    // Si no existe, inicializamos con los valores por defecto
    const initial = await getInitialCatalogData();
    const sanitized = sanitizarCatalog(initial);
    await persistCatalog(sanitized);
    return sanitized;
  }
}

// CRUD Pizzas
export async function savePizza(pizza: PizzaDataType): Promise<PizzaDataType> {
  const cat = await getCatalog();
  const index = cat.pizzas.findIndex((p) => p.id === pizza.id);
  if (index >= 0) {
    cat.pizzas[index] = { ...cat.pizzas[index], ...pizza };
  } else {
    cat.pizzas.unshift(pizza);
  }
  await persistCatalog(cat);
  return pizza;
}

export async function deletePizza(id: string): Promise<boolean> {
  const cat = await getCatalog();
  const countBefore = cat.pizzas.length;
  cat.pizzas = cat.pizzas.filter((p) => p.id !== id);
  await persistCatalog(cat);
  return cat.pizzas.length < countBefore;
}

// CRUD Bebidas
export async function saveBebida(bebida: BebidaDataType): Promise<BebidaDataType> {
  const cat = await getCatalog();
  const index = cat.bebidas.findIndex((b) => b.id === bebida.id);
  if (index >= 0) {
    cat.bebidas[index] = { ...cat.bebidas[index], ...bebida };
  } else {
    cat.bebidas.push(bebida);
  }
  await persistCatalog(cat);
  return bebida;
}

export async function deleteBebida(id: string): Promise<boolean> {
  const cat = await getCatalog();
  const countBefore = cat.bebidas.length;
  cat.bebidas = cat.bebidas.filter((b) => b.id !== id);
  await persistCatalog(cat);
  return cat.bebidas.length < countBefore;
}

// CRUD Ingredientes
export async function saveIngrediente(ing: IngredienteCatalogItem): Promise<IngredienteCatalogItem> {
  const cat = await getCatalog();
  const index = cat.ingredientes.findIndex((i) => i.id === ing.id);
  if (index >= 0) {
    cat.ingredientes[index] = { ...cat.ingredientes[index], ...ing };
  } else {
    cat.ingredientes.unshift(ing);
  }
  await persistCatalog(cat);
  return ing;
}

export async function deleteIngrediente(id: string): Promise<boolean> {
  const cat = await getCatalog();
  const countBefore = cat.ingredientes.length;
  cat.ingredientes = cat.ingredientes.filter((i) => i.id !== id);
  await persistCatalog(cat);
  return cat.ingredientes.length < countBefore;
}

// CRUD Combos
export async function saveCombo(combo: ComboDataType): Promise<ComboDataType> {
  const cat = await getCatalog();
  const index = cat.combos.findIndex((c) => c.id === combo.id);
  if (index >= 0) {
    cat.combos[index] = { ...cat.combos[index], ...combo };
  } else {
    cat.combos.unshift(combo);
  }
  await persistCatalog(cat);
  return combo;
}

export async function deleteCombo(id: string): Promise<boolean> {
  const cat = await getCatalog();
  const countBefore = cat.combos.length;
  cat.combos = cat.combos.filter((c) => c.id !== id);
  await persistCatalog(cat);
  return cat.combos.length < countBefore;
}

// CRUD Categorías
export async function saveCategoria(categoria: CategoriaConfig): Promise<CategoriaConfig> {
  const cat = await getCatalog();
  const index = cat.categorias.findIndex((c) => c.id === categoria.id);
  if (index >= 0) {
    cat.categorias[index] = { ...cat.categorias[index], ...categoria };
  } else {
    cat.categorias.push(categoria);
  }
  await persistCatalog(cat);
  return categoria;
}

export async function deleteCategoria(id: string): Promise<boolean> {
  const cat = await getCatalog();
  const countBefore = cat.categorias.length;
  cat.categorias = cat.categorias.filter((c) => c.id !== id);
  await persistCatalog(cat);
  return cat.categorias.length < countBefore;
}

// Reiniciar a valores originales si el usuario lo desea
export async function resetCatalogToDefault(): Promise<CatalogData> {
  const initial = await getInitialCatalogData();
  await persistCatalog(initial);
  return initial;
}
