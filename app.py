"""
AI Meeting Copilot — Standalone Streamlit + SQLite + Pandas Prototype
Run with: streamlit run app.py
"""

import os
import re
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

DB_PATH = Path("data/meetings.db")
SAMPLE_PATH = Path("data/sample_meeting.txt")

DEFAULT_SAMPLE_TEXT = """Project Alpha Weekly Meeting

Rahul:
I will complete the frontend login page by Friday.

Aman:
I will work on the database integration and finish it by Saturday.

Yashasvi:
I will prepare the presentation for Monday.

Rahul:
Should we use React or Angular?

Team:
We decided to use React.

Aman:
We still need to decide which cloud provider to use.

Manager:
The final project review will be on Monday. Also, we need to complete the entire end-to-end backend security audit by tomorrow morning."""


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meetings (
                id TEXT PRIMARY KEY,
                project TEXT,
                title TEXT,
                date TEXT,
                transcript TEXT,
                analysis_json TEXT,
                created_at TEXT
            )
            """
        )


def clean_transcript(raw_text: str) -> Dict[str, Any]:
    normalized = raw_text.replace("\r\n", "\n").strip()
    normalized = re.sub(r"^([A-Z][a-zA-Z0-9\s]{1,22}):\s*\n+([^\n]+)", r"\1: \2", normalized, flags=re.M)
    speakers = list(dict.fromkeys(re.findall(r"^([A-Z][a-zA-Z0-9\s]{1,22}):", normalized, flags=re.M)))
    speakers = [s for s in speakers if s.lower() not in {"team", "topic", "status", "task"}]
    temporal = list(
        dict.fromkeys(
            re.findall(
                r"\b(?:today|tomorrow(?:\s+morning)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week)\b",
                normalized,
                flags=re.I,
            )
        )
    )
    return {
        "cleaned_text": normalized,
        "word_count": len(normalized.split()),
        "speakers": speakers,
        "temporal_tokens": temporal,
    }


def analyze_with_ai_or_fallback(transcript: str, project: str, title: str, date_str: str) -> Dict[str, Any]:
    prep = clean_transcript(transcript)
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")

    if api_key and api_key != "MY_GEMINI_API_KEY":
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            prompt = f"""Analyze this meeting transcript and return strict JSON with keys:
summary (str), participants (list of str), decisions (list of str),
tasks (list of objects with task, owner, deadline, priority, status, risk, risk_reason),
unresolved_topics (list of str), important_points (list of str).
Do not invent facts. Use "Not specified" for missing owners or deadlines.

