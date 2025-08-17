
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Search, ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";
import React from "react";

const navigationItems = [
  { label: "Collections", href: "/collections" },
  { label: "Jewelry", href: "/jewellery" },
  { label: "Diamonds", href: "/diamonds" },
  { label: "Watches", href: "/watches" },
  { label: "Heritage", href: "/heritage" },
];

export const HeritageSection = (): JSX.Element => {
  return (
    <header className="w-full h-[101px] bg-white border-0 border-none">
      <div className="h-[100px]">
        <div className="relative w-full max-w-[988px] h-[52px] top-6 left-4 flex items-center justify-between">
          <Link to="/">
            <div className="w-[203px] h-[43px] bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center text-white font-serif text-lg font-light tracking-wider">
              McCulloch
            </div>
          </Link>

          <NavigationMenu className="flex-1 flex justify-center">
            <NavigationMenuList className="flex gap-8">
              {navigationItems.map((item, index) => (
                <NavigationMenuItem key={index}>
                  <NavigationMenuLink
                    asChild
                    className="font-serif font-normal text-gray-900 text-[11.9px] tracking-[0] leading-5 whitespace-nowrap hover:text-gray-700 transition-colors"
                  >
                    <Link to={item.href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="w-5 h-5 p-0 h-auto">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-5 h-5 p-0 h-auto">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-5 h-5 p-0 h-auto">
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
