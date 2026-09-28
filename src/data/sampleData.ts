import { MeetingRecord, SampleTranscript } from '../types/meeting';

export const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    id: 'sample-alpha-weekly',
    label: 'Sample 1: Project Alpha Weekly (Hackathon Demo)',
    project: 'Project Alpha',
    title: 'Project Alpha Weekly Meeting',
    date: 'September 28',
    description: 'Core hackathon demo transcript featuring Rahul, Aman, Yashasvi, React decision, cloud provider unresolved topic, and deadline risks.',
    transcript: `Project Alpha Weekly Meeting

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
The final project review will be on Monday. Also, we need to complete the entire end-to-end backend security audit by tomorrow morning.`
  },
  {
    id: 'sample-alpha-followup',
    label: 'Sample 2: Project Alpha Follow-up (Change Tracking Demo)',
    project: 'Project Alpha',
    title: 'Project Alpha — Meeting 2 (Mid-Sprint Sync)',
    date: 'September 30',
    description: 'Follow-up meeting for Project Alpha demonstrating automatic Change Detection (deadline shifts, completed tasks, and reassigned owners).',
    transcript: `Project Alpha Mid-Sprint Sync — September 30

Manager:
Let's review progress since our September 28 weekly meeting.

Rahul:
I have completed the frontend login page ahead of Friday's deadline. Now I will build the dashboard analytics charts by Wednesday.

Aman:
The schema migration took longer than expected. The database integration deadline needs to move from Saturday to Monday.

Yashasvi:
I am still working on the presentation for Monday, it is currently in progress. Also, Rahul will now take over the API documentation task that was previously unassigned.

Team:
Regarding the cloud provider discussion from last meeting, we decided to use AWS Instead of Azure for hosting.

Aman:
However, we still haven't decided whether to use PostgreSQL or MongoDB for the audit log service.`
  },
  {
    id: 'sample-crunch-risk',
    label: 'Sample 3: High-Risk Release War Room',
    project: 'Project Beta',
    title: 'Q4 Launch Readiness Review',
    date: 'October 2',
    description: 'Demonstrates multi-factor Deadline Risk Detection: missing owners, missing deadlines, conflicting schedules, and oversized tasks.',
    transcript: `Project Beta — Q4 Launch Readiness Review

Priya:
We have a critical production memory leak in the checkout worker. I will fix the production bug by tomorrow morning.

Vikram:
I need to rewrite the entire billing microservice and migrate 2 million customer records by tomorrow evening.

Priya:
Wait, doesn't the billing microservice depend on the checkout worker fix and the new Stripe webhook approval?

Vikram:
Yes, it depends on both of those being finished first.

Manager:
Someone also needs to prepare the SOC2 compliance report, though we haven't assigned an owner or a deadline yet.

Vikram:
Should we enable rate-limiting at the edge gateway or inside the application container? We talked about both options for twenty minutes but haven't reached a consensus yet.

Priya:
I will also update the developer README documentation sometime next week.

Team:
We decided to freeze all non-critical UI changes until after the October 5 release.`
  }
];

