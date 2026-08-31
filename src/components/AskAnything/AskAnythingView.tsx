import React, { useState, useEffect } from "react";
import { AskResponse, AskHistoryItem } from "../../types";
import {
  Sparkles,
  Search,
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  PlusCircle,
  Clock,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AskAnythingViewProps {
  initialQuestion?: string;
  onClearInitialQuestion?: () => void;
  onAddFlashcardToCustomDeck?: (question: string, answer: string) => void;
}

const SAMPLE_PROMPTS = [
  "How does the Human Immune System recognize viruses?",
  "What is the difference between TCP and UDP protocols?",
  "Why is the sky blue during the day and red at sunset?",
  "Explain Quantum Superposition in simple terms.",
  "How does ATP actually store cellular energy?",
  "What is the role of the Attention Mechanism in Transformers?",
];

export const AskAnythingView: React.FC<AskAnythingViewProps> = ({
  initialQuestion,
  onClearInitialQuestion,
  onAddFlashcardToCustomDeck,
}) => {
  const [questionInput, setQuestionInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<AskResponse | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<AskHistoryItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedAsCard, setIsSavedAsCard] = useState(false);

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      setQuestionInput(initialQuestion);
      handleAsk(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [initialQuestion]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk || questionInput).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsCopied(false);
    setIsSavedAsCard(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const res = await fetch("/api/gemini/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok && !data.answer) {
        throw new Error(data.error || "Failed to retrieve answer from AI Tutor.");
      }

      const validResponse: AskResponse = {
        answer: data.answer || "Answer generated.",
        keyTakeaway: data.keyTakeaway || "Core concept principle.",
        followUpQuestions: data.followUpQuestions || [
          "Can you give a practical real-world example?",
          "How does this relate to other topics in the deck?",
          "What are the most common misconceptions?",
        ],
      };

      setCurrentResponse(validResponse);
      setCurrentQuestionText(q);

      const historyItem: AskHistoryItem = {
        id: `ask-${Date.now()}`,
        question: q,
        response: validResponse,
        timestamp: Date.now(),
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
      setQuestionInput("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeechToggle = () => {
    if (!("speechSynthesis" in window) || !currentResponse) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `${currentResponse.answer} Key Takeaway: ${currentResponse.keyTakeaway}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopy = () => {
    if (!currentResponse) return;
    const formatted = `Q: ${currentQuestionText}\n\nA: ${currentResponse.answer}\n\nKey Takeaway: ${currentResponse.keyTakeaway}`;
    navigator.clipboard.writeText(formatted);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveToCard = () => {
    if (!currentResponse || !onAddFlashcardToCustomDeck) return;
    onAddFlashcardToCustomDeck(currentQuestionText, currentResponse.answer);
    setIsSavedAsCard(true);
    setTimeout(() => setIsSavedAsCard(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Mode 2: Ask Anything AI
        </h2>
        <span className="text-xs font-medium text-slate-400">
          Concise 2–3 Sentence AI Tutor
        </span>
      </div>

      {/* Main AI Lab Dark Card */}
      <div className="flex-1 bg-slate-900 rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col justify-between text-white border border-slate-800">
        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-950/80 border border-red-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => handleAsk(currentQuestionText || questionInput)}
              className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Top Sample Prompts when empty */}
        {!currentResponse && !isLoading && (
          <div className="space-y-4 my-auto">
            <div className="text-center max-w-md mx-auto py-4">
              <div className="w-10 h-10 bg-indigo-600/30 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Instant Academic Answers
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ask any question across science, engineering, or history. Powered live by Gemini AI.
              </p>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 text-center">
                Suggested Topics to Explore
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {SAMPLE_PROMPTS.slice(0, 4).map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQuestionInput(prompt);
                      handleAsk(prompt);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left text-xs text-slate-300 hover:text-white border border-slate-700/50 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream Loading State */}
        {isLoading && (
          <div className="space-y-4 my-auto py-8">
            <div className="flex justify-end">
              <div className="bg-slate-800 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                {questionInput || "Asking question..."}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-indigo-600/50 text-indigo-200 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating concise explanation with Gemini AI...</span>
              </div>
            </div>
          </div>
        )}

        {/* Active Q&A Response Display */}
        {currentResponse && !isLoading && (
          <div className="space-y-4 my-auto overflow-y-auto max-h-[500px] pr-1">
            {/* User Question */}
            <div className="flex justify-end">
              <div className="bg-slate-800 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] text-sm">
                {currentQuestionText}
              </div>
            </div>

            {/* AI Response Bubble */}
            <div className="flex justify-start">
              <div className="bg-indigo-600 text-white p-5 rounded-2xl rounded-tl-none max-w-[90%] text-sm leading-relaxed shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="block font-bold opacity-80 uppercase text-[10px] tracking-wider">
                    AI ASSISTANT
                  </span>
                  <div className="flex items-center gap-1 opacity-90">
                    <button
                      onClick={handleSpeechToggle}
                      title="Read aloud"
                      className="p-1 hover:bg-indigo-700 rounded cursor-pointer"
                    >
                      {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={handleCopy}
                      title="Copy response"
                      className="p-1 hover:bg-indigo-700 rounded cursor-pointer"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    {onAddFlashcardToCustomDeck && (
                      <button
                        onClick={handleSaveToCard}
                        title="Save to Flashcards"
                        className="p-1 hover:bg-indigo-700 rounded cursor-pointer"
                      >
                        {isSavedAsCard ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <PlusCircle className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm sm:text-base leading-relaxed">
                  {currentResponse.answer}
                </p>

                {currentResponse.keyTakeaway && (
                  <div className="mt-3 pt-2.5 border-t border-indigo-500/40 text-xs text-indigo-100 flex items-start gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span><strong>Takeaway:</strong> {currentResponse.keyTakeaway}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up question chips */}
            {currentResponse.followUpQuestions && currentResponse.followUpQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {currentResponse.followUpQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestionInput(q);
                      handleAsk(q);
                    }}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-slate-700 transition-colors text-left cursor-pointer"
                  >
                    {q} →
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Bar at Bottom */}
        <div className="mt-6 pt-4 border-t border-slate-800 relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
          >
            <input
              id="ai-question-input"
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Ask a follow-up question or topic..."
              className="w-full bg-slate-800 border-none rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !questionInput.trim()}
              className="absolute right-2 bottom-2 w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 rounded-xl flex items-center justify-center text-white cursor-pointer transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
