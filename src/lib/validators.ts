import { z } from 'zod';

export const scoreTypeSchema = z.enum(['SAY', 'SÖZ', 'EA', 'DİL', 'TYT']);

export const programSchema = z.object({
  id: z.string(),
  name: z.string(),
  faculty: z.string(),
  scoreType: scoreTypeSchema,
  language: z.enum(['english', '30percent-english']),
});

export const programListSchema = z.array(programSchema);

export const semesterScoreDataSchema = z.object({
  minScore: z.number().nullable(),
  maxScore: z.number().nullable(),
  quota: z.number().int(),
  placed: z.number().int(),
}).nullable();

export const programScoreDataSchema = z.object({
  semester3: semesterScoreDataSchema,
  semester5: semesterScoreDataSchema,
});

export const yearScoresSchema = z.record(z.string(), programScoreDataSchema);

export const studentInputSchema = z.object({
  targetSemester: z.union([z.literal(3), z.literal(5)]),
  creditsCompleted: z.number().nonnegative(),
  gpa: z.number().min(0).max(4),
  yksScore: z.number().min(200).max(500),
});

export const capScoreSemesterDataSchema = z.object({
  minGpa: z.number(),
  maxGpa: z.number(),
  placed: z.number().int(),
}).nullable();

export const capProgramScoreDataSchema = z.object({
  semester3: capScoreSemesterDataSchema,
  semester5: capScoreSemesterDataSchema,
});

export const capYearScoresSchema = z.record(z.string(), capProgramScoreDataSchema);

export const capStudentInputSchema = z.object({
  targetSemester: z.union([z.literal(3), z.literal(5)]),
  creditsCompleted: z.number().nonnegative(),
  gpa: z.number().min(0).max(4),
  classRankPercentile: z.number().min(1).max(100),
  currentProgramId: z.string().min(1, 'Lütfen mevcut programınızı seçin'),
});
