
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
      src="/lovable-uploads/8b35696f-2bc1-4438-8bde-64c11d01f9b6.png"
      alt="C. workflow"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}
