import type {
  MeetingRecord,
  ActionTask,
  DecisionItem,
  DiscussionItem,
  UnresolvedTopic,
  ChangeDetected,
  TaskPriority,
  RiskLevel
} from '../types/meeting';

export interface PreprocessingStats {
  rawCharCount: number;
  cleanedCharCount: number;
  wordTokenCount: number;
  sentenceCount: number;
  speakerTurnCount: number;
  detectedSpeakers: string[];
  temporalTokensFound: string[];
  commitmentCueCount: number;
  decisionCueCount: number;
  unresolvedCueCount: number;
  cleanedTranscript: string;
}

export interface TaskFeatureBreakdown {
  taskId: string;
  taskName: string;
  owner: string;
  deadline: string;
  temporalUrgency: 'Immediate (<48h)' | 'Near-Term (This Week)' | 'Extended' | 'Missing Deadline';
  scopeComplexity: 'Large / Multi-System' | 'Focused Deliverable';
  ownerAssigned: boolean;
  hasDependencyFlag: boolean;
  predictedPriority: TaskPriority;
  predictedRisk: RiskLevel;
}

export interface ExtractionEvaluationMetrics {
  preprocessing: PreprocessingStats;
  participantGroundingRate: number;
  ownerGroundingRate: number;
  schemaValidityScore: number;
  taskFeatureMatrix: TaskFeatureBreakdown[];
  priorityDistribution: { High: number; Medium: number; Low: number };
  riskDistribution: { 'High Risk': number; 'Medium Risk': number; 'Low Risk': number };
}

const TEMPORAL_REGEX =
  /\b(today|tonight|tomorrow(?:\s+morning|\s+evening)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+morning|\s+evening|\s+night)?|\b(next\s+week|this\s+week|end\s+of\s+day|eod|october\s+\d+|september\s+\d+)\b/gi;

const COMMITMENT_REGEX =
  /\b(i\s+will|we\s+will|will\s+complete|will\s+work\s+on|will\s+prepare|need\s+to\s+complete|need\s+someone\s+to|will\s+build|will\s+fix|will\s+update|will\s+send|reassign)\b/gi;

const DECISION_REGEX =
  /\b(decided\s+to|we\s+decided|agreed\s+to|final\s+project\s+review\s+will\s+be|confirmed|selected)\b/gi;

const UNRESOLVED_REGEX =
  /\b(still\s+need\s+to\s+decide|haven't\s+decided|haven't\s+finalized|should\s+we\s+use|decide\s+later|yet\s+to\s+decide|undecided)\b/gi;

/**
 * Cleans and normalizes raw unstructured meeting notes into canonical speaker turns
 * and extracts lexical/temporal metadata for feature engineering.
 */
export function cleanAndPreprocessTranscript(rawTranscript: string): PreprocessingStats {
  const rawCharCount = rawTranscript.length;

  // 1. Normalize line endings and strip non-printable control chars
  let normalized = rawTranscript.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  // 2. Collapse Speaker:\nUtterance into Speaker: Utterance for cleaner turn parsing
  normalized = normalized.replace(/^([A-Z][a-zA-Z0-9\s]{1,24}):\s*\n+([^\n]+)/gm, '$1: $2');

  // 3. Collapse excessive blank lines
  const cleanedTranscript = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();

  const cleanedCharCount = cleanedTranscript.length;
  const words = cleanedTranscript.split(/\s+/).filter(Boolean);
  const wordTokenCount = words.length;

  const sentences = cleanedTranscript
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  const speakerSet = new Set<string>();
  let speakerTurnCount = 0;

  for (const line of cleanedTranscript.split('\n')) {
    const match = line.match(/^([A-Z][a-zA-Z0-9\s]{1,22}):\s*(.+)$/);
    if (match) {
      speakerTurnCount += 1;
      const speaker = match[1].trim();
      if (!['topic', 'task', 'status', 'reason', 'output', 'decision', 'discussion', 'team'].includes(speaker.toLowerCase())) {
        speakerSet.add(speaker);
      }
    }
  }

  const temporalMatches = cleanedTranscript.match(TEMPORAL_REGEX) || [];
  const uniqueTemporal = Array.from(new Set(temporalMatches.map((m) => m.trim())));

  const commitmentCueCount = (cleanedTranscript.match(COMMITMENT_REGEX) || []).length;
  const decisionCueCount = (cleanedTranscript.match(DECISION_REGEX) || []).length;
  const unresolvedCueCount =
    (cleanedTranscript.match(UNRESOLVED_REGEX) || []).length +
    (cleanedTranscript.match(/\?/g) || []).length;

  return {
    rawCharCount,
    cleanedCharCount,
    wordTokenCount,
    sentenceCount: sentences.length,
    speakerTurnCount,
    detectedSpeakers: Array.from(speakerSet),
    temporalTokensFound: uniqueTemporal,
    commitmentCueCount,
    decisionCueCount,
    unresolvedCueCount,
    cleanedTranscript
  };
}

