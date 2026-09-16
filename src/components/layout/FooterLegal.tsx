import React from "react";
import Link from "next/link";

interface FooterLegalProps {
  className?: string;
  theme?: "dark" | "light";
}

export default function FooterLegal({
  className = "",
  theme = "dark",
}: FooterLegalProps) {
  const isDark = theme === "dark";

  return (
    <footer
      className={`w-full py-4 px-4 text-center select-none text-[11px] sm:text-xs transition-colors ${
        isDark
          ? "bg-black/30 backdrop-blur-sm text-slate-400 border-t border-white/5"
          : "bg-white/80 backdrop-blur-sm text-[#4b6b55] border-t border-emerald-100"
      } ${className}`}
    >
      <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="font-semibold">
          © Derechos 0600Boston 2026
        </span>

        <span className="hidden sm:inline opacity-40">•</span>

        <span className="flex items-center gap-1 font-medium">
          <span>Producido by</span>
          <a
            href="https://adnqn.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className={`font-black underline transition-colors ${
              isDark
                ? "text-emerald-400 hover:text-emerald-300"
                : "text-[#15803d] hover:text-[#16a34a]"
            }`}
            title="ADNQN.ar - Soluciones Web y Desarrollo Tecnológico"
          >
            ADNQN.ar
          </a>
        </span>

        <span className="hidden sm:inline opacity-40">•</span>

        <Link
          href="/privacidad"
          className={`hover:underline transition-colors ${
            isDark ? "text-slate-300 hover:text-white" : "text-[#14532d] hover:text-[#15803d]"
          }`}
        >
          Privacidad (RGPD / LGPD)
        </Link>
      </div>
    </footer>
  );
}
