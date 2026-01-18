import { Button } from "@/components/ui/button";

interface NavItemProps {
  label: string;
  onClick?: () => void;
}

export function NavItem({ label, onClick }: NavItemProps) {
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
