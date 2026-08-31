import React from "react";
import { LearningMode } from "../types";
import { motion } from "motion/react";

interface HeaderProps {
  currentMode: LearningMode;
  onSelectMode: (mode: LearningMode) => void;
  streakCount: number;
  totalAnswered: number;
  totalCorrect: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  streakCount,
  totalAnswered,
  totalCorrect,
}) => {
  const overallAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  return (
    <nav className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
          <div className="w-3.5 h-3.5 border-2 border-white rounded-xs" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg sm:text-xl tracking-tight uppercase text-slate-900">
            NeuroLearn
          </span>
          <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            Dual AI Studio
          </span>
        </div>
      </div>

      {/* Pill Segmented Nav Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
        <button
          id="nav-tab-split"
          onClick={() => onSelectMode("split")}
          className={`relative px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
            currentMode === "split"
              ? "bg-white shadow-xs text-indigo-600 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Split Mode
        </button>

        <button
          id="nav-tab-flashcards"
          onClick={() => onSelectMode("flashcards")}
          className={`relative px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
            currentMode === "flashcards"
              ? "bg-white shadow-xs text-indigo-600 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          Full Deck
        </button>

        <button
          id="nav-tab-ask-ai"
          onClick={() => onSelectMode("ask_ai")}
          className={`relative px-4 sm:px-6 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
            currentMode === "ask_ai"
              ? "bg-white shadow-xs text-indigo-600 font-bold"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          AI Lab
        </button>
      </div>

      {/* Header Right Status */}
      <div className="flex items-center gap-4 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 hidden sm:inline">Streak:</span>
          <span className="text-orange-600 font-bold">
            {streakCount > 0 ? `${streakCount} Days` : "Active"}
          </span>
        </div>
        {overallAccuracy !== null && (
          <div className="hidden lg:flex items-center gap-1.5">
            <span className="text-slate-400">Mastery:</span>
            <span className="text-indigo-600 font-bold">{overallAccuracy}%</span>
          </div>
        )}
      </div>
    </nav>
  );
};
