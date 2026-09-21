import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EconomyPlanningDefaults } from '@workspace/api-client-react';
import {
  calculateScenario,
  getDefaultScenario,
  type ScenarioData,
} from './scenarioCalculations.ts';

const defaults: EconomyPlanningDefaults = {
  combinedSpainRentTargetEur: 1_600,
  huvudstaValueEstimateSek: 4_000_000,
  smedjebackenValueEstimateSek: 2_000_000,
  botkyrkaAskingPriceSek: 2_995_000,
  wayneMonthlyIncomeSek: 50_000,
  motherPensionAfterTaxSek: 20_000,
};

function completeScenario(overrides: Partial<ScenarioData> = {}): ScenarioData {
  return {
    ...getDefaultScenario(defaults, 'test', 'Test'),
    sekPerEur: '12',
    wSavings: '500000',
    wReserve: '100000',
    wSwedCosts: '5000',
    wBilledMonths: '6',
    wStayMonths: '4',
    wLiving: '8000',
    wTravel: '12000',
    wDeposits: '1600',
    mHuvMortgage: '1000000',
    mHuvSelling: '100000',
    mHuvTax: '200000',
    mSmedMortgage: '400000',
    mSmedSelling: '50000',
    mSmedTax: '100000',
    mReplace: '2500000',
    mMove: '100000',
    mReserve: '200000',
    mSavings: '300000',
    mNetRent: '7000',
    mSwedCosts: '4000',
    mBilledMonths: '6',
    mStayMonths: '4',
    mLiving: '7000',
    mTravel: '8000',
    mDeposits: '1600',
    ...overrides,
  };
}

describe('scenario defaults', () => {
  it('restores protected estimates and clears editable assumptions', () => {
    assert.deepEqual(getDefaultScenario(defaults, '1', 'Baseline'), {
      id: '1',
      name: 'Baseline',
      sekPerEur: '11.1',
      wSavings: '50000',
      wReserve: '25000',
      wSwedCosts: '8000',
      wSpainAcc: '800',
      wBilledMonths: '6',
      wStayMonths: '5.8',
      wLiving: '8000',
      wTravel: '4000',
      wDeposits: '800',
      mHuvSale: '4000000',
      mSellHuv: false,
      mHuvMortgage: '1000000',
      mHuvSelling: '120000',
      mHuvTax: '650000',
      mSmedSale: '2000000',
      mSellSmed: false,
      mSmedMortgage: '275000',
      mSmedSelling: '45000',
      mSmedTax: '100000',
      mReplace: '2995000',
      mMove: '100000',
      mReserve: '250000',
      mSavings: '200000',
      mUsesSmed: false,
      mNetRent: '7500',
      mSwedCosts: '8000',
      mSpainAcc: '800',
      mBilledMonths: '6',
      mStayMonths: '5.8',
      mLiving: '8000',
      mTravel: '4000',
      mDeposits: '800',
    });
  });
});

describe('unknown and zero values', () => {
  it('keeps blank required inputs unknown', () => {
    const result = calculateScenario(
      completeScenario({
        wSavings: '',
        wReserve: '',
        sekPerEur: '',
        wSpainAcc: '',
        wBilledMonths: '',
        wStayMonths: '',
        wLiving: '',
        wSwedCosts: '',
        wTravel: '',
        mNetRent: '',
      }),
      defaults,
    );

    assert.equal(result.wCap, undefined);
    assert.equal(result.wSpainSek, undefined);
    assert.equal(result.wTotalStay, undefined);
    assert.equal(result.mInc, undefined);
    assert.equal(result.mNetSaleCash, undefined);
  });

  it('treats explicit zero as a known value', () => {
    const scenario = completeScenario({
      wSavings: '0',
      wReserve: '0',
      wSpainAcc: '0',
      wDeposits: '0',
      mNetRent: '0',
    });
    const result = calculateScenario(scenario, defaults);

    assert.equal(result.wCap, 0);
    assert.equal(result.wSpainSek, 0);
    assert.equal(result.wDep, 0);
    assert.equal(result.mInc, 20_000);
  });
});

describe('property sales and rent', () => {
  it('deducts each property liability plus shared replacement, move, and reserve costs', () => {
    const result = calculateScenario(
      completeScenario({ mSellHuv: true, mSellSmed: true }),
      defaults,
    );

    assert.equal(result.mNetSaleCash, 1_350_000);
  });

  it('requires all deductions for a selected sale instead of silently treating blanks as zero', () => {
    const result = calculateScenario(
      completeScenario({ mSellHuv: true, mHuvTax: '' }),
      defaults,
    );

    assert.equal(result.mNetSaleCash, undefined);
  });

  it('stops Smedjebacken rent after sale or occupancy', () => {
    assert.equal(calculateScenario(completeScenario(), defaults).mInc, 27_000);
    assert.equal(
      calculateScenario(completeScenario({ mSellSmed: true }), defaults).mInc,
      20_000,
    );
    assert.equal(
      calculateScenario(completeScenario({ mUsesSmed: true }), defaults).mInc,
      20_000,
    );
  });
});

describe('ongoing and stay calculations', () => {
  it('converts currency and applies billed months, stay months, Swedish costs, travel, and deposits', () => {
    const result = calculateScenario(completeScenario(), defaults);

    assert.equal(result.wSpainSek, 9_600);
    assert.equal(result.wTravelMonthly, 3_000);
    assert.equal(result.wBal, 24_400);
    assert.equal(result.wTotalStay, 121_600);
    assert.equal(result.wDep, 19_200);

    assert.equal(result.mSpainSek, 9_600);
    assert.equal(result.mTravelMonthly, 2_000);
    assert.equal(result.mBal, 4_400);
    assert.equal(result.mTotalStay, 109_600);
    assert.equal(result.mDep, 19_200);
  });

  it('uses billed months only for Spanish accommodation and stay months for ongoing costs', () => {
    const result = calculateScenario(
      completeScenario({
        wBilledMonths: '8',
        wStayMonths: '3',
        mBilledMonths: '8',
        mStayMonths: '3',
      }),
      defaults,
    );

    assert.equal(result.wTotalStay, 127_800);
    assert.equal(result.mTotalStay, 117_800);
  });
});