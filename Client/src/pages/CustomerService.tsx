import React, { useEffect } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

const CustomerService = (): JSX.Element => {
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
            Customer Service
          </h1>
          <p className="text-base lg:text-lg font-cormorant text-gray-600 leading-relaxed max-w-xl mx-auto">
            Exceptional service and expert craftsmanship for all your jewelry needs.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">

        {/* Bespoke Design Section */}
        <section id="bespoke-design" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Bespoke Design
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Transform your vision into reality with our bespoke design service. Our master craftsmen work closely with you to create unique, one-of-a-kind pieces that reflect your personal style and celebrate your special moments.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Personal consultation and design development</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">3D modeling and detailed sketches</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Expert craftsmanship and quality assurance</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Lifetime aftercare and maintenance</p>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                The Design Process
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">1. Consultation</div>
                  <div className="text-sm font-cormorant text-gray-600">Discuss your vision and preferences</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">2. Design</div>
                  <div className="text-sm font-cormorant text-gray-600">Create detailed sketches and 3D models</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">3. Approval</div>
                  <div className="text-sm font-cormorant text-gray-600">Review and refine the final design</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">4. Creation</div>
                  <div className="text-sm font-cormorant text-gray-600">Expert craftsmanship brings your piece to life</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Jewellery Repair Section */}
        <section id="jewellery-repair" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Jewellery Repair
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Expert Restoration</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Our skilled craftsmen can restore vintage and damaged pieces to their former glory using traditional techniques.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Stone Replacement</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Professional replacement of lost or damaged gemstones with perfectly matched stones.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Metal Work</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Prong repair, chain fixing, clasp replacement, and comprehensive metalwork services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ring Resizing Section */}
        <section id="ring-resizing" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Ring Resizing
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Professional ring resizing services to ensure the perfect fit. Our experienced jewellers can resize most rings while maintaining their structural integrity and design.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-cormorant font-light text-gray-900">24hrs</div>
                  <div className="text-sm font-cormorant text-gray-600">Express Service</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-cormorant font-light text-gray-900">Free</div>
                  <div className="text-sm font-cormorant text-gray-600">Size Assessment</div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-6">Resizing Services</h3>
              <div className="space-y-4">
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Standard Resizing</div>
                  <div className="text-sm font-cormorant text-gray-600">Up to 2 sizes larger or smaller</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Complex Resizing</div>
                  <div className="text-sm font-cormorant text-gray-600">Eternity bands and intricate designs</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Watch Resizing</div>
                  <div className="text-sm font-cormorant text-gray-600">Bracelet and strap adjustments</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Chain Adjustment</div>
                  <div className="text-sm font-cormorant text-gray-600">Necklace and bracelet length modifications</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Valuations Section */}
        <section id="valuations" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Valuations
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Professional Appraisals</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Our certified gemologists provide accurate valuations for insurance, probate, or resale purposes using the latest industry standards and market values.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-cormorant text-gray-600">Insurance valuations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-cormorant text-gray-600">Probate valuations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-cormorant text-gray-600">Market value assessments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-cormorant text-gray-600">Detailed written reports</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Valuation Process</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Appointment Booking</div>
                    <div className="text-xs font-cormorant text-gray-600">Schedule a convenient time for assessment</div>
                  </div>
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Expert Examination</div>
                    <div className="text-xs font-cormorant text-gray-600">Thorough analysis by certified gemologists</div>
                  </div>
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Market Research</div>
                    <div className="text-xs font-cormorant text-gray-600">Current market value assessment</div>
                  </div>
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Written Report</div>
                    <div className="text-xs font-cormorant text-gray-600">Detailed certificate with photographs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cleaning & Care Section */}
        <section id="cleaning-care" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Cleaning & Care
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Professional cleaning and maintenance services to keep your jewelry looking its absolute best. Our specialized techniques restore brilliance and extend the life of your precious pieces.
              </p>
              <div className="space-y-3">
                <div className="font-cormorant font-medium text-gray-900">Ultrasonic Cleaning</div>
                <div className="font-cormorant font-medium text-gray-900">Steam Cleaning</div>
                <div className="font-cormorant font-medium text-gray-900">Polish & Rhodium Plating</div>
                <div className="font-cormorant font-medium text-gray-900">Protective Coating Application</div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Care Tips
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">Daily Care</div>
                  <div className="text-sm font-cormorant text-gray-600">Store separately to prevent scratching</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">Regular Cleaning</div>
                  <div className="text-sm font-cormorant text-gray-600">Gentle soap and warm water cleaning</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">Professional Service</div>
                  <div className="text-sm font-cormorant text-gray-600">Annual professional cleaning recommended</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Engraving Services Section */}
        <section id="engraving-services" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Engraving Services
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Hand Engraving</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Traditional hand engraving techniques for personalized messages, dates, and monograms with artistic flair.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Machine Engraving</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Precise machine engraving for consistent lettering and complex designs on various jewelry pieces.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Laser Engraving</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Advanced laser technology for intricate patterns, photographs, and detailed artwork engraving.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gift Wrapping Section */}
        <section id="gift-wrapping" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Gift Wrapping
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Elegant presentation for your special gifts. Our luxury gift wrapping service ensures your jewelry is beautifully presented for any occasion.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Luxury gift boxes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Premium wrapping paper</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Personalized gift cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Ribbon and bow finishing</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-6">Special Occasions</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Engagements</div>
                  <div className="font-cormorant font-medium text-gray-900">Weddings</div>
                  <div className="font-cormorant font-medium text-gray-900">Anniversaries</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Birthdays</div>
                  <div className="font-cormorant font-medium text-gray-900">Graduations</div>
                  <div className="font-cormorant font-medium text-gray-900">Corporate Gifts</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <FooterSection />
    </div>
  );
};

export default CustomerService;