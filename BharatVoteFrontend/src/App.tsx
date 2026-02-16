import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/lib/language";
import { FlowProvider } from "@/lib/flowControl";
import IndianFlagSplash from "@/components/IndianFlagSplash";
import OnboardingModal from "@/components/OnboardingModal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Vote from "@/pages/Vote";
import Receipt from "@/pages/Receipt";
import Audit from "@/pages/Audit";
import Complaints from "@/pages/Complaints";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/** Layout wrapper that hides Navbar/Footer on the /vote route */
const AppLayout = ({
  showOnboarding,
  onCloseOnboarding,
}: {
  showOnboarding: boolean;
  onCloseOnboarding: () => void;
}) => {
  const location = useLocation();
  const isVotePage = location.pathname === "/vote";

  return (
    <>
      {showOnboarding && <OnboardingModal onClose={onCloseOnboarding} />}
      <div className="flex flex-col min-h-screen">
        {!isVotePage && <Navbar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/receipt" element={<Receipt />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isVotePage && <Footer />}
      </div>
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("bharatvote-splash");
    if (hasSeenSplash) {
      setShowSplash(false);
      setIsReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem("bharatvote-splash", "true");
    setShowSplash(false);
    setShowOnboarding(true);
    setIsReady(true);
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  return (
    <FlowProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            {showSplash && (
              <IndianFlagSplash onComplete={handleSplashComplete} />
            )}

            {isReady && (
              <BrowserRouter>
                <AppLayout
                  showOnboarding={showOnboarding}
                  onCloseOnboarding={handleOnboardingClose}
                />
              </BrowserRouter>
            )}
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </FlowProvider>
  );
};

export default App;
