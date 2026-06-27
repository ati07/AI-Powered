import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Standard page layout wrapper with optional title and description.
 */
export function PageContainer({ children, className, title, description }: PageContainerProps) {
  return (
    <div className={cn("flex flex-1 flex-col gap-6 p-6 lg:p-8", className)}>
      {(title || description) && (
        <div className="flex flex-col gap-1">
          {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
