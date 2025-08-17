
import React from "react";
import BespokeServiceSection from "../components/BespokeServiceSection";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";

const Jewellery = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      <main className="flex-1">
        <BespokeServiceSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Jewellery;
