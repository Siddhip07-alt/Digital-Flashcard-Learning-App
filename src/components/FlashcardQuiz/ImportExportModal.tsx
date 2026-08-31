import React, { useState, useRef } from "react";
import { Deck, Flashcard } from "../../types";
import {
  Upload,
  Download,
  FileJson,
  X,
  Check,
  AlertCircle,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  decks: Deck[];
  onImportDecks: (importedDecks: Deck[], mode: "merge" | "replace") => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  decks,
  onImportDecks,
}) => {
  const [activeTab, setActiveTab] = useState<"import" | "export">("export");
  const [dragActive, setDragActive] = useState(false);
  const [parsedDecks, setParsedDecks] = useState<Deck[] | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [parseError, setParseError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedDeckIdsToExport, setSelectedDeckIdsToExport] = useState<string[]>(() =>
    decks.map((d) => d.id)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle Export
  const handleExport = () => {
    const decksToExport = decks.filter((d) => selectedDeckIdsToExport.includes(d.id));
    if (decksToExport.length === 0) return;

    const totalCards = decksToExport.reduce((acc, d) => acc + d.cards.length, 0);
    const exportData = {
      app: "Dual Learning Studio",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      deckCount: decksToExport.length,
      totalCards,
      decks: decksToExport,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `dual-learning-decks-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setStatusMsg(`Successfully exported ${decksToExport.length} decks (${totalCards} cards)!`);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Toggle selection for export
  const toggleExportDeck = (id: string) => {
    setSelectedDeckIdsToExport((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllExport = () => {
    if (selectedDeckIdsToExport.length === decks.length) {
      setSelectedDeckIdsToExport([]);
    } else {
      setSelectedDeckIdsToExport(decks.map((d) => d.id));
    }
  };

  // File parsing logic
  const parseJsonFile = (file: File) => {
    setParseError(null);
    setParsedDecks(null);

    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setParseError("Please upload a valid JSON file (.json).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);

        let extractedDecks: Deck[] = [];

        if (Array.isArray(json)) {
          extractedDecks = json;
        } else if (json.decks && Array.isArray(json.decks)) {
          extractedDecks = json.decks;
        } else if (json.cards && Array.isArray(json.cards) && json.title) {
          // Single deck file format
          extractedDecks = [
            {
              id: json.id || `imported-${Date.now()}`,
              title: json.title,
              description: json.description || "Imported flashcard deck",
              category: json.category || "Imported",
              difficulty: json.difficulty || "Intermediate",
              iconName: json.iconName || "Layers",
              accentColor: json.accentColor || "from-indigo-600 to-violet-600",
              cards: json.cards,
            },
          ];
        } else {
          throw new Error("Invalid file structure. Expected an array of decks or a deck object.");
        }

        // Validate cards structure in each deck
        const sanitizedDecks: Deck[] = extractedDecks.map((d, dIdx) => {
          const cards: Flashcard[] = Array.isArray(d.cards)
            ? d.cards.map((c: any, cIdx: number) => ({
                id: c.id || `imp-card-${dIdx}-${cIdx}-${Date.now()}`,
                question: String(c.question || "Untitled Question"),
                referenceAnswer: String(c.referenceAnswer || c.answer || "No answer provided."),
                hint: c.hint || "Review core concept.",
                category: c.category || d.category || "General",
              }))
            : [];

          return {
            id: d.id || `imported-deck-${dIdx}-${Date.now()}`,
            title: d.title || `Imported Deck ${dIdx + 1}`,
            description: d.description || `Imported deck with ${cards.length} cards`,
            category: d.category || "Imported",
            difficulty: d.difficulty || "Intermediate",
            iconName: d.iconName || "Layers",
            accentColor: d.accentColor || "from-indigo-600 to-violet-600",
            cards,
          };
        });

        if (sanitizedDecks.length === 0) {
          throw new Error("No decks with flashcards found in this file.");
        }

        setParsedDecks(sanitizedDecks);
      } catch (err: any) {
        console.error(err);
        setParseError(err.message || "Failed to parse JSON file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      parseJsonFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseJsonFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!parsedDecks || parsedDecks.length === 0) return;
    onImportDecks(parsedDecks, importMode);
    setStatusMsg(
      `Successfully imported ${parsedDecks.length} deck${parsedDecks.length > 1 ? "s" : ""}!`
    );
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Deck Data Management</h2>
              <p className="text-xs text-slate-500">Backup, export, or restore your flashcards</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50/30 px-6 pt-3">
          <button
            id="tab-export-decks"
            onClick={() => setActiveTab("export")}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "export"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Export JSON ({decks.length} Decks)</span>
          </button>

          <button
            id="tab-import-decks"
            onClick={() => setActiveTab("import")}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "import"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Import & Restore Decks</span>
          </button>
        </div>

        {/* Status Toast */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-6 py-2 text-xs font-semibold flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{statusMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "export" ? (
            /* Export View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Decks to Export</h3>
                  <p className="text-xs text-slate-500">
                    Download complete deck cards, hints, and references in a structured JSON file.
                  </p>
                </div>
                <button
                  onClick={handleSelectAllExport}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  {selectedDeckIdsToExport.length === decks.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {/* Deck List for export selection */}
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                {decks.map((deck) => {
                  const isSelected = selectedDeckIdsToExport.includes(deck.id);
                  return (
                    <div
                      key={deck.id}
                      onClick={() => toggleExportDeck(deck.id)}
                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? "bg-indigo-50/80" : "hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExportDeck(deck.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{deck.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {deck.category} • {deck.cards.length} cards
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                        {deck.difficulty}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="btn-confirm-export-json"
                  onClick={handleExport}
                  disabled={selectedDeckIdsToExport.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100 transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download JSON ({selectedDeckIdsToExport.length} Decks)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Import View (supports Drag-and-Drop & Click File Selection) */
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  dragActive
                    ? "border-indigo-600 bg-indigo-50/70 ring-4 ring-indigo-100"
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleManualFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-1">
                  <Upload className="h-6 w-6" />
                </div>

                <div className="text-sm font-bold text-slate-800">
                  Drag and drop your deck JSON file here
                </div>
                <div className="text-xs text-slate-500">
                  or <span className="text-indigo-600 font-semibold underline">browse file from your computer</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports Dual Learning Studio export format or custom JSON decks
                </div>
              </div>

              {/* Error state */}
              {parseError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Preview parsed decks */}
              {parsedDecks && (
                <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-900 flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Ready to Import: {parsedDecks.length} Deck{parsedDecks.length > 1 ? "s" : ""}</span>
                    </span>
                    <span className="text-xs font-mono text-indigo-700 font-semibold">
                      {parsedDecks.reduce((acc, d) => acc + d.cards.length, 0)} Total Cards
                    </span>
                  </div>

                  <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1">
                    {parsedDecks.map((deck, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{deck.title}</span>
                          <span className="text-slate-500 ml-2">({deck.category})</span>
                        </div>
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {deck.cards.length} cards
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Merge vs Replace Mode */}
                  <div className="pt-2 border-t border-indigo-100 flex flex-wrap gap-4 text-xs font-medium">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === "merge"}
                        onChange={() => setImportMode("merge")}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">
                        Merge with existing decks
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === "replace"}
                        onChange={() => setImportMode("replace")}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">
                        Replace all existing decks
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      id="btn-confirm-import-json"
                      onClick={handleExecuteImport}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100 cursor-pointer"
                    >
                      Confirm Import ({parsedDecks.length} Decks)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
