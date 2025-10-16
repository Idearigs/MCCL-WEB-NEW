import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { motion, useInView, Variants } from "framer-motion";

export default function ExcellenceSection(): JSX.Element {
  const refs = {
    promiseSection: useRef<HTMLDivElement>(null),
    remodelSection: useRef<HTMLDivElement>(null),
    vintageSection: useRef<HTMLDivElement>(null),
    whatWeCanDoSection: useRef<HTMLDivElement>(null)
  };

  const isInView = {
    promiseSection: useInView(refs.promiseSection, { once: true, margin: "-100px" }),
    remodelSection: useInView(refs.remodelSection, { once: true, margin: "-100px" }),
    vintageSection: useInView(refs.vintageSection, { once: true, margin: "-100px" }),
    whatWeCanDoSection: useInView(refs.whatWeCanDoSection, { once: true, margin: "-100px" })
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <section className="w-full bg-white">
      {/* Hero Banner Section with Video Background */}
      <div className="w-full h-[80vh] relative overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="/videos/heritage-bg.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="font-light text-4xl md:text-5xl lg:text-6xl text-white font-serif leading-tight mb-4"
          >
            Our Heritage
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="font-light text-lg md:text-xl text-white font-serif max-w-2xl"
          >
            A legacy of excellence since 1847
          </motion.p>
        </div>
      </div>

      {/* History Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="font-light text-2xl md:text-3xl text-gray-900 font-serif mb-4">
              McCulloch The Jewellers History
            </h2>
            <div className="space-y-4 text-gray-700 font-serif leading-relaxed text-sm md:text-base">
              <p>
                For five generations, our family has crafted more than just jewelry — we've created heirlooms. 
                As an award-winning business, recognized as Bespoke Jeweller of the Year in 2021, we specialize 
                in bringing your most treasured designs to life with unmatched artistry.
              </p>
              <p>
                In our on-site workshop, you'll see every step of the process, from the first sketch to the 
                final polish, all overseen by a designer with 25 years of expertise. Every piece is handmade 
                using traditional techniques, ensuring timeless quality. And while we deliver masterpieces, 
                we do so at competitive prices.
              </p>
              <p>
                At McCulloch Jewellers, We look forward to assisting you in creating a piece of jewelry that 
                will be cherished today and passed down through many generations to come.
              </p>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="relative max-w-md mx-auto">
              <img 
                src="/images/stark-media-bw-23.jpg" 
                alt="McCulloch Jewellery Workshop"
                className="w-full h-auto rounded-lg shadow-lg object-cover"
                style={{ maxHeight: '380px', width: 'auto' }}
              />
              <div className="absolute -z-10 -bottom-2 -right-2 w-full h-full border-2 border-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* De Silva Family Section */}
      <div className="bg-gray-50 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="md:w-5/12">
              <div className="relative">
                <img 
                  src="/images/desilva-family.jpg" 
                  alt="The De Silva Family - McCulloch Jewellers"
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                  style={{ maxHeight: '450px' }}
                />
                <div className="absolute -z-10 -bottom-3 -right-3 w-full h-full border-2 border-gray-200 rounded-lg"></div>
              </div>
            </div>
            <div className="md:w-7/12">
              <span className="text-sm font-light text-gray-500 font-serif mb-1 block">SINCE 2017</span>
              <h2 className="font-light text-2xl md:text-3xl text-gray-900 font-serif mb-4">
                The De Silva Family
              </h2>
              <div className="space-y-4 text-gray-700 font-serif leading-relaxed text-sm md:text-base">
                <p>
                  The de Silva family are known for being successful jewellers and Has de Silva wanted to pursue his family's tradition and is a fifth-generation jeweller. 
                </p>
                <p>
                  Has' journey to becoming a jeweller began at the University of Kent in Canterbury – where he obtained a BA (Hons) in Jewellery Designing, Silversmithing and Jewellery Manufacturing. After completing his degree, Has worked for a few notable jewellers in Mayfair – London, and in Winchester – Hampshire before embarking on his own business.
                </p>
                <p>
                  McCulloch's jewellers presently remain a well-established watch repair and restoration business, with an in-house workshop and design studio allowing us to do most of the repairs in-house. As well as implementing watch repairs and restoration – another service we provide is designing custom jewellery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Promise Section */}
      <motion.div 
        ref={refs.promiseSection}
        initial="hidden"
        animate={isInView.promiseSection ? "visible" : "hidden"}
        variants={fadeInUp}
        className="w-full bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-light text-4xl text-gray-900 font-serif mb-3 tracking-wide">
              Our Promise
            </h2>
            <div className="w-20 h-0.5 bg-amber-700 mx-auto mb-4"></div>
            <span className="text-sm font-light text-gray-500 font-serif tracking-wider">EST. 2017</span>
          </div>
          
          <div className="flex flex-col lg:flex-row-reverse gap-12 items-start">
            <div className="lg:w-1/2">
              <div className="relative group">
                <img 
                  src="/images/promise-workshop.jpg" 
                  alt="McCulloch Jewellery Workshop"
                  className="w-full h-auto rounded-lg shadow-xl object-cover transform transition-all duration-500 group-hover:scale-102"
                  style={{ maxHeight: '600px' }}
                />
                <div className="absolute -z-10 -bottom-3 -right-3 w-full h-full border-2 border-amber-100 rounded-lg transition-all duration-300 group-hover:-bottom-2 group-hover:-right-2"></div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="space-y-6 text-gray-700 font-serif leading-relaxed">
                <p className="text-justify">
                  Our ethos defines a highly bespoke experience, where every customer is given the opportunity to make their dream piece of jewellery a reality and to ensure that their experience in store is exceptional.
                </p>
                
                <p className="text-justify">
                  Also, in-store, we offer a free design consultation for customers interested in bespoke pieces, in addition to, offering a CAD design service that enables customers to envisage every detail of their piece. Due to global connections, we are able to source diamonds in addition to other gemstones from all corners of the world. For example, if a customer has a specific design in mind, we can easily source a range of multiple gems in a realm of colours, sizes and budgets in order for each customer to create their flawless, bespoke piece.
                </p>
                
                <p className="text-justify">
                  Another service we perform is remodelling – which is where we use the customer's preowned gemstones and gold to create something entirely new. This service is particularly popular as it allows the customer to keep the sentimental value of the piece but give it a whole new rebrand.
                </p>
                
                <p className="text-justify">
                  These services can all be viewed by the public in our-in-house jewellery workshop, where the customers can see their beloved pieces being repaired, restored and remodelled. We are able to repair all types of jewellery and watches.
                </p>
                
                <p className="text-justify">
                  In-store we also have a wide variety of new pieces in both gold and silver, contemporary and traditional; and are constantly refreshing our stock. We also sell a wide range of second hand and vintage jewellery. We have a huge selection of jewellery that we have painstakingly restored to its former glory. All second-hand items come with a one year guarantee.
                </p>
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 italic leading-relaxed">
                    Has is a fifth-generation jeweller. Graduating from the University of Kent at Canterbury, where he obtained BA(Hons) in Jewellery Designing, Silversmithing and Jewellery Manufacturing. After working for a few notable jewellers in Mayfair London, and in Winchester in Hampshire before embarking on his own Business at present.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Remodel Jewellery Section */}
      <motion.div 
        ref={refs.remodelSection}
        initial="hidden"
        animate={isInView.remodelSection ? "visible" : "hidden"}
        variants={fadeInUp}
        className="w-full bg-gray-50 py-20"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="relative group">
                <img 
                  src="/images/remodel-jewellery.jpg" 
                  alt="Remodel Jewellery at McCulloch"
                  className="w-full h-auto rounded-lg shadow-xl object-cover transform transition-all duration-500 group-hover:scale-102"
                  style={{ maxHeight: '500px' }}
                />
                <div className="absolute -z-10 -bottom-3 -left-3 w-full h-full border-2 border-amber-100 rounded-lg transition-all duration-300 group-hover:bottom-0 group-hover:left-0"></div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <h2 className="font-light text-3xl md:text-4xl text-gray-900 font-serif mb-4">
                Remodel Jewellery
              </h2>
              <div className="text-gray-700 font-serif leading-relaxed space-y-4">
                <p>
                  We remodel jewellery where we use the customer's own gemstones and gold. We melt the gold and reuse the gems. This service is particularly popular.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Second Hand & Vintage Jewellery Section */}
      <motion.div 
        ref={refs.vintageSection}
        initial="hidden"
        animate={isInView.vintageSection ? "visible" : "hidden"}
        variants={fadeInUp}
        className="w-full bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <h2 className="font-light text-3xl md:text-4xl text-gray-900 font-serif mb-6">
                Second Hand & Vintage Jewellery
              </h2>
              <div className="space-y-6 text-gray-700 font-serif leading-relaxed">
                <p className="text-justify">
                  We sell a wide range of second hand and vintage jewellery. All secondhand items come with a year's guarantee, where we have painstakingly restored them to their former glory. We have a huge selection of gold pocket watches and fobs Albert chains, Vintage watches and Jewellery.
                </p>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="relative group">
                <img 
                  src="/images/vintage-jewellery-display.jpg" 
                  alt="Vintage Jewellery Collection at McCulloch"
                  className="w-full h-auto rounded-lg shadow-xl object-cover transform transition-all duration-500 group-hover:scale-102"
                  style={{ maxHeight: '500px' }}
                />
                <div className="absolute -z-10 -bottom-3 -right-3 w-full h-full border-2 border-amber-100 rounded-lg transition-all duration-300 group-hover:-bottom-2 group-hover:-right-2"></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* What We Can Do Section */}
      <motion.div 
        ref={refs.whatWeCanDoSection}
        initial="hidden"
        animate={isInView.whatWeCanDoSection ? "visible" : "hidden"}
        variants={staggerContainer}
        className="w-full bg-gray-50 py-20"
      >
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-light text-3xl md:text-4xl text-gray-900 font-serif text-center mb-12">
            What We Can Do
          </h2>
          
          <motion.div 
            variants={staggerContainer}
            className="space-y-6 text-gray-700 font-serif leading-relaxed"
          >
            <motion.p 
              variants={fadeInUp}
              className="text-justify"
            >
              We are a highly regarded watch repair and restoration business, known for our exceptional craftsmanship and expertise in horology. Our longstanding reputation as watchmakers.
            </motion.p>
            
            <motion.p 
              variants={fadeInUp}
              className="text-justify"
            >
              With an in house workshop and design studio, we offer free design service which enables customers to envisage their jewellery in realistic detail.
            </motion.p>
            
            <motion.p 
              variants={fadeInUp}
              className="text-justify"
            >
              We source diamonds and other gemstones from all over the world. If you have a design in mind, we are able to source multiple gems in different colors, sizes and budgets to help you to create that perfect ring.
            </motion.p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
