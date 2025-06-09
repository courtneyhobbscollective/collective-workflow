
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
      src="/lovable-uploads/82a3af5b-1314-48af-b30a-52ed62206b8c.png"
      alt="C. workflow"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}
