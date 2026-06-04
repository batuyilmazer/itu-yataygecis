import type { Program } from './types';
import type { CapEligibilityResult, CapStudentInput } from './cap-types';

export type CompLevel = 'green' | 'yellow' | 'red' | 'none';

export function getCompLevel(userGpa: number, minGpa: number | null): CompLevel {
  if (minGpa === null) return 'none';
  const delta = userGpa - minGpa;
  if (delta >= 0) return 'green';
  if (delta >= -0.1) return 'yellow';
  return 'red';
}

export const CAP_MIN_GPA = 3.0;
export const CAP_MAX_RANK_PCT = 20;

export const CAP_CREDIT_RANGE: Record<3 | 5, [number, number]> = {
  3: [30, 59.99],
  5: [60, 94.99],
};

// Strip language percentage suffix to compare program disciplines
// e.g. "İnşaat Mühendisliği (% 30 İngilizce)" → "İnşaat Mühendisliği"
function getBaseName(name: string): string {
  return name.replace(/\s*\(%?\s*\d+\s*[İI]ngilizce\s*\)/gi, '').trim();
}

export function computeCapEligibility(
  input: CapStudentInput,
  program: Program,
  programs: Program[],
): CapEligibilityResult {
  const [min, max] = CAP_CREDIT_RANGE[input.targetSemester];
  if (input.creditsCompleted < min || input.creditsCompleted > max) {
    return { program, eligible: false, reason: 'credits' };
  }

  if (input.gpa < CAP_MIN_GPA) {
    return { program, eligible: false, reason: 'gpa' };
  }

  if (input.classRankPercentile > CAP_MAX_RANK_PCT) {
    return { program, eligible: false, reason: 'rank' };
  }

  const currentProgram = programs.find((p) => p.id === input.currentProgramId);
  if (currentProgram) {
    const currentBase = getBaseName(currentProgram.name);
    const targetBase = getBaseName(program.name);
    if (currentBase === targetBase) {
      return { program, eligible: false, reason: 'sameName' };
    }
  }

  return { program, eligible: true };
}

export function computeAllCapEligibility(
  input: CapStudentInput,
  programs: Program[],
): CapEligibilityResult[] {
  return programs
    .map((p) => computeCapEligibility(input, p, programs))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return a.program.name.localeCompare(b.program.name, 'tr');
    });
}
