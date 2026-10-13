# 🛵 Honda Activa 3G Riding Tracker & Cost Analytics

A lightweight, mobile-first Progressive Web Application (PWA) tailored specifically for daily Activa 3G riders. Track fuel expenses across daily price revisions, calculate real-world mileage ($km/L$), monitor cost per kilometre ($₹/km$), and log daily commutes.

Designed to be hosted on **GitHub Pages** under your custom domain `rider.sidelower.in` (or `sidelower.in`).

---

## ✨ Key Features

### ⛽ Smart Fuel Refill Logging
- **Daily Price Revision Support**: Fuel prices change daily in India; customize the current rate ($₹/L$) with 1 tap.
- **Two-Way Calculation**:
  - **Fill by Amount (₹)**: Enter ₹100, ₹200, ₹300, ₹500 (or custom) $\rightarrow$ auto-computes Litres.
  - **Fill by Litres (L)**: Enter quantity $\rightarrow$ auto-computes total ₹.
- **Full-to-Full Mileage Engine**: Accurate mileage calculation ($km/L$) when topping off the tank, with graceful estimation for partial fills.
- **Odometer Tracking**: Auto-validates current odometer and shows distance covered since previous refill.

### 🛵 Daily Rides & Commute Logger
- Track trips (Office Commute, Market Run, Joyride, Highway, Errands).
- **Dual distance input**: Enter Start & End Odometer, or direct distance in km.
- **Live Ride Cost Calculation**: Auto-computes estimated fuel cost for the trip using your vehicle's live $₹/km$ average.
- **v2 Ready**: Architecture prepared for Google Maps live GPS route tracking.

### 📊 Interactive Analytics & Charts
- **Mileage Efficiency Trend**: Interactive curve with Activa 3G benchmark line ($42\text{ km/L}$).
- **Daily Fuel Price Revisions**: Historical price fluctuation timeline.
- **Monthly Fuel Expense vs. Distance**: Dual-axis bar and line chart.
- **Ride Purpose Breakdown**: Category distribution doughnut chart.

### 💾 Private Local Storage & Portability
- **100% Client-Side**: No cloud database or account login required; works offline at the petrol pump.
- **1-Click Export/Backup**: Download full history as JSON or Excel-compatible CSVs.
- **Cross-Device Restore**: Import backup file onto any phone or browser.

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm run dev
   ```

3. **Access on your Phone**:
   Because `--host` is enabled, you can open the app directly on your phone's browser connected to the same Wi-Fi using the network IP shown in the terminal (e.g. `http://<your-ip>:5173/`).
   - On iOS Safari: Tap **Share** $\rightarrow$ **Add to Home Screen**.
   - On Android Chrome: Tap **Menu (⋮)** $\rightarrow$ **Install App** / **Add to Home screen**.

---

## 🌐 Deploying to GitHub Pages (`rider.sidelower.in`)

This project is pre-configured with a GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Deployment Steps:
1. Create a repository named `rider` on your GitHub account.
2. Push this codebase to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Activa 3G Riding Tracker"
   git branch -M main
   git remote add origin https://github.com/<your-username>/rider.git
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** $\rightarrow$ **Pages**.
   - Under **Build and deployment**, set **Source** to **GitHub Actions**.
   - (Optional) Under **Custom domain**, enter `rider.sidelower.in`.
4. In your DNS provider for `sidelower.in`:
   - Add a `CNAME` record:
     - **Host / Name**: `rider`
     - **Target / Value**: `<your-username>.github.io`
5. **Firebase Authorized Domain (Crucial for Google Sign-In)**:
   - Go to [Firebase Console](https://console.firebase.google.com/) $\rightarrow$ select your project.
   - In the left sidebar: **Authentication** $\rightarrow$ **Settings** tab.
   - Under **Authorized domains**, click **Add domain**.
   - Add your deployed domain (e.g., `play.sidelower.in`, `rider.sidelower.in`, or `<your-username>.github.io`).
   - *Note: Without this step, Google Sign-In will fail with `auth/unauthorized-domain`.*
6. In your GitHub repository settings $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**:
   - Add your `VITE_FIREBASE_*` variables from `.env.local` so the GitHub Actions build embeds them.

---

## 📁 Project Structure

```
rider/
├── .github/workflows/deploy.yml  # Automated GitHub Pages CI/CD
├── public/
│   ├── favicon.svg               # Sleek Activa scooter SVG icon
│   └── manifest.json             # PWA Web Manifest
├── src/
│   ├── components/
│   │   ├── Header.jsx            # Branding, theme toggle, backup trigger
│   │   ├── HeroStats.jsx         # Mileage, running cost, distance & spent cards
│   │   ├── QuickActions.jsx      # High-visibility fuel & ride buttons
│   │   ├── FuelModal.jsx         # 2-way fuel logger & price revision
│   │   ├── TripModal.jsx         # Ride logger & cost estimator
│   │   ├── AnalyticsView.jsx     # Chart.js interactive visualizations
│   │   ├── FuelHistory.jsx       # Refills timeline with edit/delete
│   │   ├── TripHistory.jsx       # Rides timeline with edit/delete
│   │   └── DataModal.jsx         # JSON/CSV backup, restore & sample data
│   ├── utils/
│   │   ├── calculations.js       # Mileage math & INR formatters
│   │   └── storage.js            # LocalStorage & import/export helpers
│   ├── App.jsx                   # Central state & tab view orchestrator
│   ├── App.css                   # Responsive styles & design system
│   └── index.css                 # CSS variables & typography tokens
└── vite.config.js                # Base relative path for GitHub Pages
```
