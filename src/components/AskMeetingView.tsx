import React, { useState, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Trash2,
  FileText
} from 'lucide-react';
import type { MeetingRecord, QAExchange } from '../types/meeting';

interface AskMeetingViewProps {
  activeMeeting: MeetingRecord;
  allMeetings: MeetingRecord[];
  selectedParticipant: string;
  qaHistory: QAExchange[];
  onAskQuestion: (question: string) => Promise<void>;
  onClearHistory: () => void;
  isAsking: boolean;
  prefilledQuestion: string;
  onClearPrefill: () => void;
}

const SUGGESTED_QUESTIONS = [
  'Who is responsible for the database?',
  'Who is responsible for the frontend?',
  'What did we decide?',
  'What are my tasks?',
  'What is the database deadline?',
  'Which tasks are pending?',
  'What topics are unresolved?',
  'What changed from the previous meeting?',
  'What is the approved Q4 hardware budget? (Hallucination Guard Test)'
];

export const AskMeetingView: React.FC<AskMeetingViewProps> = ({
  activeMeeting,
  selectedParticipant,
  qaHistory,
  onAskQuestion,
  onClearHistory,
  isAsking,
  prefilledQuestion,
  onClearPrefill
}) => {
  const [questionInput, setQuestionInput] = useState('');

  useEffect(() => {
    if (prefilledQuestion) {
      setQuestionInput(prefilledQuestion);
      onClearPrefill();
    }
  }, [prefilledQuestion, onClearPrefill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = questionInput.trim();
    if (!q || isAsking) return;
    setQuestionInput('');
    await onAskQuestion(q);
  };

  const handleQuickAsk = async (q: string) => {
    if (isAsking) return;
    const cleanQuestion = q.replace(/\s*\(Hallucination Guard Test\)$/i, '');
    await onAskQuestion(cleanQuestion);
  };

  const meetingExchanges = qaHistory.filter((item) => item.meetingId === activeMeeting.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Context-Grounded Q&A</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700">{activeMeeting.title} ({activeMeeting.date})</span>
            <span aria-hidden="true">·</span>
            <span>
              Active Identity:{' '}
              <strong className="text-slate-800">
                {selectedParticipant === 'All' ? 'All Participants' : selectedParticipant}
              </strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            Ask My Meeting
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Ask questions about responsibilities, decisions, deadlines, unresolved topics, or changes across meetings. Strict hallucination control ensures answers come exclusively from the meeting context.
          </p>
        </div>

        {meetingExchanges.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 self-start lg:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Conversation
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Q&A Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Prompt Input Box */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
          >
            <label htmlFor="ask-meeting-input" className="block text-xs font-semibold text-slate-700">
              Ask anything about "{activeMeeting.title}"
            </label>
            <div className="flex items-center gap-2">
              <input
                id="ask-meeting-input"
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="e.g., Who is responsible for the database? What topics are unresolved?"
                className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
              />
              <button
                type="submit"
                disabled={isAsking || !questionInput.trim()}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {isAsking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Ask Meeting
                  </>
                )}
              </button>
            </div>

            {/* Quick Prompt Buttons */}
            <div className="pt-2">
              <div className="text-[11px] text-slate-500 mb-2">
                Click a sample question to test grounded answers & anti-hallucination guard:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => {
                  const isGuardTest = q.includes('Hallucination Guard Test');
                  return (
                    <button
                      key={q}
                      type="button"
                      disabled={isAsking}
                      onClick={() => handleQuickAsk(q)}
                      className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors text-left ${
                        isGuardTest
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Q&A Exchange Log */}
          <div className="space-y-4">
            {meetingExchanges.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-2">
                <div className="text-sm font-semibold text-slate-800">
                  No questions asked for this meeting yet
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select any suggested question above (such as <em>"Who is responsible for the database?"</em>) or type your own question to query the meeting context.
                </p>
              </div>
            ) : (
              meetingExchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
                >
                  {/* User Question */}
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-mono text-slate-400 block mb-0.5">
                        Question · {exchange.timestamp}
                      </span>
                      <h3 className="text-sm sm:text-base font-semibold text-slate-900">
                        {exchange.question}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-mono shrink-0 flex items-center gap-1 ${
                        exchange.grounded ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {exchange.grounded ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified in Context
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          Not in Meeting
                        </>
                      )}
                    </span>
                  </div>

                  {/* AI Grounded Answer */}
                  <div className="text-sm sm:text-base text-slate-800 leading-relaxed">
                    {exchange.answer}
                  </div>

                  {/* Supporting Evidence from Transcript */}
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200/70 text-xs text-slate-600 font-mono">
                    <span className="font-semibold text-slate-700">Source Evidence: </span>
                    {exchange.evidence}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Grounding Reference Column (4 cols) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900 font-display">
                Hallucination Control Policy
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              The Q&A model operates at <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">temperature: 0.0</code> with strict context boundaries:
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                1. Answers are derived <strong>exclusively</strong> from the active meeting transcript, extracted tasks, decisions, and project change log.
              </li>
              <li>
                2. If an answer is absent from the meeting notes, the assistant responds verbatim:{' '}
                <em className="text-slate-900 font-medium">
                  "I couldn't find this information in the meeting."
                </em>
              </li>
              <li>
                3. Every answer cites its supporting evidence from the transcript.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
              <FileText className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-900 font-display">
                Active Meeting Transcript Reference
              </h2>
            </div>
            <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-50 p-3.5 rounded-md border border-slate-200/70">
              {activeMeeting.transcript}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
};
