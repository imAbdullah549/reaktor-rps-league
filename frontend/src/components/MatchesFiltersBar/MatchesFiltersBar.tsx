import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { MatchesFiltersValue } from "./types";

function valueToDateRange(value: MatchesFiltersValue): DateRange | undefined {
  if (value.date) {
    const d = new Date(value.date + "T12:00:00");
    return { from: d };
  }
  if (value.from && value.to) {
    return {
      from: new Date(value.from + "T12:00:00"),
      to: new Date(value.to + "T12:00:00"),
    };
  }
  return undefined;
}

export interface MatchesFiltersBarProps {
  value: MatchesFiltersValue;
  disabled?: boolean;
  onApply: (next: MatchesFiltersValue) => void;
  onReset: () => void;
  /** Optional validation error (e.g. "From must be before To"). */
  validationError?: string | null;
}

export function MatchesFiltersBar({
  value,
  disabled,
  onApply,
  onReset,
  validationError,
}: MatchesFiltersBarProps) {
  const [draftDateRange, setDraftDateRange] = useState<DateRange | undefined>(() =>
    valueToDateRange(value)
  );
  const [draftPlayer, setDraftPlayer] = useState(value.player ?? "");

  // Sync URL-driven value into local draft when params change (e.g. back/forward).
  useEffect(() => {
    setDraftDateRange(valueToDateRange(value));
    setDraftPlayer(value.player ?? "");
  }, [value]);

  const handleApply = () => {
    const hasDate = draftDateRange?.from;
    const hasPlayer = draftPlayer.trim();
    if (!hasDate && !hasPlayer) return;
    onApply({
      ...(draftDateRange?.from &&
        !draftDateRange?.to && {
          date: format(draftDateRange.from, "yyyy-MM-dd"),
        }),
      ...(draftDateRange?.from &&
        draftDateRange?.to && {
          from: format(draftDateRange.from, "yyyy-MM-dd"),
          to: format(draftDateRange.to, "yyyy-MM-dd"),
        }),
      ...(hasPlayer && { player: hasPlayer }),
    });
  };

  const handleReset = () => {
    setDraftDateRange(undefined);
    setDraftPlayer("");
    onReset();
  };

  const dateRangeLabel = draftDateRange?.from
    ? draftDateRange?.to
      ? `${format(draftDateRange.from, "MMM d, yyyy")} – ${format(draftDateRange.to, "MMM d, yyyy")}`
      : format(draftDateRange.from, "MMM d, yyyy")
    : "Pick date range";

  const hasDraft = draftDateRange?.from || draftPlayer.trim();

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <Field className="w-60 gap-1">
        <FieldLabel htmlFor="matches-date-range">Date range (optional)</FieldLabel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "min-w-[240px] justify-start text-left font-normal",
                !draftDateRange?.from && "text-muted-foreground"
              )}
            >
              {dateRangeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={draftDateRange?.from}
              selected={draftDateRange}
              onSelect={setDraftDateRange}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </Field>
      <div className="space-y-2">
        <Label htmlFor="matches-player-input">Player name (optional)</Label>
        <Input
          id="matches-player-input"
          type="search"
          placeholder="e.g. Sofia Garcia"
          value={draftPlayer}
          onChange={(e) => setDraftPlayer(e.target.value)}
          disabled={disabled}
          className="min-w-[200px]"
        />
      </div>
      <Button type="button" onClick={handleApply} disabled={disabled || !hasDraft}>
        {disabled ? "Searching…" : "Apply filters"}
      </Button>
      <Button type="button" variant="outline" onClick={handleReset} disabled={disabled}>
        Reset
      </Button>
      {validationError && (
        <p className="w-full text-sm text-destructive" role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
