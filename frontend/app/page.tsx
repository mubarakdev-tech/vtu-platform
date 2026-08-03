import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustedBrands from "@/components/landing/TrustedBrands";
import Services from "@/components/landing/Services";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import Stats from "@/components/landing/Stats";
import Testimonials from "@/components/landing/Testimonials";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <TrustedBrands />

      <Services />

      <WhyChooseUs />

      <Stats />

      <Testimonials />

      <FAQ />

      <Footer />
    </>
  );
}