import { Badge } from '@/components/ui/badge';
import type { CompLevel } from '@/lib/cap-eligibility';
import type { CapEligibilityResult, CapProgramScoreData } from '@/lib/cap-types';

interface Props {
  result: CapEligibilityResult;
  scoreData: CapProgramScoreData | null;
  targetSemester: 3 | 5;
  scoresLabel: string;
  userGpa: number;
  compLevel: CompLevel;
}

const COMP_BADGE: Record<CompLevel, { label: string; className: string }> = {
  green: {
    label: 'Yüksek İhtimalle',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  yellow: {
    label: 'Tam Sınırda',
    className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  },
  red: {
    label: 'Çok Düşük İhtimal',
    className: 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
  none: {
    label: 'Veri Yok',
    className: 'border-border bg-muted/30 text-muted-foreground',
  },
};

const DELTA_COLORS: Record<CompLevel, string> = {
  green: 'text-emerald-600 dark:text-emerald-400',
  yellow: 'text-amber-600 dark:text-amber-400',
  red: 'text-destructive',
  none: '',
};

export function CapProgramRow({ result, scoreData, targetSemester, scoresLabel, userGpa, compLevel }: Props) {
  const { program, eligible } = result;
  const semKey = targetSemester === 3 ? 'semester3' : 'semester5';
  const semScore = scoreData?.[semKey] ?? null;
  const delta = semScore !== null ? userGpa - semScore.minGpa : null;

  const badge = COMP_BADGE[compLevel];

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
        eligible
          ? 'border-border bg-background'
          : 'border-border/40 bg-muted/20 opacity-60'
      }`}
    >
      <span className="w-5 shrink-0 text-center pt-0.5">
        {eligible ? (
          <span className="text-emerald-600 dark:text-emerald-400 text-base leading-none">✓</span>
        ) : (
          <span className="text-destructive text-base leading-none">✕</span>
        )}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{program.name}</p>
        <p className="text-xs text-muted-foreground truncate">{program.faculty}</p>
        {semScore !== null && delta !== null ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-foreground/70">{scoresLabel}:</span>
            {' '}taban{' '}
            <span className="font-medium tabular-nums text-foreground">{semScore.minGpa.toFixed(2)}</span>
            {' '}— tavan{' '}
            <span className="font-medium tabular-nums text-foreground">{semScore.maxGpa.toFixed(2)}</span>
            <span className="text-foreground/50"> ({semScore.placed} kişi)</span>
            {' '}
            <span className={`font-medium tabular-nums ${DELTA_COLORS[compLevel]}`}>
              {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/60 mt-0.5">{scoresLabel}: bu dönem veri yok</p>
        )}
      </div>

      <Badge variant="outline" className={`text-xs shrink-0 hidden sm:inline-flex mt-0.5 ${badge.className}`}>
        {badge.label}
      </Badge>
    </div>
  );
}
