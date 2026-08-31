export interface Flashcard {
  id: string;
  question: string;
  referenceAnswer: string;
  category: string;
  hint?: string;
  explanation?: string;
}

export interface Deck {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  iconName: string;
  accentColor: string;
  cards: Flashcard[];
}

export interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  keyConceptsMatched?: string[];
  missingOrIncorrectPoints?: string[];
}

export interface QuizAttempt {
  cardId: string;
  question: string;
  referenceAnswer: string;
  userAnswer: string;
  evaluation: EvaluationResult;
  isOverridden?: boolean;
  timestamp: number;
}

export interface QuizSummary {
  deckId: string;
  deckTitle: string;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  durationSeconds: number;
  attempts: QuizAttempt[];
}

export interface AskResponse {
  answer: string;
  keyTakeaway: string;
  followUpQuestions: string[];
}

export interface AskHistoryItem {
  id: string;
  question: string;
  response: AskResponse;
  timestamp: number;
  topicTag?: string;
}

export type LearningMode = "split" | "flashcards" | "ask_ai";
