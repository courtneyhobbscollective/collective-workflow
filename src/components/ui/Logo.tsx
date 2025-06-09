
import { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-primary text-primary-foreground px-3 py-1 rounded font-semibold ${textSizeClasses[size]}`}>
        C. workflow
      </div>
    );
  }

  return (
    <img
      src="/lovable-uploads/24789421-1542-44d8-95f7-8eab431238e3.png"
      alt="C. workflow"
      className={`${sizeClasses[size]} ${className}`}
      onError={() => setImageError(true)}
    />
  );
}