export const INITIAL_MEETINGS: MeetingRecord[] = [
  {
    id: 'meeting-alpha-1',
    project: 'Project Alpha',
    title: 'Meeting 1 — Weekly Sprint & Architecture Sync',
    date: 'September 28',
    createdAt: '2026-09-28T10:00:00.000Z',
    transcript: `Project Alpha Weekly Meeting

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
The final project review will be on Monday. Also, we need to complete the entire end-to-end backend security audit by tomorrow morning.`,
    summary:
      'The team aligned on deliverables leading up to the final project review on Monday. Rahul is assigned to the frontend login page (due Friday), Aman is handling database integration (due Saturday), and Yashasvi is preparing the review presentation (due Monday). The team officially decided to build the frontend with React after considering Angular, while cloud provider selection remains unresolved and an urgent backend security audit was requested for tomorrow without a clear owner.',
    participants: ['Rahul', 'Aman', 'Yashasvi', 'Manager'],
    decisions: [
      {
        id: 'dec-1',
        decision: 'Use React as the frontend framework',
        context: 'Selected React over Angular following team discussion led by Rahul.'
      },
      {
        id: 'dec-2',
        decision: 'Schedule final project review for Monday',
        context: 'Confirmed by Manager as the target milestone for all sprint deliverables.'
      }
    ],
    discussions: [
      {
        id: 'disc-1',
        topic: 'Frontend Framework Selection (React vs. Angular)',
        quote_or_summary: 'Rahul asked: "Should we use React or Angular?" followed by team agreement to adopt React.',
        outcome: 'Final Decision'
      },
      {
        id: 'disc-2',
        topic: 'Cloud Platform Selection',
        quote_or_summary: 'Aman raised that the team still needs to decide which cloud provider to use for deployment.',
        outcome: 'Unresolved'
      },
      {
        id: 'disc-3',
        topic: 'Final Project Review Timeline',
        quote_or_summary: 'Manager announced the final project review will take place on Monday.',
        outcome: 'Final Decision'
      }
    ],
    tasks: [
      {
        id: 'task-101',
        task: 'Complete the frontend login page',
        owner: 'Rahul',
        deadline: 'Friday',
        priority: 'High',
        priority_reason: 'Core user-facing authentication flow required before weekend integration and Monday review.',
        status: 'Pending',
        risk: 'Low Risk',
        risk_reason: 'Well-scoped component with a clear owner (Rahul) and reasonable Friday deadline.'
      },
      {
        id: 'task-102',
        task: 'Complete database integration',
        owner: 'Aman',
        deadline: 'Saturday',
        priority: 'High',
        priority_reason: 'Critical technical backbone needed prior to the Monday final project review.',
        status: 'Pending',
        risk: 'Medium Risk',
        risk_reason: 'Multiple dependencies — database integration finishes on Saturday, leaving minimal buffer before Monday presentation.'
      },
      {
        id: 'task-103',
        task: 'Prepare the project presentation',
        owner: 'Yashasvi',
        deadline: 'Monday',
        priority: 'Medium',
        priority_reason: 'Essential for the Monday final project review, contingent on technical progress.',
        status: 'Pending',
        risk: 'Medium Risk',
        risk_reason: 'Conflicting deadlines — presentation is due Monday, the exact same day as the final project review.'
      },
      {
        id: 'task-104',
        task: 'Complete entire end-to-end backend security audit',
        owner: 'Not specified',
        deadline: 'Tomorrow morning',
        priority: 'High',
        priority_reason: 'Explicitly flagged by Manager with immediate next-day urgency.',
        status: 'Pending',
        risk: 'High Risk',
        risk_reason: 'Large task with a very short deadline ("Tomorrow morning") and missing assigned owner.'
      }
    ],
    unresolved_topics: [
      {
        id: 'unres-1',
        topic: 'Cloud platform / provider selection',
        status: 'Decision pending',
        discussed_by: 'Aman',
        context: 'Aman noted "We still need to decide which cloud provider to use" — no final decision was reached during the meeting.'
      }
    ],
    important_points: [
      'Final project review is scheduled for Monday.',
      'Frontend stack is locked in as React.',
      'Cloud hosting provider remains undecided and blocks final deployment setup.'
    ],
    changes_detected: []
  },
  {
    id: 'meeting-alpha-2',
    project: 'Project Alpha',
    title: 'Meeting 2 — Mid-Sprint Checkpoint',
    date: 'September 30',
    createdAt: '2026-09-30T14:30:00.000Z',
    transcript: `Project Alpha Mid-Sprint Checkpoint — September 30

Rahul:
I finished the frontend login page on time. Now I am starting on the role-based dashboard UI due by Sunday.

Aman:
Because of schema adjustments, the database integration deadline is moving from Saturday to Monday morning.

Yashasvi:
My presentation deck is in progress for Monday. However, because the database deadline moved to Monday, I might need Aman's final architecture diagram by Sunday night.

Manager:
Understood. Let's reassign the backend security audit to Aman and Rahul jointly with a revised deadline of Sunday evening.

Team:
We still haven't finalized whether to use AWS or GCP for the cloud platform.`,
    summary:
      'In the September 30 follow-up for Project Alpha, Rahul completed the frontend login page and picked up the role-based dashboard UI (due Sunday). Aman pushed the database integration deadline from Saturday to Monday morning due to schema changes. The previously unassigned backend security audit was assigned to Aman and Rahul with a Sunday evening deadline, while cloud platform selection (AWS vs. GCP) remains unresolved.',
    participants: ['Rahul', 'Aman', 'Yashasvi', 'Manager'],
    decisions: [
      {
        id: 'dec-201',
        decision: 'Extend database integration deadline from Saturday to Monday morning',
        context: 'Approved by Manager after Aman reported schema adjustments.'
      },
      {
        id: 'dec-202',
        decision: 'Assign backend security audit jointly to Aman and Rahul for Sunday evening',
        context: 'Resolved the previously unassigned high-risk task from Meeting 1.'
      }
    ],
    discussions: [
      {
        id: 'disc-201',
        topic: 'Database Integration Schedule Slip',
        quote_or_summary: 'Aman explained schema adjustments require moving the database deadline from Saturday to Monday.',
        outcome: 'Final Decision'
      },
      {
        id: 'disc-202',
        topic: 'Cloud Provider Selection (AWS vs. GCP)',
        quote_or_summary: 'Team discussed AWS vs. GCP options but deferred the final hosting decision again.',
        outcome: 'Unresolved'
      }
    ],
    tasks: [
      {
        id: 'task-201',
        task: 'Complete the frontend login page',
        owner: 'Rahul',
        deadline: 'Friday',
        priority: 'High',
        priority_reason: 'Core sprint deliverable from Meeting 1.',
        status: 'Completed',
        risk: 'Low Risk',
        risk_reason: 'Task completed on schedule.'
      },
      {
        id: 'task-202',
        task: 'Complete database integration',
        owner: 'Aman',
        deadline: 'Monday morning',
        priority: 'High',
        priority_reason: 'Blocking dependency for final project review.',
        status: 'In Progress',
        risk: 'High Risk',
        risk_reason: 'Conflicting deadlines & dependency risk — shifted from Saturday to Monday morning, the same day as the final review.'
      },
      {
        id: 'task-203',
        task: 'Prepare the project presentation',
        owner: 'Yashasvi',
        deadline: 'Monday',
        priority: 'Medium',
        priority_reason: 'Required for Monday review with Manager.',
        status: 'In Progress',
        risk: 'Medium Risk',
        risk_reason: 'Depends on Aman delivering the final architecture diagram by Sunday night.'
      },
      {
        id: 'task-204',
        task: 'Complete end-to-end backend security audit',
        owner: 'Aman',
        deadline: 'Sunday evening',
        priority: 'High',
        priority_reason: 'Required before Monday project review.',
        status: 'Pending',
        risk: 'High Risk',
        risk_reason: 'Overlapping workload — Aman is simultaneously handling database integration and the security audit.'
      },
      {
        id: 'task-205',
        task: 'Build role-based dashboard UI',
        owner: 'Rahul',
        deadline: 'Sunday',
        priority: 'Medium',
        priority_reason: 'Next frontend milestone following login completion.',
        status: 'In Progress',
        risk: 'Low Risk',
        risk_reason: 'Clear owner and defined scope.'
      }
    ],
    unresolved_topics: [
      {
        id: 'unres-201',
        topic: 'Cloud platform selection (AWS vs. GCP)',
        status: 'Decision pending (Carried over from Sept 28)',
        discussed_by: 'Team',
        context: 'Still undecided between AWS and GCP after two consecutive meetings.'
      }
    ],
    important_points: [
      'Frontend login page is now Completed.',
      'Database integration slipped from Saturday to Monday morning.',
      'Aman has a high workload concentration going into the weekend.'
    ],
    changes_detected: [
      {
        id: 'chg-1',
        change_type: 'Deadline Changed',
        subject: 'Database integration (Aman)',
        previous_value: 'Saturday',
        current_value: 'Monday morning',
        details: 'Database integration deadline was pushed back due to schema adjustments.'
      },
      {
        id: 'chg-2',
        change_type: 'Task Completed',
        subject: 'Complete the frontend login page (Rahul)',
        previous_value: 'Pending',
        current_value: 'Completed',
        details: 'Rahul finished the frontend login page ahead of the Friday deadline.'
      },
      {
        id: 'chg-3',
        change_type: 'Task Reassigned',
        subject: 'End-to-end backend security audit',
        previous_value: 'Owner: Not specified (Due: Tomorrow morning)',
        current_value: 'Owner: Aman (Due: Sunday evening)',
        details: 'Manager assigned the previously unowned security audit and adjusted the target date.'
      },
      {
        id: 'chg-4',
        change_type: 'New Task Added',
        subject: 'Build role-based dashboard UI',
        previous_value: 'Not in previous meeting',
        current_value: 'Assigned to Rahul (Due: Sunday)',
        details: 'Added as the next frontend deliverable after login page completion.'
      }
    ]
  },
  {
    id: 'meeting-alpha-3',
    project: 'Project Alpha',
    title: 'Meeting 3 — Pre-Review Final Readiness',
    date: 'October 2',
    createdAt: '2026-10-02T09:00:00.000Z',
    transcript: `Project Alpha Pre-Review Final Readiness — October 2

Manager:
Let's do a final check of our action items and decisions.

Aman:
Database integration is now completed, and we finished the backend security audit.

Rahul:
The role-based dashboard UI is completed as well.

Yashasvi:
The presentation deck is completed and ready for the review. I will also send out the post-review executive summary by Tuesday.

Team:
For the cloud provider topic that was unresolved, we decided to use Google Cloud Run for our production deployment instead of AWS.

Manager:
Great work everyone. One last question: should we open beta access to 50 internal testers or 500 external users first? Let's think about it and decide later this week.`,
    summary:
      'In the October 2 readiness meeting, the team confirmed completion of the database integration, backend security audit, role-based dashboard UI, and project presentation. The previously unresolved cloud provider question was finalized with a decision to adopt Google Cloud Run. Yashasvi took on a new follow-up task to distribute the executive summary by Tuesday, while beta rollout cohort sizing (50 internal vs. 500 external users) was left unresolved.',
    participants: ['Manager', 'Aman', 'Rahul', 'Yashasvi'],
    decisions: [
      {
        id: 'dec-301',
        decision: 'Use Google Cloud Run as the production cloud provider',
        context: 'Resolved the multi-meeting cloud provider topic by selecting Google Cloud Run over AWS.'
      }
    ],
    discussions: [
      {
        id: 'disc-301',
        topic: 'Cloud Provider Finalization',
        quote_or_summary: 'Team resolved the open cloud provider question by choosing Google Cloud Run.',
        outcome: 'Final Decision'
      },
      {
        id: 'disc-302',
        topic: 'Beta Rollout Cohort Size (50 Internal vs. 500 External Users)',
        quote_or_summary: 'Manager asked whether beta access should target 50 internal testers or 500 external users first.',
        outcome: 'Unresolved'
      }
    ],
    tasks: [
      {
        id: 'task-301',
        task: 'Complete database integration',
        owner: 'Aman',
        deadline: 'Monday morning',
        priority: 'High',
        priority_reason: 'Core backend milestone.',
        status: 'Completed',
        risk: 'Low Risk',
        risk_reason: 'Completed prior to final review.'
      },
      {
        id: 'task-302',
        task: 'Complete end-to-end backend security audit',
        owner: 'Aman',
        deadline: 'Sunday evening',
        priority: 'High',
        priority_reason: 'Security sign-off.',
        status: 'Completed',
        risk: 'Low Risk',
        risk_reason: 'Audit completed.'
      },
      {
        id: 'task-303',
        task: 'Build role-based dashboard UI',
        owner: 'Rahul',
        deadline: 'Sunday',
        priority: 'Medium',
        priority_reason: 'Frontend milestone.',
        status: 'Completed',
        risk: 'Low Risk',
        risk_reason: 'Completed on time.'
      },
      {
        id: 'task-304',
        task: 'Prepare the project presentation',
        owner: 'Yashasvi',
        deadline: 'Monday',
        priority: 'Medium',
        priority_reason: 'Final review deck.',
        status: 'Completed',
        risk: 'Low Risk',
        risk_reason: 'Deck completed and ready.'
      },
      {
        id: 'task-305',
        task: 'Send post-review executive summary',
        owner: 'Yashasvi',
        deadline: 'Tuesday',
        priority: 'Low',
        priority_reason: 'Routine post-meeting documentation follow-up.',
        status: 'Pending',
        risk: 'Low Risk',
        risk_reason: 'Clear owner (Yashasvi) and realistic Tuesday deadline.'
      }
    ],
    unresolved_topics: [
      {
        id: 'unres-301',
        topic: 'Beta rollout cohort size (50 internal testers vs. 500 external users)',
        status: 'Decision pending',
        discussed_by: 'Manager',
        context: 'Manager proposed deciding later this week whether to launch beta to 50 internal or 500 external users.'
      }
    ],
    important_points: [
      'All four critical sprint deliverables from Meetings 1 and 2 are now Completed.',
      'Cloud provider selection is finally resolved (Google Cloud Run).',
      'New open discussion around beta rollout cohort size.'
    ],
    changes_detected: [
      {
        id: 'chg-301',
        change_type: 'Decision Changed',
        subject: 'Cloud Provider Selection',
        previous_value: 'Unresolved (AWS vs. GCP)',
        current_value: 'Decided: Google Cloud Run',
        details: 'The previously unresolved cloud hosting topic was finalized in favor of Google Cloud Run.'
      },
      {
        id: 'chg-302',
        change_type: 'Task Completed',
        subject: 'Database integration, Security audit, Dashboard UI & Presentation',
        previous_value: 'In Progress / Pending',
        current_value: 'Completed',
        details: 'Aman, Rahul, and Yashasvi completed all pending sprint deliverables.'
      },
      {
        id: 'chg-303',
        change_type: 'New Task Added',
        subject: 'Send post-review executive summary',
        previous_value: 'Not in previous meeting',
        current_value: 'Assigned to Yashasvi (Due: Tuesday)',
        details: 'Follow-up communication task added for Tuesday.'
      }
    ]
  }
];
