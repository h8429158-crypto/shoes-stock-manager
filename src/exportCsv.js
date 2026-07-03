import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { totalPairs, stockCost, stockSaleValue } from './shoeUtils';

function cell(value) {
  // Wrap every value in quotes and escape any quotes inside, so commas
  // in names or colour lists don't break the columns.
  const s = value === null || value === undefined ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

const HEADERS = [
  'Shoe name',
  'Article no.',
  'Brand',
  'Cartons',
  'Pairs per carton',
  'Total pairs',
  'Colour type',
  'Colours',
  'Sizes in carton',
  'Cost price/pair',
  'Selling price/pair',
  'Total stock cost',
  'Total sale value',
  'Expected profit',
  'Stocked at',
  'Notes',
  'Last updated by',
];

export function buildCsv(shoes) {
  const rows = [HEADERS.map(cell).join(',')];
  for (const s of shoes) {
    const pairs = totalPairs(s);
    const cost = stockCost(s);
    const sale = stockSaleValue(s);
    rows.push(
      [
        s.name,
        s.articleNo,
        s.brand,
        s.cartons,
        s.pairsPerCarton,
        pairs,
        s.colorType === 'mixed' ? 'Mixed' : 'Single',
        s.colors,
        s.sizes,
        s.costPrice,
        s.sellingPrice,
        cost,
        sale,
        sale - cost,
        s.location,
        s.notes,
        s.updatedBy,
      ]
        .map(cell)
        .join(',')
    );
  }
  return rows.join('\n');
}

export async function exportShoesToCsv(shoes) {
  if (!shoes.length) {
    Alert.alert('Nothing to export', 'Add some shoes to the stock first.');
    return;
  }
  try {
    const csv = buildCsv(shoes);
    const date = new Date().toISOString().slice(0, 10);
    const uri = `${FileSystem.cacheDirectory}shoe-stock-${date}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Shoe stock export',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert('Saved', `Stock list saved to:\n${uri}`);
    }
  } catch (e) {
    Alert.alert('Export failed', 'Could not create the file. Please try again.');
  }
}
