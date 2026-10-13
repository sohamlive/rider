import React from 'react';
import { Route, Navigation, Calendar, Gauge, Trash2, Edit2, IndianRupee } from 'lucide-react';
import { formatDateTime, formatINR } from '../utils/calculations';

export function TripHistory({ trips = [], onEdit, onDelete, onAddClick }) {
  if (trips.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-circle trip-empty-icon">
          <Navigation size={32} />
        </div>
        <h3 className="empty-title">No daily rides logged yet</h3>
        <p className="empty-desc">
          Record your commutes and errands to understand your daily running distance and expense.
        </p>
        <button onClick={onAddClick} className="btn-secondary mt-4">
          + Log Your First Ride
        </button>
      </div>
    );
  }

  // Sort descending by date
  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="history-list-wrapper">
      <div className="history-header">
        <div>
          <h2 className="section-title">Daily Rides & Trips Log</h2>
          <p className="section-desc">{trips.length} rides recorded</p>
        </div>
      </div>

      <div className="logs-cards-grid">
        {sortedTrips.map((trip) => {
          return (
            <div key={trip.id} className="history-card trip-history-card">
              <div className="card-top-row">
                <div className="card-date-group">
                  <Calendar size={14} className="text-muted" />
                  <span className="card-date">{formatDateTime(trip.date)}</span>
                </div>
                <div className="card-actions-inline">
                  <button
                    onClick={() => onEdit(trip)}
                    className="icon-action-btn edit"
                    title="Edit ride entry"
                    data-tooltip="Edit"
                    aria-label="Edit ride entry"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(trip.id)}
                    className="icon-action-btn delete"
                    title="Delete ride entry"
                    data-tooltip="Delete"
                    aria-label="Delete ride entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="trip-card-main">
                <h3 className="trip-card-title">{trip.title}</h3>
                <div className="trip-stats-strip">
                  <div className="trip-stat-block">
                    <span className="trip-stat-num">{trip.distanceKm}</span>
                    <span className="trip-stat-unit">km</span>
                  </div>
                  {trip.estimatedCost ? (
                    <div className="trip-stat-block cost-block">
                      <span className="trip-stat-num">{formatINR(trip.estimatedCost)}</span>
                      <span className="trip-stat-unit">est. fuel</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {trip.startOdo && trip.endOdo && (
                <div className="card-sub-info">
                  <div className="info-item">
                    <Gauge size={14} className="text-muted" />
                    <span className="info-text">
                      Odo: {trip.startOdo.toLocaleString('en-IN')} → {trip.endOdo.toLocaleString('en-IN')} km
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
