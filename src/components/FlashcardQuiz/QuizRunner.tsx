import React, { useState, useEffect, useRef } from "react";
import { Deck, Flashcard, EvaluationResult, QuizAttempt, QuizSummary } from "../../types";
import {
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuizRunnerProps {
  deck: Deck;
  cardsToRun?: Flashcard[];
  onFinishQuiz: (summary: QuizSummary) => void;
  onExit: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({
  deck,
  cardsToRun,
  onFinishQuiz,
  onExit,
}) => {
  const activeCards = cardsToRun && cardsToRun.length > 0 ? cardsToRun : deck.cards;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isOverridden, setIsOverridden] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentCard = activeCards[currentIndex];

  useEffect(() => {
    setUserAnswer("");
    setShowHint(false);
    setEvaluation(null);
    setIsOverridden(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [currentIndex]);

  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isEvaluating || evaluation || !currentCard) return;

    setIsEvaluating(true);

    try {
      const res = await fetch("/api/gemini/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentCard.question,
          referenceAnswer: currentCard.referenceAnswer,
          userAnswer: userAnswer.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to evaluate answer.");
      }

      const result: EvaluationResult = await res.json();
      setEvaluation(result);

      const attempt: QuizAttempt = {
        cardId: currentCard.id,
        question: currentCard.question,
        referenceAnswer: currentCard.referenceAnswer,
        userAnswer: userAnswer.trim(),
        evaluation: result,
        timestamp: Date.now(),
      };
      setAttempts((prev) => [...prev, attempt]);
    } catch (error) {
      console.error(error);
      const fallbackResult: EvaluationResult = {
        isCorrect:
          userAnswer.trim().length > 3 &&
          currentCard.referenceAnswer.toLowerCase().includes(userAnswer.trim().toLowerCase()),
        score: userAnswer.trim().length > 3 ? 75 : 0,
        feedback: "Auto-evaluated against reference text.",
        keyConceptsMatched: ["Answer submitted"],
        missingOrIncorrectPoints: ["Compare with reference answer"],
      };
      setEvaluation(fallbackResult);
      setAttempts((prev) => [
        ...prev,
        {
          cardId: currentCard.id,
          question: currentCard.question,
          referenceAnswer: currentCard.referenceAnswer,
          userAnswer: userAnswer.trim(),
          evaluation: fallbackResult,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSkip = () => {
    if (evaluation) return;
    const skippedResult: EvaluationResult = {
      isCorrect: false,
      score: 0,
      feedback: "Card skipped. Study the reference answer to build active recall.",
      keyConceptsMatched: [],
      missingOrIncorrectPoints: ["Card skipped"],
    };
    setEvaluation(skippedResult);
    setAttempts((prev) => [
      ...prev,
      {
        cardId: currentCard.id,
        question: currentCard.question,
        referenceAnswer: currentCard.referenceAnswer,
        userAnswer: "(Skipped)",
        evaluation: skippedResult,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < activeCards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const handleOverrideScore = () => {
    if (!evaluation) return;
    const updatedEvaluation: EvaluationResult = {
      ...evaluation,
      isCorrect: true,
      score: Math.max(evaluation.score, 85),
      feedback: "Overridden by student: Marked as correct.",
    };
    setEvaluation(updatedEvaluation);
    setIsOverridden(true);

    setAttempts((prev) =>
      prev.map((att, idx) =>
        idx === prev.length - 1
          ? { ...att, evaluation: updatedEvaluation, isOverridden: true }
          : att
      )
    );
  };

  const finishQuiz = () => {
    const total = activeCards.length;
    const correct = attempts.filter((a) => a.evaluation.isCorrect).length;
    const incorrect = total - correct;
    const scorePercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const summary: QuizSummary = {
      deckId: deck.id,
      deckTitle: deck.title,
      totalCards: total,
      correctCount: correct,
      incorrectCount: incorrect,
      scorePercentage,
      durationSeconds,
      attempts,
    };

    onFinishQuiz(summary);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!evaluation) {
        handleSubmitAnswer();
      } else {
        handleNextCard();
      }
    }
  };

  const progressPercent = Math.round(((currentIndex + 1) / activeCards.length) * 100);

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Mode Header & Card Tracker */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Deck: {deck.title}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 hidden sm:block">
            Mode 1: Active Recall Flashcard
          </h2>
          <span className="text-sm font-mono bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded font-semibold">
            Card {currentIndex + 1} / {activeCards.length}
          </span>
        </div>
      </div>

      {/* Main Flashcard Card */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Sleek top progress indicator */}
        <div className="w-full bg-slate-100 h-1 absolute top-0 left-0 right-0 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-6 w-full max-w-lg my-auto">
          {/* Card Category */}
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider">
              {currentCard.category}
            </p>
            {currentCard.hint && !evaluation && (
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-medium px-2 py-0.5 rounded bg-amber-50 border border-amber-200 cursor-pointer"
              >
                {showHint ? "Hide Hint" : "💡 Hint"}
              </button>
            )}
          </div>

          {/* Optional Hint Dropdown */}
          <AnimatePresence>
            {showHint && currentCard.hint && !evaluation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 text-left"
              >
                <span className="font-bold">Clue:</span> {currentCard.hint}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flashcard Question */}
          <h1 className="text-2xl sm:text-3xl font-semibold leading-snug text-slate-900">
            {currentCard.question}
          </h1>

          {/* Active Recall Input */}
          <div className="pt-6">
            <form onSubmit={handleSubmitAnswer}>
              <input
                id="active-recall-input"
                ref={inputRef}
                type="text"
                disabled={isEvaluating || evaluation !== null}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here... (Press Enter)"
                className="w-full border-b-2 border-slate-200 pb-2 text-lg sm:text-xl focus:border-indigo-500 outline-none transition-colors text-center font-light bg-transparent text-slate-900 placeholder:text-slate-300 disabled:text-slate-600"
              />

              {!evaluation && (
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    id="btn-submit-answer"
                    type="submit"
                    disabled={isEvaluating || !userAnswer.trim()}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <span>Submit Answer</span>
                    )}
                  </button>

                  <button
                    id="btn-skip-answer"
                    type="button"
                    onClick={handleSkip}
                    disabled={isEvaluating}
                    className="px-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Skip
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Evaluation Banner & Reference Answer */}
          <AnimatePresence>
            {evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 pt-2 text-left"
              >
                {/* Result Pill */}
                <div
                  className={`py-3 px-4 rounded-xl flex items-center justify-between gap-2 border ${
                    evaluation.isCorrect
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-red-50 border-red-100 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        evaluation.isCorrect ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {evaluation.isCorrect ? "✓ Correct" : "✗ Needs Review"}
                    </span>
                    <span className="text-xs opacity-75">
                      • AI Score: {evaluation.score}/100
                    </span>
                  </div>

                  {!evaluation.isCorrect && !isOverridden && (
                    <button
                      type="button"
                      onClick={handleOverrideScore}
                      className="text-xs font-semibold bg-white px-2.5 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer shadow-2xs"
                    >
                      I was correct
                    </button>
                  )}
                </div>

                {/* AI Feedback Commentary */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800">AI Feedback: </span>
                  {evaluation.feedback}
                </p>

                {/* Authoritative Reference Answer */}
                <div className="rounded-xl bg-slate-900 p-4 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                    Reference Answer
                  </span>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-100">
                    {currentCard.referenceAnswer}
                  </p>
                </div>

                {/* Next Button */}
                <div className="flex justify-center pt-2">
                  <button
                    id="btn-next-card"
                    type="button"
                    onClick={handleNextCard}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>
                      {currentIndex + 1 < activeCards.length
                        ? "Next Card (Enter)"
                        : "View Summary"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
