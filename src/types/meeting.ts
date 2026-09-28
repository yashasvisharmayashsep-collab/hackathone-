export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type RiskLevel = 'High Risk' | 'Medium Risk' | 'Low Risk';

export interface ActionTask {
  id: string;
  task: string;
  owner: string;
  deadline: string;
  priority: TaskPriority;
  priority_reason: string;
  status: TaskStatus;
  risk: RiskLevel;
  risk_reason: string;
}

export interface DecisionItem {
  id: string;
  decision: string;
  context: string;
}

export interface DiscussionItem {
  id: string;
  topic: string;
  quote_or_summary: string;
  outcome: 'Final Decision' | 'Unresolved' | 'General Discussion';
}

export interface UnresolvedTopic {
  id: string;
  topic: string;
  status: string;
  discussed_by: string;
  context: string;
}

export interface ChangeDetected {
  id: string;
  change_type:
    | 'Deadline Changed'
    | 'Task Reassigned'
    | 'Decision Changed'
    | 'Task Completed'
    | 'New Task Added';
  subject: string;
  previous_value: string;
  current_value: string;
  details: string;
}

export interface MeetingRecord {
  id: string;
  project: string;
  title: string;
  date: string;
  createdAt: string;
  transcript: string;
  summary: string;
  participants: string[];
  decisions: DecisionItem[];
  discussions: DiscussionItem[];
  tasks: ActionTask[];
  unresolved_topics: UnresolvedTopic[];
  important_points: string[];
  changes_detected: ChangeDetected[];
}

export interface QAExchange {
  id: string;
  meetingId: string;
  question: string;
  answer: string;
  grounded: boolean;
  evidence: string;
  timestamp: string;
}

export interface SampleTranscript {
  id: string;
  label: string;
  project: string;
  title: string;
  date: string;
  description: string;
  transcript: string;
}
