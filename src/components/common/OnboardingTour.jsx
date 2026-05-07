import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuth } from '../../context/AuthContext';

const PMO_STEPS = [
  {
    target: 'body',
    title: 'Welcome to Embark',
    content: 'You are the PMO managing this GCC setup. This platform replaces the spreadsheets, WhatsApp threads, and email chains — everything your team needs to track, approve, and govern is here.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'a[href="/"]',
    title: 'Dashboard — Your Daily Briefing',
    content: 'Start every day here. The moment an SLA is breached, a compliance document expires, or a project goes off-track, it surfaces in this view. CPI and Schedule Adherence tell you portfolio health in two numbers.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/projects"]',
    title: 'GCC Mandates — The Lifecycle Engine',
    content: 'Every GCC you are setting up lives here. Click into any project to see its 6-stage journey: Discovery → Evaluation → Model Selection → Design → Construction → Handover. Each stage has mandatory gate checklists — a stage cannot advance until every gate is checked off. This is your governance layer.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/vendors"]',
    title: 'Vendors — Your GCC Supply Chain',
    content: 'Every partner you engage — legal firms, real estate brokers, IT vendors, facility managers — is tracked here. Compliance documents (GST, PF, ISO, Insurance) show expiry status. When a doc is about to lapse, a compliance alert appears on your dashboard before it becomes a risk.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/purchase-orders"]',
    title: 'Purchase Orders — Maker-Checker Workflow',
    content: 'Every vendor payment flows through a tiered approval chain: under ₹50K auto-approves, ₹50K–₹5L needs your sign-off, above ₹5L requires Director approval. Every approval or rejection is timestamped and linked to a budget phase. No payment leaves without a trail.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/escalations"]',
    title: 'Escalation Tracker — SLA on the Clock',
    content: 'When a client raises an issue, an SLA countdown starts immediately. Critical issues get 4 hours, High 24 hours, Medium 72 hours. You assign it, add comments, upload resolution notes. Breached SLAs show as red alerts on your dashboard — you cannot miss them.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/safety"]',
    title: 'Safety Checklists — Audit-Ready Records',
    content: 'For active construction sites, log daily safety inspections here: fire exits, PPE, electrical, first aid, emergency contacts. Every checklist is timestamped. If an inspection is non-compliant, it flags on your dashboard. This keeps you audit-ready for site visits.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/attendance"]',
    title: 'Attendance — Daily Workforce Log',
    content: 'Log which workers were on-site each day by project and role. The attendance rate auto-calculates — useful for contractor SLA compliance and payroll reconciliation. View history by date to pull any past record instantly.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/reports"]',
    title: 'Reports — Steering Committee Ready',
    content: 'CPI, Schedule Adherence, SLA Compliance %, Vendor Health — all calculated live from your actual data. This is the one page you screenshot for your weekly client steering committee. No manual PowerPoint needed.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/audit"]',
    title: 'Audit History — Full Traceability',
    content: 'Every action — stage changes, PO approvals, vendor updates, escalation resolutions — is logged here with the user and timestamp. Required for client governance reporting and internal audits. If anyone ever asks "who approved this?" — the answer is here.',
    placement: 'right',
    disableBeacon: true,
  },
];

const CLIENT_STEPS = [
  {
    target: 'body',
    title: 'Your GCC Setup Portal',
    content: 'You are a client whose GCC is being set up by the Embark PMO team. This portal gives you real-time transparency into your project — no more waiting for weekly email updates or status calls.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'a[href="/"]',
    title: 'Executive Dashboard — Your Cockpit',
    content: 'At a glance: what stage your setup is in, how much budget has been utilized, and which of the five workstreams (Legal, Real Estate, Talent, IT, Compliance) needs attention. If anything requires your input, it surfaces here as an action card.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/my-project"]',
    title: 'My Project — Full Transparency',
    content: 'Your complete project breakdown: the 6-stage lifecycle with stage gate status, all milestones and their due dates, and a phase-by-phase budget breakdown. Your PMO updates this in real time — you always have the latest picture without needing to ask.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/escalations"]',
    title: 'Raise a Priority Issue — No More Email Chains',
    content: 'If anything is blocked, delayed, or needs urgent attention, raise it here. Choose a severity level and the system routes it to the right person immediately with an SLA clock. You can track the resolution thread and get notified the moment it is resolved.',
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/notifications"]',
    title: 'Notifications — Stay in the Loop',
    content: 'Every update your PMO makes — stage progressions, PO approvals, escalation resolutions, milestone completions — lands here as a notification. This is your primary channel. No WhatsApp, no email, no chasing.',
    placement: 'right',
    disableBeacon: true,
  },
];

const tourStyles = {
  options: {
    primaryColor: '#6366f1',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    arrowColor: '#ffffff',
    overlayColor: 'rgba(15, 23, 42, 0.6)',
    zIndex: 10000,
    width: 400,
  },
  tooltip: {
    borderRadius: 16,
    boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
    padding: '1.75rem',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '0.625rem',
  },
  tooltipContent: {
    padding: '0',
    lineHeight: 1.7,
    color: '#475569',
    fontSize: '0.875rem',
  },
  buttonNext: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    borderRadius: 10,
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#fff',
    border: 'none',
  },
  buttonBack: {
    color: '#6366f1',
    background: 'transparent',
    border: '1.5px solid #e0e7ff',
    borderRadius: 10,
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginRight: '0.5rem',
  },
  buttonSkip: {
    color: '#94a3b8',
    background: 'transparent',
    border: 'none',
    fontSize: '0.8125rem',
    fontWeight: 500,
  },
  spotlight: {
    borderRadius: 12,
  },
};

export default function OnboardingTour() {
  const { isPMO } = useAuth();
  const [run, setRun] = useState(false);

  const tourKey = `embark_tour_done_${isPMO ? 'pmo' : 'client'}`;

  useEffect(() => {
    if (localStorage.getItem(tourKey)) return;
    const timer = setTimeout(() => setRun(true), 900);
    return () => clearTimeout(timer);
  }, [tourKey]);

  const handleCallback = ({ status }) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(tourKey, '1');
      setRun(false);
    }
  };

  const steps = isPMO ? PMO_STEPS : CLIENT_STEPS;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      spotlightClicks={false}
      callback={handleCallback}
      styles={tourStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
    />
  );
}
