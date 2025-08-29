import { useState } from "react";
import Navigation from "@/components/navigation";
import Dashboard from "@/components/dashboard";
import Attendance from "@/components/attendance";
import Expenses from "@/components/expenses";
import Admin from "@/components/admin";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "attendance":
        return <Attendance />;
      case "expenses":
        return <Expenses />;
      case "admin":
        return user?.role === "admin" ? <Admin /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>
    </div>
  );
}
