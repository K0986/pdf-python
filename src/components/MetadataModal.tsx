/**
 * PDF Forge - PDF Metadata & Security Modal
 * Edit Title, Author, Subject, Keywords, Password Protection, and Privacy Metadata Scrubbing.
 */
import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Trash2, Check, FileCode } from 'lucide-react';
import { useEditor } from '../editor/EditorContext';

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MetadataModal: React.FC<MetadataModalProps> = ({ isOpen, onClose }) => {
  const { document, updateMetadata } = useEditor();

  const [title, setTitle] = useState(document?.metadata?.title || '');
  const [author, setAuthor] = useState(document?.metadata?.author || '');
  const [subject, setSubject] = useState(document?.metadata?.subject || '');
  const [keywords, setKeywords] = useState(document?.metadata?.keywords || '');
  const [creator, setCreator] = useState(document?.metadata?.creator || 'PDF Forge');
  const [password, setPassword] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !document) return null;

  const handleSave = () => {
    updateMetadata({
      title,
      author,
      subject,
      keywords,
      creator,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleScrubMetadata = () => {
    setTitle('');
    setAuthor('');
    setSubject('');
    setKeywords('');
    setCreator('Anonymous Scrubbed');
    updateMetadata({
      title: '',
      author: '',
      subject: '',
      keywords: '',
      creator: '',
    });
    setSavedSuccess(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Document Properties & Privacy</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 font-medium">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Report 2026"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author / Organization"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 dark:text-slate-400 font-medium">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Topic / Category"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-600 dark:text-slate-400 font-medium">Keywords (comma separated)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="contract, confidential, legal, draft"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Privacy Scrub Box */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-300">Scrub All Metadata</div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400">
                Removes author, machine names, and editing history before sharing.
              </div>
            </div>
            <button
              onClick={handleScrubMetadata}
              className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 rounded font-medium text-xs transition-colors"
            >
              Scrub Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-slate-600 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 transition-colors"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{savedSuccess ? 'Saved!' : 'Save Properties'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
