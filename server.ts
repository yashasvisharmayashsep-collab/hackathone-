import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MEETINGS } from './src/data/sampleData.ts';
import {
  cleanAndPreprocessTranscript,
  deterministicFallbackAnalyze
} from './src/utils/nlpPipeline.ts';
import type {
  MeetingRecord,
  ActionTask,
  TaskPriority,
  TaskStatus,
  RiskLevel,
  ChangeDetected
} from './src/types/meeting.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'meetings_store.json');

function ensureDataStore(): MeetingRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_MEETINGS, null, 2), 'utf-8');
      return [...INITIAL_MEETINGS];
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_MEETINGS, null, 2), 'utf-8');
    return [...INITIAL_MEETINGS];
  } catch (err) {
    console.error('Error reading local data store, using in-memory seed:', err);
    return [...INITIAL_MEETINGS];
  }
}

function saveDataStore(meetings: MeetingRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(meetings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to local data store:', err);
  }
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is missing or not configured in environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function normalizePriority(val: string | undefined): TaskPriority {
  if (!val) return 'Medium';
  const v = val.toLowerCase();
  if (v.includes('high') || v.includes('urgent') || v.includes('critical')) return 'High';
  if (v.includes('low')) return 'Low';
  return 'Medium';
}

function normalizeStatus(val: string | undefined): TaskStatus {
  if (!val) return 'Pending';
  const v = val.toLowerCase();
  if (v.includes('complete') || v.includes('done') || v.includes('finished')) return 'Completed';
  if (v.includes('progress') || v.includes('working') || v.includes('ongoing')) return 'In Progress';
  return 'Pending';
}

function normalizeRisk(val: string | undefined): RiskLevel {
  if (!val) return 'Low Risk';
  const v = val.toLowerCase();
  if (v.includes('high')) return 'High Risk';
  if (v.includes('medium') || v.includes('moderate')) return 'Medium Risk';
  return 'Low Risk';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // 1. Get all stored meetings
  app.get('/api/meetings', (_req, res) => {
    const meetings = ensureDataStore();
    res.json({ meetings });
  });

  // 2. Reset demo data
  app.post('/api/meetings/reset', (_req, res) => {
    saveDataStore(INITIAL_MEETINGS);
    res.json({ meetings: INITIAL_MEETINGS });
  });

  // 3. Update task status locally
  app.put('/api/meetings/:id/tasks/:taskId', (req, res) => {
    const { id, taskId } = req.params;
    const { status } = req.body as { status: TaskStatus };

    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      res.status(400).json({ error: 'Invalid task status. Use Pending, In Progress, or Completed.' });
      return;
    }

    const meetings = ensureDataStore();
    const meetingIndex = meetings.findIndex((m) => m.id === id);
    if (meetingIndex === -1) {
      res.status(404).json({ error: 'Meeting not found in local store.' });
      return;
    }

    const meeting = meetings[meetingIndex];
    const taskIndex = meeting.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found in meeting.' });
      return;
    }

    meeting.tasks[taskIndex].status = status;
    meetings[meetingIndex] = meeting;
    saveDataStore(meetings);

    res.json({ meeting, meetings });
  });

  // 4. Delete a meeting
  app.delete('/api/meetings/:id', (req, res) => {
    const { id } = req.params;
    const meetings = ensureDataStore();
    const filtered = meetings.filter((m) => m.id !== id);
    saveDataStore(filtered);
    res.json({ meetings: filtered });
  });

  // 5. Analyze a new meeting transcript with Gemini
  app.post('/api/meetings/analyze', async (req, res) => {
    try {
      const { transcript, project, title, date } = req.body as {
        transcript?: string;
        project?: string;
        title?: string;
        date?: string;
      };

      if (!transcript || !transcript.trim()) {
        res.status(400).json({
          error: 'Meeting transcript cannot be empty. Please paste meeting notes or upload a .txt file.'
        });
        return;
      }

      const trimmedTranscript = transcript.trim().slice(0, 35000);
      const preprocessed = cleanAndPreprocessTranscript(trimmedTranscript);
      const projectName = (project || 'Project Alpha').trim();
      const meetingTitle = (title || `${projectName} Sync`).trim();
      const meetingDate = (date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })).trim();

      const existingMeetings = ensureDataStore();
      const previousProjectMeetings = existingMeetings.filter(
        (m) => m.project.toLowerCase() === projectName.toLowerCase()
      );

      const previousContextString =
        previousProjectMeetings.length > 0
          ? JSON.stringify(
              previousProjectMeetings.slice(-2).map((pm) => ({
                title: pm.title,
                date: pm.date,
                decisions: pm.decisions.map((d) => d.decision),
                unresolved_topics: pm.unresolved_topics.map((u) => u.topic),
                tasks: pm.tasks.map((t) => ({
                  task: t.task,
                  owner: t.owner,
                  deadline: t.deadline,
                  status: t.status
                }))
              })),
              null,
              2
            )
          : 'NO_PREVIOUS_MEETINGS_FOR_THIS_PROJECT';

      let ai: GoogleGenAI;
      try {
        ai = getGenAIClient();
      } catch (_err) {
        const fallbackMeeting = deterministicFallbackAnalyze(
          preprocessed.cleanedTranscript,
          projectName,
          meetingTitle,
          meetingDate,
          previousProjectMeetings
        );
        const updatedMeetings = [fallbackMeeting, ...existingMeetings];
        saveDataStore(updatedMeetings);
        res.json({
          meeting: fallbackMeeting,
          meetings: updatedMeetings
        });
        return;
      }

      const systemInstruction = `You are "AI Meeting Copilot", a precise, hallucination-free meeting intelligence engine.
Analyze the provided meeting transcript and extract structured, actionable information.

CRITICAL HALLUCINATION & EXTRACTION RULES:
1. Do NOT invent participants, tasks, deadlines, decisions, or facts that are not supported by the transcript.
2. If a task owner is missing or unclear, set owner strictly to "Not specified".
3. If a task deadline is missing or unclear, set deadline strictly to "Not specified".
4. Distinguish strictly between:
   - "decisions": Final decisions that were agreed upon (e.g. "The team decided to use React").
   - "discussions": Topics that were debated or discussed (indicating whether their outcome is "Final Decision", "Unresolved", or "General Discussion").
   - "unresolved_topics": Topics that were raised/debated without reaching a final decision (e.g. "We still need to decide which cloud provider to use").
5. SMART PRIORITY DETECTION (AI Recommendation):
   - Assign "High", "Medium", or "Low" based on urgency, deadline proximity, blocking nature, and context.
   - Provide a brief, explainable "priority_reason" framing it as an AI recommendation.
6. DEADLINE RISK DETECTION (Potential Risk):
   - Classify each task's deadline risk as "Low Risk", "Medium Risk", or "High Risk".
   - Provide an explainable "risk_reason" using concrete factors when applicable:
     * Very short deadline (e.g. "tomorrow", "tonight", same-day)
     * Large task scope (e.g. "entire backend", "full migration")
     * Multiple dependencies
     * Missing owner ("Not specified")
     * Missing deadline ("Not specified")
     * Conflicting deadlines or overlapping owner workload
   - Always frame this as a potential risk, never a guaranteed failure.
7. CHANGE TRACKING:
   - Compare this meeting against the provided PREVIOUS_MEETINGS context for the same project.
   - If PREVIOUS_MEETINGS is "NO_PREVIOUS_MEETINGS_FOR_THIS_PROJECT" or if no real changes exist, return an empty array [] for "changes_detected". Do NOT fabricate changes.
   - If changes exist compared to previous meetings, detect: "Deadline Changed", "Task Reassigned", "Decision Changed", "Task Completed", or "New Task Added".`;

      const prompt = `PROJECT NAME: ${projectName}
MEETING TITLE: ${meetingTitle}
MEETING DATE: ${meetingDate}

PREVIOUS_MEETINGS IN THIS PROJECT:
${previousContextString}

MEETING TRANSCRIPT TO ANALYZE:
"""
${trimmedTranscript}
"""`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Concise, accurate summary of the meeting (2-4 sentences).'
              },
              participants: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Names or roles of participants explicitly mentioned in the meeting.'
              },
              decisions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    decision: { type: Type.STRING },
                    context: { type: Type.STRING }
                  },
                  required: ['decision', 'context']
                },
                description: 'Final decisions reached during the meeting (separate from open discussions).'
              },
              discussions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    quote_or_summary: { type: Type.STRING },
                    outcome: {
                      type: Type.STRING,
                      description: 'Must be one of: "Final Decision", "Unresolved", or "General Discussion"'
                    }
                  },
                  required: ['topic', 'quote_or_summary', 'outcome']
                }
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task: { type: Type.STRING },
                    owner: { type: Type.STRING, description: 'Person responsible, or "Not specified"' },
                    deadline: { type: Type.STRING, description: 'Deadline mentioned, or "Not specified"' },
                    priority: { type: Type.STRING, description: 'High, Medium, or Low' },
                    priority_reason: { type: Type.STRING },
                    status: { type: Type.STRING, description: 'Pending, In Progress, or Completed' },
                    risk: { type: Type.STRING, description: 'Low Risk, Medium Risk, or High Risk' },
                    risk_reason: { type: Type.STRING }
                  },
                  required: [
                    'task',
                    'owner',
                    'deadline',
                    'priority',
                    'priority_reason',
                    'status',
                    'risk',
                    'risk_reason'
                  ]
                }
              },
              unresolved_topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    topic: { type: Type.STRING },
                    status: { type: Type.STRING },
                    discussed_by: { type: Type.STRING },
                    context: { type: Type.STRING }
                  },
                  required: ['topic', 'status', 'discussed_by', 'context']
                }
              },
              important_points: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              changes_detected: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    change_type: {
                      type: Type.STRING,
                      description:
                        'One of: "Deadline Changed", "Task Reassigned", "Decision Changed", "Task Completed", "New Task Added"'
                    },
                    subject: { type: Type.STRING },
                    previous_value: { type: Type.STRING },
                    current_value: { type: Type.STRING },
                    details: { type: Type.STRING }
                  },
                  required: ['change_type', 'subject', 'previous_value', 'current_value', 'details']
                }
              }
            },
            required: [
              'summary',
              'participants',
              'decisions',
              'discussions',
              'tasks',
              'unresolved_topics',
              'important_points',
              'changes_detected'
            ]
          }
        }
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Empty response returned from Gemini model.');
      }

      const parsed = JSON.parse(rawText);
      const nowId = `meeting-${Date.now()}`;

      const validatedTasks: ActionTask[] = Array.isArray(parsed.tasks)
        ? parsed.tasks.map((t: Record<string, string>, idx: number) => ({
            id: `task-${Date.now()}-${idx + 1}`,
            task: t.task || 'Untitled task',
            owner: t.owner && t.owner.trim() !== '' ? t.owner.trim() : 'Not specified',
            deadline: t.deadline && t.deadline.trim() !== '' ? t.deadline.trim() : 'Not specified',
            priority: normalizePriority(t.priority),
            priority_reason:
              t.priority_reason || 'AI-recommended priority based on meeting context and timeline.',
            status: normalizeStatus(t.status),
            risk: normalizeRisk(t.risk),
            risk_reason: t.risk_reason || 'Evaluated based on scope, owner assignment, and deadline.'
          }))
        : [];

      const validChangeTypes = [
        'Deadline Changed',
        'Task Reassigned',
        'Decision Changed',
        'Task Completed',
        'New Task Added'
      ] as const;

      const validatedChanges: ChangeDetected[] = Array.isArray(parsed.changes_detected)
        ? parsed.changes_detected.map((c: Record<string, string>, idx: number) => {
            const matchedType =
              validChangeTypes.find((vt) => vt.toLowerCase() === (c.change_type || '').toLowerCase()) ||
              'Deadline Changed';
            return {
              id: `chg-${Date.now()}-${idx + 1}`,
              change_type: matchedType,
              subject: c.subject || 'Meeting item',
              previous_value: c.previous_value || 'Not specified',
              current_value: c.current_value || 'Not specified',
              details: c.details || ''
            };
          })
        : [];

      const newMeeting: MeetingRecord = {
        id: nowId,
        project: projectName,
        title: meetingTitle,
        date: meetingDate,
        createdAt: new Date().toISOString(),
        transcript: trimmedTranscript,
        summary: parsed.summary || 'Summary extracted from meeting transcript.',
        participants: Array.isArray(parsed.participants) ? parsed.participants : [],
        decisions: Array.isArray(parsed.decisions)
          ? parsed.decisions.map((d: Record<string, string>, idx: number) => ({
              id: `dec-${Date.now()}-${idx + 1}`,
              decision: d.decision || '',
              context: d.context || ''
            }))
          : [],
        discussions: Array.isArray(parsed.discussions)
          ? parsed.discussions.map((d: Record<string, string>, idx: number) => ({
              id: `disc-${Date.now()}-${idx + 1}`,
              topic: d.topic || '',
              quote_or_summary: d.quote_or_summary || '',
              outcome:
                d.outcome === 'Final Decision' || d.outcome === 'Unresolved'
                  ? d.outcome
                  : 'General Discussion'
            }))
          : [],
        tasks: validatedTasks,
        unresolved_topics: Array.isArray(parsed.unresolved_topics)
          ? parsed.unresolved_topics.map((u: Record<string, string>, idx: number) => ({
              id: `unres-${Date.now()}-${idx + 1}`,
              topic: u.topic || '',
              status: u.status || 'Decision pending',
              discussed_by: u.discussed_by || 'Not specified',
              context: u.context || ''
            }))
          : [],
        important_points: Array.isArray(parsed.important_points) ? parsed.important_points : [],
        changes_detected: validatedChanges
      };

      const updatedMeetings = [newMeeting, ...existingMeetings];
      saveDataStore(updatedMeetings);

      res.json({
        meeting: newMeeting,
        meetings: updatedMeetings
      });
    } catch (error: unknown) {
      console.error('Error analyzing meeting:', error);
      const message = error instanceof Error ? error.message : 'Failed to analyze meeting with AI.';
      res.status(500).json({ error: message });
    }
  });

  // 6. Ask My Meeting (Strictly Grounded Q&A)
  app.post('/api/meetings/ask', async (req, res) => {
    try {
      const { question, meeting, selectedParticipant, projectMeetings } = req.body as {
        question?: string;
        meeting?: MeetingRecord;
        selectedParticipant?: string;
        projectMeetings?: MeetingRecord[];
      };

      if (!question || !question.trim()) {
        res.status(400).json({ error: 'Please enter a question about the meeting.' });
        return;
      }

      if (!meeting) {
        res.status(400).json({ error: 'No active meeting selected to query.' });
        return;
      }

      const ai = getGenAIClient();

      const historySummary = Array.isArray(projectMeetings)
        ? projectMeetings.map((m) => ({
            title: m.title,
            date: m.date,
            summary: m.summary,
            decisions: m.decisions,
            tasks: m.tasks,
            unresolved_topics: m.unresolved_topics,
            changes_detected: m.changes_detected
          }))
        : [];

      const systemInstruction = `You are the "Ask My Meeting" assistant inside AI Meeting Copilot.
You must answer the user's question ONLY using the provided ACTIVE MEETING CONTEXT (and PROJECT MEETING HISTORY if the user asks about changes across meetings).

STRICT ANTI-HALLUCINATION RULES:
1. If the answer is NOT present in the provided meeting context, you MUST set "grounded" to false and set "answer" to:
   "I couldn't find this information in the meeting."
2. Do NOT guess, extrapolate, or invent external facts, dates, or owners.
3. If the user asks "What are my tasks?" or refers to "me/my", use the ACTIVE_PARTICIPANT ("${
        selectedParticipant || 'Not selected'
      }"). If no participant is selected or they have no tasks, state that clearly based on the meeting tasks.
4. Keep answers concise, direct, and easy to verify against the meeting notes.`;

      const prompt = `ACTIVE_PARTICIPANT ("Who are you?"): ${selectedParticipant || 'All Participants'}

ACTIVE MEETING CONTEXT:
Title: ${meeting.title} (${meeting.date})
Project: ${meeting.project}
Transcript:
"""
${meeting.transcript}
"""
Extracted Summary: ${meeting.summary}
Participants: ${JSON.stringify(meeting.participants)}
Decisions: ${JSON.stringify(meeting.decisions)}
Tasks: ${JSON.stringify(meeting.tasks)}
Unresolved Topics: ${JSON.stringify(meeting.unresolved_topics)}
Changes Detected: ${JSON.stringify(meeting.changes_detected)}

OTHER MEETINGS IN THIS PROJECT (For change/comparison questions):
${JSON.stringify(historySummary)}

USER QUESTION:
"${question.trim()}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description:
                  'Direct answer based strictly on the meeting, or "I couldn\'t find this information in the meeting."'
              },
              grounded: {
                type: Type.BOOLEAN,
                description: 'True if the information was found in the meeting context, false otherwise.'
              },
              evidence: {
                type: Type.STRING,
                description:
                  'Exact quote or task/decision reference from the meeting that supports the answer, or "Not found in meeting transcript"'
              }
            },
            required: ['answer', 'grounded', 'evidence']
          }
        }
      });

      const rawText = response.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini Q&A.');
      }

      const parsed = JSON.parse(rawText);
      res.json({
        answer: parsed.answer || "I couldn't find this information in the meeting.",
        grounded: Boolean(parsed.grounded),
        evidence: parsed.evidence || 'Not found in meeting transcript'
      });
    } catch (error: unknown) {
      console.error('Error in Ask My Meeting:', error);
      const message = error instanceof Error ? error.message : 'Failed to answer question.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Meeting Copilot server running on http://localhost:${PORT}`);
  });
}

startServer();
