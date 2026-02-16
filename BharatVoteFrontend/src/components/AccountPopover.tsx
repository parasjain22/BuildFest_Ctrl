import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    LogOut,
    Home,
    Receipt,
    BarChart3,
    Settings,
    Shield,
    LayoutDashboard,
    Users,
    FileText,
    Clock,
    CheckCircle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useFlow } from "@/lib/flowControl";

interface UserData {
    name?: string;
    email?: string;
    id?: string;
    voter_id?: string;
    constituency?: string;
    state?: string;
}

const AccountPopover = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { resetFlow } = useFlow();
    const [open, setOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [user, setUser] = useState<UserData | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginTime, setLoginTime] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            const token = sessionStorage.getItem("bharatvote-token");
            const authFlag = sessionStorage.getItem("bharatvote-authenticated");
            const userData = sessionStorage.getItem("bharatvote-user");
            const adminToken = sessionStorage.getItem("bharatvote-admin-token");
            const voteTime = sessionStorage.getItem("bharatvote-vote-time");

            if (adminToken) {
                setIsAuthenticated(true);
                setIsAdmin(true);
                setUser({ name: "Election Commissioner", email: "admin@bharatvote.gov.in" });
                setLoginTime(voteTime || Date.now().toString());
            } else if (token && authFlag === "true") {
                setIsAuthenticated(true);
                setIsAdmin(false);
                if (userData) {
                    try {
                        setUser(JSON.parse(userData));
                    } catch { setUser({ name: "Voter" }); }
                } else {
                    setUser({ name: "Voter" });
                }
                setLoginTime(voteTime || Date.now().toString());
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        };

        checkAuth();
        // Re-check auth state when popover opens
        if (open) checkAuth();
    }, [open]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await api.auth.logout();
        } catch {
            // Proceed even if server call fails
        }

        // Clear all session data
        sessionStorage.removeItem("bharatvote-token");
        sessionStorage.removeItem("bharatvote-authenticated");
        sessionStorage.removeItem("bharatvote-user");
        sessionStorage.removeItem("bharatvote-admin-token");
        sessionStorage.removeItem("bharatvote-vote-data");
        sessionStorage.removeItem("bharatvote-vote-time");
        sessionStorage.removeItem("bharatvote-registered");
        localStorage.removeItem("bharatvote-token");

        // Reset navigation flow
        resetFlow();

        setIsLoggingOut(false);
        setOpen(false);
        setIsAuthenticated(false);
        setUser(null);

        toast({
            title: "🔒 Securely Logged Out",
            description: "You have been securely logged out. All session data has been cleared.",
        });

        navigate("/");
    };

    const maskEmail = (email?: string) => {
        if (!email) return "•••@••••.••";
        const [local, domain] = email.split("@");
        if (!domain) return "•••@••••.••";
        const masked = local.length > 2
            ? local[0] + "•".repeat(local.length - 2) + local[local.length - 1]
            : "••";
        return `${masked}@${domain}`;
    };

    const getInitials = (name?: string) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    const formatLoginTime = () => {
        if (!loginTime) return "Unknown";
        const d = new Date(parseInt(loginTime));
        return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    // If not authenticated, show a login button instead
    if (!isAuthenticated) {
        return (
            <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
            </Link>
        );
    }

    const voterNavItems = [
        { icon: <Home className="w-4 h-4" />, label: "Home", path: "/" },
        { icon: <Receipt className="w-4 h-4" />, label: "My Receipts", path: "/receipt" },
        { icon: <BarChart3 className="w-4 h-4" />, label: "Audit Verification", path: "/audit" },
    ];

    const adminNavItems = [
        { icon: <LayoutDashboard className="w-4 h-4" />, label: "Admin Dashboard", path: "/admin" },
        { icon: <BarChart3 className="w-4 h-4" />, label: "Audit Logs", path: "/audit" },
    ];

    const navItems = isAdmin ? adminNavItems : voterNavItems;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    className="relative flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary via-trust to-accent text-white font-bold text-sm hover:shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                    aria-label="Account menu"
                >
                    {getInitials(user?.name)}
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                </button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-80 p-0 rounded-xl shadow-xl border border-border/50 overflow-hidden"
            >
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                        {/* User Info Header */}
                        <div className="bg-gradient-to-br from-primary/10 via-trust/5 to-accent/10 p-5 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-trust to-accent flex items-center justify-center text-white font-bold text-lg shadow-md">
                                    {getInitials(user?.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground truncate">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {maskEmail(user?.email)}
                                    </p>
                                    <span
                                        className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${isAdmin
                                                ? "bg-accent/15 text-accent"
                                                : "bg-primary/15 text-primary"
                                            }`}
                                    >
                                        <Shield className="w-3 h-3" />
                                        {isAdmin ? "Admin" : "Voter"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Section */}
                        <div className="p-2 border-b border-border/50">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path + item.label}
                                    to={item.path}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
                                >
                                    <span className="text-muted-foreground">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Session Info */}
                        <div className="px-4 py-3 border-b border-border/50 bg-secondary/30">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                <span className="font-medium text-green-600">Session Active</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Logged in at {formatLoginTime()}</span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <div className="p-2">
                            <Button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                variant="destructive"
                                className="w-full gap-2 font-medium"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        >
                                            <LogOut className="w-4 h-4" />
                                        </motion.div>
                                        Logging out…
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-4 h-4" />
                                        Secure Logout
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </PopoverContent>
        </Popover>
    );
};

export default AccountPopover;
