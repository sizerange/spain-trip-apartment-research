import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEconomyFigure } from './economyFigures.ts';

describe('economy figures', () => {
  it('keeps the internal marker out of the displayed figure and exposes its label state', () => {
    assert.deepEqual(
      parseEconomyFigure('≈€1,100 / month (€900–€1,300)|guesstimate'),
      {
        figure: '≈€1,100 / month (€900–€1,300)',
        isGuesstimate: true,
      },
    );
  });
});