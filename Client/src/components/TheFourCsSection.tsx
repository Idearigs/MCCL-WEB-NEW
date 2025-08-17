
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const diamondCuts = [
  {
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=400&fit=crop",
    title: "Round Brilliant",
    description: "The classic choice for maximum brilliance",
  },
  {
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=400&fit=crop",
    title: "Emerald Cut",
    description: "Sophisticated step-cut elegance",
  },
  {
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=400&fit=crop",
    title: "Oval Cut",
    description: "Modern elegance with vintage appeal",
  },
];

export default function TheFourCsSection(): JSX.Element {
  return (
    <section className="w-full bg-white">
      {/* Hero Section */}
      <div className="relative w-full h-[366px] bg-black">
        <div className="h-[366px] bg-[#00000066] bg-[url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop)] bg-cover bg-[50%_50%]">
          <div className="w-full h-[366px] bg-[#00000099] flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-serif font-light text-white text-[51px] leading-[60px] mb-6">
                Diamonds
              </h1>
              <p className="font-serif font-light text-white text-[17px] leading-7 max-w-[557px]">
                Experience the brilliance of our exceptional diamond collection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Diamond Cuts Section */}
      <div className="w-full py-24 px-4">
        <div className="max-w-[988px] mx-auto">
          <div className="text-center mb-[148px]">
            <h2 className="font-serif font-light text-gray-900 text-[25.5px] leading-9 mb-[60px]">
              Diamond Cuts
            </h2>
            <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6 max-w-[540px] mx-auto">
              Each diamond cut represents a unique expression of brilliance and
              character
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {diamondCuts.map((cut, index) => (
              <Card key={index} className="overflow-hidden bg-[#00000033] border-none">
                <CardContent className="p-0">
                  <div
                    className="aspect-[297/278] bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${cut.image})` }}
                  />
                  <div className="bg-white p-8">
                    <h3 className="font-serif font-light text-black text-[20.4px] leading-8 mb-3">
                      {cut.title}
                    </h3>
                    <p className="font-serif font-normal text-black text-[11.9px] leading-5">
                      {cut.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* The Four Cs Section */}
      <div className="w-full bg-gray-50 py-24">
        <div className="max-w-[988px] mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif font-light text-gray-900 text-[25.5px] leading-9 mb-[60px]">
                The Four Cs
              </h2>
              <div className="mb-[96px]">
                <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6 mb-[26px]">
                  Our diamond experts will guide you through the essential
                </p>
                <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6 mb-[24px]">
                  characteristics that determine a diamond's value: Cut, Color,
                </p>
                <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6">
                  Clarity, and Carat weight.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-[196px] h-[52px] bg-white border-[0.25px] border-solid border-black rounded-none hover:bg-gray-50 h-auto"
              >
                <span className="font-serif font-normal text-black text-[11.9px] leading-5">
                  Learn More
                </span>
              </Button>
            </div>
            <div className="aspect-[470/400] bg-cover bg-center bg-no-repeat bg-[url(https://images.unsplash.com/photo-1500673922987-e212871fec22?w=500&h=400&fit=crop)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
