import { Separator } from '@/components/ui/separator';
import { CAP_CREDIT_RANGE, CAP_MAX_RANK_PCT, CAP_MIN_GPA, type CompLevel, getCompLevel } from '@/lib/cap-eligibility';
import type { CapEligibilityResult, CapProgramScoreData, CapStudentInput, CapYearScores } from '@/lib/cap-types';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CapProgramRow } from './CapProgramRow';

interface Props {
  results: CapEligibilityResult[];
  input: CapStudentInput;
  capScores: CapYearScores;
  capScoresLabel: string;
}

interface CriterionRowProps {
  label: string;
  value: string;
  pass: boolean;
  threshold: string;
}

function CriterionRow({ label, value, pass, threshold }: CriterionRowProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}>
        {pass ? '✓' : '✕'}
      </span>
      <span className="font-medium w-40 shrink-0">{label}</span>
      <span className="tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs ml-auto whitespace-nowrap">{threshold}</span>
    </div>
  );
}

interface CategoryConfig {
  level: CompLevel;
  label: string;
  headerColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { level: 'green',  label: 'Yüksek İhtimalle',   headerColor: 'text-emerald-700 dark:text-emerald-400' },
  { level: 'yellow', label: 'Tam Sınırda',          headerColor: 'text-amber-700 dark:text-amber-400' },
  { level: 'red',    label: 'Çok Düşük İhtimal',    headerColor: 'text-red-700 dark:text-red-400' },
  { level: 'none',   label: 'Veri Yok',             headerColor: 'text-muted-foreground' },
];

interface GroupEntry {
  result: CapEligibilityResult;
  scoreData: CapProgramScoreData | null;
  compLevel: CompLevel;
}

export function CapResults({ results, input, capScores, capScoresLabel }: Props) {
  const [showExcluded, setShowExcluded] = useState(false);

  const [creditMin, creditMax] = CAP_CREDIT_RANGE[input.targetSemester];
  const creditPass = input.creditsCompleted >= creditMin && input.creditsCompleted <= creditMax;
  const gpaPass = input.gpa >= CAP_MIN_GPA;
  const rankPass = input.classRankPercentile <= CAP_MAX_RANK_PCT;
  const globallyEligible = creditPass && gpaPass && rankPass;

  const semKey = input.targetSemester === 3 ? 'semester3' : 'semester5';

  const eligible = results.filter((r) => r.eligible);
  const sameNameExclusions = results.filter((r) => !r.eligible && r.reason === 'sameName');

  const groups: Record<CompLevel, GroupEntry[]> = { green: [], yellow: [], red: [], none: [] };
  for (const r of eligible) {
    const scoreData = capScores[r.program.id] ?? null;
    const minGpa = scoreData?.[semKey]?.minGpa ?? null;
    const compLevel = getCompLevel(input.gpa, minGpa);
    groups[compLevel].push({ result: r, scoreData, compLevel });
  }

  return (
    <div className="space-y-6">
      {/* Global eligibility banner */}
      <div
        className={`rounded-lg p-4 border ${
          globallyEligible
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
            : 'bg-destructive/5 border-destructive/20'
        }`}
      >
        <p
          className={`font-semibold text-sm mb-3 ${
            globallyEligible
              ? 'text-emerald-800 dark:text-emerald-300'
              : 'text-destructive'
          }`}
        >
          {globallyEligible
            ? `Genel ÇAP koşullarını sağlıyorsun — ${eligible.length} programa başvurabilirsin`
            : 'Henüz ÇAP başvurusu için koşulları karşılamıyorsun'}
        </p>
        <div className="space-y-2">
          <CriterionRow
            label="Tamamlanan Kredi"
            value={`${input.creditsCompleted}`}
            pass={creditPass}
            threshold={`gerekli: ${creditMin}–${creditMax}`}
          />
          <CriterionRow
            label="AGNO"
            value={input.gpa.toFixed(2)}
            pass={gpaPass}
            threshold={`gerekli: ≥ ${CAP_MIN_GPA.toFixed(2)}`}
          />
          <CriterionRow
            label="Sınıf Sırası"
            value={`Üst %${input.classRankPercentile}`}
            pass={rankPass}
            threshold={`gerekli: en üst %${CAP_MAX_RANK_PCT}`}
          />
        </div>
      </div>

      {globallyEligible && (
        <>
          {/* Eligible programs grouped by competitiveness */}
          <section className="space-y-5">
            <h2 className="font-semibold text-base">
              Başvurabileceğin Programlar{' '}
              <span className="text-muted-foreground font-normal text-sm">
                ({eligible.length} program)
              </span>
            </h2>

            {CATEGORIES.filter((cat) => groups[cat.level].length > 0).map((cat) => (
              <div key={cat.level} className="space-y-2">
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${cat.headerColor}`}>
                  {cat.label}{' '}
                  <span className="font-normal normal-case tracking-normal opacity-70">
                    ({groups[cat.level].length})
                  </span>
                </h3>
                {groups[cat.level].map(({ result: r, scoreData, compLevel }) => (
                  <CapProgramRow
                    key={r.program.id}
                    result={r}
                    scoreData={scoreData}
                    targetSemester={input.targetSemester}
                    scoresLabel={capScoresLabel}
                    userGpa={input.gpa}
                    compLevel={compLevel}
                  />
                ))}
              </div>
            ))}
          </section>

          {sameNameExclusions.length > 0 && (
            <>
              <Separator />
              <section>
                <button
                  type="button"
                  onClick={() => setShowExcluded((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showExcluded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Hariç Tutulan Programlar ({sameNameExclusions.length})
                </button>
                {showExcluded && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">
                      Yönerge gereği adı aynı olan programlar arasında ÇAP yapılamaz.
                    </p>
                    {sameNameExclusions.map((r) => {
                      const scoreData = capScores[r.program.id] ?? null;
                      const minGpa = scoreData?.[semKey]?.minGpa ?? null;
                      const compLevel = getCompLevel(input.gpa, minGpa);
                      return (
                        <CapProgramRow
                          key={r.program.id}
                          result={r}
                          scoreData={scoreData}
                          targetSemester={input.targetSemester}
                          scoresLabel={capScoresLabel}
                          userGpa={input.gpa}
                          compLevel={compLevel}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
