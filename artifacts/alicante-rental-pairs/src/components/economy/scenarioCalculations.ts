import type { EconomyPlanningDefaults } from '@workspace/api-client-react';

export interface ScenarioData {
  id: string;
  name: string;
  sekPerEur: string;

  wSavings: string;
  wReserve: string;
  wSwedCosts: string;
  wSpainAcc: string;
  wBilledMonths: string;
  wStayMonths: string;
  wLiving: string;
  wTravel: string;
  wDeposits: string;

  mHuvSale: string;
  mSellHuv: boolean;
  mHuvMortgage: string;
  mHuvSelling: string;
  mHuvTax: string;

  mSmedSale: string;
  mSellSmed: boolean;
  mSmedMortgage: string;
  mSmedSelling: string;
  mSmedTax: string;

  mReplace: string;
  mMove: string;
  mReserve: string;
  mSavings: string;

  mUsesSmed: boolean;
  mNetRent: string;
  mSwedCosts: string;
  mSpainAcc: string;
  mBilledMonths: string;
  mStayMonths: string;
  mLiving: string;
  mTravel: string;
  mDeposits: string;
}

export function getDefaultScenario(defaults: EconomyPlanningDefaults, id: string, name: string): ScenarioData {
  const halfTarget = defaults.combinedSpainRentTargetEur
    ? (defaults.combinedSpainRentTargetEur / 2).toString()
    : '';

  return {
    id,
    name,
    sekPerEur: '11.1',
    wSavings: '50000',
    wReserve: '25000',
    wSwedCosts: '8000',
    wSpainAcc: halfTarget,
    wBilledMonths: '6',
    wStayMonths: '5.8',
    wLiving: '8000',
    wTravel: '4000',
    wDeposits: halfTarget,
    mHuvSale: defaults.huvudstaValueEstimateSek.toString(),
    mSellHuv: false,
    mHuvMortgage: '1000000',
    mHuvSelling: '120000',
    mHuvTax: '650000',
    mSmedSale: defaults.smedjebackenValueEstimateSek.toString(),
    mSellSmed: false,
    mSmedMortgage: '275000',
    mSmedSelling: '45000',
    mSmedTax: '100000',
    mReplace: defaults.botkyrkaAskingPriceSek.toString(),
    mMove: '100000',
    mReserve: '250000',
    mSavings: '200000',
    mUsesSmed: false,
    mNetRent: '7500',
    mSwedCosts: '8000',
    mSpainAcc: halfTarget,
    mBilledMonths: '6',
    mStayMonths: '5.8',
    mLiving: '8000',
    mTravel: '4000',
    mDeposits: halfTarget,
  };
}

const parseAmount = (value: string | undefined) => {
  if (value === undefined || value.trim() === '') return undefined;
  const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? undefined : parsed;
};

const add = (...args: (number | undefined)[]) => {
  let sum = 0;
  for (const value of args) {
    if (value === undefined || isNaN(value)) return undefined;
    sum += value;
  }
  return sum;
};

const subtract = (base: number | undefined, ...args: (number | undefined)[]) => {
  if (base === undefined) return undefined;
  let result = base;
  for (const value of args) {
    if (value === undefined || isNaN(value)) return undefined;
    result -= value;
  }
  return result;
};

const multiply = (a: number | undefined, b: number | undefined) => {
  if (a === 0 || b === 0) return 0;
  if (a === undefined || b === undefined) return undefined;
  return a * b;
};

export function calculateScenario(scenario: ScenarioData, defaults: EconomyPlanningDefaults) {
  const rate = parseAmount(scenario.sekPerEur);

  const wSav = parseAmount(scenario.wSavings);
  const wRes = parseAmount(scenario.wReserve);
  const wCap = subtract(wSav, wRes);

  const wInc = defaults.wayneMonthlyIncomeSek;
  const wSwed = parseAmount(scenario.wSwedCosts);
  const wSpainEur = parseAmount(scenario.wSpainAcc);
  const wSpainSek = multiply(wSpainEur, rate);
  const wLiv = parseAmount(scenario.wLiving);
  const wStay = parseAmount(scenario.wStayMonths);
  const wTravel = parseAmount(scenario.wTravel);
  const wTravelMonthly =
    wTravel !== undefined && wStay !== undefined && wStay > 0
      ? wTravel / wStay
      : undefined;
  const wBal = subtract(wInc, wSwed, wSpainSek, wLiv, wTravelMonthly);

  const wBilled = parseAmount(scenario.wBilledMonths);
  const wTotalSpain = multiply(wSpainSek, wBilled);
  const wTotalLiv = multiply(wLiv, wStay);
  const wTotalSwedish = multiply(wSwed, wStay);
  const wTotalStay = add(wTotalSpain, wTotalLiv, wTotalSwedish, wTravel);
  const wDep = multiply(parseAmount(scenario.wDeposits), rate);

  const mHuvSale = parseAmount(scenario.mHuvSale);
  const hSold = scenario.mSellHuv;
  const hNet = hSold
    ? subtract(
        mHuvSale,
        parseAmount(scenario.mHuvMortgage),
        parseAmount(scenario.mHuvSelling),
        parseAmount(scenario.mHuvTax),
      )
    : 0;

  const mSmedSale = parseAmount(scenario.mSmedSale);
  const sSold = scenario.mSellSmed;
  const sNet = sSold
    ? subtract(
        mSmedSale,
        parseAmount(scenario.mSmedMortgage),
        parseAmount(scenario.mSmedSelling),
        parseAmount(scenario.mSmedTax),
      )
    : 0;

  let mNetSaleCash: number | undefined;
  if (hSold || sSold) {
    mNetSaleCash = subtract(
      add(hNet, sNet),
      parseAmount(scenario.mReplace),
      parseAmount(scenario.mMove),
      parseAmount(scenario.mReserve),
    );
  }

  const mSav = parseAmount(scenario.mSavings);
  const mRentInput = parseAmount(scenario.mNetRent);
  const mRent = sSold || scenario.mUsesSmed ? 0 : mRentInput;
  const mIncBase = defaults.motherPensionAfterTaxSek;
  const mInc = add(mIncBase, mRent);

  const mSwed = parseAmount(scenario.mSwedCosts);
  const mSpainEur = parseAmount(scenario.mSpainAcc);
  const mSpainSek = multiply(mSpainEur, rate);
  const mLiv = parseAmount(scenario.mLiving);
  const mStay = parseAmount(scenario.mStayMonths);
  const mTravel = parseAmount(scenario.mTravel);
  const mTravelMonthly =
    mTravel !== undefined && mStay !== undefined && mStay > 0
      ? mTravel / mStay
      : undefined;
  const mBal = subtract(mInc, mSwed, mSpainSek, mLiv, mTravelMonthly);

  const mBilled = parseAmount(scenario.mBilledMonths);
  const mTotalSpain = multiply(mSpainSek, mBilled);
  const mTotalLiv = multiply(mLiv, mStay);
  const mTotalSwedish = multiply(mSwed, mStay);
  const mTotalStay = add(mTotalSpain, mTotalLiv, mTotalSwedish, mTravel);
  const mDep = multiply(parseAmount(scenario.mDeposits), rate);

  return {
    wCap,
    wInc,
    wSwed,
    wSpainSek,
    wLiv,
    wTravelMonthly,
    wBal,
    wTotalStay,
    wDep,
    hSold,
    sSold,
    mNetSaleCash,
    mSav,
    mInc,
    mSwed,
    mSpainSek,
    mLiv,
    mTravelMonthly,
    mBal,
    mTotalStay,
    mDep,
  };
}