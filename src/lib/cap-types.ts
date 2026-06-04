import type { z } from 'zod';
import type { capProgramScoreDataSchema, capScoreSemesterDataSchema, capYearScoresSchema } from './validators';
import type { Program } from './types';

export interface CapStudentInput {
  targetSemester: 3 | 5;
  creditsCompleted: number;
  gpa: number;
  classRankPercentile: number;
  currentProgramId: string;
}

export type CapIneligibleReason = 'credits' | 'gpa' | 'rank' | 'sameName';

export type CapScoreSemesterData = z.infer<typeof capScoreSemesterDataSchema>;
export type CapProgramScoreData = z.infer<typeof capProgramScoreDataSchema>;
export type CapYearScores = z.infer<typeof capYearScoresSchema>;

export interface CapEligibilityResult {
  program: Program;
  eligible: boolean;
  reason?: CapIneligibleReason;
}
