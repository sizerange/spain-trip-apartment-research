import { useGetEconomyOverview } from '@workspace/api-client-react';
import type { EconomyEntryStatus } from '@workspace/api-client-react';
import { useAuth } from '@clerk/react';
import { Lock, ShieldAlert, AlertCircle, FileText, ChevronRight, CheckCircle2, HelpCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ScenarioPlanner } from '@/components/economy/ScenarioPlanner';
import { EconomyOptions } from '@/components/economy/EconomyOptions';
import { SourceNotes } from '@/components/economy/SourceNotes';
import { parseEconomyFigure } from '@/lib/economyFigures';

function StatusBadge({ status }: { status: EconomyEntryStatus }) {
  const statusConfig = {
    'current stated': {
      label: 'Current Stated',
      className: 'bg-success/10 text-success dark:bg-success/20 dark:text-success border-success/20',
      icon: CheckCircle2
    },
    'approximate': {
      label: 'Approximate',
      className: 'bg-accent/30 text-accent-foreground dark:bg-accent/20 dark:text-accent-foreground border-accent/40',
      icon: HelpCircle
    },
    'unconfirmed': {
      label: 'Unconfirmed',
      className: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive border-destructive/20',
      icon: AlertCircle
    },
    'option under consideration': {
      label: 'Considering',
      className: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border-primary/20',
      icon: Clock
    }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
    icon: FileText
  };

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider font-bold", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function EconomyFigure({ value, testId }: { value: string; testId: string }) {
  const { figure, isGuesstimate } = parseEconomyFigure(value);
  return (
    <div className="flex flex-col items-end">
      <div className="font-mono text-lg font-semibold tracking-tight text-foreground" data-testid={testId}>
        {figure}
      </div>
      {isGuesstimate && (
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground" data-testid={`${testId}-guesstimate`}>
          guesstimate
        </span>
      )}
    </div>
  );
}

function EconomyDashboard() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { data, isLoading, error } = useGetEconomyOverview({
    query: {
      enabled: isLoaded && isSignedIn,
      queryKey: ['/api/economy', userId ?? 'signed-out'],
      retry: false,
    },
    request: {
      cache: 'no-store',
    },
  });

  if (!isLoaded || (isSignedIn && isLoading)) {
    return (
      <div className="space-y-12 animate-in fade-in duration-500">
        <div className="space-y-3">
          <Skeleton className="h-12 w-3/4 max-w-[500px] rounded-lg bg-secondary/50" />
          <Skeleton className="h-5 w-1/2 max-w-[300px] rounded-md bg-secondary/50" />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-2 border-border shadow-sm">
              <CardHeader className="bg-secondary/20 border-b-2 border-border">
                <Skeleton className="h-6 w-1/2 rounded-md mb-2 bg-secondary/60" />
                <Skeleton className="h-4 w-full rounded-md bg-secondary/40" />
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {[1, 2].map((j) => (
                  <div key={j} className="flex justify-between items-center pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32 rounded-md bg-secondary/60" />
                      <Skeleton className="h-3 w-20 rounded-md bg-secondary/40" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-md bg-secondary/60" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Alert className="mt-8 bg-card border-border shadow-sm">
        <Lock className="h-5 w-5 text-primary" />
        <AlertTitle className="font-heading text-xl text-primary">Protected Area</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This workspace contains sensitive family financial planning details. Sign in with an authorised account to continue.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    const isUnauthorized = (error as any)?.status === 401 || (error as any)?.status === 403;
    
    return (
      <Alert variant="destructive" className="mt-8 border-destructive/30 bg-destructive/5 shadow-sm">
        {isUnauthorized ? <Lock className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        <AlertTitle className="font-heading text-xl">
          {isUnauthorized ? "Access Denied" : "Unable to load overview"}
        </AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          {isUnauthorized 
            ? "Your account is not authorised to view this family workspace. This area is strictly restricted."
            : "We encountered a problem loading the financial overview. Please try again later."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-16 animate-in slide-in-from-bottom-4 duration-700 pb-24 pt-6">
      {/* Baseline Sections */}
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-primary mb-2">Current Baseline</h2>
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {data.sections.map((section) => (
            <Card key={section.id} className="overflow-hidden border-2 border-border shadow-sm transition-shadow hover:shadow-md">
              <div className="bg-secondary/40 px-6 py-5 border-b-2 border-border">
                <CardTitle className="font-heading text-xl text-foreground">{section.title}</CardTitle>
                <CardDescription className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{section.summary}</CardDescription>
              </div>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {section.entries.map((entry, idx) => (
                    <li key={idx} className="p-6 transition-colors hover:bg-secondary/20">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="font-medium text-foreground">{entry.label}</div>
                          {entry.note && <p className="text-sm text-muted-foreground leading-relaxed">{entry.note}</p>}
                          {entry.sourceDate && (
                            <p className="text-[11px] tracking-wide text-muted-foreground/60 uppercase mt-2 font-medium">
                              Source date: {new Date(entry.sourceDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0">
                          <EconomyFigure value={entry.value} testId={`text-economy-${section.id}-${idx}`} />
                          <StatusBadge status={entry.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="h-px bg-border w-full" />

      {/* What-If Planner */}
      <ScenarioPlanner defaults={data.planningDefaults} />

      <div className="h-px bg-border w-full" />

      {/* Options */}
      <EconomyOptions options={data.options} />

      {/* Missing or Conflicting & Sources */}
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {data.missingOrConflicting && data.missingOrConflicting.length > 0 && (
          <Card className="border-2 border-destructive/30 bg-destructive/5 shadow-sm">
            <CardHeader className="pb-3 border-b-2 border-destructive/20 bg-destructive/10">
              <CardTitle className="flex items-center gap-2 text-destructive font-heading text-lg">
                <ShieldAlert className="h-5 w-5" />
                Information Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <ul className="space-y-3">
                {data.missingOrConflicting.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm text-foreground/80 items-start leading-relaxed">
                    <ChevronRight className="h-4 w-4 text-destructive/60 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <SourceNotes links={data.sourceLinks} />
      </div>
    </div>
  );
}

export function Economy() {
  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-background px-4 py-12 md:py-16">
      <div className="container mx-auto max-w-6xl">
        <EconomyDashboard />
      </div>
    </div>
  );
}
