import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaPrompts from "@/components/pwa/PwaPrompts";
import CookieConsent from "@/components/legal/CookieConsent";

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "0600Boston | La Mejor Pizza Artesanal",
  description:
    "Pizzería artesanal 0600Boston: Gran Variedad de pizzas Artesanales, masa madre, carrusel 3D interactivo con toppings en tiempo real, combos exclusivos y pedidos directos por WhatsApp.",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.0600boston.com.ar"),
  alternates: {
    canonical: "/",
  },
  keywords: [
    "pizza",
    "pizzería",
    "0600boston",
    "pizza artesanal",
    "delivery pizza buenos aires",
    "gran variedad de pizzas",
    "pedir pizza whatsapp",
    "combos pizza",
    "pizza napolitana",
  ],
  authors: [
    { name: "0600Boston" },
    { name: "ADNQN.ar", url: "https://adnqn.ar" },
  ],
  creator: "ADNQN.ar (https://adnqn.ar)",
  publisher: "0600Boston",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "0600Boston",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/BrunoAgradece02.webp", type: "image/webp" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "0600Boston | La Mejor Pizza Artesanal",
    description:
      "Gran Variedad de pizzas Artesanales. Armá tu pizza con topping interactivo y pedí al instante por WhatsApp.",
    url: "https://www.0600boston.com.ar",
    siteName: "0600Boston",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "https://www.0600boston.com.ar/images/BrunoAgradece02.webp",
        secureUrl: "https://www.0600boston.com.ar/images/BrunoAgradece02.webp",
        width: 800,
        height: 800,
        alt: "0600Boston - Pizzería Artesanal",
        type: "image/webp",
      },
      {
        url: "https://www.0600boston.com.ar/images/BrunoAgradece02.png",
        secureUrl: "https://www.0600boston.com.ar/images/BrunoAgradece02.png",
        width: 800,
        height: 800,
        alt: "0600Boston - Pizzería Artesanal",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "0600Boston | La Mejor Pizza Artesanal",
    description:
      "Gran Variedad de pizzas Artesanales con carrusel interactivo y pedidos directos por WhatsApp.",
    images: ["https://www.0600boston.com.ar/images/BrunoAgradece02.webp"],
  },
  other: {
    "geo.region": "AR-B",
    "geo.placename": "Buenos Aires, Argentina",
    "geo.position": "-34.6037;-58.3816",
    ICBM: "-34.6037, -58.3816",
    designer: "ADNQN.ar",
    copyright: "Derechos 0600Boston 2026 - Producido by ADNQN.ar",
  },
};

// Marcado Estructurado JSON-LD para Google Search & Local SEO (Restaurant / Pizzeria)
const schemaJsonLd = {
  "@context": "https://schema.org",
  "@type": "FastFoodRestaurant",
  name: "0600Boston - Pizzería Artesanal",
  image: "https://www.0600boston.com.ar/images/BrunoAgradece02.webp",
  "@id": "https://www.0600boston.com.ar",
  url: "https://www.0600boston.com.ar",
  telephone: "+54 9 11 0000-0000",
  priceRange: "$$",
  servesCuisine: ["Pizza", "Pizzería Artesanal", "Comida Rápida", "Bebidas"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Principal 0600",
    addressLocality: "Buenos Aires",
    addressRegion: "Buenos Aires",
    addressCountry: "AR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -34.6037,
    longitude: -58.3816,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "19:30",
      closes: "23:59",
    },
  ],
  menu: "https://www.0600boston.com.ar/menu",
  hasMenu: "https://www.0600boston.com.ar/menu",
  acceptsReservations: "False",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#0f141f] text-slate-100">
        {children}
        <PwaPrompts />
        <CookieConsent />
      </body>
    </html>
  );
}