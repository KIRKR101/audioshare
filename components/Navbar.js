import React, { useState, useEffect } from 'react';
import { Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Cookies from 'js-cookie';

const Navbar = () => {
  const [theme, setTheme] = useState('light'); // Initialize with a default

  // Load the theme from cookies on component mount (client-side)
  useEffect(() => {
    const savedTheme = Cookies.get('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      // Apply the theme immediately
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } else {
      // If no saved theme, check for system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount


  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);  // Update the state

    // Update the cookie
    Cookies.set('theme', newTheme, { expires: 365 });  // Set cookie, expires in 365 days

    document.documentElement.classList.toggle('dark');
  };

  return (
    <nav className="border-b bg-neutral-100 dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - nav links */}
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-black dark:text-gray-200 dark:hover:text-white text-xl font-bold">AudioShare</span>
            </a>
            <div className="hidden md:flex items-baseline space-x-4">
              <a href="/" className="text-black dark:text-gray-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Upload
              </a>
                <a href="/audio_files.txt" className="text-black dark:text-gray-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Index
                </a>
                <a href="/archive" className="text-black dark:text-gray-200 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Archive
                </a>
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
