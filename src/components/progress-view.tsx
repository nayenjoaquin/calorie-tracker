"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/components/store-provider";
import { newId, todayISO } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProgressView() {
  const { data, ready, saveWeight, removeWeight } = useStore();
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const chartData = useMemo(
    () =>
      [...data.weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((w) => ({
          date: w.date.slice(5),
          fullDate: w.date,
          kg: w.weightKg,
        })),
    [data.weights],
  );

  const latest = data.weights.length
    ? [...data.weights].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null;

  const delta =
    latest && data.goals.weightKg
      ? round1(latest.weightKg - data.goals.weightKg)
      : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const kg = Number(weight);
    if (!date || !Number.isFinite(kg) || kg <= 0) {
      setError("Enter a valid date and weight.");
      return;
    }
    setError(null);
    saveWeight({
      id: newId(),
      date,
      weightKg: round1(kg),
      note: note.trim(),
    });
    setWeight("");
    setNote("");
  }

  if (!ready) {
    return (
      <div className="animate-pulse py-10 text-sm text-[color:var(--quiet)]">
        Loading progress…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
          Progress
        </h1>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
          Weigh-ins stay on this device.
        </p>
      </div>

      <div className="animate-rise-delay grid grid-cols-3 gap-2">
        <Stat
          label="Latest"
          value={latest ? `${latest.weightKg}` : "—"}
          unit={latest ? "kg" : undefined}
          hint={latest?.date ?? "None yet"}
        />
        <Stat
          label="Target"
          value={`${data.goals.weightKg}`}
          unit="kg"
          hint="Goal"
        />
        <Stat
          label="Delta"
          value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
          unit={delta == null ? undefined : "kg"}
          hint="vs target"
        />
      </div>

      <section className="animate-rise-delay-2 rounded-[1.25rem] bg-[color:var(--surface)] p-3 ring-1 ring-[color:var(--line)]/80 sm:p-4">
        {chartData.length < 2 ? (
          <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-[color:var(--quiet)]">
            {chartData.length === 0
              ? "Log two weigh-ins to see your trend."
              : "One point logged — add another day."}
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="rgba(16,24,32,0.08)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7785", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#6b7785", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e4e9ef",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value) => [`${value} kg`, "Weight"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullDate ?? ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="#0f9d8a"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: "#0f9d8a", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-[1.25rem] bg-[color:var(--surface)] p-4 ring-1 ring-[color:var(--line)]/80"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--ink)]">
          Log weight
        </h2>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="w-date">Date</Label>
              <Input
                id="w-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-kg">Weight (kg)</Label>
              <Input
                id="w-kg"
                type="number"
                step="0.1"
                min="1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="74.2"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-note">Note</Label>
            <Input
              id="w-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="h-11 rounded-xl"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-[color:var(--brand)] text-white hover:bg-[color:var(--brand-deep)]"
        >
          Save weigh-in
        </Button>
      </form>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[color:var(--ink)]">
          History
        </h2>
        {data.weights.length === 0 ? (
          <p className="text-sm text-[color:var(--quiet)]">No weigh-ins yet.</p>
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-[color:var(--surface)] ring-1 ring-[color:var(--line)]/80">
            {[...data.weights]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((w, idx) => (
                <li
                  key={w.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${
                    idx > 0 ? "border-t border-[color:var(--line)]/70" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold tabular-nums text-[color:var(--ink)]">
                      {w.weightKg} kg
                    </p>
                    <p className="text-xs text-[color:var(--quiet)]">
                      {w.date}
                      {w.note ? ` · ${w.note}` : ""}
                    </p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Delete weigh-in"
                    onClick={() => removeWeight(w.id)}
                  >
                    <Trash2 className="size-4 text-[color:var(--quiet)]" />
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.1rem] bg-[color:var(--surface)] p-3 ring-1 ring-[color:var(--line)]/80">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--quiet)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold tabular-nums text-[color:var(--ink)]">
        {value}
        {unit ? (
          <span className="ml-0.5 text-xs font-sans font-medium text-[color:var(--quiet)]">
            {unit}
          </span>
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-[color:var(--quiet)]">
        {hint}
      </p>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
