import React, { useState, useEffect } from 'react';
import { X, Navigation, Check, Route, Calendar, MapPin, AlertCircle, Gauge } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatINR } from '../utils/calculations';

export function TripModal({ isOpen, onClose, onSave, lastOdo = 19391, averageCostPerKm = 2.4, initialTrip = null }) {
  const [entryMode, setEntryMode] = useState('odo'); // 'odo' or 'direct'
  const [title, setTitle] = useState('Daily Ride');
  const [startOdo, setStartOdo] = useState(lastOdo || 19390);
  const [endOdo, setEndOdo] = useState(lastOdo ? lastOdo + 5 : 19405);
  const [distanceKm, setDistanceKm] = useState('15');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTrip) {
      setTitle(initialTrip.title || '');
      if (initialTrip.startOdo && initialTrip.endOdo) {
        setEntryMode('odo');
        setStartOdo(initialTrip.startOdo);
        setEndOdo(initialTrip.endOdo);
        setDistanceKm(String(initialTrip.distanceKm || (initialTrip.endOdo - initialTrip.startOdo)));
      } else {
        setEntryMode('direct');
        setDistanceKm(String(initialTrip.distanceKm || ''));
      }
      setDate(initialTrip.date ? initialTrip.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
    } else {
      setTitle('Daily Ride');
      setEntryMode('odo');
      const start = lastOdo || 19390;
      setStartOdo(start);
      setEndOdo(start + 14);
      setDistanceKm('14');
    }
    setError('');
  }, [isOpen, initialTrip, lastOdo]);

  // Sync distance when odometers change
  const handleOdoChange = (newStart, newEnd) => {
    setStartOdo(newStart);
    setEndOdo(newEnd);
    const s = parseInt(newStart, 10);
    const e = parseInt(newEnd, 10);
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      setDistanceKm(String(e - s));
    }
  };

  const currentDist = parseFloat(distanceKm) || 0;
  const estimatedCost = Math.round(currentDist * (averageCostPerKm || 2.4));

  const handleSubmit = (e) => {
    e.preventDefault();
    const dist = parseFloat(distanceKm);

    if (isNaN(dist) || dist <= 0) {
      setError('Please provide a valid ride distance (km).');
      return;
    }

    let finalStart = null;
    let finalEnd = null;

    if (entryMode === 'odo') {
      finalStart = parseInt(startOdo, 10);
      finalEnd = parseInt(endOdo, 10);
      if (isNaN(finalStart) || isNaN(finalEnd) || finalEnd < finalStart) {
        setError('End odometer must be greater than or equal to start odometer.');
        return;
      }
    }

    const payload = {
      id: initialTrip ? initialTrip.id : `trip_${Date.now()}`,
      title: title.trim() || 'Daily Ride',
      date,
      startOdo: finalStart,
      endOdo: finalEnd,
      distanceKm: dist,
      estimatedCost,
    };

    onSave(payload);

    try {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge trip-badge">
              <Navigation size={20} />
            </span>
            <div>
              <h2 className="modal-title">{initialTrip ? 'Edit Ride Log' : 'Log Daily Ride'}</h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="form-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Trip Title */}
          <div className="form-group">
            <label htmlFor="trip-title-input" className="form-label">
              Trip Title / Destination
            </label>
            <div className="input-with-affix">
              <span className="affix prefix">
                <Navigation size={16} />
              </span>
              <input
                id="trip-title-input"
                type="text"
                placeholder="e.g. Office Commute, Grocery run"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input bold-input"
                required
              />
            </div>
          </div>

          {/* Distance Input Mode Toggle */}
          <div className="mode-toggle-group">
            <button
              type="button"
              className={`mode-btn ${entryMode === 'odo' ? 'active' : ''}`}
              onClick={() => setEntryMode('odo')}
            >
              Start & End Odometer
            </button>
            <button
              type="button"
              className={`mode-btn ${entryMode === 'direct' ? 'active' : ''}`}
              onClick={() => setEntryMode('direct')}
            >
              Direct Distance (km)
            </button>
          </div>

          {/* Odometer Inputs or Direct Distance */}
          {entryMode === 'odo' ? (
            <div className="form-row-dual">
              <div className="form-group">
                <label htmlFor="trip-start-odo" className="form-label">
                  Start Odometer (km)
                </label>
                <div className="input-with-affix">
                  <span className="affix prefix">
                    <Gauge size={16} />
                  </span>
                  <input
                    id="trip-start-odo"
                    type="number"
                    min="0"
                    placeholder="e.g. 19340"
                    value={startOdo}
                    onChange={(e) => handleOdoChange(e.target.value, endOdo)}
                    className="form-input bold-input"
                    required
                  />
                  <span className="affix suffix">km</span>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="trip-end-odo" className="form-label">
                  End Odometer (km)
                </label>
                <div className="input-with-affix">
                  <span className="affix prefix">
                    <Gauge size={16} />
                  </span>
                  <input
                    id="trip-end-odo"
                    type="number"
                    min="0"
                    placeholder="e.g. 19355"
                    value={endOdo}
                    onChange={(e) => handleOdoChange(startOdo, e.target.value)}
                    className="form-input bold-input"
                    required
                  />
                  <span className="affix suffix">km</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="trip-direct-dist" className="form-label">
                Trip Distance (km)
              </label>
              <div className="input-with-affix">
                <span className="affix prefix">
                  <Route size={16} />
                </span>
                <input
                  id="trip-direct-dist"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 14.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="form-input bold-input"
                  required
                />
                <span className="affix suffix">km</span>
              </div>
            </div>
          )}

          {/* Live Calculated Trip Cost Banner */}
          {currentDist > 0 && (
            <div className="trip-cost-summary-card">
              <div className="trip-cost-left">
                <span className="trip-cost-label">Est. Fuel Cost for this ride</span>
                {/* <span className="trip-cost-formula">
                  {currentDist} km × ₹{averageCostPerKm || 2.4}/km
                </span> */}
              </div>
              <div className="trip-cost-right">
                <span className="trip-cost-amount">₹{estimatedCost}</span>
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="form-group">
            <label htmlFor="trip-date-input" className="form-label">
              Date & Time
            </label>
            <div className="input-with-affix">
              <span className="affix prefix">
                <Calendar size={16} />
              </span>
              <input
                id="trip-date-input"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* v2 Future Feature Note */}
          {/* <div className="v2-preview-banner">
            <MapPin size={18} className="v2-icon" />
            <div className="v2-text">
              <span className="v2-title">Coming in v2: Google Maps GPS Tracking</span>
              <span className="v2-sub">
                Optional 1-tap route logging will capture start & end coordinates automatically!
              </span>
            </div>
          </div> */}

          {/* Submit Action */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" id="btn-save-trip">
              <Check size={18} />
              <span>{initialTrip ? 'Update Ride Log' : 'Save Ride Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
