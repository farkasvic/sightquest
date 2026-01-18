import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface CategoryCardProps {
  title: string;
  image: string;
  onSelect: () => void;
}

export function CategoryCard({ title, image, onSelect }: CategoryCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-[#7bc950]/30">
      <CardContent className="p-0">
        <div className="relative h-40 w-full bg-zinc-100">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <Button
            onClick={onSelect}
            className="w-full bg-[#7bc950] hover:bg-[#7ce577] text-white"
          >
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
