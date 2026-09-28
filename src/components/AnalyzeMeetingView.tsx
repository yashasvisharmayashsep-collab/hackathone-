import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { SAMPLE_TRANSCRIPTS } from '../data/sampleData';
import { cleanAndPreprocessTranscript } from '../utils/nlpPipeline';

interface AnalyzeMeetingViewProps {
  onAnalyze: (payload: {
    transcript: string;
    project: string;
    title: string;
    date: string;
  }) => Promise<void>;
  isAnalyzing: boolean;
  error: string | null;
}

export const AnalyzeMeetingView: React.FC<AnalyzeMeetingViewProps> = ({
  onAnalyze,
  isAnalyzing,
  error
}) => {
  const defaultSample = SAMPLE_TRANSCRIPTS[0];
  const [project, setProject] = useState(defaultSample.project);
  const [title, setTitle] = useState(defaultSample.title);
  const [date, setDate] = useState(defaultSample.date);
  const [transcript, setTranscript] = useState(defaultSample.transcript);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [activeSampleId, setActiveSampleId] = useState<string>(defaultSample.id);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const prepStats = useMemo(() => {
    return cleanAndPreprocessTranscript(transcript);
  }, [transcript]);

  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_TRANSCRIPTS.find((s) => s.id === sampleId);
    if (!found) return;
    setActiveSampleId(found.id);
    setProject(found.project);
    setTitle(found.title);
    setDate(found.date);
    setTranscript(found.transcript);
    setUploadedFileName(null);
    setFileError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.txt', '.md', '.csv', '.json', '.log'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext) && file.type !== 'text/plain') {
      setFileError('Please upload a plain text file (.txt, .md, .csv, or .json).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setFileError('File size exceeds 2MB limit. Please upload a smaller meeting transcript.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setTranscript(content);
        setUploadedFileName(file.name);
        setActiveSampleId('');
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        if (baseName) {
          setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
        }
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read the uploaded file. Please try again.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim() || isAnalyzing) return;
    await onAnalyze({
      transcript,
      project: project.trim() || 'Project Alpha',
      title: title.trim() || 'Team Sync Meeting',
      date: date.trim() || 'Today'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            Input Pipeline · Transcript Ingestion & Structured AI Extraction
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
            Analyze Meeting Transcript
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Paste unstructured meeting notes or upload a <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.txt</code> file. The AI pipeline cleans the transcript, separates decisions from discussions, assigns priorities, and flags potential deadline risks.
          </p>
        </div>

        {/* Quick Sample Loaders for 2-Minute Hackathon Demo */}
        <div className="flex flex-wrap items-center gap-2">
          {SAMPLE_TRANSCRIPTS.map((sample, idx) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleLoadSample(sample.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                activeSampleId === sample.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Load Sample {idx + 1}: {sample.date}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {(error || fileError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Input or Analysis Error</div>
            <div className="text-xs text-red-700 mt-0.5">{error || fileError}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Form Input (Option A Paste + Option B Upload) */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Project Name (For Memory & Change Tracking)
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Project Alpha"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Sprint Sync"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Meeting Date
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g. September 28"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            {/* Option B: File Upload Bar */}
            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    Option B — Upload Meeting Notes File (.txt)
                  </div>
                  <div className="text-xs text-slate-500">
                    {uploadedFileName ? (
                      <span className="text-emerald-700 font-medium">
                        Loaded file: {uploadedFileName}
                      </span>
                    ) : (
                      'Upload a local .txt or .md file to populate the transcript editor below.'
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  Browse .txt File
                </button>
              </div>
            </div>

            {/* Option A: Paste Meeting Transcript */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Option A — Paste Meeting Transcript or Notes
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setUploadedFileName(null);
                    setActiveSampleId('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Text
                </button>
              </div>

              <textarea
                rows={13}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={`Paste meeting transcript here...\n\nExample:\nRahul: I will complete the frontend login page by Friday.\nAman: I will work on the database integration and finish it by Saturday.\nTeam: We decided to use React.\nAman: We still need to decide which cloud provider to use.`}
                className="w-full p-4 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 leading-relaxed focus:outline-none focus:border-slate-400 focus:bg-white"
              />
            </div>

            {/* Action Submit Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Extracts Summary · Decisions · Tasks · Priority · Deadline Risk · Unresolved Topics · Changes
              </div>

              <button
                type="submit"
                disabled={isAnalyzing || !transcript.trim()}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Meeting with Gemini AI...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Analyze Meeting Transcript
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right 4 Columns: Live NLP Preprocessing & Feature Extraction Preview */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-900 font-display">
                  Live Preprocessing & Feature Signals
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-700">Ready</span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Real-time text cleaning and lexical signal detection executed prior to LLM structured extraction.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200/70">
                <div className="text-[11px] text-slate-500">Word Tokens</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                  {prepStats.wordTokenCount}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200/70">
                <div className="text-[11px] text-slate-500">Speaker Turns</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-slate-900">
                  {prepStats.speakerTurnCount}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200/70">
                <div className="text-[11px] text-slate-500">Commitment Cues</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-indigo-700">
                  {prepStats.commitmentCueCount}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-md border border-slate-200/70">
                <div className="text-[11px] text-slate-500">Unresolved Cues</div>
                <div className="text-lg font-semibold font-mono tabular-nums text-amber-700">
                  {prepStats.unresolvedCueCount}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
              <div>
                <div className="font-semibold text-slate-700 mb-1">
                  Candidate Participants Detected ({prepStats.detectedSpeakers.length})
                </div>
                <div className="text-slate-600 font-mono">
                  {prepStats.detectedSpeakers.length > 0
                    ? prepStats.detectedSpeakers.join(' · ')
                    : 'No explicit Speaker: prefixes detected'}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">
                  Temporal / Deadline Entities ({prepStats.temporalTokensFound.length})
                </div>
                <div className="text-slate-600 font-mono">
                  {prepStats.temporalTokensFound.length > 0
                    ? prepStats.temporalTokensFound.join(' · ')
                    : 'None detected'}
                </div>
              </div>
            </div>
          </div>

          {/* Sample Transcript Selector Guide */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 font-display mb-3">
              Included Demo Scenarios
            </h3>
            <div className="divide-y divide-slate-100">
              {SAMPLE_TRANSCRIPTS.map((sample) => (
                <div key={sample.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-900">
                      {sample.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadSample(sample.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                    >
                      Load
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">{sample.description}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
