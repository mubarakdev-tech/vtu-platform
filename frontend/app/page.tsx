import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Features from "@/components/sections/Features";
import CallToAction from "@/components/sections/CallToAction";

export default function Home() {
  return (
    <MainLayout>
      <Hero />
      <Services />
      <Features />
      <CallToAction />
    </MainLayout>
  );
}