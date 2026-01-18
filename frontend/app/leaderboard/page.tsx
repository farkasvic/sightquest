"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LeaderboardPage() {
  // Mock leaderboard data - replace with actual data
  const [leaderboard] = useState([
    { id: 1, rank: 1, username: "AdventureKing", avatar: "/avatars/user1.jpg", exp: 15420 },
    { id: 2, rank: 2, username: "ExplorerPro", avatar: "/avatars/user2.jpg", exp: 14850 },
    { id: 3, rank: 3, username: "QuestMaster", avatar: "/avatars/user3.jpg", exp: 13200 },
    { id: 4, rank: 4, username: "CityScout", avatar: "/avatars/user4.jpg", exp: 11750 },
    { id: 5, rank: 5, username: "WandererMax", avatar: "/avatars/user5.jpg", exp: 10980 },
    { id: 6, rank: 6, username: "MapExplorer", avatar: "/avatars/user6.jpg", exp: 9560 },
    { id: 7, rank: 7, username: "TravelBug", avatar: "/avatars/user7.jpg", exp: 8890 },
    { id: 8, rank: 8, username: "Discoverer", avatar: "/avatars/user8.jpg", exp: 7650 },
    { id: 9, rank: 9, username: "UrbanHiker", avatar: "/avatars/user9.jpg", exp: 6420 },
    { id: 10, rank: 10, username: "RouteSeeker", avatar: "/avatars/user10.jpg", exp: 5230 },
  ]);

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
        <h1 className="text-xl font-bold text-zinc-900">Leaderboard</h1>
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
      <main className="px-4 py-6 max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm border-[#7bc950]/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#7bc950]" />
              <CardTitle>Top Explorers</CardTitle>
            </div>
            <CardDescription>
              See who's leading the quest for discovery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md bg-white border-zinc-200"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 flex-shrink-0">
                    <span className="text-sm font-bold text-zinc-600">#{user.rank}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="bg-[#7bc950] text-white font-semibold text-xs">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-zinc-900 truncate">
                      {user.username}
                    </h3>
                  </div>

                  {/* Experience */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-[#7bc950]">
                      {user.exp.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-600">EXP</p>
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
