
import React from "react";
import LuxuryNavigation from "../components/LuxuryNavigation";
import { FooterSection } from "../components/FooterSection";
import TheFourCsSection from "../components/TheFourCsSection";

const Diamonds = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      <main className="flex-1">
        <TheFourCsSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Diamonds;
