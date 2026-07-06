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
            Visit our showroom in the heart of Beeston, Nottingham, where our experienced team is always on hand to help.
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
                Visit our showroom in the heart of Beeston, Nottingham, where you can browse our jewellery collections, discuss bespoke designs, arrange jewellery or watch repairs, or speak with our knowledgeable team for expert advice.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Browse fine jewellery and watch collections</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Bespoke design consultations</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Jewellery and watch repairs assessed in store</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-base font-cormorant text-gray-600">Insurance and probate valuations by appointment</p>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Showroom Features
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Established Location</div>
                  <div className="text-sm font-cormorant text-gray-600">7 The Square, Beeston — serving the local community since 1952</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Expert Team</div>
                  <div className="text-sm font-cormorant text-gray-600">Experienced jewellers with a passion for quality craftsmanship and personal service</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">On-Site Workshop</div>
                  <div className="text-sm font-cormorant text-gray-600">Bespoke design, repairs and restorations carried out by our skilled workshop team</div>
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
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Bespoke Consultations</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Book a consultation to discuss your ideas for a bespoke piece. We'll guide you through the design process from concept to creation.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Appointments recommended</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Jewellery &amp; Watch Repairs</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Bring your jewellery or watch in for an assessment. We'll discuss the available repair options and provide a quotation.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Walk-ins welcome</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Jewellery Valuations</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  Insurance and probate valuations available by appointment. Our experienced team will assess your jewellery and answer your questions.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Appointment required</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-block bg-gray-900 text-white py-3 px-8 font-cormorant text-base uppercase tracking-wider hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
                Schedule Your Visit
              </div>
            </div>
          </div>
        </section>

        {/* Our Services Section */}
        <section id="our-services" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
                What We Offer
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Whether your jewellery was purchased from us or elsewhere, every item entrusted to us is treated with the utmost care, skill and attention to detail.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Bespoke jewellery design and commission</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Expert jewellery and watch repairs</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Jewellery remodelling and restoration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Insurance and probate valuations</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-6">How to Get in Touch</h3>
              <div className="space-y-4">
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Telephone</div>
                  <div className="text-sm font-cormorant text-gray-600">0115 925 7552</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Mobile</div>
                  <div className="text-sm font-cormorant text-gray-600">07859 888649</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Email</div>
                  <div className="text-sm font-cormorant text-gray-600">has@mccullochjewellers.co.uk</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Walk-ins</div>
                  <div className="text-sm font-cormorant text-gray-600">Always welcome — appointments recommended for bespoke consultations and valuations</div>
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
                      Andrew McCulloch Jewellers<br />
                      7 The Square, Beeston<br />
                      Nottinghamshire, NG9 2JG
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Getting Here</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-cormorant font-medium text-gray-900">Tram: </span>
                      <span className="text-sm font-cormorant text-gray-600">Beeston tram stop on the NET Nottingham Express Transit line</span>
                    </div>
                    <div>
                      <span className="font-cormorant font-medium text-gray-900">Bus: </span>
                      <span className="text-sm font-cormorant text-gray-600">Regular services from Nottingham city centre</span>
                    </div>
                    <div>
                      <span className="font-cormorant font-medium text-gray-900">By Car: </span>
                      <span className="text-sm font-cormorant text-gray-600">Beeston is easily accessible from the A52 and M1 junction 25</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Parking</h3>
                <div className="space-y-3">
                  <div>
                    <span className="font-cormorant text-gray-900">Town Centre Parking</span>
                    <p className="text-sm font-cormorant text-gray-600 mt-1">Public car parks available nearby in Beeston town centre, a short walk from our showroom.</p>
                  </div>
                  <div>
                    <span className="font-cormorant text-gray-900">On-Street Parking</span>
                    <p className="text-sm font-cormorant text-gray-600 mt-1">Limited on-street parking available on surrounding streets. Please check local signage.</p>
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
                  <span className="font-cormorant font-medium text-gray-900">Monday – Saturday</span>
                  <span className="font-cormorant text-gray-600">9:00am – 5:30pm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-cormorant font-medium text-gray-900">Sunday</span>
                  <span className="font-cormorant text-gray-600">Closed</span>
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
                  <div className="text-sm font-cormorant text-gray-600">0115 925 7552</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Book Section */}
        <section id="how-to-book" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              How to Book
            </h2>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">By Telephone</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-2">
                  Call us to arrange a convenient date and time for your visit. Our team will be happy to help.
                </p>
                <div className="text-sm font-cormorant text-gray-600">0115 925 7552 / 07859 888649</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">By Email</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-2">
                  Send us an email and we will arrange a convenient appointment for your visit.
                </p>
                <div className="text-sm font-cormorant text-gray-600">has@mccullochjewellers.co.uk</div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Walk-In</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-2">
                  Walk-in customers are always welcome. Appointments are recommended for bespoke consultations and valuations.
                </p>
                <div className="text-sm font-cormorant text-gray-600">Mon–Sat: 9:00am–5:30pm</div>
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