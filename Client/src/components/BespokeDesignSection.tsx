import React from 'react';
import { Button } from '@/components/ui/button';
import ScrollReveal from './ScrollReveal';

const BespokeDesignSection = () => {
  return (
    <section className="relative h-[750px] overflow-hidden bg-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-full">

        {/* Left Side - Video Background */}
        <ScrollReveal direction="left" duration={900} className="relative overflow-hidden lg:col-span-2 h-full">
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              overflow: 'hidden'
            }}>
              <iframe
                src="https://www.youtube-nocookie.com/embed/qqKF96afmVs?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&loop=1&playlist=qqKF96afmVs&rel=0&iv_load_policy=3&vq=hd1080"
                title="McCulloch Heritage Video"
                allow="autoplay"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  pointerEvents: 'none',
                  transform: 'scale(1.3)',
                  transformOrigin: 'center'
                }}
              />
            </div>
          </div>
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20" />
        </ScrollReveal>

        {/* Right Side - Content */}
        <div className="flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12 bg-[#f8f6f0] lg:col-span-1">
          <div className="max-w-lg">
            <ScrollReveal direction="right" delay={200}>
              <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-6 leading-tight"
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                The McCulloch Bespoke Collection
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={380}>
              <p className="text-sm lg:text-base text-gray-700 mb-8 leading-relaxed"
                 style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Andrew McCulloch Jewellers is home to one of Beeston's finest workshops for bespoke
                jewellery. A trusted name on The Square since 1952, and owned by the de Silva family
                since 2017, we design and make bespoke pieces by hand on our own bench — every
                commission created for one person and no one else.
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={520}>
              <Button
                className="h-12 px-8 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 uppercase tracking-wider border-0"
              >
                <span className="text-xs font-medium" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  Discover The Collection
                </span>
              </Button>
            </ScrollReveal>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BespokeDesignSection;
