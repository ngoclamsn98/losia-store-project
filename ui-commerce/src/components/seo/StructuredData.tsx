/**
 * SEO Structured Data Components
 * Generate JSON-LD for various schema types
 */

type ProductStructuredDataProps = {
  name: string;
  description: string;
  image: string | string[];
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  sku?: string;
  url: string;
  rating?: {
    value: number;
    count: number;
  };
};

export function ProductStructuredData({
  name,
  description,
  image,
  price,
  currency = "VND",
  availability = "InStock",
  brand = "LOSIA",
  sku,
  url,
  rating,
}: ProductStructuredDataProps) {
  const images = Array.isArray(image) ? image : [image];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: images,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    sku: sku || name,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price: price.toString(),
      availability: `https://schema.org/${availability}`,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.value.toString(),
        reviewCount: rating.count.toString(),
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

type CollectionStructuredDataProps = {
  name: string;
  description: string;
  url: string;
  numberOfItems: number;
};

export function CollectionStructuredData({
  name,
  description,
  url,
  numberOfItems,
}: CollectionStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

type FAQStructuredDataProps = {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export function FAQStructuredData({ faqs }: FAQStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

type ArticleStructuredDataProps = {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
};

export function ArticleStructuredData({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  url,
}: ArticleStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "LOSIA",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://losia.vn"}/assets/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

type LocalBusinessStructuredDataProps = {
  name?: string;
  address?: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  openingHours?: string[];
};

export function LocalBusinessStructuredData({
  name = "LOSIA",
  address,
  phone,
  email,
  openingHours = ["Mo-Su 09:00-21:00"],
}: LocalBusinessStructuredDataProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name,
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://losia.vn",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://losia.vn"}/assets/logo.png`,
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address.street,
        addressLocality: address.city,
        addressRegion: address.region,
        postalCode: address.postalCode,
        addressCountry: address.country,
      },
    }),
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(openingHours && { openingHoursSpecification: openingHours }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

