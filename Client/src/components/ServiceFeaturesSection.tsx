import React from 'react';
import { ShoppingBag, Crown, CalendarDays, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ServiceFeaturesSection = () => {
  const features = [
    {
      icon: (
        <div className="w-12 h-12 flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-gray-700" strokeWidth={1} />
        </div>
      ),
      title: "COMPLIMENTARY DELIVERY",
      description: "All our deliveries are free of charge with our expert courier service",
      buttonText: "LEARN MORE",
      link: "/delivery"
    },
    {
      icon: (
        <div className="w-12 h-12 flex items-center justify-center">
          <Crown className="w-8 h-8 text-gray-700" strokeWidth={1} />
        </div>
      ),
      title: "SERVICE LIKE NO OTHER",
      description: "In need of assistance? We are here to help",
      buttonText: "CONTACT US",
      link: "/contact"
    },
    {
      icon: (
        <div className="w-12 h-12 flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-gray-700" strokeWidth={1} />
        </div>
      ),
      title: "BOOK AN APPOINTMENT",
      description: "Book an in-store or virtual appointment with our team",
      buttonText: "BOOK NOW",
      link: "/appointments"
    },
    {
      icon: (
        <div className="w-12 h-12 flex items-center justify-center">
          <Gift className="w-8 h-8 text-gray-700" strokeWidth={1} />
        </div>
      ),
      title: "BEAUTIFULLY PACKAGED",
      description: "All of our packaging now use fully recyclable, FSC certified paper.",
      buttonText: "LEARN MORE",
      link: "/packaging"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group flex flex-col h-full">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="p-2 transition-transform duration-300 group-hover:scale-110">
                  {feature.icon}
                </div>
              </div>
              
              {/* Title */}
              <h3 className="text-base font-normal text-gray-900 mb-4 uppercase tracking-wider"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}>
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-base text-gray-700 mb-6 leading-relaxed px-2 flex-grow"
                 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300 }}>
                {feature.description}
              </p>
              
              {/* Button */}
              <div className="mt-auto">
                <Button
                  variant="ghost"
                  className="text-sm font-normal text-gray-900 hover:text-gray-700 uppercase tracking-wider p-0 h-auto group-hover:underline transition-all duration-300"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
                >
                  {feature.buttonText}
                  <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceFeaturesSection;