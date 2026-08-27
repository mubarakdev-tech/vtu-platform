import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import Services from "@/components/sections/Services";
import CallToAction from "@/components/sections/CallToAction";

export default function HomePage() {
  return (
    <main>
      <Hero />

      <Services />

      <Features />

      <CallToAction />
    </main>
  );
}