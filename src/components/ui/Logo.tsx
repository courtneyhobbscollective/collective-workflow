
import { useState, useEffect } from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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

  // Try different file extensions for the uploaded image
  const imagePaths = [
    "/lovable-uploads/273907d9-23e0-40a9-833a-8b366995f252.png",
    "/lovable-uploads/273907d9-23e0-40a9-833a-8b366995f252.jpg",
    "/lovable-uploads/273907d9-23e0-40a9-833a-8b366995f252.jpeg",
    "/lovable-uploads/273907d9-23e0-40a9-833a-8b366995f252.svg",
    "/lovable-uploads/273907d9-23e0-40a9-833a-8b366995f252.webp"
  ];

  const handleImageError = () => {
    console.log(`Failed to load image: ${imagePaths[currentImageIndex]}`);
    
    if (currentImageIndex < imagePaths.length - 1) {
      console.log(`Trying next image format: ${imagePaths[currentImageIndex + 1]}`);
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      console.log("All image formats failed, showing text fallback");
      setImageError(true);
    }
  };

  const handleImageLoad = () => {
    console.log(`Successfully loaded image: ${imagePaths[currentImageIndex]}`);
    setImageError(false);
  };

  // Reset when component mounts or image index changes
  useEffect(() => {
    if (currentImageIndex < imagePaths.length) {
      setImageError(false);
    }
  }, [currentImageIndex]);

  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-primary text-primary-foreground px-3 py-1 rounded font-semibold ${textSizeClasses[size]}`}>
        C. workflow
      </div>
    );
  }

  return (
    <img
      src={imagePaths[currentImageIndex]}
      alt="C. workflow"
      className={`${sizeClasses[size]} ${className}`}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}
