import { describe, expect, it } from 'vitest';
import { computeAllEligibility, computeDP, computeEligibility } from './eligibility';
import type { Program, ProgramScoreData, StudentInput } from './types';

const mockProgram: Program = {
  id: 'bilgisayar-100',
  name: 'Bilgisayar Mühendisliği (% 100 İngilizce)',
  faculty: 'Bilgisayar ve Bilişim Fakültesi',
  scoreType: 'SAY',
  language: 'english',
};

const mockScoreData: ProgramScoreData = {
  semester3: { minScore: 0.70, maxScore: 0.98, quota: 3, placed: 3 },
  semester5: { minScore: 0.70, maxScore: 0.92, quota: 1, placed: 1 },
};

const baseInput: StudentInput = {
  targetSemester: 3,
  creditsCompleted: 45,
  gpa: 3.5,
  yksScore: 480,
};

describe('computeDP', () => {
  it('computes correct components and total', () => {
    const result = computeDP(400, 3.0);
    expect(result.yksComponent).toBeCloseTo(0.4 * (400 / 500), 10);
    expect(result.gpaComponent).toBeCloseTo(0.6 * (3.0 / 4), 10);
    expect(result.total).toBeCloseTo(result.yksComponent + result.gpaComponent, 10);
  });

  it('reaches maximum of 1.0 at yksScore=500 and gpa=4.0', () => {
    const result = computeDP(500, 4.0);
    expect(result.total).toBeCloseTo(1.0, 10);
  });

  it('higher YKS score raises yksComponent', () => {
    const low = computeDP(300, 3.0);
    const high = computeDP(450, 3.0);
    expect(high.yksComponent).toBeGreaterThan(low.yksComponent);
  });

  it('higher GPA raises gpaComponent', () => {
    const low = computeDP(400, 2.5);
    const high = computeDP(400, 3.8);
    expect(high.gpaComponent).toBeGreaterThan(low.gpaComponent);
  });
});

