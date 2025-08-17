
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const collectionsData = [
  {
    title: "The Celestial",
    description: [
      "Inspired by the cosmos, featuring",
      "constellation-inspired diamond",
      "arrangements",
    ],
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    topOffset: "lg:top-[45px]",
  },
  {
    title: "Royal Heritage",
    description: ["Timeless pieces inspired by historical", "royal jewelry"],
    image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop",
    topOffset: "lg:top-0",
  },
  {
    title: "Modern Minimalist",
    description: ["Contemporary designs for the", "modern connoisseur"],
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=300&fit=crop",
    topOffset: "lg:top-10",
  },
];

export default function CollectionsSection(): JSX.Element {
  return (
    <section className="w-full bg-white">
      <div className="w-full h-[250px] sm:h-[300px] lg:h-[366px] bg-black relative overflow-hidden">
        <div className="h-full bg-[#00000066] bg-[url(https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=400&fit=crop)] bg-cover bg-center">
          <div className="w-full h-full bg-[#00000066] flex items-center justify-center animate-fade-in">
            <div className="text-center px-4">
              <h1 className="font-light text-white text-3xl sm:text-4xl lg:text-[51px] leading-tight lg:leading-[60px] tracking-wide mb-4 lg:mb-6 animate-slide-in-up">
                Our Collections
              </h1>
              <div className="font-light text-white text-sm sm:text-base lg:text-[17px] leading-6 lg:leading-7 tracking-wide max-w-2xl">
                <p className="animate-slide-in-up animation-delay-200">
                  Discover our curated selection of exquisite jewelry collections, each
                </p>
                <p className="animate-slide-in-up animation-delay-400">
                  telling its own unique story
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full py-12 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {collectionsData.map((collection, index) => (
              <div
                key={index}
                className={`${collection.topOffset} group animate-fade-in-up`}
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <Card className="overflow-hidden border-none rounded-none shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden">
                      <img
                        className="w-full h-[250px] sm:h-[280px] lg:h-[296px] object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={collection.title}
                        src={collection.image}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                    </div>

                    <div className="bg-white p-6 lg:p-8">
                      <h3 className="font-light text-black text-lg lg:text-[20.4px] leading-7 lg:leading-8 tracking-wide mb-3 lg:mb-4">
                        {collection.title}
                      </h3>
                      <div className="space-y-1">
                        {collection.description.map((line, lineIndex) => (
                          <p
                            key={lineIndex}
                            className="font-normal text-black text-xs lg:text-[11.9px] leading-4 lg:leading-5 tracking-normal"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-50 py-12 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-light text-gray-900 text-xl lg:text-[25.5px] leading-8 lg:leading-9 tracking-wide mb-4 lg:mb-6 animate-fade-in-up">
            Experience Our Collections
          </h2>

          <div className="mb-8 lg:mb-12 animate-fade-in-up animation-delay-200">
            <p className="font-normal text-gray-600 text-sm lg:text-[13.6px] leading-5 lg:leading-6 tracking-normal mb-2">
              Schedule a private viewing to explore our collections in person
              and receive expert guidance
            </p>
            <p className="font-normal text-gray-600 text-sm lg:text-[13.6px] leading-5 lg:leading-6 tracking-normal">
              from our jewelry specialists.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full sm:w-auto px-8 lg:px-12 h-12 lg:h-[52px] bg-white border border-black hover:bg-gray-50 rounded-none transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up animation-delay-400"
          >
            <span className="font-normal text-black text-xs lg:text-[11.9px] tracking-normal leading-4 lg:leading-5">
              Book an Appointment
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
