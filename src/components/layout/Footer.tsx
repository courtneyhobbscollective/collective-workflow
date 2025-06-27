import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto">
      <div className="px-4 py-6 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <Logo size="xs" />
          </div>
          <div className="ml-auto">
            <span className="text-sm text-muted-foreground">
              © 2025 Collective Digital Ltd. All Rights Reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
