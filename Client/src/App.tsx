
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./contexts/CartContext";
import { UserAuthProvider } from "./contexts/UserAuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import Index from "./pages/Index";
import Collections from "./pages/Collections";
import Jewellery from "./pages/Jewellery";
import NotFound from "./pages/NotFound";
import Diamonds from "./pages/Diamonds";
import Watches from "./pages/Watches";
import Heritage from "./pages/Heritage";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Roamer from "./pages/Roamer";
import Briston from "./pages/Briston";
import Festina from "./pages/Festina";
import Rings from "./pages/Rings";
import EngagementRings from "./pages/EngagementRings";
import WeddingRings from "./pages/WeddingRings";
import Earrings from "./pages/Earrings";
import Necklaces from "./pages/Necklaces";
import Bracelets from "./pages/Bracelets";
import FestinaWatches from "./pages/FestinaWatches";
import BristonWatches from "./pages/BristonWatches";
import RoamerWatches from "./pages/RoamerWatches";
import FestinaClassicCollection from "./pages/FestinaClassicCollection";
import BristonHeritageCollection from "./pages/BristonHeritageCollection";
import RoamerSwissTradition from "./pages/RoamerSwissTradition";
import Contact from "./pages/Contact";
import OurStory from "./pages/OurStory";
import CustomerService from "./pages/CustomerService";
import VisitUs from "./pages/VisitUs";
import TrustGuarantees from "./pages/TrustGuarantees";
import Favorites from "./pages/Favorites";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import VerifyEmail from "./pages/VerifyEmail";
import AuthCallback from "./pages/AuthCallback";
import AdminApp from "./admin/AdminApp";

const queryClient = new QueryClient();

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
              <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/jewellery" element={<Jewellery />} />
            <Route path="/diamonds" element={<Diamonds />} />
            <Route path="/watches" element={<Watches />} />
            <Route path="/heritage" element={<Heritage />} />
            <Route path="/roamer" element={<Roamer />} />
            <Route path="/briston" element={<Briston />} />
            <Route path="/festina" element={<Festina />} />
            <Route path="/rings" element={<Rings />} />
            <Route path="/engagement-rings" element={<EngagementRings />} />
            <Route path="/wedding-rings" element={<WeddingRings />} />
            <Route path="/earrings" element={<Earrings />} />
            <Route path="/necklaces" element={<Necklaces />} />
            <Route path="/bracelets" element={<Bracelets />} />
            <Route path="/festina-watches" element={<FestinaWatches />} />
            <Route path="/briston-watches" element={<BristonWatches />} />
            <Route path="/roamer-watches" element={<RoamerWatches />} />
            <Route path="/collections/festina-classic-collection" element={<FestinaClassicCollection />} />
            <Route path="/collections/briston-heritage-collection" element={<BristonHeritageCollection />} />
            <Route path="/collections/roamer-swiss-tradition" element={<RoamerSwissTradition />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/customer-service" element={<CustomerService />} />
            <Route path="/visit-us" element={<VisitUs />} />
            <Route path="/trust-guarantees" element={<TrustGuarantees />} />

            {/* Category-based product URLs */}
            <Route path="/engagement-rings/:productId" element={<ProductDetail />} />
            <Route path="/wedding-rings/:productId" element={<ProductDetail />} />
            <Route path="/rings/:productId" element={<ProductDetail />} />
            <Route path="/earrings/:productId" element={<ProductDetail />} />
            <Route path="/necklaces/:productId" element={<ProductDetail />} />
            <Route path="/bracelets/:productId" element={<ProductDetail />} />
            <Route path="/jewellery/:productId" element={<ProductDetail />} />
            <Route path="/watches/:productId" element={<ProductDetail />} />
            <Route path="/diamonds/:productId" element={<ProductDetail />} />

            {/* Legacy product URL - redirect to category-based */}
            <Route path="/product/:productId" element={<ProductDetail />} />

            {/* User Account Routes */}
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/account" element={<Account />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminApp />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </UserAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
