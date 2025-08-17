
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

export const HeroSection = (): JSX.Element => {
  return (
    <header className="w-full bg-white border-b">
      <div className="flex items-center justify-between px-4 py-6 max-w-[1020px] mx-auto">
        <div className="flex-shrink-0">
          <Link to="/">
            <div className="w-[203px] h-[43px] bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center text-white font-serif text-lg font-light tracking-wider">
              McCulloch
            </div>
          </Link>
        </div>

        <NavigationMenu className="flex-1 flex justify-center">
          <NavigationMenuList className="flex gap-8">
            {navigationItems.map((item, index) => (
              <NavigationMenuItem key={index}>
                <NavigationMenuLink
                  asChild
                  className="font-serif font-normal text-gray-900 text-[11.9px] tracking-[0] leading-5 hover:text-gray-600 transition-colors"
                >
                  <Link to={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-4 flex-shrink-0">
          <Search className="w-5 h-5 text-gray-900 cursor-pointer hover:text-gray-600 transition-colors" />
          <User className="w-5 h-5 text-gray-900 cursor-pointer hover:text-gray-600 transition-colors" />
          <ShoppingBag className="w-5 h-5 text-gray-900 cursor-pointer hover:text-gray-600 transition-colors" />
        </div>
      </div>
    </header>
  );
};
