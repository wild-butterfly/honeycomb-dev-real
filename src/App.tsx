import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import CalendarPage from "./pages/CalendarPage";
import JobPage from "./pages/JobPage";
import TaskPage from "./pages/TaskPage";
import EmployeeNotesPage from "./pages/EmployeeNotesPage";
import FilesPhotosPage from "./pages/FilesPhotosPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutUsPage from "./pages/AboutUsPage";
import HelpPage from "./pages/HelpPage";
import JobSummaryPage from "./pages/JobSummaryPage";
import FinancialSummaryPage from "./pages/FinancialSummaryPage";
import CostReportPage from "./pages/CostReportPage";
import InvoicingPage from "./pages/InvoicingPage";
import SettingsPage from "./pages/SettingsPage";
import AdminServiceCatalogsPage from "./pages/AdminServiceCatalogsPage";

import { NewJobModalProvider } from "./components/NewJobModalContext";
import { CompanyProvider } from "./context/CompanyContext";
import { AuthProvider } from "./context/AuthContext";

/* ======================================================
   TYPES
====================================================== */

type CustomerType = {
  id: number;
  name: string;
};

/* ======================================================
   APP (ROUTED)
====================================================== */

const App: React.FC = () => {
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerType[]>([]);

  // Dashboard sayfalarında navbar/footer gizli
  const isDashboard =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/admin");

  const handleAddCustomer = (customer: Omit<CustomerType, "id">) => {
    const newCustomer: CustomerType = {
      ...customer,
      id: Date.now(),
    };
    setCustomers((prev) => [...prev, newCustomer]);
  };

  return (
    <div id="root-layout" className={isDashboard ? "no-footer" : undefined}>
      {!isDashboard && <Navbar />}

      <main id="app-content">
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />

          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/help" element={<HelpPage />} />

          <Route path="/tasks" element={<TaskPage />} />

          {/* DASHBOARD */}
          <Route
            path="/dashboard"
            element={
              <NewJobModalProvider
                customers={customers}
                onAddCustomer={handleAddCustomer}
              >
                <DashboardPage
                  search={search}
                  setSearch={setSearch}
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                />
              </NewJobModalProvider>
            }
          />

          <Route
            path="/dashboard/calendar"
            element={
              <NewJobModalProvider
                customers={customers}
                onAddCustomer={handleAddCustomer}
              >
                <CalendarPage />
              </NewJobModalProvider>
            }
          />

          {/* ✅ JOB (DASHBOARD) — BUNLAR Routes İÇİNDE KALMALI */}
          <Route path="/dashboard/jobs/:id" element={<JobPage />} />
          <Route
            path="/dashboard/jobs/:id/summary"
            element={<JobSummaryPage />}
          />
          <Route
            path="/dashboard/jobs/:id/employee-notes"
            element={<EmployeeNotesPage />}
          />
          <Route
            path="/dashboard/jobs/:id/files-photos"
            element={<FilesPhotosPage />}
          />
          <Route
            path="/dashboard/jobs/:id/financial-summary"
            element={<FinancialSummaryPage />}
          />
          <Route
            path="/dashboard/jobs/:id/cost-report"
            element={<CostReportPage />}
          />
          <Route
            path="/dashboard/jobs/:id/invoicing"
            element={<InvoicingPage />}
          />

          {/* INVOICING */}
          <Route path="/dashboard/invoices" element={<InvoicingPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminServiceCatalogsPage />} />
          <Route
            path="/admin/service-catalogs"
            element={<AdminServiceCatalogsPage />}
          />
        </Routes>
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
};

/* ======================================================
   ROOT WRAPPER
====================================================== */

const RootApp: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <CompanyProvider>
        <App />
      </CompanyProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default RootApp;
