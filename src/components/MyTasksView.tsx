import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare
} from 'lucide-react';
import type { MeetingRecord, TaskStatus } from '../types/meeting';

interface MyTasksViewProps {
  activeMeeting: MeetingRecord;
  allMeetings: MeetingRecord[];
  selectedParticipant: string;
  onSelectParticipant: (participant: string) => void;
  onUpdateTaskStatus: (meetingId: string, taskId: string, status: TaskStatus) => void;
  onAskQuestion: (prefillQuestion: string) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  activeMeeting,
  allMeetings,
  selectedParticipant,
  onSelectParticipant,
  onUpdateTaskStatus,
  onAskQuestion
}) => {
  const [scope, setScope] = useState<'active' | 'all'>('active');

  // Gather all unique participants across meetings + active meeting
  const availableParticipants = useMemo(() => {
    const set = new Set<string>();
    activeMeeting.participants.forEach((p) => set.add(p));
    activeMeeting.tasks.forEach((t) => {
      if (t.owner && t.owner !== 'Not specified') set.add(t.owner);
    });
    if (scope === 'all') {
      allMeetings.forEach((m) => {
        m.participants.forEach((p) => set.add(p));
        m.tasks.forEach((t) => {
          if (t.owner && t.owner !== 'Not specified') set.add(t.owner);
        });
      });
    }
    return Array.from(set);
  }, [activeMeeting, allMeetings, scope]);

  // Default to first participant (e.g. Rahul) if 'All' is currently selected so the "Who are you?" demo works immediately, while still allowing 'All'
  const effectivePerson =
    selectedParticipant === 'All' && availableParticipants.length > 0
      ? availableParticipants[0]
      : selectedParticipant;

  const sourceMeetings = scope === 'active' ? [activeMeeting] : allMeetings;

  const personalTasks = useMemo(() => {
    const list: Array<{
      meetingId: string;
      meetingTitle: string;
      meetingDate: string;
      task: MeetingRecord['tasks'][number];
    }> = [];

    sourceMeetings.forEach((m) => {
      m.tasks.forEach((t) => {
        if (
          effectivePerson === 'All' ||
          t.owner.toLowerCase() === effectivePerson.toLowerCase()
        ) {
          list.push({
            meetingId: m.id,
            meetingTitle: m.title,
            meetingDate: m.date,
            task: t
          });
        }
      });
    });

    return list;
  }, [sourceMeetings, effectivePerson]);

  const pendingCount = personalTasks.filter((item) => item.task.status !== 'Completed').length;
  const completedCount = personalTasks.filter((item) => item.task.status === 'Completed').length;
  const riskyCount = personalTasks.filter(
    (item) => item.task.risk === 'High Risk' || item.task.risk === 'Medium Risk'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header & Participant Selector ("Who are you?") */}
      <div className="pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            Personal AI Assistant · Role-Scoped Responsibility View
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            My Action Items
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Select your name below to view your assigned deliverables, AI-recommended priorities, and potential deadline risks.
          </p>
        </div>

        {/* Scope Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start lg:self-auto">
          <button
            onClick={() => setScope('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              scope === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Meeting ({activeMeeting.date})
          </button>
          <button
            onClick={() => setScope('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              scope === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stored Meetings ({allMeetings.length})
          </button>
        </div>
      </div>

      {/* "Who are you?" Selector Card */}
      <section className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <label
              htmlFor="participant-select"
              className="text-sm font-semibold text-slate-900 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Who are you?
            </label>
            <p className="text-xs text-slate-500">
              Choose a participant from the dropdown or quick-select buttons to filter action items.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <select
                id="participant-select"
                value={effectivePerson}
                onChange={(e) => onSelectParticipant(e.target.value)}
                className="px-3.5 py-2 text-sm font-medium bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-slate-500"
              >
                {availableParticipants.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
                <option value="Not specified">Unassigned (Not specified)</option>
                <option value="All">All Participants</option>
              </select>

              <div className="flex flex-wrap items-center gap-1.5">
                {availableParticipants.map((person) => {
                  const isSelected = effectivePerson.toLowerCase() === person.toLowerCase();
                  return (
                    <button
                      key={person}
                      onClick={() => onSelectParticipant(person)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {person}
                    </button>
                  );
                })}
                <button
                  onClick={() => onSelectParticipant('Not specified')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    effectivePerson === 'Not specified'
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Unassigned
                </button>
              </div>
            </div>
          </div>

          {/* Personal Summary Metrics */}
          <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div>
              <div className="text-xs text-slate-500">Assigned</div>
              <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
                {personalTasks.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Pending</div>
              <div className="text-2xl font-semibold font-mono tabular-nums text-amber-700">
                {pendingCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Completed</div>
              <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-700">
                {completedCount}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Task List */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 font-display">
            {effectivePerson === 'All'
              ? 'All Team Action Items'
              : effectivePerson === 'Not specified'
              ? 'Unassigned Action Items Requiring an Owner'
              : `${effectivePerson}’s Action Items (${personalTasks.length})`}
          </h2>

          {effectivePerson !== 'All' && effectivePerson !== 'Not specified' && (
            <button
              onClick={() =>
                onAskQuestion(`What are ${effectivePerson}'s tasks and deadlines in this meeting?`)
              }
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask AI Copilot about {effectivePerson}'s workload
            </button>
          )}
        </div>

        {personalTasks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
            <p className="text-sm text-slate-600 mb-1">
              No action items found for <strong>{effectivePerson}</strong> in this view.
            </p>
            <p className="text-xs text-slate-500">
              Try selecting another participant or switching to "All Stored Meetings".
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
            {personalTasks.map(({ meetingId, meetingTitle, meetingDate, task }, idx) => (
              <div key={task.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-700">
                      0{idx + 1}.
                    </span>
                    <span>Owner: <strong className="text-slate-800">{task.owner}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Deadline: <strong className="text-slate-800">{task.deadline}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-semibold ${
                        task.priority === 'High'
                          ? 'text-red-700'
                          : task.priority === 'Medium'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }`}
                    >
                      Priority: {task.priority} (AI Rec.)
                    </span>
                    {scope === 'all' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{meetingTitle} ({meetingDate})</span>
                      </>
                    )}
                  </div>

                  <h3
                    className={`text-base font-semibold ${
                      task.status === 'Completed'
                        ? 'line-through text-slate-400'
                        : 'text-slate-900'
                    }`}
                  >
                    {task.task}
                  </h3>

                  <p className="text-xs text-slate-600">
                    {task.priority_reason}
                  </p>

                  {(task.risk === 'High Risk' || task.risk === 'Medium Risk') && (
                    <div className="pt-1 flex items-start gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>{task.risk}:</strong> {task.risk_reason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Control */}
                <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {(['Pending', 'In Progress', 'Completed'] as const).map((st) => {
                      const active = task.status === st;
                      return (
                        <button
                          key={st}
                          onClick={() => onUpdateTaskStatus(meetingId, task.id, st)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                            active
                              ? st === 'Completed'
                                ? 'bg-emerald-600 text-white'
                                : st === 'In Progress'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {st === 'In Progress' && <Clock className="w-3.5 h-3.5" />}
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {riskyCount > 0 && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-4">
            <span>
              <strong>Note:</strong> {effectivePerson} has {riskyCount}{' '}
              {riskyCount === 1 ? 'task' : 'tasks'} flagged with a potential deadline risk.
            </span>
          </div>
        )}
      </section>
    </div>
  );
};
