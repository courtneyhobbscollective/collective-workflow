
interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  };

  return (
    <img
      src="/lovable-uploads/c1bdf4c1-36f7-4e46-8a6e-e8b08ae8fced.png"
      alt="Collectflow"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}
