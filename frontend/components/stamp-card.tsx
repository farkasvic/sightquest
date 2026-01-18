import Image from "next/image";

interface StampCardProps {
  name: string;
  category: string;
  date: string;
  image: string;
}

export function StampCard({ name, category, date, image }: StampCardProps) {
  return (
    <div 
      className="relative rounded-lg p-4 text-center space-y-2 shadow-md hover:shadow-lg transition-shadow"
      style={{
        backgroundImage: "url('/graphics/stamp.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Photo */}
      <div className="relative w-full aspect-square">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded"
        />
      </div>
      <h3 className="font-semibold text-sm text-zinc-900 line-clamp-2">
        {name}
      </h3>
      <p className="text-xs text-zinc-600">{category}</p>
      <p className="text-xs text-zinc-500">{date}</p>
    </div>
  );
}
