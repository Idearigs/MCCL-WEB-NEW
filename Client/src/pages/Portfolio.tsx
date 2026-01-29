import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  year: string;
}

const Portfolio = (): JSX.Element => {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Portfolio items - bespoke jewellery pieces
  const portfolioItems: PortfolioItem[] = [
    {
      id: 1,
      title: "Diamond Solitaire",
      category: "Engagement",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
      description: "Bespoke platinum engagement ring featuring a 2.5 carat center diamond with custom halo setting.",
      year: "2024"
    },
    {
      id: 2,
      title: "Ceylon Sapphire",
      category: "Engagement",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
      description: "Art Deco inspired engagement ring with Ceylon sapphire and diamond accents in white gold.",
      year: "2024"
    },
    {
      id: 3,
      title: "Rose Gold Band",
      category: "Wedding",
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      description: "Sleek contemporary wedding band in 18k rose gold with subtle diamond pavé detail.",
      year: "2023"
    },
    {
      id: 4,
      title: "Emerald Pendant",
      category: "Necklace",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
      description: "Statement necklace featuring Colombian emeralds set in platinum with diamond accents.",
      year: "2024"
    },
    {
      id: 5,
      title: "Three Stone",
      category: "Engagement",
      image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80",
      description: "Bespoke three stone engagement ring with oval center diamond and matching side stones.",
      year: "2023"
    },
    {
      id: 6,
      title: "South Sea Pearls",
      category: "Earrings",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      description: "Elegant South Sea pearl earrings with diamond surrounds in white gold.",
      year: "2024"
    },
    {
      id: 7,
      title: "Eternity Diamond",
      category: "Wedding",
      image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80",
      description: "Full eternity band featuring perfectly matched round brilliant diamonds in platinum.",
      year: "2023"
    },
    {
      id: 8,
      title: "Ruby Heritage",
      category: "Bracelet",
      image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
      description: "Reimagined vintage bracelet with Burmese rubies and diamonds in yellow gold.",
      year: "2024"
    }
  ];

  const categories = ["All", "Engagement", "Wedding", "Necklace", "Earrings", "Bracelet"];

  const filteredItems = selectedCategory === "All"
    ? portfolioItems
    : portfolioItems.filter(item => item.category === selectedCategory);

  // Animation on scroll
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      {/* Hero Section with Video */}
      <section className="relative h-[70vh] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            src="https://www.youtube-nocookie.com/embed/qqKF96afmVs?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&loop=1&playlist=qqKF96afmVs&rel=0&iv_load_policy=3&vq=hd1080"
            title="McCulloch Portfolio Video"
            allow="autoplay"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '56.25vw',
              minWidth: '177.78vh',
              minHeight: '100%',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Content */}
        <div className="relative h-full flex items-center justify-center px-4 pt-16">
          <div className={`text-center max-w-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xs uppercase tracking-[0.4em] text-white/80 mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Portfolio
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Our Bespoke Creations
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-xl mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              A curated selection of handcrafted masterpieces
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Category Filter */}
      <section className="py-6 px-4 lg:px-8 bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`relative text-sm tracking-[0.15em] font-light transition-all duration-300 pb-1 ${
                  selectedCategory === category
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {category}
                <span
                  className={`absolute bottom-0 left-0 h-[1px] bg-gray-900 transition-all duration-300 ${
                    selectedCategory === category ? 'w-full' : 'w-0'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Full-Width Portfolio Grid */}
      <section className="py-8 px-4 lg:px-8 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
          >
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                className={`group cursor-pointer overflow-hidden transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                } ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
                onClick={() => setSelectedItem(item)}
              >
                <div className={`relative overflow-hidden bg-gray-100 ${
                  index === 0 ? 'aspect-square' : 'aspect-[4/5]'
                }`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  />

                  {/* Subtle Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500" />

                  {/* Bottom Info Bar */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.category}
                        </p>
                        <h3 className="text-white text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {item.title}
                        </h3>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white transform translate-x-2 group-hover:translate-x-0 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Year Badge */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="text-white/80 text-xs tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.year}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Stats Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                500+
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Pieces Created
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                25+
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Years Experience
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                100%
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Handcrafted
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                5
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                Generations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Begin Your Story
          </h2>
          <p className="text-gray-500 mb-10 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Every piece in our portfolio started with a conversation. Let's start yours.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-gray-900 hover:text-gray-600 transition-colors group"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <span>Book a Consultation</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Refined Modal/Lightbox */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white"
          onClick={() => setSelectedItem(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedItem(null)}
            className="absolute top-8 right-8 z-10 p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          <div
            className="relative w-full h-full flex flex-col lg:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image - Full Height */}
            <div className="w-full lg:w-2/3 h-[50vh] lg:h-full bg-gray-100">
              <img
                src={selectedItem.image}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Panel */}
            <div className="w-full lg:w-1/3 h-[50vh] lg:h-full flex flex-col justify-center p-8 lg:p-12 bg-white">
              <div className="max-w-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedItem.category} — {selectedItem.year}
                </p>
                <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {selectedItem.title}
                </h2>
                <div className="w-12 h-[1px] bg-gray-200 mb-6"></div>
                <p className="text-gray-600 leading-relaxed mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selectedItem.description}
                </p>

                <div className="space-y-4">
                  <Link
                    to="/bespoke-design"
                    className="flex items-center justify-between w-full py-4 border-t border-gray-100 text-sm uppercase tracking-[0.15em] text-gray-900 hover:text-gray-600 transition-colors group"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <span>Create Similar</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center justify-between w-full py-4 border-t border-gray-100 text-sm uppercase tracking-[0.15em] text-gray-900 hover:text-gray-600 transition-colors group"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <span>Inquire About This Piece</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <FooterSection />
    </div>
  );
};

export default Portfolio;
