import React, { useState, useRef, useEffect } from 'react';
import {
  Bike,
  Moon,
  Sun,
  Database,
  CloudOff,
  RefreshCw,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export function Header({
  theme,
  onToggleTheme,
  onOpenDataModal,
  latestOdo,
  user,
  isAuthLoading,
  syncStatus,
  isFirebaseConfigured,
  onSignIn,
  onSignOut,
  onOpenConfigModal
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSyncBadge = () => {
    if (!isFirebaseConfigured) {
      return (
        <button
          onClick={onOpenConfigModal}
          className="sync-badge sync-badge-local"
          title="Running on local storage. Click to view Firebase setup guide for cross-device sync."
        >
          <span className="sync-dot dot-local"></span>
          <span className="sync-badge-text">Local Storage</span>
        </button>
      );
    }

    if (isAuthLoading) {
      return (
        <div className="sync-badge sync-badge-checking" title="Connecting to Cloud...">
          <RefreshCw size={12} className="spin-icon text-muted-sync" />
          <span className="sync-badge-text">Connecting...</span>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="sync-badge sync-badge-local" title="Sign in with Google to sync across your phone and desktop">
          <span className="sync-dot dot-local"></span>
          <span className="sync-badge-text">Not Synced</span>
        </div>
      );
    }

    if (!syncStatus.isOnline) {
      return (
        <div className="sync-badge sync-badge-offline" title="Offline. Changes saved locally and will sync automatically when connected.">
          <CloudOff size={13} className="sync-icon-pulse text-amber" />
          <span className="sync-badge-text">Offline (Cached)</span>
        </div>
      );
    }

    if (syncStatus.isSyncing) {
      return (
        <div className="sync-badge sync-badge-syncing" title="Syncing changes with cloud database...">
          <RefreshCw size={13} className="spin-icon text-cyan" />
          <span className="sync-badge-text">Syncing...</span>
        </div>
      );
    }

    return (
      <div className="sync-badge sync-badge-synced" title="Connected to Cloud. Real-time sync active.">
        <CheckCircle2 size={13} className="text-emerald" />
        <span className="sync-badge-text">Synced</span>
      </div>
    );
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-group">
          <div className="scooter-avatar">
            <img src="./favicon.svg" alt="Rider Logo" className="brand-logo-img" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">Rider</h1>
              <span className="badge-pill">v1</span>
            </div>
            {/* <p className="brand-subtitle">
              {latestOdo ? `${latestOdo.toLocaleString('en-IN')} km logged` : 'scooter tracker'}
            </p> */}
          </div>
        </div>

        <div className="header-actions">
          {/* Cloud Synchronization Badge */}
          {renderSyncBadge()}

          {/* Google Auth or User Profile */}
          {isAuthLoading ? (
            <div className="user-avatar-skeleton" title="Checking login status..." />
          ) : user ? (
            <div className="user-profile-menu" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="user-avatar-btn"
                title={`${user.displayName || user.email} (Connected)`}
                aria-label="User Account Menu"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="user-avatar-img" />
                ) : (
                  <div className="user-avatar-initials">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {isUserMenuOpen && (
                <div className="user-dropdown-popover">
                  <div className="user-popover-header">
                    <p className="user-name">{user.displayName || 'Google Account'}</p>
                    <p className="user-email">{user.email}</p>
                  </div>
                  <div className="user-popover-divider"></div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="user-popover-item danger"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={isFirebaseConfigured ? onSignIn : onOpenConfigModal}
              className="google-signin-btn"
              title="Sign in with Google to sync"
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="16" height="16">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="signin-btn-text">Sign In</span>
            </button>
          )}

          <button
            onClick={onOpenDataModal}
            className="icon-btn"
            title="Backup, Export & Data Management"
            aria-label="Backup and Data"
          >
            <Database size={19} />
          </button>

          <button
            onClick={onToggleTheme}
            className="icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={19} className="sun-icon" /> : <Moon size={19} className="moon-icon" />}
          </button>
        </div>
      </div>
    </header>
  );
}
