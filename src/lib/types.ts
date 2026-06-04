export type AppMode = 'transfer' | 'cap';

export type TransferType = 'intra' | 'inter' | 'international';
export type Semester = 3 | 5;
export type ScoreType = 'SAY' | 'SÖZ' | 'EA' | 'DİL' | 'TYT';
export type ProgramLanguage = 'english' | '30percent-english';

/**
 * dp  — 2023-24 onwards: composite score 0.4*(YKS/500) + 0.6*(GPA/4), range 0–1
 * gpa — 2021-22 / 2022-23: raw GPA threshold, range 0–4 (YKS not used in ranking)
 */
export type ScoringSystem = 'dp' | 'gpa';

export interface Program {
  id: string;
  name: string;
  faculty: string;
  scoreType: ScoreType;
  language: ProgramLanguage;
}

export interface StudentInput {
  targetSemester: Semester;
  creditsCompleted: number;
  gpa: number; // 4.00 scale
  yksScore: number; // 200–500
}

/** Per-semester data from İTÜ's official taban/tavan tables. */
export interface SemesterScoreData {
  minScore: number | null; // Taban Değerlendirme Puanı (0–1)
  maxScore: number | null; // Tavan Değerlendirme Puanı (0–1)
  quota: number;
  placed: number;
}

export interface ProgramScoreData {
  semester3: SemesterScoreData | null;
  semester5: SemesterScoreData | null;
}

export interface ScoreBreakdown {
  yksComponent: number; // 0.4 * (yksScore/500)
  gpaComponent: number; // 0.6 * (gpa/4)
  total: number;        // composite DP, 0–1 scale
}

export interface EligibilityResult {
  program: Program;
  eligible: boolean;
  disqualifyReason?: string;
  /** dp: composite score 0–1 | gpa: raw GPA 0–4 */
  score: number;
  breakdown: ScoreBreakdown;
  semesterData: SemesterScoreData | null;
  scoringSystem: ScoringSystem;
  /**
   * Minimum GPA needed to reach this program's taban score.
   * For dp years: derived from YKS score + taban DP formula.
   * For gpa years: equals taban GPA directly.
   * null = impossible even at GPA 4.0.
   * Only set when ineligible due to score threshold.
   */
  requiredGpa?: number | null;
}

export type YearScores = Record<string, ProgramScoreData>;
