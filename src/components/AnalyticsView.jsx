import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { formatDate } from '../utils/calculations';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function AnalyticsView({ fuelLogs = [], trips = [], theme = 'dark' }) {
  const [timeRange, setTimeRange] = useState('1m'); // '1m' (default), '3m', 'all'

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipTextColor = isDark ? '#f8fafc' : '#0f172a';

  // Determine reference timestamp (current time or latest recorded item)
  const referenceTimestamp = useMemo(() => {
    const now = Date.now();
    const timestamps = [
      ...fuelLogs.map((l) => new Date(l.date).getTime()),
      ...trips.map((t) => new Date(t.date).getTime()),
    ].filter((t) => !isNaN(t));

    if (timestamps.length === 0) return now;
    const maxDataTime = Math.max(...timestamps);
    return Math.max(now, maxDataTime);
  }, [fuelLogs, trips]);

  // Filter logs and trips based on active timeRange
  const { filteredFuelLogs, filteredTrips } = useMemo(() => {
    if (timeRange === 'all') {
      return { filteredFuelLogs: fuelLogs, filteredTrips: trips };
    }

    const days = timeRange === '1m' ? 30 : 90;
    const cutoffTime = referenceTimestamp - days * 24 * 60 * 60 * 1000;

    const fFuel = fuelLogs.filter((l) => new Date(l.date).getTime() >= cutoffTime);
    const fTrips = trips.filter((t) => new Date(t.date).getTime() >= cutoffTime);

    return { filteredFuelLogs: fFuel, filteredTrips: fTrips };
  }, [fuelLogs, trips, timeRange, referenceTimestamp]);

  // Sort filtered fuel logs ascending for time-series charts
  const ascFuel = useMemo(() => {
    return [...filteredFuelLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredFuelLogs]);

  // 1. Mileage Trend Chart Data
  const mileageChartData = useMemo(() => {
    const mileagePoints = ascFuel.filter((l) => l.mileage && l.mileage > 0);
    const labels = mileagePoints.map((l) => formatDate(l.date));
    const values = mileagePoints.map((l) => l.mileage);

    return {
      labels: labels.length > 0 ? labels : ['No refuels with mileage in this period'],
      datasets: [
        {
          label: 'Mileage (km / L)',
          data: values.length > 0 ? values : [null],
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#0ea5e9',
          pointBorderColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderWidth: 2.5,
          pointRadius: 6,
          pointHoverRadius: 8,
          order: 1,
        },
      ],
    };
  }, [ascFuel, isDark]);

  // 2. Monthly Fuel Expense vs Distance Chart Data
  const monthlyExpenseData = useMemo(() => {
    const monthlyData = {};

    ascFuel.forEach((log) => {
      const key = log.date.slice(0, 7); // YYYY-MM
      if (!monthlyData[key]) monthlyData[key] = { cost: 0, litres: 0, distance: 0 };
      monthlyData[key].cost += Number(log.amount) || 0;
      monthlyData[key].litres += Number(log.litres) || 0;
    });

    filteredTrips.forEach((trip) => {
      const key = trip.date.slice(0, 7);
      if (!monthlyData[key]) monthlyData[key] = { cost: 0, litres: 0, distance: 0 };
      monthlyData[key].distance += Number(trip.distanceKm) || 0;
    });

    const monthKeys = Object.keys(monthlyData).sort();
    const monthLabels = monthKeys.map((k) => {
      const [year, month] = k.split('-');
      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return dateObj.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    });

    const monthlyCostValues = monthKeys.map((k) => Math.round(monthlyData[k].cost));
    const monthlyDistValues = monthKeys.map((k) => Math.round(monthlyData[k].distance));

    return {
      labels: monthLabels.length > 0 ? monthLabels : ['Current Period'],
      datasets: [
        // Line dataset (Distance) with order: 1 so it draws IN FRONT of the bar columns
        {
          type: 'line',
          label: 'Rides Distance (km)',
          data: monthlyDistValues.length > 0 ? monthlyDistValues : [0],
          borderColor: '#10b981',
          backgroundColor: '#10b981',
          borderWidth: 3,
          tension: 0.25,
          pointBackgroundColor: '#10b981',
          pointBorderColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderWidth: 2.5,
          pointRadius: 6,
          pointHoverRadius: 9,
          yAxisID: 'y1',
          order: 1, // Draws IN FRONT
        },
        // Bar dataset (Fuel Expense) with order: 2 so it draws BEHIND the distance line
        {
          type: 'bar',
          label: 'Fuel Expense (₹)',
          data: monthlyCostValues.length > 0 ? monthlyCostValues : [0],
          backgroundColor: isDark ? 'rgba(14, 165, 233, 0.75)' : '#0ea5e9',
          hoverBackgroundColor: '#0284c7',
          borderRadius: 8,
          barPercentage: 0.55,
          yAxisID: 'y',
          order: 2, // Draws BEHIND
        },
      ],
    };
  }, [ascFuel, filteredTrips, isDark]);

  // Common chart options
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
          font: { family: 'Outfit, sans-serif', size: 12 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTextColor,
        bodyColor: tooltipTextColor,
        borderColor: isDark ? '#334155' : '#cbd5e1',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit, sans-serif', size: 11 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { family: 'Outfit, sans-serif', size: 11 } },
      },
    },
  };

  return (
    <div className="analytics-section">
      <div className="section-header-row analytics-header-row">
        <div>
          <h2 className="section-title">Performance & Expense Charts</h2>
          <p className="section-desc">Activa 3G fuel mileage and monthly usage trends</p>
        </div>

        {/* Time Range Filter: Past 1 Month (Default), Past 3 Months, All Time */}
        <div className="time-filter-group" role="group" aria-label="Chart time range">
          <button
            type="button"
            className={`filter-btn ${timeRange === '1m' ? 'filter-active' : ''}`}
            onClick={() => setTimeRange('1m')}
          >
            Past 1 Month
          </button>
          <button
            type="button"
            className={`filter-btn ${timeRange === '3m' ? 'filter-active' : ''}`}
            onClick={() => setTimeRange('3m')}
          >
            Past 3 Months
          </button>
          <button
            type="button"
            className={`filter-btn ${timeRange === 'all' ? 'filter-active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="charts-grid two-column-grid">
        {/* Chart 1: Mileage Efficiency Trend */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-icon-label">
              <TrendingUp size={18} className="chart-icon text-cyan" />
              <h3>Mileage Efficiency Trend</h3>
            </div>
            <span className="chart-badge">km / L</span>
          </div>
          <div className="chart-canvas-wrapper">
            <Line
              data={mileageChartData}
              options={{
                ...defaultOptions,
                scales: {
                  ...defaultOptions.scales,
                  y: {
                    ...defaultOptions.scales.y,
                    suggestedMin: 30,
                    suggestedMax: 55,
                    title: { display: true, text: 'Mileage (km / L)', color: textColor },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Monthly Fuel Expense vs Distance */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div className="chart-icon-label">
              <BarChart3 size={18} className="chart-icon text-emerald" />
              <h3>Monthly Fuel Expense vs Distance</h3>
            </div>
            <span className="chart-badge">₹ & km</span>
          </div>
          <div className="chart-canvas-wrapper">
            <Bar
              data={monthlyExpenseData}
              options={{
                ...defaultOptions,
                scales: {
                  x: defaultOptions.scales.x,
                  y: {
                    ...defaultOptions.scales.y,
                    position: 'left',
                    title: { display: true, text: 'Fuel Expense (₹)', color: textColor },
                  },
                  y1: {
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: textColor },
                    title: { display: true, text: 'Distance (km)', color: textColor },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
