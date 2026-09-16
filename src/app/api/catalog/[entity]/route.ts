import { NextResponse } from "next/server";
import {
  getCatalog,
  savePizza,
  deletePizza,
  saveBebida,
  deleteBebida,
  saveIngrediente,
  deleteIngrediente,
  saveCombo,
  deleteCombo,
  saveCategoria,
  deleteCategoria,
} from "@/lib/catalog-db";

type Props = {
  params: Promise<{ entity: string }>;
};

export async function GET(request: Request, context: Props) {
  try {
    const { entity } = await context.params;
    const catalog = await getCatalog();

    switch (entity) {
      case "pizzas":
        return NextResponse.json({ success: true, items: catalog.pizzas });
      case "bebidas":
        return NextResponse.json({ success: true, items: catalog.bebidas });
      case "ingredientes":
        return NextResponse.json({ success: true, items: catalog.ingredientes });
      case "combos":
        return NextResponse.json({ success: true, items: catalog.combos });
      case "categorias":
        return NextResponse.json({ success: true, items: catalog.categorias });
      default:
        return NextResponse.json({ error: "Entidad no válida" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: Props) {
  try {
    const { entity } = await context.params;
    const body = await request.json();

    switch (entity) {
      case "pizzas": {
        if (!body.nombre) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });
        const pizzaId = body.id || `pizza_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const saved = await savePizza({ ...body, id: pizzaId });
        return NextResponse.json({ success: true, item: saved });
      }
      case "bebidas": {
        if (!body.nombre || body.precio === undefined) {
          return NextResponse.json({ error: "Nombre y precio obligatorios" }, { status: 400 });
        }
        const bebidaId = body.id || `beb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const saved = await saveBebida({ ...body, id: bebidaId });
        return NextResponse.json({ success: true, item: saved });
      }
      case "ingredientes": {
        if (!body.nombre) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });
        const ingId = body.id || `ing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const saved = await saveIngrediente({ ...body, id: ingId });
        return NextResponse.json({ success: true, item: saved });
      }
      case "combos": {
        if (!body.nombre || !body.precio) {
          return NextResponse.json({ error: "Nombre y precio de combo obligatorios" }, { status: 400 });
        }
        const comboId = body.id || `combo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const saved = await saveCombo({ ...body, id: comboId });
        return NextResponse.json({ success: true, item: saved });
      }
      case "categorias": {
        if (!body.nombre) return NextResponse.json({ error: "Nombre de categoría obligatorio" }, { status: 400 });
        const catId = body.id || `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const saved = await saveCategoria({ ...body, id: catId });
        return NextResponse.json({ success: true, item: saved });
      }
      default:
        return NextResponse.json({ error: "Entidad no válida" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Props) {
  try {
    const { entity } = await context.params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido para eliminar" }, { status: 400 });
    }

    let ok = false;
    switch (entity) {
      case "pizzas":
        ok = await deletePizza(id);
        break;
      case "bebidas":
        ok = await deleteBebida(id);
        break;
      case "ingredientes":
        ok = await deleteIngrediente(id);
        break;
      case "combos":
        ok = await deleteCombo(id);
        break;
      case "categorias":
        ok = await deleteCategoria(id);
        break;
      default:
        return NextResponse.json({ error: "Entidad no válida" }, { status: 400 });
    }

    return NextResponse.json({ success: ok, message: ok ? "Eliminado con éxito" : "No encontrado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
