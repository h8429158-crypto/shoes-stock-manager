// ---------------------------------------------------------------------------
// DEMO-ONLY in-browser data store. This file exists purely to power the
// no-setup preview build. It mimics the small slice of the Firestore + Auth
// APIs the app actually uses, keeping data in the browser's localStorage so a
// visitor can really add / edit / sell shoes without any Firebase account.
// It is NOT used by the real (Firebase) app.
// ---------------------------------------------------------------------------

const KEY = 'shoe-demo-data-v1';

function nowMs() {
  return Date.now();
}

function ts(ms) {
  // A Firestore-Timestamp-like object: has toDate() and a sortable _ms.
  return { _ms: ms, toDate: () => new Date(ms) };
}

function reviveTimestamps(obj) {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v && typeof v === 'object' && typeof v._ms === 'number') {
      out[k] = ts(v._ms);
    }
  }
  return out;
}

const SAMPLES = [
  {
    name: 'Sports Running Shoe', articleNo: 'A-101', brand: 'Campus',
    cartons: 12, pairsPerCarton: 12, colorType: 'mixed',
    colors: 'Black, Grey, Navy', sizes: '6×2, 7×3, 8×3, 9×2, 10×2',
    costPrice: 260, sellingPrice: 340, location: 'Godown 1, Rack A',
    notes: 'Fast moving',
  },
  {
    name: 'Formal Leather Shoe', articleNo: 'F-220', brand: 'Lakhani',
    cartons: 6, pairsPerCarton: 10, colorType: 'single', colors: 'Black',
    sizes: '7×2, 8×3, 9×3, 10×2', costPrice: 420, sellingPrice: 520,
    location: 'Godown 2, Rack C', notes: '',
  },
  {
    name: 'Kids Canvas Shoe', articleNo: 'K-045', brand: '',
    cartons: 2, pairsPerCarton: 24, colorType: 'mixed',
    colors: 'Red, Blue, Pink, White', sizes: '1×6, 2×6, 3×6, 4×6',
    costPrice: 130, sellingPrice: 185, location: 'Shop counter',
    notes: 'Reorder soon',
  },
];

function seed() {
  const base = nowMs();
  const shoes = {};
  SAMPLES.forEach((s, i) => {
    const id = 'sample-' + i;
    shoes[id] = {
      ...s,
      photo: null,
      createdAt: { _ms: base - i * 1000 },
      updatedAt: { _ms: base - i * 1000 },
      createdBy: 'demo@shop.in',
      updatedBy: 'demo@shop.in',
    };
  });
  return { shoes, sales: {} };
}

let data = null;

function load() {
  if (data) return data;
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY);
    data = raw ? JSON.parse(raw) : seed();
  } catch (e) {
    data = seed();
  }
  return data;
}

function persist() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  } catch (e) {
    /* ignore quota errors in preview */
  }
}

// ---- listeners -------------------------------------------------------------
const collListeners = { shoes: new Set(), sales: new Set() };
const docListeners = {}; // `${coll}/${id}` -> Set

function notify(coll, id) {
  collListeners[coll]?.forEach((fn) => fn());
  if (id) docListeners[`${coll}/${id}`]?.forEach((fn) => fn());
}

function genId() {
  return 'id-' + Math.random().toString(36).slice(2) + nowMs().toString(36);
}

function resolveSentinels(input, existing = {}) {
  const out = {};
  for (const k of Object.keys(input)) {
    const v = input[k];
    if (v && v.__serverTs) out[k] = { _ms: nowMs() };
    else if (v && v.__inc !== undefined) out[k] = (Number(existing[k]) || 0) + v.__inc;
    else out[k] = v;
  }
  return out;
}

export const store = {
  add(coll, input) {
    load();
    const id = genId();
    data[coll][id] = resolveSentinels(input);
    persist();
    notify(coll, id);
    return { id };
  },
  update(coll, id, input) {
    load();
    const existing = data[coll][id] || {};
    data[coll][id] = { ...existing, ...resolveSentinels(input, existing) };
    persist();
    notify(coll, id);
  },
  remove(coll, id) {
    load();
    delete data[coll][id];
    persist();
    notify(coll, id);
  },
  list(coll, constraints) {
    load();
    let rows = Object.keys(data[coll]).map((id) => ({ id, raw: data[coll][id] }));
    const order = constraints.find((c) => c.kind === 'orderBy');
    if (order) {
      rows.sort((a, b) => {
        const av = a.raw[order.field];
        const bv = b.raw[order.field];
        const an = av && typeof av._ms === 'number' ? av._ms : av;
        const bn = bv && typeof bv._ms === 'number' ? bv._ms : bv;
        if (an < bn) return order.dir === 'desc' ? 1 : -1;
        if (an > bn) return order.dir === 'desc' ? -1 : 1;
        return 0;
      });
    }
    const lim = constraints.find((c) => c.kind === 'limit');
    if (lim) rows = rows.slice(0, lim.n);
    return rows;
  },
  get(coll, id) {
    load();
    return data[coll][id] || null;
  },
  onColl(coll, fn) {
    collListeners[coll].add(fn);
    return () => collListeners[coll].delete(fn);
  },
  onDoc(coll, id, fn) {
    const key = `${coll}/${id}`;
    if (!docListeners[key]) docListeners[key] = new Set();
    docListeners[key].add(fn);
    return () => docListeners[key].delete(fn);
  },
};

export { reviveTimestamps };

// ---- demo auth -------------------------------------------------------------
const AUTH_KEY = 'shoe-demo-user-v1';

function loadUser() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_KEY);
    // Default: already signed in as a demo user so the preview opens straight
    // into the stock list.
    return raw ? JSON.parse(raw) : { email: 'demo@shop.in' };
  } catch (e) {
    return { email: 'demo@shop.in' };
  }
}

export const demoAuth = {
  currentUser: loadUser(),
  _subs: new Set(),
  _emit() {
    this._subs.forEach((fn) => fn(this.currentUser));
  },
  _save() {
    try {
      if (typeof localStorage !== 'undefined') {
        if (this.currentUser) localStorage.setItem(AUTH_KEY, JSON.stringify(this.currentUser));
        else localStorage.removeItem(AUTH_KEY);
      }
    } catch (e) {
      /* ignore */
    }
  },
  subscribe(fn) {
    this._subs.add(fn);
    fn(this.currentUser);
    return () => this._subs.delete(fn);
  },
  signIn(email) {
    this.currentUser = { email };
    this._save();
    this._emit();
  },
  signOut() {
    this.currentUser = null;
    this._save();
    this._emit();
  },
};
