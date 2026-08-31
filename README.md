# Dual Learning Studio

An intelligent dual-mode academic learning platform combining **Interactive Active-Recall Flashcards** with an **Ask Anything AI Academic Tutor**, powered by Google Gemini AI.

---

## Key Features

- **Mode 1: Interactive Flashcard Quiz**
  - **Active Recall**: Type answers and receive AI-driven semantic auto-evaluation (scoring, concept recognition, and actionable feedback).
  - **Preloaded & Custom Decks**: Built-in decks across Computer Science, Biology, World History, plus an AI Deck Generator.
  - **Deck Management**: Real-time keyword search, category filter pills, batch editing (multi-select delete/move), and full JSON export/import with drag-and-drop.
  - **Progress Tracking**: Real-time streak tracking, score metrics, mastery percentage, and targeted review for missed cards.

- **Mode 2: Ask Anything AI Tutor**
  - **Concise Instant Answers**: Generates authoritative 2–3 sentence explanations, punchy takeaways, and intelligent follow-up suggestions.
  - **Text-to-Speech & Quick Actions**: Audio playback, one-click copy, and seamless conversion of AI responses into new flashcards.
  - **Dual Studio View**: Side-by-side interactive split layout for simultaneous questioning and quiz studying.

---

## System Requirements & Prerequisites

- **Node.js**: `v18.0.0` or higher (Node 20+ recommended)
- **Package Manager**: `npm` (v9+), `yarn`, or `pnpm`
- **Gemini API Key**: A Google Gemini API key is required for AI evaluation, Q&A tutoring, and deck generation. Get one from [Google AI Studio](https://aistudio.google.com/).

---

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/dual-learning-studio.git
   cd dual-learning-studio
   ```

2. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

3. Add your Gemini API key inside `.env`:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

---

## Installation & Running

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
Starts the Express backend and Vite frontend middleware on port `3000`:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Type Checking & Linting
```bash
npm run lint
```

### 4. Production Build & Start
Bundles the Vite client and compiles the standalone backend server into `dist/`:
```bash
npm run build
npm start
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`) |
| **Icons & UI** | Lucide React (`lucide-react`), Canvas Confetti |
| **Backend** | Express 4, Node.js (ESM), `tsx`, `esbuild` |
| **AI Integration** | `@google/genai` (Gemini 3.7 Flash & Fallback Models) |
| **Build Tooling** | Vite 6 |

---

## Project Structure

```
├── server.ts                    # Express backend with server-side Gemini API endpoints
├── src/
│   ├── App.tsx                  # Main application container & state manager
│   ├── main.tsx                 # React DOM entrypoint
│   ├── index.css                # Global CSS & Tailwind CSS styling
│   ├── types.ts                 # Global TypeScript models & interfaces
│   ├── data/
│   │   └── defaultDecks.ts      # Default starter study decks
│   └── components/
│       ├── Header.tsx           # Navigation & global study stats header
│       ├── FlashcardQuiz/       # Flashcard quiz views, runner, selector, batch edit & import/export
│       │   ├── DeckSelector.tsx
│       │   ├── QuizRunner.tsx
│       │   ├── QuizScoreSummary.tsx
│       │   ├── BatchEditModal.tsx
│       │   └── ImportExportModal.tsx
│       └── AskAnything/         # Ask Anything AI Tutor chat interface
│           └── AskAnythingView.tsx
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration
└── metadata.json                # App metadata and capability configuration
```

---

## License

Apache-2.0
