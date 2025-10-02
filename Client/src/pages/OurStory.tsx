import React, { useEffect } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

const OurStory = (): JSX.Element => {
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
  }, []);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center pt-40">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-3xl lg:text-4xl font-cormorant font-light text-gray-900 mb-6 tracking-wide">
            Our Story
          </h1>
          <p className="text-base lg:text-lg font-cormorant text-gray-600 leading-relaxed max-w-xl mx-auto">
            Discover the heritage and craftsmanship behind McCulloch Jewellers.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">

        {/* About Us Section */}
        <section id="about-us" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              About Us
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                McCulloch Jewellers has been at the forefront of luxury jewelry for over four decades, creating exceptional pieces that celebrate life's most precious moments. Our commitment to excellence and artisanal craftsmanship has made us a trusted name in fine jewelry.
              </p>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                From our carefully curated collections to our bespoke design services, every piece tells a unique story of elegance, quality, and timeless beauty.
              </p>
            </div>
          </div>
        </section>

        {/* Our History Section */}
        <section id="our-history" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Our History
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-2">1980 - The Beginning</h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    Founded by master jeweller James McCulloch with a vision to create extraordinary jewelry that captures the essence of luxury and sophistication.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-2">1995 - Expansion</h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    Opened our flagship showroom in London's prestigious Mayfair district, establishing ourselves as a destination for discerning jewelry connoisseurs.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-2">2010 - Innovation</h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    Embraced cutting-edge design technology while maintaining our commitment to traditional craftsmanship techniques passed down through generations.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Legacy of Excellence
              </h3>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Today, McCulloch Jewellers continues to honor our founder's vision while embracing contemporary design and sustainable practices.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-cormorant font-light text-gray-900">40+</div>
                  <div className="text-sm font-cormorant text-gray-600">Years of Excellence</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-cormorant font-light text-gray-900">10,000+</div>
                  <div className="text-sm font-cormorant text-gray-600">Happy Customers</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Craftsmen Section */}
        <section id="our-craftsmen" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Our Craftsmen
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Master Jewellers</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Our team of master jewellers brings decades of experience and unparalleled skill to every creation.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Diamond Specialists</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Expert gemologists who carefully select and set only the finest diamonds and precious stones.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Design Artists</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Creative visionaries who transform dreams into stunning, wearable works of art.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Philosophy Section */}
        <section id="our-philosophy" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Our Philosophy
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                We believe that jewelry is more than mere adornment—it's a reflection of personal style, a celebration of milestones, and a legacy to be cherished for generations.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Uncompromising quality in every piece</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Personalized service and attention to detail</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Ethical sourcing and sustainable practices</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Timeless designs that transcend trends</p>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Our Commitment
              </h3>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                Every piece that bears the McCulloch name represents our unwavering commitment to excellence, artistry, and the celebration of life's most precious moments.
              </p>
            </div>
          </div>
        </section>

        {/* Awards & Recognition Section */}
        <section id="awards-recognition" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Awards & Recognition
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Industry Awards</h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-cormorant font-medium text-gray-900">Jewellery Industry Excellence Award</div>
                    <div className="text-sm font-cormorant text-gray-600">2023 • Outstanding Craftsmanship</div>
                  </div>
                  <div>
                    <div className="font-cormorant font-medium text-gray-900">London Luxury Awards</div>
                    <div className="text-sm font-cormorant text-gray-600">2022 • Best Independent Jeweller</div>
                  </div>
                  <div>
                    <div className="font-cormorant font-medium text-gray-900">UK Retail Jeweller Award</div>
                    <div className="text-sm font-cormorant text-gray-600">2021 • Customer Service Excellence</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Certifications</h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-cormorant font-medium text-gray-900">Responsible Jewellery Council</div>
                    <div className="text-sm font-cormorant text-gray-600">Certified Member</div>
                  </div>
                  <div>
                    <div className="font-cormorant font-medium text-gray-900">Kimberley Process</div>
                    <div className="text-sm font-cormorant text-gray-600">Conflict-Free Diamond Certification</div>
                  </div>
                  <div>
                    <div className="font-cormorant font-medium text-gray-900">Assay Office London</div>
                    <div className="text-sm font-cormorant text-gray-600">Hallmarking Partnership</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Stories Section */}
        <section id="customer-stories" className="mb-16 lg:mb-20">
          <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-8 text-center">
            Customer Stories
          </h2>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="p-6 lg:p-8" style={{ backgroundColor: '#FAFAF8' }}>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4 italic">
                "The bespoke engagement ring created for my fiancée exceeded all expectations. The attention to detail and craftsmanship is simply extraordinary."
              </p>
              <div className="text-sm font-cormorant font-medium text-gray-900">- James & Sarah, London</div>
            </div>
            <div className="p-6 lg:p-8" style={{ backgroundColor: '#FAFAF8' }}>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4 italic">
                "McCulloch Jewellers transformed my grandmother's vintage necklace into a stunning modern piece while preserving its sentimental value."
              </p>
              <div className="text-sm font-cormorant font-medium text-gray-900">- Emma Thompson, Edinburgh</div>
            </div>
            <div className="p-6 lg:p-8" style={{ backgroundColor: '#FAFAF8' }}>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4 italic">
                "The personalized service and expertise helped me choose the perfect anniversary gift. My wife was absolutely delighted."
              </p>
              <div className="text-sm font-cormorant font-medium text-gray-900">- Michael Richards, Manchester</div>
            </div>
          </div>
        </section>

      </div>

      <FooterSection />
    </div>
  );
};

export default OurStory;