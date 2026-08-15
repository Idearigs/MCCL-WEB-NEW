import React, { useEffect } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { Shield, Award, Gem, Lock, CheckCircle, Info } from "lucide-react";

const TrustGuarantees = (): JSX.Element => {
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
            Trust & Guarantees
          </h1>
          <p className="text-base lg:text-lg font-cormorant text-gray-600 leading-relaxed max-w-xl mx-auto">
            Your confidence and satisfaction are our highest priorities.
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">

        {/* 1-Year Manufacturing Warranty Section */}
        <section id="lifetime-warranty" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <Shield className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-4">
                    1-Year Manufacturing Warranty
                  </h2>
                </div>
              </div>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Eligible jewellery purchased from Andrew McCulloch Jewellers is covered by our 1-Year Manufacturing Warranty, covering defects in materials or craftsmanship for 12 months from the date of purchase.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-base font-cormorant text-gray-600">Confirmed manufacturing faults repaired, replaced or remade free of charge</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-base font-cormorant text-gray-600">Assessed by the jewellers who made or supplied the piece</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-base font-cormorant text-gray-600">Servicing, cleaning and inspections available on our own premises</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-base font-cormorant text-gray-600">Regular maintenance recommended to keep your jewellery secure</p>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Warranty Coverage
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">What's Included</div>
                  <div className="text-sm font-cormorant text-gray-600">Confirmed manufacturing defects in materials or workmanship within 12 months of purchase</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Exclusions</div>
                  <div className="text-sm font-cormorant text-gray-600">Accidental damage, loss, theft, normal wear and tear, and repairs or alterations by another jeweller</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Making a Claim</div>
                  <div className="text-sm font-cormorant text-gray-600">Contact us with your original proof of purchase and we will inspect the item</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Money Back Guarantee Section */}
        <section id="money-back-guarantee" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0F0F0' }}>
                <Award className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-4">
                  Money Back Guarantee
                </h2>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">30-Day Returns</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Return an eligible item within 30 days in its original condition for a refund, made to your original payment method once inspected. Bespoke and personalised pieces are excluded.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Exchanges</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Prefer something else? Exchange an eligible item subject to availability, with any price difference payable or refunded as appropriate.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-3">Aftercare &amp; Servicing</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed">
                  Repairs, servicing and inspections are carried out by hand on our own premises in Beeston, keeping your jewellery secure and looking its best for years to come.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Certified Quality Section */}
        <section id="certified-quality" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0F0F0' }}>
                  <Gem className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-4">
                    Certified Quality
                  </h2>
                </div>
              </div>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Every diamond and gemstone comes with certification from internationally recognized laboratories, ensuring authenticity and quality.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">GIA (Gemological Institute of America)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">SSEF (Swiss Gemmological Institute)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">Gübelin Gem Lab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-cormorant text-gray-600">AGS (American Gem Society)</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-6">Quality Standards</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Diamond Certification</div>
                  <div className="text-sm font-cormorant text-gray-600 mb-2">Independent grading from GIA, IGI or HRD on larger diamonds, covering the 4Cs</div>
                  <div className="text-xs font-cormorant text-gray-500">Smaller and accent stones are supplied without individual reports, as is standard</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Precious Metal Hallmarking</div>
                  <div className="text-sm font-cormorant text-gray-600 mb-2">Hallmarked by a UK Assay Office for gold, platinum and silver content</div>
                  <div className="text-xs font-cormorant text-gray-500">Our own registered Sponsor's Mark on jewellery we make</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Certificate of Authenticity</div>
                  <div className="text-sm font-cormorant text-gray-600 mb-2">Supplied with bespoke jewellery, recording its key details and gemstone information</div>
                  <div className="text-xs font-cormorant text-gray-500">Significant gemstone treatments disclosed where known</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ethical Sourcing Section */}
        <section id="ethical-sourcing" className="mb-16 lg:mb-20">
          <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Ethical Sourcing
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Responsible Practices</h3>
                <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-4">
                  We believe beautiful jewellery should be made to last, and we make responsible use of precious materials wherever possible.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-cormorant text-gray-600">Professionally refined recycled gold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-cormorant text-gray-600">Reuse your own gold in a bespoke piece</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-cormorant text-gray-600">Remodelling and repair to extend jewellery's life</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-cormorant text-gray-600">UK hallmarking on precious metals</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-4">Our Commitments</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Reusing Your Gold</div>
                    <div className="text-xs font-cormorant text-gray-600">Inherited or unwanted gold professionally refined and reused where suitable</div>
                  </div>
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Repair Before Replace</div>
                    <div className="text-xs font-cormorant text-gray-600">Restoring and remodelling treasured pieces rather than replacing them</div>
                  </div>
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Made to Last</div>
                    <div className="text-xs font-cormorant text-gray-600">Quality craftsmanship designed to be worn, enjoyed and passed down</div>
                  </div>
                  <div>
                    <div className="text-sm font-cormorant font-medium text-gray-900">Honest Disclosure</div>
                    <div className="text-xs font-cormorant text-gray-600">Significant gemstone treatments disclosed where known</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Secure Shopping Section */}
        <section id="secure-shopping" className="mb-16 lg:mb-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FAFAF8' }}>
                  <Lock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-4">
                    Secure Shopping
                  </h2>
                </div>
              </div>
              <p className="text-base font-cormorant text-gray-600 leading-relaxed mb-6">
                Your personal information and transactions are protected by the highest levels of security technology and encryption.
              </p>
              <div className="space-y-4">
                <div>
                  <div className="font-cormorant font-medium text-gray-900">SSL Encryption</div>
                  <div className="text-sm font-cormorant text-gray-600">256-bit SSL encryption for all transactions</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">PCI Compliance</div>
                  <div className="text-sm font-cormorant text-gray-600">Payment Card Industry security standards</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Secure Payment</div>
                  <div className="text-sm font-cormorant text-gray-600">Multiple payment options with fraud protection</div>
                </div>
                <div>
                  <div className="font-cormorant font-medium text-gray-900">Privacy Protection</div>
                  <div className="text-sm font-cormorant text-gray-600">Strict data protection and privacy policies</div>
                </div>
              </div>
            </div>
            <div className="p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
              <h3 className="text-xl font-cormorant font-medium text-gray-900 mb-4">
                Payment Security
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Accepted Payment Methods</div>
                  <div className="text-sm font-cormorant text-gray-600">Visa, Mastercard, American Express, PayPal, Bank Transfer</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Fraud Protection</div>
                  <div className="text-sm font-cormorant text-gray-600">Advanced fraud detection and monitoring systems</div>
                </div>
                <div>
                  <div className="text-sm font-cormorant font-medium text-gray-900 mb-2">Secure Delivery</div>
                  <div className="text-sm font-cormorant text-gray-600">Insured shipping with signature confirmation</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learn More Section */}
        <section id="learn-more" className="mb-16 lg:mb-20">
          <div className="text-center p-8 lg:p-12" style={{ backgroundColor: '#FAFAF8' }}>
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0F0F0' }}>
                <Info className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-6">
              Learn More
            </h2>
            <p className="text-base font-cormorant text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
              Have questions about our guarantees or want to learn more about our quality standards? Our expert team is here to help you understand every aspect of your purchase.
            </p>
            <div className="grid lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="font-cormorant font-medium text-gray-900 mb-2">Documentation</div>
                <div className="text-sm font-cormorant text-gray-600">Detailed warranty terms and conditions</div>
              </div>
              <div className="text-center">
                <div className="font-cormorant font-medium text-gray-900 mb-2">Expert Consultation</div>
                <div className="text-sm font-cormorant text-gray-600">Speak with our certified gemologists</div>
              </div>
              <div className="text-center">
                <div className="font-cormorant font-medium text-gray-900 mb-2">Customer Support</div>
                <div className="text-sm font-cormorant text-gray-600">24/7 assistance for all inquiries</div>
              </div>
            </div>
            <div className="mt-8">
              <div className="inline-block bg-gray-900 text-white py-3 px-8 font-cormorant text-base uppercase tracking-wider hover:bg-gray-800 transition-colors duration-300 cursor-pointer">
                Contact Our Experts
              </div>
            </div>
          </div>
        </section>

      </div>

      <FooterSection />
    </div>
  );
};

export default TrustGuarantees;