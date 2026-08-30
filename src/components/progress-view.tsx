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
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--quiet)]">
          Body check-in
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[color:var(--ink)] sm:text-5xl">
          Progress
        </h1>
        <p className="mt-2 max-w-md text-sm text-[color:var(--ink-soft)]">
          Track weight on this device. One entry per day — logging again updates
          that day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Latest"
          value={latest ? `${latest.weightKg} kg` : "—"}
          hint={latest?.date ?? "No weigh-ins yet"}
        />
        <Stat
          label="Target"
          value={`${data.goals.weightKg} kg`}
          hint="From your goals"
        />
        <Stat
          label="vs target"
          value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta} kg`}
          hint={delta == null ? "Log a weigh-in" : "Difference from goal"}
        />
      </div>

      <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-4 sm:p-5">
        {chartData.length < 2 ? (
          <div className="flex h-52 items-center justify-center text-sm text-[color:var(--quiet)]">
            {chartData.length === 0
              ? "Log at least two weigh-ins to see a trend."
              : "One point logged — add another day to chart the trend."}
          </div>
        ) : (
          <div className="h-64 w-full animate-rise">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(46,70,52,0.12)" strokeDasharray="4 4" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#5d6b61", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#5d6b61", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "#f7f4ee",
                    border: "1px solid #d7d0c4",
                    borderRadius: 8,
                  }}
                  formatter={(value) => [`${value} kg`, "Weight"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullDate ?? ""
                  }
                />
                <Line
                  type="monotone"
                  dataKey="kg"
                  stroke="#2f6a45"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#2f6a45" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-4 sm:p-5"
      >
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[color:var(--ink)]">
          Log weight
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="w-date">Date</Label>
            <Input
              id="w-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="w-note">Note</Label>
            <Input
              id="w-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          className="bg-[color:var(--forest)] text-white hover:bg-[color:var(--forest-deep)]"
        >
          Save weigh-in
        </Button>
      </form>

      <section className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[color:var(--ink)]">
          History
        </h2>
        {data.weights.length === 0 ? (
          <p className="text-sm text-[color:var(--quiet)]">No weigh-ins yet.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--line)]/70 overflow-hidden rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]">
            {[...data.weights]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[color:var(--ink)]">
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
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]/90 p-4">
      <p className="text-xs uppercase tracking-wider text-[color:var(--quiet)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[color:var(--ink)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[color:var(--quiet)]">{hint}</p>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
