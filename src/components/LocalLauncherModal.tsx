/**
 * PDF Forge - Local Backend Launcher & Architecture Hub
 * Details on the Python + Flask + PyMuPDF engine, command launcher, and local security.
 */
import React, { useState, useEffect } from 'react';
import { X, Terminal, CheckCircle2, Server, Shield, FileCode2, Copy, Check } from 'lucide-react';

interface LocalLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalLauncherModal: React.FC<LocalLauncherModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('offline');

  useEffect(() => {
    if (!isOpen) return;
    // Check if local Flask backend is responding on port 5000
    fetch('http://localhost:5000/api/health', { mode: 'cors' })
      .then((res) => {
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('offline');
      })
      .catch(() => setBackendStatus('offline'));
  }, [isOpen]);

  if (!isOpen) return null;

  const copyBashScript = () => {
    navigator.clipboard.writeText(`python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
            <Terminal className="w-4 h-4 text-emerald-500" />
            <span>PDF Forge Engine — Local Python Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Architecture Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Python + Flask + PyMuPDF Core
                </div>
                <div className="text-[11px] text-slate-500">
                  Target Port: <code className="font-mono text-indigo-600 dark:text-indigo-400">http://localhost:5000</code>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ready & Packaged</span>
            </div>
          </div>

          {/* Privacy & Zero-Cloud Guarantee */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-300">
            <Shield className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="leading-relaxed">
              <strong>Private & Local:</strong> PDF Forge is configured to process all PDF files directly on your local device. No documents or sensitive information are ever dispatched to external cloud servers.
            </div>
          </div>

          {/* Quick Start Commands */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-semibold">
              <span>Local Launch Commands:</span>
              <button
                onClick={copyBashScript}
                className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 text-slate-100 p-3.5 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
{`# 1. Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate

# 2. Install PyMuPDF and dependencies
pip install -r requirements.txt

# 3. Launch PDF Forge
python run.py`}
            </pre>
          </div>

          {/* Project Structure Reference */}
          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-300">Project Directory Layout:</div>
            <pre className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-lg font-mono text-[10px] text-slate-700 dark:text-slate-300 leading-normal overflow-x-auto">
{`pdf-forge/
├── backend/
│   ├── app.py                # Flask application factory
│   ├── config.py             # Local paths & size limits
│   ├── routes/               # Modular REST endpoints (pdf, pages, editing, export)
│   ├── services/             # PyMuPDF, Rendering, Text, Redaction, Security
│   └── utils/                # File sanitization & temp storage
├── tests/                    # Unit tests for PyMuPDF service
├── requirements.txt          # PyMuPDF, Flask, Pillow, pypdf
├── run.py                    # One-click launcher
└── README.md                 # Complete manual`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
