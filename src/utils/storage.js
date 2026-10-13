/**
 * Data Storage & Export/Import Service for Activa 3G Tracker
 */

const STORAGE_KEYS = {
  FUEL_LOGS: 'activa_fuel_logs_v1',
  TRIPS: 'activa_trips_v1',
  SETTINGS: 'activa_settings_v1',
};

// Initial realistic seed data for Honda Activa 3G
export const SAMPLE_FUEL_LOGS = [
  {
    id: 'fuel_1',
    date: '2026-09-01T08:30',
    odometer: 18450,
    amount: 500,
    litres: 4.88,
    pricePerLitre: 102.5,
    isFullTank: true,
    station: 'Indian Oil - Ring Road',
    notes: 'Initial full tank baseline',
  },
  {
    id: 'fuel_2',
    date: '2026-09-09T18:15',
    odometer: 18655,
    amount: 300,
    litres: 2.92,
    pricePerLitre: 102.8,
    isFullTank: false,
    station: 'HP Petrol Pump',
    notes: 'Quick partial fill for weekend',
  },
  {
    id: 'fuel_3',
    date: '2026-09-17T09:00',
    odometer: 18872,
    amount: 450,
    litres: 4.36,
    pricePerLitre: 103.1,
    isFullTank: true,
    station: 'Shell Petrol Station',
    notes: 'Full tank top-up',
  },
  {
    id: 'fuel_4',
    date: '2026-09-26T19:40',
    odometer: 19088,
    amount: 500,
    litres: 4.83,
    pricePerLitre: 103.5,
    isFullTank: true,
    station: 'Bharat Petroleum',
    notes: 'Monthly full tank fill',
  },
  {
    id: 'fuel_5',
    date: '2026-10-05T08:45',
    odometer: 19310,
    amount: 520,
    litres: 5.01,
    pricePerLitre: 103.8,
    isFullTank: true,
    station: 'Indian Oil',
    notes: 'Tank brim full',
  },
];

export const SAMPLE_TRIPS = [
  {
    id: 'trip_1',
    date: '2026-10-06T09:10',
    title: 'Daily Office Commute',
    category: 'Commute',
    startOdo: 19310,
    endOdo: 19324,
    distanceKm: 14,
    notes: 'Via Ring road expressway',
    routeEstimated: true,
  },
  {
    id: 'trip_2',
    date: '2026-10-06T18:30',
    title: 'Return Commute & Grocery',
    category: 'Errand',
    startOdo: 19324,
    endOdo: 19341,
    distanceKm: 17,
    notes: 'Stopped at supermarket',
    routeEstimated: true,
  },
  {
    id: 'trip_3',
    date: '2026-10-08T09:15',
    title: 'Office Morning Ride',
    category: 'Commute',
    startOdo: 19341,
    endOdo: 19355,
    distanceKm: 14,
    notes: 'Smooth morning ride',
    routeEstimated: true,
  },
  {
    id: 'trip_4',
    date: '2026-10-09T17:00',
    title: 'Weekend Market Run',
    category: 'Market',
    startOdo: 19355,
    endOdo: 19363,
    distanceKm: 8,
    notes: 'Local market shopping',
    routeEstimated: true,
  },
  {
    id: 'trip_5',
    date: '2026-10-11T11:20',
    title: 'City Outskirts Cruise',
    category: 'Joyride',
    startOdo: 19363,
    endOdo: 19391,
    distanceKm: 28,
    notes: 'Sunday relaxed ride',
    routeEstimated: true,
  },
];

export const DEFAULT_SETTINGS = {
  scooterName: 'Honda Activa 3G',
  registrationNo: '',
  currency: '₹',
  lastFuelRate: 103.8,
  preferredFillMode: 'amount', // 'amount' or 'litres'
  theme: 'dark', // 'dark' or 'light'
};

export function getStoredFuelLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FUEL_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(SAMPLE_FUEL_LOGS));
      return SAMPLE_FUEL_LOGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading fuel logs from localStorage:', e);
    return SAMPLE_FUEL_LOGS;
  }
}

export function saveStoredFuelLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving fuel logs:', e);
  }
}

export function getStoredTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRIPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(SAMPLE_TRIPS));
      return SAMPLE_TRIPS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading trips from localStorage:', e);
    return SAMPLE_TRIPS;
  }
}

export function saveStoredTrips(trips) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  } catch (e) {
    console.error('Error saving trips:', e);
  }
}

export function getStoredSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

/**
 * Export complete data as a JSON file
 */
export function exportAllDataJSON(customFuel, customTrips, customSettings) {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    app: 'Activa 3G Riding Tracker',
    settings: customSettings || getStoredSettings(),
    fuelLogs: customFuel || getStoredFuelLogs(),
    trips: customTrips || getStoredTrips(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activa_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export fuel logs as a clean CSV file
 */
export function exportFuelCSV(customFuel) {
  const logs = customFuel || getStoredFuelLogs();
  const headers = ['Date', 'Odometer (km)', 'Amount (₹)', 'Quantity (L)', 'Price/L (₹)', 'Full Tank'];
  const rows = logs.map(l => [
    `"${l.date}"`,
    l.odometer,
    l.amount,
    l.litres,
    l.pricePerLitre,
    l.isFullTank ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activa_fuel_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export trips as a clean CSV file
 */
export function exportTripsCSV(customTrips) {
  const trips = customTrips || getStoredTrips();
  const headers = ['Date', 'Title', 'Start Odometer (km)', 'End Odometer (km)', 'Distance (km)'];
  const rows = trips.map(t => [
    `"${t.date}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.startOdo || '',
    t.endOdo || '',
    t.distanceKm,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activa_trips_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import and validate JSON backup file
 */
export function importDataJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.fuelLogs && !data.trips) {
      throw new Error('Invalid backup file: Missing fuelLogs or trips data.');
    }
    if (Array.isArray(data.fuelLogs)) {
      saveStoredFuelLogs(data.fuelLogs);
    }
    if (Array.isArray(data.trips)) {
      saveStoredTrips(data.trips);
    }
    if (data.settings) {
      saveStoredSettings(data.settings);
    }
    return { success: true, message: 'Data imported successfully!', data };
  } catch (e) {
    return { success: false, message: e.message || 'Error parsing JSON file.' };
  }
}

/**
 * Reset to sample data or clear all data
 */
export function resetData(mode = 'sample') {
  if (mode === 'sample') {
    localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify(SAMPLE_FUEL_LOGS));
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(SAMPLE_TRIPS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  } else if (mode === 'clear') {
    localStorage.setItem(STORAGE_KEYS.FUEL_LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify([]));
  }
}
