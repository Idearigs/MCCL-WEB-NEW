import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./contexts/CartContext";
import { UserAuthProvider } from "./contexts/UserAuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { usePixelPageView } from "./hooks/usePixelPageView";

// ── Eagerly loaded (tiny files or needed immediately) ──────────────────────
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/MaintenancePage";

// ── Lazily loaded pages (split into separate chunks) ──────────────────────
const Collections       = lazy(() => import("./pages/Collections"));
const Jewellery         = lazy(() => import("./pages/JewelleryAllV2"));
const Diamonds          = lazy(() => import("./pages/Diamonds"));
const Watches           = lazy(() => import("./pages/WatchesV2"));
const Heritage          = lazy(() => import("./pages/Heritage"));
const Products          = lazy(() => import("./pages/Products"));
const Cart              = lazy(() => import("./pages/CartV2"));
const Checkout          = lazy(() => import("./pages/CheckoutV2"));
const ThankYou          = lazy(() => import("./pages/ThankYouV2"));

// Watch brands
const Roamer            = lazy(() => import("./pages/WatchBrandV2"));
const Briston           = lazy(() => import("./pages/WatchBrandV2"));
const Festina           = lazy(() => import("./pages/WatchBrandV2"));
const FestinaWatches    = lazy(() => import("./pages/FestinaWatches"));
const BristonWatches    = lazy(() => import("./pages/BristonWatches"));
const RoamerWatches     = lazy(() => import("./pages/RoamerWatches"));
const FestinaClassicCollection  = lazy(() => import("./pages/FestinaClassicCollection"));
const BristonHeritageCollection = lazy(() => import("./pages/BristonHeritageCollection"));
const RoamerSwissTradition      = lazy(() => import("./pages/RoamerSwissTradition"));
const WatchCollection   = lazy(() => import("./pages/CollectionV2"));

// Jewellery categories
const Rings             = lazy(() => import("./pages/RingsV2"));
const EngagementRings   = lazy(() => import("./pages/EngagementRingsV2"));
// Wedding rings — 12th handoff configurator (listing + PDP). Real-data versions
// preserved at WeddingRingsV2 / WeddingRingDetail; repoint here to revert.
const WeddingRings      = lazy(() => import("./pages/WeddingListingV2"));
const JewelleryListing  = lazy(() => import("./pages/JewelleryListingV2"));

// Product detail pages (heaviest pages — always lazy)
const ProductDetail     = lazy(() => import("./pages/ProductDetail"));
const ProductDetailV2    = lazy(() => import("./pages/ProductDetailV2"));
const WatchDetail       = lazy(() => import("./pages/WatchDetailV2"));
const WeddingRingDetail = lazy(() => import("./pages/WeddingConfiguratorV2"));

// Info / account pages
const Contact           = lazy(() => import("./pages/ContactV2"));
const OurStory          = lazy(() => import("./pages/OurStoryV2"));
const BespokeDesign     = lazy(() => import("./pages/BespokeDesignV2"));
const Portfolio         = lazy(() => import("./pages/Portfolio"));
const CustomerService   = lazy(() => import("./pages/CustomerService"));
const VisitUs           = lazy(() => import("./pages/VisitUs"));
const TrustGuarantees   = lazy(() => import("./pages/TrustGuarantees"));
const InfoPage          = lazy(() => import("./pages/InfoPageV2"));
const Favorites         = lazy(() => import("./pages/Favorites"));
const Account           = lazy(() => import("./pages/AccountV2"));
const Orders            = lazy(() => import("./pages/Orders"));
const OrderDetail       = lazy(() => import("./pages/OrderDetail"));
const VerifyEmail       = lazy(() => import("./pages/VerifyEmail"));
const AuthCallback      = lazy(() => import("./pages/AuthCallback"));

// Admin (largest chunk — always lazy)
const AdminApp          = lazy(() => import("./admin/AdminApp"));

// Test/tool pages — served only within /admin/* (protected by admin auth)

// ── Loading fallback ───────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ width: 32, height: 32, border: '2px solid #e5e7eb', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // cache API responses for 5 minutes
      gcTime: 1000 * 60 * 10,     // keep unused data for 10 minutes
    },
  },
});

const PixelPageViewTracker = () => {
  usePixelPageView();
  return null;
};

const MAINTENANCE_MODE = true;
const PREVIEW_TOKEN = 'mcc2026';

