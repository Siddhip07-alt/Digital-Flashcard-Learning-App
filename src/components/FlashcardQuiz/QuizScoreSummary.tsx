import React, { useEffect } from "react";
import { QuizSummary } from "../../types";
import confetti from "canvas-confetti";
import {
  Trophy,
  RotateCcw,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";

interface QuizScoreSummaryProps {
  summary: QuizSummary;
  onRetryAll: () => void;
  onRetryMissed: (missedCardIds: string[]) => void;
  onSelectNewDeck: () => void;
  onAskAiAboutQuestion: (question: string) => void;
}

export const QuizScoreSummary: React.FC<QuizScoreSummaryProps> = ({
  summary,
  onRetryAll,
  onRetryMissed,
  onSelectNewDeck,
  onAskAiAboutQuestion,
}) => {
  const { scorePercentage, correctCount, incorrectCount, totalCards, durationSeconds, attempts } =
    summary;

  useEffect(() => {
    if (scorePercentage >= 60) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [scorePercentage]);

  const missedCardIds = attempts
    .filter((a) => !a.evaluation.isCorrect)
    .map((a) => a.cardId);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return mins > 0 ? `${mins}m ${remainingSec}s` : `${remainingSec}s`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center relative overflow-hidden">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-6 w-6" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Quiz Completed: {summary.deckTitle}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Active recall session finished in {formatTime(durationSeconds)}.
        </p>

        {/* Score Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Accuracy
            </span>
            <span className="text-2xl sm:text-3xl font-black text-indigo-600">
              {scorePercentage}%
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Correct
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {correctCount}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              To Review
            </span>
            <span className="text-2xl sm:text-3xl font-black text-red-500">
              {incorrectCount}
            </span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Duration
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800">
              {formatTime(durationSeconds)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {missedCardIds.length > 0 && (
            <button
              id="btn-retry-missed"
              onClick={() => onRetryMissed(missedCardIds)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-100 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Missed ({missedCardIds.length})</span>
            </button>
          )}

          <button
            id="btn-retake-full-deck"
            onClick={onRetryAll}
            className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retake All</span>
          </button>

          <button
            id="btn-choose-another-deck"
            onClick={onSelectNewDeck}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Change Deck</span>
          </button>
        </div>
      </div>

      {/* Review Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Response Breakdown
        </h3>

        <div className="space-y-3">
          {attempts.map((attempt, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                    Q{index + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {attempt.question}
                  </h4>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    attempt.evaluation.isCorrect
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {attempt.evaluation.isCorrect ? "✓ Correct" : "✗ Review"}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 mt-3">
                <p>
                  <span className="font-semibold text-slate-800">Your Answer: </span>
                  <span className="italic">{attempt.userAnswer || "None"}</span>
                </p>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-800">
                  <span className="font-semibold text-slate-900">Reference: </span>
                  {attempt.referenceAnswer}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Score: {attempt.evaluation.score}/100
                </span>
                <button
                  onClick={() => onAskAiAboutQuestion(attempt.question)}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Ask AI Tutor</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
