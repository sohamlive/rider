# 🛵 Rider — Activa 3G Fuel, Ride & Maintenance Tracker

A lightweight, mobile-first Progressive Web Application (PWA) tailored specifically for daily Honda Activa 3G riders. Track fuel expenses across daily price revisions, calculate real-world mileage ($km/L$), monitor running cost per kilometre ($₹/km$), log daily rides, and track vehicle maintenance & service costs.

Designed to be hosted on **GitHub Pages** under your custom domain `rider.sidelower.in` (or `play.sidelower.in`).

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
- **Trip Tracking**: Log rides by purpose (Office Commute, Market Run, Joyride, Highway, Errands).
- **Dual Distance Input**: Enter Start & End Odometer, or direct distance in km.
- **Live Ride Cost Calculation**: Auto-computes estimated fuel cost for the trip using your vehicle's live $₹/km$ average.

### 🔧 Service & Maintenance Logger
- **Service Types**: Track costs for **General Service & Oil Changes**, tyre **Air** pressure top-ups, and **Battery** maintenance or replacements.
- **Odometer & Cost Tracking**: Record exact odometer reading, cost incurred (₹), service date, and optional notes.
- **Maintenance History**: Dedicated timeline view with edit and delete capabilities.

### 📊 Interactive Analytics & Charts
- **Time Range Filters**: Global filter to view metrics across **Past 1 Month**, **Past 3 Months**, or **All Time**.
- **Mileage Efficiency Trend**: Line chart tracking calculated $km/L$ efficiency over time across full tank fills.
- **Ride Distance Chart (Daily / Weekly Toggle)**: Dedicated bar chart allowing you to switch between daily kilometers ridden and weekly aggregated distances.
- **Monthly Fuel Expense vs. Distance**: Dual-axis chart comparing monthly fuel spend (₹) with total tracked distance (km).

### 📱 Clean, Mobile-First User Experience
- **Expandable Floating Action Button (+)**: Mobile-optimized floating button that smoothly expands with quick actions for **Log Fuel**, **Log Ride**, and **Log Service**.
- **Responsive Navigation**: Adaptive tab navigation with text labels formatted cleanly to avoid horizontal scrolling on iPhone and compact screens.
- **Desktop Quick Actions Bar**: Clean 3-card desktop quick actions bar for rapid 1-click entry.
- **Dark & Light Mode**: Built-in sleek dark theme and high-contrast light theme.

### ☁️ Cloud Sync & Data Portability
- **Firebase Authentication & Firestore Sync**: Sign in with Google for real-time, cross-device sync with offline caching support.
- **Works 100% Offline**: Operates fully on LocalStorage if not signed in or when offline at the petrol pump.
- **1-Click Export/Backup**: Download full history as JSON or Excel-compatible CSVs.
- **Restore & Reset**: Import backup files onto any device or reset with realistic seed data.

---

## 🚀 Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the local server**:
   ```bash
   npm run dev
   ```

3. **Access on your Phone**:
   Because `--host` is enabled, you can open the app directly on your phone's browser connected to the same Wi-Fi using the network IP shown in the terminal (e.g. `http://<your-ip>:5173/`).
   - On iOS Safari: Tap **Share** $\rightarrow$ **Add to Home Screen**.
   - On Android Chrome: Tap **Menu (⋮)** $\rightarrow$ **Install App** / **Add to Home screen**.

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 🌐 Deploying to GitHub Pages (`rider.sidelower.in`)

This project is pre-configured with a GitHub Actions workflow in `.github/workflows/deploy.yml`.

### Deployment Steps:
1. Create a repository named `rider` on your GitHub account.
2. Push this codebase to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Activa 3G Riding & Maintenance Tracker"
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
│   ├── favicon.svg               # Activa scooter SVG icon
│   └── manifest.json             # PWA Web Manifest
├── src/
│   ├── components/
│   │   ├── Header.jsx            # Branding, theme toggle, sync badge, backup trigger
│   │   ├── HeroStats.jsx         # Mileage, running cost, distance & monthly fuel spent cards
│   │   ├── QuickActions.jsx      # High-visibility fuel, ride, and service buttons (desktop)
│   │   ├── FuelModal.jsx         # 2-way fuel logger & price revision
│   │   ├── TripModal.jsx         # Ride logger & cost estimator
│   │   ├── ServiceModal.jsx      # Service, air & battery maintenance cost logger
│   │   ├── AnalyticsView.jsx     # Chart.js visualizations (Mileage, Rides daily/weekly, Expense)
│   │   ├── FuelHistory.jsx       # Refills timeline with edit/delete
│   │   ├── TripHistory.jsx       # Rides timeline with edit/delete
│   │   ├── ServiceHistory.jsx    # Maintenance timeline with edit/delete
│   │   ├── DataModal.jsx         # JSON/CSV backup, restore & sample data management
│   │   └── FirebaseSetupModal.jsx# In-app Firebase configuration walkthrough
│   ├── firebase/
│   │   ├── config.js             # Firebase client setup & configuration checker
│   │   ├── authService.js        # Google authentication & state subscribers
│   │   └── firestoreService.js   # Real-time multi-collection sync & offline cache
│   ├── utils/
│   │   ├── calculations.js       # Full-to-full mileage engine & INR formatters
│   │   └── storage.js            # LocalStorage handlers & CSV/JSON data transformers
│   ├── App.jsx                   # Application root, view routing & modal coordinators
│   ├── App.css                   # Custom responsive CSS design system
│   └── index.css                 # Color tokens, fonts & resets
└── vite.config.js                # Build configuration with vendor chunk splitting
```
