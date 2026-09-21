import React, { useState } from 'react';
import { EconomyPlanningDefaults } from '@workspace/api-client-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  calculateScenario,
  getDefaultScenario,
  type ScenarioData,
} from './scenarioCalculations';

export {
  calculateScenario,
  getDefaultScenario,
  type ScenarioData,
} from './scenarioCalculations';
function Fmt({ val, currency = "SEK", sign = false, fallback, guesstimate = false }: { val?: number, currency?: string, sign?: boolean, fallback?: string, guesstimate?: boolean }) {
  if (val === undefined || isNaN(val)) {
    if (fallback) return <span className="text-muted-foreground font-mono font-bold text-[10px] uppercase tracking-wider">{fallback}</span>;
    return <span className="text-destructive font-mono font-bold text-[10px] uppercase tracking-wider">Needs figures</span>;
  }
  const str = Math.round(val).toLocaleString('sv-SE');
  const prefix = sign && val > 0 ? "+" : (sign && val < 0 ? "" : "");
  return (
    <span className="flex flex-col items-end">
      <span className={cn("font-mono font-medium tracking-tight", val < 0 && "text-destructive")}>{prefix}{str} <span className="text-[10px] uppercase">{currency}</span></span>
      {guesstimate && <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">guesstimate</span>}
    </span>
  );
}

function NumInput({ label, value, onChange, placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <label className="text-sm text-muted-foreground font-medium">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        className="w-28 text-right bg-background border-2 border-border rounded px-2 py-1.5 text-sm font-mono focus:ring-1 focus:ring-primary focus:outline-none transition-shadow placeholder:text-muted-foreground/50"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ScenarioCard({ scenario, defaults, onChange, onRemove }: { scenario: ScenarioData, defaults: EconomyPlanningDefaults, onChange: (s: ScenarioData) => void, onRemove?: () => void }) {
  const out = calculateScenario(scenario, defaults);

  return (
    <Card className="min-w-[85vw] sm:min-w-[340px] sm:max-w-[360px] h-[720px] flex-shrink-0 flex flex-col shadow-sm hover:shadow-md transition-shadow border-2 border-border bg-card overflow-hidden">
      <CardHeader className="bg-secondary/40 p-3 border-b-2 border-border flex flex-row items-center justify-between shrink-0">
        <input
          value={scenario.name}
          onChange={e => onChange({ ...scenario, name: e.target.value })}
          className="font-heading font-bold text-lg bg-transparent border-0 focus:ring-1 focus:ring-primary/20 rounded px-1 -ml-1 w-full text-foreground"
        />
        {onRemove && (
           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 ml-2" onClick={onRemove}>
             <Trash2 className="h-4 w-4" />
           </Button>
        )}
         <span className="ml-2 shrink-0 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">guesstimate defaults</span>
      </CardHeader>
      <CardContent className="p-3 flex-1 flex flex-col gap-4 overflow-hidden">
        <Tabs defaultValue="outputs" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-secondary/40 border border-border rounded-md shrink-0">
            <TabsTrigger value="outputs" className="text-[11px] py-1.5 font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Outputs</TabsTrigger>
            <TabsTrigger value="general" className="text-[11px] py-1.5 font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Shared</TabsTrigger>
            <TabsTrigger value="wayne" className="text-[11px] py-1.5 font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Wayne</TabsTrigger>
            <TabsTrigger value="mum" className="text-[11px] py-1.5 font-medium data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Mum</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar mt-4 pb-4">
            <TabsContent value="outputs" className="space-y-5 mt-0">
               <div className="space-y-2">
                 <h4 className="font-heading text-primary border-b border-primary/20 pb-1 text-sm font-bold tracking-wide uppercase">Wayne</h4>
                 <div className="bg-primary/5 rounded border-2 border-primary/30 p-2.5 space-y-2 text-sm">
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Available Capital</span>
                       <Fmt val={out.wCap} guesstimate />
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Income</span>
                       <Fmt val={out.wInc} />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Swedish Costs</span>
                         <Fmt val={out.wSwed === undefined ? undefined : -out.wSwed} sign guesstimate />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Spain Costs</span>
                         <Fmt val={out.wSpainSek === undefined ? undefined : -out.wSpainSek} sign guesstimate />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Living, travel & insurance</span>
                        <Fmt val={
                          out.wLiv === undefined || out.wTravelMonthly === undefined
                            ? undefined
                            : -(out.wLiv + out.wTravelMonthly)
                        } sign guesstimate />
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between font-bold text-foreground">
                       <span>Monthly Balance</span>
                       <Fmt val={out.wBal} sign guesstimate />
                    </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <h4 className="font-heading text-primary border-b border-primary/20 pb-1 text-sm font-bold tracking-wide uppercase">Mum</h4>
                 <div className="bg-primary/5 rounded border-2 border-primary/30 p-2.5 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">Combined Net Sale</span>
                       <Fmt val={out.mNetSaleCash} fallback={(!out.hSold && !out.sSold) ? "Retained" : undefined} />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Available Savings</span>
                       <Fmt val={out.mSav} guesstimate />
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Income (w/ Rent)</span>
                       <Fmt val={out.mInc} guesstimate />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Swedish Costs</span>
                         <Fmt val={out.mSwed === undefined ? undefined : -out.mSwed} sign guesstimate />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Spain Costs</span>
                         <Fmt val={out.mSpainSek === undefined ? undefined : -out.mSpainSek} sign guesstimate />
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Living, travel & insurance</span>
                        <Fmt val={
                          out.mLiv === undefined || out.mTravelMonthly === undefined
                            ? undefined
                            : -(out.mLiv + out.mTravelMonthly)
                        } sign guesstimate />
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between font-bold text-foreground">
                       <span>Monthly Balance</span>
                       <Fmt val={out.mBal} sign guesstimate />
                    </div>
                 </div>
               </div>

               <div className="space-y-2">
                 <h4 className="font-heading text-primary border-b border-primary/20 pb-1 text-sm font-bold tracking-wide uppercase">Stay Totals & Deposits</h4>
                 <div className="bg-secondary/40 rounded border-2 border-secondary p-2.5 space-y-2 text-sm">
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Wayne Stay Total</span>
                       <Fmt val={out.wTotalStay} guesstimate />
                    </div>
                    <div className="flex justify-between">
                       <span className="text-muted-foreground">Mum Stay Total</span>
                       <Fmt val={out.mTotalStay} guesstimate />
                    </div>
                    <div className="h-px bg-border/50 my-1" />
                    <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">Wayne Deposit</span>
                       <Fmt val={out.wDep} guesstimate />
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-muted-foreground">Mum Deposit</span>
                       <Fmt val={out.mDep} guesstimate />
                    </div>
                 </div>
               </div>
            </TabsContent>

            <TabsContent value="general" className="mt-0 space-y-6">
              <div className="space-y-1">
                <NumInput label="SEK per EUR" value={scenario.sekPerEur} onChange={v => onChange({...scenario, sekPerEur: v})} />
              </div>
            </TabsContent>

            <TabsContent value="wayne" className="mt-0 space-y-6">
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Capital</h5>
                <NumInput label="Available Savings" value={scenario.wSavings} onChange={v => onChange({...scenario, wSavings: v})} />
                <NumInput label="Cash Reserve" value={scenario.wReserve} onChange={v => onChange({...scenario, wReserve: v})} />
              </div>
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Ongoing & Stay</h5>
                <NumInput label="Swedish Costs" value={scenario.wSwedCosts} onChange={v => onChange({...scenario, wSwedCosts: v})} />
                <NumInput label="Spain Acc/Utils (€)" value={scenario.wSpainAcc} onChange={v => onChange({...scenario, wSpainAcc: v})} placeholder="Budget assumpt." />
                <NumInput label="Billed Months" value={scenario.wBilledMonths} onChange={v => onChange({...scenario, wBilledMonths: v})} />
                <NumInput label="Stay Months" value={scenario.wStayMonths} onChange={v => onChange({...scenario, wStayMonths: v})} />
                <NumInput label="Living/transport/ins. monthly" value={scenario.wLiving} onChange={v => onChange({...scenario, wLiving: v})} />
                <NumInput label="Travel total" value={scenario.wTravel} onChange={v => onChange({...scenario, wTravel: v})} />
                <NumInput label="Deposit (€)" value={scenario.wDeposits} onChange={v => onChange({...scenario, wDeposits: v})} />
              </div>
            </TabsContent>

            <TabsContent value="mum" className="mt-0 space-y-6">
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Huvudsta Sale</h5>
                <label className="flex items-center gap-3 py-3 border-b border-border text-sm font-medium text-foreground cursor-pointer">
                  <input type="checkbox" checked={scenario.mSellHuv} onChange={e => onChange({...scenario, mSellHuv: e.target.checked})} />
                  Sell Huvudsta
                </label>
                <NumInput label="Editable value estimate" value={scenario.mHuvSale} onChange={v => onChange({...scenario, mHuvSale: v})} />
                <NumInput label="Mortgage" value={scenario.mHuvMortgage} onChange={v => onChange({...scenario, mHuvMortgage: v})} />
                <NumInput label="Selling Costs" value={scenario.mHuvSelling} onChange={v => onChange({...scenario, mHuvSelling: v})} />
                <NumInput label="Tax Provision" value={scenario.mHuvTax} onChange={v => onChange({...scenario, mHuvTax: v})} />
              </div>
              <div className="space-y-1 border-t border-border pt-4 mt-2">
                <h5 className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Smedjebacken Sale</h5>
                <label className="flex items-center gap-3 py-3 border-b border-border text-sm font-medium text-foreground cursor-pointer">
                  <input type="checkbox" checked={scenario.mSellSmed} onChange={e => onChange({...scenario, mSellSmed: e.target.checked})} />
                  Sell Smedjebacken
                </label>
                <NumInput label="Editable value estimate" value={scenario.mSmedSale} onChange={v => onChange({...scenario, mSmedSale: v})} />
                <NumInput label="Mortgage" value={scenario.mSmedMortgage} onChange={v => onChange({...scenario, mSmedMortgage: v})} />
                <NumInput label="Selling Costs" value={scenario.mSmedSelling} onChange={v => onChange({...scenario, mSmedSelling: v})} />
                <NumInput label="Tax Provision" value={scenario.mSmedTax} onChange={v => onChange({...scenario, mSmedTax: v})} />
              </div>
              <div className="space-y-1 border-t border-border pt-4 mt-2">
                <h5 className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Capital Deductions</h5>
                <NumInput label="Replacement Home" value={scenario.mReplace} onChange={v => onChange({...scenario, mReplace: v})} />
                <p className="text-[11px] leading-relaxed text-muted-foreground">Botkyrka is only a 2,995,000 SEK proposal, not an owned home or assumed purchase.</p>
                <NumInput label="Move & Repairs" value={scenario.mMove} onChange={v => onChange({...scenario, mMove: v})} />
                <NumInput label="Cash Reserve" value={scenario.mReserve} onChange={v => onChange({...scenario, mReserve: v})} />
                <div className="h-2" />
                <NumInput label="Available Savings" value={scenario.mSavings} onChange={v => onChange({...scenario, mSavings: v})} />
              </div>
              <div className="space-y-1 border-t border-border pt-4 mt-2">
                <h5 className="text-[10px] font-bold text-primary/70 uppercase tracking-wider mb-2">Ongoing & Stay</h5>
                {!out.sSold && (
                   <label className="flex items-center gap-3 py-3 border-b border-border text-sm font-medium text-foreground cursor-pointer hover:bg-secondary/30 transition-colors px-2 rounded -mx-2">
                      <input type="checkbox" checked={scenario.mUsesSmed} onChange={e => onChange({...scenario, mUsesSmed: e.target.checked})} className="rounded text-primary focus:ring-primary h-4 w-4 border-border bg-background" />
                      Mum uses Smedjebacken
                   </label>
                )}
                <NumInput label="Net Rent (SEK)" value={scenario.mNetRent} onChange={v => onChange({...scenario, mNetRent: v})} placeholder="e.g. after tax (11k gross base)" />
                <NumInput label="Swedish Costs" value={scenario.mSwedCosts} onChange={v => onChange({...scenario, mSwedCosts: v})} />
                <NumInput label="Spain Acc/Utils (€)" value={scenario.mSpainAcc} onChange={v => onChange({...scenario, mSpainAcc: v})} placeholder="Budget assumpt." />
                <NumInput label="Billed Months" value={scenario.mBilledMonths} onChange={v => onChange({...scenario, mBilledMonths: v})} />
                <NumInput label="Stay Months" value={scenario.mStayMonths} onChange={v => onChange({...scenario, mStayMonths: v})} />
                <NumInput label="Living/transport/ins. monthly" value={scenario.mLiving} onChange={v => onChange({...scenario, mLiving: v})} />
                <NumInput label="Travel total" value={scenario.mTravel} onChange={v => onChange({...scenario, mTravel: v})} />
                <NumInput label="Deposit (€)" value={scenario.mDeposits} onChange={v => onChange({...scenario, mDeposits: v})} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export function ScenarioPlanner({ defaults }: { defaults: EconomyPlanningDefaults }) {
  const [scenarios, setScenarios] = useState<ScenarioData[]>([
    getDefaultScenario(defaults, "1", "Baseline")
  ]);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    setScenarios([...scenarios, getDefaultScenario(defaults, Date.now().toString(), `Scenario ${scenarios.length + 1}`)]);
  };

  const reset = () => setScenarios([getDefaultScenario(defaults, "1", "Baseline")]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-heading font-bold text-primary">What-If Scenarios</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Compare up to three hypothetical futures side-by-side.
            <br />
             <strong>Note:</strong> Inheritance is excluded. No transfers between family members are assumed. Capital is not income. Resetting restores midpoint guesstimates based on Swedish household patterns and Alicante reference costs. Replace them with actual figures whenever available.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={reset} className="gap-2 border-border">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button variant="default" size="sm" onClick={addScenario} disabled={scenarios.length >= 3} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Scenario
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 hide-scrollbar items-start">
          {scenarios.map((s, idx) => (
            <div key={s.id} className="snap-center shrink-0">
              <ScenarioCard 
                scenario={s} 
                defaults={defaults} 
                onChange={(ns) => {
                  const newScen = [...scenarios];
                  newScen[idx] = ns;
                  setScenarios(newScen);
                }} 
                onRemove={scenarios.length > 1 ? () => {
                  setScenarios(scenarios.filter((_, i) => i !== idx));
                } : undefined}
              />
            </div>
          ))}
          {scenarios.length < 3 && (
            <button 
              onClick={addScenario}
              className="snap-center shrink-0 min-w-[340px] max-w-[360px] h-[400px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-secondary/20 hover:text-primary transition-colors hover:border-primary/40 cursor-pointer"
            >
              <Plus className="h-8 w-8 mb-2 opacity-50" />
              <span className="font-medium font-heading">Add Scenario</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
