import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, Calendar, Phone, Mail, HelpCircle } from "lucide-react";
import TopBanner from "./TopBanner";

const LuxuryNavigation = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBanner />
        <nav 
          className={`transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
              : 'bg-transparent'
          }`}
        >
          {/* Desktop Navigation */}
          <div className="hidden lg:block max-w-7xl mx-auto px-8">
            <div className="flex flex-col items-center py-6">
              {/* Top Row - Logo Center */}
              <div className="flex items-center justify-between w-full mb-6">
                {/* Left side */}
                <div className="flex items-center space-x-4 min-w-[120px]">
                  <span className={`text-xs uppercase tracking-widest transition-colors duration-300 ${
                    isScrolled ? 'text-gray-600' : 'text-white/70'
                  }`}>UK</span>
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex justify-center mx-12">
                  <Link to="/" className="flex flex-col items-center">
                    <div className={`text-2xl font-serif font-light tracking-[0.3em] uppercase transition-colors duration-300 ${
                      isScrolled ? 'text-gray-900' : 'text-white'
                    }`}>
                      McCulloch
                    </div>
                    <div className={`text-sm font-light tracking-[0.5em] uppercase transition-colors duration-300 ${
                      isScrolled ? 'text-gray-600' : 'text-white/80'
                    }`}>
                      Jewellers
                    </div>
                  </Link>
                </div>

                {/* Right Icons */}
                <div className="flex items-center space-x-4 min-w-[120px] justify-end">
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
              </div>

              {/* Bottom Row - Navigation Links */}
              <div className="w-full flex items-center justify-center mt-1">
                <div className="flex items-center justify-center space-x-6 lg:space-x-8 xl:space-x-10">
                  <Link 
                    to="/engagement" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Engagement
                  </Link>
                  <Link 
                    to="/wedding" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Wedding
                  </Link>
                  <Link 
                    to="/diamonds" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Diamonds
                  </Link>
                  <Link 
                    to="/jewellery" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Jewellery
                  </Link>
                  <Link 
                    to="/watches" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Watches
                  </Link>
                  <Link 
                    to="/heritage" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Our Heritage
                  </Link>
                  <Link 
                    to="/contact" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left - Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Menu className={`w-5 h-5 transition-colors duration-300 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`} />
              </button>

              {/* Center - Minimal Logo/Brand */}
              <div className="flex-1 flex justify-center">
                <Link to="/" className="flex flex-col items-center">
                  <div className={`text-lg font-serif tracking-[0.2em] uppercase transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}>
                    McCulloch
                  </div>
                  <div className={`text-[10px] font-serif tracking-[0.3em] uppercase transition-colors duration-300 ${
                    isScrolled ? 'text-gray-500' : 'text-white/70'
                  }`}>
                    Jewellers
                  </div>
                </Link>
              </div>

              {/* Right - Minimal Actions */}
              <div className="flex items-center space-x-2">
                {/* Search */}
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>

                {/* Shopping Bag */}
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu - Professional Structure */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50">
          <div className="h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="border-b border-gray-200 px-0 py-0">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-serif tracking-[0.2em] uppercase text-gray-900">
                    McCulloch
                  </div>
                  <div className="text-xs font-serif tracking-[0.3em] uppercase text-gray-500 mt-0.5">
                    Jewellers
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setExpandedSection(null);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          
            <nav className="px-0 py-0 overflow-y-auto">
              {/* Main Navigation Sections */}
              <div className="border-b border-gray-200">
                {/* Engagement Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'engagement' ? null : 'engagement')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">ENGAGEMENT</span>
                    {expandedSection === 'engagement' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedSection === 'engagement' && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {/* Diamond Engagement Rings Subsection */}
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">DIAMOND ENGAGEMENT RINGS</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-3 ml-4">
                          <Link
                            to="/engagement/all"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            All Engagement Rings
                          </Link>
                          <Link
                            to="/engagement/quickship"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Quickship Collection
                          </Link>
                          <Link
                            to="/engagement/inspiration"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Inspiration Gallery
                          </Link>
                          <Link
                            to="/engagement/reviews"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Reviews
                          </Link>
                        </div>
                      </div>

                      {/* Shop by Styles Subsection */}
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">SHOP BY STYLES</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-3 ml-4">
                          <Link
                            to="/engagement/solitaire"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Solitaire
                          </Link>
                          <Link
                            to="/engagement/trilogy"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Trilogy
                          </Link>
                          <Link
                            to="/engagement/diamond-band"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Diamond Band
                          </Link>
                          <Link
                            to="/engagement/halo"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Halo
                          </Link>
                          <Link
                            to="/engagement/platinum"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Platinum
                          </Link>
                          <Link
                            to="/engagement/rose-gold"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Rose Gold
                          </Link>
                          <Link
                            to="/engagement/yellow-gold"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Yellow Gold
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wedding Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'wedding' ? null : 'wedding')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">WEDDING</span>
                    {expandedSection === 'wedding' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Diamonds Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'diamonds' ? null : 'diamonds')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">DIAMONDS</span>
                    {expandedSection === 'diamonds' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Jewellery Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'jewellery' ? null : 'jewellery')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">JEWELLERY</span>
                    {expandedSection === 'jewellery' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Guides Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'guides' ? null : 'guides')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">GUIDES</span>
                    {expandedSection === 'guides' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* About Us Section */}
                <div>
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 uppercase tracking-wider">ABOUT US</span>
                    {expandedSection === 'about' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contact & Services Section */}
              <div className="bg-gray-50">
                {/* Book Appointment */}
                <Link
                  to="/appointment"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Book Appointment</div>
                    <div className="text-xs text-gray-600">Schedule your free consultation</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Phone */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Phone</div>
                    <div className="text-xs text-gray-600">Call on +44 207 831 1901</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Email */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-xs text-gray-600">Got any questions about rings? Send us an email</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Help & FAQs */}
                <Link
                  to="/faq"
                  className="flex items-center px-6 py-4 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <HelpCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Help & FAQs</div>
                    <div className="text-xs text-gray-600">Phone lines available Mon-Fri 9:30am - 6pm</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default LuxuryNavigation;