# AI Meeting Copilot

### From Meeting → Understanding → Action → Follow-up

**AI Meeting Copilot** is an end-to-end meeting intelligence application built for a 6-hour AI/ML hackathon. It transforms unstructured meeting transcripts into grounded summaries, separated final decisions vs. open discussions, prioritized action items, explainable deadline risk assessments, unresolved topic trackers, cross-meeting change logs, and hallucination-controlled Q&A.

---

## 1. Problem

Meetings contain critical discussions, decisions, task assignments, responsibilities, and deadlines. However, teams routinely struggle with follow-through because people forget:
- **What was actually decided** versus what was merely debated
- **Who is responsible** for specific deliverables
- **Which tasks are still pending** or in progress
- **Which deadlines carry high risk** due to tight turnarounds, large scope, dependencies, or missing owners
- **Which topics remain unresolved** and need follow-up in the next sync
- **What changed** from previous meetings in the same project

---

## 2. Solution

**AI Meeting Copilot** automates the entire post-meeting workflow:
1. **Transcript Ingestion & Preprocessing**: Cleans raw meeting text, normalizes multi-line speaker turns (`Speaker:\nUtterance → Speaker: Utterance`), segments sentences, and extracts candidate speaker entities and temporal deadline tokens.
2. **Structured AI Extraction**: Uses Google Gemini (`gemini-3.8-flash`) with deterministic decoding (`temperature: 0.1`) and strict JSON Schema validation (`responseSchema`) to extract grounded meeting artifacts without hallucination.
3. **Explainable Classification**: Classifies every action item by **AI-Recommended Priority** (`High`, `Medium`, `Low`) and **Potential Deadline Risk** (`Low Risk`, `Medium Risk`, `High Risk`) with human-readable explanations.
4. **Action & Follow-up Workspace**: Provides a role-based Personal Task View (*"Who are you?"*), persistent task status tracking (`Pending`, `In Progress`, `Completed`), multi-meeting memory with automatic **Change Tracking**, and a strictly grounded **Ask My Meeting** assistant.

---

## 3. Key Features & USP

### Core USP: *"From Meeting → Action → Follow-up"*
- **Deadline Risk Detection (`⚠ POSSIBLE DEADLINE RISK`)**: Analyzes action items across four interpretable features (*Temporal Urgency*, *Scope Complexity*, *Ownership Clarity*, and *Dependency/Conflict Overlap*) to flag `Low Risk`, `Medium Risk`, or `High Risk` tasks with explainable reasons.
- **Decision vs. Discussion Separation**: Distinguishes exploratory questions (*"Should we use React or Angular?"*) from confirmed decisions (*"The team decided to use React"*).
- **Unresolved Topic Detector (`⚠ UNRESOLVED TOPIC`)**: Surfaces open discussions that ended without a final decision (*e.g., Cloud platform selection — Decision pending*).
- **Personal AI Assistant (*"Who are you?"*)**: Role-scoped participant selector (`Rahul`, `Aman`, `Yashasvi`, etc.) that filters action items, deadlines, and risk alerts for individual team members.
- **Meeting Memory & Change Tracking (`🔄 CHANGE DETECTED`)**: Stores multiple meetings per project (`Project Alpha — Sept 28, Sept 30, Oct 2`) and automatically detects **Deadline Changed**, **Task Reassigned**, **Decision Changed**, **Task Completed**, and **New Task Added**.
- **Hallucination-Controlled "Ask My Meeting" Q&A**: Answers questions strictly using the meeting context at `temperature: 0.0` with verbatim source evidence citations. If information is absent from the meeting, it responds: *"I couldn't find this information in the meeting."*
- **Data Science & NLP Pipeline Evaluation View**: Live inspection of text cleaning metrics, feature engineering matrices for priority/risk classification, and grounding verification scores.

---

## 4. Data Science & Technical Methodology

1. **Data Cleaning & Preprocessing (`src/utils/nlpPipeline.ts`)**:
   - Strips control characters and normalizes line breaks.
   - Collapses multi-line speaker headers into canonical `Speaker: Statement` turns.
   - Extracts lexical cue counts (*Commitment Cues*, *Decision Cues*, *Unresolved Question Cues*) and temporal expressions (`Friday`, `Saturday`, `Monday`, `Tomorrow morning`).
