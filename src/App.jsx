import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroStats } from './components/HeroStats';
import { QuickActions } from './components/QuickActions';
import { AnalyticsView } from './components/AnalyticsView';
import { FuelHistory } from './components/FuelHistory';
import { TripHistory } from './components/TripHistory';
import { FuelModal } from './components/FuelModal';
import { TripModal } from './components/TripModal';
import { DataModal } from './components/DataModal';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import {
  getStoredFuelLogs,
  saveStoredFuelLogs,
  getStoredTrips,
  saveStoredTrips,
  getStoredSettings,
  saveStoredSettings,
  resetData,
  SAMPLE_FUEL_LOGS,
  SAMPLE_TRIPS,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { isFirebaseConfigured } from './firebase/config';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  checkRedirectAuth,
} from './firebase/authService';
import {
  subscribeToUserData,
  saveFuelLogCloud,
  deleteFuelLogCloud,
  saveTripCloud,
  deleteTripCloud,
  saveSettingsCloud,
  migrateLocalDataToCloud,
  clearAllCloudData,
  replaceUserDataInCloud,
} from './firebase/firestoreService';
import { computeFuelStats } from './utils/calculations';
import { BarChart3, Fuel, Navigation, ChevronRight } from 'lucide-react';
import './App.css';

export function App() {
  const [fuelLogs, setFuelLogs] = useState(() => getStoredFuelLogs());
  const [trips, setTrips] = useState(() => getStoredTrips());
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'fuel', 'trips'

  // User Authentication & Cloud Sync
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    isOnline: navigator.onLine,
  });

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Monitor Network Connectivity (Online/Offline)
  useEffect(() => {
    const handleOnline = () => setSyncStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for mobile redirect auth response if applicable
    checkRedirectAuth();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Authentication State
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Real-time Cloud Data & Auto-migrate when user logs in
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let initialMigrationChecked = false;

    // Migrate local data into Cloud if cloud is completely fresh
    migrateLocalDataToCloud(user.uid, fuelLogs, trips, settings).then(() => {
      initialMigrationChecked = true;
      if (isMounted) {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false }));
      }
    });

    // Subscribe to cloud sync
    const unsubscribe = subscribeToUserData(user.uid, {
      onFuelLogs: (cloudLogs) => {
        if (Array.isArray(cloudLogs)) {
          if (cloudLogs.length > 0 || initialMigrationChecked) {
            setFuelLogs(cloudLogs);
            saveStoredFuelLogs(cloudLogs);
          }
        }
      },
      onTrips: (cloudTrips) => {
        if (Array.isArray(cloudTrips)) {
          if (cloudTrips.length > 0 || initialMigrationChecked) {
            setTrips(cloudTrips);
            saveStoredTrips(cloudTrips);
          }
        }
      },
      onSettings: (cloudSettings) => {
        if (cloudSettings) {
          setSettings((prev) => ({ ...prev, ...cloudSettings }));
          saveStoredSettings({ ...settings, ...cloudSettings });
        }
      },
      onSyncStatus: (status) => {
        if (isMounted) {
          setSyncStatus(status);
        }
      },
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.uid]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
  }, [settings.theme]);

  // Compute fuel & vehicle stats
  const stats = useMemo(() => {
    return computeFuelStats(fuelLogs, trips);
  }, [fuelLogs, trips]);

  // Latest odometer
  const latestOdo = useMemo(() => {
    const fuelMax = fuelLogs.reduce((max, l) => Math.max(max, l.odometer || 0), 0);
    const tripMax = trips.reduce((max, t) => Math.max(max, t.endOdo || t.startOdo || 0), 0);
    return Math.max(fuelMax, tripMax) || 19391;
  }, [fuelLogs, trips]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveStoredSettings(updated);
    if (user) {
      saveSettingsCloud(user.uid, updated);
    }
  };

  // Refresh data after import or reset
  const handleDataReload = () => {
    const logs = getStoredFuelLogs();
    const trps = getStoredTrips();
    const stt = getStoredSettings();
    setFuelLogs(logs);
    setTrips(trps);
    setSettings(stt);
    if (user) {
      logs.forEach((l) => saveFuelLogCloud(user.uid, l));
      trps.forEach((t) => saveTripCloud(user.uid, t));
      saveSettingsCloud(user.uid, stt);
    }
  };

  // Clear all data (local & cloud)
  const handleClearAllData = async () => {
    resetData('clear');
    setFuelLogs([]);
    setTrips([]);
    saveStoredFuelLogs([]);
    saveStoredTrips([]);
    if (user) {
      await clearAllCloudData(user.uid);
    }
  };

  // Load sample data (local & cloud)
  const handleLoadSampleData = async () => {
    resetData('sample');
    setFuelLogs(SAMPLE_FUEL_LOGS);
    setTrips(SAMPLE_TRIPS);
    setSettings(DEFAULT_SETTINGS);
    if (user) {
      await replaceUserDataInCloud(user.uid, SAMPLE_FUEL_LOGS, SAMPLE_TRIPS, DEFAULT_SETTINGS);
    }
  };

  // Restore backup data (local & cloud)
  const handleRestoreData = async (data) => {
    if (user && data) {
      await replaceUserDataInCloud(user.uid, data.fuelLogs, data.trips, data.settings);
    }
    const logs = getStoredFuelLogs();
    const trps = getStoredTrips();
    const stt = getStoredSettings();
    setFuelLogs(logs);
    setTrips(trps);
    setSettings(stt);
  };

  // Authentication Handlers
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in failed:', error);

      // User closed the popup window voluntarily
      if (error?.code === 'auth/popup-closed-by-user') {
        return;
      }

      // Deployed domain has not been added to Firebase Console Authorized Domains
      if (error?.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        alert(
          `Domain Not Authorized in Firebase!\n\n` +
          `Your deployed domain "${currentDomain}" is not in the Authorized Domains list of your Firebase project.\n\n` +
          `To fix this (takes 1 minute):\n` +
          `1. Open Firebase Console: https://console.firebase.google.com\n` +
          `2. Select your project ("rider-activa")\n` +
          `3. Go to: Authentication ➔ Settings tab ➔ Authorized domains\n` +
          `4. Click "Add domain" and add "${currentDomain}"\n\n` +
          `After adding, refresh this page and Sign In will work!`
        );
        return;
      }

      // Google Sign-In not enabled in Firebase
      if (error?.code === 'auth/operation-not-allowed') {
        alert(
          `Google Sign-In is not enabled in Firebase.\n\n` +
          `Go to Firebase Console ➔ Authentication ➔ Sign-in method, and enable Google.`
        );
        return;
      }

      // Popup blocked by browser
      if (error?.code === 'auth/popup-blocked') {
        alert(
          `Sign-In popup was blocked by your browser.\n\n` +
          `Please check your browser address bar to allow popups for ${window.location.hostname}, or tap again to retry.`
        );
        return;
      }

      // General error fallback with real error message
      alert(
        `Google Sign-In Error (${error?.code || 'auth-error'}):\n\n` +
        `${error?.message || 'Unable to sign in. Please verify your Firebase project setup and internet connection.'}`
      );
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  };

  // Fuel Handlers
  const handleOpenAddFuel = () => {
    setFuelToEdit(null);
    setIsFuelModalOpen(true);
  };

  const handleEditFuel = (log) => {
    setFuelToEdit(log);
    setIsFuelModalOpen(true);
  };

  const handleSaveFuel = (payload) => {
    let nextLogs;
    if (fuelToEdit) {
      nextLogs = fuelLogs.map((l) => (l.id === payload.id ? payload : l));
    } else {
      nextLogs = [payload, ...fuelLogs.filter((l) => l.id !== payload.id)];
    }
    setFuelLogs(nextLogs);
    saveStoredFuelLogs(nextLogs);

    // Also update last used fuel rate in settings
    const updatedSettings = { ...settings, lastFuelRate: payload.pricePerLitre };
    setSettings(updatedSettings);
    saveStoredSettings(updatedSettings);

    // Persist to Cloud if authenticated
    if (user) {
      saveFuelLogCloud(user.uid, payload);
      saveSettingsCloud(user.uid, updatedSettings);
    }
  };

  const handleDeleteFuel = (id) => {
    if (window.confirm('Delete this fuel refill entry?')) {
      const nextLogs = fuelLogs.filter((l) => l.id !== id);
      setFuelLogs(nextLogs);
      saveStoredFuelLogs(nextLogs);
      if (user) {
        deleteFuelLogCloud(user.uid, id);
      }
    }
  };

  // Trip Handlers
  const handleOpenAddTrip = () => {
    setTripToEdit(null);
    setIsTripModalOpen(true);
  };

  const handleEditTrip = (trip) => {
    setTripToEdit(trip);
    setIsTripModalOpen(true);
  };

  const handleSaveTrip = (payload) => {
    let nextTrips;
    if (tripToEdit) {
      nextTrips = trips.map((t) => (t.id === payload.id ? payload : t));
    } else {
      nextTrips = [payload, ...trips.filter((t) => t.id !== payload.id)];
    }
    setTrips(nextTrips);
    saveStoredTrips(nextTrips);

    // Persist to Cloud if authenticated
    if (user) {
      saveTripCloud(user.uid, payload);
    }
  };

  const handleDeleteTrip = (id) => {
    if (window.confirm('Delete this trip entry?')) {
      const nextTrips = trips.filter((t) => t.id !== id);
      setTrips(nextTrips);
      saveStoredTrips(nextTrips);
      if (user) {
        deleteTripCloud(user.uid, id);
      }
    }
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        latestOdo={latestOdo}
        user={user}
        syncStatus={syncStatus}
        isFirebaseConfigured={isFirebaseConfigured}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {/* Hero KPI Cards */}
        <HeroStats stats={stats} totalTripsCount={trips.length} />

        {/* Quick Action Buttons */}
        <QuickActions
          onOpenFuelModal={handleOpenAddFuel}
          onOpenTripModal={handleOpenAddTrip}
        />

        {/* Navigation Tabs */}
        <nav className="tab-navigation" aria-label="Sections">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`tab-btn ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          >
            <BarChart3 size={17} />
            <span>Dashboard & Insights</span>
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`tab-btn ${activeTab === 'fuel' ? 'tab-active' : ''}`}
          >
            <Fuel size={17} />
            <span>Fuel Logs ({fuelLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`tab-btn ${activeTab === 'trips' ? 'tab-active' : ''}`}
          >
            <Navigation size={17} />
            <span>Daily Rides ({trips.length})</span>
          </button>
        </nav>

        {/* View 1: Dashboard with Charts and Recent Activity */}
        {activeTab === 'dashboard' && (
          <div className="tab-pane">
            <AnalyticsView
              fuelLogs={stats.logsWithMileage}
              trips={trips}
              theme={settings.theme}
            />

            {/* Recent Refuels Quick Peek */}
            <div className="recent-peek-section">
              <div className="peek-header-row">
                <h3 className="peek-title">Recent Refuels</h3>
                <button
                  onClick={() => setActiveTab('fuel')}
                  className="peek-link-btn"
                >
                  <span>View all</span>
                  <ChevronRight size={15} />
                </button>
              </div>
              <FuelHistory
                logs={stats.logsWithMileage.slice(0, 3)}
                onEdit={handleEditFuel}
                onDelete={handleDeleteFuel}
                onAddClick={handleOpenAddFuel}
              />
            </div>

            {/* Recent Rides Quick Peek */}
            <div className="recent-peek-section">
              <div className="peek-header-row">
                <h3 className="peek-title">Recent Daily Rides</h3>
                <button
                  onClick={() => setActiveTab('trips')}
                  className="peek-link-btn"
                >
                  <span>View all</span>
                  <ChevronRight size={15} />
                </button>
              </div>
              <TripHistory
                trips={trips.slice(0, 3)}
                onEdit={handleEditTrip}
                onDelete={handleDeleteTrip}
                onAddClick={handleOpenAddTrip}
              />
            </div>
          </div>
        )}

        {/* View 2: Fuel History List */}
        {activeTab === 'fuel' && (
          <div className="tab-pane">
            <FuelHistory
              logs={stats.logsWithMileage}
              onEdit={handleEditFuel}
              onDelete={handleDeleteFuel}
              onAddClick={handleOpenAddFuel}
            />
          </div>
        )}

        {/* View 3: Trip History List */}
        {activeTab === 'trips' && (
          <div className="tab-pane">
            <TripHistory
              trips={trips}
              onEdit={handleEditTrip}
              onDelete={handleDeleteTrip}
              onAddClick={handleOpenAddTrip}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile screens */}
      <div className="mobile-fab-container">
        <button
          onClick={handleOpenAddFuel}
          className="mobile-fab fab-fuel"
          title="Add Fuel"
          aria-label="Add Fuel"
        >
          <Fuel size={22} />
        </button>
        <button
          onClick={handleOpenAddTrip}
          className="mobile-fab fab-trip"
          title="Log Ride"
          aria-label="Log Ride"
        >
          <Navigation size={22} />
        </button>
      </div>

      {/* Fuel Refill Modal */}
      <FuelModal
        isOpen={isFuelModalOpen}
        onClose={() => {
          setIsFuelModalOpen(false);
          setFuelToEdit(null);
        }}
        onSave={handleSaveFuel}
        lastPrice={settings.lastFuelRate || stats.latestPrice}
        lastOdo={latestOdo}
        initialEntry={fuelToEdit}
      />

      {/* Ride / Trip Modal */}
      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => {
          setIsTripModalOpen(false);
          setTripToEdit(null);
        }}
        onSave={handleSaveTrip}
        lastOdo={latestOdo}
        averageCostPerKm={stats.averageCostPerKm}
        initialTrip={tripToEdit}
      />

      {/* Backup & Data Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        user={user}
        fuelLogs={fuelLogs}
        trips={trips}
        settings={settings}
        onClearAll={handleClearAllData}
        onLoadSample={handleLoadSampleData}
        onRestore={handleRestoreData}
        onDataChanged={handleDataReload}
      />

      {/* Firebase Setup Guidance Modal */}
      <FirebaseSetupModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            Rider v1 • Hosted at <strong>play.sidelower.in</strong>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
