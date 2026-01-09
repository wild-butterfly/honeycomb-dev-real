// App.tsx
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
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutUsPage from "./pages/AboutUsPage";
import HelpPage from "./pages/HelpPage";
import TaskPage from "./pages/TaskPage";
import JobPage from "./pages/JobPage";


import { NewJobModalProvider } from "./components/NewJobModalContext";

const App: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);

  const handleAddCustomer = (customer: any) => {
    setCustomers((prev) => [...prev, customer]);
  };

  return (
    <div id="root-layout" className={isDashboard ? "no-footer" : undefined}>
      {/* Marketing Navbar (dashboard dışı sayfalarda görünür) */}
      {!isDashboard && <Navbar />}

      <main id="app-content">
        <Routes>
          {/* Public pages */}
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
          

          {/* Dashboard home */}
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

          {/* Calendar */}
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

      {/* Footer dashboard dışında görünür */}
      {!isDashboard && <Footer />}
    </div>
  );
};

const RootApp = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default RootApp;
