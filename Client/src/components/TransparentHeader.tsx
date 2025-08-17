import { Menu, X, ChevronDown, User } from "lucide-react";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";

export const TransparentHeader = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      {/* Desktop Navigation */}
      <div className="hidden lg:block px-6 lg:px-16 py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/images/logo.png" 
              alt="McCulloch Jewellers" 
              className="h-8 w-auto object-contain"
            />
            <div className="flex flex-col">
              <div className={`text-xs font-medium tracking-wide uppercase transition-colors duration-300 ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}>
                McCulloch Jewellers
              </div>
              <div className={`text-xs tracking-wide uppercase transition-colors duration-300 ${
                isScrolled ? 'text-gray-500' : 'text-white/70'
              }`}>
                London
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-8">
            <Link 
              to="/collections" 
              className={`text-sm font-medium transition-colors duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-white hover:text-white/80'
              }`}
            >
              Collections
            </Link>
            <Link 
              to="/jewellery" 
              className={`text-sm font-medium transition-colors duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-white hover:text-white/80'
              }`}
            >
              Jewellery
            </Link>
            <Link 
              to="/diamonds" 
              className={`text-sm font-medium transition-colors duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-white hover:text-white/80'
              }`}
            >
              Diamonds
            </Link>
            <Link 
              to="/watches" 
              className={`text-sm font-medium transition-colors duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-white hover:text-white/80'
              }`}
            >
              Watches
            </Link>
            <Link 
              to="/heritage" 
              className={`text-sm font-medium transition-colors duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-gray-900' 
                  : 'text-white hover:text-white/80'
              }`}
            >
              Heritage
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <button className={`transition-colors duration-300 ${
              isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-white/80'
            }`}>
              <User className="w-5 h-5" />
            </button>
            <Link 
              to="/cart"
              className={`transition-colors duration-300 ${
                isScrolled ? 'text-gray-700 hover:text-gray-900' : 'text-white hover:text-white/80'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/images/logo.png" 
              alt="McCulloch Jewellers" 
              className="h-6 w-auto object-contain"
            />
            <div className={`text-xs font-medium tracking-wide uppercase transition-colors duration-300 ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}>
              McCulloch Jewellers
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`transition-colors duration-300 ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <Link 
                to="/collections" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Collections
              </Link>
              <Link 
                to="/jewellery" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jewellery
              </Link>
              <Link 
                to="/diamonds" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Diamonds
              </Link>
              <Link 
                to="/watches" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Watches
              </Link>
              <Link 
                to="/heritage" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Heritage
              </Link>
              <hr className="border-gray-200" />
              <Link 
                to="/cart" 
                className="block text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TransparentHeader;