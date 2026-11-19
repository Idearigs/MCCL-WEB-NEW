import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useAfterLoad } from "../hooks/use-after-load";

// The live chat on every storefront page, so a conversation follows the visitor around the
// site (its id and visitor token live in localStorage). Not on staff or secure-viewing pages.
// The chat and its live connection load once the page has loaded.
const ChatWidgetV2 = lazy(() => import("./ChatWidgetV2"));

const HIDDEN = /^\/(admin|secure-viewing)(\/|$)/;

const SiteChat = (): JSX.Element | null => {
  const { pathname } = useLocation();
  const { user: authUser } = useUserAuth();
  const afterLoad = useAfterLoad();
  if (!afterLoad || HIDDEN.test(pathname)) return null;
  const user = authUser ? {
    id: authUser.id,
    email: authUser.email,
    name: authUser.fullName || `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim(),
  } : null;
  return (
    <Suspense fallback={null}>
      <ChatWidgetV2 user={user} />
    </Suspense>
  );
};

export default SiteChat;
