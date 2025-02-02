import React from 'react';
import { Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [theme, setTheme] = React.useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="border-b bg-neutral-100 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo and nav links */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-black dark:text-gray-200 dark:hover:text-white text-xl font-bold">AudioShare</span>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <a href="/" className="text-black dark:text-gray-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Upload
                </a>
                <a href="/faq" className="text-black dark:text-gray-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  FAQ
                </a>
              </div>
            </div>
          </div>

          {/* Right side - Theme toggle and account */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4 text-black dark:text-gray-200 dark:hover:text-white" />
              ) : (
                <Sun className="h-4 w-4 text-black dark:text-gray-200 dark:hover:text-white" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4 text-black dark:text-gray-200 dark:hover:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <a href="/login" className="w-full">Login</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/register" className="w-full">Register</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;