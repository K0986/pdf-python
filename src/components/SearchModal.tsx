/**
 * PDF Forge - Fast Document Search & Batch Redaction Modal
 * Search whole document, jump to matches, and batch redact or highlight sensitive terms.
 */
import React, { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown, ShieldAlert, Highlighter } from 'lucide-react';
import { useEditor } from '../editor/EditorContext';
import { pdfRenderer } from '../services/pdfRenderer';
import { SearchResult, RedactionObject, AnnotationObject } from '../types/pdf';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const {
    document,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    nextSearchResult,
    prevSearchResult,
    addObject,
  } = useEditor();

  const [matchCase, setMatchCase] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!document || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const query = matchCase ? searchQuery : searchQuery.toLowerCase();

    for (let p = 0; p < document.pages.length; p++) {
      const pageNum = document.pages[p].pageNumber;
      const spans = await pdfRenderer.extractPageTextSpans(pageNum);

      for (const span of spans) {
        const text = matchCase ? span.text : span.text.toLowerCase();
        if (text.includes(query)) {
          results.push({
            pageNumber: p + 1,
            text: span.text,
            rect: span.bbox,
            index: results.length,
          });
        }
      }
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);
    setIsSearching(false);
  };

  const handleRedactAllMatches = () => {
    if (!document || searchResults.length === 0) return;
    searchResults.forEach((res) => {
      const pageIndex = res.pageNumber - 1;
      addObject(pageIndex, {
        id: `redact_search_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'redaction',
        x: res.rect[0] - 2,
        y: res.rect[1] - 2,
        width: res.rect[2] - res.rect[0] + 4,
        height: res.rect[3] - res.rect[1] + 4,
        overlayColor: '#000000',
        labelText: '[REDACTED]',
        applied: true,
      } as RedactionObject);
    });
    setSearchResults([]);
    onClose();
  };

  const handleHighlightAllMatches = () => {
    if (!document || searchResults.length === 0) return;
    searchResults.forEach((res) => {
      const pageIndex = res.pageNumber - 1;
      addObject(pageIndex, {
        id: `annot_search_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'annotation',
        subtype: 'highlight',
        x: res.rect[0],
        y: res.rect[1],
        width: res.rect[2] - res.rect[0],
        height: res.rect[3] - res.rect[1],
        color: '#facc15',
        opacity: 0.35,
      } as AnnotationObject);
    });
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transition-colors">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
            <Search className="w-4 h-4 text-indigo-500" />
            <span>Search Document</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Find word or phrase (e.g. Tax ID, Confidential, Alex Mercer)..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-24 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors"
            >
              {isSearching ? 'Searching...' : 'Find'}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded accent-indigo-600"
              />
              <span>Match Case</span>
            </label>

            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span>
                  {currentSearchIndex + 1} of {searchResults.length} matches
                </span>
                <div className="flex items-center">
                  <button
                    onClick={prevSearchResult}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                    title="Previous Match"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={nextSearchResult}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                    title="Next Match"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batch Operations */}
        {searchResults.length > 0 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400">Batch Actions:</span>
            <div className="flex gap-2">
              <button
                onClick={handleHighlightAllMatches}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium transition-colors"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>Highlight All</span>
              </button>
              <button
                onClick={handleRedactAllMatches}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Redact All Matches</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
