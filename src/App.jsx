import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroStats } from './components/HeroStats';
import { QuickActions } from './components/QuickActions';
import { AnalyticsView } from './components/AnalyticsView';
import { FuelHistory } from './components/FuelHistory';
import { TripHistory } from './components/TripHistory';
import { ServiceHistory } from './components/ServiceHistory';
import { FuelModal } from './components/FuelModal';
import { TripModal } from './components/TripModal';
import { ServiceModal } from './components/ServiceModal';
import { DataModal } from './components/DataModal';
import { FirebaseSetupModal } from './components/FirebaseSetupModal';
import {
  getStoredFuelLogs,
  saveStoredFuelLogs,
  getStoredTrips,
  saveStoredTrips,
  getStoredServices,
  saveStoredServices,
  getStoredSettings,
  saveStoredSettings,
  resetData,
  SAMPLE_FUEL_LOGS,
  SAMPLE_TRIPS,
  SAMPLE_SERVICE_LOGS,
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
  saveServiceLogCloud,
  deleteServiceLogCloud,
  saveSettingsCloud,
  migrateLocalDataToCloud,
  clearAllCloudData,
  replaceUserDataInCloud,
} from './firebase/firestoreService';
import { computeFuelStats } from './utils/calculations';
import { BarChart3, Fuel, Navigation, ChevronRight, Wrench, Plus, X, Download } from 'lucide-react';
import './App.css';

