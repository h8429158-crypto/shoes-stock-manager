# 👟 Shoe Stock Manager

A simple mobile app for managing the stock of a shoes wholesale business.
Works on **Android and iPhone**, and everyone who signs in sees the **same
stock, updated live** — when one person adds or sells shoes, it appears on
everyone else's phone within a second or two.

## What the app can do

- 🔐 **Accounts** — each person (you, your father, staff) signs in with their
  own email and password. All accounts share the same live stock.
- ⚡ **Real-time sync** — any change (add, edit, sell a carton, delete) shows
  up instantly on every signed-in phone.
- 📷 **Shoe photos** — take a photo or pick one from the gallery for every
  shoe article.
- 📦 **Carton details** — number of cartons, pairs in one carton, single or
  mixed colour, which colours, and the sizes packed in one carton
  (e.g. `6×2, 7×3, 8×3, 9×2, 10×2`).
- 💰 **Prices** — cost price and selling price per pair, with automatic
  totals: total pairs, total stock cost, total sale value, and expected profit.
- 📊 **Dashboard** — the home screen shows the total stock value, pairs,
  cartons and articles at a glance.
- 📍 **Storage place** — note where each article is kept
  (e.g. "Godown 2, Rack B") and search by it.
- 🔍 **Search** — find shoes by name, article number, brand, colour or place.
- ⚠️ **Low stock warning** — articles with 2 cartons or fewer are marked
  **LOW** in red so you know what to reorder.
- ➖➕ **Quick sell/restock** — on a shoe's page, tap − when a carton is sold
  and ＋ when new stock arrives.
- 🧾 **Who changed what** — every article shows who last updated it.
- 📤 **Export to Excel/CSV** — tap **Export** on the home screen to share the
  whole stock list as a spreadsheet file (WhatsApp, email, print, backup).

---

## One-time setup (about 15 minutes, free)

You need two things: a **Firebase project** (Google's free database that
gives the app its live sync) and **Node.js** on a computer to run the app.

### Step 1 — Create the Firebase project

1. Go to <https://console.firebase.google.com> and sign in with a Google
   account.
2. Click **"Create a project"** (call it anything, e.g. `shoe-stock`).
   You can switch off Google Analytics when asked — it's not needed.
3. In the left menu open **Build → Authentication**, click
   **"Get started"**, choose **Email/Password** and switch it **on**. Save.
4. In the left menu open **Build → Firestore Database**, click
   **"Create database"**, choose **Production mode**, pick the server
   location closest to you, and click **Enable**.
5. Still in Firestore, open the **Rules** tab, replace everything with the
   contents of the `firestore.rules` file in this folder, and click
   **Publish**. (These rules mean: only signed-in accounts can see or change
   the stock.)
6. Click the **gear icon → Project settings** (top left). Scroll down to
   **"Your apps"**, click the **`</>` (Web)** icon, give it any nickname and
   click **Register app**. Firebase now shows a code block with values like
   `apiKey`, `projectId`, etc.
7. Open the file **`firebaseConfig.js`** in this folder and replace each
   `PASTE_...` value with the matching value Firebase showed you.

### Step 2 — Run the app on your phone

1. Install **Node.js** on a computer from <https://nodejs.org> (LTS version).
2. Install the **Expo Go** app on each phone (Play Store / App Store).
3. In this project folder, run:

   ```bash
   npm install
   npx expo start
   ```

4. A QR code appears in the terminal. Scan it with the phone
   (Android: scan inside Expo Go; iPhone: scan with the Camera app).
   The app opens on the phone.
5. Create an account with the **"Create account"** button, then start adding
   shoes. Repeat on the other phones — each person creates their own account
   and everyone sees the same stock.

> **Tip:** the phone and the computer must be on the same Wi-Fi while using
> Expo Go. To get a standalone app you can install without a computer, build
> it once with [EAS Build](https://docs.expo.dev/build/setup/):
> `npx eas build -p android --profile preview` gives you an APK file you can
> share on WhatsApp and install on any Android phone.

---

## Small things you can change

- **Currency** — the app uses `₹`. To change it, edit `CURRENCY` in
  `src/theme.js`.
- **Low stock level** — articles with 2 cartons or fewer show a red LOW
  badge. Change `LOW_STOCK_CARTONS` in `src/theme.js`.

## How the data is stored

Everything lives in one Firestore collection called `shoes`. Photos are
compressed on the phone and saved inside the same record, so there is
nothing else to set up or pay for. Firebase's free tier is more than enough
for a wholesale stock list used by a handful of people.
