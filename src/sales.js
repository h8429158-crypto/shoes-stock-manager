import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { toNumber } from './theme';

// Records the sale of one carton: it lowers the stock by one carton and
// writes a sale entry so the Sales screen can show what sold and for how much.
export async function sellOneCarton(shoe) {
  const pairs = toNumber(shoe.pairsPerCarton);
  const amount = pairs * toNumber(shoe.sellingPrice);
  const cost = pairs * toNumber(shoe.costPrice);

  await updateDoc(doc(db, 'shoes', shoe.id), {
    cartons: increment(-1),
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.email || '',
  });

  await addDoc(collection(db, 'sales'), {
    shoeId: shoe.id,
    name: shoe.name,
    articleNo: shoe.articleNo || '',
    cartons: 1,
    pairs,
    amount,
    profit: amount - cost,
    soldBy: auth.currentUser?.email || '',
    soldAt: serverTimestamp(),
  });
}
