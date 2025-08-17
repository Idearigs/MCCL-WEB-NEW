
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Clock, ChevronRight, Youtube, MessageSquare, MessageCircle } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Using a simple SVG for TikTok since it's not available in lucide-react
const TiktokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.04 2.1-.63 4.11-1.8 5.64-.45.5-.95.95-1.51 1.32.03.9.03 1.8.03 2.71v.25c1.44-.1 2.8-.5 4.03-1.19.12.8.12 1.6.12 2.4 0 .8-.13 1.59-.38 2.33-.5 1.5-1.5 2.75-2.88 3.48-1.1.6-2.3.9-3.54.93-1.05.03-2.1-.16-3.08-.53-1.5-.6-2.7-1.8-3.3-3.3-.4-1.1-.6-2.3-.53-3.5.1-1.1.5-2.1 1.1-3 .6-.9 1.5-1.6 2.5-2 .9-.4 1.9-.5 2.9-.3.1.6.2 1.1.3 1.7-.5-.2-1.1-.3-1.7-.3-1.3 0-2.4.8-2.8 2-.2.7-.2 1.4 0 2.1.3.9 1.1 1.6 2 1.8.5.1 1 .1 1.5 0 .7-.2 1.3-.7 1.5-1.4.2-.8.2-1.6 0-2.4V8.5c0-.2 0-.4.1-.6.1-.2.2-.4.4-.5.3-.2.7-.2 1 0 .2.1.3.3.4.5.1.2.1.4.1.6v6.8c0 .3 0 .5-.1.8-.1.2-.2.5-.4.7-.3.3-.6.5-1 .6-.8.2-1.6 0-2.2-.5-.3-.3-.5-.7-.6-1.1-.1-.4-.1-.8 0-1.2.1-.4.3-.7.6-1 .3-.3.7-.5 1.1-.6.4-.1.8-.1 1.2 0 .1 0 .2 0 .3.1v-2.5c-1.1-.1-2.2 0-3.2.4-1 .4-1.8 1.2-2.3 2.2-.4.9-.6 2-.5 3 .1 1 .5 2 1.2 2.8.7.8 1.7 1.3 2.8 1.5 1.1.2 2.2 0 3.2-.5 1-.5 1.8-1.3 2.3-2.3.5-1 .7-2.2.7-3.3V6.2c.5.3 1 .6 1.5.9.9.5 1.9.9 2.9 1.1h.5v-2.6c-.4 0-.8-.1-1.2-.3-.4-.2-.7-.5-1-.8-.3-.3-.5-.7-.6-1.1-.1-.4-.1-.8 0-1.2V.02z" fillRule="evenodd" clipRule="evenodd"></path>
  </svg>
);

