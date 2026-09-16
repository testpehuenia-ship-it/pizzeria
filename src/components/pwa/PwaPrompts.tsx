"use client";

import React, { useState, useEffect } from "react";
import { useTiendaStore } from "@/lib/store";
import { getVapidPublicKey, urlBase64ToUint8Array } from "@/lib/vapid-keys";

type PromptStep = "none" | "install" | "ios_guide" | "notifications" | "notif_success";

async function suscribirWebPush(
  reg: ServiceWorkerRegistration,
  cliente?: any,
  forzarRenovacion = false
) {
  try {
    const vapidKey = getVapidPublicKey();
    if (!vapidKey) return;

    let sub = await reg.pushManager.getSubscription();

    // Si se solicita renovación o la suscripción existía con credenciales viejas,
    // desuscribimos para forzar la emisión de un endpoint fresco por parte de FCM / Apple
    if (sub && forzarRenovacion) {
      try {
        await sub.unsubscribe();
        sub = null;
      } catch (e) {}
    }

    if (!sub) {
      const convertedKey = urlBase64ToUint8Array(vapidKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
          clienteNombre: cliente
            ? `${cliente.nombre} ${cliente.apellido || ""}`.trim()
            : undefined,
          clienteUsuario: cliente?.usuario,
          clienteTelefono: cliente?.telefono,
        }),
      });
    }
  } catch (err) {
    console.warn("No se pudo registrar la suscripción Web Push en el servidor:", err);
  }
}

