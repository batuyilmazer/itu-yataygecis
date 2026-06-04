import { Badge } from '@/components/ui/badge';
import type { EligibilityResult } from '@/lib/types';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  result: EligibilityResult;
  rank?: number;
}

const LANGUAGE_LABEL: Record<string, string> = {
  english: 'İngilizce',
  '30percent-english': '%30 İngilizce',
};

export function ProgramRow({ result, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { program, eligible, score, breakdown, disqualifyReason, semesterData, scoringSystem } = result;
  const isDpRejection = disqualifyReason === 'dp-below-threshold';
  const requiredGpa = result.requiredGpa ?? null;
  const isGpaYear = scoringSystem === 'gpa';
  const scoreDisplay = isGpaYear ? score.toFixed(2) : score.toFixed(4);
  const tabanLabel = isGpaYear ? 'Taban GPA' : 'Taban DP';
  const tavanLabel = isGpaYear ? 'Tavan GPA' : 'Tavan DP';

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-colors ${
        eligible ? 'border-border' : 'border-border/50 opacity-60'
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        {/* Rank / status indicator */}
        <span className="w-7 shrink-0 text-center">
          {eligible ? (
            <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
          ) : (
            <span className="text-destructive text-lg leading-none">✕</span>
          )}
        </span>

        {/* Program info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{program.name}</p>
          <p className="text-xs text-muted-foreground truncate">{program.faculty}</p>
        </div>

        {/* Badges + score / required GPA */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs hidden sm:inline-flex">
            {LANGUAGE_LABEL[program.language] ?? program.language}
          </Badge>
          {eligible && (
            <span className="text-sm font-semibold w-16 text-right tabular-nums">
              {scoreDisplay}
            </span>
          )}
          {isDpRejection && (
            <span className="text-xs text-right text-muted-foreground whitespace-nowrap">
              {requiredGpa === null
                ? 'YKS yetersiz'
                : <><span className="text-foreground font-semibold">{requiredGpa.toFixed(2)}</span> GPA gerek</>}
            </span>
          )}
        </div>

        {/* Chevron */}
        <span className="text-muted-foreground shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t bg-muted/30 text-sm">
          {eligible ? (
            <div className="grid grid-cols-3 gap-3 mt-2">
              {!isGpaYear && <ScoreItem label="YKS Bileşeni" value={breakdown.yksComponent.toFixed(4)} />}
              {!isGpaYear && <ScoreItem label="GPA Bileşeni" value={breakdown.gpaComponent.toFixed(4)} />}
              <ScoreItem label={isGpaYear ? 'Senin GPA\'n' : 'Toplam DP'} value={scoreDisplay} highlight />
              {semesterData && (
                <>
                  <ScoreItem
                    label={tabanLabel}
                    value={semesterData.minScore !== null ? semesterData.minScore.toFixed(isGpaYear ? 2 : 4) : '—'}
                  />
                  <ScoreItem
                    label={tavanLabel}
                    value={semesterData.maxScore !== null ? semesterData.maxScore.toFixed(isGpaYear ? 2 : 4) : '—'}
                  />
                  <ScoreItem
                    label="Yerleşen"
                    value={String(semesterData.placed)}
                  />
                </>
              )}
            </div>
          ) : isDpRejection ? (
            <div className="mt-2 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {!isGpaYear && (
                  <ScoreItem label="Senin DP'n" value={breakdown.total.toFixed(4)} />
                )}
                <ScoreItem
                  label={tabanLabel}
                  value={semesterData?.minScore?.toFixed(isGpaYear ? 2 : 4) ?? '—'}
                />
                <ScoreItem
                  label={requiredGpa === null ? 'Gerekli GPA' : 'Min. GPA'}
                  value={requiredGpa === null ? '> 4.00' : requiredGpa.toFixed(2)}
                  highlight
                />
              </div>
              {requiredGpa === null ? (
                <p className="text-xs text-muted-foreground">Bu bölüme mevcut YKS puanınla girebilmek mümkün değil.</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Mevcut YKS puanınla bu bölüme girebilmek için en az <strong>{requiredGpa.toFixed(2)}</strong> GPA yapman gerekiyor.
                </p>
              )}
            </div>
          ) : (
            <p className="text-destructive mt-2">{disqualifyReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-md p-2 ${highlight ? 'bg-primary/10' : 'bg-background'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-base font-semibold tabular-nums ${highlight ? 'text-primary' : ''}`}>
        {value}
      </p>
    </div>
  );
}