describe('computeEligibility', () => {
  it('returns eligible when all conditions are met', () => {
    const result = computeEligibility(baseInput, mockProgram, mockScoreData);
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  describe('credit range checks', () => {
    it('disqualifies when credits below 3rd semester minimum (30)', () => {
      const input = { ...baseInput, creditsCompleted: 20 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('disqualifies when credits above 3rd semester maximum (59.99)', () => {
      const input = { ...baseInput, creditsCompleted: 60 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('accepts 30 credits exactly for 3rd semester', () => {
      const input = { ...baseInput, creditsCompleted: 30 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(true);
    });

    it('disqualifies when credits below 5th semester minimum (60)', () => {
      const input: StudentInput = { ...baseInput, targetSemester: 5, creditsCompleted: 59, gpa: 2.6 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('disqualifies when credits above 5th semester maximum (94.99)', () => {
      const input: StudentInput = { ...baseInput, targetSemester: 5, creditsCompleted: 95, gpa: 2.6 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('accepts 60–94.99 credits for 5th semester', () => {
      const input: StudentInput = { ...baseInput, targetSemester: 5, creditsCompleted: 75, gpa: 2.6 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(true);
    });
  });

  describe('GPA checks', () => {
    it('disqualifies when GPA below 2.50 for 3rd semester', () => {
      const input = { ...baseInput, gpa: 2.49 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('accepts GPA of exactly 2.50 for 3rd semester', () => {
      const input = { ...baseInput, gpa: 2.5 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(true);
    });

    it('disqualifies when GPA below 2.60 for 5th semester', () => {
      const input: StudentInput = { ...baseInput, targetSemester: 5, creditsCompleted: 75, gpa: 2.59 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('accepts GPA of exactly 2.60 for 5th semester', () => {
      const input: StudentInput = { ...baseInput, targetSemester: 5, creditsCompleted: 75, gpa: 2.6 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(true);
    });
  });

  describe('score threshold checks', () => {
    it('disqualifies when DP below program minimum', () => {
      // gpa=2.5, yksScore=200 → DP = 0.4*(200/500) + 0.6*(2.5/4) = 0.16 + 0.375 = 0.535
      const input = { ...baseInput, gpa: 2.5, yksScore: 200 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(false);
    });

    it('is eligible when DP meets or exceeds minimum', () => {
      // gpa=4.0, yksScore=500 → DP = 1.0, above 0.93 min
      const input = { ...baseInput, gpa: 4.0, yksScore: 500 };
      expect(computeEligibility(input, mockProgram, mockScoreData).eligible).toBe(true);
    });

    it('disqualifies when score data is missing for program', () => {
      expect(computeEligibility(baseInput, mockProgram, undefined).eligible).toBe(false);
    });

    it('marks eligible (undetermined) when quota > 0 but minScore is null', () => {
      const data: ProgramScoreData = {
        semester3: { minScore: null, maxScore: null, quota: 3, placed: 0 },
        semester5: null,
      };
      const input = { ...baseInput, gpa: 2.5, yksScore: 200 };
      expect(computeEligibility(input, mockProgram, data).eligible).toBe(true);
    });

    it('disqualifies when quota is 0', () => {
      const data: ProgramScoreData = {
        semester3: { minScore: null, maxScore: null, quota: 0, placed: 0 },
        semester5: null,
      };
      expect(computeEligibility(baseInput, mockProgram, data).eligible).toBe(false);
    });

    it('disqualifies when semester data is null', () => {
      const data: ProgramScoreData = { semester3: null, semester5: null };
      expect(computeEligibility(baseInput, mockProgram, data).eligible).toBe(false);
    });
  });

  describe('score calculation', () => {
    it('score equals computed DP total', () => {
      const result = computeEligibility(baseInput, mockProgram, mockScoreData);
      const expected = computeDP(baseInput.yksScore, baseInput.gpa);
      expect(result.score).toBeCloseTo(expected.total, 10);
    });

    it('higher YKS score produces higher total score', () => {
      const low = computeEligibility({ ...baseInput, yksScore: 451 }, mockProgram, mockScoreData);
      const high = computeEligibility({ ...baseInput, yksScore: 490 }, mockProgram, mockScoreData);
      expect(high.score).toBeGreaterThan(low.score);
    });

    it('higher GPA produces higher total score', () => {
      const low = computeEligibility({ ...baseInput, gpa: 2.5 }, mockProgram, mockScoreData);
      const high = computeEligibility({ ...baseInput, gpa: 3.8 }, mockProgram, mockScoreData);
      expect(high.score).toBeGreaterThan(low.score);
    });
  });
});

describe('computeAllEligibility', () => {
  const programA: Program = { ...mockProgram, id: 'prog-a' };
  const programB: Program = { ...mockProgram, id: 'prog-b', name: 'Program B' };

  const yearScores: Record<string, ProgramScoreData> = {
    'prog-a': { semester3: { minScore: 0.80, maxScore: 0.95, quota: 3, placed: 3 }, semester5: null },
    'prog-b': { semester3: { minScore: 0.95, maxScore: 0.99, quota: 2, placed: 2 }, semester5: null },
  };

  it('returns eligible and ineligible programs combined', () => {
    // baseInput DP = 0.4*(480/500) + 0.6*(3.5/4) = 0.384 + 0.525 = 0.909
    // prog-a min=0.80 → eligible; prog-b min=0.95 → ineligible
    const results = computeAllEligibility(baseInput, [programA, programB], yearScores);
    expect(results).toHaveLength(2);
    const eligible = results.filter((r) => r.eligible);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].program.id).toBe('prog-a');
  });

  it('returns results with eligible programs sorted before ineligible', () => {
    const results = computeAllEligibility(baseInput, [programA, programB], yearScores);
    expect(results[0].eligible).toBe(true);
    expect(results[1].eligible).toBe(false);
  });

  it('eligible programs sorted by score descending', () => {
    const scores: Record<string, ProgramScoreData> = {
      'prog-a': { semester3: { minScore: 0.50, maxScore: 0.95, quota: 5, placed: 5 }, semester5: null },
      'prog-b': { semester3: { minScore: 0.50, maxScore: 0.99, quota: 2, placed: 2 }, semester5: null },
    };
    const results = computeAllEligibility(baseInput, [programA, programB], scores);
    const eligibleResults = results.filter((r) => r.eligible);
    for (let i = 1; i < eligibleResults.length; i++) {
      expect(eligibleResults[i - 1].score).toBeGreaterThanOrEqual(eligibleResults[i].score);
    }
  });
});
