"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTiendaStore } from "@/lib/store";
import { generarMensajeWhatsApp } from "@/lib/whatsapp";
import { salirYCerrarApp } from "@/lib/cerrar-app";
import Link from "next/link";

export default function PedidoPage() {
  const {
    cliente,
    pizzas,
    bebidas,
    combos = [],
    tipoEntrega,
    domicilioEntrega,
    setTipoEntrega,
    setDomicilioEntrega,
    calcularTotal,
    vaciarCarrito,
  } = useTiendaStore();

  // Estado de dirección: 'registrada' | 'gps' | 'manual'
  const direccionRegistrada = cliente?.domicilio || cliente?.direccion ? `${cliente?.direccion}${cliente?.barrio ? ` (${cliente.barrio})` : ""}` : "";
  const [modoDireccion, setModoDireccion] = useState<"registrada" | "gps" | "manual">(
    direccionRegistrada ? "registrada" : "manual"
  );
  const [domicilio, setDomicilio] = useState(domicilioEntrega || direccionRegistrada || "");
  const [notaEntrega, setNotaEntrega] = useState("");
  const [gpsData, setGpsData] = useState<{
    lat: number;
    lng: number;
    calleAprox?: string;
    nota?: string;
  } | null>(null);
  const [gpsCargando, setGpsCargando] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [telefonoWhatsappDestino, setTelefonoWhatsappDestino] = useState("");
  const total = calcularTotal();

  // Cargar número dinámico de WhatsApp configurado por el admin
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.whatsappNumeroWaMe) {
          setTelefonoWhatsappDestino(data.settings.whatsappNumeroWaMe);
        }
      })
      .catch((err) => console.error("Error al obtener teléfono de WhatsApp:", err));
  }, []);

  const handleObtenerGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Tu navegador o celular no soporta geolocalización GPS.");
      return;
    }

    setGpsCargando(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let calleDetectada = "";

        try {
          // Geocodificación inversa ligera con OpenStreetMap
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "es" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const road = data.address.road || data.address.pedestrian || "";
              const houseNumber = data.address.house_number || "";
              const suburb = data.address.suburb || data.address.neighbourhood || data.address.city || "";
              calleDetectada = [road, houseNumber, suburb].filter(Boolean).join(", ");
            }
          }
        } catch {
          // Si falla reverse geocode, se usan coordenadas directamente
        }

        const datos = {
          lat: latitude,
          lng: longitude,
          calleAprox: calleDetectada || `Punto GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
          nota: notaEntrega,
        };

        setGpsData(datos);
        setDomicilio(datos.calleAprox);
        setModoDireccion("gps");
        setGpsCargando(false);
      },
      (err) => {
        setGpsCargando(false);
        if (err.code === 1) {
          setGpsError("Permiso de ubicación denegado. Podés ingresar tu dirección manualmente.");
        } else {
          setGpsError("No se pudo obtener la señal GPS. Podés escribir tu dirección.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const router = useRouter();
  const [pedidoEnviado, setPedidoEnviado] = useState(false);

  const handleEnviarPedidoWhatsApp = () => {
    if (tipoEntrega === "delivery") {
      if (modoDireccion === "gps" && !gpsData) {
        alert("Por favor pulsa en 'Detectar mi ubicación del celular' o escribe tu dirección.");
        return;
      }
      if (modoDireccion !== "gps" && !domicilio.trim()) {
        alert("Por favor ingresá tu dirección para el delivery.");
        return;
      }
    }

    if (pizzas.length === 0 && bebidas.length === 0 && (!combos || combos.length === 0)) {
      alert("Tu carrito está vacío. Sumá tus pizzas o bebidas antes de pedir.");
      return;
    }

    // Generar URL con el detalle completo y total
    const url = generarMensajeWhatsApp(
      cliente,
      pizzas,
      bebidas,
      tipoEntrega,
      domicilio,
      total,
      modoDireccion === "gps" && gpsData ? { ...gpsData, nota: notaEntrega } : null,
      combos,
      telefonoWhatsappDestino || undefined
    );

    // 1. Abrir WhatsApp en pestaña / aplicación
    window.open(url, "_blank");

    // 2. Vaciar carrito de la tienda
    vaciarCarrito();
    setPedidoEnviado(true);

    // 3. Volver al inicio automáticamente tras breve confirmación
    setTimeout(() => {
      router.push("/");
    }, 1600);
  };

  if (pizzas.length === 0 && bebidas.length === 0 && (!combos || combos.length === 0) && !pedidoEnviado) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#14532d] p-4 flex items-center justify-center select-none">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-3xl p-8 text-center shadow-sm fade-in-up">
          <span className="text-4xl block mb-2">🛒</span>
          <h3 className="text-base font-bold text-[#14532d] mb-1">Tu carrito está vacío</h3>
          <p className="text-xs text-[#4b6b55] mb-4">Sumá tus pizzas favoritas en el menú para confirmar tu pedido.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link
              href="/menu"
              className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-[#15803d] text-white text-xs font-bold shadow-md shadow-emerald-700/20 hover:brightness-110 active:scale-95 transition-all"
            >
              Ir a la Carta 🍕
            </Link>
            <button
              type="button"
              onClick={() => salirYCerrarApp()}
              className="w-full sm:w-auto py-2.5 px-5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black shadow-md shadow-red-700/25 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🚪</span>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#14532d] p-4 flex items-center justify-center select-none">
      <div className="max-w-md w-full bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_rgba(20,83,45,0.08)] fade-in-up">
        {/* Barra Superior con botón Salir destacado */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100/80 mb-4">
          <Link
            href="/menu"
            className="text-xs font-bold text-[#4b6b55] hover:text-[#14532d] flex items-center gap-1 transition-colors"
          >
            <span>←</span>
            <span>Volver a la Carta</span>
          </Link>
          <button
            type="button"
            onClick={() => salirYCerrarApp()}
            title="Salir y cerrar la aplicación"
            className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[11px] px-3.5 py-1.5 rounded-full shadow-md shadow-red-700/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚪</span>
            <span>Salir</span>
          </button>
        </div>

        {!pedidoEnviado ? (
          <div>
            <div className="text-center mb-5">
              <span className="text-4xl inline-block mb-1">🛵</span>
              <h2 className="text-2xl font-black text-[#14532d]">Confirmar Pedido</h2>
              <p className="text-xs text-[#4b6b55] mt-1">Elegí la modalidad y dirección de entrega</p>
            </div>

            {/* Resumen de productos incluyendo pizzas, combos y bebidas */}
            <div className="bg-emerald-50/50 rounded-2xl p-3.5 border border-emerald-100/80 text-xs mb-4">
              <div className="flex justify-between items-center mb-2 text-[#4b6b55] font-bold text-[11px] uppercase tracking-wide">
                <span>Tu Selección:</span>
                <span>
                  {pizzas.length + (combos?.length || 0) + bebidas.reduce((a, b) => a + b.cantidad, 0)} items
                </span>
              </div>
              <div className="space-y-1.5 text-[#14532d] font-semibold">
                {pizzas.map((p, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 truncate">
                      {p.pizza?.imagen && (p.pizza.imagen.startsWith("/") || p.pizza.imagen.startsWith("http")) ? (
                        <img
                          src={p.pizza.imagen}
                          alt={p.pizza.nombre}
                          className="w-5 h-5 rounded-md object-cover shrink-0 border border-emerald-300 shadow-xs"
                        />
                      ) : (
                        <span>{p.pizza?.imagen || "🍕"}</span>
                      )}
                      <span>{p.pizza?.nombre || "Pizza"} ({p.tamaño || "8"}p)</span>
                    </div>
                    <span className="font-mono font-bold">${(Number(p.precio) || 0).toLocaleString("es-AR")}</span>
                  </div>
                ))}
                {combos && combos.map((c, i) => (
                  <div key={`c-${i}`} className="flex justify-between items-center text-emerald-900 font-bold">
                    <span>🎁 {c.cantidad}x {c.combo?.nombre || "Combo"}</span>
                    <span className="font-mono">${((Number(c.precioUnitario || c.combo?.precio) || 0) * (Number(c.cantidad) || 1)).toLocaleString("es-AR")}</span>
                  </div>
                ))}
                {bebidas.map((b, i) => (
                  <div key={`b-${i}`} className="flex justify-between items-center text-[#4b6b55]">
                    <span>🥤 {b.cantidad}x {b.bebida?.nombre || "Bebida"}</span>
                    <span className="font-mono">${((Number(b.precioUnitario || b.bebida?.precio) || 0) * (Number(b.cantidad) || 1)).toLocaleString("es-AR")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4b6b55] mb-2">
                  Tipo de entrega:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoEntrega("delivery")}
                    className={`py-3 px-4 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                      tipoEntrega === "delivery"
                        ? "bg-[#15803d] border-[#15803d] text-white shadow-md shadow-emerald-700/20"
                        : "bg-[#f8fafc] border-emerald-200 text-[#4b6b55] hover:bg-emerald-50"
                    }`}
                  >
                    <span className="text-lg">🛵</span>
                    <span>Delivery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoEntrega("retiro")}
                    className={`py-3 px-4 rounded-2xl border text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                      tipoEntrega === "retiro"
                        ? "bg-[#15803d] border-[#15803d] text-white shadow-md shadow-emerald-700/20"
                        : "bg-[#f8fafc] border-emerald-200 text-[#4b6b55] hover:bg-emerald-50"
                    }`}
                  >
                    <span className="text-lg">🏪</span>
                    <span>Retiro en Local</span>
                  </button>
                </div>
              </div>

              {tipoEntrega === "delivery" && (
                <div className="space-y-3 bg-emerald-50/40 p-3.5 sm:p-4 rounded-2xl border border-emerald-100">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4b6b55]">
                    ¿A qué dirección enviamos tu pedido?
                  </label>

                  {/* Selector de Opciones: Dirección Registrada vs Ubicación Celular vs Manual */}
                  <div className="space-y-2">
                    {/* Opción 1: Dirección Registrada (si existe) */}
                    {direccionRegistrada && (
                      <button
                        type="button"
                        onClick={() => {
                          setModoDireccion("registrada");
                          setDomicilio(direccionRegistrada);
                          setGpsError("");
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          modoDireccion === "registrada"
                            ? "bg-white border-emerald-500 shadow-sm text-[#14532d] ring-1 ring-emerald-500"
                            : "bg-white/60 border-emerald-200/80 text-[#4b6b55] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base mt-0.5">🏠</span>
                          <div>
                            <p className="font-black text-xs text-[#14532d]">
                              Dirección Registrada
                            </p>
                            <p className="text-[11px] text-[#4b6b55]">
                              {direccionRegistrada}
                            </p>
                          </div>
                        </div>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${modoDireccion === "registrada" ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`}>
                          {modoDireccion === "registrada" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </button>
                    )}

                    {/* Opción 2: Ubicación actual del Celular (GPS) */}
                    <div
                      className={`p-3 rounded-xl border text-xs font-medium transition-all ${
                        modoDireccion === "gps"
                          ? "bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500"
                          : "bg-white/60 border-emerald-200/80 hover:bg-white"
                      }`}
                    >
                      <div
                        onClick={() => {
                          setModoDireccion("gps");
                          if (!gpsData) handleObtenerGps();
                        }}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base mt-0.5">📍</span>
                          <div>
                            <p className="font-black text-xs text-[#14532d]">
                              Ubicación actual de tu celular (GPS)
                            </p>
                            <p className="text-[11px] text-[#4b6b55]">
                              {gpsData
                                ? gpsData.calleAprox
                                : "Envía el punto exacto de tu celular para el repartidor"}
                            </p>
                          </div>
                        </div>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${modoDireccion === "gps" ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`}>
                          {modoDireccion === "gps" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>

                      {/* Botón para detectar o refrescar GPS */}
                      {modoDireccion === "gps" && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-100/80 space-y-2">
                          <button
                            type="button"
                            onClick={handleObtenerGps}
                            disabled={gpsCargando}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <span>{gpsCargando ? "🛰️ Obteniendo señal GPS..." : (gpsData ? "🔄 Actualizar mi ubicación GPS" : "📡 Detectar mi ubicación actual")}</span>
                          </button>

                          {gpsError && (
                            <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                              ⚠️ {gpsError}
                            </p>
                          )}

                          {gpsData && (
                            <div className="bg-emerald-50 text-[11px] text-emerald-800 p-2 rounded-lg border border-emerald-200 space-y-1">
                              <p className="font-bold flex items-center gap-1">
                                <span>✅ Coordenadas:</span>
                                <span className="font-mono text-[10px]">{gpsData.lat.toFixed(5)}, {gpsData.lng.toFixed(5)}</span>
                              </p>
                              <a
                                href={`https://www.google.com/maps?q=${gpsData.lat},${gpsData.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 underline font-semibold flex items-center gap-1"
                              >
                                🗺️ Ver punto en Google Maps →
                              </a>
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4b6b55] mb-1">
                              Aclaración para el repartidor (opcional):
                            </label>
                            <input
                              type="text"
                              value={notaEntrega}
                              onChange={(e) => setNotaEntrega(e.target.value)}
                              placeholder="Ej: Depto 2B, portón negro, timbre..."
                              className="w-full bg-[#f8fafc] border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs text-[#14532d] focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Opción 3: Escribir otra dirección manualmente */}
                    <button
                      type="button"
                      onClick={() => {
                        setModoDireccion("manual");
                        setDomicilio("");
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        modoDireccion === "manual"
                          ? "bg-white border-emerald-500 shadow-sm text-[#14532d] ring-1 ring-emerald-500"
                          : "bg-white/60 border-emerald-200/80 text-[#4b6b55] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-base mt-0.5">✏️</span>
                        <div>
                          <p className="font-black text-xs text-[#14532d]">
                            Escribir otra dirección
                          </p>
                          <p className="text-[11px] text-[#4b6b55]">
                            Ingresá una calle diferente para esta entrega
                          </p>
                        </div>
                      </div>
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${modoDireccion === "manual" ? "border-emerald-600 bg-emerald-600" : "border-gray-300"}`}>
                        {modoDireccion === "manual" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {modoDireccion === "manual" && (
                      <div className="pt-1">
                        <input
                          type="text"
                          value={domicilio}
                          onChange={(e) => setDomicilio(e.target.value)}
                          required
                          placeholder="Calle, número, depto o referencia..."
                          className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-[#14532d] text-xs focus:outline-none focus:border-[#15803d] font-medium shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
                <span className="text-xs font-bold text-[#4b6b55]">Total a pagar:</span>
                <span className="text-2xl font-black text-[#15803d] font-mono">
                  ${(Number(total) || 0).toLocaleString("es-AR")}
                </span>
              </div>

              <button
                type="button"
                onClick={handleEnviarPedidoWhatsApp}
                className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#15803d] to-[#16a34a] shadow-lg shadow-emerald-700/25 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enviar Pedido por WhatsApp</span>
                <span className="text-base">💬</span>
              </button>

              <div className="flex items-center justify-between pt-2">
                <Link href="/menu" className="text-xs font-bold text-[#4b6b55] hover:text-[#14532d]">
                  ← Modificar carrito
                </Link>
                <button
                  type="button"
                  onClick={() => salirYCerrarApp()}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>🚪 Salir</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
              💬
            </div>
            <h3 className="text-2xl font-black text-[#14532d] mb-2">
              ¡Pedido Enviado a WhatsApp!
            </h3>
            <p className="text-xs text-[#4b6b55] mb-6 leading-relaxed">
              El detalle de tu pedido y el importe fueron enviados a la cocina de 0600Boston.<br />
              Cerrando pedido y regresando a la portada...
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-red-600 to-rose-600 shadow-lg shadow-red-700/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span>🚪 Volver al Inicio Ahora</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}