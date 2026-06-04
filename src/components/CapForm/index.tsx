import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CAP_CREDIT_RANGE, CAP_MAX_RANK_PCT, CAP_MIN_GPA } from '@/lib/cap-eligibility';
import type { CapStudentInput } from '@/lib/cap-types';
import type { Program, Semester } from '@/lib/types';
import { capStudentInputSchema } from '@/lib/validators';
import { useState } from 'react';

interface Props {
  programs: Program[];
  onSubmit: (input: CapStudentInput) => void;
}

const SEMESTER_LABELS: Record<number, string> = {
  3: '3. Dönem (2. sınıf başı)',
  5: '5. Dönem (3. sınıf başı)',
};

const LANGUAGE_LABEL: Record<string, string> = {
  english: 'İngilizce',
  '30percent-english': '%30 İngilizce',
};

export function CapForm({ programs, onSubmit }: Props) {
  const [targetSemester, setTargetSemester] = useState<Semester>(3);
  const [creditsCompleted, setCreditsCompleted] = useState('');
  const [gpa, setGpa] = useState('');
  const [classRankPercentile, setClassRankPercentile] = useState('');
  const [currentProgramId, setCurrentProgramId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const gpaNum = parseFloat(gpa);
  const rankNum = parseFloat(classRankPercentile);
  const gpaValid = !isNaN(gpaNum) && gpaNum >= CAP_MIN_GPA;
  const gpaWarn = !isNaN(gpaNum) && gpaNum < CAP_MIN_GPA;
  const rankValid = !isNaN(rankNum) && rankNum >= 1 && rankNum <= CAP_MAX_RANK_PCT;
  const rankWarn = !isNaN(rankNum) && rankNum > CAP_MAX_RANK_PCT;

  const [creditMin, creditMax] = CAP_CREDIT_RANGE[targetSemester];

  // Group programs by faculty for the native <select>
  const byFaculty = programs.reduce<Record<string, Program[]>>((acc, p) => {
    (acc[p.faculty] ??= []).push(p);
    return acc;
  }, {});
  const faculties = Object.keys(byFaculty).sort((a, b) => a.localeCompare(b, 'tr'));

  const selectedProgram = programs.find((p) => p.id === currentProgramId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const raw = {
      targetSemester,
      creditsCompleted: parseFloat(creditsCompleted),
      gpa: gpaNum,
      classRankPercentile: rankNum,
      currentProgramId,
    };

    const result = capStudentInputSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    onSubmit(result.data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ÇAP Uygunluk Kontrolü</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">

          {/* Hedef dönem */}
          <div className="grid gap-1.5">
            <Label>ÇAP'a Hangi Dönemde Başlamak İstiyorsun?</Label>
            <Select
              value={String(targetSemester)}
              onValueChange={(v) => setTargetSemester(Number(v) as Semester)}
            >
              <SelectTrigger>
                <SelectValue>{SEMESTER_LABELS[targetSemester]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">{SEMESTER_LABELS[3]}</SelectItem>
                <SelectItem value="5">{SEMESTER_LABELS[5]}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kredi */}
          <div className="grid gap-1.5">
            <Label htmlFor="cap-credits">
              Tamamlanan Kredi{' '}
              <span className="text-muted-foreground text-xs">
                (gerekli: {creditMin}–{creditMax})
              </span>
            </Label>
            <Input
              id="cap-credits"
              type="number"
              min={0}
              max={120}
              step={0.5}
              placeholder="örn. 45"
              value={creditsCompleted}
              onChange={(e) => setCreditsCompleted(e.target.value)}
            />
            {errors.creditsCompleted && (
              <p className="text-destructive text-xs">{errors.creditsCompleted}</p>
            )}
          </div>

          {/* GPA */}
          <div className="grid gap-1.5">
            <Label htmlFor="cap-gpa">
              Ağırlıklı Not Ortalaması (AGNO){' '}
              <span className="text-muted-foreground text-xs">(4.00 üzerinden)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="cap-gpa"
                type="number"
                min={0}
                max={4}
                step={0.01}
                placeholder="örn. 3.42"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="flex-1"
              />
              {gpaValid && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  ✓ Koşul sağlandı
                </span>
              )}
              {gpaWarn && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
                  Min. 3.00 gerekli
                </span>
              )}
            </div>
            {errors.gpa && <p className="text-destructive text-xs">{errors.gpa}</p>}
          </div>

          {/* Sınıf sırası */}
          <div className="grid gap-1.5">
            <Label htmlFor="cap-rank">
              Sınıf Başarı Sırası{' '}
              <span className="text-muted-foreground text-xs">(üst % kaçtasın?)</span>
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="cap-rank"
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  placeholder="örn. 12"
                  value={classRankPercentile}
                  onChange={(e) => setClassRankPercentile(e.target.value)}
                  className="pr-6"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                  %
                </span>
              </div>
              {rankValid && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                  ✓ En üst %{CAP_MAX_RANK_PCT} içinde
                </span>
              )}
              {rankWarn && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap shrink-0">
                  En üst %{CAP_MAX_RANK_PCT} gerekli
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Anadalında üst %{CAP_MAX_RANK_PCT}'de olman gerekiyor. Örn. 100 kişilik sınıfta 8. sıraysanız 8 yaz.
            </p>
            {errors.classRankPercentile && (
              <p className="text-destructive text-xs">{errors.classRankPercentile}</p>
            )}
          </div>

          {/* Mevcut program */}
          <div className="grid gap-1.5">
            <Label htmlFor="cap-program">Mevcut Anadal Programın</Label>
            <select
              id="cap-program"
              value={currentProgramId}
              onChange={(e) => setCurrentProgramId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>
                Programını seç...
              </option>
              {faculties.map((faculty) => (
                <optgroup key={faculty} label={faculty}>
                  {byFaculty[faculty].map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {selectedProgram && (
              <p className="text-xs text-muted-foreground">
                Seçili:{' '}
                <span className="font-medium text-foreground">{selectedProgram.name}</span>
                {' '}·{' '}
                <span>{LANGUAGE_LABEL[selectedProgram.language] ?? selectedProgram.language}</span>
              </p>
            )}
            {errors.currentProgramId && (
              <p className="text-destructive text-xs">{errors.currentProgramId}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            ÇAP Uygunluğunu Hesapla
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
