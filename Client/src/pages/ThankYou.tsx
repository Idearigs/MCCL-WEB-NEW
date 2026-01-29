import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Package, Truck, ArrowRight } from "lucide-react";
import { FooterSection } from "../components/FooterSection";
import { trackPurchase } from "../services/pixelService";

interface OrderItemData {
  product_name: string;
  product_type?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  attributes?: {
    metal?: string;
    size?: string;
    brand?: string;
    variant_name?: string;
    stoneType?: string;
    carat?: string;
    clarity?: string;
    colour?: string;
    cut?: string;
    [key: string]: any;
  };
}

interface OrderState {
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  customerEmail?: string;
  customerName?: string;
  status?: string;
  items?: OrderItemData[];
}

const ThankYou = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = (location.state as OrderState) || {};
  const [continueShoppingUrl, setContinueShoppingUrl] = React.useState('/rings');

  // Track if Purchase pixel event has been fired (backup tracking)
  const purchaseFired = useRef(false);

  // Facebook Pixel: Track Purchase event (backup in case it wasn't fired in Checkout)
  useEffect(() => {
    if (orderData.orderId && orderData.items && !purchaseFired.current) {
      trackPurchase({
        content_ids: orderData.items.map((item, index) => `item_${index}`),
        content_type: 'product',
        value: orderData.totalAmount || 0,
        currency: 'GBP',
        num_items: orderData.items.reduce((count, item) => count + item.quantity, 0),
        contents: orderData.items.map((item, index) => ({
          id: `item_${index}`,
          quantity: item.quantity,
          item_price: item.unit_price,
        })),
      });

      purchaseFired.current = true;
    }
  }, [orderData]);

  // Redirect to home if no order data after 10 seconds of inactivity
  useEffect(() => {
    // Get the shopping category from localStorage or use default
    const lastCategory = localStorage.getItem('lastShoppingCategory') || 'rings';
    setContinueShoppingUrl(`/${lastCategory}`);

    const timer = setTimeout(() => {
      if (!orderData.orderId) {
        navigate("/");
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [orderData, navigate]);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex flex-col items-start">
              <div className="text-xl font-serif font-light tracking-widest text-gray-900">
                McCulloch
              </div>
              <div className="text-xs font-light tracking-widest text-gray-600">
                Jewellers
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Success Message */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-4 font-cormorant tracking-wide">
              Thank You
            </h1>
            <p className="text-lg text-gray-600 font-cormorant mb-2">
              Your order has been confirmed
            </p>
            <p className="text-sm text-gray-500 font-inter font-light tracking-wide uppercase">
              Your luxury collection is on its way
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Order Number */}
              <div>
                <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-2">
                  Order Number
                </p>
                <p className="text-2xl font-cormorant text-gray-900 font-light">
                  {orderData.orderNumber || "—"}
                </p>
              </div>

              {/* Order Total */}
              <div>
                <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-2">
                  Order Total
                </p>
                <p className="text-2xl font-cormorant text-gray-900 font-light">
                  £{orderData.totalAmount?.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) || "—"}
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-2">
                  Name
                </p>
                <p className="text-lg font-cormorant text-gray-900 font-light">
                  {orderData.customerName || "—"}
                </p>
              </div>

              {/* Customer Email */}
              <div>
                <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-2">
                  Confirmation Email
                </p>
                <p className="text-lg font-cormorant text-gray-900 font-light break-all">
                  {orderData.customerEmail || "—"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200 my-8" />

            {/* Order Items */}
            {orderData.items && orderData.items.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-4">
                  Order Items
                </p>
                <div className="space-y-4">
                  {orderData.items.map((item: OrderItemData, index: number) => {
                    // Format product attributes for display
                    const renderAttributes = () => {
                      const attributes = item.attributes || {};
                      const attrLines = [];

                      // Handle watches
                      if (item.product_type === 'watch') {
                        if (attributes.brand) attrLines.push(`Brand: ${attributes.brand}`);
                        if (attributes.variant_name) attrLines.push(`Variant: ${attributes.variant_name}`);
                      }

                      // Handle jewelry
                      if (item.product_type === 'jewelry' || !item.product_type) {
                        if (attributes.metal) attrLines.push(`Metal: ${attributes.metal}`);
                        if (attributes.size) attrLines.push(`Size: ${attributes.size}`);
                      }

                      // Handle Nivoda stone options
                      if (attributes.stoneType) {
                        attrLines.push(`Stone Type: ${attributes.stoneType}`);
                        if (attributes.carat) attrLines.push(`Carat: ${attributes.carat}`);
                        if (attributes.clarity) attrLines.push(`Clarity: ${attributes.clarity}`);
                        if (attributes.colour) attrLines.push(`Colour: ${attributes.colour}`);
                        if (attributes.cut) attrLines.push(`Cut: ${attributes.cut}`);
                      }

                      return attrLines;
                    };

                    const attributeLines = renderAttributes();

                    return (
                      <div key={index} className="bg-gray-50 border border-gray-100 rounded p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="font-cormorant font-light text-gray-900 text-lg mb-1">
                              {item.product_name}
                            </p>
                            {item.product_type && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2 mr-2">
                                {item.product_type}
                              </span>
                            )}
                            <p className="text-xs text-gray-600 font-inter font-light">
                              Quantity: {item.quantity} × £{item.unit_price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-cormorant font-light text-gray-900">
                              £{item.total_price.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </p>
                          </div>
                        </div>
                        {/* Product Attributes */}
                        {attributeLines.length > 0 && (
                          <div className="mt-3 space-y-1 text-xs text-gray-700 bg-white p-2 rounded border border-gray-100">
                            {attributeLines.map((line: string, idx: number) => (
                              <div key={idx}>{line}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <hr className="border-gray-200 my-8" />

            {/* What's Next */}
            <div>
              <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-4">
                What's Next
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-light">1</span>
                  </div>
                  <div>
                    <p className="font-cormorant text-gray-900 font-light text-lg">
                      Order Confirmation
                    </p>
                    <p className="text-sm text-gray-600 font-inter font-light mt-1">
                      A confirmation email has been sent to {orderData.customerEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-cormorant text-gray-900 font-light text-lg">
                      Shipping Preparation
                    </p>
                    <p className="text-sm text-gray-600 font-inter font-light mt-1">
                      Your items are being carefully prepared for shipment within 1-2 business days
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-cormorant text-gray-900 font-light text-lg">
                      Tracking Updates
                    </p>
                    <p className="text-sm text-gray-600 font-inter font-light mt-1">
                      You'll receive a tracking number via email as soon as your package ships
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mb-12">
            <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-6">
              Your Purchase is Protected
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mb-3">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-cormorant text-gray-900 font-light">
                  Secure Payment
                </p>
                <p className="text-xs text-gray-500 font-inter font-light mt-1">
                  All transactions encrypted
                </p>
              </div>

              <div className="text-center">
                <div className="mb-3">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-cormorant text-gray-900 font-light">
                  30-Day Returns
                </p>
                <p className="text-xs text-gray-500 font-inter font-light mt-1">
                  Full refund policy
                </p>
              </div>

              <div className="text-center">
                <div className="mb-3">
                  <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948-.684l1.498-4.493a1 1 0 011.502-.684l1.498 4.493a1 1 0 00.948.684H19a2 2 0 012 2v2H3V5z" />
                  </svg>
                </div>
                <p className="text-sm font-cormorant text-gray-900 font-light">
                  Expert Support
                </p>
                <p className="text-xs text-gray-500 font-inter font-light mt-1">
                  24/7 customer service
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={continueShoppingUrl}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-inter font-light uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-gray-900 font-inter font-light uppercase tracking-wider text-sm hover:border-gray-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <p className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase mb-8">
              Frequently Asked Questions
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-cormorant text-gray-900 font-light mb-2">
                  When will my order arrive?
                </h3>
                <p className="text-sm text-gray-600 font-inter font-light">
                  Orders typically ship within 1-2 business days. International delivery times vary by destination, usually 3-7 business days.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-cormorant text-gray-900 font-light mb-2">
                  Can I modify or cancel my order?
                </h3>
                <p className="text-sm text-gray-600 font-inter font-light">
                  Please contact our customer service team immediately at support@mcculloch.co.uk to request modifications or cancellations.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-cormorant text-gray-900 font-light mb-2">
                  What is your return policy?
                </h3>
                <p className="text-sm text-gray-600 font-inter font-light">
                  We offer a 30-day return policy for unopened items in original condition. For details, visit our returns page.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-cormorant text-gray-900 font-light mb-2">
                  How can I track my order?
                </h3>
                <p className="text-sm text-gray-600 font-inter font-light">
                  A tracking number will be provided via email once your item ships. You can use this to monitor delivery progress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default ThankYou;