export default function PwaPrompts() {
  const { cliente } = useTiendaStore();
  const [step, setStep] = useState<PromptStep>("none");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Registrar Service Worker para cumplir con PWA instalable
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("SW registration failed:", err);
      });
    }

    // Comprobar si ya está instalada o fue descargada previamente
    const standaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem("pwa_installed") === "true" ||
      localStorage.getItem("pwa_downloaded") === "true";

    setIsStandalone(standaloneMode);

    // Detectar iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Migración y reactivación excepcional para forzar token limpio
    const needsResync = localStorage.getItem("webpush_v3_active") !== "true";
    if (needsResync) {
      localStorage.setItem("webpush_v3_active", "true");
    }

    // Estado actual de notificaciones: comprobar permiso real del navegador
    const yaTieneNotificaciones =
      "Notification" in window && Notification.permission === "granted";

    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === "granted" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          suscribirWebPush(reg, cliente, needsResync);
        });
      }
    }

    // Escuchar evento de instalación PWA en navegadores compatibles (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Si ya la tiene instalada o descargada, no almacenar ni mostrar prompt
      if (standaloneMode) return;
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Escuchar cuando el usuario instala exitosamente la app
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      localStorage.setItem("pwa_installed", "true");
      localStorage.setItem("pwa_downloaded", "true");
      setShowFloatingButton(false);

      // Solo si AÚN NO aceptó notificaciones, invitar amablemente
      if (!yaTieneNotificaciones && "Notification" in window && Notification.permission === "default") {
        setStep("notifications");
      } else {
        setStep("none");
      }
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Escuchar trigger explícito tras el registro de usuario
    const handleExplicitTrigger = () => {
      // PRECAUCIÓN ESTRICTA: Si ya bajó la app o está instalada, NO mostrar mensaje de descarga
      if (standaloneMode) return;

      const installDismissed = localStorage.getItem("pwa_install_dismissed_at");
      if (!installDismissed) {
        setStep("install");
      }
    };

    window.addEventListener("pwa:trigger-install-prompt", handleExplicitTrigger);

    const installDismissed = localStorage.getItem("pwa_install_dismissed_at");
    const notifDismissed = localStorage.getItem("pwa_notif_dismissed_at");

    const timer = setTimeout(() => {
      if (standaloneMode) {
        // Si ya está instalada o descargada: solo preguntar notificaciones si aún no se respondieron
        setShowFloatingButton(false);
        if (!yaTieneNotificaciones && "Notification" in window && Notification.permission === "default" && !notifDismissed) {
          setStep("notifications");
        } else {
          setStep("none");
        }
      } else {
        // En navegador web normal: invitar primero a recibir notificaciones de ofertas
        if (!yaTieneNotificaciones && "Notification" in window && Notification.permission === "default" && !notifDismissed) {
          setStep("notifications");
        } else if (!installDismissed) {
          setStep("install");
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa:trigger-install-prompt", handleExplicitTrigger);
      clearTimeout(timer);
    };
  }, [cliente]);

  // Manejar acción de instalación
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
        localStorage.setItem("pwa_installed", "true");
        localStorage.setItem("pwa_downloaded", "true");
        setShowFloatingButton(false);

        // Solo si NO aceptó notificaciones previamente
        const yaTieneNotif =
          ("Notification" in window && Notification.permission === "granted") ||
          localStorage.getItem("pwa_notif_accepted") === "true";

        if (!yaTieneNotif && "Notification" in window && Notification.permission === "default") {
          setStep("notifications");
        } else {
          setStep("none");
        }
      } else {
        setStep("none");
      }
    } else if (isIOS) {
      // Mostrar tutorial interactivo para iPhone / iPad
      setStep("ios_guide");
    } else {
      localStorage.setItem("pwa_installed", "true");
      localStorage.setItem("pwa_downloaded", "true");
      alert(
        "Para instalar 0600Boston en tu celular, haz clic en el menú del navegador (tres puntos ⋮ o compartir) y selecciona 'Instalar aplicación' o 'Agregar a pantalla de inicio'."
      );
      setStep("none");
    }
  };

  // Descartar instalación
  const handleDismissInstall = () => {
    localStorage.setItem("pwa_install_dismissed_at", Date.now().toString());
    setStep("none");
  };

  // Manejar solicitud de notificaciones
  const handleRequestNotifications = async () => {
    // Si el usuario está en iPhone / iPad en Safari o Chrome de navegador,
    // Apple exige agregarlo a pantalla de inicio primero para habilitar la API de Notificaciones
    if (isIOS && !isStandalone) {
      setStep("ios_guide");
      return;
    }

    if (!("Notification" in window)) {
      if (isIOS) {
        setStep("ios_guide");
        return;
      }
      alert("Tu navegador no soporta notificaciones push.");
      setStep("none");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === "granted") {
        localStorage.setItem("pwa_notif_accepted", "true");
        localStorage.removeItem("pwa_notif_dismissed_at");
        setStep("notif_success");

        // Notificación de bienvenida local
        try {
          new Notification("¡Bienvenido a 0600Boston! 🍕🍀", {
            body: "¡Genial! Vas a ser el primero en recibir nuestras ofertas relámpago y promociones exclusivas.",
            icon: "/images/brunoagradece.webp",
          });
        } catch (e) {}

        // Suscripción real a Web Push con VAPID forzando endpoint limpio
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            suscribirWebPush(reg, cliente, true);
          });
        }

        setTimeout(() => {
          setStep("none");
        }, 2500);
      } else {
        localStorage.setItem("pwa_notif_dismissed_at", Date.now().toString());
        setStep("none");
      }
    } catch (err) {
      console.error("Error al pedir notificaciones:", err);
      setStep("none");
    }
  };

  // Descartar notificaciones
  const handleDismissNotif = () => {
    localStorage.setItem("pwa_notif_dismissed_at", Date.now().toString());
    setStep("none");
  };

  return (
    <>
      {/* Banner Flotante Excepcional para Clientes con Notificaciones Pendientes */}
      {cliente && notifPermission !== "granted" && step === "none" && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-[#151f2e]/95 backdrop-blur-md border border-emerald-400/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 text-white animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0">🔔</span>
            <div className="text-[11px] leading-tight min-w-0">
              <span className="font-extrabold text-emerald-300 truncate block">
                ¡Hola {cliente.nombre}!
              </span>
              <span className="text-slate-300 text-[10px]">Reactivá tus alertas de ofertas</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep("notifications")}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md shrink-0 active:scale-95"
          >
            Activar
          </button>
        </div>
      )}

      {/* MODAL / BANNER FLOTANTE CON FONDO BISELADO TRANSPARENTE AL 90% */}
      {step !== "none" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/35 backdrop-blur-[2px] transition-all duration-300">
          <div
            className="relative w-full max-w-lg bg-black/20 backdrop-blur-md border border-emerald-400/50 rounded-3xl p-5 sm:p-6 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_15px_40px_rgba(0,0,0,0.6)] text-white animate-fade-in-up"
            role="dialog"
            aria-modal="true"
          >
            {/* Botón de cerrar superior */}
            <button
              onClick={() => {
                if (step === "install" || step === "ios_guide") handleDismissInstall();
                else handleDismissNotif();
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center text-sm font-bold transition-all border border-white/15 cursor-pointer"
              aria-label="Cerrar"
            >
              ✕
            </button>

            {/* CASO 1: INVITACIÓN A INSTALAR APP (Tras registro, con Bruno Descraga) */}
            {step === "install" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-300 bg-black/30 backdrop-blur-sm border border-emerald-400/50 px-2.5 py-0.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                    🍀 Web App Oficial 0600Boston
                  </span>
                </div>

                <div className="flex flex-row items-center gap-4 sm:gap-5 mb-4">
                  {/* AVATAR BRUNO ADAPTADO AL FONDO BISELADO */}
                  <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50 p-1 border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] overflow-hidden flex items-center justify-center group">
                    <img
                      src="/images/brunodescarga.webp"
                      alt="Bruno te invita a descargar la app"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 backdrop-blur-[1px] text-[9px] font-black text-white text-center py-0.5 uppercase tracking-wide">
                      Bruno
                    </div>
                  </div>

                  {/* TEXTO Y TÍTULO */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
                      ¡Instalá nuestra App en tu teléfono! 📲
                    </h3>
                    <p className="text-xs text-emerald-100/90 font-medium mt-1 drop-shadow-sm">
                      Tu cuenta ya está lista. Descargá el acceso directo para pedir de forma inmediata y sin demoras.
                    </p>
                  </div>
                </div>

                {/* BENEFICIOS CON FONDO BISELADO TRANSLÚCIDO */}
                <div className="bg-black/30 backdrop-blur-sm border border-emerald-400/25 rounded-2xl p-3.5 mb-5 space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">⚡</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">1 Toque de acceso:</strong> Entrá directo desde tu pantalla de inicio sin usar tiendas.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">💾</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">0% Espacio:</strong> No consume memoria ni ralentiza tu teléfono.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">🍕</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">Pedidos ultra rápidos:</strong> Tus datos y dirección ya quedan guardados para enviar en 1 clic.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">🎁</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">Beneficios exclusivos:</strong> Promociones únicas solo disponibles para la app.
                    </span>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN BISELADOS */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:brightness-110 active:scale-98 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_20px_rgba(16,185,129,0.35)] border border-emerald-400/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Descargar e Instalar App</span>
                    <span className="text-base">🚀</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDismissInstall}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-black/20 hover:bg-black/40 border border-white/15 transition-all cursor-pointer"
                  >
                    Más tarde
                  </button>
                </div>
              </div>
            )}

            {/* CASO 1.5: GUÍA PARA iOS SAFARI CON FONDO BISELADO */}
            {step === "ios_guide" && (
              <div className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-black/30 backdrop-blur-sm border border-emerald-400/40 px-2.5 py-0.5 rounded-full">
                    📱 Instrucciones para iPhone / iPad
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mb-2 drop-shadow-md">
                  Cómo agregar 0600Boston a tu pantalla:
                </h3>

                <div className="space-y-3 bg-black/30 backdrop-blur-sm border border-emerald-400/25 rounded-2xl p-4 mb-4 text-xs shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <p className="text-slate-100">
                      Toca el botón <strong className="text-white">Compartir</strong> (icono del cuadrado con flecha hacia arriba ⎋) en la barra de Safari.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <p className="text-slate-100">
                      Desplaza las opciones hacia abajo y pulsa en <strong className="text-white">&quot;Agregar a pantalla de inicio&quot;</strong> ➕.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <p className="text-slate-100">
                      Confirma tocando <strong className="text-white">&quot;Agregar&quot;</strong> en la esquina superior derecha.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep("notifications")}
                  className="w-full py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] border border-emerald-400/50 transition-all cursor-pointer"
                >
                  ¡Entendido! Ya la agregué 👍
                </button>
              </div>
            )}

            {/* CASO 2: INVITACIÓN A NOTIFICACIONES (Con Bruno Agradece y fondo biselado) */}
            {step === "notifications" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-300 bg-black/30 backdrop-blur-sm border border-emerald-400/50 px-2.5 py-0.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                    🎉 ¡Gracias por sumar 0600Boston!
                  </span>
                </div>

                <div className="flex flex-row items-center gap-4 sm:gap-5 mb-4">
                  {/* AVATAR BRUNO AGRADECE */}
                  <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50 p-1 border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] overflow-hidden flex items-center justify-center">
                    <img
                      src="/images/brunoagradece.webp"
                      alt="Bruno agradece y te invita a recibir notificaciones"
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 backdrop-blur-[1px] text-[9px] font-black text-white text-center py-0.5 uppercase tracking-wide">
                      Bruno
                    </div>
                  </div>

                  {/* TEXTO Y TÍTULO */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight drop-shadow-md">
                      {cliente ? `¡Hola ${cliente.nombre}! Reactivá tus Notificaciones 🔔` : "¡Recibí ofertas y promos exclusivas! 🔔"}
                    </h3>
                    <p className="text-xs text-emerald-100/90 font-medium mt-1 drop-shadow-sm">
                      {cliente
                        ? "Actualizamos nuestro sistema. Tocá 'Activar Notificaciones' para recibir promos relámpago y avisos de tus pedidos en tu celular."
                        : "¡Bruno y el equipo te avisan al instante cuando salgan promociones relámpago y pizzas con descuento!"}
                    </p>
                  </div>
                </div>

                {/* QUÉ RECIBIRÁN */}
                <div className="bg-black/30 backdrop-blur-sm border border-emerald-400/25 rounded-2xl p-3.5 mb-5 space-y-2.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">🔥</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">Ofertas Flash y 2x1:</strong> Descuentos por tiempo limitado antes de que se agote el stock.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">🛵</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">Avisos de tu pedido:</strong> Te avisamos en vivo cuando la pizza entra al horno y sale en viaje.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <span className="text-emerald-400 text-sm leading-none shrink-0 drop-shadow-sm">🎁</span>
                    <span className="text-slate-100 font-medium">
                      <strong className="text-white font-bold">Cupones sorpresa:</strong> Regalos y descuentos en días especiales para usuarios de la app.
                    </span>
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleRequestNotifications}
                    className="w-full py-3.5 px-5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:brightness-110 active:scale-98 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_8px_20px_rgba(16,185,129,0.35)] border border-emerald-400/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{isIOS && !isStandalone ? "Ver cómo activar en iPhone" : "Activar Notificaciones"}</span>
                    <span className="text-base">{isIOS && !isStandalone ? "📲" : "🔔"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDismissNotif}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-black/20 hover:bg-black/40 border border-white/15 transition-all cursor-pointer"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            )}

            {/* CASO 3: ÉXITO AL ACTIVAR NOTIFICACIONES */}
            {step === "notif_success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  🎉
                </div>
                <h3 className="text-xl font-black text-white mb-1 drop-shadow-md">
                  ¡Notificaciones Activadas!
                </h3>
                <p className="text-xs text-emerald-100 max-w-xs mx-auto drop-shadow-sm">
                  ¡Genial! Vas a ser el primero en recibir nuestras promociones exclusivas. Bruno te lo agradece.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
