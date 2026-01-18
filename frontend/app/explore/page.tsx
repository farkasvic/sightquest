"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { Menu, Loader2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { NavItem } from "@/components/nav-item";
import { CategoryCard } from "@/components/category-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export default function ExplorePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationCount, setLocationCount] = useState(3);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.error("Google Maps API key is missing");
        setIsMapLoading(false);
        return;
      }

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        return;
      }

      try {
        // Load the Google Maps script dynamically
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = initializeMap;

        script.onerror = () => {
          console.error("Error loading Google Maps script");
          setIsMapLoading(false);
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setIsMapLoading(false);
      }
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            // Initialize map centered on user location
            const map = new google.maps.Map(mapRef.current!, {
              center: userLocation,
              zoom: 15,
              disableDefaultUI: true,
              zoomControl: true,
              zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER,
              },
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "on" }],
                },
              ],
            });

            googleMapRef.current = map;

            // Add user location marker
            const userMarker = new google.maps.Marker({
              position: userLocation,
              map: map,
              title: "Your Location",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#7bc950",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
              },
            });

            userMarkerRef.current = userMarker;

            // Add circle around user location (search radius visualization)
            new google.maps.Circle({
              map: map,
              center: userLocation,
              radius: 1000, // 1km radius
              fillColor: "#7bc950",
              fillOpacity: 0.1,
              strokeColor: "#7bc950",
              strokeOpacity: 0.4,
              strokeWeight: 2,
            });

            setIsMapLoading(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            // Default to a location if user denies geolocation
            const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco
            
            const map = new google.maps.Map(mapRef.current!, {
              center: defaultLocation,
              zoom: 13,
              disableDefaultUI: true,
              zoomControl: true,
            });

            googleMapRef.current = map;
            setIsMapLoading(false);
          }
        );
      } else {
        // Browser doesn't support geolocation
        const defaultLocation = { lat: 37.7749, lng: -122.4194 };
        
        const map = new google.maps.Map(mapRef.current!, {
          center: defaultLocation,
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
        });

        googleMapRef.current = map;
        setIsMapLoading(false);
      }
    };

    initMap();
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Google Maps Container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Loading Indicator */}
      {isMapLoading && (
        <div className="absolute inset-0 z-5 flex items-center justify-center bg-[#b6efd4]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#7bc950] mx-auto" />
            <p className="text-zinc-700 font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="relative z-10 flex items-center justify-between px-3 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-[#7bc950]/20">
        {/* Hamburger Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-900 dark:text-zinc-50"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-white dark:bg-zinc-900 p-0 [&>button]:text-white [&>button]:hover:text-white/80">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Navigate your adventure</SheetDescription>
            </SheetHeader>
            <div className="bg-[#7bc950] p-6">
              <h2 className="text-xl font-semibold text-white">Menu</h2>
              <p className="text-sm text-white/90 mt-1">Navigate your adventure</p>
            </div>
            <div className="p-6 flex flex-col gap-2">
              <NavItem label="Home" onClick={() => setIsMenuOpen(false)} />
              <NavItem label="Active Quests" onClick={() => setIsMenuOpen(false)} />
              <NavItem label="Passport" onClick={() => setIsMenuOpen(false)} />
              <NavItem label="Settings" onClick={() => setIsMenuOpen(false)} />
              <NavItem label="Leaderboard" onClick={() => setIsMenuOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Explore
          </h1>
        </div>

        {/* Profile Avatar */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-15 h-15",
              avatarImage: "w-15 h-15",
            },
          }}
        />
      </nav>

      {/* Large Play Button at Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <Button
          size="icon"
          onClick={() => setIsCategoryDialogOpen(true)}
          className="h-20 w-20 rounded-full bg-white hover:bg-white shadow-2xl shadow-[#7bc950]/50 transition-all hover:scale-110 active:scale-95 p-0"
        >
          <Image 
            src="/play.svg" 
            alt="Play" 
            width={80} 
            height={80}
            className="w-full h-full"
          />
          <span className="sr-only">Start quest</span>
        </Button>
      </div>

      {/* Category Selection Drawer */}
      <Drawer open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) {
          setSelectedCategory(null);
          setLocationCount(3);
        }
      }}>
        <DrawerContent className="h-[85vh]">
          {!selectedCategory ? (
            // Step 1: Category Selection
            <>
              <div className="bg-[#7bc950] px-6 py-4">
                <DrawerTitle className="text-2xl font-bold text-white">Choose Your Quest Category</DrawerTitle>
                <DrawerDescription className="text-sm text-white/90 mt-1">Select a category to start discovering locations nearby</DrawerDescription>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <CategoryCard
                    title="Restaurants"
                    image="/category_photo/restaurant.jpg"
                    onSelect={() => setSelectedCategory("Restaurants")}
                  />
                  <CategoryCard
                    title="Parks & Nature"
                    image="/category_photo/park.jpg"
                    onSelect={() => setSelectedCategory("Parks & Nature")}
                  />
                  <CategoryCard
                    title="Attractions"
                    image="/category_photo/attraction.jpg"
                    onSelect={() => setSelectedCategory("Attractions")}
                  />
                  <CategoryCard
                    title="Landmarks"
                    image="/category_photo/landmark.jpg"
                    onSelect={() => setSelectedCategory("Landmarks")}
                  />
                  <CategoryCard
                    title="Cafes & Coffee"
                    image="/category_photo/cafe.jpg"
                    onSelect={() => setSelectedCategory("Cafes & Coffee")}
                  />
                </div>
              </div>
            </>
          ) : (
            // Step 2: Location Count Selection
            <>
              <div className="bg-[#7bc950] px-6 py-4">
                <DrawerTitle className="text-2xl font-bold text-white">How Many Locations?</DrawerTitle>
                <DrawerDescription className="text-sm text-white/90 mt-1">Choose how many {selectedCategory.toLowerCase()} to discover</DrawerDescription>
              </div>
              <div className="p-6 flex flex-col items-center justify-center flex-1 gap-8">
                <div className="flex items-center gap-6">
                  <Button
                    size="icon"
                    onClick={() => setLocationCount(Math.max(1, locationCount - 1))}
                    disabled={locationCount <= 1}
                    className="h-16 w-16 rounded-full bg-[#7bc950] hover:bg-[#7ce577] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-8 w-8" />
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-7xl font-bold text-[#7bc950]">{locationCount}</div>
                    <p className="text-sm text-zinc-600 mt-2">Location{locationCount !== 1 ? 's' : ''}</p>
                  </div>
                  
                  <Button
                    size="icon"
                    onClick={() => setLocationCount(Math.min(5, locationCount + 1))}
                    disabled={locationCount >= 5}
                    className="h-16 w-16 rounded-full bg-[#7bc950] hover:bg-[#7ce577] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-8 w-8" />
                  </Button>
                </div>
                
                <div className="flex gap-3 w-full max-w-md">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory(null)}
                    className="flex-1 border-[#7bc950] text-[#7bc950] hover:bg-[#b6efd4]/20"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      console.log(`Starting quest: ${selectedCategory}, ${locationCount} locations`);
                      setIsCategoryDialogOpen(false);
                      setSelectedCategory(null);
                      setLocationCount(3);
                    }}
                    className="flex-1 bg-[#7bc950] hover:bg-[#7ce577] text-white"
                  >
                    Start Quest
                  </Button>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
