import { toNumber } from './theme';

export function totalPairs(shoe) {
  return toNumber(shoe.cartons) * toNumber(shoe.pairsPerCarton);
}

export function stockCost(shoe) {
  return totalPairs(shoe) * toNumber(shoe.costPrice);
}

export function stockSaleValue(shoe) {
  return totalPairs(shoe) * toNumber(shoe.sellingPrice);
}

export function summarize(shoes) {
  return shoes.reduce(
    (acc, s) => {
      acc.articles += 1;
      acc.cartons += toNumber(s.cartons);
      acc.pairs += totalPairs(s);
      acc.cost += stockCost(s);
      acc.saleValue += stockSaleValue(s);
      return acc;
    },
    { articles: 0, cartons: 0, pairs: 0, cost: 0, saleValue: 0 }
  );
}

export function matchesSearch(shoe, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [shoe.name, shoe.articleNo, shoe.brand, shoe.location, shoe.colors]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(q));
}
