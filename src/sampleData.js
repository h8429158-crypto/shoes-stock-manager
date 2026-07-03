import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// A few realistic wholesale entries so a first-time user can see how the
// app looks and works. They are normal records — edit or delete them freely.
const SAMPLES = [
  {
    name: 'Sports Running Shoe',
    articleNo: 'A-101',
    brand: 'Campus',
    cartons: 12,
    pairsPerCarton: 12,
    colorType: 'mixed',
    colors: 'Black, Grey, Navy',
    sizes: '6×2, 7×3, 8×3, 9×2, 10×2',
    costPrice: 260,
    sellingPrice: 340,
    location: 'Godown 1, Rack A',
    notes: 'Fast moving',
  },
  {
    name: 'Formal Leather Shoe',
    articleNo: 'F-220',
    brand: 'Lakhani',
    cartons: 6,
    pairsPerCarton: 10,
    colorType: 'single',
    colors: 'Black',
    sizes: '7×2, 8×3, 9×3, 10×2',
    costPrice: 420,
    sellingPrice: 520,
    location: 'Godown 2, Rack C',
    notes: '',
  },
  {
    name: 'Kids Canvas Shoe',
    articleNo: 'K-045',
    brand: '',
    cartons: 2,
    pairsPerCarton: 24,
    colorType: 'mixed',
    colors: 'Red, Blue, Pink, White',
    sizes: '1×6, 2×6, 3×6, 4×6',
    costPrice: 130,
    sellingPrice: 185,
    location: 'Shop counter',
    notes: 'Reorder soon',
  },
];

export async function addSampleShoes() {
  const email = auth.currentUser?.email || '';
  for (const s of SAMPLES) {
    await addDoc(collection(db, 'shoes'), {
      ...s,
      photo: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: email,
      updatedBy: email,
    });
  }
}
