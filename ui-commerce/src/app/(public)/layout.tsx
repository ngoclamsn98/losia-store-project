// app/(public)/layout.tsx
import "@/styles/globals.css";
import React from "react";
import Script from "next/script";
import PageView from "@/components/analytics/PageView";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import MiniCartDrawer from "@/components/cart/MiniCartDrawer";
import Providers from "@/app/providers/Providers";

import Header from "@/app/(public)/components/common/Header";
import Footer from "@/app/(public)/components/common/Footer";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://circ.vn").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Circ - Thời Trang Secondhand Cao Cấp | Wear What Matters",
    template: "%s | Circ",
  },
  description: "Circ - Nền tảng thời trang secondhand hàng đầu Việt Nam. Đồ like-new chất lượng cao, tiết kiệm đến 90%. Bền vững, an toàn, giao hàng nhanh toàn quốc.",
  keywords: [
    "thời trang secondhand",
    "đồ cũ cao cấp",
    "thời trang bền vững",
    "secondhand Việt Nam",
    "đồ like-new",
    "thời trang trẻ em",
    "đồ cũ chất lượng",
    "Circ",
    "mua bán đồ cũ",
    "consignment",
  ],
  authors: [{ name: "Circ Team" }],
  creator: "Circ",
  publisher: "Circ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: SITE_URL,
    siteName: "Circ",
    title: "Circ - Thời Trang Secondhand Cao Cấp",
    description: "Nền tảng thời trang secondhand hàng đầu Việt Nam. Đồ like-new chất lượng cao, tiết kiệm đến 90%.",
    images: [
      {
        url: `${SITE_URL}/assets/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Circ - Wear What Matters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Circ - Thời Trang Secondhand Cao Cấp",
    description: "Nền tảng thời trang secondhand hàng đầu Việt Nam. Đồ like-new chất lượng cao, tiết kiệm đến 90%.",
    images: [`${SITE_URL}/assets/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    // bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Changed from 1 to 5 for better accessibility
  themeColor: "#10b981", // Emerald color matching brand
};
const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const enableAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "1" && !!GA_ID;
  const cdn = process.env.NEXT_PUBLIC_IMG_CDN ?? "https://cdn.circ.vn";

  return (
    <html lang="vi">
      <head>
        {/* Charset */}
        <meta charSet="utf-8" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href={cdn} crossOrigin="" />
        <link rel="dns-prefetch" href={cdn} />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {enableAnalytics ? <link rel="preconnect" href="https://www.googletagmanager.com" /> : null}

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Circ" />
        <meta name="google-site-verification" content="z3dVogKYUALjU2aowLaFPYV9cU_5C3EFDyOLpgsXl0s" />

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-DMGTHKR73F"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-DMGTHKR73F');
            `,
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TMJ22FQ3');`,
          }}
        />


      </head>

      <body className={inter.className}>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TMJ22FQ3"
          height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe></noscript>

        <Providers>
          {/* Header mới */}
          <Header />

          {/* MiniCartDrawer cần context → đặt bên trong Provider */}
          <MiniCartDrawer hideTrigger />

          {/* Nội dung trang */}
          <main>{children}</main>

          {/* Footer đồng bộ */}
          <Footer />

          {/* GA4 */}
          {/* {enableAnalytics ? (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
              <Script id="ga4-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', { send_page_view: false });
                `}
              </Script>
              <PageView />
            </>
          ) : null} */}

          {/* JSON-LD Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Circ",
                alternateName: "Circ Store",
                url: SITE_URL,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/assets/logo.png`,
                  width: 250,
                  height: 60,
                },
                description: "Nền tảng thời trang secondhand hàng đầu Việt Nam",
                address: {
                  "@type": "PostalAddress",
                  addressCountry: "VN",
                  addressLocality: "Hà Nội",
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "Customer Service",
                  availableLanguage: ["Vietnamese", "English"],
                },
                sameAs: [
                  "https://www.facebook.com/circ",
                  "https://www.instagram.com/circ",
                  "https://www.tiktok.com/@circ",
                ].filter(Boolean),
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Circ",
                url: SITE_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                "@id": `${SITE_URL}/#webpage`,
                url: SITE_URL,
                name: "Circ - Thời Trang Secondhand Cao Cấp",
                description: "Nền tảng thời trang secondhand hàng đầu Việt Nam. Đồ like-new chất lượng cao, tiết kiệm đến 90%.",
                publisher: {
                  "@type": "Organization",
                  name: "Circ",
                  logo: {
                    "@type": "ImageObject",
                    url: `${SITE_URL}/assets/logo.png`,
                  },
                },
                inLanguage: "vi-VN",
              }),
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
