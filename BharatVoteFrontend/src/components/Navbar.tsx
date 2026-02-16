import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  UserPlus,
  LogIn,
  Vote,
  Receipt,
  BarChart3,
  Shield,
  Menu,
  X,
  HelpCircle,
  Lock,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import AccountPopover from "./AccountPopover";
import { useLanguage } from "@/lib/language";
import { useFlow } from "@/lib/flowControl";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  path: string;
  tKey: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: "/", tKey: "nav.home", icon: <Home className="w-4 h-4" /> },
  { path: "/register", tKey: "nav.register", icon: <UserPlus className="w-4 h-4" /> },
  { path: "/login", tKey: "nav.login", icon: <LogIn className="w-4 h-4" /> },
  { path: "/vote", tKey: "nav.vote", icon: <Vote className="w-4 h-4" /> },
  { path: "/receipt", tKey: "nav.receipt", icon: <Receipt className="w-4 h-4" /> },
  { path: "/audit", tKey: "nav.audit", icon: <BarChart3 className="w-4 h-4" /> },
  { path: "/complaints", tKey: "nav.complaints", icon: <HelpCircle className="w-4 h-4" /> },
];

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { canAccess, isVotingLocked } = useFlow();
  const { toast } = useToast();

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    // During voting, block ALL navigation
    if (isVotingLocked) {
      e.preventDefault();
      toast({
        title: "🔒 Voting In Progress",
        description: "Navigation is locked while your voting session is active. Please complete your vote first.",
        variant: "destructive",
      });
      return;
    }
    // Block access to steps not yet unlocked
    if (!canAccess(path)) {
      e.preventDefault();
      toast({
        title: "🔒 Step Locked",
        description: "Please complete the previous steps first to unlock this page.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      {/* Top Bar with Language Selector */}
      <div className="bg-trust text-trust-foreground py-1.5">
        <div className="container flex items-center justify-between">
          <p className="text-xs md:text-sm">
            {t("nav.tagline")} (Demo)
          </p>
          <LanguageSelector />
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="container">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, "/")}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-12 h-12 md:w-14 md:h-14">
              {/* Ashoka Chakra Mini Logo */}
              <svg viewBox="0 0 100 100" className="w-full h-full group-hover:scale-105 transition-transform">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(240 100% 40%)" strokeWidth="3" />
                <circle cx="50" cy="50" r="8" fill="hsl(240 100% 40%)" />
                {Array.from({ length: 24 }, (_, i) => {
                  const angle = (i * 15 * Math.PI) / 180;
                  const x1 = 50 + 10 * Math.cos(angle);
                  const y1 = 50 + 10 * Math.sin(angle);
                  const x2 = 50 + 43 * Math.cos(angle);
                  const y2 = 50 + 43 * Math.sin(angle);
                  return (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(240 100% 40%)" strokeWidth="2" />
                  );
                })}
              </svg>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                BharatVote
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Secure Digital Voting
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isLocked = !canAccess(item.path) || isVotingLocked;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => handleNavClick(e, item.path)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all group ${isActive
                    ? "text-primary"
                    : isLocked
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-foreground hover:bg-secondary"
                    }`}
                >
                  <span className={`transition-transform group-hover:scale-110 ${isActive ? "text-primary" : ""}`}>
                    {isLocked && !isActive ? <Lock className="w-4 h-4 text-muted-foreground/40" /> : item.icon}
                  </span>
                  <span>{t(item.tKey)}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-primary via-trust to-accent"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Link + Account Popover (Desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/admin"
              onClick={(e) => handleNavClick(e, "/admin")}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              <Shield className="w-4 h-4" />
              {t("nav.admin")}
            </Link>
            <AccountPopover />
          </div>

          {/* Mobile: Account + Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <AccountPopover />
            <button
              onClick={() => {
                if (isVotingLocked) {
                  toast({
                    title: "🔒 Voting In Progress",
                    description: "Navigation is locked during voting.",
                    variant: "destructive",
                  });
                  return;
                }
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1 border-t border-border">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isLocked = !canAccess(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={(e) => {
                        handleNavClick(e, item.path);
                        if (!isLocked) setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                        ? "bg-primary/10 text-primary"
                        : isLocked
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : "hover:bg-secondary"
                        }`}
                    >
                      {isLocked ? <Lock className="w-4 h-4" /> : item.icon}
                      <span>{t(item.tKey)}</span>
                    </Link>
                  );
                })}
                <Link
                  to="/admin"
                  onClick={(e) => {
                    handleNavClick(e, "/admin");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-accent text-accent-foreground"
                >
                  <Shield className="w-4 h-4" />
                  {t("nav.admin")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Tricolor Border */}
      <div className="h-1 bg-gradient-to-r from-india-saffron via-india-white to-india-green" />
    </header>
  );
};

export default Navbar;
