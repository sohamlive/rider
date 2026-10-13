import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  HardDrive,
  Cloud,
  Loader2,
} from 'lucide-react';
import {
  exportAllDataJSON,
  exportFuelCSV,
  exportTripsCSV,
  importDataJSON,
  resetData,
} from '../utils/storage';

export function DataModal({
  isOpen,
  onClose,
  user,
  fuelLogs,
  trips,
  settings,
  onClearAll,
  onLoadSample,
  onRestore,
  onDataChanged,
}) {
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    exportAllDataJSON(fuelLogs, trips, settings);
    setFeedback({ type: 'success', message: 'Full backup JSON downloaded successfully!' });
  };

  const handleExportFuelCSV = () => {
    exportFuelCSV(fuelLogs);
    setFeedback({ type: 'success', message: 'Fuel logs CSV downloaded successfully!' });
  };

  const handleExportTripsCSV = () => {
    exportTripsCSV(trips);
    setFeedback({ type: 'success', message: 'Trips CSV downloaded successfully!' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        try {
          setIsProcessing(true);
          const res = importDataJSON(content);
          if (res.success) {
            if (onRestore) {
              await onRestore(res.data);
            } else {
              onDataChanged?.();
            }
            setFeedback({
              type: 'success',
              message: user ? 'Backup restored and synced with cloud!' : res.message,
            });
          } else {
            setFeedback({ type: 'error', message: res.message });
          }
        } catch (err) {
          setFeedback({ type: 'error', message: 'Failed to restore: ' + (err?.message || err) });
        } finally {
          setIsProcessing(false);
        }
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Failed to read file.' });
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleLoadSample = async () => {
    const confirmMsg = user
      ? 'Reset data with sample Honda Activa 3G entries? Existing logs will be replaced in both this device and your cloud account.'
      : 'Reset data with sample Honda Activa 3G entries? Existing logs will be replaced.';

    if (window.confirm(confirmMsg)) {
      try {
        setIsProcessing(true);
        if (onLoadSample) {
          await onLoadSample();
        } else {
          resetData('sample');
          onDataChanged?.();
        }
        setFeedback({
          type: 'success',
          message: user
            ? 'Sample Activa data loaded and synced with cloud!'
            : 'Sample data loaded successfully!',
        });
      } catch (err) {
        setFeedback({ type: 'error', message: 'Failed to load sample data: ' + (err?.message || err) });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleClearAll = async () => {
    const confirmMsg = user
      ? `Are you sure you want to delete all fuel and trip logs? This will delete all logs from both this device and your Firebase cloud account (${user.email}). Make sure to download a backup first.`
      : 'Are you sure you want to delete all fuel and trip logs? Make sure to download a backup first.';

    if (window.confirm(confirmMsg)) {
      try {
        setIsProcessing(true);
        if (onClearAll) {
          await onClearAll();
        } else {
          resetData('clear');
          onDataChanged?.();
        }
        setFeedback({
          type: 'success',
          message: user ? 'All logs cleared from this device and the cloud.' : 'All logs cleared.',
        });
      } catch (err) {
        setFeedback({ type: 'error', message: 'Failed to clear data: ' + (err?.message || err) });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card data-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge data-badge">
              <HardDrive size={20} />
            </span>
            <div>
              <h2 className="modal-title">Backup & Data Management</h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="cloud-info-banner">
            <Cloud size={16} />
            <span>Connected to Google Account ({user.email}). Backup actions will automatically sync to Firestore.</span>
          </div>
        )}

        {feedback.message && (
          <div className={`status-banner ${feedback.type === 'success' ? 'status-success' : 'status-error'}`}>
            {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="data-sections-stack">
          {/* Section 1: Export Options */}
          <div className="data-box">
            <h3 className="data-box-title">
              <Download size={16} />
              <span>Export & Backup</span>
            </h3>
            <p className="data-box-desc">
              All your entries are saved securely. Download backups to keep your data safe and portable.
            </p>
            <div className="btn-wrap-row">
              <button onClick={handleExportJSON} disabled={isProcessing} className="data-action-btn primary-soft">
                <FileText size={16} />
                <span>Download Full JSON Backup</span>
              </button>
              <button onClick={handleExportFuelCSV} disabled={isProcessing} className="data-action-btn">
                <FileSpreadsheet size={16} />
                <span>Export Fuel (CSV)</span>
              </button>
              <button onClick={handleExportTripsCSV} disabled={isProcessing} className="data-action-btn">
                <FileSpreadsheet size={16} />
                <span>Export Trips (CSV)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Import / Restore */}
          <div className="data-box">
            <h3 className="data-box-title">
              <Upload size={16} />
              <span>Restore from Backup</span>
            </h3>
            <p className="data-box-desc">
              Restore a previous JSON backup onto this device and sync it across all your devices.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="data-action-btn secondary-soft"
            >
              {isProcessing ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
              <span>{isProcessing ? 'Restoring...' : 'Choose JSON Backup File'}</span>
            </button>
          </div>

          {/* Section 3: Reset / Sample Data */}
          <div className="data-box">
            <h3 className="data-box-title">
              <RotateCcw size={16} />
              <span>Sample Data & Reset</span>
            </h3>
            <div className="btn-wrap-row">
              <button onClick={handleLoadSample} disabled={isProcessing} className="data-action-btn">
                {isProcessing ? <Loader2 size={16} className="spin" /> : <RotateCcw size={16} />}
                <span>Load Sample Activa Data</span>
              </button>
              <button onClick={handleClearAll} disabled={isProcessing} className="data-action-btn danger-soft">
                {isProcessing ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>Clear All Logs</span>
              </button>
            </div>
          </div>
        </div>

        <div className="modal-actions-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
