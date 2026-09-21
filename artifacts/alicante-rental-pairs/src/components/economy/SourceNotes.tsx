import { EconomySourceLink } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ExternalLink, Info } from 'lucide-react';

export function SourceNotes({ links }: { links: EconomySourceLink[] }) {
  return (
    <Card className="bg-secondary/20 border-2 border-border">
      <CardHeader className="pb-3 border-b-2 border-border bg-secondary/30">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Source References & Caveats
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">Critical Assumptions</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>Personalised sale tax remains user-entered and highly variable based on actual deductions from original purchase prices and structural improvements.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>Cheaper replacement purchases do not imply full tax deferral; deferral caps and strict reinvestment rules apply to the newly acquired property.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span>Land-registration costs are not automatically applied to a bostadsrätt; relevant charges for a freehold purchase must be checked separately.</span>
            </li>
          </ul>
        </div>

        {links.length > 0 && (
          <div className="pt-4 border-t border-border/40">
            <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase mb-3">External Links</h4>
            <div className="flex flex-wrap gap-2">
              {links.map((l, i) => (
                <a 
                  key={i} 
                  href={l.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 bg-background border border-border/80 rounded-md px-3 py-1.5 text-xs text-primary hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm"
                >
                  <ExternalLink className="h-3 w-3 opacity-70" />
                  <span className="font-medium">{l.label}</span>
                  <span className="text-muted-foreground/60 text-[10px] ml-1">
                    ({new Date(l.checkedAt).toLocaleDateString()})
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
