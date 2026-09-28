/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  UserCheck,
  History,
  MessageSquare,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { INITIAL_MEETINGS } from './data/sampleData';
import type { MeetingRecord, QAExchange, TaskStatus } from './types/meeting';
import { DashboardView } from './components/DashboardView';
import { AnalyzeMeetingView } from './components/AnalyzeMeetingView';
import { MyTasksView } from './components/MyTasksView';
import { MeetingHistoryView } from './components/MeetingHistoryView';
import { AskMeetingView } from './components/AskMeetingView';
import { DataScienceEvalView } from './components/DataScienceEvalView';

type ActiveTab = 'dashboard' | 'analyze' | 'mytasks' | 'history' | 'ask' | 'datascience';

const LOCAL_STORAGE_KEY = 'ai_meeting_copilot_meetings_v1';
const LOCAL_QA_KEY = 'ai_meeting_copilot_qa_v1';

const INITIAL_QA_HISTORY: QAExchange[] = [
  {
    id: 'qa-seed-1',
    meetingId: 'meeting-alpha-1',
    question: 'Who is responsible for the database?',
    answer:
      'Aman is responsible for working on the database integration, and he committed to finishing it by Saturday.',
    grounded: true,
    evidence: 'Aman: "I will work on the database integration and finish it by Saturday."',
    timestamp: 'Demo Verified'
  },
  {
    id: 'qa-seed-2',
    meetingId: 'meeting-alpha-1',
    question: 'What topics are unresolved?',
    answer:
      'Cloud provider selection is currently unresolved. Aman noted that the team still needs to decide which cloud provider to use.',
    grounded: true,
    evidence: 'Aman: "We still need to decide which cloud provider to use."',
    timestamp: 'Demo Verified'
  }
];

