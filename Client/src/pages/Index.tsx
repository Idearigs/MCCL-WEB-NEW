
import React from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";
import MainContentSection from "../components/MainContentSection";
import TestimonialsSection from "../components/TestimonialsSection";
import BespokeDesignSection from "../components/BespokeDesignSection";
import ServiceFeaturesSection from "../components/ServiceFeaturesSection";
import PromotionPopup from "../components/PromotionPopup";
import ChatWidget from "../components/ChatWidget";
import { useUserAuth } from "../contexts/UserAuthContext";

const Index = (): JSX.Element => {
  // Get user from auth context
  const { user: authUser } = useUserAuth();
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    name: authUser.fullName || `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim()
  } : null;

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
