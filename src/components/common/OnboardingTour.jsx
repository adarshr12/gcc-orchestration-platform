import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../../context/AuthContext';

const PMO_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>
          Welcome to Embark GCC Platform
        </h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Your single source of truth for managing the end-to-end GCC lifecycle — replacing Excel, WhatsApp, and email with one unified workflow platform.
        </p>
        <p style={{ color: '#6366f1', fontWeight: 600, marginTop: '0.75rem', fontSize: '0.9rem' }}>
          Let's take a quick tour of everything at your disposal.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'a[href="/"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Portfolio Dashboard</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Monitor all your GCC projects at a glance — health indicators, budget variance, open escalations, SLA breaches, and compliance expiry alerts all in one view.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/projects"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Project Lifecycle</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Manage GCC projects through 6 structured stages: Discovery → Evaluation → Model Selection → Design & Planning → Construction → Handover. Each stage has mandatory gate checklists before progression.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/vendors"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Vendor Management</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Onboard vendors with document-based compliance tracking. Get automatic alerts when certificates (GST, Insurance, ISO) are expiring. Approve or reject vendors with a full audit trail.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/purchase-orders"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Purchase Orders & Maker-Checker</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Create POs with built-in maker-checker approval workflow. Threshold-based rules: under ₹50K auto-approves, ₹50K–₹5L needs PMO approval, above ₹5L requires Director sign-off. Budget actuals update automatically on approval.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/escalations"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Escalation Management & SLA</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          All client-raised issues flow here with SLA countdowns. Critical escalations must resolve in 4 hours, High in 24 hours, Medium in 3 days, Low in 5 days. Breached SLAs show red alerts on your dashboard.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/safety"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Safety Inspections</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Log site safety inspections with structured checklists — fire exits, PPE, emergency contacts, electrical, first aid, and more. Non-compliant inspections trigger alerts on the dashboard.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/attendance"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Attendance Tracking</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Log daily attendance for your project workforce. Track present/absent status per worker, per project, per date — replacing manual registers and WhatsApp updates.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/reports"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Reports & Analytics</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          View portfolio-level KPIs: Cost Performance Index, Schedule Adherence, SLA Compliance rate, and Vendor Compliance rate. Export reports for client communication.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>
          You're all set!
        </h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Start by opening a project to see stage gates in action, or head to the Dashboard to review active escalations and budget health.
        </p>
        <p style={{ color: '#6366f1', fontWeight: 600, marginTop: '0.75rem', fontSize: '0.9rem' }}>
          This tour runs every time you open the app so you always have a reference.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

const CLIENT_STEPS = [
  {
    target: 'body',
    content: (
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>
          Welcome to Your GCC Portal
        </h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Track your GCC setup in real time — no more waiting for weekly email updates. Everything you need is right here.
        </p>
        <p style={{ color: '#6366f1', fontWeight: 600, marginTop: '0.75rem', fontSize: '0.9rem' }}>
          Let us show you around.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: 'a[href="/"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Project Dashboard</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          See your GCC setup progress at a glance — current stage, milestone completion, budget burn, and workstream health indicators.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/my-project"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>My Project</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          View your project's 6-stage lifecycle, milestone status, and team communications — read-only so you always have the latest picture without needing to call your PMO.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/escalations"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Raise & Track Escalations</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Flag issues directly in the platform. Choose severity (Low / Medium / High / Critical) and the system auto-assigns to the right person with an SLA timer. Track the resolution thread without sending a single email.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'a[href="/notifications"]',
    content: (
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>Notifications</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Get real-time updates — when your escalation is picked up, when a stage advances, when a PO is approved. No more chasing updates over WhatsApp.
        </p>
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e3a5f' }}>
          You're ready!
        </h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Head to your Dashboard to see the current status of your GCC setup, or raise an escalation if something needs attention.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

const tourStyles = {
  options: {
    primaryColor: '#6366f1',
    textColor: '#0f172a',
    backgroundColor: '#ffffff',
    arrowColor: '#ffffff',
    zIndex: 10000,
    width: 380,
  },
  tooltip: {
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    padding: '1.5rem',
  },
  tooltipContainer: {
    textAlign: 'left',
  },
  tooltipTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1e3a5f',
  },
  tooltipContent: {
    padding: '0.5rem 0',
    lineHeight: 1.6,
    color: '#475569',
  },
  tooltipFooter: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonNext: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    borderRadius: 10,
    padding: '0.6rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
  },
  buttonBack: {
    background: 'transparent',
    color: '#6366f1',
    border: '1px solid #6366f1',
    borderRadius: 10,
    padding: '0.6rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonSkip: {
    color: '#94a3b8',
    background: 'transparent',
    border: 'none',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  buttonClose: {
    color: '#94a3b8',
  },
  spotlight: {
    borderRadius: 12,
  },
  beacon: {
    display: 'none',
  },
};

export default function OnboardingTour() {
  const { isPMO } = useAuth();
  const [run, setRun] = useState(false);

  // Start tour every time the app opens
  useEffect(() => {
    const timer = setTimeout(() => setRun(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCallback = ({ status }) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
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
      disableScrolling={false}
      callback={handleCallback}
      styles={tourStyles}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next →',
        open: 'Open',
        skip: 'Skip Tour',
      }}
    />
  );
}
