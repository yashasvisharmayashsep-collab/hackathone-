import React, { useMemo } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  Database,
  Cpu,
  BarChart3
} from 'lucide-react';
import type { MeetingRecord } from '../types/meeting';
import { evaluateMeetingExtraction } from '../utils/nlpPipeline';

interface DataScienceEvalViewProps {
  meeting: MeetingRecord;
}

export const DataScienceEvalView: React.FC<DataScienceEvalViewProps> = ({ meeting }) => {
  const evalMetrics = useMemo(() => evaluateMeetingExtraction(meeting), [meeting]);
  const { preprocessing } = evalMetrics;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="text-xs text-slate-500 mb-1">
          Hackathon Technical Architecture · Data Preparation, Feature Engineering & Evaluation
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
          Data Science & NLP Pipeline Evaluation
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Live analytical breakdown of transcript preprocessing, feature engineering for Priority and Deadline Risk classification, model selection rationale, and grounded extraction verification on <strong>{meeting.title}</strong>.
        </p>
      </div>

      {/* 1. Data Cleaning & Preprocessing Pipeline */}
      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900 font-display">
              01. Data Cleaning & Text Preprocessing Pipeline
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Active Dataset: {meeting.title} ({meeting.date})
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Before passing unstructured meeting transcripts to the model, the ingestion pipeline strips non-printable control characters, normalizes multi-line speaker blocks (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">Speaker:\nStatement → Speaker: Statement</code>), segments sentences, and extracts candidate speaker entities and temporal deadline tokens.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="text-xs text-slate-500">Cleaned Chars</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {preprocessing.cleanedCharCount}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="text-xs text-slate-500">Word Tokens</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {preprocessing.wordTokenCount}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="text-xs text-slate-500">Sentences</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {preprocessing.sentenceCount}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="text-xs text-slate-500">Speaker Turns</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {preprocessing.speakerTurnCount}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="text-xs text-slate-500">Commitment Cues</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-indigo-700 mt-0.5">
              {preprocessing.commitmentCueCount}
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <div className="text-xs text-slate-500">Temporal Tokens</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-emerald-700 mt-0.5">
              {preprocessing.temporalTokensFound.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Extracted Speaker Entities (Diarization Normalization)
            </div>
            <div className="text-xs font-mono text-slate-700">
              {preprocessing.detectedSpeakers.join(' · ') || 'None'}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Extracted Temporal & Deadline Expressions
            </div>
            <div className="text-xs font-mono text-slate-700">
              {preprocessing.temporalTokensFound.join(' · ') || 'None'}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Feature Engineering & Risk/Priority Classification Matrix */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-base font-semibold text-slate-900 font-display">
              02. Feature Engineering for Priority & Deadline Risk Classification
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Each extracted action item is evaluated across four interpretable domain features (<code className="font-mono text-xs">Temporal Urgency</code>, <code className="font-mono text-xs">Scope Complexity</code>, <code className="font-mono text-xs">Ownership Clarity</code>, and <code className="font-mono text-xs">Dependency / Conflict Flag</code>) to classify <strong>AI Priority</strong> and <strong>Potential Deadline Risk</strong>.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Extracted Action Item</th>
                <th className="py-3 px-4">F1: Temporal Urgency</th>
                <th className="py-3 px-4">F2: Scope Complexity</th>
                <th className="py-3 px-4">F3: Owner Assigned</th>
                <th className="py-3 px-4">F4: Dependency / Conflict</th>
                <th className="py-3 px-4">Classified Priority</th>
                <th className="py-3 px-4">Classified Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {evalMetrics.taskFeatureMatrix.map((row) => (
                <tr key={row.taskId} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    {row.taskName}
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Owner: {row.owner} · Due: {row.deadline}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {row.temporalUrgency}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {row.scopeComplexity}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                    <span className={row.ownerAssigned ? 'text-emerald-700' : 'text-red-700 font-semibold'}>
                      {row.ownerAssigned ? 'True (Assigned)' : 'False (Missing)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                    <span className={row.hasDependencyFlag ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                      {row.hasDependencyFlag ? 'True (Detected)' : 'False'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-xs whitespace-nowrap">
                    <span
                      className={
                        row.predictedPriority === 'High'
                          ? 'text-red-700'
                          : row.predictedPriority === 'Medium'
                          ? 'text-amber-700'
                          : 'text-slate-600'
                      }
                    >
                      {row.predictedPriority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-xs whitespace-nowrap">
                    <span
                      className={
                        row.predictedRisk === 'High Risk'
                          ? 'text-red-700'
                          : row.predictedRisk === 'Medium Risk'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }
                    >
                      {row.predictedRisk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Model Selection & Evaluation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900 font-display">
              03. Model Selection & Algorithmic Architecture
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <div>
              <strong className="text-slate-900 block">
                Structured Information Extraction & Classification (<code className="font-mono text-xs">gemini-3.8-flash</code>)
              </strong>
              Configured with deterministic decoding (<code className="font-mono text-xs">temperature: 0.1</code>) and strict OpenAPI <code className="font-mono text-xs">responseSchema</code> enforcement. Separates exploratory <code className="font-mono text-xs">discussions</code> from confirmed <code className="font-mono text-xs">decisions</code> and flags <code className="font-mono text-xs">unresolved_topics</code>.
            </div>

            <div>
              <strong className="text-slate-900 block">
                Cross-Meeting Delta Engine (Change Tracking)
              </strong>
              Conditions extraction on the JSON state of prior meetings in the same project to classify longitudinal state transitions (<code className="font-mono text-xs">Deadline Changed</code>, <code className="font-mono text-xs">Task Reassigned</code>, <code className="font-mono text-xs">Decision Changed</code>, <code className="font-mono text-xs">Task Completed</code>, <code className="font-mono text-xs">New Task Added</code>).
            </div>

            <div>
              <strong className="text-slate-900 block">
                Zero-Hallucination Grounded Q&A (<code className="font-mono text-xs">temperature: 0.0</code>)
              </strong>
              Answers strictly from the meeting context and returns a boolean <code className="font-mono text-xs">grounded</code> flag plus verbatim <code className="font-mono text-xs">evidence</code> citation.
            </div>
          </div>
        </section>

        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-semibold text-slate-900 font-display">
              04. Grounding & Schema Verification Results
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500">Participant Grounding</div>
              <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
                {evalMetrics.participantGroundingRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Verified in raw text
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500">Owner Attribution</div>
              <div className="text-2xl font-semibold font-mono tabular-nums text-emerald-700 mt-1">
                {evalMetrics.ownerGroundingRate}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Zero hallucinated owners
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="text-xs text-slate-500">Schema Completeness</div>
              <div className="text-2xl font-semibold font-mono tabular-nums text-slate-900 mt-1">
                {evalMetrics.schemaValidityScore}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Valid enum fields
              </div>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="font-semibold text-slate-800 mb-2">
                Priority Classification Distribution
              </div>
              <div className="space-y-1 font-mono tabular-nums text-slate-600">
                <div className="flex justify-between">
                  <span>High Priority:</span>
                  <span className="font-semibold text-slate-900">{evalMetrics.priorityDistribution.High}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium Priority:</span>
                  <span className="font-semibold text-slate-900">{evalMetrics.priorityDistribution.Medium}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Priority:</span>
                  <span className="font-semibold text-slate-900">{evalMetrics.priorityDistribution.Low}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
              <div className="font-semibold text-slate-800 mb-2">
                Deadline Risk Classification Distribution
              </div>
              <div className="space-y-1 font-mono tabular-nums text-slate-600">
                <div className="flex justify-between">
                  <span>High Risk:</span>
                  <span className="font-semibold text-red-700">{evalMetrics.riskDistribution['High Risk']}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium Risk:</span>
                  <span className="font-semibold text-amber-700">{evalMetrics.riskDistribution['Medium Risk']}</span>
                </div>
                <div className="flex justify-between">
                  <span>Low Risk:</span>
                  <span className="font-semibold text-emerald-700">{evalMetrics.riskDistribution['Low Risk']}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
