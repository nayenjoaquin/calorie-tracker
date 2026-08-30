"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "@/components/store-provider";
import type { Goals } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GOAL_FIELDS = [
  ["calories", "Calories"],
  ["protein", "Protein (g)"],
  ["carbs", "Carbs (g)"],
  ["fat", "Fat (g)"],
  ["weightKg", "Target weight (kg)"],
] as const;

export function SettingsView() {
  const { data, ready, setDisplayName, setGoals } = useStore();

  if (!ready) {
    return (
      <div className="animate-pulse py-10 text-sm text-[color:var(--quiet)]">
        Loading settings…
      </div>
    );
  }

  return (
    <SettingsEditor
      displayName={data.displayName}
      goals={data.goals}
      onSaveName={setDisplayName}
      onSaveGoals={setGoals}
    />
  );
}

function SettingsEditor({
  displayName,
  goals,
  onSaveName,
  onSaveGoals,
}: {
  displayName: string;
  goals: Goals;
  onSaveName: (name: string) => void;
  onSaveGoals: (goals: Goals) => void;
}) {
  const [nameDraft, setNameDraft] = useState(displayName);
  const [goalDraft, setGoalDraft] = useState(goals);
  const [saved, setSaved] = useState<"profile" | "targets" | null>(null);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(null), 1800);
    return () => window.clearTimeout(t);
  }, [saved]);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    onSaveName(nameDraft);
    setSaved("profile");
  }

  function saveTargets(e: React.FormEvent) {
    e.preventDefault();
    onSaveGoals(goalDraft);
    setSaved("targets");
  }

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
          Profile and daily targets for this device.
        </p>
      </div>

      <form
        onSubmit={saveProfile}
        className="animate-rise-delay space-y-4 rounded-[1.25rem] bg-[color:var(--surface)] p-4 ring-1 ring-[color:var(--line)]/80"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--ink)]">
            Profile
          </h2>
          <p className="mt-0.5 text-sm text-[color:var(--quiet)]">
            How you appear in your diary.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            autoComplete="nickname"
            className="h-11 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full gap-2 rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
        >
          {saved === "profile" ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : (
            "Save name"
          )}
        </Button>
      </form>

      <form
        onSubmit={saveTargets}
        className="animate-rise-delay-2 space-y-4 rounded-[1.25rem] bg-[color:var(--surface)] p-4 ring-1 ring-[color:var(--line)]/80"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--ink)]">
            Daily targets
          </h2>
          <p className="mt-0.5 text-sm text-[color:var(--quiet)]">
            Calorie, macro, and weight goals.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {GOAL_FIELDS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`goal-${key}`}>{label}</Label>
              <Input
                id={`goal-${key}`}
                type="number"
                min={0}
                step={key === "weightKg" ? 0.1 : 1}
                className="h-11 rounded-xl"
                value={goalDraft[key]}
                onChange={(e) =>
                  setGoalDraft((g) => ({
                    ...g,
                    [key]: Number(e.target.value),
                  }))
                }
              />
            </div>
          ))}
        </div>
        <Button
          type="submit"
          className="h-11 w-full gap-2 rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
        >
          {saved === "targets" ? (
            <>
              <Check className="size-4" /> Saved
            </>
          ) : (
            "Save targets"
          )}
        </Button>
      </form>
    </div>
  );
}
