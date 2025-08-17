
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, User } from "lucide-react";
import React from "react";

const navigationItems = [
  { label: "Collections", href: "#" },
  { label: "Jewelry", href: "#" },
  { label: "Diamonds", href: "#" },
  { label: "Watches", href: "#" },
  { label: "Heritage", href: "#" },
];

export default function JewelryCategoriesSection(): JSX.Element {
  return (
    <header className="w-full h-[101px] bg-white border-0 border-none">
      <div className="h-[100px]">
        <div className="flex items-center justify-between w-full max-w-[988px] h-[52px] mt-6 ml-4">
          <div className="w-[203px] h-[43px] bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center text-white font-serif text-lg font-light tracking-wider">
            McCulloch
          </div>

          <nav className="flex items-center space-x-8">
            {navigationItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="font-serif font-normal text-gray-900 text-[11.9px] tracking-[0] leading-5 whitespace-nowrap hover:text-gray-600 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 p-0 hover:bg-transparent"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 p-0 hover:bg-transparent"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 p-0 hover:bg-transparent"
            >
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
