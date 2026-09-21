import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validatePairAffordability } from './apartment-pair-affordability.ts';

function pair(leftRent: number | null, rightRent: number | null, combinedRent: number | null) {
  return {
    id: 'pair-test',
    combinedMonthlyRentEur: combinedRent,
    paper: { monthlyRentEur: leftRent },
    apartment: { monthlyRentEur: rightRent },
  };
}

describe('apartment pair affordability', () => {
  it('does not let a missing or guessed listing rent qualify under the soft maximum', () => {
    assert.match(
      validatePairAffordability(pair(null, 500, 1_000), 1_100, false).join('\n'),
      /cannot qualify without source-quoted rent/,
    );
    assert.match(
      validatePairAffordability(pair(500, null, 1_000), 1_100, false).join('\n'),
      /cannot qualify without source-quoted rent/,
    );
  });

  it('accepts a pair only when both quoted rents support its under-limit total', () => {
    assert.deepEqual(validatePairAffordability(pair(500, 600, 1_100), 1_100, false), []);
  });
});