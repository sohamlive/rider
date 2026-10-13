import React from 'react';
import { Fuel, Gauge, Trash2, Edit2, Calendar } from 'lucide-react';
import { formatINR, formatDateTime } from '../utils/calculations';

export function FuelHistory({ logs = [], onEdit, onDelete, onAddClick }) {
  if (logs.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-circle">
          <Fuel size={32} />
        </div>
        <h3 className="empty-title">No fuel logs yet</h3>
        <p className="empty-desc">
          Start tracking your Activa 3G fuel fills to calculate real-world mileage and cost per km.
        </p>
        <button onClick={onAddClick} className="btn-primary mt-4">
          + Log Your First Refill
        </button>
      </div>
    );
  }

  return (
    <div className="history-list-wrapper">
      <div className="history-header">
        <div>
          <h2 className="section-title">Fuel Refill Timeline</h2>
          <p className="section-desc">{logs.length} fills recorded</p>
        </div>
      </div>

      <div className="logs-cards-grid">
        {logs.map((log) => (
          <div key={log.id} className="history-card">
            {/* Top row: Date, Mileage badge & Action buttons inline */}
            <div className="card-top-row">
              <div className="card-date-group">
                <Calendar size={14} className="text-muted" />
                <span className="card-date">{formatDateTime(log.date)}</span>
              </div>
              <div className="card-top-actions-group">
                {log.mileage ? (
                  <div className="mileage-highlight-pill" title="Full-to-full calculated mileage">
                    <span className="mileage-num">{log.mileage}</span>
                    <span className="mileage-sub">km/L</span>
                  </div>
                ) : log.isFullTank ? (
                  <span className="tank-pill full-tank">Full Tank</span>
                ) : (
                  <span className="tank-pill partial-tank">Partial Fill</span>
                )}
                <div className="card-actions-inline">
                  <button
                    onClick={() => onEdit(log)}
                    className="icon-action-btn edit"
                    title="Edit refill entry"
                    data-tooltip="Edit"
                    aria-label="Edit refill entry"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(log.id)}
                    className="icon-action-btn delete"
                    title="Delete refill entry"
                    data-tooltip="Delete"
                    aria-label="Delete refill entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Stats Row */}
            <div className="card-main-stats">
              <div className="stat-chunk">
                <span className="chunk-label">Amount Paid</span>
                <span className="chunk-val bold-text">{formatINR(log.amount)}</span>
              </div>
              <div className="stat-chunk">
                <span className="chunk-label">Fuel Added</span>
                <span className="chunk-val">{log.litres} L</span>
              </div>
              <div className="stat-chunk">
                <span className="chunk-label">Rate</span>
                <span className="chunk-val price-val">₹{log.pricePerLitre}/L</span>
              </div>
            </div>

            {/* Odometer Row */}
            <div className="card-sub-info">
              <div className="info-item">
                <Gauge size={14} className="text-muted" />
                <span className="info-text">
                  <strong>{log.odometer.toLocaleString('en-IN')}</strong> km
                  {log.distanceSincePrev > 0 && (
                    <span className="odo-diff"> (+{log.distanceSincePrev} km)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
