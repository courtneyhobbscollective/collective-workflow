
import { Circle, PoundSterling } from "lucide-react";

interface PoundSterlingIconProps {
  className?: string;
}

export function PoundSterlingIcon({ className = "w-4 h-4" }: PoundSterlingIconProps) {
  return (
    <div className={`relative ${className}`}>
      <Circle className="w-full h-full text-current" fill="currentColor" fillOpacity="0.1" />
      <PoundSterling className="absolute inset-0 w-3 h-3 m-auto text-current" strokeWidth={2.5} />
    </div>
  );
}
