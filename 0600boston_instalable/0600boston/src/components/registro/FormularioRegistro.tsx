"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTiendaStore } from "@/lib/store";

export default function FormularioRegistro() {
  const router = useRouter();
  const { cliente, setCliente } = useTiendaStore();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    usuario: "",
    password: "",
    direccion: "",
    barrio: "",
    telefono: "",
  });

  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || "",
        apellido: cliente.apellido || "",
        usuario: cliente.usuario || "",
        password: "",
        direccion: cliente.direccion || "",
        barrio: cliente.barrio || "",
        telefono: cliente.telefono || "",
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar");
      }

      setCliente(data.cliente);
      router.push("/menu");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 select-none">
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_15px_40px_rgba(20,83,45,0.08)] fade-in-up">
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 inline-block">🍀</span>
          <h2 className="text-2xl font-black text-[#14532d]">Tus Datos de Envío</h2>
          <p className="text-xs text-[#4b6b55] mt-1">
            Completá tus datos para que el delivery llegue directo a tu puerta
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
                placeholder="Ej: Juan"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                Apellido
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
                placeholder="Ej: Pérez"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                Usuario
              </label>
              <input
                type="text"
                name="usuario"
                value={formData.usuario}
                onChange={handleChange}
                required
                className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
                placeholder="juanperez"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
                placeholder="••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
                className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
                placeholder="Calle y número"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                Barrio
              </label>
              <input
                type="text"
                name="barrio"
                value={formData.barrio}
                onChange={handleChange}
                required
                className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
                placeholder="Centro"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
              Teléfono (WhatsApp)
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              required
              className="w-full bg-[#f8fafc] border border-emerald-200 rounded-2xl px-3.5 py-2.5 text-xs text-[#14532d] font-medium focus:outline-none focus:border-[#15803d] transition-all"
              placeholder="Ej: 02942-661000"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full mt-4 py-3.5 px-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-lg shadow-emerald-700/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{cargando ? "Guardando..." : "Guardar e Ir al Menú"}</span>
            <span>🍕</span>
          </button>
        </form>
      </div>
    </div>
  );
}