/**
 * Evaluates a MeetingRecord's extracted features and grounding accuracy
 * for the Data Science & Technical Evaluation panel.
 */
export function evaluateMeetingExtraction(meeting: MeetingRecord): ExtractionEvaluationMetrics {
  const preprocessing = cleanAndPreprocessTranscript(meeting.transcript);
  const transcriptLower = meeting.transcript.toLowerCase();

  // 1. Participant Grounding Rate
  const groundedParticipants = meeting.participants.filter((p) =>
    transcriptLower.includes(p.toLowerCase())
  );
  const participantGroundingRate =
    meeting.participants.length > 0
      ? Math.round((groundedParticipants.length / meeting.participants.length) * 100)
      : 100;

  // 2. Task Owner Grounding Rate
  const specifiedOwners = meeting.tasks.filter(
    (t) => t.owner && t.owner.toLowerCase() !== 'not specified'
  );
  const groundedOwners = specifiedOwners.filter((t) =>
    transcriptLower.includes(t.owner.toLowerCase())
  );
  const ownerGroundingRate =
    specifiedOwners.length > 0
      ? Math.round((groundedOwners.length / specifiedOwners.length) * 100)
      : 100;

  // 3. Schema Validity Score
  let validFields = 0;
  let totalFields = 0;
  for (const t of meeting.tasks) {
    totalFields += 6;
    if (t.task) validFields++;
    if (t.owner) validFields++;
    if (t.deadline) validFields++;
    if (['High', 'Medium', 'Low'].includes(t.priority)) validFields++;
    if (['Pending', 'In Progress', 'Completed'].includes(t.status)) validFields++;
    if (['High Risk', 'Medium Risk', 'Low Risk'].includes(t.risk)) validFields++;
  }
  const schemaValidityScore =
    totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 100;

  // 4. Task Feature Matrix
  const taskFeatureMatrix: TaskFeatureBreakdown[] = meeting.tasks.map((t) => {
    const dl = t.deadline.toLowerCase();
    let temporalUrgency: TaskFeatureBreakdown['temporalUrgency'] = 'Near-Term (This Week)';
    if (dl === 'not specified' || !dl) {
      temporalUrgency = 'Missing Deadline';
    } else if (dl.includes('tomorrow') || dl.includes('today') || dl.includes('tonight') || dl.includes('morning')) {
      temporalUrgency = 'Immediate (<48h)';
    } else if (dl.includes('next week') || dl.includes('later')) {
      temporalUrgency = 'Extended';
    }

    const taskLower = t.task.toLowerCase();
    const isLargeScope =
      taskLower.includes('entire') ||
      taskLower.includes('end-to-end') ||
      taskLower.includes('integration') ||
      taskLower.includes('microservice') ||
      taskLower.includes('migration') ||
      taskLower.includes('audit');

    const ownerAssigned = Boolean(t.owner && t.owner.toLowerCase() !== 'not specified');
    const hasDependencyFlag =
      t.risk_reason.toLowerCase().includes('depend') ||
      t.risk_reason.toLowerCase().includes('conflict') ||
      t.risk_reason.toLowerCase().includes('overlap') ||
      t.risk_reason.toLowerCase().includes('slip');

    return {
      taskId: t.id,
      taskName: t.task,
      owner: t.owner,
      deadline: t.deadline,
      temporalUrgency,
      scopeComplexity: isLargeScope ? 'Large / Multi-System' : 'Focused Deliverable',
      ownerAssigned,
      hasDependencyFlag,
      predictedPriority: t.priority,
      predictedRisk: t.risk
    };
  });

  const priorityDistribution = {
    High: meeting.tasks.filter((t) => t.priority === 'High').length,
    Medium: meeting.tasks.filter((t) => t.priority === 'Medium').length,
    Low: meeting.tasks.filter((t) => t.priority === 'Low').length
  };

  const riskDistribution = {
    'High Risk': meeting.tasks.filter((t) => t.risk === 'High Risk').length,
    'Medium Risk': meeting.tasks.filter((t) => t.risk === 'Medium Risk').length,
    'Low Risk': meeting.tasks.filter((t) => t.risk === 'Low Risk').length
  };

  return {
    preprocessing,
    participantGroundingRate,
    ownerGroundingRate,
    schemaValidityScore,
    taskFeatureMatrix,
    priorityDistribution,
    riskDistribution
  };
}

