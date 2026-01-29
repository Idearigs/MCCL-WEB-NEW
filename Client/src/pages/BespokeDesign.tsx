import React from "react";
import { Link } from "react-router-dom";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

const BespokeDesign = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      {/* Hero Section with Video - 85vh to show next section peek */}
      <section className="relative h-[85vh] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            src="https://www.youtube-nocookie.com/embed/qqKF96afmVs?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&loop=1&playlist=qqKF96afmVs&rel=0&iv_load_policy=3&vq=hd1080"
            title="McCulloch Bespoke Collection Video"
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

        {/* Elegant Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

        {/* Content Overlay - Centered */}
        <div className="relative h-full flex items-center justify-center px-4 pt-16">
          <div className="text-center max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/80 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              BESPOKE
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              The McCulloch<br />Bespoke Collection
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-xl mx-auto leading-relaxed font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Crafting your vision into timeless masterpieces
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

      {/* Artisan Excellence Section */}
      <section className="py-24 px-4 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              ARTISAN EXCELLENCE
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Crafted With Passion
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Your Vision, Realized
                </h3>
                <p className="text-base leading-relaxed text-gray-700 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Every McCulloch bespoke piece begins with a conversation—a moment where your dreams take shape. Our designers listen intently, understanding not just what you want, but the emotion and meaning behind it.
                </p>
                <p className="text-base leading-relaxed text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  From engagement rings that symbolize eternal commitment to commemorative pieces celebrating life's precious milestones, we transform your vision into wearable art that tells your unique story.
                </p>
              </div>

              {/* Image */}
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src="/images/bespoke-consultation.jpg"
                  alt="Bespoke design consultation"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80';
                  }}
                />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="space-y-8 lg:pt-32">
              {/* Image */}
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src="/images/bespoke-crafting.jpg"
                  alt="Master craftsman creating jewelry"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80';
                  }}
                />
              </div>

              <div>
                <h3 className="text-3xl font-light text-gray-900 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Masterful Creation
                </h3>
                <p className="text-base leading-relaxed text-gray-700 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  With over 175 years of jewelry-making heritage, McCulloch's master artisans combine time-honored techniques with contemporary innovation. Each piece is meticulously handcrafted in our atelier, where precision meets artistry.
                </p>
                <p className="text-base leading-relaxed text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  We source only the finest materials—ethically sourced diamonds, rare colored gemstones, and precious metals—ensuring every bespoke creation meets our exacting standards of excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Creative Process Section */}
      <section className="py-24 px-4 lg:px-12 bg-[#f8f6f0]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              THE PROCESS
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              From Inspiration to Creation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              A collaborative journey where your imagination meets our expertise
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div>
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-300" style={{ fontFamily: 'Cormorant Garamond, serif' }}>01</span>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Initial Consultation
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Share your vision in an intimate consultation where we explore design possibilities, materials, and the story you wish to tell.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-300" style={{ fontFamily: 'Cormorant Garamond, serif' }}>02</span>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Design Development
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Our designers create detailed sketches and 3D renderings, refining every detail until your vision is perfectly captured.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-300" style={{ fontFamily: 'Cormorant Garamond, serif' }}>03</span>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Artisan Creation
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Master craftsmen bring your design to life, hand-forging precious metals and setting each stone with meticulous care.
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <div className="mb-6">
                <span className="text-6xl font-light text-gray-300" style={{ fontFamily: 'Cormorant Garamond, serif' }}>04</span>
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Your Heirloom
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Receive your bespoke masterpiece, certified and presented in our signature packaging, ready to become part of your legacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center border-t border-b border-gray-200 py-16">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 font-light" style={{ fontFamily: 'Inter, sans-serif' }}>
              START YOUR JOURNEY
            </p>
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Create Something Extraordinary
            </h2>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Schedule a private consultation to begin designing your bespoke masterpiece
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/contact"
                className="px-10 py-4 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Book Consultation
              </Link>
              <Link
                to="/portfolio"
                className="px-10 py-4 border border-gray-300 text-gray-900 hover:border-gray-900 transition-all duration-300 text-sm uppercase tracking-[0.2em] font-light"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                View Portfolio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default BespokeDesign;
