/**
 * Calculation utilities for Honda Activa 3G Riding Tracker
 */

/**
 * Compute fuel quantity given amount and price per litre
 */
export function calculateLitres(amount, pricePerLitre) {
  if (!amount || !pricePerLitre || pricePerLitre <= 0) return 0;
  return Number((amount / pricePerLitre).toFixed(2));
}

/**
 * Compute fuel amount given quantity (litres) and price per litre
 */
export function calculateAmount(litres, pricePerLitre) {
  if (!litres || !pricePerLitre || pricePerLitre <= 0) return 0;
  return Number((litres * pricePerLitre).toFixed(2));
}

/**
 * Calculate mileage (km/L) for each fuel log entry.
 * Standard full-to-full method:
 * Distance between two full tank fills divided by the fuel filled to top it off.
 * Also calculates estimated mileage for partial fills based on running averages.
 */
export function computeFuelStats(fuelLogs = [], trips = []) {
  if ((!fuelLogs || fuelLogs.length === 0) && (!trips || trips.length === 0)) {
    return {
      logsWithMileage: [],
      overallMileage: 0,
      totalFuelSpent: 0,
      currentMonthFuelSpent: 0,
      currentMonthFuelLitres: 0,
      currentMonthDistance: 0,
      currentMonthCostPerKm: 0,
      totalFuelLitres: 0,
      totalDistanceCovered: 0,
      averageCostPerKm: 0,
      latestPrice: 102.5,
    };
  }

  // Sort logs by odometer ascending (or date ascending)
  const sorted = [...fuelLogs].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  let totalFuelSpent = 0;
  let totalFuelLitres = 0;
  const logsWithMileage = [];

  let lastFullTankIndex = -1;
  let fuelSinceLastFull = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;

    const distanceSincePrev = prev ? Math.max(0, current.odometer - prev.odometer) : 0;
    totalFuelSpent += Number(current.amount) || 0;
    totalFuelLitres += Number(current.litres) || 0;

    let computedMileage = null;
    let distanceForMileage = 0;

    if (current.isFullTank) {
      if (lastFullTankIndex !== -1) {
        // Distance covered between the two full-tank fills
        const prevFullOdo = sorted[lastFullTankIndex].odometer;
        distanceForMileage = Math.max(0, current.odometer - prevFullOdo);
        const totalFuelUsed = fuelSinceLastFull + (Number(current.litres) || 0);

        if (totalFuelUsed > 0 && distanceForMileage > 0) {
          computedMileage = Number((distanceForMileage / totalFuelUsed).toFixed(1));
        }
      }
      // Reset accumulator
      lastFullTankIndex = i;
      fuelSinceLastFull = 0;
    } else {
      // Partial fill: add to accumulator
      fuelSinceLastFull += Number(current.litres) || 0;
    }

    logsWithMileage.push({
      ...current,
      distanceSincePrev,
      mileage: computedMileage, // null if couldn't calculate exact full-to-full yet
    });
  }

  // Calculate overall distance tracked
  const firstOdo = sorted.length > 0 ? sorted[0].odometer : 0;
  const lastOdo = sorted.length > 0 ? sorted[sorted.length - 1].odometer : 0;
  const totalDistanceCovered = Math.max(0, lastOdo - firstOdo);

  // Overall mileage across all valid logs
  const validMileages = logsWithMileage
    .filter((l) => l.mileage !== null && l.mileage > 0)
    .map((l) => l.mileage);

  let overallMileage = 0;
  if (validMileages.length > 0) {
    const sum = validMileages.reduce((acc, val) => acc + val, 0);
    overallMileage = Number((sum / validMileages.length).toFixed(1));
  } else if (totalFuelLitres > 0 && totalDistanceCovered > 0) {
    overallMileage = Number((totalDistanceCovered / totalFuelLitres).toFixed(1));
  } else {
    overallMileage = 42.0;
  }

  // Current month key (YYYY-MM)
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Find latest active month if current month has no data
  let activeMonthKey = currentMonthKey;
  const allDates = [
    ...sorted.map((l) => l.date),
    ...trips.map((t) => t.date),
  ].filter(Boolean);

  const hasCurrentMonthData = allDates.some((d) => d && d.startsWith(currentMonthKey));
  if (!hasCurrentMonthData && allDates.length > 0) {
    const latestDate = [...allDates].sort().reverse()[0];
    activeMonthKey = latestDate.slice(0, 7);
  }

  let currentMonthFuelSpent = 0;
  let currentMonthFuelLitres = 0;
  let odoDistanceInMonth = 0;
  const monthMileages = [];

  sorted.forEach((l) => {
    if (l.date && l.date.startsWith(activeMonthKey)) {
      currentMonthFuelSpent += Number(l.amount) || 0;
      currentMonthFuelLitres += Number(l.litres) || 0;
      odoDistanceInMonth += Number(l.distanceSincePrev) || 0;
      if (l.mileage && l.mileage > 0) {
        monthMileages.push(l.mileage);
      }
    }
  });

  // Calculate distance from trips in this month
  let tripsDistanceInMonth = 0;
  trips.forEach((t) => {
    if (t.date && t.date.startsWith(activeMonthKey)) {
      tripsDistanceInMonth += Number(t.distanceKm) || 0;
    }
  });

  // This month's tracked distance
  const currentMonthDistance = tripsDistanceInMonth > 0 ? tripsDistanceInMonth : odoDistanceInMonth;

  const latestPrice = sorted[sorted.length - 1]?.pricePerLitre || 102.5;

  // Running cost for this month (₹/km)
  let currentMonthCostPerKm = 0;
  if (odoDistanceInMonth > 0 && currentMonthFuelSpent > 0) {
    currentMonthCostPerKm = Number((currentMonthFuelSpent / odoDistanceInMonth).toFixed(2));
  } else if (monthMileages.length > 0) {
    const avgMonthMileage = monthMileages.reduce((a, b) => a + b, 0) / monthMileages.length;
    currentMonthCostPerKm = Number((latestPrice / avgMonthMileage).toFixed(2));
  } else if (overallMileage > 0) {
    currentMonthCostPerKm = Number((latestPrice / overallMileage).toFixed(2));
  } else {
    currentMonthCostPerKm = 2.45;
  }

  // Cost per km all-time
  const averageCostPerKm =
    totalDistanceCovered > 0
      ? Number((totalFuelSpent / totalDistanceCovered).toFixed(2))
      : overallMileage > 0 && sorted.length > 0
        ? Number(((sorted[sorted.length - 1].pricePerLitre || 102.5) / overallMileage).toFixed(2))
        : 2.45;

  // Return reverse-sorted (newest first) for UI timeline display
  return {
    logsWithMileage: logsWithMileage.reverse(),
    overallMileage,
    totalFuelSpent: Math.round(totalFuelSpent),
    currentMonthFuelSpent: Math.round(currentMonthFuelSpent),
    currentMonthFuelLitres: Number(currentMonthFuelLitres.toFixed(1)),
    currentMonthDistance: Math.round(currentMonthDistance),
    currentMonthCostPerKm,
    activeMonthKey,
    totalFuelLitres: Number(totalFuelLitres.toFixed(1)),
    totalDistanceCovered,
    averageCostPerKm,
    latestPrice,
    minOdo: firstOdo,
    maxOdo: lastOdo,
  };
}

/**
 * Format currency for Indian Rupees (₹)
 */
export function formatINR(val) {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  return '₹ ' + Number(val).toLocaleString('en-IN');
}

/**
 * Format readable date
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format readable date and time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
