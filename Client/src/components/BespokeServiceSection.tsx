
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const categoryData = [
  {
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=280&fit=crop",
    title: "Necklaces",
    description: "From delicate chains to statement pieces",
  },
  {
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=300&h=280&fit=crop",
    title: "Bracelets",
    description: "Elegant designs for every occasion",
  },
  {
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=280&fit=crop",
    title: "Earrings",
    description: "Timeless sophistication for your ears",
  },
];

export default function BespokeServiceSection(): JSX.Element {
  return (
    <div className="w-full bg-white">
      <section className="relative w-full h-[366px] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <img
          className="w-full h-full object-cover"
          alt="Fine Jewelry Background"
          src="https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=1200&h=400&fit=crop"
        />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in">
          <h1 className="font-serif font-light text-white text-3xl sm:text-4xl lg:text-[51px] leading-tight lg:leading-[60px] tracking-wide mb-4 lg:mb-6 animate-slide-in-up">
            Fine Jewelry
          </h1>
          <p className="font-serif font-light text-white text-sm sm:text-base lg:text-[17px] leading-6 lg:leading-7 tracking-wide max-w-xl text-center animate-slide-in-up animation-delay-200">
            Discover our exquisite collection of handcrafted jewelry pieces
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-serif font-light text-black text-xl lg:text-[25.5px] leading-8 lg:leading-9 tracking-wide mb-4 lg:mb-6 animate-fade-in-up">
              Categories
            </h2>
            <div className="max-w-2xl mx-auto">
              <p className="font-serif font-normal text-black text-sm lg:text-[13.6px] leading-5 lg:leading-6 tracking-normal animate-fade-in-up animation-delay-200">
                Explore our carefully curated categories of fine jewelry, each
                piece telling its own story of elegance and craftsmanship
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {categoryData.map((category, index) => (
              <Card
                key={index}
                className="overflow-hidden border-none rounded-none shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 bg-white animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <img
                      className="w-full h-[278px] object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={category.title}
                      src={category.image}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                  </div>

                  <div className="bg-white p-6 lg:p-8">
                    <h3 className="font-serif font-light text-black text-lg lg:text-[20.4px] leading-7 lg:leading-8 tracking-wide mb-3 lg:mb-4">
                      {category.title}
                    </h3>

                    <p className="font-serif font-normal text-black text-xs lg:text-[11.9px] leading-4 lg:leading-5 tracking-normal">
                      {category.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 lg:py-24 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif font-light text-gray-900 text-xl lg:text-[25.5px] leading-8 lg:leading-9 tracking-wide mb-4 lg:mb-6 animate-fade-in-up">
            Bespoke Service
          </h2>

          <div className="mb-8 lg:mb-12 animate-fade-in-up animation-delay-200">
            <p className="font-serif font-normal text-gray-600 text-sm lg:text-[13.6px] leading-5 lg:leading-6 tracking-normal mb-2">
              Create your perfect piece with our master craftsmen. From
              initial design to final creation, we'll guide you
              through every step of bringing your vision to life.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full sm:w-auto px-8 lg:px-12 h-12 lg:h-[52px] bg-white border border-black hover:bg-gray-50 rounded-none transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up animation-delay-400"
          >
            <span className="font-serif font-normal text-black text-xs lg:text-[11.9px] tracking-normal leading-4 lg:leading-5">
              Book a Consultation
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}
