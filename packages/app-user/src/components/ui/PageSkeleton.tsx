import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PageSkeletonVariant = 'default' | 'dashboard';

interface PageSkeletonProps {
  /** Variante layout: default (generico), dashboard (griglia card) */
  variant?: PageSkeletonVariant;
  className?: string;
}

/**
 * Scheletro di pagina per fallback di route lazy.
 * Mostra la struttura della pagina (header + contenuto) invece della rotella di caricamento.
 */
export function PageSkeleton({ variant = 'default', className }: PageSkeletonProps) {
  return (
    <div
      className={cn(
        'min-h-screen w-full bg-black',
        'flex flex-col',
        className
      )}
      aria-label="Caricamento pagina"
    >
      {/* Header placeholder: barra in alto con logo e spazio */}
      <header className="flex-shrink-0 h-14 sm:h-16 px-4 flex items-center justify-between border-b border-white/10">
        <Skeleton className="h-8 w-28 bg-white/10 rounded" />
        <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
      </header>

      {/* Contenuto principale */}
      <main className="flex-1 p-4 sm:p-6">
        {variant === 'dashboard' ? (
          <DashboardSkeletonContent />
        ) : (
          <DefaultSkeletonContent />
        )}
      </main>
    </div>
  );
}

function DefaultSkeletonContent() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48 bg-white/10 rounded" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full bg-white/10 rounded" />
        <Skeleton className="h-4 w-full bg-white/10 rounded" />
        <Skeleton className="h-4 w-3/4 bg-white/10 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 pt-4">
        <Skeleton className="h-32 bg-white/10 rounded-xl" />
        <Skeleton className="h-32 bg-white/10 rounded-xl" />
      </div>
      <Skeleton className="h-40 w-full bg-white/10 rounded-xl mt-6" />
    </div>
  );
}

function DashboardSkeletonContent() {
  return (
    <div className="space-y-6">
      {/* Titolo sezione */}
      <Skeleton className="h-7 w-40 bg-white/10 rounded" />
      {/* Griglia card KPI / dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            className="h-24 sm:h-28 bg-white/10 rounded-xl"
          />
        ))}
      </div>
      {/* Blocco contenuto secondario */}
      <div className="grid gap-4 sm:grid-cols-2 pt-2">
        <Skeleton className="h-48 bg-white/10 rounded-xl" />
        <Skeleton className="h-48 bg-white/10 rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full bg-white/10 rounded-xl" />
    </div>
  );
}
