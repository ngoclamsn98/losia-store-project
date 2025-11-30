import type { Metadata } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://circ.vn").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Về Chúng Tôi - Câu Chuyện Circ",
  description: "Circ - Nền tảng thời trang secondhand hàng đầu Việt Nam. Khởi đầu từ Hannah Vintage, chúng tôi mang đến trải nghiệm mua sắm đồ cũ cao cấp, bền vững và an toàn.",
  keywords: [
    "về Circ",
    "câu chuyện Circ",
    "thời trang bền vững",
    "secondhand Việt Nam",
    "Hannah Vintage",
    "consignment",
    "thời trang tái chế",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "Về Chúng Tôi - Câu Chuyện Circ",
    description: "Khởi đầu từ Hannah Vintage, Circ mang đến trải nghiệm mua sắm đồ secondhand cao cấp, bền vững và an toàn.",
    url: `${SITE_URL}/about`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/assets/og-about.jpg`,
        width: 1200,
        height: 630,
        alt: "Circ Team",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Về Chúng Tôi - Câu Chuyện Circ",
    description: "Khởi đầu từ Hannah Vintage, Circ mang đến trải nghiệm mua sắm đồ secondhand cao cấp.",
    images: [`${SITE_URL}/assets/og-about.jpg`],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

