import React from 'react';
import { Wrench, Gauge, Trash2, Edit2, Calendar, Wind, BatteryCharging, IndianRupee } from 'lucide-react';
import { formatINR, formatDateTime } from '../utils/calculations';

export function ServiceHistory({ services = [], onEdit, onDelete, onAddClick }) {
  if (services.length === 0) {
    return (
      <div className="empty-state-card">
        <div className="empty-icon-circle service-empty-icon">
          <Wrench size={32} />
        </div>
        <h3 className="empty-title">No service records yet</h3>
        <p className="empty-desc">
          Keep track of routine oil changes, tyre air pressure refills, and battery maintenance.
        </p>
        <button onClick={onAddClick} className="btn-primary mt-4">
          + Log Maintenance
        </button>
      </div>
    );
  }

  const getTypeIcon = (type) => {
    if (type === 'Air') return <Wind size={13} />;
    if (type === 'Battery') return <BatteryCharging size={13} />;
    return <Wrench size={13} />;
  };

  const getTypeBadgeClass = (type) => {
    if (type === 'Air') return 'cat-commute';
    if (type === 'Battery') return 'cat-highway';
    return 'cat-errand';
  };

  return (
    <div className="history-list-wrapper">
      <div className="history-header">
        <div>
          <h2 className="section-title">Service & Maintenance Timeline</h2>
          <p className="section-desc">{services.length} records logged</p>
        </div>
      </div>

      <div className="logs-cards-grid">
        {services.map((s) => (
          <div key={s.id} className="history-card">
            {/* Top row: Date, Type Tag & Action Buttons */}
            <div className="card-top-row">
              <div className="card-date-group">
                <Calendar size={14} className="text-muted" />
                <span className="card-date">{formatDateTime(s.date)}</span>
              </div>
              <div className="card-top-actions-group">
                <span className={`category-tag ${getTypeBadgeClass(s.type)}`}>
                  {s.type}
                </span>
                <div className="card-actions-inline">
                  <button
                    onClick={() => onEdit(s)}
                    className="icon-action-btn edit"
                    title="Edit service record"
                    data-tooltip="Edit"
                    aria-label="Edit service record"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="icon-action-btn delete"
                    title="Delete service record"
                    data-tooltip="Delete"
                    aria-label="Delete service record"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Middle: Cost & Odometer Reading */}
            <div className="card-main-stats">
              <div className="stat-chunk">
                <span className="chunk-label">Cost</span>
                <span className="chunk-val bold-text price-val">{formatINR(s.cost)}</span>
              </div>
              <div className="stat-chunk" style={{ textAlign: 'right' }}>
                <span className="chunk-label">Odometer</span>
                <span className="chunk-val">{(s.odometer || 0).toLocaleString('en-IN')} km</span>
              </div>
            </div>

            {/* Optional notes */}
            {s.notes && (
              <p className="card-notes">"{s.notes}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
