import React, { useEffect, useRef } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

const OurStory = (): JSX.Element => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Auto-scroll to section if hash is present in URL
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }

    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all animated elements
    const animatedElements = document.querySelectorAll('.fade-in-section, .fade-in-left, .fade-in-right');
    animatedElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <style>{`
        .fade-in-section {
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1), transform 1.6s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: opacity, transform;
        }

        .fade-in-section.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .fade-in-left {
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, transform 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
          will-change: opacity, transform;
        }

        .fade-in-left.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        .fade-in-right {
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, transform 1.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
          will-change: opacity, transform;
        }

        .fade-in-right.animate-in {
          opacity: 1;
          transform: translateX(0);
        }

        .stagger-delay-1 {
          transition-delay: 0.15s;
        }

        .stagger-delay-2 {
          transition-delay: 0.25s;
        }

        .stagger-delay-3 {
          transition-delay: 0.35s;
        }
      `}</style>

      <LuxuryNavigationWhite />

      {/* Hero Section with Image */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* Hero Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/images/our-story-hero.jpg"
            alt="McCulloch Jewellers Heritage"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80';
            }}
          />
        </div>

        {/* Elegant Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-center px-4">
          <div className="text-center max-w-4xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/90 mb-6 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              SINCE 1847
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white mb-8 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Our Story
            </h1>
            <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              A legacy of excellence, craftsmanship, and timeless beauty
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* Heritage Section */}
      <section id="about-us" className="py-24 px-4 lg:px-12 bg-white fade-in-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Image */}
            <div className="order-2 lg:order-1 fade-in-section fade-in-left">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src="/images/heritage-craftsmanship.jpg"
                  alt="Heritage craftsmanship"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80';
                  }}
                />
              </div>
            </div>

            {/* Right - Content */}
            <div className="order-1 lg:order-2 fade-in-section fade-in-right">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
                HERITAGE
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                175 Years of Excellence
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Founded in 1847, McCulloch Jewellers has been creating extraordinary pieces that capture life's most precious moments for over a century and three quarters.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                From our humble beginnings as a small workshop to becoming one of the most respected names in fine jewelry, our commitment to excellence has remained unwavering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="relative w-full h-[70vh] overflow-hidden bg-gray-900">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <iframe
            src="https://www.youtube-nocookie.com/embed/qqKF96afmVs?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&loop=1&playlist=qqKF96afmVs&rel=0&iv_load_policy=3&vq=hd1080"
            title="McCulloch Craftsmanship Video"
            allow="autoplay"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '56.25vw',
              minWidth: '177.78vh',
              minHeight: '100vh',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>

        {/* Overlay with Text */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 w-full">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-white/90 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
                CRAFTSMANSHIP
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-white mb-6 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                The Art of Creation
              </h2>
              <p className="text-lg text-white/95 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Every piece is meticulously handcrafted by our master artisans, combining traditional techniques with contemporary innovation to create jewelry that transcends time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Craftsmen Section */}
      <section id="our-craftsmen" className="py-24 px-4 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20 fade-in-section">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              OUR TEAM
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Master Artisans
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Our team of expert craftspeople brings decades of experience and unparalleled skill to every creation
            </p>
          </div>

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Craftsman 1 */}
            <div className="group fade-in-section stagger-delay-1">
              <div className="aspect-[3/4] mb-6 overflow-hidden">
                <img
                  src="/images/master-jeweller.jpg"
                  alt="Master Jeweller"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80';
                  }}
                />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Master Jewellers
              </h3>
              <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Decades of expertise in creating exceptional pieces with precision and artistry
              </p>
            </div>

            {/* Craftsman 2 */}
            <div className="group fade-in-section stagger-delay-2">
              <div className="aspect-[3/4] mb-6 overflow-hidden">
                <img
                  src="/images/diamond-specialist.jpg"
                  alt="Diamond Specialist"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80';
                  }}
                />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Diamond Specialists
              </h3>
              <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Expert gemologists selecting only the finest diamonds and precious stones
              </p>
            </div>

            {/* Craftsman 3 */}
            <div className="group fade-in-section stagger-delay-3">
              <div className="aspect-[3/4] mb-6 overflow-hidden">
                <img
                  src="/images/design-artist.jpg"
                  alt="Design Artist"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80';
                  }}
                />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Design Artists
              </h3>
              <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Creative visionaries transforming dreams into stunning wearable art
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="our-philosophy" className="relative py-24 px-4 lg:px-12 bg-[#f8f6f0]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="fade-in-section fade-in-left">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
                OUR VALUES
              </p>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Our Philosophy
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Uncompromising Quality
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Every piece meets our exacting standards of excellence and craftsmanship
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Ethical Sourcing
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Committed to responsible practices and sustainable materials
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Timeless Design
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    Creating pieces that transcend trends and become cherished heirlooms
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Image */}
            <div className="fade-in-section fade-in-right">
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src="/images/philosophy-values.jpg"
                  alt="Our values and philosophy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=80';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Awards & Recognition */}
      <section id="awards-recognition" className="py-24 px-4 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              RECOGNITION
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Awards & Accolades
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <div className="text-center fade-in-section stagger-delay-1">
              <div className="text-5xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>175+</div>
              <div className="text-sm uppercase tracking-wider text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Years of Excellence</div>
            </div>

            {/* Stat 2 */}
            <div className="text-center fade-in-section stagger-delay-2">
              <div className="text-5xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>50K+</div>
              <div className="text-sm uppercase tracking-wider text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Happy Customers</div>
            </div>

            {/* Stat 3 */}
            <div className="text-center fade-in-section stagger-delay-3">
              <div className="text-5xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>25+</div>
              <div className="text-sm uppercase tracking-wider text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Industry Awards</div>
            </div>

            {/* Stat 4 */}
            <div className="text-center fade-in-section stagger-delay-3">
              <div className="text-5xl font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>100%</div>
              <div className="text-sm uppercase tracking-wider text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Ethical Sourcing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Stories */}
      <section id="customer-stories" className="py-24 px-4 lg:px-12 bg-[#f8f6f0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-in-section">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              TESTIMONIALS
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Stories From Our Clients
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 fade-in-section stagger-delay-1">
              <p className="text-lg text-gray-700 leading-relaxed mb-6 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                "The bespoke engagement ring exceeded all expectations. Truly extraordinary craftsmanship."
              </p>
              <div className="text-sm font-light text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>— James & Sarah</div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 fade-in-section stagger-delay-2">
              <p className="text-lg text-gray-700 leading-relaxed mb-6 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                "They transformed my grandmother's vintage piece into something stunning while preserving its soul."
              </p>
              <div className="text-sm font-light text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>— Emma Thompson</div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 fade-in-section stagger-delay-3">
              <p className="text-lg text-gray-700 leading-relaxed mb-6 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                "The expertise and personal service made finding the perfect anniversary gift effortless."
              </p>
              <div className="text-sm font-light text-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>— Michael Richards</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center border-t border-b border-gray-200 py-16 fade-in-section">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              VISIT US
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Experience McCulloch
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Visit our showroom and discover our exquisite collections
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="px-10 py-4 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
                Book Appointment
              </button>
              <button className="px-10 py-4 border border-gray-300 text-gray-900 hover:border-gray-900 transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
                View Collections
              </button>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default OurStory;
