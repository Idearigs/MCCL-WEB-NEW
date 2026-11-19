
import React, { lazy, Suspense } from "react";
import NavigationV2 from "../components/home-v2/NavigationV2";
import MainContentV2 from "../components/home-v2/MainContentV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useAfterLoad } from "../hooks/use-after-load";
// The seasonal popup loads once the page has loaded. The chat is mounted site-wide (App.tsx).
const SeasonalOfferV2 = lazy(() => import("../components/home-v2/SeasonalOfferV2"));

// Homepage v2 redesign (design_handoff_mcculloch_homepage).
// The previous homepage is preserved at pages/Index.original.tsx.
const Index = (): JSX.Element => {
  const afterLoad = useAfterLoad();

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: "#FFFEFD" }}>
      <NavigationV2 />
      {afterLoad && (
        <Suspense fallback={null}>
          <SeasonalOfferV2 />
        </Suspense>
      )}
      <main id="main"><MainContentV2 /></main>
      <FooterV2 />
    </div>
  );
};

export default Index;
