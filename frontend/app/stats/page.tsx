"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Footprints, Trophy, Award, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StampCard } from "@/components/stamp-card";

export default function StatsPage() {
  // Mock data - replace with actual user data
  const [totalExp] = useState(2450);
  const [dailySteps] = useState(8543);
  const [stepGoal] = useState(10000);
  const [stamps] = useState([
    { id: 1, name: "Golden Gate Park", category: "Parks & Nature", date: "2026-01-15", image: "/category_photo/park.jpg" },
    { id: 2, name: "Pier 39", category: "Attractions", date: "2026-01-14", image: "/category_photo/attraction.jpg" },
    { id: 3, name: "Blue Bottle Coffee", category: "Cafes & Coffee", date: "2026-01-13", image: "/category_photo/cafe.jpg" },
    { id: 4, name: "Ferry Building", category: "Landmarks", date: "2026-01-12", image: "/category_photo/landmark.jpg" },
    { id: 5, name: "The Grove", category: "Restaurants", date: "2026-01-11", image: "/category_photo/restaurant.jpg" },
  ]);
  
  const [badges] = useState([
    { id: 1, name: "First Steps", description: "Complete your first quest", icon: "🎯", unlocked: true },
    { id: 2, name: "Explorer", description: "Visit 5 different locations", icon: "🗺️", unlocked: true },
    { id: 3, name: "Coffee Lover", description: "Visit 3 cafes", icon: "☕", unlocked: false },
    { id: 4, name: "Nature Enthusiast", description: "Visit 5 parks", icon: "🌲", unlocked: false },
    { id: 5, name: "City Guide", description: "Visit 10 landmarks", icon: "🏙️", unlocked: false },
    { id: 6, name: "Master Explorer", description: "Complete 20 quests", icon: "🏆", unlocked: false },
  ]);

  const stepPercentage = Math.min((dailySteps / stepGoal) * 100, 100);
  const totalStamps = stamps.length;
  const unlockedBadges = badges.filter(badge => badge.unlocked).length;
  const totalBadges = badges.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#b6efd4] via-[#9cffd9] to-[#a0ccda]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md border-b border-[#7bc950]/20">
        <Link href="/explore">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6 text-zinc-900" />
            <span className="sr-only">Back to explore</span>
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-zinc-900">Your Stats</h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
              avatarImage: "w-10 h-10",
            },
          }}
        />
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Summary Stats Card */}
        <Card className="bg-white/90 backdrop-blur-sm border-[#7bc950]/30">
          <CardContent className="p-6">
            {/* Total EXP - Top Section */}
            <div className="text-center pb-6">
              <Trophy className="h-10 w-10 text-[#7bc950] mx-auto mb-3" />
              <div className="text-5xl font-bold text-[#7bc950]">
                {totalExp.toLocaleString()}
              </div>
              <p className="text-sm text-zinc-600 mt-2">
                Total EXP
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-200 my-4" />

            {/* Stamps and Badges - Bottom Section */}
            <div className="grid grid-cols-2 gap-6">
              {/* Stamps Collected - Left */}
              <div className="text-center">
                <MapPin className="h-8 w-8 text-[#7ce577] mx-auto mb-2" />
                <div className="text-3xl font-bold text-[#7ce577]">
                  {totalStamps}
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Stamps Collected
                </p>
              </div>

              {/* Badges Unlocked - Right */}
              <div className="text-center">
                <Award className="h-8 w-8 text-[#a0ccda] mx-auto mb-2" />
                <div className="text-3xl font-bold text-[#a0ccda]">
                  {unlockedBadges} / {totalBadges}
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Badges Unlocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Step Count Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-[#7bc950]/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Footprints className="h-6 w-6 text-[#7bc950]" />
              <CardTitle>Daily Step Count</CardTitle>
            </div>
            <CardDescription>Track your daily walking progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-[#7bc950]">
                {dailySteps.toLocaleString()}
              </div>
              <p className="text-sm text-zinc-600">
                of {stepGoal.toLocaleString()} steps goal
              </p>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#7bc950] to-[#7ce577] h-full transition-all duration-500 rounded-full"
                style={{ width: `${stepPercentage}%` }}
              />
            </div>
            <p className="text-center text-sm text-zinc-600">
              {stepPercentage.toFixed(0)}% of daily goal
            </p>
          </CardContent>
        </Card>

        {/* Passport Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-[#a0ccda]/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#a0ccda]" />
              <CardTitle>Your Passport</CardTitle>
            </div>
            <CardDescription>
              {stamps.length} {stamps.length === 1 ? 'stamp' : 'stamps'} collected
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {stamps.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <p>No stamps yet! Complete quests to earn stamps.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stamps.map((stamp) => (
                  <StampCard
                    key={stamp.id}
                    name={stamp.name}
                    category={stamp.category}
                    date={stamp.date}
                    image={stamp.image}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-[#7ce577]/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-[#7ce577]" />
              <CardTitle>Achievements</CardTitle>
            </div>
            <CardDescription>
              {badges.filter(b => b.unlocked).length} of {badges.length} badges earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-[#7bc950]/10 to-[#7ce577]/10 border-[#7bc950]'
                      : 'bg-zinc-100 border-zinc-300 opacity-50'
                  }`}
                >
                  <div className={`text-4xl ${badge.unlocked ? '' : 'grayscale'}`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-zinc-900">{badge.name}</h3>
                    <p className="text-sm text-zinc-600">{badge.description}</p>
                    {badge.unlocked && (
                      <p className="text-xs text-[#7bc950] font-medium">✓ Unlocked</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