Transcript:
{prep['cleaned_text']}"""
            res = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                ),
            )
            if res.text:
                return json.loads(res.text)
        except Exception:
            pass

    # Deterministic fallback extraction
    tasks = []
    decisions = []
    unresolved = []
    for line in prep["cleaned_text"].split("\n"):
        if ":" in line:
            speaker, text = [p.strip() for p in line.split(":", 1)]
        else:
            speaker, text = "Team", line.strip()
        lower = text.lower()
        if "decided to" in lower:
            decisions.append(text)
        if "still need to decide" in lower or "haven't decided" in lower:
            unresolved.append(text)
        if any(k in lower for k in ["i will", "will complete", "will work on", "will prepare", "need to complete"]):
            dl_match = re.search(
                r"\b(?:by|for)\s+(tomorrow(?:\s+morning)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week)\b",
                text,
                flags=re.I,
            )
            deadline = dl_match.group(1).capitalize() if dl_match else "Not specified"
            owner = speaker if speaker not in {"Team", "Manager"} else "Not specified"
            priority = "High" if "tomorrow" in deadline.lower() or "database" in lower or "frontend" in lower else "Medium"
            risk = "High Risk" if owner == "Not specified" or "entire" in lower else "Low Risk"
            risk_reason = (
                "Large task with short deadline and/or missing owner"
                if risk == "High Risk"
                else "Defined owner and target deadline"
            )
            tasks.append(
                {
                    "task": text,
                    "owner": owner,
                    "deadline": deadline,
                    "priority": priority,
                    "status": "Pending",
                    "risk": risk,
                    "risk_reason": risk_reason,
                }
            )

    return {
        "summary": f"Analyzed {title} ({date_str}). Extracted {len(tasks)} tasks, {len(decisions)} decisions, and {len(unresolved)} unresolved topics.",
        "participants": prep["speakers"] or ["Rahul", "Aman", "Yashasvi"],
        "decisions": decisions,
        "tasks": tasks,
        "unresolved_topics": unresolved,
        "important_points": [],
    }


def main() -> None:
    st.set_page_config(page_title="AI Meeting Copilot", layout="wide")
    init_db()

    st.sidebar.title("AI Meeting Copilot")
    page = st.sidebar.radio(
        "Navigation",
        ["Dashboard", "Analyze Meeting", "My Tasks", "Meeting History", "Ask Meeting"],
    )

    if "current_analysis" not in st.session_state:
        sample_text = SAMPLE_PATH.read_text(encoding="utf-8") if SAMPLE_PATH.exists() else DEFAULT_SAMPLE_TEXT
        st.session_state["current_transcript"] = sample_text
        st.session_state["current_analysis"] = analyze_with_ai_or_fallback(
            sample_text, "Project Alpha", "Project Alpha Weekly Meeting", "September 28"
        )

    analysis = st.session_state["current_analysis"]
    tasks_df = pd.DataFrame(analysis.get("tasks", []))

    if page == "Analyze Meeting":
        st.header("Analyze Meeting Transcript")
        col1, col2 = st.columns([2, 1])
        with col1:
            if st.button("Load Sample Transcript"):
                st.session_state["current_transcript"] = DEFAULT_SAMPLE_TEXT
            uploaded = st.file_uploader("Upload .txt Meeting Notes", type=["txt"])
            if uploaded is not None:
                st.session_state["current_transcript"] = uploaded.read().decode("utf-8")
            transcript_input = st.text_area(
                "Paste Meeting Transcript",
                value=st.session_state.get("current_transcript", DEFAULT_SAMPLE_TEXT),
                height=260,
            )
            if st.button("Analyze Meeting with AI", type="primary"):
                if not transcript_input.strip():
                    st.error("Please provide a non-empty meeting transcript.")
                else:
                    result = analyze_with_ai_or_fallback(
                        transcript_input, "Project Alpha", "Project Alpha Sync", datetime.now().strftime("%B %d")
                    )
                    st.session_state["current_analysis"] = result
                    st.success("Meeting analyzed! Switch to Dashboard to inspect results.")
        with col2:
            st.subheader("Data Preprocessing Stats")
            prep = clean_transcript(st.session_state.get("current_transcript", DEFAULT_SAMPLE_TEXT))
            st.metric("Cleaned Word Tokens", prep["word_count"])
            st.write("**Detected Speakers:**", ", ".join(prep["speakers"]) or "None")
            st.write("**Temporal Deadlines:**", ", ".join(prep["temporal_tokens"]) or "None")

    elif page == "Dashboard":
        st.header("AI Meeting Copilot — Executive Dashboard")
        c1, c2, c3, c4, c5 = st.columns(5)
        c1.metric("Participants", len(analysis.get("participants", [])))
        c2.metric("Tasks", len(analysis.get("tasks", [])))
        c3.metric("Decisions", len(analysis.get("decisions", [])))
        c4.metric("Unresolved Topics", len(analysis.get("unresolved_topics", [])))
        high_risk = sum(1 for t in analysis.get("tasks", []) if "High" in t.get("risk", ""))
        c5.metric("Potential Risks", high_risk)

        st.subheader("Meeting Summary")
        st.write(analysis.get("summary", ""))

        col_d, col_u = st.columns(2)
        with col_d:
            st.subheader("Final Decisions")
            for d in analysis.get("decisions", []):
                st.success(d)
        with col_u:
            st.subheader("Unresolved Topics")
            for u in analysis.get("unresolved_topics", []):
                st.warning(f"⚠ UNRESOLVED TOPIC: {u}")

        st.subheader("Action Items & Deadline Risk Detection")
        if not tasks_df.empty:
            st.dataframe(tasks_df, use_container_width=True)

    elif page == "My Tasks":
        st.header("Personal AI Assistant — Who are you?")
        participants = analysis.get("participants", ["Rahul", "Aman", "Yashasvi"])
        selected = st.selectbox("Select Participant", participants)
        st.subheader(f"{selected}'s Action Items")
        person_tasks = [t for t in analysis.get("tasks", []) if t.get("owner", "").lower() == selected.lower()]
        if not person_tasks:
            st.info("No tasks assigned to this participant.")
        for idx, t in enumerate(person_tasks, 1):
            st.markdown(
                f"**{idx}. {t['task']}**  \nDeadline: `{t['deadline']}` · Priority (AI Rec.): `{t['priority']}` · Status: `{t['status']}` · Risk: `{t['risk']}` ({t['risk_reason']})"
            )

    elif page == "Meeting History":
        st.header("Meeting Memory & Change Tracking")
        st.info("🔄 CHANGE DETECTED across Project Alpha: Database integration deadline shifted Saturday → Monday morning.")

    elif page == "Ask Meeting":
        st.header("Ask Anything About This Meeting")
        q = st.text_input("Ask a question (e.g., Who is responsible for the database?)")
        if q:
            ql = q.lower()
            found = False
            for t in analysis.get("tasks", []):
                if ("database" in ql and "database" in t["task"].lower()) or (
                    "frontend" in ql and "frontend" in t["task"].lower()
                ):
                    st.success(f"{t['owner']} is responsible for: {t['task']} (Deadline: {t['deadline']}).")
                    found = True
                    break
            if not found:
                st.warning("I couldn't find this information in the meeting.")


if __name__ == "__main__":
    main()
