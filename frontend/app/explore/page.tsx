"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { Menu, Play, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function ExplorePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
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

      try {
        // Load the Google Maps script dynamically
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
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

        script.onerror = () => {
          console.error("Error loading Google Maps script");
          setIsMapLoading(false);
        };

        document.head.appendChild(script);

        // Cleanup
        return () => {
          const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
          if (existingScript) {
            existingScript.remove();
          }
        };
      } catch (error) {
        console.error("Error loading Google Maps:", error);
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
      <nav className="relative z-10 flex items-center justify-between px-4 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-[#7bc950]/20">
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
          <SheetContent side="left" className="w-[280px] bg-white dark:bg-zinc-900">
            <SheetHeader>
              <SheetTitle className="text-[#7bc950]">Menu</SheetTitle>
              <SheetDescription>Navigate your adventure</SheetDescription>
            </SheetHeader>
            <div className="mt-8 flex flex-col gap-4">
              <Button
                variant="ghost"
                className="justify-start text-left hover:bg-[#b6efd4]/20 hover:text-[#7bc950]"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Home
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-left hover:bg-[#b6efd4]/20 hover:text-[#7bc950]"
                onClick={() => setIsMenuOpen(false)}
              >
                🗺️ Active Quests
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-left hover:bg-[#b6efd4]/20 hover:text-[#7bc950]"
                onClick={() => setIsMenuOpen(false)}
              >
                🏆 Passport
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-left hover:bg-[#b6efd4]/20 hover:text-[#7bc950]"
                onClick={() => setIsMenuOpen(false)}
              >
                ⚙️ Settings
              </Button>
              <Button
                variant="ghost"
                className="justify-start text-left hover:bg-[#b6efd4]/20 hover:text-[#7bc950]"
                onClick={() => setIsMenuOpen(false)}
              >
                📊 Leaderboard
              </Button>
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
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </nav>

      {/* Large Play Button at Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <Button
          size="icon"
          className="h-20 w-20 rounded-full bg-[#7bc950] hover:bg-[#7ce577] shadow-2xl shadow-[#7bc950]/50 transition-all hover:scale-110 active:scale-95"
        >
          <Play className="h-10 w-10 text-white fill-white ml-1" />
          <span className="sr-only">Start quest</span>
        </Button>
        <p className="text-center mt-3 text-sm font-medium text-white drop-shadow-lg">
          Start Quest
        </p>
      </div>
    </div>
  );
}
