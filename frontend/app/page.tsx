"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { MapPin, Compass, Trophy, Map } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#b6efd4] via-[#9cffd9] to-[#a0ccda] dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
      {/* Header with Auth */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border-b border-[#7bc950]/20">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="h-8 w-8 text-[#7bc950] dark:text-[#7ce577]" />
            <Compass className="h-4 w-4 text-[#a0ccda] dark:text-[#9cffd9] absolute -bottom-0.5 -right-0.5" />
          </div>
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Sight Quest
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-[#7bc950] hover:bg-[#7ce577] text-white dark:bg-[#7bc950] dark:hover:bg-[#7ce577]">
                Get Started
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
          </SignedIn>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Discover Hidden Gems
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Explore your area through riddles and scavenger hunts. Find landmarks, collect stamps, and create your passport of adventures.
            </p>
          </div>

          <SignedOut>
            {/* Features Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              <Card className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-[#7bc950]/30">
                <CardHeader>
                  <div className="mb-2">
                    <Map className="h-8 w-8 text-[#7bc950] dark:text-[#7ce577]" />
                  </div>
                  <CardTitle>Set Your Area</CardTitle>
                  <CardDescription>
                    Choose a radius to explore and filter by categories like restaurants, attractions, and more.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-[#a0ccda]/30">
                <CardHeader>
                  <div className="mb-2">
                    <Compass className="h-8 w-8 text-[#a0ccda] dark:text-[#9cffd9]" />
                  </div>
                  <CardTitle>Solve Riddles</CardTitle>
                  <CardDescription>
                    Get AI-generated riddles that describe hidden locations. Use clues to find each landmark.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm border-[#7ce577]/30">
                <CardHeader>
                  <div className="mb-2">
                    <Trophy className="h-8 w-8 text-[#7ce577] dark:text-[#9cffd9]" />
                  </div>
                  <CardTitle>Collect Stamps</CardTitle>
                  <CardDescription>
                    Take photos to verify your discoveries. Build your passport with stamps from every location you find.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* CTA */}
            <div className="flex justify-center mt-8">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-[#7bc950] hover:bg-[#7ce577] text-white dark:bg-[#7bc950] dark:hover:bg-[#7ce577] text-lg px-8 shadow-lg shadow-[#7bc950]/30">
                  Start Your Adventure
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            {/* Dashboard for signed-in users */}
            <div className="flex justify-center">
              <Card className="border-[#7bc950]/30 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Welcome back, Explorer!</CardTitle>
                  <CardDescription className="text-center">
                    Ready to continue your adventure?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/explore" className="block">
                    <Button className="bg-[#7bc950] hover:bg-[#7ce577] text-white dark:bg-[#7bc950] dark:hover:bg-[#7ce577] h-auto py-4 w-full">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">Start New Quest</span>
                      </div>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </SignedIn>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </footer>
    </div>
  );
}
