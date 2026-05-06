// Utility functions
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (amount == null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getSLAStatus(slaDueDate) {
  if (!slaDueDate) return { label: 'N/A', className: 'badge-neutral' };
  const now = new Date();
  const due = new Date(slaDueDate);
  const diffMs = due - now;
  const diffHours = diffMs / 3600000;

  if (diffMs <= 0) {
    const breachedHours = Math.abs(Math.floor(diffHours));
    const breachedDays = Math.floor(breachedHours / 24);
    return {
      label: breachedDays > 0 ? `Breached ${breachedDays}d ago` : `Breached ${breachedHours}h ago`,
      className: 'sla-red',
      breached: true,
    };
  }

  if (diffHours < 4) return { label: `${Math.floor(diffHours)}h ${Math.floor((diffMs % 3600000) / 60000)}m left`, className: 'sla-red', breached: false };
  if (diffHours < 24) return { label: `${Math.floor(diffHours)}h left`, className: 'sla-yellow', breached: false };
  const days = Math.floor(diffHours / 24);
  return { label: `${days}d left`, className: 'sla-green', breached: false };
}

export function getComplianceStatus(expiryDate) {
  if (!expiryDate) return { status: 'Unknown', className: 'badge-neutral' };
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.floor((expiry - now) / 86400000);

  if (diffDays < 0) return { status: 'Expired', className: 'badge-danger', days: Math.abs(diffDays) };
  if (diffDays <= 30) return { status: 'Expiring Soon', className: 'badge-warning', days: diffDays };
  return { status: 'Valid', className: 'badge-success', days: diffDays };
}

export function getStatusBadgeClass(status) {
  const map = {
    'Completed': 'badge-success',
    'Active': 'badge-success',
    'Approved': 'badge-success',
    'Valid': 'badge-success',
    'Resolved': 'badge-success',
    'Closed': 'badge-success',
    'Compliant': 'badge-success',
    'In Progress': 'badge-info',
    'Open': 'badge-info',
    'Pending': 'badge-orange',
    'Pending Approval': 'badge-orange',
    'Submitted': 'badge-orange',
    'Draft': 'badge-neutral',
    'Not Started': 'badge-neutral',
    'Inactive': 'badge-neutral',
    'Blocked': 'badge-danger',
    'Rejected': 'badge-danger',
    'Overdue': 'badge-danger',
    'Expired': 'badge-danger',
    'Non-Compliant': 'badge-danger',
    'SLA Breached': 'badge-danger',
    'Expiring Soon': 'badge-warning',
    'Critical': 'badge-danger',
    'High': 'badge-orange',
    'Medium': 'badge-warning',
    'Low': 'badge-success',
  };
  return map[status] || 'badge-neutral';
}

export function getSeverityBadgeClass(severity) {
  const map = {
    'Critical': 'badge-danger',
    'High': 'badge-orange',
    'Medium': 'badge-warning',
    'Low': 'badge-success',
  };
  return map[severity] || 'badge-neutral';
}

export const STAGE_NAMES = [
  'Discovery',
  'Evaluation',
  'Model Selection',
  'Design & Planning',
  'Construction & Execution',
  'Handover & Post-Construction',
];

export const LOCATIONS = ['Bangalore', 'Hyderabad', 'Pune'];

export const VENDOR_TYPES = ['Construction', 'IT', 'HR', 'Legal', 'Facilities', 'Finance'];

export const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export const ESCALATION_SLA = {
  Critical: 4,       // hours
  High: 24,          // hours
  Medium: 72,        // hours (3 days)
  Low: 120,          // hours (5 days)
};

export const ESCALATION_ASSIGN = {
  Critical: 1, // John Smith
  High: 1,     // John Smith
  Medium: 2,   // Sarah Davis
  Low: 2,      // Sarah Davis
};

export const PO_SLA_HOURS = {
  under50k: 24,      // 1 day
  under500k: 48,     // 2 days
  above500k: 120,    // 5 days
};

export function calculatePOSLA(amount) {
  if (amount < 50000) return PO_SLA_HOURS.under50k;
  if (amount < 500000) return PO_SLA_HOURS.under500k;
  return PO_SLA_HOURS.above500k;
}

export function calculatePOApprovalType(amount) {
  if (amount < 50000) return 'auto';
  if (amount <= 500000) return 'pmo';
  return 'blocked';
}
