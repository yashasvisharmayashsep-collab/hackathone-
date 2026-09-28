import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Search,
  RefreshCw,
  FileText,
  ArrowRight,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import type { MeetingRecord, TaskStatus } from '../types/meeting';

interface DashboardViewProps {
  meeting: MeetingRecord;
  allMeetings: MeetingRecord[];
  selectedParticipant: string;
  onSelectParticipant: (participant: string) => void;
  onUpdateTaskStatus: (meetingId: string, taskId: string, status: TaskStatus) => void;
  onNavigate: (tab: 'dashboard' | 'analyze' | 'mytasks' | 'history' | 'ask' | 'datascience') => void;
  onSelectMeeting: (meetingId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  meeting,
  allMeetings,
  selectedParticipant,
  onSelectParticipant,
  onUpdateTaskStatus,
  onNavigate,
  onSelectMeeting
}) => {
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | 'RiskyOnly'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);

  const completedTasks = meeting.tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = meeting.tasks.filter((t) => t.status === 'In Progress').length;
  const pendingTasks = meeting.tasks.filter((t) => t.status !== 'Completed').length;
  const riskyTasks = meeting.tasks.filter(
    (t) => t.risk === 'High Risk' || t.risk === 'Medium Risk'
  );
  const highRiskCount = meeting.tasks.filter((t) => t.risk === 'High Risk').length;

  const filteredTasks = meeting.tasks.filter((task) => {
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesRisk =
      riskFilter === 'All' || task.risk === 'High Risk' || task.risk === 'Medium Risk';
    const matchesParticipant =
      selectedParticipant === 'All' ||
      task.owner.toLowerCase() === selectedParticipant.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      task.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.deadline.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesRisk && matchesParticipant && matchesSearch;
  });

  const projectMeetings = allMeetings.filter(
    (m) => m.project.toLowerCase() === meeting.project.toLowerCase()
  );

  return (
    <div className="space-y-8">
      {/* Header & Quick Context */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">{meeting.project}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{meeting.date}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{meeting.participants.length} Participants</span>
            {selectedParticipant !== 'All' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-indigo-700 font-medium">
                  Filtered by Participant: {selectedParticipant}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            {meeting.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            {showTranscript ? 'Hide Raw Transcript' : 'View Source Transcript'}
          </button>
          <button
            onClick={() => onNavigate('ask')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            Ask This Meeting
          </button>
          <button
            onClick={() => onNavigate('analyze')}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            + Analyze New Meeting
          </button>
        </div>
      </div>

      {/* Collapsible Source Transcript */}
      {showTranscript && (
        <div className="bg-slate-900 text-slate-100 rounded-lg p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">
              Source Meeting Transcript · {meeting.title} ({meeting.date})
            </span>
            <button
              onClick={() => setShowTranscript(false)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
          <pre className="text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
            {meeting.transcript}
          </pre>
        </div>
      )}

      {/* Objective Meeting Overview Metrics (Section 13: No misleading overall meeting score) */}
      <section aria-label="Meeting Overview Metrics">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Meeting Overview</h2>
          <span className="text-xs text-slate-500">
            Objective extraction counts · Grounded in meeting transcript
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 bg-white border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Participants</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {meeting.participants.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 truncate">
              {meeting.participants.join(', ') || 'Not specified'}
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Total Tasks</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {meeting.tasks.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {inProgressTasks > 0 ? `${inProgressTasks} in progress` : 'Extracted items'}
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Completed</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-700">
              {completedTasks}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Verified done
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Pending / Active</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-amber-700">
              {pendingTasks}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Awaiting completion
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Decisions</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
              {meeting.decisions.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Finalized choices
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Unresolved Topics</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-amber-700">
              {meeting.unresolved_topics.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Decision pending
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs text-slate-500 mb-1">Potential Risks</div>
            <div className="text-2xl font-semibold font-mono tabular-nums text-red-600">
              {riskyTasks.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {highRiskCount} high · {riskyTasks.length - highRiskCount} medium
            </div>
          </div>
        </div>
      </section>

      {/* Executive Summary & Participants Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 font-display">
              Meeting Summary
            </h2>
            <span className="text-xs text-slate-500">AI-Synthesized Overview</span>
          </div>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {meeting.summary}
          </p>

          {meeting.important_points && meeting.important_points.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Key Takeaways & Milestones
              </div>
              <ul className="space-y-1.5">
                {meeting.important_points.map((pt, index) => (
                  <li key={index} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                    <span className="font-mono text-slate-400 select-none">0{index + 1}.</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Participant Filter / Personal AI Assistant Quick Switcher */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Participants & Owners
              </h2>
              <UserCheck className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select a participant to filter action items or inspect individual responsibilities.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => onSelectParticipant('All')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedParticipant === 'All'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({meeting.tasks.length})
              </button>
              {meeting.participants.map((person) => {
                const count = meeting.tasks.filter(
                  (t) => t.owner.toLowerCase() === person.toLowerCase()
                ).length;
                const active = selectedParticipant.toLowerCase() === person.toLowerCase();
                return (
                  <button
                    key={person}
                    onClick={() => onSelectParticipant(active ? 'All' : person)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {person} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Need personal task view?
            </span>
            <button
              onClick={() => onNavigate('mytasks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 whitespace-nowrap"
            >
              Open My Tasks
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Change Tracking Alert Banner (If changes detected or prompt to compare Project Alpha meetings) */}
      {meeting.changes_detected && meeting.changes_detected.length > 0 ? (
        <section className="bg-white border border-indigo-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0" />
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Change Tracking — Changes Detected from Previous {meeting.project} Meeting
              </h2>
            </div>
            <span className="text-xs font-mono tabular-nums text-indigo-700">
              {meeting.changes_detected.length} {meeting.changes_detected.length === 1 ? 'change' : 'changes'} identified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meeting.changes_detected.map((chg) => (
              <div
                key={chg.id}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold mb-1">
                    <span>{chg.change_type}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-700 font-medium">{chg.subject}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{chg.details}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-2 rounded border border-slate-200">
                  <span className="text-slate-500 line-through truncate max-w-[45%]">
                    {chg.previous_value}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-slate-900 font-semibold truncate max-w-[45%]">
                    {chg.current_value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        projectMeetings.length > 1 && (
          <div className="bg-white border border-slate-200 rounded-lg px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                Viewing baseline meeting for <strong>{meeting.project}</strong>. Switch to follow-up meetings to see automatic <strong>Change Tracking</strong> (deadline shifts, completed tasks, reassignments).
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {projectMeetings
                .filter((m) => m.id !== meeting.id)
                .slice(0, 2)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMeeting(m.id)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors whitespace-nowrap"
                  >
                    Compare: {m.date}
                  </button>
                ))}
            </div>
          </div>
        )
      )}

      {/* MAIN USP: Deadline Risk Detection & Unresolved Topics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deadline Risk Detector (Section 6) */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Deadline Risk Detection
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Explainable potential risks based on task scope, deadline proximity, dependencies, and owner clarity.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
              {riskyTasks.length} potential {riskyTasks.length === 1 ? 'risk' : 'risks'}
            </span>
          </div>

          {riskyTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No elevated deadline risks detected in this meeting's action items.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {riskyTasks.map((item) => (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <div className="text-sm font-semibold text-slate-900">
                      {item.task}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono tabular-nums shrink-0">
                      <span
                        className={
                          item.risk === 'High Risk'
                            ? 'text-red-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        ⚠ {item.risk}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-600">Due: {item.deadline}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-slate-600">Owner: {item.owner}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong className="font-medium text-slate-800">Potential Risk Reason:</strong>{' '}
                    {item.risk_reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Unresolved Discussion Detector (Section 12) */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Unresolved Topics
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Discussions raised during the meeting without a final decision.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              {meeting.unresolved_topics.length} open
            </span>
          </div>

          {meeting.unresolved_topics.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              All discussed topics reached a resolution in this meeting.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {meeting.unresolved_topics.map((topic) => (
                <div key={topic.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {topic.topic}
                    </span>
                    <span className="text-xs font-mono text-amber-700 shrink-0">
                      {topic.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-1.5">{topic.context}</p>
                  <div className="text-xs text-slate-500">
                    Raised by {topic.discussed_by || 'Team'} · Follow-up required
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Action Items & Interactive Task Management Table (Sections 4, 5, 14) */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 font-display">
              Action Items & Smart Priority Recommendations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Priorities are AI-generated recommendations based on context and urgency. Update task status to persist locally.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks or owners..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 w-48"
              />
            </div>

            {/* Segmented Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['All', 'Pending', 'In Progress', 'Completed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Risk Filter Toggle */}
            <button
              onClick={() => setRiskFilter(riskFilter === 'All' ? 'RiskyOnly' : 'All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                riskFilter === 'RiskyOnly'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {riskFilter === 'RiskyOnly' ? 'Showing Risky Tasks Only' : 'Filter by Risk'}
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600 mb-2">
              No action items match the active filters.
            </p>
            <button
              onClick={() => {
                setStatusFilter('All');
                setRiskFilter('All');
                setSearchQuery('');
                onSelectParticipant('All');
              }}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4 w-10 font-mono">#</th>
                  <th className="py-3 px-4">Task & AI Rationale</th>
                  <th className="py-3 px-4">Responsible Owner</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">AI Priority (Rec.)</th>
                  <th className="py-3 px-4">Deadline Risk</th>
                  <th className="py-3 px-4 text-right">Task Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredTasks.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors align-top"
                  >
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-400">
                      0{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div
                        className={`font-medium ${
                          item.status === 'Completed'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.task}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {item.priority_reason}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          item.owner !== 'Not specified' && onSelectParticipant(item.owner)
                        }
                        className={`text-xs font-medium ${
                          item.owner === 'Not specified'
                            ? 'text-amber-700 italic'
                            : 'text-slate-800 hover:text-indigo-600 underline decoration-slate-300 underline-offset-2'
                        }`}
                      >
                        {item.owner}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap">
                      {item.deadline}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          item.priority === 'High'
                            ? 'text-red-700'
                            : item.priority === 'Medium'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        AI Recommended
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div
                        className={`text-xs font-semibold ${
                          item.risk === 'High Risk'
                            ? 'text-red-700'
                            : item.risk === 'Medium Risk'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {item.risk}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.risk_reason}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
                        {(['Pending', 'In Progress', 'Completed'] as const).map((statusOption) => {
                          const active = item.status === statusOption;
                          return (
                            <button
                              key={statusOption}
                              onClick={() =>
                                onUpdateTaskStatus(meeting.id, item.id, statusOption)
                              }
                              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                                active
                                  ? statusOption === 'Completed'
                                    ? 'bg-emerald-600 text-white'
                                    : statusOption === 'In Progress'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white text-slate-900 shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 11: Final Decisions vs. General Discussion Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Final Decisions */}
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Final Decisions
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirmed outcomes separated from exploratory debate.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              {meeting.decisions.length} confirmed
            </span>
          </div>

          {meeting.decisions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No final decisions recorded in this meeting.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {meeting.decisions.map((dec, idx) => (
                <div key={dec.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-xs text-emerald-700 font-semibold mt-0.5">
                      0{idx + 1}.
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {dec.decision}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{dec.context}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Decision vs Discussion Separation Log */}
        <section className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                <h2 className="text-base font-semibold text-slate-900 font-display">
                  Discussion vs. Decision Log
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Distinguishes open questions ("Should we use React or Angular?") from final decisions.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600">
              {meeting.discussions.length} threads
            </span>
          </div>

          {meeting.discussions.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No separate discussion threads extracted.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {meeting.discussions.map((disc) => (
                <div key={disc.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {disc.topic}
                    </span>
                    <span
                      className={`text-xs font-mono shrink-0 ${
                        disc.outcome === 'Final Decision'
                          ? 'text-emerald-700 font-semibold'
                          : disc.outcome === 'Unresolved'
                          ? 'text-amber-700 font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      Outcome: {disc.outcome}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{disc.quote_or_summary}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
