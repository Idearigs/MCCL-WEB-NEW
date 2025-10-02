import React, { useState } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const Contact = (): JSX.Element => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      {/* Hero Section */}
      <div className="relative w-full h-[40vh] bg-gradient-to-b from-gray-50 to-white flex items-center justify-center pt-40">
        <div className="text-center max-w-4xl mx-auto px-6">
          <h1 className="text-3xl lg:text-4xl font-cormorant font-light text-gray-900 mb-6 tracking-wide">
            Contact Us
          </h1>
          <p className="text-base lg:text-lg font-cormorant text-gray-600 leading-relaxed max-w-xl mx-auto">
            Get in touch with our team for bespoke consultations and expert advice.
          </p>
        </div>
      </div>

      {/* Contact Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20">

          {/* Contact Information */}
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-cormorant font-light text-gray-900 mb-8">
                Get in Touch
              </h2>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-12">
                Our expert team is here to assist you with personalized service and custom designs.
              </p>
            </div>

            <div className="space-y-8">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-2">
                    Visit Our Showroom
                  </h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    123 Luxury Lane<br />
                    Mayfair, London W1K 5AB<br />
                    United Kingdom
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-2">
                    Call Us
                  </h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    +44 (0) 20 7123 4567<br />
                    +44 (0) 20 7123 4568
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-2">
                    Email Us
                  </h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    info@mcculloch.co.uk<br />
                    bespoke@mcculloch.co.uk
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-2">
                    Opening Hours
                  </h3>
                  <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                    Monday - Friday: 10:00 AM - 7:00 PM<br />
                    Saturday: 10:00 AM - 6:00 PM<br />
                    Sunday: 12:00 PM - 5:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-3xl lg:text-4xl font-cormorant font-light text-gray-900 mb-8">
              Send a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-cormorant font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-0 border-b border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 font-cormorant text-base transition-colors"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-cormorant font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-0 border-b border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 font-cormorant text-base transition-colors"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-cormorant font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-0 border-b border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 font-cormorant text-base transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-cormorant font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-0 border-b border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 font-cormorant text-base transition-colors"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-cormorant font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-0 border-b border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 font-cormorant text-base transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="bespoke">Bespoke Design</option>
                  <option value="appointment">Book Appointment</option>
                  <option value="repair">Repair Services</option>
                  <option value="valuation">Jewelry Valuation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-cormorant font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 font-cormorant text-base transition-colors resize-none"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-4 px-8 font-cormorant text-base uppercase tracking-wider hover:bg-gray-800 transition-colors duration-300"
                >
                  Send Message
                </button>
              </div>
            </form>

            <p className="text-sm font-cormorant text-gray-500 mt-6 text-center">
              We typically respond within 24 hours during business days.
            </p>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Contact;