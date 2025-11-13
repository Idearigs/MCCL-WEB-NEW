import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Package, Truck, ArrowRight } from "lucide-react";
import { FooterSection } from "../components/FooterSection";

interface OrderState {
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  customerEmail?: string;
  customerName?: string;
  status?: string;
}

const ThankYou = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = (location.state as OrderState) || {};

  // Redirect to home if no order data after 10 seconds of inactivity
  useEffect(() => {
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
              to="/products"
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