export const FooterSection = (): JSX.Element => {
  const [email, setEmail] = useState('');
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log('Subscribed with:', email);
    setEmail('');
  };

  const contactInfo = [
    { 
      icon: <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "No. 1, Galle Face Terrace, Colombo 03, Sri Lanka" 
    },
    { 
      icon: <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "+94 11 2 555 555" 
    },
    { 
      icon: <Mail className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "info@mcculloch.lk" 
    },
    { 
      icon: <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "Mon - Sat: 10:00 AM - 7:00 PM" 
    },
    { 
      icon: <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#8b7d65]" />, 
      text: "Sundays & Public Holidays: By Prior Appointment" 
    },
  ];

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5" />, name: "Facebook", url: "https://facebook.com" },
    { icon: <Instagram className="w-5 h-5" />, name: "Instagram", url: "https://instagram.com" },
    { icon: <Youtube className="w-5 h-5" />, name: "YouTube", url: "https://youtube.com" },
    { icon: <TiktokIcon />, name: "TikTok", url: "https://tiktok.com" },
    { icon: <MessageSquare className="w-5 h-5" />, name: "WhatsApp", url: "https://wa.me/" },
  ];



  const customerService = [
    { name: "SHOP RINGS BY SHAPE", url: "/rings" },
    { name: "ENGAGEMENT RING SIZE", url: "/ring-size" },
    { name: "FURTHER MORE RINGS", url: "/more-rings" },
  ];

  const information = [
    { name: "SHOP DIAMONDS BY SHAPE", url: "/diamonds" },
    { name: "BUILD YOUR OWN JEWELLERY", url: "/custom" },
    { name: "VALUEABLE JEWELLERY", url: "/valuable" },
  ];

  const termsAndConditions = [
    { name: "SHIPPING POLICY", url: "/shipping" },
    { name: "REFUND POLICY", url: "/refund" },
    { name: "PRIVACY POLICY", url: "/privacy" },
    { name: "TERMS OF SERVICE", url: "/terms" },
    { name: "CONTACT INFORMATION", url: "/contact" },
  ];

  const paymentMethods = [
    { name: 'Visa', image: '/payment-methods/visa.jpg' },
    { name: 'Mastercard', image: '/payment-methods/mastercard.jpg' },
    { name: 'American Express', image: '/payment-methods/amex.jpg' },
    { name: 'PayPal', image: '/payment-methods/paypal.jpg' },
    { name: 'Discover', image: '/payment-methods/discover.jpg' },
    { name: 'Apple Pay', image: '/payment-methods/apple-pay.png' },
    { name: 'Google Pay', image: '/payment-methods/google-pay.jpg' },
    { name: 'Bank Transfer', image: '/payment-methods/bank-transfer.jpg' },
  ];

  return (
    <footer className="w-full bg-white text-[#3a3a3a]">

      {/* Structured Footer with Newsletter */}
      <div className="bg-[#f8f6f0] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            
            {/* Our Company */}
            <div>
              <h3 className="text-base font-cormorant font-medium text-gray-900 mb-6 uppercase tracking-wide">
                Our Company
              </h3>
              <ul className="space-y-3">
                <li><a href="/about" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">About us</a></li>
                <li><a href="/sustainability" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Sustainability</a></li>
                <li><a href="/commitment" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Our Commitment to the Planet</a></li>
                <li><a href="/privacy" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Privacy & Cookies</a></li>
                <li><a href="/terms" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Terms & Conditions</a></li>
                <li><a href="/press" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Press</a></li>
                <li><a href="/certificates" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Diamond certificates</a></li>
              </ul>
            </div>

            {/* Help & Support */}
            <div>
              <h3 className="text-base font-cormorant font-medium text-gray-900 mb-6 uppercase tracking-wide">
                Help & Support
              </h3>
              <ul className="space-y-3">
                <li><a href="/track-order" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Track Your Order</a></li>
                <li><a href="/faqs" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">FAQs</a></li>
                <li><a href="/size-guide" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Ring size guide</a></li>
                <li><a href="/buying-guide" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Buying guide</a></li>
                <li><a href="/finance" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Finance options</a></li>
                <li><a href="/payment" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Payment options</a></li>
                <li><a href="/proposals" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">101 proposal ideas</a></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="text-base font-cormorant font-medium text-gray-900 mb-6 uppercase tracking-wide">
                Customer Service
              </h3>
              <ul className="space-y-3">
                <li><a href="/contact" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Contact us</a></li>
                <li><a href="/track" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Track your order</a></li>
                <li><a href="/delivery" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Delivery</a></li>
                <li><a href="/returns" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Returns & Refunds</a></li>
                <li><a href="/warranty" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">5 Years Warranty</a></li>
                <li><a href="/insurance" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Insurance</a></li>
                <li><a href="/reviews" className="text-sm font-cormorant text-gray-800 hover:text-gray-900 transition-colors">Read reviews</a></li>
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="text-base font-cormorant font-medium text-gray-900 mb-4 uppercase tracking-wide">
                Get £25 Off Your First Order
              </h3>
              <p className="text-sm font-cormorant text-gray-800 mb-6 leading-relaxed">
                Sign up to email & SMS and enjoy £25 off your first order with access to our latest offers, jewellery inspiration and be the first to shop new arrivals!
              </p>
              
              <form onSubmit={handleSubscribe} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-white border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm font-cormorant"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="First name"
                    className="bg-white border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm font-cormorant"
                  />
                  <Input
                    type="text"
                    placeholder="Last Name"
                    className="bg-white border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm font-cormorant"
                  />
                </div>
                
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  className="bg-white border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm font-cormorant"
                />
                
                <Input
                  type="date"
                  placeholder="Birthday - DD/MM/YY"
                  className="bg-white border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm font-cormorant"
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-cormorant uppercase tracking-wide py-3"
                >
                  Sign Up
                </Button>
              </form>
              
              <p className="text-xs font-cormorant text-gray-500 mt-4 leading-relaxed">
                By submitting this form, you consent to receive informational and/or marketing texts from McCulloch Jewellers. 
                Msg & data rates may apply. Unsubscribe at any time by replying STOP.
              </p>
            </div>
          </div>

          {/* Payment Methods & Copyright */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="flex justify-center space-x-4 mb-8">
              {paymentMethods.slice(0, 8).map((method, index) => (
                <div 
                  key={index} 
                  className="w-12 h-8 bg-white rounded shadow-sm flex items-center justify-center"
                >
                  <img 
                    src={method.image} 
                    alt={method.name}
                    className="h-5 w-auto object-contain opacity-70"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-xs font-cormorant text-gray-500 leading-relaxed max-w-4xl mx-auto">
                &copy; {new Date().getFullYear()}. All Rights Reserved. McCulloch The Jewellers - Creators of exceptional jewelry since 1847. 
                No. 1, Galle Face Terrace, Colombo 03, Sri Lanka. +94 11 2 555 555
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
