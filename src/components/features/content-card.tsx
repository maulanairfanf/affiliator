"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentCardProps {
  type: string;
  content: string;
  isStreaming?: boolean;
  onSave?: () => void;
  className?: string;
}

const typeLabels: Record<string, string> = {
  long_caption: "Long Caption",
  hook: "Hooks",
  cta: "Call to Action",
  hashtag: "Hashtags",
  product_summary: "Product Summary",
};

export function ContentCard({ type, content, isStreaming, onSave, className }: ContentCardProps) {
  return (
    <Card className={cn("p-4", isStreaming && "border-primary/50", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{typeLabels[type] || type}</Badge>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Generating...
            </span>
          )}
        </div>
        {!isStreaming && content && onSave && (
          <Button size="xs" variant="outline" onClick={onSave}>
            Save
          </Button>
        )}
      </div>
      <div
        className={cn(
          "whitespace-pre-wrap text-sm",
          isStreaming && "after:inline-block after:h-4 after:w-0.5 after:animate-pulse after:bg-primary"
        )}
      >
        {content || (isStreaming ? "" : "No content yet")}
      </div>
    </Card>
  );
}
