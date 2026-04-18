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

// ── Lazily loaded pages (split into separate chunks) ──────────────────────
const Collections       = lazy(() => import("./pages/Collections"));
const Jewellery         = lazy(() => import("./pages/Jewellery"));
const Diamonds          = lazy(() => import("./pages/Diamonds"));
const Watches           = lazy(() => import("./pages/Watches"));
const Heritage          = lazy(() => import("./pages/Heritage"));
const Products          = lazy(() => import("./pages/Products"));
const Cart              = lazy(() => import("./pages/Cart"));
const Checkout          = lazy(() => import("./pages/Checkout"));
const ThankYou          = lazy(() => import("./pages/ThankYou"));

// Watch brands
const Roamer            = lazy(() => import("./pages/Roamer"));
const Briston           = lazy(() => import("./pages/Briston"));
const Festina           = lazy(() => import("./pages/Festina"));
const FestinaWatches    = lazy(() => import("./pages/FestinaWatches"));
const BristonWatches    = lazy(() => import("./pages/BristonWatches"));
const RoamerWatches     = lazy(() => import("./pages/RoamerWatches"));
const FestinaClassicCollection  = lazy(() => import("./pages/FestinaClassicCollection"));
const BristonHeritageCollection = lazy(() => import("./pages/BristonHeritageCollection"));
const RoamerSwissTradition      = lazy(() => import("./pages/RoamerSwissTradition"));
const WatchCollection   = lazy(() => import("./pages/WatchCollection"));

// Jewellery categories
const Rings             = lazy(() => import("./pages/Rings"));
const EngagementRings   = lazy(() => import("./pages/EngagementRings"));
const WeddingRings      = lazy(() => import("./pages/WeddingRings"));
const Earrings          = lazy(() => import("./pages/Earrings"));
const Necklaces         = lazy(() => import("./pages/Necklaces"));
const Bracelets         = lazy(() => import("./pages/Bracelets"));

// Product detail pages (heaviest pages — always lazy)
const ProductDetail     = lazy(() => import("./pages/ProductDetail"));
const WatchDetail       = lazy(() => import("./pages/WatchDetail"));
const WeddingRingDetail = lazy(() => import("./pages/WeddingRingDetail"));

// Info / account pages
const Contact           = lazy(() => import("./pages/Contact"));
const OurStory          = lazy(() => import("./pages/OurStory"));
const BespokeDesign     = lazy(() => import("./pages/BespokeDesign"));
const Portfolio         = lazy(() => import("./pages/Portfolio"));
const CustomerService   = lazy(() => import("./pages/CustomerService"));
const VisitUs           = lazy(() => import("./pages/VisitUs"));
const TrustGuarantees   = lazy(() => import("./pages/TrustGuarantees"));
const Favorites         = lazy(() => import("./pages/Favorites"));
const Account           = lazy(() => import("./pages/Account"));
const Orders            = lazy(() => import("./pages/Orders"));
const OrderDetail       = lazy(() => import("./pages/OrderDetail"));
const VerifyEmail       = lazy(() => import("./pages/VerifyEmail"));
const AuthCallback      = lazy(() => import("./pages/AuthCallback"));

// Admin (largest chunk — always lazy)
const AdminApp          = lazy(() => import("./admin/AdminApp"));

// Dev-only test pages — not included in production bundle
const NivodaTestingPage = import.meta.env.DEV ? lazy(() => import("./pages/NivodaTestingPage")) : null;
const RingPricingTestPage = import.meta.env.DEV ? lazy(() => import("./pages/RingPricingTestPage")) : null;

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserAuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <PixelPageViewTracker />
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/earrings" element={<Earrings />} />
                  <Route path="/necklaces" element={<Necklaces />} />
                  <Route path="/bracelets" element={<Bracelets />} />

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
                  <Route path="/engagement-rings/:productId" element={<ProductDetail />} />
                  <Route path="/wedding-rings/:productId" element={<WeddingRingDetail />} />
                  <Route path="/wedding/:productId" element={<WeddingRingDetail />} />
                  <Route path="/rings/:productId" element={<ProductDetail />} />
                  <Route path="/earrings/:productId" element={<ProductDetail />} />
                  <Route path="/necklaces/:productId" element={<ProductDetail />} />
                  <Route path="/bracelets/:productId" element={<ProductDetail />} />
                  <Route path="/jewellery/:productId" element={<ProductDetail />} />
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
                  {import.meta.env.DEV && NivodaTestingPage && <Route path="/test/nivoda" element={<NivodaTestingPage />} />}
                  {import.meta.env.DEV && RingPricingTestPage && <Route path="/test/ring-pricing" element={<RingPricingTestPage />} />}

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </UserAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
