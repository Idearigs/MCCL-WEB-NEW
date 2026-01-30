
import React from "react";
import CollectionsSection from "../components/CollectionsSection";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

const Collections = (): JSX.Element => {
  return (
    <div className="w-full flex flex-col min-h-screen">
      <LuxuryNavigationWhite />
      <main className="flex-1">
        <CollectionsSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Collections;
