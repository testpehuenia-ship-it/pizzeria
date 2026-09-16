import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { removeBackgroundAndOptimize } from "@/lib/image-processor";

export async function POST() {
  try {
    const results: Array<{ file: string; originalSize: number; newSize: number; savedKb: number }> = [];
    const dirsToProcess = [
      path.join(process.cwd(), "public", "images", "ingredientes"),
      path.join(process.cwd(), "public", "images", "pizzas"),
    ];

    for (const dir of dirsToProcess) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (!file.match(/\.(png|jpg|jpeg|webp)$/i)) continue;
          const filePath = path.join(dir, file);
          const stat = await fs.stat(filePath);
          const originalSize = stat.size;

          const rawBuffer = await fs.readFile(filePath);
          const { buffer: optimizedBuffer } = await removeBackgroundAndOptimize(rawBuffer, {
            maxDimension: file.includes("pizza") ? 900 : 600,
            removeBg: true,
          });

          // Solo sobreescribimos si es válido y optimizado
          if (optimizedBuffer && optimizedBuffer.length > 0) {
            await fs.writeFile(filePath, optimizedBuffer);
            const newSize = optimizedBuffer.length;
            results.push({
              file: `${path.basename(dir)}/${file}`,
              originalSize,
              newSize,
              savedKb: Math.round((originalSize - newSize) / 1024),
            });
          }
        }
      } catch (dirErr) {
        console.warn("Directorio no encontrado o no accesible:", dir);
      }
    }

    const totalSavedKb = results.reduce((acc, r) => acc + (r.savedKb > 0 ? r.savedKb : 0), 0);

    return NextResponse.json({
      success: true,
      totalProcesadas: results.length,
      totalSavedKb,
      detalles: results,
      mensaje: `Se optimizaron y transparentaron ${results.length} imágenes, ahorrando ${totalSavedKb} KB en total.`,
    });
  } catch (error: any) {
    console.error("Error en optimización en lote de imágenes:", error);
    return NextResponse.json({ error: error.message || "Error al optimizar imágenes" }, { status: 500 });
  }
}
