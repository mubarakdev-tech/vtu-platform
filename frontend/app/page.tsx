import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import TrustedBrands from "@/components/landing/TrustedBrands";
import Services from "@/components/landing/Services";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import Stats from "@/components/landing/Stats";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustedBrands />
      <Services />
      <WhyChooseUs />
      <Stats />
    </>
  );
}