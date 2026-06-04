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
import type { Semester, ScoringSystem, StudentInput } from '@/lib/types';
import { studentInputSchema } from '@/lib/validators';
import { useState } from 'react';

interface Props {
  onSubmit: (input: StudentInput) => void;
  scoringSystem: ScoringSystem;
}

const SEMESTER_LABELS: Record<number, string> = {
  3: '3. Dönem (2. sınıf başı)',
  5: '5. Dönem (3. sınıf başı)',
};

export function InputForm({ onSubmit, scoringSystem }: Props) {
  const [targetSemester, setTargetSemester] = useState<Semester>(3);
  const [creditsCompleted, setCreditsCompleted] = useState('');
  const [gpa, setGpa] = useState('');
  const [yksScore, setYksScore] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const raw = {
      targetSemester,
      creditsCompleted: parseFloat(creditsCompleted),
      gpa: parseFloat(gpa),
      yksScore: scoringSystem === 'gpa' ? 200 : parseFloat(yksScore),
    };

    const result = studentInputSchema.safeParse(raw);
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

  const semesterCreditHint = targetSemester === 3 ? '30 – 59.99 kredi' : '60 – 94.99 kredi';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bilgilerini Gir</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">

          {/* Hedef dönem */}
          <div className="grid gap-1.5">
            <Label>Hangi Döneme Geçmek İstiyorsun?</Label>
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
            <Label htmlFor="credits">
              Tamamlanan Kredi{' '}
              <span className="text-muted-foreground text-xs">({semesterCreditHint})</span>
            </Label>
            <Input
              id="credits"
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
            <Label htmlFor="gpa">
              Ağırlıklı Not Ortalaması{' '}
              <span className="text-muted-foreground text-xs">(4.00 üzerinden)</span>
            </Label>
            <Input
              id="gpa"
              type="number"
              min={0}
              max={4}
              step={0.01}
              placeholder="örn. 3.12"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
            />
            {errors.gpa && <p className="text-destructive text-xs">{errors.gpa}</p>}
          </div>

          {/* YKS puanı — sadece DP yıllarında göster */}
          {scoringSystem === 'dp' && (
            <div className="grid gap-1.5">
              <Label htmlFor="yks">
                YKS Puanı{' '}
                <span className="text-muted-foreground text-xs">(200 – 500)</span>
              </Label>
              <Input
                id="yks"
                type="number"
                min={200}
                max={500}
                step={0.01}
                placeholder="örn. 468.50"
                value={yksScore}
                onChange={(e) => setYksScore(e.target.value)}
              />
              {errors.yksScore && (
                <p className="text-destructive text-xs">{errors.yksScore}</p>
              )}
            </div>
          )}

          <Button type="submit" className="w-full">
            Hesapla
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
