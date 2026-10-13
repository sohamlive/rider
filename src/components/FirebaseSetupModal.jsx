import React, { useState } from 'react';
import { X, Cloud, Check, Copy, ExternalLink, ShieldCheck, Wifi } from 'lucide-react';

export function FirebaseSetupModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const envTemplate = `# .env.local
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card config-modal">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge cyan">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="modal-title">Connect Cloud Database</h2>
              <p className="modal-subtitle">Sync your scooter logs across phone & desktop in real-time</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body setup-modal-body">
          <div className="setup-steps-list">
            <div className="setup-step-item">
              <span className="step-number">1</span>
              <div>
                <strong>Create a free Firebase Project</strong>
                <p>
                  Go to{' '}
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="link-highlight"
                  >
                    console.firebase.google.com <ExternalLink size={12} className="inline-icon" />
                  </a>{' '}
                  and click <em>Add Project</em> (100% free Spark plan).
                </p>
              </div>
            </div>

            <div className="setup-step-item">
              <span className="step-number">2</span>
              <div>
                <strong>Enable Google Auth & Firestore</strong>
                <p>
                  In sidebar: <strong>Authentication</strong> &rarr; <em>Sign-in method</em> &rarr; Enable <strong>Google</strong>.
                  Then <strong>Firestore Database</strong> &rarr; <em>Create database</em>.
                </p>
              </div>
            </div>

            <div className="setup-step-item">
              <span className="step-number">3</span>
              <div>
                <strong>Register Web App & Copy Keys</strong>
                <p>
                  Click Project Settings (Gear icon) &rarr; Web (`&lt;/&gt;`) &rarr; copy the config keys into a <code>.env.local</code> file in this project root:
                </p>
              </div>
            </div>

            <div className="setup-step-item">
              <span className="step-number">4</span>
              <div>
                <strong>Authorize Your Deployed Domain</strong>
                <p>
                  In sidebar: <strong>Authentication</strong> &rarr; <em>Settings</em> tab &rarr; <strong>Authorized domains</strong> &rarr; click <em>Add domain</em> and add your custom domain (e.g. <code>{typeof window !== 'undefined' ? window.location.hostname : 'play.sidelower.in'}</code>).
                </p>
              </div>
            </div>
          </div>

          <div className="code-snippet-box">
            <div className="code-snippet-header">
              <span>.env.local template</span>
              <button onClick={handleCopy} className="btn-copy">
                {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="code-content">{envTemplate}</pre>
          </div>

          <div className="feature-badges-row">
            <div className="feature-badge">
              <Wifi size={14} className="text-cyan" />
              <span>Offline-first (IndexedDB)</span>
            </div>
            <div className="feature-badge">
              <ShieldCheck size={14} className="text-emerald" />
              <span>Your private Google Account only</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-modal-primary">
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
