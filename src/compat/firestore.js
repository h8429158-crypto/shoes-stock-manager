// DEMO mock of the firebase/firestore functions used by the app.
import { store, reviveTimestamps } from './demoStore';

export function getFirestore() {
  return { __demo: true };
}

export function collection(_db, name) {
  return { _type: 'collection', name };
}

export function doc(_db, name, id) {
  return { _type: 'doc', name, id };
}

export function query(ref, ...constraints) {
  return { _type: 'query', name: ref.name, constraints };
}

export function orderBy(field, dir = 'asc') {
  return { kind: 'orderBy', field, dir };
}

export function limit(n) {
  return { kind: 'limit', n };
}

export function serverTimestamp() {
  return { __serverTs: true };
}

export function increment(n) {
  return { __inc: n };
}

function makeQuerySnapshot(coll, constraints) {
  const rows = store.list(coll, constraints);
  return {
    docs: rows.map((r) => ({
      id: r.id,
      data: () => reviveTimestamps(r.raw),
    })),
  };
}

function makeDocSnapshot(coll, id) {
  const raw = store.get(coll, id);
  return {
    id,
    exists: () => raw !== null,
    data: () => (raw ? reviveTimestamps(raw) : undefined),
  };
}

export function onSnapshot(ref, next) {
  if (ref._type === 'doc') {
    const emit = () => next(makeDocSnapshot(ref.name, ref.id));
    const unsub = store.onDoc(ref.name, ref.id, emit);
    emit();
    return unsub;
  }
  const constraints = ref._type === 'query' ? ref.constraints : [];
  const emit = () => next(makeQuerySnapshot(ref.name, constraints));
  const unsub = store.onColl(ref.name, emit);
  emit();
  return unsub;
}

export async function addDoc(ref, data) {
  return store.add(ref.name, data);
}

export async function updateDoc(ref, data) {
  store.update(ref.name, ref.id, data);
}

export async function deleteDoc(ref) {
  store.remove(ref.name, ref.id);
}
