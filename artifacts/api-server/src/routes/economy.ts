import { clerkClient, getAuth } from "@clerk/express";
import { Router, type IRouter } from "express";
import { GetEconomyOverviewResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const overview = {
  reviewDate: "20 September 2026",
  headline: "Wayne’s monthly income is 11,000 SEK.",
  disclaimer:
    "Family planning snapshot, not independently audited and not a final affordability assessment. Where a useful Swedish or Alicante reference exists, unknown amounts use a midpoint and range marked guesstimate instead of zero. Property values and possible future money are not current cash.",
  sections: [
    {
      id: "mother",
      title: "Mother",
      summary:
        "Current income and known assets, with gross rental receipts kept separate from disposable income.",
      entries: [
        {
          label: "Pension",
          value: "25,000 SEK / month after tax",
          status: "current stated",
          note:
            "Latest corrected figure. The older 30,000 SEK figure was gross pension, not an additional income stream.",
          sourceDate: "17 September 2026",
        },
        {
          label: "Smedjebacken rent",
          value: "11,000 SEK / month gross",
          status: "current stated",
          note:
            "Tenants reported in place and paying under an approximately 12-month agreement. Twelve payments would total 132,000 SEK gross; precise dates remain unchecked.",
          sourceDate: "4 September 2026",
        },
        {
          label: "Combined monthly receipts",
          value: "36,000 SEK / month",
          status: "current stated",
          note:
            "Receipts before rental tax, property costs, and borrowing payments. This is not disposable income and not an all-gross income figure.",
          sourceDate: "20 September 2026",
        },
      ],
    },
    {
      id: "wayne",
      title: "Wayne",
      summary:
        "Current monthly income, kept separate from incomplete housing costs and other regular expenses.",
      entries: [
        {
          label: "Take-home income",
          value: "11,000 SEK / month after tax",
          status: "current stated",
          note:
            "Wayne’s sole monthly income baseline. Detailed regular expenses remain incomplete.",
          sourceDate: "20 September 2026",
        },
        {
          label: "Swedish home",
          value: "Johannesfredsvägen apartment retained",
          status: "current stated",
          note:
            "No sale or subletting income assumed. Swedish housing costs continue during Spain.",
          sourceDate: "20 September 2026 review",
        },
        {
          label: "Housing and regular costs",
          value: "≈8,000 SEK / month (6,000–10,000)|guesstimate",
          status: "approximate",
          note:
            "Working midpoint only. The wide range reflects Swedish household expenditure patterns and Wayne’s low stated income; replace it with actual housing, utilities, insurance, transport, debt, and recurring bills.",
          sourceDate: "2026-09-21",
        },
      ],
    },
    {
      id: "property",
      title: "Property and possible future money",
      summary:
        "Values are approximate gross property values before debt, tax, and selling costs.",
      entries: [
        {
          label: "Huvudsta apartment",
          value: "≈4,000,000 SEK (3,400,000–4,600,000)|guesstimate",
          status: "approximate",
          note:
            "Reported historical purchase about 770,000 SEK. Mortgage, carrying costs, fees, and tax-adjusted proceeds are unknown. Value is not available cash.",
          sourceDate: "September 2026 review",
        },
        {
          label: "Smedjebacken house",
          value: "≈1,100,000 SEK (900,000–1,300,000)|guesstimate",
          status: "approximate",
          note:
            "Historical purchase about 325,000 SEK and renovations about 400,000 SEK. Renovation spending is not automatically tax-deductible. Current mortgage and costs are unknown.",
          sourceDate: "September 2026",
        },
        {
          label: "Combined gross property value",
          value: "≈5,100,000 SEK (4,300,000–5,900,000)|guesstimate",
          status: "approximate",
          note:
            "Before debt, tax, and selling costs; not net wealth or accessible savings.",
          sourceDate: "20 September 2026",
        },
        {
          label: "Possible inheritance",
          value: "≈1,500,000 SEK (1,200,000–1,800,000)|guesstimate",
          status: "unconfirmed",
          note:
            "Receipt, timing, recipient, and allocation are unconfirmed. Excluded from present cash and income.",
          sourceDate: "September 2026 discussion",
        },
        {
          label: "Botkyrka proposal",
          value: "Approximately 2,995,000 SEK asking price",
          status: "option under consideration",
          note:
            "Described as about five rooms and 250 m², unverified. Not purchased; financing, transaction costs, operating costs, and rental earnings are unknown.",
          sourceDate: "September 2026 discussion",
        },
      ],
    },
    {
      id: "spain",
      title: "Spain costs",
      summary:
        "Euros remain separate from kronor; no exchange rate or confident surplus is invented.",
      entries: [
        {
          label: "Working stay",
          value: "5 Nov 2026 – 28 Apr 2027",
          status: "current stated",
          note: "Working dates, not checked against tickets.",
          sourceDate: "20 September 2026",
        },
        {
          label: "Base-rent target",
          value: "≈€1,100 / month (€900–€1,300)|guesstimate",
          status: "approximate",
          note:
            "Budget assumption for two separate furnished homes, not a quote. The split can vary. Utilities, deposits, fees, flights, insurance, and living costs are not fully established.",
          sourceDate: "20 September 2026",
        },
        {
          label: "Six-full-month comparison",
          value: "≈5.8 months (5–6)|guesstimate",
          status: "approximate",
          note:
            "Calendar-length planning estimate for 5 November through 28 April. Contracts may bill differently, so use actual billed months when known.",
          sourceDate: "20 September 2026",
        },
      ],
    },
    {
      id: "example-combinations",
      title: "Example combinations",
      summary:
        "Starting points for comparison, not recommendations or decisions.",
      entries: [
        {
          label: "Cheaper Swedish house + two Spanish rentals",
          value: "Explore",
          status: "option under consideration",
          note:
            "Compare verified net sale cash, replacement-home costs, Swedish running costs, and two separate Spanish rents.",
          sourceDate: null,
        },
        {
          label: "Swedish rental + trial winter",
          value: "Explore",
          status: "option under consideration",
          note:
            "Compare capital released after a completed sale with ongoing Swedish rent and a limited first Spain stay.",
          sourceDate: null,
        },
        {
          label: "Huvudsta + shorter visits for mum",
          value: "Explore",
          status: "option under consideration",
          note:
            "Keep Huvudsta as mum’s base while comparing Wayne’s planned stay with shorter visits and actual accommodation contracts.",
          sourceDate: null,
        },
      ],
    },
  ],
  options: [
    {
      id: "keep-huvudsta-winter-rent",
      group: "Keep a Swedish base",
      title: "Keep Huvudsta and rent in Spain for winter",
      idea: "Use Huvudsta as mum’s continuing Swedish base while renting in Spain for winter.",
      potentialBenefit: "Baseline with little upheaval and a familiar owned home to return to.",
      tradeoff: "Ongoing housing costs in both Sweden and Spain.",
      needsChecking: "Huvudsta running costs, Spain billing terms, travel, living costs, insurance, and cash reserve.",
      explore: "Enter both countries’ monthly costs and the actual billed Spain months.",
    },
    {
      id: "sell-huvudsta-cheaper-house",
      group: "Change the Swedish base",
      title: "Sell Huvudsta and buy a smaller, cheaper Swedish house",
      idea: "Compare a compact house in a well-connected, cheaper area with the approximately 2,995,000 SEK Botkyrka proposal, which is not owned.",
      potentialBenefit: "Mum retains an owned base and may preserve more capital than buying the Botkyrka proposal.",
      tradeoff: "A completed sale and purchase bring tax, selling, moving, repair, maintenance, and location tradeoffs.",
      needsChecking: "Net Huvudsta sale cash, replacement price, mortgage, tax provision, purchase costs, transport, maintenance, and family proximity.",
      explore: "Compare actual cash released after sale with replacement-home cash needs; show money not spent versus Botkyrka separately.",
    },
    {
      id: "sell-huvudsta-compact-flat",
      group: "Change the Swedish base",
      title: "Sell Huvudsta and buy a compact Swedish flat",
      idea: "Replace Huvudsta with a smaller owned flat.",
      potentialBenefit: "Potentially lower purchase cash and easier winter lock-up.",
      tradeoff: "Association fees, rules, accessibility, maintenance, and less space.",
      needsChecking: "Net sale cash, flat price, association finances and fees, moving, repairs, accessibility, transport, and family proximity.",
      explore: "Compare one-time purchase cash and recurring association costs with a smaller house.",
    },
    {
      id: "sell-huvudsta-rent-base",
      group: "Change the Swedish base",
      title: "Sell Huvudsta and rent a smaller Swedish base",
      idea: "Use a secure rental home in Sweden instead of owning Huvudsta.",
      potentialBenefit: "Less capital tied up and less owner maintenance.",
      tradeoff: "Ongoing rent, tenancy availability, security, and less control.",
      needsChecking: "Net sale cash, actual rent, tenancy terms, moving costs, transport, accessibility, and family proximity.",
      explore: "Compare monthly rent and reserve needs with owned-home running costs.",
    },
    {
      id: "let-huvudsta-during-spain",
      group: "Use existing homes differently",
      title: "Let mum’s Huvudsta during agreed Spain dates",
      idea: "Keep Huvudsta, let it only for agreed Spain dates, and return afterward.",
      potentialBenefit: "Potentially offsets part of the trip cost without selling.",
      tradeoff: "Administration, vacancy, damage, tax, and overlapping ownership costs; rent is not guaranteed.",
      needsChecking: "Permission, legal rent, insurance, contract, tenant, tax, incremental costs, paid occupancy, and exact dates.",
      explore: "Enter rent only after rental tax and costs, plus realistically paid months. This option does not concern Wayne’s apartment.",
    },
    {
      id: "use-smedjebacken-base",
      group: "Use existing homes differently",
      title: "Use Smedjebacken as mum’s base after its tenancy ends",
      idea: "Move mum to Smedjebacken after the existing tenancy ends, if practical.",
      potentialBenefit: "Could avoid another Swedish purchase.",
      tradeoff: "Smedjebacken letting receipts stop while running costs continue.",
      needsChecking: "Actual lease-end date, lawful availability, family proximity, transport, services, suitability, and running costs.",
      explore: "Set future Smedjebacken net rent to zero for occupied months; do not assume early tenant removal.",
    },
    {
      id: "sell-smedjebacken",
      group: "Use existing homes differently",
      title: "Sell Smedjebacken while keeping Huvudsta",
      idea: "Retain Huvudsta as mum’s base and consider selling Smedjebacken.",
      potentialBenefit: "Potential net equity release and simpler upkeep.",
      tradeoff: "Loss of future net rental income and sale costs.",
      needsChecking: "Mortgage, selling costs, personalised tax provision, timing, tenancy constraints, and current net rent.",
      explore: "Compare verified net sale cash with the net rent and costs that disappear after sale.",
    },
    {
      id: "trial-winter-first",
      group: "Test Spain before major changes",
      title: "Try one winter in Spain before any Swedish sale or purchase",
      idea: "Complete a rental trial before changing Swedish housing.",
      potentialBenefit: "Learn actual costs, preferred area, and day-to-day fit while retaining flexibility.",
      tradeoff: "Duplicated housing costs during the trial.",
      needsChecking: "Actual Spain contracts, Swedish ongoing costs, utilities, living costs, transport, travel, insurance, and reserve.",
      explore: "Model the trial as stay costs and monthly cash flow without sale proceeds.",
    },
    {
      id: "two-cheaper-spanish-apartments",
      group: "Adjust the Spain arrangement",
      title: "Keep two compact Spanish apartments but relax beachfront position",
      idea: "Retain separate homes while considering a well-connected cheaper area.",
      potentialBenefit: "Potentially lower combined rent while preserving privacy.",
      tradeoff: "More transport and potentially greater distance from the beach or between homes.",
      needsChecking: "Total rent, utilities, transport, actual route between homes, contract terms, and billed months.",
      explore: "Compare combined accommodation and transport costs without launching a new listing search.",
    },
    {
      id: "shared-two-bedroom-spain",
      group: "Adjust the Spain arrangement",
      title: "Try one shared two-bedroom Spanish apartment",
      idea: "Consider sharing only if both Wayne and mum want it; two separate apartments remain the default.",
      potentialBenefit: "May reduce rent and duplicated utilities.",
      tradeoff: "Less privacy and dependence on suitable bedrooms, bathrooms, and shared space.",
      needsChecking: "Actual rent, separate bedrooms, bathrooms, accessibility, privacy, utilities, and contract terms.",
      explore: "Compare one real shared-home budget with the €1,100 combined soft target for two homes.",
    },
    {
      id: "wayne-full-mum-shorter",
      group: "Adjust the Spain arrangement",
      title: "Wayne stays for the planned period while mum visits",
      idea: "Wayne keeps the planned stay while mum makes shorter visits.",
      potentialBenefit: "May better match mum’s preferred time away.",
      tradeoff: "Extra flights and a shorter visit does not itself reduce a six-month rental commitment.",
      needsChecking: "Each accommodation contract, billed months, flights, overlap, utilities, and Swedish ongoing costs.",
      explore: "Enter each person’s stay length separately from the number of billed rental months.",
    },
    {
      id: "shorter-first-stay",
      group: "Adjust the Spain arrangement",
      title: "Both try a shorter first stay and extend if suitable",
      idea: "Start with a shorter commitment and decide later whether to extend.",
      potentialBenefit: "Lower initial commitment and earlier learning.",
      tradeoff: "Potentially higher rates, limited extension availability, contract restrictions, and extra travel.",
      needsChecking: "Short-stay rates, extension terms, flights, insurance, deposits, and billed months.",
      explore: "Compare initial stay cost with a separately entered extension rather than assuming six months.",
    },
    {
      id: "later-buy-spain",
      group: "Later-stage possibility",
      title: "After a successful trial, compare renting with buying in Spain",
      idea: "Only after a successful rental trial, compare continued renting with a modest Spanish home while keeping an affordable Swedish base.",
      potentialBenefit: "Could suit repeated future use if the full ownership case later proves affordable.",
      tradeoff: "Capital becomes less liquid and ownership creates purchase, tax, fee, maintenance, insurance, and sale obligations.",
      needsChecking: "Purchase and ownership costs, liquidity, actual use, Swedish base costs, financing availability, and independent legal/tax advice.",
      explore: "Treat this as later-stage only; assume no affordability, mortgage approval, appreciation, or rental return and invent no Spanish tax rate.",
    },
  ],
  planningDefaults: {
    wayneMonthlyIncomeSek: 11000,
    motherPensionAfterTaxSek: 25000,
    motherSmedjebackenGrossRentSek: 11000,
    huvudstaValueEstimateSek: 4000000,
    smedjebackenValueEstimateSek: 1100000,
    botkyrkaAskingPriceSek: 2995000,
    combinedSpainRentTargetEur: 1100,
    stayStart: "2026-11-05",
    stayEnd: "2027-04-28",
  },
  sourceLinks: [
    {
      label: "Skatteverket: selling a home",
      url: "https://www.skatteverket.se/forsaljningbostad",
      checkedAt: "21 September 2026",
    },
    {
      label: "Lantmäteriet: stamp duty and fees",
      url: "https://www.lantmateriet.se/stampelskattavgifter",
      checkedAt: "21 September 2026",
    },
    {
      label: "SCB: household budget survey",
      url: "https://www.scb.se/en/finding-statistics/statistics-by-subject-area/household-finances/household-expenditures/household-budget-survey-hbs",
      checkedAt: "21 September 2026",
    },
    {
      label: "Numbeo: Alicante cost of living",
      url: "https://www.numbeo.com/cost-of-living/in/Alicante",
      checkedAt: "21 September 2026",
    },
  ],
  missingOrConflicting: [
    "Current housing costs, mortgages, other debts, savings, and recurring bills are incomplete.",
    "Spain utilities, deposits, fees, travel, insurance, food, and transport remain incomplete.",
    "No inheritance, grant, property sale, Huvudsta rent, or mother-to-Wayne transfer is counted as secured income.",
  ],
};

function getAllowedEconomyEmails(): Set<string> {
  return new Set(
    (process.env.ECONOMY_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
}

router.get("/economy", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const allowedEmails = getAllowedEconomyEmails();
  if (allowedEmails.size === 0) {
    req.log.error("Economy access allowlist is not configured");
    res.status(503).json({ error: "Economy access is not configured" });
    return;
  }

  const user = await clerkClient.users.getUser(userId);
  const isAllowed = user.emailAddresses.some((email) =>
    allowedEmails.has(email.emailAddress.toLocaleLowerCase()),
  );
  if (!isAllowed) {
    res.status(403).json({ error: "Economy access denied" });
    return;
  }

  res.json(GetEconomyOverviewResponse.parse(overview));
});

export default router;