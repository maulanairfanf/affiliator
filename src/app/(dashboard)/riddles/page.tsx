"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Platform } from "@/lib/constants";

interface Riddle {
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
}

export default function RiddlesPage() {
  const [theme, setTheme] = useState("");
  const [riddles, setRiddles] = useState<Riddle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({});

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    setRiddles([]);

    try {
      const res = await fetch("/api/riddles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme || undefined }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to generate");
        return;
      }

      setRiddles(json.data || []);
    } catch {
      setError("Failed to generate riddles");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(index: number) {
    const riddle = riddles[index];
    const scheduledAt = scheduleTimes[index];
    if (!scheduledAt) return;

    setSavingId(String(index));

    try {
      const contentRes = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: Platform.Threads,
          type: "riddle",
          content: riddle.question,
        }),
      });

      const contentJson = await contentRes.json();
      if (!contentRes.ok) throw new Error(contentJson.error);

      const contentId = contentJson.data.id;

      const scheduleRes = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: Platform.Threads,
          contentId,
          scheduledAt,
        }),
      });

      if (!scheduleRes.ok) {
        const err = await scheduleRes.json();
        throw new Error(err.error || "Failed to schedule");
      }

      setScheduleTimes((prev) => ({ ...prev, [index]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  const themes = [
    { value: "", label: "Random" },
    { value: "hewan", label: "Hewan" },
    { value: "makanan", label: "Makanan & Minuman" },
    { value: "benda", label: "Benda Sehari-hari" },
    { value: "nama orang", label: "Nama Orang" },
    { value: "tempat", label: "Tempat" },
  ];

  const placeholderTheme = themes.find((t) => t.value === theme)?.label || theme;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Riddles</h1>

      <Card className="mb-6 p-4">
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44"
            >
              {themes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <Input
              placeholder="Or type custom theme..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full sm:flex-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
            </Card>
          ))}
        </div>
      )}

      {riddles.length > 0 && (
        <div className="space-y-3">
          {riddles.map((riddle, i) => (
            <Card key={i} className="p-4">
              <p className="font-medium">{riddle.question}</p>
              {riddle.hint && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  💡 Hint: {riddle.hint}
                </p>
              )}
              <details className="mt-1">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Show Answer
                </summary>
                <p className="mt-1 text-sm font-medium text-green-600 dark:text-green-400">
                  {riddle.answer}
                </p>
                {riddle.explanation && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    🤔 {riddle.explanation}
                  </p>
                )}
              </details>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="datetime-local"
                  value={scheduleTimes[i] || ""}
                  onChange={(e) =>
                    setScheduleTimes((prev) => ({
                      ...prev,
                      [i]: e.target.value,
                    }))
                  }
                  className="w-full sm:w-auto"
                  min={new Date()
                    .toISOString()
                    .slice(0, 16)}
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(i)}
                  disabled={savingId === String(i) || !scheduleTimes[i]}
                >
                  {savingId === String(i) ? "Saving..." : "Schedule Post"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
