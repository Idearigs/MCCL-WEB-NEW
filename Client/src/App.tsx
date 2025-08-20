
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./contexts/CartContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
