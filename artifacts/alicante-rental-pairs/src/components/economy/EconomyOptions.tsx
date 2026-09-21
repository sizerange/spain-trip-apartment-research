import { EconomyOption } from '@workspace/api-client-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export function EconomyOptions({ options }: { options: EconomyOption[] }) {
  const grouped = options.reduce((acc, opt) => {
    if (!acc[opt.group]) acc[opt.group] = [];
    acc[opt.group].push(opt);
    return acc;
  }, {} as Record<string, EconomyOption[]>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary mb-2">Exploration Options</h2>
        <p className="text-muted-foreground text-sm">
          Carefully evaluated possibilities mapped to benefits and known tradeoffs. These options are for comparison, not committed paths.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {Object.entries(grouped).map(([groupName, groupOptions]) => (
          <Card key={groupName} className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-secondary/40 pb-4 border-b-2 border-border">
              <CardTitle className="font-heading text-lg text-foreground tracking-wide capitalize text-sm">{groupName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {groupOptions.map((opt) => (
                  <AccordionItem key={opt.id} value={opt.id} className="border-border px-4">
                    <AccordionTrigger className="hover:no-underline hover:text-primary font-medium text-left text-sm py-4">
                      {opt.title}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 text-muted-foreground pb-4 text-sm leading-relaxed">
                      <div><strong className="text-foreground/90 font-semibold block mb-0.5">Idea</strong> {opt.idea}</div>
                      <div><strong className="text-foreground/90 font-semibold block mb-0.5">Potential Benefit</strong> {opt.potentialBenefit}</div>
                      <div><strong className="text-foreground/90 font-semibold block mb-0.5">Tradeoff</strong> {opt.tradeoff}</div>
                      <div><strong className="text-foreground/90 font-semibold block mb-0.5">Needs Checking</strong> {opt.needsChecking}</div>
                      <div className="bg-primary/5 p-3 rounded-md border border-primary/10 text-primary/90 mt-4">
                        <strong className="font-bold block mb-1">Explore</strong> {opt.explore}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
