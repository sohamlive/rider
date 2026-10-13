import React, { useState, useEffect } from 'react';
import { X, Fuel, Check, IndianRupee, Gauge, Calendar, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateLitres, calculateAmount } from '../utils/calculations';

export function FuelModal({ isOpen, onClose, onSave, lastPrice = 103.8, lastOdo = 19310, initialEntry = null }) {
  const [fillMode, setFillMode] = useState('amount'); // 'amount' or 'litres'
  const [pricePerLitre, setPricePerLitre] = useState(lastPrice);
  const [amount, setAmount] = useState('500');
  const [litres, setLitres] = useState('');
  const [odometer, setOdometer] = useState(lastOdo ? lastOdo + 150 : 19400);
  const [isFullTank, setIsFullTank] = useState(true);
  const [date, setDate] = useState(() => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [error, setError] = useState('');

  // Initialize form when opening
  useEffect(() => {
    if (initialEntry) {
      setFillMode('amount');
      setPricePerLitre(initialEntry.pricePerLitre || lastPrice);
      setAmount(String(initialEntry.amount || ''));
      setLitres(String(initialEntry.litres || ''));
      setOdometer(initialEntry.odometer || (lastOdo ? lastOdo + 100 : 19400));
      setIsFullTank(initialEntry.isFullTank ?? true);
      setDate(initialEntry.date ? initialEntry.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
    } else {
      setPricePerLitre(lastPrice);
      const initialAmt = 500;
      setAmount(String(initialAmt));
      setLitres(calculateLitres(initialAmt, lastPrice).toString());
      setOdometer(lastOdo ? lastOdo + 100 : 19400);
      setIsFullTank(true);
    }
    setError('');
  }, [isOpen, initialEntry, lastPrice, lastOdo]);

  // Recalculate reciprocal values when active inputs change
  const handleAmountChange = (newAmt) => {
    setAmount(newAmt);
    const p = parseFloat(pricePerLitre);
    const a = parseFloat(newAmt);
    if (!isNaN(p) && p > 0 && !isNaN(a)) {
      setLitres(calculateLitres(a, p).toString());
    } else {
      setLitres('');
    }
  };

  const handleLitresChange = (newLitres) => {
    setLitres(newLitres);
    const p = parseFloat(pricePerLitre);
    const l = parseFloat(newLitres);
    if (!isNaN(p) && p > 0 && !isNaN(l)) {
      setAmount(calculateAmount(l, p).toString());
    } else {
      setAmount('');
    }
  };

  const handlePriceChange = (newPrice) => {
    setPricePerLitre(newPrice);
    const p = parseFloat(newPrice);
    if (!isNaN(p) && p > 0) {
      if (fillMode === 'amount') {
        const a = parseFloat(amount);
        if (!isNaN(a)) setLitres(calculateLitres(a, p).toString());
      } else {
        const l = parseFloat(litres);
        if (!isNaN(l)) setAmount(calculateAmount(l, p).toString());
      }
    }
  };

  const applyPresetAmount = (presetVal) => {
    setFillMode('amount');
    handleAmountChange(presetVal.toString());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmount = parseFloat(amount);
    const finalLitres = parseFloat(litres);
    const finalPrice = parseFloat(pricePerLitre);
    const finalOdo = parseInt(odometer, 10);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Please enter a valid fuel amount.');
      return;
    }
    if (isNaN(finalLitres) || finalLitres <= 0) {
      setError('Please check fuel quantity (litres).');
      return;
    }
    if (isNaN(finalPrice) || finalPrice <= 0) {
      setError('Please enter current fuel rate per litre.');
      return;
    }
    if (isNaN(finalOdo) || finalOdo <= 0) {
      setError('Please enter a valid odometer reading.');
      return;
    }

    const payload = {
      id: initialEntry ? initialEntry.id : `fuel_${Date.now()}`,
      date,
      odometer: finalOdo,
      amount: finalAmount,
      litres: finalLitres,
      pricePerLitre: finalPrice,
      isFullTank,
    };

    onSave(payload);

    // Trigger celebration
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  if (!isOpen) return null;

  const odoDelta = lastOdo && odometer ? odometer - lastOdo : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge fuel-badge">
              <Fuel size={20} />
            </span>
            <div>
              <h2 className="modal-title">{initialEntry ? 'Edit Fuel Refill' : 'Log Fuel Refill'}</h2>
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
          {/* Current Fuel Rate Inline */}
          <div className="form-group price-revision-card">
            <div className="price-inline-row">
              <label htmlFor="fuel-price-input" className="form-label price-inline-label">
                Current Fuel Rate
              </label>
              <div className="input-with-affix price-inline-input">
                <span className="affix prefix">₹</span>
                <input
                  id="fuel-price-input"
                  type="number"
                  step="0.01"
                  min="50"
                  max="200"
                  value={pricePerLitre}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="form-input bold-input"
                  required
                />
                <span className="affix suffix">/ L</span>
              </div>
            </div>
          </div>

          {/* Mode Switch: By Amount vs By Litre */}
          <div className="mode-toggle-group">
            <button
              type="button"
              className={`mode-btn ${fillMode === 'amount' ? 'active' : ''}`}
              onClick={() => setFillMode('amount')}
            >
              Fill by Amount (₹)
            </button>
            <button
              type="button"
              className={`mode-btn ${fillMode === 'litres' ? 'active' : ''}`}
              onClick={() => setFillMode('litres')}
            >
              Fill by Litres (L)
            </button>
          </div>

          {/* Preset Rupee chips */}
          {fillMode === 'amount' && (
            <div className="preset-chips-row">
              {[100, 200, 300, 500].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  className={`chip-btn ${parseFloat(amount) === preset ? 'chip-active' : ''}`}
                  onClick={() => applyPresetAmount(preset)}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          )}

          {/* Amount and Litres Dual Row */}
          <div className="form-row-dual">
            <div className="form-group">
              <label htmlFor="fuel-amount-input" className="form-label">
                Total Amount (₹)
              </label>
              <div className="input-with-affix">
                <span className="affix prefix">₹</span>
                <input
                  id="fuel-amount-input"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => {
                    setFillMode('amount');
                    handleAmountChange(e.target.value);
                  }}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="fuel-litres-input" className="form-label">
                Quantity (Litres)
              </label>
              <div className="input-with-affix">
                <input
                  id="fuel-litres-input"
                  type="number"
                  step="0.01"
                  min="0.1"
                  placeholder="e.g. 4.88"
                  value={litres}
                  onChange={(e) => {
                    setFillMode('litres');
                    handleLitresChange(e.target.value);
                  }}
                  className="form-input"
                  required
                />
                <span className="affix suffix">L</span>
              </div>
            </div>
          </div>

          {/* Odometer Reading */}
          <div className="form-group">
            <div className="odo-label-row">
              <label htmlFor="fuel-odo-input" className="form-label">
                Odometer Reading (km)
              </label>
              {lastOdo > 0 && (
                <span className="last-odo-badge">
                  Prev: {lastOdo.toLocaleString('en-IN')} km
                  {odoDelta !== null && odoDelta > 0 && ` (+${odoDelta} km)`}
                </span>
              )}
            </div>
            <div className="input-with-affix">
              <span className="affix prefix">
                <Gauge size={16} />
              </span>
              <input
                id="fuel-odo-input"
                type="number"
                min="0"
                placeholder="Current speedometer reading"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="form-input bold-input"
                required
              />
              <span className="affix suffix">km</span>
            </div>
          </div>

          {/* Full Tank Toggle */}
          <div className="toggle-card">
            <label className="toggle-container" htmlFor="full-tank-toggle">
              <div className="toggle-text">
                <span className="toggle-title">Full Tank Refill</span>
              </div>
              <input
                id="full-tank-toggle"
                type="checkbox"
                checked={isFullTank}
                onChange={(e) => setIsFullTank(e.target.checked)}
                className="custom-toggle-input"
              />
              <span className="custom-toggle-slider" />
            </label>
          </div>

          {/* Date & Time */}
          <div className="form-group">
            <label htmlFor="fuel-date-input" className="form-label">
              Date & Time
            </label>
            <div className="input-with-affix">
              <span className="affix prefix">
                <Calendar size={16} />
              </span>
              <input
                id="fuel-date-input"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="modal-actions-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" id="btn-save-fuel">
              <Check size={18} />
              <span>{initialEntry ? 'Update Fuel Log' : 'Save Fuel Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
