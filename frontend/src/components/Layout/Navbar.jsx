// frontend/src/components/Layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  Home,
  Activity,
  Target,
  Menu,
  X,
  Sun,
  Moon,
  Footprints,
  User,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import NotificationCenter from "../Notifications/NotificationCenter";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, signOut } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Activities", href: "/activities", icon: Activity },
    { name: "Steps", href: "/steps", icon: Footprints },
    { name: "Sleep", href: "/sleep", icon: Moon },
    { name: "Goals", href: "/goals", icon: Target },
  ];

  if (user?.user_metadata?.role === "admin") {
    navigation.push({ name: "Admin", href: "/admin", icon: Settings });
  }

  const profileMenuItems = [
    {
      name: "Profile",
      icon: User,
      onClick: () => navigate("/profile"),
    },
    {
      name: "Settings",
      icon: Settings,
      onClick: () => navigate("/settings"),
    },
    {
      name: "Sign Out",
      icon: LogOut,
      onClick: handleSignOut,
    },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Activity className="h-8 w-8 text-blue-700 dark:text-blue-400 transition-colors" />
              <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white transition-colors">
                ApeXfit
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1 transition-colors" />
                  {item.name}
                </Link>
              );
            })}

            {/* Notification Center */}
            <NotificationCenter />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 transition-colors" />
              ) : (
                <Moon className="h-5 w-5 transition-colors" />
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user?.user_metadata?.name?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <ChevronDown className="h-4 w-4 transition-colors" />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.user_metadata?.name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>

                  {profileMenuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          item.onClick();
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${
                          index === profileMenuItems.length - 1
                            ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : ""
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu items - Notification and Hamburger */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Notification Center on mobile */}
            <div className="md:hidden">
              <NotificationCenter />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none transition-colors duration-200"
            >
              {isOpen ? (
                <X className="h-6 w-6 transition-colors" />
              ) : (
                <Menu className="h-6 w-6 transition-colors" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t dark:border-gray-700 transition-colors duration-200">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 transition-colors" />
                  {item.name}
                </Link>
              );
            })}

            {/* Theme Toggle in mobile menu */}
            <button
              onClick={() => {
                toggleTheme();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
            >
              {isDark ? (
                <Sun className="h-5 w-5 mr-3 transition-colors" />
              ) : (
                <Moon className="h-5 w-5 mr-3 transition-colors" />
              )}
              {isDark ? "Light Mode" : "Dark Mode"}
            </button>

            {/* Profile Menu Items in mobile menu */}
            {profileMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${
                    item.name === "Sign Out"
                      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  } transition-colors duration-200`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}

            {/* User Info in mobile menu */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                  {user?.user_metadata?.name?.charAt(0).toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase() ||
                    "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.user_metadata?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
