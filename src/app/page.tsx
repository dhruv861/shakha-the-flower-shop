import AnnouncementBar from "@/components/AnnouncementBar";
import DesignYourOwn from "@/components/DesignYourOwn";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InstagramSection from "@/components/InstagramSection";
import OccasionsSection from "@/components/OccasionsSection";
import PromiseSection from "@/components/PromiseSection";
import ReviewsSection from "@/components/ReviewsSection";
import SignatureSection from "@/components/SignatureSection";
import VisitSection from "@/components/VisitSection";
import WeddingsSection from "@/components/WeddingsSection";
import { branches, site } from "@/lib/site";

// Structured data so search engines and maps know both studios.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/apple-icon.png`,
      email: site.email,
      sameAs: [site.instagram.url],
    },
    ...branches.map((branch) => ({
      "@type": "Florist",
      "@id": `${site.url}/#${branch.id}`,
      name: `${site.name} — ${branch.name}`,
      parentOrganization: { "@id": `${site.url}/#organization` },
      url: site.url,
      image: `${site.url}/opengraph-image.jpg`,
      telephone: branch.phone.href.replace("tel:", ""),
      address: {
        "@type": "PostalAddress",
        streetAddress: branch.streetAddress,
        addressLocality: site.city,
        addressRegion: "Gujarat",
        postalCode: branch.postalCode,
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: branch.geo.lat, longitude: branch.geo.lng },
      hasMap: branch.mapsUrl,
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: branch.opens,
        closes: branch.closes,
      },
    })),
  ],
};

export default function Home() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Hero />
        <SignatureSection />
        <OccasionsSection />
        <DesignYourOwn />
        <PromiseSection />
        <WeddingsSection />
        <ReviewsSection />
        <VisitSection />
        <InstagramSection />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
