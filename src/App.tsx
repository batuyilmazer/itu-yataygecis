import { useState } from 'react';
import { CapForm } from '@/components/CapForm';
import { CapResults } from '@/components/CapResults';
import { InputForm } from '@/components/InputForm';
import { ResultsTable } from '@/components/ResultsTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { computeAllCapEligibility } from '@/lib/cap-eligibility';
import type { CapEligibilityResult, CapStudentInput, CapYearScores } from '@/lib/cap-types';
import { computeAllEligibility } from '@/lib/eligibility';
import type { AppMode, EligibilityResult, ScoringSystem, StudentInput } from '@/lib/types';
import { capYearScoresSchema, programListSchema, yearScoresSchema } from '@/lib/validators';

import programsRaw from '@/data/programs.json';
import scores2021Raw from '@/data/scores/2021.json';
import scores2022Raw from '@/data/scores/2022.json';
import scores2023Raw from '@/data/scores/2023.json';
import scores2024Raw from '@/data/scores/2024.json';
import scores2025Raw from '@/data/scores/2025.json';
import capScores2023Raw from '@/data/cap-scores/2023.json';
import capScores2024Raw from '@/data/cap-scores/2024.json';
import capScores2025Raw from '@/data/cap-scores/2025.json';
import capScores2026Raw from '@/data/cap-scores/2026.json';

const programs = programListSchema.parse(programsRaw);

interface YearConfig {
  label: string;
  scoringSystem: ScoringSystem;
  scores: ReturnType<typeof yearScoresSchema.parse>;
}

function parseYear(raw: Record<string, unknown>): YearConfig {
  const scoringSystem = (raw['_scoringSystem'] as ScoringSystem | undefined) ?? 'dp';
  const label = raw['_year'] as string;
  const stripped = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));
  return { label, scoringSystem, scores: yearScoresSchema.parse(stripped) };
}

const YEAR_CONFIGS: Record<number, YearConfig> = {
  2021: parseYear(scores2021Raw as Record<string, unknown>),
  2022: parseYear(scores2022Raw as Record<string, unknown>),
  2023: parseYear(scores2023Raw as Record<string, unknown>),
  2024: parseYear(scores2024Raw as Record<string, unknown>),
  2025: parseYear(scores2025Raw as Record<string, unknown>),
};

const SCORING_BADGE: Record<ScoringSystem, string> = {
  dp: 'YKS + GPA',
  gpa: 'Sadece GPA',
};

function parseCapScores(raw: Record<string, unknown>): { label: string; scores: CapYearScores } {
  const label = raw['_year'] as string;
  const stripped = Object.fromEntries(Object.entries(raw).filter(([k]) => !k.startsWith('_')));
  return { label, scores: capYearScoresSchema.parse(stripped) };
}

const CAP_YEAR_CONFIGS: Record<number, { label: string; scores: CapYearScores }> = {
  2023: parseCapScores(capScores2023Raw as Record<string, unknown>),
  2024: parseCapScores(capScores2024Raw as Record<string, unknown>),
  2025: parseCapScores(capScores2025Raw as Record<string, unknown>),
  2026: parseCapScores(capScores2026Raw as Record<string, unknown>),
};

export default function App() {
  const [mode, setMode] = useState<AppMode>('transfer');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedCapYear, setSelectedCapYear] = useState(2026);
  const [transferResults, setTransferResults] = useState<EligibilityResult[] | null>(null);
  const [capResults, setCapResults] = useState<{ results: CapEligibilityResult[]; input: CapStudentInput } | null>(null);

  const yearConfig = YEAR_CONFIGS[selectedYear];
  const capYearConfig = CAP_YEAR_CONFIGS[selectedCapYear];

  function handleTransferSubmit(input: StudentInput) {
    setTransferResults(computeAllEligibility(input, programs, yearConfig.scores, yearConfig.scoringSystem));
  }

  function handleCapSubmit(input: CapStudentInput) {
    setCapResults({ results: computeAllCapEligibility(input, programs), input });
  }

  function switchMode(next: AppMode) {
    setMode(next);
    setTransferResults(null);
    setCapResults(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">İTÜ Program Hesaplayıcı</h1>
          <p className="text-muted-foreground text-sm">
            Yatay geçiş ve ÇAP başvurularında uygunluğunu hesapla.
          </p>
        </header>

        {/* Mode tabs */}
        <div className="flex gap-1 border-b">
          <TabButton active={mode === 'transfer'} onClick={() => switchMode('transfer')}>
            Yatay Geçiş
          </TabButton>
          <TabButton active={mode === 'cap'} onClick={() => switchMode('cap')}>
            ÇAP
          </TabButton>
        </div>

        {/* Transfer mode */}
        {mode === 'transfer' && (
          <>
            <div className="flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                GPA ve YKS puanını girerek hangi İTÜ programlarına başvurabileceğini gör.
                Hesaplama kurum içi yatay geçiş koşullarına göre yapılmaktadır.
              </p>
              <div className="shrink-0 w-36">
                <Select
                  value={String(selectedYear)}
                  onValueChange={(v) => {
                    setSelectedYear(Number(v));
                    setTransferResults(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>{yearConfig.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(YEAR_CONFIGS)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {YEAR_CONFIGS[y].label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  Puanlama: {SCORING_BADGE[yearConfig.scoringSystem]}
                </p>
              </div>
            </div>

            <InputForm onSubmit={handleTransferSubmit} scoringSystem={yearConfig.scoringSystem} />

            {transferResults !== null && <ResultsTable results={transferResults} />}
          </>
        )}

        {/* ÇAP mode */}
        {mode === 'cap' && (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground flex-1">
                <span className="font-medium text-foreground">ÇAP nedir? </span>
                İTÜ'deki ikinci bir lisans programından eş zamanlı ders alarak iki ayrı diploma kazanabilirsin.
                Başvuru için <span className="font-medium text-foreground">AGNO ≥ 3.00</span> ve
                anadalında <span className="font-medium text-foreground">en üst %20</span> başarı sıralaması gerekiyor.
              </div>
              <div className="shrink-0 w-36">
                <Select
                  value={String(selectedCapYear)}
                  onValueChange={(v) => setSelectedCapYear(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue>{capYearConfig.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CAP_YEAR_CONFIGS)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {CAP_YEAR_CONFIGS[y].label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1 text-right">Geçmiş AGNO verileri</p>
              </div>
            </div>

            <CapForm programs={programs} onSubmit={handleCapSubmit} />

            {capResults !== null && (
              <CapResults
                results={capResults.results}
                input={capResults.input}
                capScores={capYearConfig.scores}
                capScoresLabel={capYearConfig.label}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
      }`}
    >
      {children}
    </button>
  );
}
