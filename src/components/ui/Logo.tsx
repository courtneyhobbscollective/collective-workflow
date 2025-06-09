
interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    xs: "h-3 w-auto",
    sm: "h-8 w-auto",
    md: "h-12 w-auto", 
    lg: "h-16 w-auto"
  };

  return (
    <img
      src="/lovable-uploads/0f9673d4-9574-490b-923a-826e09396af3.png"
      alt="C. workflow"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
}
