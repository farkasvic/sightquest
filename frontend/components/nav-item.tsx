import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NavItemProps {
  label: string;
  onClick?: () => void;
  href?: string;
}

export function NavItem({ label, onClick, href }: NavItemProps) {
  if (href) {
    return (
      <Link href={href} onClick={onClick}>
        <Button
          variant="ghost"
          className="w-full justify-start text-left text-lg font-bold hover:bg-[#b6efd4]/30 hover:text-[#7bc950] py-6 transition-all"
        >
          {label}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      className="justify-start text-left text-lg font-bold hover:bg-[#b6efd4]/30 hover:text-[#7bc950] py-6 transition-all"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}
