
import React, { lazy, Suspense } from "react";
import NavigationV2 from "../components/home-v2/NavigationV2";
import MainContentV2 from "../components/home-v2/MainContentV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useAfterLoad } from "../hooks/use-after-load";
// Chat (and its live connection) and the seasonal popup load once the page has loaded.
const SeasonalOfferV2 = lazy(() => import("../components/home-v2/SeasonalOfferV2"));
const ChatWidget = lazy(() => import("../components/ChatWidgetV2"));
import { useUserAuth } from "../contexts/UserAuthContext";

// Homepage v2 redesign (design_handoff_mcculloch_homepage).
// The previous homepage is preserved at pages/Index.original.tsx.
const Index = (): JSX.Element => {
  const { user: authUser } = useUserAuth();
  const afterLoad = useAfterLoad();
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    name: authUser.fullName || `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim()
  } : null;

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: "#FFFEFD" }}>
      <NavigationV2 />
      {afterLoad && (
        <Suspense fallback={null}>
          <SeasonalOfferV2 />
          <ChatWidget user={user} />
        </Suspense>
      )}
      <main id="main"><MainContentV2 /></main>
      <FooterV2 />
    </div>
  );
};

export default Index;
