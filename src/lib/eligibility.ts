import type {
  EligibilityResult,
  Program,
  ProgramScoreData,
  ScoreBreakdown,
  ScoringSystem,
  SemesterScoreData,
  StudentInput,
} from './types';

// Credit ranges per target semester (yönetmelik §5)
const CREDIT_RANGE: Record<3 | 5, [number, number]> = {
  3: [30, 59.99],
  5: [60, 94.99],
};

// Minimum GPA per target semester (yönetmelik §5)
const MIN_GPA: Record<3 | 5, number> = {
  3: 2.5,
  5: 2.6,
};

/**
 * Compute the İTÜ kurum-içi Değerlendirme Puanı (DP).
 * Formula (yönetmelik §9): YKS %40 + GPA %60, both normalized to 0–1.
 * YKS normalization: score / 500 (scale 0–500).
 */
export function computeDP(yksScore: number, gpa: number): ScoreBreakdown {
  const yksComponent = 0.4 * (yksScore / 500);
  const gpaComponent = 0.6 * (gpa / 4);
  return { yksComponent, gpaComponent, total: yksComponent + gpaComponent };
}

/** Minimum GPA needed to reach minScore at the given yksScore. null = impossible even at 4.0. */
export function computeRequiredGpa(yksScore: number, minScore: number): number | null {
  const gpa = (4 * (minScore - 0.4 * (yksScore / 500))) / 0.6;
  if (gpa > 4.0) return null;
  return Math.max(0, gpa);
}

function checkCreditRange(input: StudentInput): string | null {
  const [min, max] = CREDIT_RANGE[input.targetSemester];
  if (input.creditsCompleted < min || input.creditsCompleted > max) {
    return `${input.targetSemester}. dönem transferi için kredi aralığı ${min}–${max} olmalı (mevcut: ${input.creditsCompleted})`;
  }
  return null;
}

function checkGpa(input: StudentInput): string | null {
  const min = MIN_GPA[input.targetSemester];
  if (input.gpa < min) {
    return `Minimum GPA ${min.toFixed(2)} olmalı (mevcut: ${input.gpa.toFixed(2)})`;
  }
  return null;
}

export function computeEligibility(
  input: StudentInput,
  program: Program,
  scoreData: ProgramScoreData | undefined,
  scoringSystem: ScoringSystem = 'dp',
): EligibilityResult {
  const creditError = checkCreditRange(input);
  if (creditError) return ineligible(program, creditError, null, scoringSystem);

  const gpaError = checkGpa(input);
  if (gpaError) return ineligible(program, gpaError, null, scoringSystem);

  if (!scoreData) return ineligible(program, 'Bu program için veri bulunamadı', null, scoringSystem);

  const semesterData: SemesterScoreData | null =
    input.targetSemester === 3 ? scoreData.semester3 : scoreData.semester5;

  if (!semesterData || semesterData.quota === 0) {
    return ineligible(program, 'Bu dönem için kontenjan açılmamış', semesterData, scoringSystem);
  }

  if (scoringSystem === 'gpa') {
    return computeGpaEligibility(input, program, semesterData);
  }

  // DP scoring (2023-24 onwards)
  const breakdown = computeDP(input.yksScore, input.gpa);

  if (semesterData.minScore === null) {
    return { program, eligible: true, score: breakdown.total, breakdown, semesterData, scoringSystem };
  }

  if (breakdown.total < semesterData.minScore) {
    const requiredGpa = computeRequiredGpa(input.yksScore, semesterData.minScore);
    return {
      ...ineligible(program, 'dp-below-threshold', semesterData, scoringSystem),
      breakdown,
      score: breakdown.total,
      requiredGpa,
    };
  }

  return { program, eligible: true, score: breakdown.total, breakdown, semesterData, scoringSystem };
}

function computeGpaEligibility(
  input: StudentInput,
  program: Program,
  semesterData: SemesterScoreData,
): EligibilityResult {
  const breakdown: ScoreBreakdown = { yksComponent: 0, gpaComponent: input.gpa, total: input.gpa };

  if (semesterData.minScore === null) {
    return { program, eligible: true, score: input.gpa, breakdown, semesterData, scoringSystem: 'gpa' };
  }

  if (input.gpa < semesterData.minScore) {
    return {
      program,
      eligible: false,
      disqualifyReason: 'dp-below-threshold',
      score: input.gpa,
      breakdown,
      semesterData,
      scoringSystem: 'gpa',
      requiredGpa: semesterData.minScore,
    };
  }

  return { program, eligible: true, score: input.gpa, breakdown, semesterData, scoringSystem: 'gpa' };
}

export function computeAllEligibility(
  input: StudentInput,
  programs: Program[],
  yearScores: Record<string, ProgramScoreData>,
  scoringSystem: ScoringSystem = 'dp',
): EligibilityResult[] {
  return programs
    .map((p) => computeEligibility(input, p, yearScores[p.id], scoringSystem))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });
}

function ineligible(
  program: Program,
  reason: string,
  semesterData: SemesterScoreData | null,
  scoringSystem: ScoringSystem,
): EligibilityResult {
  return {
    program,
    eligible: false,
    disqualifyReason: reason,
    score: 0,
    breakdown: { yksComponent: 0, gpaComponent: 0, total: 0 },
    semesterData,
    scoringSystem,
  };
}