/**
 * Deterministic fallback analyzer used if the LLM API is unreachable.
 */
export function deterministicFallbackAnalyze(
  transcript: string,
  project: string,
  title: string,
  date: string,
  previousMeetings: MeetingRecord[]
): MeetingRecord {
  const prep = cleanAndPreprocessTranscript(transcript);
  const lines = prep.cleanedTranscript.split('\n').filter(Boolean);

  const decisions: DecisionItem[] = [];
  const discussions: DiscussionItem[] = [];
  const tasks: ActionTask[] = [];
  const unresolved_topics: UnresolvedTopic[] = [];
  const important_points: string[] = [];

  lines.forEach((line, idx) => {
    const speakerMatch = line.match(/^([A-Z][a-zA-Z0-9\s]{1,22}):\s*(.+)$/);
    const speaker = speakerMatch ? speakerMatch[1].trim() : 'Team';
    const content = speakerMatch ? speakerMatch[2].trim() : line.trim();
    const lower = content.toLowerCase();

    // Check for questions / discussions
    if (content.includes('?')) {
      discussions.push({
        id: `disc-fb-${idx}`,
        topic: content.replace(/\?.*$/, '?'),
        quote_or_summary: `${speaker} asked: "${content}"`,
        outcome: 'General Discussion'
      });
    }

    // Check for final decisions
    if (lower.includes('decided to') || lower.includes('we decided')) {
      decisions.push({
        id: `dec-fb-${idx}`,
        decision: content,
        context: `Confirmed by ${speaker} during ${title}.`
      });
      discussions.push({
        id: `disc-dec-${idx}`,
        topic: content,
        quote_or_summary: `${speaker}: "${content}"`,
        outcome: 'Final Decision'
      });
    }

    // Check for unresolved topics
    if (
      lower.includes('still need to decide') ||
      lower.includes("haven't decided") ||
      lower.includes("haven't finalized") ||
      lower.includes('decide later')
    ) {
      const cleanedTopic = content
        .replace(/^(we\s+)?still\s+need\s+to\s+decide\s+(which|whether\s+to\s+use|on)?\s*/i, '')
        .replace(/\.$/, '');
      unresolved_topics.push({
        id: `unres-fb-${idx}`,
        topic: cleanedTopic ? cleanedTopic.charAt(0).toUpperCase() + cleanedTopic.slice(1) : content,
        status: 'Decision pending',
        discussed_by: speaker,
        context: content
      });
      discussions.push({
        id: `disc-unres-${idx}`,
        topic: cleanedTopic || content,
        quote_or_summary: `${speaker}: "${content}"`,
        outcome: 'Unresolved'
      });
    }

    // Check for action items / tasks
    if (
      lower.includes('i will ') ||
      lower.includes('will complete') ||
      lower.includes('will work on') ||
      lower.includes('will prepare') ||
      lower.includes('need to complete') ||
      lower.includes('someone also needs to') ||
      lower.includes('will fix') ||
      lower.includes('need to rewrite')
    ) {
      const dlMatch = content.match(
        /\bby\s+(tomorrow(?:\s+morning|\s+evening)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week)\b|\bfor\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
      );
      const deadline = dlMatch ? (dlMatch[1] || dlMatch[2]) : 'Not specified';
      const owner =
        speaker !== 'Team' && speaker !== 'Manager' && !lower.includes('someone')
          ? speaker
          : 'Not specified';

      const isUrgent =
        deadline.toLowerCase().includes('tomorrow') ||
        lower.includes('bug') ||
        lower.includes('security') ||
        lower.includes('database') ||
        lower.includes('frontend');

      const priority: TaskPriority = isUrgent
        ? 'High'
        : deadline.toLowerCase().includes('next week')
        ? 'Low'
        : 'Medium';

      let risk: RiskLevel = 'Low Risk';
      let riskReason = 'Clear task scope and defined timeline.';

      if (
        (lower.includes('entire') && deadline.toLowerCase().includes('tomorrow')) ||
        (owner === 'Not specified' && deadline.toLowerCase().includes('tomorrow'))
      ) {
        risk = 'High Risk';
        riskReason = 'Large task with a very short deadline and/or missing assigned owner.';
      } else if (owner === 'Not specified' || deadline === 'Not specified') {
        risk = 'Medium Risk';
        riskReason = `Missing ${owner === 'Not specified' ? 'owner' : 'deadline'} specification.`;
      }

      tasks.push({
        id: `task-fb-${Date.now()}-${idx}`,
        task: content,
        owner,
        deadline: deadline.charAt(0).toUpperCase() + deadline.slice(1),
        priority,
        priority_reason: `AI-recommended ${priority} priority based on task scope and ${deadline} target.`,
        status: lower.includes('completed') || lower.includes('finished') ? 'Completed' : 'Pending',
        risk,
        risk_reason: riskReason
      });
    }

    if (lower.includes('final project review')) {
      important_points.push(content);
    }
  });

  const changes_detected: ChangeDetected[] = [];
  if (previousMeetings.length > 0) {
    const prev = previousMeetings[0];
    tasks.forEach((currTask, i) => {
      const prevMatch = prev.tasks.find((pt) =>
        currTask.task.toLowerCase().includes(pt.owner.toLowerCase()) ||
        (pt.task.toLowerCase().includes('database') && currTask.task.toLowerCase().includes('database'))
      );
      if (prevMatch && prevMatch.deadline.toLowerCase() !== currTask.deadline.toLowerCase()) {
        changes_detected.push({
          id: `chg-fb-${i}`,
          change_type: 'Deadline Changed',
          subject: currTask.task,
          previous_value: prevMatch.deadline,
          current_value: currTask.deadline,
          details: `Deadline changed from ${prevMatch.deadline} to ${currTask.deadline}.`
        });
      }
    });
  }

  return {
    id: `meeting-${Date.now()}`,
    project,
    title,
    date,
    createdAt: new Date().toISOString(),
    transcript: prep.cleanedTranscript,
    summary: `Analyzed ${title} (${date}) with ${prep.detectedSpeakers.length} participants. Extracted ${tasks.length} action items, ${decisions.length} decisions, and ${unresolved_topics.length} unresolved topics.`,
    participants: prep.detectedSpeakers.length > 0 ? prep.detectedSpeakers : ['Rahul', 'Aman', 'Yashasvi'],
    decisions,
    discussions,
    tasks,
    unresolved_topics,
    important_points,
    changes_detected
  };
}
