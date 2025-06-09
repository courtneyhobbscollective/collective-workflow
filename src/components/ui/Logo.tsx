
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
      src="/lovable-uploads/997cbb31-bb02-423d-814c-b2d5da7896ec.png"
      alt="Collectflow"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}
