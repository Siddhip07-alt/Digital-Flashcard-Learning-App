/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LearningMode, Deck, Flashcard, QuizSummary } from "./types";
import { DEFAULT_DECKS } from "./data/defaultDecks";
import { Header } from "./components/Header";
import { DeckSelector } from "./components/FlashcardQuiz/DeckSelector";
import { QuizRunner } from "./components/FlashcardQuiz/QuizRunner";
import { QuizScoreSummary } from "./components/FlashcardQuiz/QuizScoreSummary";
import { AskAnythingView } from "./components/AskAnything/AskAnythingView";
import { BatchEditModal } from "./components/FlashcardQuiz/BatchEditModal";
import { ImportExportModal } from "./components/FlashcardQuiz/ImportExportModal";

export default function App() {
  const [currentMode, setCurrentMode] = useState<LearningMode>("split");
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem("dual_learning_decks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_DECKS;
      }
    }
    return DEFAULT_DECKS;
  });

  const [activeDeck, setActiveDeck] = useState<Deck | null>(decks[0] || DEFAULT_DECKS[0]);
  const [cardsToRun, setCardsToRun] = useState<Flashcard[] | undefined>(undefined);
  const [quizSummary, setQuizSummary] = useState<QuizSummary | null>(null);
  const [batchEditDeck, setBatchEditDeck] = useState<Deck | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Global study metrics
  const [streakCount, setStreakCount] = useState<number>(() => {
    return Number(localStorage.getItem("dual_learning_streak") || "12");
  });
  const [totalAnswered, setTotalAnswered] = useState<number>(() => {
    return Number(localStorage.getItem("dual_learning_total_answered") || "14");
  });
  const [totalCorrect, setTotalCorrect] = useState<number>(() => {
    return Number(localStorage.getItem("dual_learning_total_correct") || "11");
  });

  // Cross-mode context
  const [askInitialQuestion, setAskInitialQuestion] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("dual_learning_decks", JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    localStorage.setItem("dual_learning_streak", streakCount.toString());
    localStorage.setItem("dual_learning_total_answered", totalAnswered.toString());
    localStorage.setItem("dual_learning_total_correct", totalCorrect.toString());
  }, [streakCount, totalAnswered, totalCorrect]);

  const handleSelectDeck = (deck: Deck) => {
    setActiveDeck(deck);
    setCardsToRun(undefined);
    setQuizSummary(null);
  };

  const handleAddCustomDeck = (newDeck: Deck) => {
    setDecks((prev) => [newDeck, ...prev]);
  };

  const handleFinishQuiz = (summary: QuizSummary) => {
    setQuizSummary(summary);
    setTotalAnswered((prev) => prev + summary.totalCards);
    setTotalCorrect((prev) => prev + summary.correctCount);
    if (summary.correctCount > 0) {
      setStreakCount((prev) => prev + 1);
    }
  };

  const handleRetryAll = () => {
    setCardsToRun(undefined);
    setQuizSummary(null);
  };

  const handleRetryMissed = (missedCardIds: string[]) => {
    if (!activeDeck) return;
    const missedCards = activeDeck.cards.filter((c) => missedCardIds.includes(c.id));
    setCardsToRun(missedCards);
    setQuizSummary(null);
  };

  const handleSelectNewDeck = () => {
    setActiveDeck(null);
    setCardsToRun(undefined);
    setQuizSummary(null);
  };

  const handleAskAiAboutQuestion = (question: string) => {
    setAskInitialQuestion(question);
    if (currentMode === "flashcards") {
      setCurrentMode("split");
    }
  };

  const handleOpenBatchEdit = (deck: Deck) => {
    const freshDeck = decks.find((d) => d.id === deck.id) || deck;
    setBatchEditDeck(freshDeck);
  };

  const handleCloseBatchEdit = () => {
    setBatchEditDeck(null);
  };

  // Import / Export handler
  const handleOpenImportExport = (tab?: "import" | "export") => {
    setIsImportExportOpen(true);
  };

  const handleImportDecks = (importedDecks: Deck[], mode: "merge" | "replace") => {
    if (mode === "replace") {
      setDecks(importedDecks);
      if (importedDecks.length > 0) {
        setActiveDeck(importedDecks[0]);
      } else {
        setActiveDeck(null);
      }
    } else {
      // Merge mode
      setDecks((prevDecks) => {
        const updated = [...prevDecks];
        for (const imp of importedDecks) {
          const existingIndex = updated.findIndex((d) => d.id === imp.id || d.title.toLowerCase() === imp.title.toLowerCase());
          if (existingIndex >= 0) {
            // Append cards to existing deck
            const existing = updated[existingIndex];
            const existingCardIds = new Set(existing.cards.map((c) => c.id));
            const newCards = imp.cards.filter((c) => !existingCardIds.has(c.id));
            updated[existingIndex] = {
              ...existing,
              cards: [...existing.cards, ...newCards],
            };
          } else {
            updated.unshift(imp);
          }
        }
        return updated;
      });
    }
  };

  // Batch Delete handler
  const handleBatchDelete = (deckId: string, cardIdsToDelete: string[]) => {
    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id === deckId) {
          const updatedCards = d.cards.filter((c) => !cardIdsToDelete.includes(c.id));
          const updatedDeck = { ...d, cards: updatedCards };
          if (activeDeck?.id === deckId) {
            setActiveDeck(updatedDeck);
          }
          if (batchEditDeck?.id === deckId) {
            setBatchEditDeck(updatedDeck);
          }
          return updatedDeck;
        }
        return d;
      })
    );
  };

  // Batch Move handler (move to new folder or existing deck)
  const handleBatchMove = (
    fromDeckId: string,
    targetDeckIdOrNew: string,
    newFolderName: string,
    cardIdsToMove: string[]
  ) => {
    setDecks((prevDecks) => {
      const sourceDeck = prevDecks.find((d) => d.id === fromDeckId);
      if (!sourceDeck) return prevDecks;

      const movingCards = sourceDeck.cards.filter((c) => cardIdsToMove.includes(c.id));
      const remainingCards = sourceDeck.cards.filter((c) => !cardIdsToMove.includes(c.id));

      if (targetDeckIdOrNew === "new") {
        const newDeck: Deck = {
          id: `custom-folder-${Date.now()}`,
          title: newFolderName || "Custom Study Folder",
          description: `Folder moved from ${sourceDeck.title}`,
          category: "Custom Folder",
          difficulty: "Intermediate",
          iconName: "Layers",
          accentColor: "from-indigo-600 to-violet-600",
          cards: movingCards,
        };

        const updatedDecks = prevDecks.map((d) =>
          d.id === fromDeckId ? { ...d, cards: remainingCards } : d
        );

        if (activeDeck?.id === fromDeckId) {
          setActiveDeck({ ...sourceDeck, cards: remainingCards });
        }
        if (batchEditDeck?.id === fromDeckId) {
          setBatchEditDeck({ ...sourceDeck, cards: remainingCards });
        }

        return [newDeck, ...updatedDecks];
      } else {
        // Move to existing deck
        const updatedDecks = prevDecks.map((d) => {
          if (d.id === fromDeckId) {
            return { ...d, cards: remainingCards };
          }
          if (d.id === targetDeckIdOrNew) {
            return { ...d, cards: [...d.cards, ...movingCards] };
          }
          return d;
        });

        if (activeDeck?.id === fromDeckId) {
          setActiveDeck({ ...sourceDeck, cards: remainingCards });
        }
        if (batchEditDeck?.id === fromDeckId) {
          setBatchEditDeck({ ...sourceDeck, cards: remainingCards });
        }

        return updatedDecks;
      }
    });
  };

  const handleAddManualCard = (
    deckId: string,
    question: string,
    answer: string,
    category: string
  ) => {
    const newCard: Flashcard = {
      id: `manual-card-${Date.now()}`,
      question,
      referenceAnswer: answer,
      category: category || "General",
      hint: "Review custom note.",
    };

    setDecks((prevDecks) =>
      prevDecks.map((d) => {
        if (d.id === deckId) {
          const updatedDeck = { ...d, cards: [newCard, ...d.cards] };
          if (activeDeck?.id === deckId) {
            setActiveDeck(updatedDeck);
          }
          if (batchEditDeck?.id === deckId) {
            setBatchEditDeck(updatedDeck);
          }
          return updatedDeck;
        }
        return d;
      })
    );
  };

  const handleAddFlashcardToCustomDeck = (question: string, answer: string) => {
    const customDeckIndex = decks.findIndex((d) => d.id === "user-saved-deck");
    const newCard: Flashcard = {
      id: `saved-card-${Date.now()}`,
      question,
      referenceAnswer: answer,
      category: "AI Saved",
      hint: "Review your saved AI Tutor Q&A.",
    };

    if (customDeckIndex >= 0) {
      const updatedDecks = [...decks];
      updatedDecks[customDeckIndex] = {
        ...updatedDecks[customDeckIndex],
        cards: [newCard, ...updatedDecks[customDeckIndex].cards],
      };
      setDecks(updatedDecks);
    } else {
      const userDeck: Deck = {
        id: "user-saved-deck",
        title: "My Saved AI Flashcards",
        description: "Custom flashcards created from Ask Anything AI conversations.",
        category: "Personal Notes",
        difficulty: "Intermediate",
        iconName: "Sparkles",
        accentColor: "from-indigo-600 to-violet-600",
        cards: [newCard],
      };
      setDecks((prev) => [userDeck, ...prev]);
    }
  };

  const masteryPercent =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 78;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Clean Minimalism Navigation */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        streakCount={streakCount}
        totalAnswered={totalAnswered}
        totalCorrect={totalCorrect}
      />

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 flex flex-col max-w-[1400px] w-full mx-auto">
        {currentMode === "split" ? (
          /* Split Mode (Side-by-side Dual Studio layout from Design HTML) */
          <div className="flex-1 flex flex-col lg:flex-row gap-6 w-full">
            {/* Left side: Mode 1 Flashcards */}
            <section className="flex-1 flex flex-col">
              {quizSummary ? (
                <QuizScoreSummary
                  summary={quizSummary}
                  onRetryAll={handleRetryAll}
                  onRetryMissed={handleRetryMissed}
                  onSelectNewDeck={handleSelectNewDeck}
                  onAskAiAboutQuestion={handleAskAiAboutQuestion}
                />
              ) : activeDeck ? (
                <QuizRunner
                  deck={activeDeck}
                  cardsToRun={cardsToRun}
                  onFinishQuiz={handleFinishQuiz}
                  onExit={handleSelectNewDeck}
                />
              ) : (
                <DeckSelector
                  decks={decks}
                  onSelectDeck={handleSelectDeck}
                  onAddCustomDeck={handleAddCustomDeck}
                  onOpenBatchEdit={handleOpenBatchEdit}
                  onOpenImportExport={handleOpenImportExport}
                />
              )}
            </section>

            {/* Right side: Mode 2 Ask Anything AI */}
            <section className="w-full lg:w-[420px] xl:w-[460px] flex flex-col">
              <AskAnythingView
                initialQuestion={askInitialQuestion}
                onClearInitialQuestion={() => setAskInitialQuestion("")}
                onAddFlashcardToCustomDeck={handleAddFlashcardToCustomDeck}
              />
            </section>
          </div>
        ) : currentMode === "flashcards" ? (
          /* Full Deck Mode */
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
            {quizSummary ? (
              <QuizScoreSummary
                summary={quizSummary}
                onRetryAll={handleRetryAll}
                onRetryMissed={handleRetryMissed}
                onSelectNewDeck={handleSelectNewDeck}
                onAskAiAboutQuestion={handleAskAiAboutQuestion}
              />
            ) : activeDeck ? (
              <QuizRunner
                deck={activeDeck}
                cardsToRun={cardsToRun}
                onFinishQuiz={handleFinishQuiz}
                onExit={handleSelectNewDeck}
              />
            ) : (
              <DeckSelector
                decks={decks}
                onSelectDeck={handleSelectDeck}
                onAddCustomDeck={handleAddCustomDeck}
                onOpenBatchEdit={handleOpenBatchEdit}
                onOpenImportExport={handleOpenImportExport}
              />
            )}
          </div>
        ) : (
          /* AI Lab Mode */
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            <AskAnythingView
              initialQuestion={askInitialQuestion}
              onClearInitialQuestion={() => setAskInitialQuestion("")}
              onAddFlashcardToCustomDeck={handleAddFlashcardToCustomDeck}
            />
          </div>
        )}
      </main>

      {/* Batch Edit Modal */}
      {batchEditDeck && (
        <BatchEditModal
          deck={batchEditDeck}
          availableDecks={decks}
          isOpen={true}
          onClose={handleCloseBatchEdit}
          onBatchDelete={handleBatchDelete}
          onBatchMove={handleBatchMove}
          onAddManualCard={handleAddManualCard}
        />
      )}

      {/* Import / Export Decks Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        decks={decks}
        onImportDecks={handleImportDecks}
      />

      {/* Clean Minimalism Footer */}
      <footer className="h-12 bg-white border-t border-slate-100 px-6 sm:px-8 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <div className="flex gap-4 sm:gap-6">
          <span>Mastery: {masteryPercent}%</span>
          <span className="hidden sm:inline">Avg Response: 3.8s</span>
          <span>Next Review: 2h 40m</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>AI Core Synced</span>
        </div>
      </footer>
    </div>
  );
}
