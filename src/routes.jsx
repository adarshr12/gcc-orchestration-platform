import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// PMO Pages
import PMODashboard from './pages/pmo/Dashboard';
import ProjectList from './pages/pmo/ProjectList';
import CreateProject from './pages/pmo/CreateProject';
import ProjectDetail from './pages/pmo/ProjectDetail';
import StageGates from './pages/pmo/StageGates';
import VendorList from './pages/pmo/VendorList';
import VendorDetail from './pages/pmo/VendorDetail';
import AddVendor from './pages/pmo/AddVendor';
import PurchaseOrders from './pages/pmo/PurchaseOrders';
import CreatePO from './pages/pmo/CreatePO';
import EscalationList from './pages/pmo/EscalationList';
import EscalationDetail from './pages/pmo/EscalationDetail';
import SafetyChecklists from './pages/pmo/SafetyChecklists';
import Attendance from './pages/pmo/Attendance';
import Reports from './pages/pmo/Reports';
import AuditLogs from './pages/pmo/AuditLogs';


// Client Pages
import ClientDashboard from './pages/client/Dashboard';
import MyProject from './pages/client/MyProject';
import ClientEscalations from './pages/client/Escalations';
import RaiseEscalation from './pages/client/RaiseEscalation';
import ClientEscalationDetail from './pages/client/EscalationDetail';
import ClientNotifications from './pages/client/Notifications';
import BudgetSummary from './pages/client/BudgetSummary';

export default function AppRoutes() {
  const { isPMO } = useAuth();

  if (isPMO) {
    return (
      <Routes>
        <Route path="/" element={<PMODashboard />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/new" element={<CreateProject />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/stages/:stageId" element={<StageGates />} />
        <Route path="/vendors" element={<VendorList />} />
        <Route path="/vendors/new" element={<AddVendor />} />
        <Route path="/vendors/:id" element={<VendorDetail />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/purchase-orders/new" element={<CreatePO />} />
        <Route path="/escalations" element={<EscalationList />} />
        <Route path="/escalations/:id" element={<EscalationDetail />} />
        <Route path="/safety" element={<SafetyChecklists />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/audit" element={<AuditLogs />} />
      </Routes>

    );
  }

  return (
    <Routes>
      <Route path="/" element={<ClientDashboard />} />
      <Route path="/my-project" element={<MyProject />} />
      <Route path="/my-project/budget" element={<BudgetSummary />} />
      <Route path="/escalations" element={<ClientEscalations />} />
      <Route path="/escalations/new" element={<RaiseEscalation />} />
      <Route path="/escalations/:id" element={<ClientEscalationDetail />} />
      <Route path="/notifications" element={<ClientNotifications />} />
    </Routes>
  );
}
