import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";

const Navbar = () => {
  const router = useRouter();
  const [theme, setTheme] = useState("light");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileMenuTriggerRef = useRef(null);

  // --- Theme Handling ---
  const applyTheme = (t) => {
    setTheme(t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const savedTheme = Cookies.get("theme");
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      applyTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // --- Mobile Menu Side Effects (Close on Escape, Focus Management) ---
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      // Close if clicked outside menu AND not on the trigger button
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileMenuTriggerRef.current &&
        !mobileMenuTriggerRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"; // Prevent background scroll
      document.addEventListener("keydown", handleEscKey);
      document.addEventListener("mousedown", handleClickOutside);

      const focusableElements = mobileMenuRef.current?.querySelectorAll(
        "a[href], button:not([disabled])"
      );
      if (focusableElements?.length > 0) {
        focusableElements[0].focus();
      }
    } else {
      document.body.style.overflow = ""; // Restore scroll
    }

    // Cleanup listeners
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]); // Rerun effect when menu state changes

  // --- Toggle Functions ---
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    Cookies.set("theme", newTheme, { expires: 365 });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu on link click
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Check if link is active
  const isActive = (path) => router.pathname === path;

  return (
    <>
      {/* Main Navbar Structure */}
      <nav
        aria-label="Main navigation"
        className="border-b bg-neutral-100 dark:bg-neutral-950 sticky top-0 z-50 h-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Left section: Logo and Desktop Links */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <span className="text-black dark:text-gray-200 text-xl font-bold relative before:absolute before:bottom-0 before:left-0 before:w-full before:h-0.5 before:bg-current before:scale-x-0 before:transform before:transition-transform before:duration-300 before:ease-in-out before:origin-left hover:before:scale-x-100">
                  AudioShare
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-4">
                {/* Desktop Links */}
                <Link
                  href="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                    isActive("/")
                      ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
                  }`}
                >
                  Upload
                </Link>
                <Link
                  href="/faq"
                  className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                    isActive("/faq")
                      ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
                  }`}
                >
                  FAQ
                </Link>
                <Link
                  href="/archive"
                  className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                    isActive("/archive")
                      ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
                  }`}
                >
                  Archive
                </Link>
                <Link
                  href="/audio_files.txt"
                  className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
                    isActive("/audio_files.txt")
                      ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                      : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
                  }`}
                >
                  Index
                </Link>
              </div>
            </div>

            {/* Right section: Mobile Toggle, Theme */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  ref={mobileMenuTriggerRef}
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileMenu}
                  className="h-9 w-9"
                  aria-label="Toggle main navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu-overlay"
                >
                  {/* Icon changes based on state */}
                  {isMobileMenuOpen ? (
                    <X
                      aria-hidden="true"
                      className="h-5 w-5 text-black dark:text-gray-200"
                    />
                  ) : (
                    <Menu
                      aria-hidden="true"
                      className="h-5 w-5 text-black dark:text-gray-200"
                    />
                  )}
                </Button>
              </div>

              {/* Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
                aria-label={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
                title={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
              >
                {theme === "light" ? (
                  <Moon
                    aria-hidden="true"
                    className="h-4 w-4 text-black dark:text-gray-200 dark:hover:text-white"
                  />
                ) : (
                  <Sun
                    aria-hidden="true"
                    className="h-4 w-4 text-black dark:text-gray-200 dark:hover:text-white"
                  />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu Overlay --- */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      ></div>

      {/* Menu Content - Slides in from the right */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu-overlay"
        className={`fixed top-0 bottom-0 right-0 z-40 w-64 bg-neutral-100 dark:bg-neutral-950 shadow-xl md:hidden transition-transform duration-300 ease-in-out transform flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full" // Slide in/out
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-menu-heading"
      >
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2
            id="mobile-menu-heading"
            className="text-lg font-semibold text-black dark:text-white"
          >
            Menu
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            className="h-8 w-8"
            aria-label="Close navigation menu"
          >
            <X
              aria-hidden="true"
              className="h-5 w-5 text-black dark:text-gray-200"
            />
          </Button>
        </div>

        {/* Menu Links */}
        <div className="flex-grow p-4 space-y-2">
          {" "}
          <Link
            href="/"
            onClick={handleMobileLinkClick}
            className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
              isActive("/")
                ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            Upload
          </Link>
          <Link
            href="/faq"
            onClick={handleMobileLinkClick}
            className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
              isActive("/faq")
                ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            FAQ
          </Link>
          <Link
            href="/archive"
            onClick={handleMobileLinkClick}
            className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
              isActive("/archive")
                ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            Archive
          </Link>
          <Link
            href="/audio_files.txt"
            onClick={handleMobileLinkClick}
            className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${
              isActive("/audio_files.txt")
                ? "bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                : "text-black dark:text-gray-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-white"
            }`}
          >
            Index
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
