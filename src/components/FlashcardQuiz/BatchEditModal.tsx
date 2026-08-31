import React, { useState } from "react";
import { Deck, Flashcard } from "../../types";
import {
  CheckSquare,
  Square,
  Trash2,
  FolderInput,
  Plus,
  FolderPlus,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BatchEditModalProps {
  deck: Deck;
  availableDecks: Deck[];
  isOpen: boolean;
  onClose: () => void;
  onBatchDelete: (deckId: string, cardIds: string[]) => void;
  onBatchMove: (
    fromDeckId: string,
    targetDeckIdOrNew: string,
    newFolderName: string,
    cardIds: string[]
  ) => void;
  onAddManualCard?: (deckId: string, question: string, answer: string, category: string) => void;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  deck,
  availableDecks,
  isOpen,
  onClose,
  onBatchDelete,
  onBatchMove,
  onAddManualCard,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [moveDestinationType, setMoveDestinationType] = useState<"new" | "existing">("new");
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedExistingDeckId, setSelectedExistingDeckId] = useState<string>("");
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // New card manual inline creation
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCardQuestion, setNewCardQuestion] = useState("");
  const [newCardAnswer, setNewCardAnswer] = useState("");
  const [newCardCategory, setNewCardCategory] = useState("General");

  if (!isOpen) return null;

  const totalCards = deck.cards.length;
  const isAllSelected = totalCards > 0 && selectedCardIds.length === totalCards;

  const toggleSelectCard = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedCardIds([]);
    } else {
      setSelectedCardIds(deck.cards.map((c) => c.id));
    }
  };

  const triggerNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => {
      setStatusNotification(null);
    }, 2800);
  };

  const handleDeleteSelected = () => {
    if (selectedCardIds.length === 0) return;
    const count = selectedCardIds.length;
    onBatchDelete(deck.id, selectedCardIds);
    setSelectedCardIds([]);
    triggerNotification(`Deleted ${count} card${count > 1 ? "s" : ""} successfully.`);
  };

  const handleExecuteMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCardIds.length === 0) return;

    if (moveDestinationType === "new") {
      const folderName = newFolderName.trim() || "New Study Folder";
      onBatchMove(deck.id, "new", folderName, selectedCardIds);
      triggerNotification(
        `Moved ${selectedCardIds.length} card${selectedCardIds.length > 1 ? "s" : ""} to new folder: "${folderName}"`
      );
    } else {
      if (!selectedExistingDeckId) return;
      const targetDeck = availableDecks.find((d) => d.id === selectedExistingDeckId);
      onBatchMove(deck.id, selectedExistingDeckId, "", selectedCardIds);
      triggerNotification(
        `Moved ${selectedCardIds.length} card${selectedCardIds.length > 1 ? "s" : ""} to "${targetDeck?.title || "deck"}"`
      );
    }

    setSelectedCardIds([]);
    setShowMoveDialog(false);
    setNewFolderName("");
  };

  const handleCreateNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardQuestion.trim() || !newCardAnswer.trim() || !onAddManualCard) return;

    onAddManualCard(deck.id, newCardQuestion.trim(), newCardAnswer.trim(), newCardCategory.trim());
    setNewCardQuestion("");
    setNewCardAnswer("");
    setShowAddCardForm(false);
    triggerNotification("New flashcard created successfully.");
  };

  const otherDecks = availableDecks.filter((d) => d.id !== deck.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                Deck Manager
              </span>
              <span className="text-xs font-mono text-slate-400">
                {deck.cards.length} Total Cards
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              Batch Edit: {deck.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Toast */}
        <AnimatePresence>
          {statusNotification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 text-emerald-800 border-b border-emerald-200 px-6 py-2 text-xs font-semibold flex items-center gap-2"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{statusNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Toolbar */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAllToggle}
              disabled={deck.cards.length === 0}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 disabled:opacity-40 cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-indigo-600" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>{isAllSelected ? "Deselect All" : "Select All Cards"}</span>
            </button>

            {selectedCardIds.length > 0 && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {selectedCardIds.length} Selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Move selected cards button */}
            <button
              id="btn-batch-move"
              onClick={() => setShowMoveDialog(true)}
              disabled={selectedCardIds.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider shadow-sm shadow-indigo-100 transition-all cursor-pointer"
            >
              <FolderInput className="h-3.5 w-3.5" />
              <span>Move ({selectedCardIds.length})</span>
            </button>

            {/* Delete selected cards button */}
            <button
              id="btn-batch-delete"
              onClick={handleDeleteSelected}
              disabled={selectedCardIds.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-40 border border-red-200 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete ({selectedCardIds.length})</span>
            </button>

            {/* Quick add single card */}
            <button
              onClick={() => setShowAddCardForm(!showAddCardForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        {/* Move to Folder Inline Dialog Sub-Panel */}
        <AnimatePresence>
          {showMoveDialog && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 bg-indigo-50/70 border-b border-indigo-100"
            >
              <form onSubmit={handleExecuteMove} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-900 flex items-center gap-1.5">
                    <FolderPlus className="h-4 w-4 text-indigo-600" />
                    <span>Move {selectedCardIds.length} Selected Cards</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMoveDialog(false)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex gap-4 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="destType"
                      checked={moveDestinationType === "new"}
                      onChange={() => setMoveDestinationType("new")}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Create New Custom Folder / Deck
                    </span>
                  </label>

                  {otherDecks.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="destType"
                        checked={moveDestinationType === "existing"}
                        onChange={() => setMoveDestinationType("existing")}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">
                        Move to Existing Deck
                      </span>
                    </label>
                  )}
                </div>

                {moveDestinationType === "new" ? (
                  <div className="flex gap-2">
                    <input
                      id="new-folder-name-input"
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter new folder / deck title (e.g. 'Exam Prep - Biology')..."
                      className="flex-1 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Confirm Move
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedExistingDeckId}
                      onChange={(e) => setSelectedExistingDeckId(e.target.value)}
                      className="flex-1 rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                      required
                    >
                      <option value="">Select target deck...</option>
                      {otherDecks.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({d.cards.length} cards)
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedExistingDeckId}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Confirm Move
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Card Form Sub-Panel */}
        <AnimatePresence>
          {showAddCardForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 bg-slate-50 border-b border-slate-200"
            >
              <form onSubmit={handleCreateNewCard} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    Add New Card to {deck.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCardForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newCardQuestion}
                    onChange={(e) => setNewCardQuestion(e.target.value)}
                    placeholder="Question / Prompt..."
                    className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={newCardCategory}
                    onChange={(e) => setNewCardCategory(e.target.value)}
                    placeholder="Category / Subject..."
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 outline-none"
                  />
                </div>

                <textarea
                  rows={2}
                  value={newCardAnswer}
                  onChange={(e) => setNewCardAnswer(e.target.value)}
                  placeholder="Authoritative reference answer..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 outline-none resize-none"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Save Flashcard
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card List with Checkboxes */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100 max-h-[460px]">
          {deck.cards.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Layers className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No cards in this deck</p>
              <p className="text-xs text-slate-400 mt-1">
                Save answers from Ask Anything AI or click "Add Card" above to add flashcards.
              </p>
            </div>
          ) : (
            deck.cards.map((card, index) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => toggleSelectCard(card.id)}
                  className={`py-3.5 px-3 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/60 border border-indigo-200/80"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCard(card.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        #{index + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {card.category || "General"}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                      {card.question}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {card.referenceAnswer}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedCardIds.length} of {deck.cards.length} card
            {deck.cards.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
