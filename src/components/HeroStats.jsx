import React from 'react';
import { Gauge, Fuel, IndianRupee, Route } from 'lucide-react';
import { formatINR } from '../utils/calculations';

export function HeroStats({ stats }) {
  const {
    overallMileage,
    currentMonthCostPerKm,
    averageCostPerKm,
    currentMonthDistance,
    currentMonthFuelSpent,
    currentMonthFuelLitres,
    fuelCostPerKm,
  } = stats;

  const costPerKmToShow = currentMonthCostPerKm || averageCostPerKm;

  return (
    <section className="hero-stats-grid">
      {/* 1. Mileage Card */}
      <div className="stat-card highlight-card">
        <div className="stat-card-header">
          <span className="stat-label">Average Mileage</span>
          <div className="stat-icon-wrapper mileage-badge">
            <Gauge size={18} />
          </div>
        </div>
        <div className="stat-value-group">
          <span className="stat-main-num">{overallMileage || '--'}</span>
          <span className="stat-unit">km / L</span>
        </div>
      </div>

      {/* 2. Total Running Cost (Fuel + Service) */}
      <div className="stat-card" title="Total Running Cost per km (Fuel + Maintenance)">
        <div className="stat-card-header">
          <span className="stat-label">Total Running Cost</span>
          <div className="stat-icon-wrapper cost-badge">
            <IndianRupee size={18} />
          </div>
        </div>
        <div className="stat-value-group">
          <span className="stat-main-num">₹ {costPerKmToShow || '2.45'}</span>
          <span className="stat-unit">/ km</span>
        </div>
        {fuelCostPerKm && (
          <div className="stat-subtext" style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '4px' }}>
            Fuel only: ₹{(fuelCostPerKm).toFixed(2)}/km
          </div>
        )}
      </div>

      {/* 3. Tracked Distance for this month */}
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-label">Tracked Distance</span>
          <div className="stat-icon-wrapper distance-badge">
            <Route size={18} />
          </div>
        </div>
        <div className="stat-value-group">
          <span className="stat-main-num">
            {currentMonthDistance !== undefined && currentMonthDistance !== null
              ? currentMonthDistance.toLocaleString('en-IN')
              : 0}
          </span>
          <span className="stat-unit">km</span>
        </div>
      </div>

      {/* 4. This Month's Fuel Spent */}
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-label">This Month's Fuel</span>
          <div className="stat-icon-wrapper fuel-badge">
            <Fuel size={18} />
          </div>
        </div>
        <div className="stat-value-group">
          <span className="stat-main-num">{formatINR(currentMonthFuelSpent ?? 0)}</span>
          <span className="stat-unit">{currentMonthFuelLitres ?? 0} L</span>
        </div>
      </div>
    </section>
  );
}
