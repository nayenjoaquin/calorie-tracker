"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import {
  ProfileAvatar,
  fileToAvatarDataUrl,
} from "@/components/profile-avatar";
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
  const { data, ready, setDisplayName, setAvatar, setGoals } = useStore();

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
      avatarUrl={data.avatarUrl}
      goals={data.goals}
      onSaveName={setDisplayName}
      onSaveAvatar={setAvatar}
      onSaveGoals={setGoals}
    />
  );
}

function SettingsEditor({
  displayName,
  avatarUrl,
  goals,
  onSaveName,
  onSaveAvatar,
  onSaveGoals,
}: {
  displayName: string;
  avatarUrl: string;
  goals: Goals;
  onSaveName: (name: string) => void;
  onSaveAvatar: (avatarUrl: string) => void;
  onSaveGoals: (goals: Goals) => void;
}) {
  const [nameDraft, setNameDraft] = useState(displayName);
  const [avatarDraft, setAvatarDraft] = useState(avatarUrl);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    onSaveAvatar(avatarDraft);
    setSaved("profile");
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    try {
      setAvatarDraft(await fileToAvatarDataUrl(file));
      setAvatarError(null);
    } catch {
      setAvatarError("Couldn't read that image. Try a JPEG or PNG.");
    }
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
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
            aria-label={avatarDraft ? "Change profile picture" : "Add profile picture"}
          >
            <ProfileAvatar
              src={avatarDraft}
              name={nameDraft}
              className="size-20 text-2xl ring-1 ring-[color:var(--line)]"
            />
            <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full bg-[color:var(--brand)] text-white ring-2 ring-[color:var(--surface)] transition-colors group-hover:bg-[color:var(--brand-deep)]">
              <Camera className="size-3.5" />
            </span>
          </button>
          <div className="flex flex-col items-start gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarDraft ? "Change photo" : "Upload photo"}
            </Button>
            {avatarDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full text-[color:var(--quiet)]"
                onClick={() => {
                  setAvatarDraft("");
                  setAvatarError(null);
                }}
              >
                <Trash2 className="size-3.5" /> Remove
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickAvatar}
          />
        </div>
        {avatarError && (
          <p className="text-sm text-[color:var(--destructive)]" role="alert">
            {avatarError}
          </p>
        )}
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
            "Save profile"
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
