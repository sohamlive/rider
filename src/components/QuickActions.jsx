import React from 'react';
import { Fuel, Plus, Navigation } from 'lucide-react';

export function QuickActions({ onOpenFuelModal, onOpenTripModal }) {
  return (
    <div className="quick-actions-bar">
      <button
        onClick={onOpenFuelModal}
        className="action-btn primary-action-btn"
        id="btn-log-fuel"
      >
        <span className="btn-icon-circle fuel-btn-icon">
          <Fuel size={20} />
        </span>
        <span className="btn-title">Log Fuel Refill</span>
        <Plus size={18} className="btn-plus-icon" />
      </button>

      <button
        onClick={onOpenTripModal}
        className="action-btn secondary-action-btn"
        id="btn-log-trip"
      >
        <span className="btn-icon-circle trip-btn-icon">
          <Navigation size={20} />
        </span>
        <span className="btn-title">Log Daily Ride</span>
        <Plus size={18} className="btn-plus-icon" />
      </button>
    </div>
  );
}
