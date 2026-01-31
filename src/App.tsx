// src/App.tsx

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

import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutUsPage from "./pages/AboutUsPage";
import HelpPage from "./pages/HelpPage";

import { setCompanyId } from "./lib/firestorePaths";
import { NewJobModalProvider } from "./components/NewJobModalContext";
import type { CustomerType } from "./pages/DashboardPage";

/* ======================================================
   🔥 CRITICAL — SET COMPANY BEFORE ANY COMPONENT RENDERS
   MUST be outside React component
====================================================== */

setCompanyId("a1testing"); // later → from login user.profile.companyId

/* ======================================================
   APP
====================================================== */

const App: React.FC = () => {
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerType[]>([]);

  const isDashboard = location.pathname.startsWith("/dashboard");

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
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />

          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/help" element={<HelpPage />} />

          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/jobs/:id" element={<JobPage />} />

          {/* Dashboard */}
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
        </Routes>
      </main>

      {!isDashboard && <Footer />}
    </div>
  );
};

/* ======================================================
   ROOT WRAPPER
====================================================== */

const RootApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default RootApp;
