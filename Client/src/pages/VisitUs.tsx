import React, { useEffect } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { MapPin, Clock, Phone, Car } from "lucide-react";

const VisitUs = (): JSX.Element => {
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
            Visit Us
          </h1>
          <p className="text-base lg:text-lg font-cormorant text-gray-600 leading-relaxed max-w-xl mx-auto">
            Experience luxury jewelry in our beautiful showroom in the heart of London.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">

        {/* Our Showroom Section */}
        <section id="our-showroom" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Our Showroom
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Step into our elegant Mayfair showroom, where luxury meets expertise. Our carefully curated space showcases the finest jewelry collections in an intimate, welcoming environment designed for the discerning collector.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Private consultation rooms</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Secure viewing areas</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Expert gemologist on-site</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Complimentary refreshments</p>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Showroom Features
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Premium Location</div>
                  <div className="text-sm font-cormorant text-gray-600">Located in prestigious Mayfair, London's luxury jewelry district</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Expert Staff</div>
                  <div className="text-sm font-cormorant text-gray-600">Knowledgeable team with decades of combined experience</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Security</div>
                  <div className="text-sm font-cormorant text-gray-600">State-of-the-art security systems for your peace of mind</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Book Appointment Section */}
        <section id="book-appointment" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Book Appointment
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Personal Consultation</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Schedule a one-on-one consultation with our jewelry experts to discuss your needs and preferences.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Duration: 60 minutes</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Bespoke Design Session</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Collaborate with our designers to create your unique piece from concept to completion.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Duration: 90 minutes</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Valuation Appointment</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Professional jewelry appraisal by our certified gemologists for insurance or resale.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Duration: 45 minutes</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-block bg-gray-900 text-white py-3 px-8 font-cormorant text-base uppercase tracking-wider hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
                Schedule Your Visit
              </div>
            </div>
          </div>
        </section>

        {/* Private Viewing Section */}
        <section id="private-viewing" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                Private Viewing
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Enjoy an exclusive, private viewing experience in our dedicated VIP suite. Perfect for special occasions or when selecting high-value pieces.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Dedicated private suite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Personal jewelry consultant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Champagne and canapés</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">After-hours availability</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-6">Exclusive Services</h3>
              <div className="space-y-4">
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Curated Collections</div>
                  <div className="text-sm font-cormorant text-gray-600">Pre-selected pieces based on your preferences</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Expert Guidance</div>
                  <div className="text-sm font-cormorant text-gray-600">Detailed information about provenance and craftsmanship</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Investment Advice</div>
                  <div className="text-sm font-cormorant text-gray-600">Market insights and value appreciation guidance</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Immediate Customization</div>
                  <div className="text-sm font-cormorant text-gray-600">On-the-spot sizing and minor modifications</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directions Section */}
        <section id="directions" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Directions
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-2">Our Address</h3>
                    <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                      123 Luxury Lane<br />
                      Mayfair, London W1K 5AB<br />
                      United Kingdom
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Public Transport</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-cormorant font-medium text-gray-900">Tube: </span>
                      <span className="text-sm font-cormorant text-gray-600">Bond Street (2 min walk), Oxford Circus (5 min walk)</span>
                    </div>
                    <div>
                      <span className="font-cormorant font-medium text-gray-900">Bus: </span>
                      <span className="text-sm font-cormorant text-gray-600">Routes 6, 13, 23, 139, 189</span>
                    </div>
                    <div>
                      <span className="font-cormorant font-medium text-gray-900">Taxi: </span>
                      <span className="text-sm font-cormorant text-gray-600">Available outside Bond Street Station</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Nearby Landmarks</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-cormorant text-gray-900">Selfridges</span>
                    <span className="text-sm font-cormorant text-gray-600">2 min walk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-cormorant text-gray-900">Claridge's Hotel</span>
                    <span className="text-sm font-cormorant text-gray-600">3 min walk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-cormorant text-gray-900">Berkeley Square</span>
                    <span className="text-sm font-cormorant text-gray-600">4 min walk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-cormorant text-gray-900">Royal Academy of Arts</span>
                    <span className="text-sm font-cormorant text-gray-600">8 min walk</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Opening Hours Section */}
        <section id="opening-hours" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                    Opening Hours
                  </h2>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-cormorant font-medium text-gray-900">Monday - Friday</span>
                  <span className="font-cormorant text-gray-600">10:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-cormorant font-medium text-gray-900">Saturday</span>
                  <span className="font-cormorant text-gray-600">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-cormorant font-medium text-gray-900">Sunday</span>
                  <span className="font-cormorant text-gray-600">12:00 PM - 5:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-cormorant font-medium text-gray-900">Bank Holidays</span>
                  <span className="font-cormorant text-gray-600">By Appointment Only</span>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Extended Hours
              </h3>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                We offer extended hours by appointment for private viewings and consultations. Contact us to arrange a time that suits your schedule.
              </p>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0F0F0' }}>
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900">Call to Schedule</div>
                  <div className="text-sm font-cormorant text-gray-600">+44 (0) 20 7123 4567</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Parking Information Section */}
        <section id="parking-information" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0F0F0' }}>
                <Car className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                  Parking Information
                </h2>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Valet Parking</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-2">
                  Complimentary valet parking service available for appointments over £5,000.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Advance booking required</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">NCP Car Parks</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-2">
                  Multiple NCP locations within 3 minutes walk. We provide parking validation for visits over 1 hour.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Cavendish Square, Oxford Street</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Street Parking</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-2">
                  Limited meter parking available on surrounding streets. Maximum 2-hour stay during business hours.
                </p>
                <div className="text-sm font-cormorant text-gray-600">£4.90 per hour</div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <FooterSection />
    </div>
  );
};

export default VisitUs;