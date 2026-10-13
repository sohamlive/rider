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

      {/* 2. Running Cost for this month */}
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-label">Running Cost</span>
          <div className="stat-icon-wrapper cost-badge">
            <IndianRupee size={18} />
          </div>
        </div>
        <div className="stat-value-group">
          <span className="stat-main-num">₹ {costPerKmToShow || '--'}</span>
          <span className="stat-unit">/ km</span>
        </div>
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
