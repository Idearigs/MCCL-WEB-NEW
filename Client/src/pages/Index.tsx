
import React from "react";
import NavigationV2 from "../components/home-v2/NavigationV2";
import MainContentV2 from "../components/home-v2/MainContentV2";
import FooterV2 from "../components/home-v2/FooterV2";
import SeasonalOfferV2 from "../components/home-v2/SeasonalOfferV2";
import ChatWidget from "../components/ChatWidgetV2";
import { useUserAuth } from "../contexts/UserAuthContext";

// Homepage v2 redesign (design_handoff_mcculloch_homepage).
// The previous homepage is preserved at pages/Index.original.tsx.
const Index = (): JSX.Element => {
  const { user: authUser } = useUserAuth();
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    name: authUser.fullName || `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim()
  } : null;

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ background: "#F8F6F0" }}>
      <NavigationV2 />
      <SeasonalOfferV2 />
      <ChatWidget user={user} />
      <MainContentV2 />
      <FooterV2 />
    </div>
  );
};

export default Index;
