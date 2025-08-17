import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const Checkout = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [keepUpdated, setKeepUpdated] = useState(true);
  const [country, setCountry] = useState("Sri Lanka");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState("express");
  const [paymentMethod] = useState("credit-card");
  const [cardType, setCardType] = useState("visa");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [contactNumber, setContactNumber] = useState("");

  const cartItem = {
    id: 1,
    name: "Roulette Classic White Gold Diamond Earrings",
    price: 6500.00,
    quantity: 2,
    image: "/images/12045CFRDOP_450x.webp"
  };

  const subtotal = cartItem.price * cartItem.quantity;
  const shipping = 0; // FREE
  const duties = 0.00;
  const taxes = 1170.00;
  const total = subtotal + shipping + duties + taxes;

  return (
    <div className="min-h-screen bg-white" style={{fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"}}>
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/images/logo.png" 
                alt="McCulloch Jewellers" 
                className="h-8 w-auto object-contain"
              />
              <div>
                <div className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  McCulloch Jewellers
                </div>
                <div className="text-xs text-gray-500 tracking-wide uppercase">
                  London
                </div>
              </div>
            </div>
            
            {/* Cart Icon */}
            <div>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
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
            
            {/* Express Checkout */}
            <div className="text-center">
              <h2 className="text-base font-medium text-gray-800 mb-6">Express Checkout</h2>
              <div className="flex items-center justify-center space-x-4 mb-6">
                {/* Shop Pay */}
                <button className="flex items-center justify-center bg-[#5A31F4] text-white px-5 py-2.5 rounded hover:bg-[#4B28D1] transition-colors text-sm">
                  <span className="font-semibold">Shop</span>
                  <span className="font-light ml-1">Pay</span>
                </button>
                
                {/* PayPal */}
                <button className="flex items-center justify-center bg-[#FFC439] text-[#003087] px-5 py-2.5 rounded hover:bg-[#FFB800] transition-colors">
                  <span className="font-bold text-base">Pay</span>
                  <span className="font-bold text-base text-[#009CDE]">Pal</span>
                </button>
                
                {/* Google Pay */}
                <button className="flex items-center justify-center bg-black text-white px-5 py-2.5 rounded hover:bg-gray-800 transition-colors text-sm">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">Pay</span>
                </button>
              </div>
              
              <div className="text-gray-400 text-xs mb-8">OR</div>
            </div>

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
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
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
                  <span className="ml-3 text-sm text-gray-900">Express International</span>
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
                  <span className="ml-3 text-sm text-gray-900">McCulloch Luxury bag</span>
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
                      <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">JCB</div>
                      <span className="text-xs text-gray-500 font-medium">+2</span>
                    </div>
                  </div>
                  
                  {/* Credit Card Fields */}
                  <div className="p-4 bg-gray-50 space-y-4">
                    {/* Card Number */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Card number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white placeholder:font-light"
                      />
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="16" rx="2"/>
                        <path d="M7 8h10"/>
                      </svg>
                    </div>

                    {/* Exp Date and Security Code */}
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Expiration date (MM / YY)"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        className="px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white placeholder:font-light"
                      />
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Security code"
                          value={securityCode}
                          onChange={(e) => setSecurityCode(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white placeholder:font-light"
                        />
                        <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                          <path d="M12 17h.01"/>
                        </svg>
                      </div>
                    </div>

                    {/* Name on Card */}
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white placeholder:font-light"
                    />

                    {/* Use Shipping Address as Billing Address */}
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className="mt-1 w-4 h-4 border border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        Use shipping address as billing address
                      </span>
                    </label>
                  </div>
                </div>

                {/* More Payment Options */}
                <button className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <span>More Payment Options</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                </button>

                {/* Remember Me Section */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Remember me</h4>
                  
                  <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-4">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="mt-1 w-4 h-4 border border-gray-300 rounded bg-white checked:bg-black checked:border-black focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700 leading-relaxed">
                        Save my information for a faster checkout with a Shop account
                      </span>
                    </label>

                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white placeholder:font-light"
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <div className="relative">
                        <select className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white appearance-none">
                          <option value="+94">🇱🇰 +94</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="tel"
                          placeholder="Mobile phone number"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm bg-white placeholder:font-light"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pay Now Button */}
                <button className="w-full bg-black text-white py-3 px-6 rounded font-medium text-sm hover:bg-gray-800 transition-colors mt-6">
                  Pay Now
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6 lg:pl-12 lg:sticky lg:top-8 lg:h-fit">
            {/* Product Summary */}
            <div className="flex items-start space-x-4">
              <div className="relative">
                <img 
                  src={cartItem.image} 
                  alt={cartItem.name}
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
                <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItem.quantity}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-normal text-gray-900 mb-1">
                  {cartItem.name}
                </h3>
              </div>
              <div className="text-sm font-normal text-gray-900">
                £{cartItem.price.toLocaleString()}.00
              </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-gray-700">Subtotal</span>
                <span className="text-sm font-normal text-gray-900">£{subtotal.toLocaleString()}.00</span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-sm font-normal text-gray-700">Shipping</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <span className="text-sm font-normal text-gray-900">FREE</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-gray-700">Duties</span>
                <span className="text-sm font-normal text-gray-900">£{duties.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-normal text-gray-700">Taxes</span>
                <span className="text-sm font-normal text-gray-900">£{taxes.toLocaleString()}.00</span>
              </div>
              
              <hr className="border-gray-200 my-4" />
              
              <div className="flex justify-between items-center">
                <span className="text-base font-normal text-gray-900">Total</span>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1 font-normal">GBP</div>
                  <div className="text-lg font-semibold text-gray-900">
                    £{total.toLocaleString()}.00
                  </div>
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  <p className="mb-2">
                    <strong>Please note</strong> all items are being shipped from the UK. Duties and Taxes* applicable to your country have been applied.
                  </p>
                  <p className="text-sm text-gray-600">
                    *Duties and Taxes can sometimes show under the Shipping field above.
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