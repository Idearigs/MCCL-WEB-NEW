import React from 'react';
import { Button } from '@/components/ui/button';

const BespokeDesignSection = () => {
  return (
    <section className="relative h-[750px] overflow-hidden bg-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
        
        {/* Left Side - Video Background */}
        <div className="relative overflow-hidden lg:col-span-2">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/heritage-bg.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Subtle overlay for better contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-20" />
        </div>

        {/* Right Side - Content */}
        <div className="flex flex-col justify-center px-8 md:px-12 lg:px-16 py-12 bg-[#f8f6f0] lg:col-span-1">
          <div className="max-w-lg">
            <h2 className="text-2xl lg:text-3xl font-light text-gray-900 mb-6 leading-tight"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              The McCulloch Bespoke Collection
            </h2>
            
            <p className="text-sm lg:text-base text-gray-700 mb-8 leading-relaxed"
               style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              McCulloch Jewellers is home to one of the finest collections of bespoke jewelry. 
              Founded in 1847, we have inspired artisans and creatives of every description. Now, 
              to mark 175+ years, McCulloch has created a collection of exceptional bespoke pieces 
              to celebrate this landmark legacy.
            </p>
            
            <Button
              className="h-12 px-8 bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 uppercase tracking-wider border-0"
            >
              <span className="text-xs font-medium" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Discover The Collection
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BespokeDesignSection;