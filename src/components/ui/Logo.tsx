
import { useState } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(0);
  
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

  // Try multiple possible paths for the uploaded logo
  const imageSources = [
    "/lovable-uploads/24789421-1542-44d8-95f7-8eab431238e3.png",
    "/lovable-uploads/24789421-1542-44d8-95f7-8eab431238e3.jpg", 
    "/lovable-uploads/24789421-1542-44d8-95f7-8eab431238e3.jpeg",
    "/lovable-uploads/24789421-1542-44d8-95f7-8eab431238e3.webp"
  ];

  const handleImageError = (error: any) => {
    console.log(`Logo image failed to load: ${imageSources[currentSrc]}`, error);
    console.log(`Error type: ${error.type}, Error target src: ${error.target.src}`);
    
    // Try next image source
    if (currentSrc < imageSources.length - 1) {
      console.log(`Trying next image source: ${imageSources[currentSrc + 1]}`);
      setCurrentSrc(currentSrc + 1);
    } else {
      console.log("All image sources failed, showing text fallback");
      setImageError(true);
    }
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
      src={imageSources[currentSrc]}
      alt="C. workflow"
      className={`${sizeClasses[size]} ${className}`}
      onError={handleImageError}
      onLoad={() => console.log(`Logo loaded successfully: ${imageSources[currentSrc]}`)}
    />
  );
}
