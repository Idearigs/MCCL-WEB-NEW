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

const DiamondCutsSection = (): JSX.Element => {
  const navigationItems = [
    { label: "Collections", href: "/collections" },
    { label: "Jewelry", href: "/jewellery" },
    { label: "Diamonds", href: "/diamonds" },
    { label: "Watches", href: "/watches" },
    { label: "Heritage", href: "/heritage" },
  ];

  return (
    <header className="w-full h-[101px] bg-white border-0 border-none">
      <div className="h-[100px]">
        <div className="flex items-center justify-between w-full h-[52px] mt-6 px-4">
          <Link to="/">
            <div className="w-[203px] h-[43px] bg-gradient-to-r from-gray-800 to-gray-600 flex items-center justify-center text-white font-serif text-lg font-light tracking-wider">
              McCulloch
            </div>
          </Link>

          <NavigationMenu>
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
            <Button variant="ghost" size="icon" className="w-5 h-5 p-0">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-5 h-5 p-0">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-5 h-5 p-0">
              <ShoppingBag className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DiamondCutsSection;
