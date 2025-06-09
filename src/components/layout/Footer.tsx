
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Logo size="sm" />
            <span className="text-sm text-muted-foreground">
              © 2025 Collective Digital Ltd. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
