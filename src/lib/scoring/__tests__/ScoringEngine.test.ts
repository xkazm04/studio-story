import { describe, it, expect } from 'vitest';
import { createScoringEngine, type ScoringCriterion } from '../ScoringEngine';

// ─── Test Types ──────────────────────────────────────────

interface Fruit {
  name: string;
  color: string;
  sweetness: number;
  organic: boolean;
}

interface Preference {
  preferredColor?: string;
  minSweetness?: number;
  wantsOrganic?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────

const apple: Fruit = { name: 'apple', color: 'red', sweetness: 7, organic: true };
const banana: Fruit = { name: 'banana', color: 'yellow', sweetness: 9, organic: false };
const lime: Fruit = { name: 'lime', color: 'green', sweetness: 2, organic: true };

const criteria: ScoringCriterion<Fruit, Preference>[] = [
  {
    name: 'color',
    weight: 10,
    match: (fruit, pref) =>
      pref.preferredColor && fruit.color === pref.preferredColor
        ? { strength: 1, reason: `Color match: ${fruit.color}` }
        : 0,
  },
  {
    name: 'sweetness',
    weight: 5,
    match: (fruit, pref) =>
      pref.minSweetness && fruit.sweetness >= pref.minSweetness ? 1 : 0,
  },
  {
    name: 'organic',
    weight: 3,
    match: (fruit, pref) =>
      pref.wantsOrganic && fruit.organic ? 1 : 0,
  },
];

// ─── Tests ───────────────────────────────────────────────

describe('createScoringEngine', () => {
  it('creates an engine with frozen criteria', () => {
    const engine = createScoringEngine(criteria);
    expect(engine.criteria).toHaveLength(3);
    expect(Object.isFrozen(engine.criteria)).toBe(true);
  });

  it('does not mutate original criteria array', () => {
    const original = [...criteria];
    createScoringEngine(criteria);
    expect(criteria).toEqual(original);
  });
});

describe('scoreOne', () => {
  const engine = createScoringEngine(criteria);

  it('scores a candidate against context', () => {
    const result = engine.scoreOne(apple, { preferredColor: 'red', minSweetness: 5, wantsOrganic: true });
    // color: 10×1 + sweetness: 5×1 + organic: 3×1 = 18
    expect(result.score).toBe(18);
    expect(result.candidate).toBe(apple);
  });

  it('returns zero for no matches', () => {
    const result = engine.scoreOne(banana, { preferredColor: 'red', wantsOrganic: true });
    expect(result.score).toBe(0);
  });

  it('includes reasons from criteria that matched', () => {
    const result = engine.scoreOne(apple, { preferredColor: 'red' });
    expect(result.reasons).toContain('Color match: red');
    expect(result.reasons).toHaveLength(1);
  });

  it('provides per-criterion breakdown', () => {
    const result = engine.scoreOne(apple, { preferredColor: 'red', minSweetness: 5, wantsOrganic: true });
    expect(result.breakdown).toEqual({
      color: 10,
      sweetness: 5,
      organic: 3,
    });
  });

  it('records zero-point criteria in breakdown', () => {
    const result = engine.scoreOne(banana, { preferredColor: 'red' });
    expect(result.breakdown.color).toBe(0);
    expect(result.breakdown.sweetness).toBe(0);
  });

  it('handles match returning a plain number', () => {
    const result = engine.scoreOne(apple, { minSweetness: 5 });
    expect(result.breakdown.sweetness).toBe(5);
  });

  it('handles empty context', () => {
    const result = engine.scoreOne(apple, {});
    expect(result.score).toBe(0);
  });
});

describe('rank', () => {
  const engine = createScoringEngine(criteria);

  it('ranks candidates in descending score order', () => {
    const results = engine.rank(
      [lime, banana, apple],
      { preferredColor: 'red', minSweetness: 5, wantsOrganic: true },
    );
    expect(results.map(r => r.candidate.name)).toEqual(['apple', 'banana', 'lime']);
  });

  it('returns all candidates even with zero scores', () => {
    const results = engine.rank([apple, banana, lime], {});
    expect(results).toHaveLength(3);
    results.forEach(r => expect(r.score).toBe(0));
  });

  it('handles empty candidates array', () => {
    expect(engine.rank([], { preferredColor: 'red' })).toEqual([]);
  });

  it('handles single candidate', () => {
    const results = engine.rank([apple], { preferredColor: 'red' });
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(10);
  });
});

describe('variable strength (multi-match)', () => {
  interface Item { tags: string[] }
  interface Filter { requiredTags: string[] }

  const tagEngine = createScoringEngine<Item, Filter>([
    {
      name: 'tagOverlap',
      weight: 10,
      match: (item, filter) => {
        const overlap = item.tags.filter(t => filter.requiredTags.includes(t));
        return overlap.length;
      },
    },
  ]);

  it('multiplies weight by match count', () => {
    const result = tagEngine.scoreOne(
      { tags: ['a', 'b', 'c'] },
      { requiredTags: ['a', 'c', 'd'] },
    );
    // 2 overlapping tags × weight 10 = 20
    expect(result.score).toBe(20);
    expect(result.breakdown.tagOverlap).toBe(20);
  });
});

describe('negative weights (penalties)', () => {
  const penaltyEngine = createScoringEngine<Fruit, Preference>([
    {
      name: 'tooSweet',
      weight: -5,
      match: (fruit) => fruit.sweetness > 8 ? 1 : 0,
    },
    {
      name: 'bonus',
      weight: 10,
      match: () => 1,
    },
  ]);

  it('applies negative weight as penalty', () => {
    const result = penaltyEngine.scoreOne(banana, {});
    // tooSweet: -5×1 + bonus: 10×1 = 5
    expect(result.score).toBe(5);
    expect(result.breakdown.tooSweet).toBe(-5);
    expect(result.breakdown.bonus).toBe(10);
  });

  it('no penalty when criterion does not match', () => {
    const result = penaltyEngine.scoreOne(apple, {});
    // tooSweet: -5×0 + bonus: 10×1 = 10
    expect(result.score).toBe(10);
    expect(result.breakdown.tooSweet).toBe(0);
  });
});

describe('empty criteria', () => {
  const emptyEngine = createScoringEngine<Fruit, Preference>([]);

  it('scores everything as zero', () => {
    const result = emptyEngine.scoreOne(apple, { preferredColor: 'red' });
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
    expect(result.breakdown).toEqual({});
  });

  it('ranks all candidates equally', () => {
    const results = emptyEngine.rank([apple, banana], {});
    expect(results).toHaveLength(2);
  });
});
