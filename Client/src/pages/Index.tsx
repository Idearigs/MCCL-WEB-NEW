
import React from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";
import MainContentSection from "../components/MainContentSection";
import TestimonialsSection from "../components/TestimonialsSection";
import BespokeDesignSection from "../components/BespokeDesignSection";
import ServiceFeaturesSection from "../components/ServiceFeaturesSection";

const Index = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      <MainContentSection />
      <TestimonialsSection />
      <BespokeDesignSection />
      <ServiceFeaturesSection />
      <FooterSection />
    </div>
  );
};

export default Index;
