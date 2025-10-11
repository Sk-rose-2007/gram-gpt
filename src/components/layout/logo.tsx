import { Leaf } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2.5 p-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Leaf className="h-5 w-5" />
      </div>
      <span className="text-lg font-bold text-foreground">Verdant Sentinel</span>
    </div>
  );
}
