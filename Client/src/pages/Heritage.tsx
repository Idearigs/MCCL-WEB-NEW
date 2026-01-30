
import React from "react";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { FooterSection } from "../components/FooterSection";
import ExcellenceSection from "../components/ExcellenceSection";

const Heritage = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />
      <main className="flex-1">
        <ExcellenceSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Heritage;
