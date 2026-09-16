import { ResumenCarrito } from "@/components/carrito/ResumenCarrito";
import Link from "next/link";

export const metadata = {
  title: "Tu Carrito | 0600Boston",
};

export default function CarritoPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#14532d] py-6 px-4 select-none">
      <div className="max-w-md mx-auto mb-4 flex justify-between items-center">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803d] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full transition-colors"
        >
          ← Volver al Menú
        </Link>
        <span className="text-sm font-black text-[#14532d]">0600Boston 🍕</span>
      </div>

      <ResumenCarrito />
    </div>
  );
}
