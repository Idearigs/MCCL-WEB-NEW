
import React from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";
import MainContentSection from "../components/MainContentSection";
import TestimonialsSection from "../components/TestimonialsSection";
import BespokeDesignSection from "../components/BespokeDesignSection";
import ServiceFeaturesSection from "../components/ServiceFeaturesSection";
import PromotionPopup from "../components/PromotionPopup";
import ChatWidget from "../components/ChatWidget";

const Index = (): JSX.Element => {
  // TODO: Get user from auth context/store when authentication is implemented
  const user = null;

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      <PromotionPopup delay={3000} />
      <ChatWidget user={user} />
      <MainContentSection />
      <TestimonialsSection />
      <BespokeDesignSection />
      <ServiceFeaturesSection />
      <FooterSection />
    </div>
  );
};

export default Index;