2. **Feature Engineering for Priority & Risk Classification**:
   - **F1 (`Temporal Urgency`)**: Immediate (`<48h` / `tomorrow`), Near-Term (`This Week`), Extended (`Next Week+`), or `Missing Deadline`.
   - **F2 (`Scope Complexity`)**: Detects multi-system/large-scope deliverables (`entire`, `end-to-end`, `integration`, `audit`, `migration`) vs. focused deliverables.
   - **F3 (`Ownership Clarity`)**: Verifies whether a named participant is assigned or if owner is `Not specified`.
   - **F4 (`Dependency / Schedule Conflict`)**: Flags overlapping owner workloads or same-day milestone collisions.
3. **Model Selection & Grounded Evaluation**:
   - **Model**: `gemini-3.8-flash` via `@google/genai` with constrained JSON `responseSchema` + deterministic fallback NLP parser.
   - **Evaluation Metrics**: Participant Grounding Precision (`%` verified verbatim in transcript), Task Owner Attribution Rate, Schema Completeness Score, and Class Distribution across Priority and Risk tiers.

---

## 5. Tech Stack & Architecture

- **Web Application (Live Preview on Port 3000)**:
  - **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
  - **Backend**: Node.js, Express (`server.ts`), `@google/genai` SDK (`gemini-3.8-flash`)
  - **Persistence**: Local JSON data store (`data/meetings_store.json`) + browser `localStorage` sync
- **Standalone Python / Streamlit Reference (`app.py`)**:
  - Included for local Python/Streamlit execution with SQLite (`sqlite3`) and Pandas (`pandas`).

```text
ai-meeting-copilot/
├── server.ts                         # Express + Vite server & Gemini API routes
├── app.py                            # Standalone Streamlit + SQLite Python app
├── requirements.txt                  # Python dependencies for Streamlit execution
├── README.md                         # Project documentation
├── .env.example                      # Environment variable template
├── data/
│   ├── sample_meeting.txt            # Default Project Alpha sample transcript
│   └── meetings_store.json           # Persistent local meeting database
└── src/
    ├── App.tsx                       # Main workspace shell & state management
    ├── types/meeting.ts              # Structured TypeScript interfaces
    ├── data/sampleData.ts            # Pre-populated Project Alpha meetings & samples
    ├── utils/nlpPipeline.ts          # Text preprocessing, feature engineering & eval
    └── components/
        ├── DashboardView.tsx         # Metrics, Summary, Risks, Tasks, Decisions
        ├── AnalyzeMeetingView.tsx    # Paste / Upload .txt & live NLP preview
        ├── MyTasksView.tsx           # "Who are you?" Personal AI Assistant
        ├── MeetingHistoryView.tsx    # Meeting Memory & Change Tracking log
        ├── AskMeetingView.tsx        # Grounded Q&A with hallucination guard
        └── DataScienceEvalView.tsx   # Data preparation, feature matrix & eval metrics
```

---

## 6. Installation & Running

### Option 1: Full-Stack Web App (Node.js / Vite / Express)
```bash
npm install
# Configure GEMINI_API_KEY in .env
npm run dev
```

### Option 2: Python Streamlit App (`app.py`)
```bash
pip install -r requirements.txt
# Configure GEMINI_API_KEY or OPENAI_API_KEY in .env
streamlit run app.py
```

---

## 7. 2–3 Minute Hackathon Demo Sequence

1. **Open Dashboard**: Inspect **Project Alpha — Meeting 1 (September 28)** with objective metrics (4 Participants, 4 Tasks, 2 Decisions, 1 Unresolved Topic, 3 Potential Risks).
2. **Analyze New Meeting**: Click **Analyze Meeting**, load **Sample 1** (or upload `data/sample_meeting.txt`), inspect the live NLP preprocessing stats, and click **Analyze Meeting Transcript**.
3. **Show Decisions vs. Discussions & Unresolved Topics**: Point out how *"Should we use React or Angular?"* is separated from the final decision (*"Use React"*), while *"Cloud platform selection"* is flagged as an **Unresolved Topic**.
4. **Show Deadline Risk Detection**: Highlight the explainable risk reasons (*e.g., Large task with a very short deadline and missing owner*).
5. **Personal Task View (*"Who are you?"*)**: Open **My Tasks**, select **Rahul** or **Aman**, and toggle task status between `Pending`, `In Progress`, and `Completed`.
6. **Ask My Meeting**: Open **Ask Meeting** and click *"Who is responsible for the database?"* → shows **Aman (Due Saturday)** with verbatim transcript evidence. Click the Hallucination Guard Test question to show it refuses to invent facts.
7. **Meeting Memory & Change Tracking**: Open **Meeting History** to show how the database deadline shifting from `Saturday → Monday morning` and completed tasks are automatically tracked across Meetings 1, 2, and 3.
