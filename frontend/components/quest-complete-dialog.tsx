"use client";

import { Button } from "@/components/ui/button";
import { Footprints, MapPin, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface QuestCompleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questStats: {
    steps: number;
    stamps: number;
    exp: number;
  };
  locationCount: number;
  onContinue: () => void;
}

export function QuestCompleteDialog({
  open,
  onOpenChange,
  questStats,
  locationCount,
  onContinue,
}: QuestCompleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-[#7bc950]">
            Quest Complete! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            Great job, Explorer! Here are your quest stats:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Total Steps */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#b6efd4]/30 to-[#9cffd9]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#7bc950] p-2 rounded-full">
                <Footprints className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-zinc-600">Total Steps</p>
                <p className="text-2xl font-bold text-zinc-900">{questStats.steps.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Stamps Collected */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#9cffd9]/30 to-[#7ce577]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#7ce577] p-2 rounded-full">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-zinc-600">Stamps Collected</p>
                <p className="text-2xl font-bold text-zinc-900">{questStats.stamps} / {locationCount}</p>
              </div>
            </div>
          </div>

          {/* EXP Gained */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#7ce577]/30 to-[#a0ccda]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#a0ccda] p-2 rounded-full">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-zinc-600">EXP Gained</p>
                <p className="text-2xl font-bold text-zinc-900">+{questStats.exp}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onContinue}
            className="w-full bg-[#7bc950] hover:bg-[#7ce577] text-white py-6 text-lg font-semibold"
          >
            Continue Exploring
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
