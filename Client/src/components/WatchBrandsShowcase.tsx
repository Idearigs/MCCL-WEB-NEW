import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WatchBrand {
  id: string;
  name: string;
  title: string;
  description: string;
  location: string;
  video: string;
  route: string;
  color: string;
}

const watchBrands: WatchBrand[] = [
  {
    id: "festina",
    name: "FESTINA",
    title: "Festina",
    description: "Two independent family businesses; shared values, shared passion. For thirty-two years, McCulloch Jewellers and Festina have enjoyed a long-standing partnership in the watch industry; unparalleled design and craftsmanship have formed the cornerstone of their shared philosophy.",
    location: "SPAIN",
    video: "/videos/festina.mp4",
    route: "/festina",
    color: "#003A63"
  },
  {
    id: "briston",
    name: "BRISTON",
    title: "Briston",
    description: "Embodying the British spirit of sophistication and innovation, Briston creates timepieces that blend traditional craftsmanship with contemporary design. Each watch represents a perfect harmony between heritage and modernity.",
    location: "LONDON",
    video: "/images/watch.mp4",
    route: "/briston",
    color: "#8B4513"
  },
  {
    id: "roamer",
    name: "ROAMER",
    title: "Roamer",
    description: "Swiss precision meets timeless elegance. Roamer has been crafting exceptional timepieces since 1888, combining traditional Swiss watchmaking with cutting-edge technology to create watches that stand the test of time.",
    location: "SWITZERLAND",
    video: "/images/watch.mp4",
    route: "/roamer",
    color: "#2C5530"
  }
];

const WatchBrandsShowcase = (): JSX.Element => {
  const [currentBrandIndex, setCurrentBrandIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentBrand = watchBrands[currentBrandIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentBrandIndex((prev) => (prev + 1) % watchBrands.length);
        setIsTransitioning(false);
      }, 1200);
    }, 15000); // Change every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[800px] overflow-hidden">
      {/* Video Background with Transition */}
      <div className="absolute inset-0">
        <video
          key={currentBrand.id}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1500ms] ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={currentBrand.video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      {/* Content Container */}
      <div className="relative flex items-center h-full max-w-none w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full">
          
          {/* Left Content */}
          <div className={`flex flex-col justify-center px-6 md:px-12 lg:pl-32 lg:pr-16 text-white transition-all duration-[1200ms] ease-in-out ${
            isTransitioning ? 'opacity-0 transform translate-y-8' : 'opacity-100 transform translate-y-0'
          }`}>
            <h1 
              className="text-[32px] md:text-[42px] lg:text-[48px] leading-[40px] md:leading-[50px] lg:leading-[56px] mb-4 md:mb-6" 
              style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 400 }}
            >
              {currentBrand.title}
            </h1>
            <p 
              className="text-[14px] md:text-[15px] lg:text-[16px] leading-[22px] md:leading-[24px] lg:leading-[26px] font-light mb-6 md:mb-8 max-w-[480px] tracking-wide" 
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {currentBrand.description}
            </p>
            <Link to={currentBrand.route}>
              <Button
                variant="outline"
                className="h-[45px] md:h-[50px] w-[240px] md:w-[280px] bg-white border-0 text-gray-900 hover:bg-gray-50 transition-all duration-300 font-normal tracking-wider uppercase self-start"
              >
                <span 
                  className="text-[11px] md:text-[12px] font-normal tracking-[1.5px]" 
                  style={{ fontFamily: 'Cormorant Garamond, serif' }}
                >
                  DISCOVER THE COLLECTION
                </span>
              </Button>
            </Link>
          </div>
          
          {/* Right Content - Large Brand Text */}
          <div className={`hidden lg:flex flex-col justify-center items-end pr-16 xl:pr-24 transition-all duration-[1200ms] ease-in-out ${
            isTransitioning ? 'opacity-0 transform translate-x-8' : 'opacity-100 transform translate-x-0'
          }`}>
            <div className="text-right">
              <h2 
                className="text-[80px] xl:text-[100px] leading-[70px] xl:leading-[85px] font-light text-white tracking-wider mb-2"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300 }}
              >
                {currentBrand.name}
              </h2>
              <p 
                className="text-[18px] xl:text-[22px] font-light text-white/90 tracking-[0.2em] uppercase"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {currentBrand.location}
              </p>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Mobile Brand Text Overlay */}
      <div className={`lg:hidden absolute bottom-8 right-6 text-right transition-all duration-[1200ms] ease-in-out ${
        isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
      }`}>
        <h2 
          className="text-[32px] leading-[28px] font-light text-white tracking-wider mb-1"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 300 }}
        >
          {currentBrand.name}
        </h2>
        <p 
          className="text-[12px] font-light text-white/90 tracking-[0.2em] uppercase"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {currentBrand.location}
        </p>
      </div>

      {/* Brand Navigation Dots */}
      <div className="absolute bottom-8 left-6 md:left-12 lg:left-32 flex space-x-3">
        {watchBrands.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentBrandIndex(index);
                setIsTransitioning(false);
              }, 600);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentBrandIndex 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default WatchBrandsShowcase;