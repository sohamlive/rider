import React, { useState, useEffect } from 'react';
import { X, Wrench, Check, IndianRupee, Gauge, Calendar, AlertCircle, Wind, BatteryCharging, Toolbox } from 'lucide-react';
import confetti from 'canvas-confetti';

const SERVICE_TYPES = [
  { id: 'Service', label: 'Service', icon: Wrench, desc: 'General service & oil change' },
  { id: 'Air', label: 'Air', icon: Wind, desc: 'Tyre pressure refill' },
  { id: 'Battery', label: 'Battery', icon: BatteryCharging, desc: 'Battery charge or check' },
  { id: 'Other', label: 'Other', icon: Toolbox, desc: 'Miscellaneous' },
];

export function ServiceModal({
  isOpen,
  onClose,
  onSave,
  lastOdo = 19391,
  initialService = null,
}) {
  const [serviceType, setServiceType] = useState('Service');
  const [cost, setCost] = useState('500');
  const [odometer, setOdometer] = useState(lastOdo || 19390);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialService) {
      setServiceType(initialService.type || 'Service');
      setCost(String(initialService.cost ?? ''));
      setOdometer(initialService.odometer || lastOdo || 19390);
      setNotes(initialService.notes || '');
      setDate(
        initialService.date
          ? initialService.date.slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
    } else {
      setServiceType('Service');
      setCost('500');
      setOdometer(lastOdo || 19390);
      setNotes('');
      const now = new Date();
      const tzOffset = now.getTimezoneOffset() * 60000;
      setDate(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
    }
    setError('');
  }, [isOpen, initialService, lastOdo]);

  if (!isOpen) return null;

  const handleTypeSelect = (typeId) => {
    setServiceType(typeId);
    if (!initialService) {
      // Sensible default suggestions based on type
      if (typeId === 'Air') setCost('10');
      else if (typeId === 'Battery') setCost('800');
      else if (typeId === 'Other') setCost('50');
      else setCost('500');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCost = parseFloat(cost);
    const finalOdo = parseInt(odometer, 10);

    if (isNaN(finalCost) || finalCost < 0) {
      setError('Please enter a valid cost (₹).');
      return;
    }

    if (isNaN(finalOdo) || finalOdo < 0) {
      setError('Please enter a valid odometer reading.');
      return;
    }

    const payload = {
      id: initialService ? initialService.id : `service_${Date.now()}`,
      type: serviceType,
      cost: finalCost,
      odometer: finalOdo,
      notes: notes.trim(),
      date,
    };

    onSave(payload);

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      // confetti fallback
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge service-icon-badge">
              <Wrench size={22} className="text-amber" />
            </div>
            <div>
              <h2 id="service-modal-title" className="modal-title">
                {initialService ? 'Edit Service Record' : 'Log Maintenance & Service'}
              </h2>
              {/* <p className="modal-subtitle">
                Track service, tyre air, and battery maintenance costs
              </p> */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Validation Alert */}
        {error && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Service Type Selection */}
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <div className="category-pills-row">
              {SERVICE_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = serviceType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTypeSelect(t.id)}
                    className={`pill-btn ${isSelected ? 'pill-active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cost (₹) */}
          <div className="form-group">
            <label className="form-label" htmlFor="service-cost">
              Cost (₹)
            </label>
            <div className="input-with-affix">
              <span className="affix">
                <IndianRupee size={16} />
              </span>
              <input
                id="service-cost"
                type="number"
                step="any"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                className="form-input bold-input"
                required
              // autoFocus
              />
            </div>
          </div>

          {/* Odometer Reading (km) */}
          <div className="form-group">
            <div className="odo-label-row">
              <label className="form-label" htmlFor="service-odometer">
                Odometer Reading (km)
              </label>
              {lastOdo > 0 && (
                <span className="last-odo-badge">Last: {lastOdo} km</span>
              )}
            </div>
            <div className="input-with-affix">
              <span className="affix">
                <Gauge size={16} />
              </span>
              <input
                id="service-odometer"
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="e.g. 19400"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="form-group">
            <label className="form-label" htmlFor="service-date">
              Date & Time
            </label>
            <div className="input-with-affix">
              <span className="affix">
                <Calendar size={16} />
              </span>
              <input
                id="service-date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="service-notes">
              Notes (Optional)
            </label>
            <input
              id="service-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Oil replaced, tyre pressure checked"
              className="form-input"
            />
          </div>

          {/* Modal Actions */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" id="btn-save-service">
              <Check size={18} />
              <span>{initialService ? 'Update Service' : 'Save Service Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
