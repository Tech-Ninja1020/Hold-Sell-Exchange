import { Slider } from 'radix-ui';

type YearScrubberProps = {
  year: number;
  lastYear: number;
  calendarYear: number;
  onChange: (year: number) => void;
};

export function YearScrubber({ year, lastYear, calendarYear, onChange }: YearScrubberProps) {
  return (
    <div className="mt-4 flex items-center gap-4 pl-[60px]">
      <Slider.Root
        className="relative flex h-5 grow touch-none items-center select-none"
        min={1}
        max={lastYear}
        step={1}
        value={[year]}
        onValueChange={([next]) => next !== undefined && onChange(next)}
      >
        <Slider.Track className="relative h-1 grow rounded-full bg-surface-sunken">
          <Slider.Range className="absolute h-full rounded-full bg-text/60" />
        </Slider.Track>
        <Slider.Thumb
          aria-label="Year"
          className="block size-4 rounded-full border-2 border-text bg-surface shadow-sm transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-125"
        />
      </Slider.Root>
      <p className="w-28 shrink-0 text-right text-sm text-text money">
        Year {year} <span className="text-text-faint">· {calendarYear}</span>
      </p>
    </div>
  );
}