const AppRoutes = () => {
  // Persist preview access via localStorage so client can navigate freely
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === PREVIEW_TOKEN) {
      localStorage.setItem('preview_bypass', 'true');
    }
  }
  const hasPreviewAccess = typeof window !== 'undefined' && localStorage.getItem('preview_bypass') === 'true';

  if (MAINTENANCE_MODE && !hasPreviewAccess) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<MaintenancePage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Home — eager */}
      <Route path="/" element={<Index />} />

      {/* Shop */}
      <Route path="/collections" element={<Collections />} />
      <Route path="/products" element={<Products />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/thank-you" element={<ThankYou />} />

      {/* Jewellery */}
      <Route path="/jewellery" element={<Jewellery />} />
      <Route path="/diamonds" element={<Diamonds />} />
      <Route path="/rings" element={<Rings />} />
      <Route path="/engagement-rings" element={<EngagementRings />} />
      <Route path="/wedding-rings" element={<WeddingRings />} />
      <Route path="/wedding" element={<WeddingRings />} />
      <Route path="/earrings" element={<JewelleryListing category="earrings" />} />
      <Route path="/necklaces" element={<JewelleryListing category="necklaces" />} />
      <Route path="/bracelets" element={<JewelleryListing category="bracelets" />} />

      {/* Watches */}
      <Route path="/watches" element={<Watches />} />
      <Route path="/roamer" element={<Roamer />} />
      <Route path="/briston" element={<Briston />} />
      <Route path="/festina" element={<Festina />} />
      <Route path="/festina-watches" element={<FestinaWatches />} />
      <Route path="/briston-watches" element={<BristonWatches />} />
      <Route path="/roamer-watches" element={<RoamerWatches />} />
      <Route path="/collections/festina-classic-collection" element={<FestinaClassicCollection />} />
      <Route path="/collections/briston-heritage-collection" element={<BristonHeritageCollection />} />
      <Route path="/collections/roamer-swiss-tradition" element={<RoamerSwissTradition />} />
      <Route path="/collections/:collectionSlug" element={<WatchCollection />} />

      {/* Product detail pages */}
      <Route path="/engagement-rings/:productId" element={<ProductDetailV2 />} />
      <Route path="/wedding-rings/:productId" element={<WeddingRingDetail />} />
      <Route path="/wedding/:productId" element={<WeddingRingDetail />} />
      <Route path="/rings/:productId" element={<ProductDetailV2 />} />
      <Route path="/earrings/:productId" element={<ProductDetailV2 />} />
      <Route path="/necklaces/:productId" element={<ProductDetailV2 />} />
      <Route path="/bracelets/:productId" element={<ProductDetailV2 />} />
      <Route path="/jewellery/:productId" element={<ProductDetailV2 />} />
      <Route path="/watches/:productId" element={<WatchDetail />} />
      <Route path="/diamonds/:productId" element={<ProductDetail />} />
      <Route path="/product/:productId" element={<ProductDetail />} />

      {/* Info */}
      <Route path="/heritage" element={<Heritage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/our-story" element={<OurStory />} />
      <Route path="/bespoke-design" element={<BespokeDesign />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/customer-service" element={<CustomerService />} />
      <Route path="/visit-us" element={<VisitUs />} />
      <Route path="/trust-guarantees" element={<TrustGuarantees />} />

      {/* Informational, legal & guide pages — content from Website Essentials (InfoPageV2) */}
      <Route path="/privacy" element={<InfoPage slug="privacy" />} />
      <Route path="/terms" element={<InfoPage slug="terms" />} />
      <Route path="/cookies" element={<InfoPage slug="cookies" />} />
      <Route path="/delivery" element={<InfoPage slug="delivery" />} />
      <Route path="/returns" element={<InfoPage slug="returns" />} />
      <Route path="/warranty" element={<InfoPage slug="warranty" />} />
      <Route path="/repairs" element={<InfoPage slug="repairs" />} />
      <Route path="/book-appointment" element={<InfoPage slug="book-appointment" />} />
      <Route path="/sustainability" element={<InfoPage slug="sustainability" />} />
      <Route path="/certificate-of-authenticity" element={<InfoPage slug="certificate-of-authenticity" />} />
      <Route path="/certificates" element={<InfoPage slug="certificate-of-authenticity" />} />
      <Route path="/faqs" element={<InfoPage slug="faqs" />} />
      <Route path="/ring-size-guide" element={<InfoPage slug="ring-size-guide" />} />
      <Route path="/size-guide" element={<InfoPage slug="ring-size-guide" />} />
      <Route path="/diamond-guide" element={<InfoPage slug="diamond-guide" />} />
      <Route path="/gemstone-guide" element={<InfoPage slug="gemstone-guide" />} />
      <Route path="/birthstone-guide" element={<InfoPage slug="birthstone-guide" />} />
      <Route path="/hallmark-guide" element={<InfoPage slug="hallmark-guide" />} />
      <Route path="/jewellery-care" element={<InfoPage slug="jewellery-care" />} />
      <Route path="/care" element={<InfoPage slug="jewellery-care" />} />

      {/* Account */}
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/account" element={<Account />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Admin */}
      <Route path="/admin/*" element={<AdminApp />} />

      {/* Testing */}
      {/* Test pages moved to /admin/tools/nivoda and /admin/tools/ring-pricing */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserAuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <PixelPageViewTracker />
              <Suspense fallback={<PageLoader />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </UserAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