export default function App() {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_e) {
      // ignore localStorage read error
    }
    return INITIAL_MEETINGS;
  });

  const [activeMeetingId, setActiveMeetingId] = useState<string>(
    () => meetings[0]?.id || INITIAL_MEETINGS[0].id
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('All');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [qaHistory, setQaHistory] = useState<QAExchange[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_QA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_e) {
      // ignore
    }
    return INITIAL_QA_HISTORY;
  });
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [prefilledQuestion, setPrefilledQuestion] = useState<string>('');

  // Sync from server on mount
  useEffect(() => {
    fetch('/api/meetings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.meetings) && data.meetings.length > 0) {
          setMeetings(data.meetings);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.meetings));
        }
      })
      .catch(() => {
        // Keep local state if offline
      });
  }, []);

  // Persist meetings to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(meetings));
    } catch (_e) {
      // ignore
    }
  }, [meetings]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_QA_KEY, JSON.stringify(qaHistory));
    } catch (_e) {
      // ignore
    }
  }, [qaHistory]);

  const activeMeeting =
    meetings.find((m) => m.id === activeMeetingId) || meetings[0] || INITIAL_MEETINGS[0];

  // Update task status locally & on server
  const handleUpdateTaskStatus = useCallback(
    async (meetingId: string, taskId: string, status: TaskStatus) => {
      setMeetings((prev) =>
        prev.map((m) => {
          if (m.id !== meetingId) return m;
          return {
            ...m,
            tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
          };
        })
      );

      try {
        await fetch(`/api/meetings/${meetingId}/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (_err) {
        // Already persisted in state/localStorage
      }
    },
    []
  );

  // Analyze new meeting transcript
  const handleAnalyzeMeeting = async (payload: {
    transcript: string;
    project: string;
    title: string;
    date: string;
  }) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const response = await fetch('/api/meetings/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze meeting transcript.');
      }

      if (data.meeting) {
        const updatedList: MeetingRecord[] = Array.isArray(data.meetings)
          ? data.meetings
          : [data.meeting, ...meetings];
        setMeetings(updatedList);
        setActiveMeetingId(data.meeting.id);
        setSelectedParticipant('All');
        setActiveTab('dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unexpected error analyzing meeting.';
      setAnalyzeError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete a meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    const remaining = meetings.filter((m) => m.id !== meetingId);
    if (remaining.length === 0) return;
    setMeetings(remaining);
    if (activeMeetingId === meetingId) {
      setActiveMeetingId(remaining[0].id);
    }
    try {
      await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
    } catch (_err) {
      // ignore
    }
  };

  // Reset demo meetings
  const handleResetDemoMeetings = async () => {
    setMeetings(INITIAL_MEETINGS);
    setActiveMeetingId(INITIAL_MEETINGS[0].id);
    setSelectedParticipant('All');
    setQaHistory(INITIAL_QA_HISTORY);
    try {
      await fetch('/api/meetings/reset', { method: 'POST' });
    } catch (_err) {
      // ignore
    }
  };

  // Ask My Meeting (Grounded Q&A)
  const handleAskQuestion = async (question: string) => {
    setIsAsking(true);
    try {
      const projectMeetings = meetings.filter(
        (m) => m.project.toLowerCase() === activeMeeting.project.toLowerCase()
      );

      const response = await fetch('/api/meetings/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          meeting: activeMeeting,
          selectedParticipant: selectedParticipant === 'All' ? undefined : selectedParticipant,
          projectMeetings
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get an answer from the meeting context.');
      }

      const newExchange: QAExchange = {
        id: `qa-${Date.now()}`,
        meetingId: activeMeeting.id,
        question,
        answer: data.answer || "I couldn't find this information in the meeting.",
        grounded: Boolean(data.grounded),
        evidence: data.evidence || 'Not found in meeting transcript',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setQaHistory((prev) => [newExchange, ...prev]);
    } catch (_err) {
      // Deterministic grounded fallback if API fails
      const qLower = question.toLowerCase();
      let answer = "I couldn't find this information in the meeting.";
      let grounded = false;
      let evidence = 'Not found in meeting transcript';

      if (qLower.includes('database') && (qLower.includes('who') || qLower.includes('deadline'))) {
        const dbTask = activeMeeting.tasks.find((t) =>
          t.task.toLowerCase().includes('database')
        );
        if (dbTask) {
          answer = `${dbTask.owner} is responsible for "${dbTask.task}" with a deadline of ${dbTask.deadline} (Status: ${dbTask.status}).`;
          grounded = true;
          evidence = `Task: ${dbTask.task} · Owner: ${dbTask.owner} · Deadline: ${dbTask.deadline}`;
        }
      } else if (qLower.includes('frontend')) {
        const feTask = activeMeeting.tasks.find((t) =>
          t.task.toLowerCase().includes('frontend') || t.task.toLowerCase().includes('dashboard')
        );
        if (feTask) {
          answer = `${feTask.owner} is responsible for "${feTask.task}" with a deadline of ${feTask.deadline} (Status: ${feTask.status}).`;
          grounded = true;
          evidence = `Task: ${feTask.task} · Owner: ${feTask.owner} · Deadline: ${feTask.deadline}`;
        }
      } else if (qLower.includes('decide') || qLower.includes('decision')) {
        if (activeMeeting.decisions.length > 0) {
          answer = activeMeeting.decisions.map((d) => d.decision).join('; ');
          grounded = true;
          evidence = activeMeeting.decisions.map((d) => d.context).join(' | ');
        }
      } else if (qLower.includes('unresolved')) {
        if (activeMeeting.unresolved_topics.length > 0) {
          answer = activeMeeting.unresolved_topics
            .map((u) => `${u.topic} (${u.status})`)
            .join('; ');
          grounded = true;
          evidence = activeMeeting.unresolved_topics.map((u) => u.context).join(' | ');
        }
      } else if (qLower.includes('pending')) {
        const pending = activeMeeting.tasks.filter((t) => t.status !== 'Completed');
        if (pending.length > 0) {
          answer = `Pending tasks: ${pending
            .map((t) => `${t.task} (${t.owner}, due ${t.deadline})`)
            .join('; ')}.`;
          grounded = true;
          evidence = `${pending.length} pending tasks in ${activeMeeting.title}`;
        }
      } else if (qLower.includes('change')) {
        if (activeMeeting.changes_detected.length > 0) {
          answer = activeMeeting.changes_detected
            .map(
              (c) =>
                `${c.change_type} on ${c.subject}: ${c.previous_value} → ${c.current_value}`
            )
            .join('; ');
          grounded = true;
          evidence = activeMeeting.changes_detected.map((c) => c.details).join(' | ');
        }
      }

      const fallbackExchange: QAExchange = {
        id: `qa-${Date.now()}`,
        meetingId: activeMeeting.id,
        question,
        answer,
        grounded,
        evidence,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setQaHistory((prev) => [fallbackExchange, ...prev]);
    } finally {
      setIsAsking(false);
    }
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Meeting', shortLabel: 'Analyze', icon: FilePlus2 },
    { id: 'mytasks', label: 'My Tasks', shortLabel: 'My Tasks', icon: UserCheck },
    { id: 'history', label: 'Meeting History', shortLabel: 'History', icon: History },
    { id: 'ask', label: 'Ask Meeting', shortLabel: 'Ask Meeting', icon: MessageSquare },
    {
      id: 'datascience',
      label: 'Data Science & Eval',
      shortLabel: 'ML Pipeline',
      icon: SlidersHorizontal
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: Strictly 3 Zones (Brand Wordmark | 5 Nav Links | 2 Primary Actions) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap"
        >
          AI Meeting Copilot
        </a>

        {/* Zone 2: 5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.slice(0, 5).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-slate-900 font-semibold underline decoration-slate-900 decoration-2 underline-offset-8'
                    : 'hover:text-slate-900'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('datascience')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              activeTab === 'datascience'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            ML Pipeline & Eval
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            + Analyze Meeting
          </button>
        </div>
      </header>

      {/* Main Workspace Container (Sidebar + Content Viewport) */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* Left Workspace Sidebar */}
        <aside className="w-full lg:w-[272px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Active Meeting Memory Selector */}
            <div>
              <label
                htmlFor="sidebar-meeting-select"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Active Meeting Memory ({meetings.length})
              </label>
              <select
                id="sidebar-meeting-select"
                value={activeMeeting.id}
                onChange={(e) => setActiveMeetingId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
              >
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.project} · {m.date} ({m.title})
                  </option>
                ))}
              </select>
            </div>

            {/* Sidebar Navigation */}
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">
                Workspace Views
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 hidden lg:block ${
                          active ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal AI Assistant ("Who are you?") Sidebar Widget */}
            <div className="pt-5 border-t border-slate-200">
              <label
                htmlFor="sidebar-who-are-you"
                className="block text-xs font-semibold text-slate-800 mb-1"
              >
                Personal Assistant: Who are you?
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Filter action items by participant responsibility.
              </p>
              <select
                id="sidebar-who-are-you"
                value={selectedParticipant}
                onChange={(e) => {
                  setSelectedParticipant(e.target.value);
                  if (e.target.value !== 'All' && activeTab !== 'dashboard') {
                    setActiveTab('mytasks');
                  }
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400"
              >
                <option value="All">All Participants ({activeMeeting.tasks.length} tasks)</option>
                {activeMeeting.participants.map((person) => {
                  const count = activeMeeting.tasks.filter(
                    (t) => t.owner.toLowerCase() === person.toLowerCase()
                  ).length;
                  return (
                    <option key={person} value={person}>
                      {person} ({count} {count === 1 ? 'task' : 'tasks'})
                    </option>
                  );
                })}
                <option value="Not specified">Unassigned Tasks</option>
              </select>
            </div>

            {/* 2-Minute Hackathon Presentation Flow Shortcuts */}
            <div className="hidden lg:block pt-5 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-800 mb-2">
                Hackathon Demo Sequence
              </div>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setActiveTab('analyze')}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors truncate"
                >
                  01. Load & Analyze Sample Meeting
                </button>
                <button
                  onClick={() => {
                    setActiveMeetingId('meeting-alpha-1');
                    setSelectedParticipant('All');
                    setActiveTab('dashboard');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors truncate"
                >
                  02. View Summary, Risks & Unresolved
                </button>
                <button
                  onClick={() => {
                    setSelectedParticipant('Rahul');
                    setActiveTab('mytasks');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors truncate"
                >
                  03. Personal View: Select "Rahul"
                </button>
                <button
                  onClick={() => {
                    setActiveMeetingId('meeting-alpha-1');
                    setActiveTab('ask');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors truncate"
                >
                  04. Ask: "Who owns the database?"
                </button>
                <button
                  onClick={() => {
                    setActiveMeetingId('meeting-alpha-2');
                    setActiveTab('history');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors truncate"
                >
                  05. View Memory & Change Tracking
                </button>
              </div>
            </div>
          </div>

          {/* Quiet Footer */}
          <div className="hidden lg:block pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            AI Meeting Copilot · From Meeting → Understanding → Action → Follow-up
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              meeting={activeMeeting}
              allMeetings={meetings}
              selectedParticipant={selectedParticipant}
              onSelectParticipant={setSelectedParticipant}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onNavigate={setActiveTab}
              onSelectMeeting={setActiveMeetingId}
            />
          )}

          {activeTab === 'analyze' && (
            <AnalyzeMeetingView
              onAnalyze={handleAnalyzeMeeting}
              isAnalyzing={isAnalyzing}
              error={analyzeError}
            />
          )}

          {activeTab === 'mytasks' && (
            <MyTasksView
              activeMeeting={activeMeeting}
              allMeetings={meetings}
              selectedParticipant={selectedParticipant}
              onSelectParticipant={setSelectedParticipant}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onAskQuestion={(q) => {
                setPrefilledQuestion(q);
                setActiveTab('ask');
              }}
            />
          )}

          {activeTab === 'history' && (
            <MeetingHistoryView
              meetings={meetings}
              activeMeetingId={activeMeeting.id}
              onSelectMeeting={setActiveMeetingId}
              onDeleteMeeting={handleDeleteMeeting}
              onResetDemoMeetings={handleResetDemoMeetings}
              onNavigateDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'ask' && (
            <AskMeetingView
              activeMeeting={activeMeeting}
              allMeetings={meetings}
              selectedParticipant={selectedParticipant}
              qaHistory={qaHistory}
              onAskQuestion={handleAskQuestion}
              onClearHistory={() =>
                setQaHistory((prev) => prev.filter((item) => item.meetingId !== activeMeeting.id))
              }
              isAsking={isAsking}
              prefilledQuestion={prefilledQuestion}
              onClearPrefill={() => setPrefilledQuestion('')}
            />
          )}

          {activeTab === 'datascience' && <DataScienceEvalView meeting={activeMeeting} />}
        </main>
      </div>
    </div>
  );
}
