import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDistanceDisplay, getSizeDisplay } from './apartmentEstimates.ts';

describe('apartment guesstimate displays', () => {
  it('replaces a missing distance with a range marked as a guesstimate', () => {
    assert.deepEqual(getDistanceDisplay('Beach', 'Beach distance not stated'), {
      value: '≈ 15 min walk (5–25)',
      isGuesstimate: true,
    });
  });

  it('preserves an imported distance estimate and marks it as a guesstimate', () => {
    assert.deepEqual(
      getDistanceDisplay(
        'Pair Dist.',
        'Approximately 1,200 m (area-level estimate; exact addresses withheld)',
      ),
      {
        value: 'Approximately 1,200 m (area-level estimate; exact addresses withheld)',
        isGuesstimate: true,
      },
    );
  });

  it('replaces a missing size with a bedroom-based range marked as a guesstimate', () => {
    assert.deepEqual(getSizeDisplay({ sizeSqm: null, bedrooms: 2 }), {
      value: '≈ 65 m² (50–80)',
      isGuesstimate: true,
    });
  });

  it('does not mark source values as guesstimates', () => {
    assert.deepEqual(getDistanceDisplay('Beach', 'Source states 200 m from the sea'), {
      value: 'Source states 200 m from the sea',
      isGuesstimate: false,
    });
    assert.deepEqual(getSizeDisplay({ sizeSqm: 61, bedrooms: 2 }), {
      value: '61 m²',
      isGuesstimate: false,
    });
  });
});