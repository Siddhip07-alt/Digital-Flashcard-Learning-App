import React, { useState, useMemo } from "react";
import { Deck } from "../../types";
import {
  Cpu,
  Dna,
  Landmark,
  Sparkles,
  Layers,
  ArrowRight,
  Loader2,
  Wand2,
  SlidersHorizontal,
  Search,
  X,
  BookOpen,
  Download,
  Upload,
} from "lucide-react";

interface DeckSelectorProps {
  decks: Deck[];
  onSelectDeck: (deck: Deck) => void;
  onAddCustomDeck: (deck: Deck) => void;
  onOpenBatchEdit: (deck: Deck) => void;
  onOpenImportExport: (tab?: "import" | "export") => void;
}

export const DeckSelector: React.FC<DeckSelectorProps> = ({
  decks,
  onSelectDeck,
  onAddCustomDeck,
  onOpenBatchEdit,
  onOpenImportExport,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showAiModal, setShowAiModal] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const getDeckIcon = (iconName: string) => {
    switch (iconName) {
      case "Cpu":
        return <Cpu className="h-5 w-5" />;
      case "Dna":
        return <Dna className="h-5 w-5" />;
      case "Landmark":
        return <Landmark className="h-5 w-5" />;
      case "Sparkles":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Layers className="h-5 w-5" />;
    }
  };

  // Derive unique categories for filter pills
  const categories = useMemo(() => {
    const cats = Array.from(new Set(decks.map((d) => d.category || "General")));
    return ["All", ...cats];
  }, [decks]);

  // Filter decks by title, category, or description
  const filteredDecks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return decks.filter((deck) => {
      const matchesCategory =
        selectedCategory === "All" || deck.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const titleMatch = deck.title.toLowerCase().includes(query);
      const categoryMatch = (deck.category || "").toLowerCase().includes(query);
      const descMatch = (deck.description || "").toLowerCase().includes(query);
      return titleMatch || categoryMatch || descMatch;
    });
  }, [decks, searchQuery, selectedCategory]);

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/gemini/generate-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput.trim(), cardCount: 6 }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate custom deck.");
      }

      const data = await res.json();
      const newDeck: Deck = {
        id: `custom-${Date.now()}`,
        title: data.title || topicInput,
        description: data.description || `Custom AI-generated deck on ${topicInput}`,
        category: "Custom Topic",
        difficulty: (data.difficulty as any) || "Intermediate",
        iconName: "Sparkles",
        accentColor: "from-indigo-600 to-violet-600",
        cards: data.cards.map((c: any, index: number) => ({
          id: `custom-card-${index}-${Date.now()}`,
          question: c.question,
          referenceAnswer: c.referenceAnswer,
          hint: c.hint,
          category: c.category || "General",
        })),
      };

      onAddCustomDeck(newDeck);
      setShowAiModal(false);
      setTopicInput("");
      onSelectDeck(newDeck);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || "Could not generate flashcards. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Intro Header & Action Toolbar */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Curriculums & Flashcard Decks
          </h2>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Choose a Study Topic
          </h1>
        </div>

        {/* Action Buttons: Import, Export, AI Generator */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-import-decks"
            onClick={() => onOpenImportExport("import")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            title="Import decks from JSON file"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            <span>Import</span>
          </button>

          <button
            id="btn-export-decks"
            onClick={() => onOpenImportExport("export")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-xs hover:border-slate-300 transition-all cursor-pointer"
            title="Export decks to JSON file"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            <span>Export</span>
          </button>

          <button
            id="btn-open-ai-generator"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-100 transition-all cursor-pointer shrink-0"
          >
            <Wand2 className="h-4 w-4" />
            <span>Generate Deck with AI</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Category Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search input field */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="deck-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search decks by title or category (e.g. 'Biology', 'AI', 'History')..."
            className="w-full rounded-2xl bg-slate-50 border border-slate-200 py-3 pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Pills & Count Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredDecks.length} of {decks.length} deck
            {decks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Deck Cards Grid or Empty State */}
      {filteredDecks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No decks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            No flashcard decks match your search for "{searchQuery}". Try a different keyword or create one with AI.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Clear Search
            </button>
            <button
              onClick={() => {
                setTopicInput(searchQuery);
                setShowAiModal(true);
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Generate "{searchQuery || "Deck"}" with AI</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDecks.map((deck) => {
            const isSavedDeck =
              deck.id === "user-saved-deck" || deck.title === "My Saved AI Flashcards";

            return (
              <div
                key={deck.id}
                id={`deck-card-${deck.id}`}
                className={`bg-white rounded-3xl border shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-200 ${
                  isSavedDeck
                    ? "border-indigo-300 ring-2 ring-indigo-500/10"
                    : "border-slate-200 hover:border-indigo-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
                        isSavedDeck
                          ? "bg-indigo-600 text-white shadow-indigo-100"
                          : "bg-slate-900 text-white"
                      }`}
                    >
                      {getDeckIcon(deck.iconName)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isSavedDeck && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                          Saved Notes
                        </span>
                      )}
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-semibold border border-slate-200">
                        {deck.cards.length} cards
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                    {deck.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                    {deck.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {deck.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    id={`btn-start-deck-${deck.id}`}
                    onClick={() => onSelectDeck(deck)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors cursor-pointer"
                  >
                    <span>Start Quiz</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  {/* Batch Edit Option */}
                  <button
                    id={`btn-batch-edit-${deck.id}`}
                    onClick={() => onOpenBatchEdit(deck)}
                    title={`Batch Edit ${deck.title}`}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      isSavedDeck
                        ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Batch Edit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Deck Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wand2 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Deck Generator
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateDeck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Subject or Topic
                </label>
                <input
                  id="ai-topic-input"
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Organic Chemistry, Microeconomics, World Wars..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  autoFocus
                  required
                />
              </div>

              {genError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                  {genError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !topicInput.trim()}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-100 inline-flex items-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Create Deck</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
