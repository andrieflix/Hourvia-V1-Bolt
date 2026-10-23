import type { ReactNode } from "react";
import { Construction } from "lucide-react";
import { Badge, Card } from "./ui";

interface PreviewPageProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function PreviewPage({ title, description, icon, children }: PreviewPageProps) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{title}</h1>
            <Badge variant="preview">Preview</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">{description}</p>
        </div>
      </div>
      <Card className="p-12">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 mb-6">
            <Construction className="w-8 h-8 text-teal-500" />
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            This section is a preview
          </h2>
          <p className="text-sm text-muted leading-relaxed">
            {title} is planned for a future sprint. The navigation, routing, and layout are in place,
            but business operations are not yet activated.
          </p>
          {children}
        </div>
      </Card>
    </div>
  );
}
