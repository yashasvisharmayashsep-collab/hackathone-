import React, { useState } from 'react';
import {
  History,
  RefreshCw,
  ArrowRight,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import type { MeetingRecord } from '../types/meeting';

interface MeetingHistoryViewProps {
  meetings: MeetingRecord[];
  activeMeetingId: string;
  onSelectMeeting: (meetingId: string) => void;
  onDeleteMeeting: (meetingId: string) => void;
  onResetDemoMeetings: () => void;
  onNavigateDashboard: () => void;
}

export const MeetingHistoryView: React.FC<MeetingHistoryViewProps> = ({
  meetings,
  activeMeetingId,
  onSelectMeeting,
  onDeleteMeeting,
  onResetDemoMeetings,
  onNavigateDashboard
}) => {
  const projects = Array.from(new Set(meetings.map((m) => m.project)));
  const [selectedProject, setSelectedProject] = useState<string>('All');

  const filteredMeetings =
    selectedProject === 'All'
      ? meetings
      : meetings.filter((m) => m.project === selectedProject);

  // Collect all changes detected across filtered meetings
  const allChanges = filteredMeetings.flatMap((m) =>
    (m.changes_detected || []).map((c) => ({
      ...c,
      meetingTitle: m.title,
      meetingDate: m.date,
      meetingId: m.id,
      project: m.project
    }))
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            Meeting Memory & Cross-Meeting Evolution
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            Meeting History & Change Tracking
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Browse stored meetings across projects, inspect historical decisions and action items, and track deadline shifts, task reassignments, and resolved bottlenecks over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setSelectedProject('All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedProject === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Projects ({meetings.length})
            </button>
            {projects.map((proj) => (
              <button
                key={proj}
                onClick={() => setSelectedProject(proj)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedProject === proj
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {proj}
              </button>
            ))}
          </div>

          <button
            onClick={onResetDemoMeetings}
            className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Restore default Project Alpha demo meetings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Store
          </button>
        </div>
      </div>

      {/* Section 10: Cross-Meeting Change Tracking Log */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0" />
              <h2 className="text-base font-semibold text-slate-900 font-display">
                Project Change Tracking Log
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically detects deadline shifts, task reassignments, completed items, and decision updates between sequential project meetings.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600">
            {allChanges.length} tracked {allChanges.length === 1 ? 'change' : 'changes'}
          </span>
        </div>

        {allChanges.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            No multi-meeting changes recorded for this filter yet. Analyze a follow-up meeting under the same project name to detect changes automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Change Type</th>
                  <th className="py-3 px-4">Subject / Task</th>
                  <th className="py-3 px-4">Previous State</th>
                  <th className="py-3 px-4">Updated State</th>
                  <th className="py-3 px-4">Detected In</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {allChanges.map((chg) => (
                  <tr key={chg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-indigo-700">
                        🔄 {chg.change_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{chg.subject}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{chg.details}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 line-through">
                      {chg.previous_value}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">
                      {chg.current_value}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {chg.meetingDate} · {chg.project}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          onSelectMeeting(chg.meetingId);
                          onNavigateDashboard();
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Inspect Meeting
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 9: Stored Meetings Timeline */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 font-display flex items-center gap-2">
            <History className="w-4 h-4 text-slate-600" />
            Stored Meetings ({filteredMeetings.length})
          </h2>
          <span className="text-xs text-slate-500">
            Select any meeting to load its full dashboard, tasks, and Q&A context
          </span>
        </div>

        <div className="space-y-4">
          {filteredMeetings.map((m) => {
            const isSelected = m.id === activeMeetingId;
            const completedCount = m.tasks.filter((t) => t.status === 'Completed').length;
            const riskCount = m.tasks.filter(
              (t) => t.risk === 'High Risk' || t.risk === 'Medium Risk'
            ).length;

            return (
              <div
                key={m.id}
                className={`bg-white rounded-lg border transition-colors p-6 ${
                  isSelected
                    ? 'border-slate-900 ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{m.project}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{m.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>Participants: {m.participants.join(', ')}</span>
                      {isSelected && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-indigo-700">
                            Active in Workspace
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      {m.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectMeeting(m.id);
                        onNavigateDashboard();
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Open in Dashboard' : 'Load Meeting'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {meetings.length > 1 && (
                      <button
                        onClick={() => onDeleteMeeting(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete meeting from local store"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  {m.summary}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200/60">
                    <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Decisions ({m.decisions.length})
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {m.decisions.slice(0, 2).map((d) => (
                        <li key={d.id} className="truncate">
                          · {d.decision}
                        </li>
                      ))}
                      {m.decisions.length === 0 && <li>None recorded</li>}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200/60">
                    <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Action Items ({m.tasks.length} total · {completedCount} done · {riskCount} risky)
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {m.tasks.slice(0, 2).map((t) => (
                        <li key={t.id} className="truncate">
                          · {t.owner}: {t.task} ({t.deadline})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200/60">
                    <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      Unresolved Topics ({m.unresolved_topics.length})
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {m.unresolved_topics.map((u) => (
                        <li key={u.id} className="truncate">
                          · {u.topic} ({u.status})
                        </li>
                      ))}
                      {m.unresolved_topics.length === 0 && <li>All resolved</li>}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
