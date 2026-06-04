import { Separator } from '@/components/ui/separator';
import type { EligibilityResult } from '@/lib/types';
import { ProgramRow } from './ProgramRow';

interface Props {
  results: EligibilityResult[];
}

export function ResultsTable({ results }: Props) {
  const eligible = results.filter((r) => r.eligible);
  const ineligible = results.filter((r) => !r.eligible);

  return (
    <div className="space-y-6">
      {/* Eligible programs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-base">
            Başvurabilirsin{' '}
            <span className="text-muted-foreground font-normal text-sm">
              ({eligible.length} program)
            </span>
          </h2>
        </div>

        {eligible.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center border rounded-lg">
            Girilen bilgilerle uygun program bulunamadı.
          </p>
        ) : (
          <div className="space-y-2">
            {eligible.map((r, i) => (
              <ProgramRow key={r.program.id} result={r} rank={i + 1} />
            ))}
          </div>
        )}
      </section>

      {ineligible.length > 0 && (
        <>
          <Separator />
          <section>
            <h2 className="font-semibold text-base mb-3">
              Uygun Değil{' '}
              <span className="text-muted-foreground font-normal text-sm">
                ({ineligible.length} program)
              </span>
            </h2>
            <div className="space-y-2">
              {ineligible.map((r) => (
                <ProgramRow key={r.program.id} result={r} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