export function App() {
  const [fuelLogs, setFuelLogs] = useState(() => getStoredFuelLogs());
  const [trips, setTrips] = useState(() => getStoredTrips());
  const [services, setServices] = useState(() => getStoredServices());
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'fuel', 'trips', 'services'

  // User Authentication & Cloud Sync
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(isFirebaseConfigured);
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    isOnline: navigator.onLine,
  });

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelToEdit, setFuelToEdit] = useState(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Catch PWA Install Prompt & Check App Shortcuts
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt banner if user hasn't dismissed it in this session
      const dismissed = sessionStorage.getItem('rider_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Support manifest shortcuts (?action=fuel or ?action=trip)
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'fuel') {
      setIsFuelModalOpen(true);
    } else if (action === 'trip') {
      setIsTripModalOpen(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('rider_install_dismissed', 'true');
  };

  // Monitor Network Connectivity (Online/Offline)
  useEffect(() => {
    const handleOnline = () => setSyncStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for mobile redirect auth response if applicable
    checkRedirectAuth().catch(() => {});

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Authentication State
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Real-time Cloud Data & Auto-migrate when user logs in
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let initialMigrationChecked = false;

    // Migrate local data into Cloud if cloud is completely fresh
    migrateLocalDataToCloud(user.uid, fuelLogs, trips, services, settings).then(() => {
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
      onServices: (cloudServices) => {
        if (Array.isArray(cloudServices)) {
          if (cloudServices.length > 0 || initialMigrationChecked) {
            setServices(cloudServices);
            saveStoredServices(cloudServices);
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
    return computeFuelStats(fuelLogs, trips, services);
  }, [fuelLogs, trips, services]);

  // Latest odometer across all entries (fuel, trips, services) for general display
  const latestOdo = useMemo(() => {
    const fuelMax = fuelLogs.reduce((max, l) => Math.max(max, l.odometer || 0), 0);
    const tripMax = trips.reduce((max, t) => Math.max(max, t.endOdo || t.startOdo || 0), 0);
    const serviceMax = services.reduce((max, s) => Math.max(max, s.odometer || 0), 0);
    return Math.max(fuelMax, tripMax, serviceMax) || 19391;
  }, [fuelLogs, trips, services]);

  // Last trip end odometer specifically for starting a new trip
  const lastTripEndOdo = useMemo(() => {
    if (trips && trips.length > 0) {
      // Find the most recent trip by date/odometer
      const sortedTrips = [...trips].sort((a, b) => {
        const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (timeDiff !== 0) return timeDiff;
        return (b.endOdo || b.startOdo || 0) - (a.endOdo || a.startOdo || 0);
      });
      const latestTrip = sortedTrips[0];
      if (latestTrip.endOdo) return Number(latestTrip.endOdo);
      if (latestTrip.startOdo && latestTrip.distanceKm) {
        return Number(latestTrip.startOdo) + Number(latestTrip.distanceKm);
      }
      if (latestTrip.startOdo) return Number(latestTrip.startOdo);
    }
    // Fallback to latestOdo if no trips exist yet
    return latestOdo;
  }, [trips, latestOdo]);

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
    const srvs = getStoredServices();
    const stt = getStoredSettings();
    setFuelLogs(logs);
    setTrips(trps);
    setServices(srvs);
    setSettings(stt);
    if (user) {
      logs.forEach((l) => saveFuelLogCloud(user.uid, l));
      trps.forEach((t) => saveTripCloud(user.uid, t));
      srvs.forEach((s) => saveServiceLogCloud(user.uid, s));
      saveSettingsCloud(user.uid, stt);
    }
  };

  // Clear all data (local & cloud)
  const handleClearAllData = async () => {
    resetData('clear');
    setFuelLogs([]);
    setTrips([]);
    setServices([]);
    saveStoredFuelLogs([]);
    saveStoredTrips([]);
    saveStoredServices([]);
    if (user) {
      await clearAllCloudData(user.uid);
    }
  };

  // Load sample data (local & cloud)
  const handleLoadSampleData = async () => {
    resetData('sample');
    setFuelLogs(SAMPLE_FUEL_LOGS);
    setTrips(SAMPLE_TRIPS);
    setServices(SAMPLE_SERVICE_LOGS);
    setSettings(DEFAULT_SETTINGS);
    if (user) {
      await replaceUserDataInCloud(user.uid, SAMPLE_FUEL_LOGS, SAMPLE_TRIPS, SAMPLE_SERVICE_LOGS, DEFAULT_SETTINGS);
    }
  };

  // Restore backup data (local & cloud)
  const handleRestoreData = async (data) => {
    if (user && data) {
      await replaceUserDataInCloud(user.uid, data.fuelLogs, data.trips, data.services, data.settings);
    }
    const logs = getStoredFuelLogs();
    const trps = getStoredTrips();
    const srvs = getStoredServices();
    const stt = getStoredSettings();
    setFuelLogs(logs);
    setTrips(trps);
    setServices(srvs);
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

  // Service Handlers
  const handleOpenAddService = () => {
    setServiceToEdit(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service) => {
    setServiceToEdit(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (payload) => {
    let nextServices;
    if (serviceToEdit) {
      nextServices = services.map((s) => (s.id === payload.id ? payload : s));
    } else {
      nextServices = [payload, ...services.filter((s) => s.id !== payload.id)];
    }
    setServices(nextServices);
    saveStoredServices(nextServices);

    if (user) {
      saveServiceLogCloud(user.uid, payload);
    }
  };

  const handleDeleteService = (id) => {
    if (window.confirm('Delete this service record?')) {
      const nextServices = services.filter((s) => s.id !== id);
      setServices(nextServices);
      saveStoredServices(nextServices);
      if (user) {
        deleteServiceLogCloud(user.uid, id);
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
        isAuthLoading={isAuthLoading}
        syncStatus={syncStatus}
        isFirebaseConfigured={isFirebaseConfigured}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {/* PWA Install App Banner */}
        {showInstallBanner && (
          <div className="pwa-install-banner">
            <div className="pwa-install-left">
              <div className="pwa-install-icon">
                <Download size={18} />
              </div>
              <div className="pwa-install-text">
                <strong>Install Rider App</strong>
                <span>Install on your phone or desktop for instant offline access</span>
              </div>
            </div>
            <div className="pwa-install-actions">
              <button onClick={handleInstallClick} className="btn-pwa-install">
                Install
              </button>
              <button
                onClick={handleDismissInstall}
                className="btn-pwa-dismiss"
                aria-label="Dismiss install banner"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Hero KPI Cards */}
        <HeroStats stats={stats} totalTripsCount={trips.length} />

        {/* Quick Action Buttons */}
        <QuickActions
          onOpenFuelModal={handleOpenAddFuel}
          onOpenTripModal={handleOpenAddTrip}
          onOpenServiceModal={handleOpenAddService}
        />

        {/* Navigation Tabs */}
        <nav className="tab-navigation" aria-label="Sections">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`tab-btn ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          >
            <BarChart3 size={17} />
            <span className="tab-label-full">Dashboard & Insights</span>
            <span className="tab-label-short">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`tab-btn ${activeTab === 'fuel' ? 'tab-active' : ''}`}
          >
            <Fuel size={17} />
            <span className="tab-label-full">Fuel Logs ({fuelLogs.length})</span>
            <span className="tab-label-short">Fuel ({fuelLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`tab-btn ${activeTab === 'trips' ? 'tab-active' : ''}`}
          >
            <Navigation size={17} />
            <span className="tab-label-full">Daily Rides ({trips.length})</span>
            <span className="tab-label-short">Rides ({trips.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`tab-btn ${activeTab === 'services' ? 'tab-active' : ''}`}
          >
            <Wrench size={17} />
            <span className="tab-label-full">Service ({services.length})</span>
            <span className="tab-label-short">Service ({services.length})</span>
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

            {/* Recent Services Quick Peek */}
            <div className="recent-peek-section">
              <div className="peek-header-row">
                <h3 className="peek-title">Recent Maintenance</h3>
                <button
                  onClick={() => setActiveTab('services')}
                  className="peek-link-btn"
                >
                  <span>View all</span>
                  <ChevronRight size={15} />
                </button>
              </div>
              <ServiceHistory
                services={services.slice(0, 3)}
                onEdit={handleEditService}
                onDelete={handleDeleteService}
                onAddClick={handleOpenAddService}
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

        {/* View 4: Service History List */}
        {activeTab === 'services' && (
          <div className="tab-pane">
            <ServiceHistory
              services={services}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              onAddClick={handleOpenAddService}
            />
          </div>
        )}
      </main>

      {/* Expandable Floating Action Button for Mobile screens */}
      <div className="mobile-fab-container">
        {isFabOpen && (
          <>
            <div
              className="fab-backdrop"
              onClick={() => setIsFabOpen(false)}
            />
            <div className="fab-menu">
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  handleOpenAddFuel();
                }}
                className="fab-item fab-fuel"
                title="Log Fuel"
                aria-label="Log Fuel"
              >
                <span className="fab-item-label">Log Fuel</span>
                <div className="fab-item-icon">
                  <Fuel size={20} />
                </div>
              </button>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  handleOpenAddTrip();
                }}
                className="fab-item fab-trip"
                title="Log Ride"
                aria-label="Log Ride"
              >
                <span className="fab-item-label">Log Ride</span>
                <div className="fab-item-icon">
                  <Navigation size={20} />
                </div>
              </button>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  handleOpenAddService();
                }}
                className="fab-item fab-service"
                title="Log Service"
                aria-label="Log Service"
              >
                <span className="fab-item-label">Log Service</span>
                <div className="fab-item-icon">
                  <Wrench size={20} />
                </div>
              </button>
            </div>
          </>
        )}
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`mobile-fab-main ${isFabOpen ? 'fab-open' : ''}`}
          title="Quick Actions"
          aria-label="Quick Actions"
        >
          {isFabOpen ? <X size={24} /> : <Plus size={26} />}
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
        lastOdo={lastTripEndOdo}
        fuelCostPerKm={stats.fuelCostPerKm}
        initialTrip={tripToEdit}
      />

      {/* Service / Maintenance Modal */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceToEdit(null);
        }}
        onSave={handleSaveService}
        lastOdo={latestOdo}
        initialService={serviceToEdit}
      />

      {/* Backup & Data Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        user={user}
        fuelLogs={fuelLogs}
        trips={trips}
        services={services}
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
