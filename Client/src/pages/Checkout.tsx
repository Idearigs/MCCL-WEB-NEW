import React, { useState, useEffect } from "react";
import { ChevronDown, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../contexts/CartContext";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useNavigate } from "react-router-dom";
import CheckoutAuthModal from "../components/CheckoutAuthModal";

// Initialize Stripe promise at module level
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// Helper function to parse price from string or number
const getPriceAsNumber = (price: string | number): number => {
  if (typeof price === 'number') {
    return price;
  }
  return parseFloat(price.replace('£', '').replace(',', ''));
};

// Payment Form Component - uses Stripe hooks
const PaymentForm = ({
  email,
  firstName,
  lastName,
  address,
  apartment,
  city,
  postalCode,
  country,
  phone,
  total,
  cartItems,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  cardElementOptions,
}: any) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError("Stripe is not initialized. Please refresh the page.");
      return;
    }

    // Validation - Clear previous errors
    const errors: string[] = [];

    // Check required fields
    if (!email || email.trim() === "") {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Please enter a valid email address");
    }

    if (!firstName || firstName.trim() === "") {
      errors.push("First name is required");
    }

    if (!lastName || lastName.trim() === "") {
      errors.push("Last name is required");
    }

    if (!address || address.trim() === "") {
      errors.push("Street address is required");
    }

    if (!city || city.trim() === "") {
      errors.push("City is required");
    }

    if (!postalCode || postalCode.trim() === "") {
      errors.push("Postal code is required");
    } else if (postalCode.trim().length < 3) {
      errors.push("Postal code must be at least 3 characters");
    }

    if (!phone || phone.trim() === "") {
      errors.push("Phone number is required");
    } else if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      errors.push("Please enter a valid phone number");
    }

    if (!country || country.trim() === "" || country === "Country/Region") {
      errors.push("Country is required");
    }

    if (cartItems.length === 0) {
      errors.push("Your cart is empty. Please add items before checkout.");
    }

    // Show all errors
    if (errors.length > 0) {
      onError(errors.join("\n"));
      return;
    }

    setIsProcessing(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

      // Step 1: Create payment intent with all cart items
      const intentResponse = await fetch(`${API_URL}/payments/create-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "gbp",
          description: `McCulloch Jewelry Purchase - ${cartItems.length} items`,
          cartItems: cartItems.map((item: any) => ({
            product_id: item.id.toString(),
            name: item.name,
            quantity: item.quantity,
            price: getPriceAsNumber(item.price),
            type: item.type || null
          }))
        })
      });

      if (!intentResponse.ok) {
        const error = await intentResponse.json();
        throw new Error(error.message || "Failed to create payment intent");
      }

      const intentData = await intentResponse.json();
      const { paymentIntentId, clientSecret } = intentData.data;

      // Step 2: Confirm payment with Stripe using CardElement
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: `${firstName} ${lastName}`,
              email: email,
              address: {
                line1: address,
                line2: apartment || undefined,
                city: city,
                postal_code: postalCode,
                country: country === "United Kingdom" ? "GB" : "US"
              }
            }
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || "Card payment failed");
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error(`Payment status: ${paymentIntent?.status}`);
      }

      // Step 3: Confirm order in backend
      const confirmResponse = await fetch(`${API_URL}/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`,
          shippingAddress: {
            street: address,
            apartment: apartment || undefined,
            city,
            postalCode,
            country,
            phone
          },
          cartItems: cartItems.map((item: any) => ({
            product_id: item.id.toString(),
            name: item.name,
            quantity: item.quantity,
            price: getPriceAsNumber(item.price),
            variant_id: item.variant_id || null,
            type: item.type || null,
            selectedOptions: item.selectedOptions || null,
            metal: item.metal || null,
            size: item.size || null,
            brand: item.brand || null,
            variant_name: item.variant_name || null
          }))
        })
      });

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json();
        throw new Error(error.message || "Failed to confirm payment");
      }

      const confirmData = await confirmResponse.json();
      onSuccess(confirmData.data);
    } catch (error: any) {
      console.error("Payment error:", error);
      onError(error.message || "Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Card Element */}
      <div className="relative">
        <CardElement options={cardElementOptions} />
      </div>

      {/* Use Shipping Address as Billing Address */}
      <label className="flex items-start space-x-3 mt-4">
        <input
          type="checkbox"
          className="mt-1 w-4 h-4 border border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-gray-500"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          Use shipping address as billing address
        </span>
      </label>

      {/* Pay Now Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || !stripe || !elements || cartItems.length === 0}
        className="w-full bg-black text-white py-3 px-6 rounded font-medium text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors mt-6 flex items-center justify-center space-x-2"
      >
        {isProcessing && <Loader className="w-4 h-4 animate-spin" />}
        <span>{isProcessing ? "Processing..." : "Pay Now"}</span>
      </button>
    </>
  );
};

// Main Checkout Component
const Checkout = (): JSX.Element => {
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, isLoading } = useUserAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [keepUpdated, setKeepUpdated] = useState(true);
  const [country, setCountry] = useState("United Kingdom");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState("express");
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [contactNumber, setContactNumber] = useState("");

  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [orderData, setOrderData] = useState<any>(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalShown, setAuthModalShown] = useState(false);

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0 && !successMessage) {
      navigate("/cart");
    }
  }, [cartItems.length, successMessage, navigate]);

  // Show auth modal if user is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !authModalShown && cartItems.length > 0) {
      setShowAuthModal(true);
      setAuthModalShown(true);
    }
  }, [isLoading, isAuthenticated, authModalShown, cartItems.length]);

  // Calculate totals from cart
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = getPriceAsNumber(item.price);
      return total + (price * item.quantity);
    }, 0);
  };

  const subtotal = getSubtotal();
  const shipping = subtotal > 1000 ? 0 : 50;
  const duties = 0.00;
  const taxes = subtotal > 0 ? subtotal * 0.20 : 0; // 20% VAT
  const total = subtotal + shipping + duties + taxes;

  const handleSuccess = (data: any) => {
    setOrderData(data);
    setSuccessMessage(`Order confirmed! Order Number: ${data.orderNumber}`);

    // Prepare order items data with attributes for ThankYou page
    const orderItems = cartItems.map((item: any) => ({
      product_name: item.name,
      product_type: item.type || null,
      quantity: item.quantity,
      unit_price: getPriceAsNumber(item.price),
      total_price: getPriceAsNumber(item.price) * item.quantity,
      attributes: item.selectedOptions || {
        metal: item.metal,
        size: item.size,
        brand: item.brand,
        variant_name: item.variant_name
      }
    }));

    clearCart(); // Clear cart after successful payment

    // Redirect to thank you page after 2 seconds
    setTimeout(() => {
      navigate("/thank-you", {
        state: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          customerEmail: email,
          customerName: `${firstName} ${lastName}`,
          status: data.status,
          items: orderItems
        }
      });
    }, 2000);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "14px",
        color: "#32325d",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "::placeholder": {
          color: "#aab7c4",
          fontWeight: "300"
        }
      },
      invalid: {
        color: "#fa755a"
      }
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"}}>
      {/* Auth Modal - Show if user is not authenticated */}
      <CheckoutAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthComplete={() => setShowAuthModal(false)}
      />

      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div>
                <div className="text-sm font-light text-gray-900 tracking-wide uppercase">
                  McCulloch Jewellers
                </div>
                <div className="text-xs text-gray-500 tracking-wide uppercase">
                  London
                </div>
              </div>
            </div>

            {/* Cart Icon with item count */}
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span className="text-sm font-light text-gray-600">{cartItems.length} items</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Full Height Divider */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 transform -translate-x-1/2"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Checkout Form */}
          <div className="space-y-8 lg:pr-12">

            {/* Contact Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900">Contact</h3>
                <button className="text-xs text-blue-600 hover:text-blue-700 underline">
                  Log in
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                />

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={keepUpdated}
                    onChange={(e) => setKeepUpdated(e.target.checked)}
                    className="mt-1 w-4 h-4 border border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 leading-relaxed">
                    Keep me up to date on latest news and collection launches
                  </span>
                </label>
              </div>
            </div>

            {/* Delivery Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Delivery</h3>

              <div className="space-y-4">
                {/* Country Selection */}
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
                  >
                    <option value="">Country/Region</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                  />
                </div>

                {/* Address Fields */}
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                />

                <input
                  type="text"
                  placeholder="Apartment, suite, etc."
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                />

                {/* City and Postal Code */}
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                  />
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                  />
                </div>

                {/* Phone */}
                <input
                  type="tel"
                  placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder:font-light"
                />
              </div>
            </div>

            {/* Shipping Method Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-4">Shipping method</h3>

              <div className="space-y-3">
                {/* Express International */}
                <label className="flex items-center p-4 border border-gray-300 rounded cursor-pointer hover:border-gray-400">
                  <input
                    type="radio"
                    name="shipping"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-900">Express International (£{shipping})</span>
                </label>

                {/* McCulloch Luxury Bag */}
                <label className="flex items-center p-4 border border-gray-300 rounded cursor-pointer hover:border-gray-400">
                  <input
                    type="radio"
                    name="shipping"
                    value="luxury-bag"
                    checked={shippingMethod === 'luxury-bag'}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm text-gray-900">White Glove Delivery (£50)</span>
                </label>
              </div>
            </div>

            {/* Payment Section */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Payment</h3>
              <p className="text-sm text-gray-500 mb-6">All transactions are secure and encrypted.</p>

              <div className="space-y-4">
                {/* Credit Card Section */}
                <div className="border border-gray-300 rounded overflow-hidden">
                  {/* Credit Card Header */}
                  <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">Credit or Debit Card</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                      <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full -ml-1"></div>
                      </div>
                      <div className="w-8 h-5 bg-blue-700 rounded text-white text-xs flex items-center justify-center font-bold">AMEX</div>
                    </div>
                  </div>

                  {/* Credit Card Fields - Stripe Elements */}
                  <div className="p-4 bg-gray-50 space-y-4">
                    <Elements stripe={stripePromise}>
                      <PaymentForm
                        email={email}
                        firstName={firstName}
                        lastName={lastName}
                        address={address}
                        apartment={apartment}
                        city={city}
                        postalCode={postalCode}
                        country={country}
                        phone={phone}
                        total={total}
                        cartItems={cartItems}
                        onSuccess={handleSuccess}
                        onError={handleError}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        cardElementOptions={cardElementOptions}
                      />
                    </Elements>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded mt-6">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700 whitespace-pre-line">
                      {errorMessage}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded mt-6">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-green-700 block">{successMessage}</span>
                      {orderData && (
                        <div className="text-xs text-green-600 mt-2 space-y-1">
                          <p>Order ID: {orderData.orderId}</p>
                          <p>Total: £{orderData.totalAmount}</p>
                          <p>Status: {orderData.status}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6 lg:pl-12 lg:sticky lg:top-8 lg:h-fit">
            {/* Order Items Summary */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.metal}-${item.size}`} className="flex items-start space-x-4">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded border border-gray-200"
                    />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-normal text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {item.type === 'watch' ? (
                        <>
                          {item.brand && <span>{item.brand}</span>}
                          {item.variant_name && <span> • {item.variant_name}</span>}
                        </>
                      ) : (
                        <>
                          {item.metal && <span>{item.metal}</span>}
                          {item.size && <span> • {item.size}</span>}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-sm font-normal text-gray-900">
                    £{(getPriceAsNumber(item.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-gray-700">Subtotal</span>
                <span className="text-sm font-normal text-gray-900">£{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-normal text-gray-700">Shipping</span>
                </div>
                <span className="text-sm font-normal text-gray-900">£{shipping.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-gray-700">VAT (20%)</span>
                <span className="text-sm font-normal text-gray-900">£{taxes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <hr className="border-gray-200 my-4" />

              <div className="flex justify-between items-center">
                <span className="text-base font-normal text-gray-900">Total</span>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1 font-normal">GBP</div>
                  <div className="text-lg font-semibold text-gray-900">
                    £{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="mb-2">
                    <strong>Please note</strong> all items are being shipped from the UK. VAT and duties applicable to your country have been included.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
