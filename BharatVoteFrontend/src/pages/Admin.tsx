import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Lock,
  LogIn,
  BarChart3,
  Clock,
  Activity,
  Flag,
  Bell,
  MessageCircle,
  ChevronRight,
  Eye,
  XCircle,
  AlertCircle,
  Vote,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// ═══════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════
interface Election {
  _id: string;
  name: string;
  description?: string;
  status: string;
  timeline: {
    registration_start?: string;
    registration_end?: string;
    voting_start?: string;
    voting_end?: string;
    result_date?: string;
  };
  constituencies: string[];
  total_votes_cast: number;
  total_registered: number;
  settings: { is_active: boolean; voting_started: boolean; vote_duration_seconds: number };
  createdAt: string;
}

interface Candidate {
  _id: string;
  name: string;
  party: string;
  symbol?: string;
  constituency: string;
}

interface Warning {
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface Complaint {
  _id: string;
  complaint_id: string;
  category: string;
  description: string;
  email?: string;
  status: string;
  createdAt: string;
}

interface FlaggedUser {
  _id: string;
  name: string;
  voter_id: string;
  violation_count: number;
  blocked: boolean;
  state: string;
  constituency: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════
const statusColors: Record<string, string> = {
  draft: "bg-gray-500/20 text-gray-300",
  scheduled: "bg-blue-500/20 text-blue-300",
  live: "bg-green-500/20 text-green-300",
  closed: "bg-orange-500/20 text-orange-300",
  results_published: "bg-purple-500/20 text-purple-300",
};

const nextStatus: Record<string, string[]> = {
  draft: ["scheduled", "live"],
  scheduled: ["live"],
  live: ["closed"],
  closed: ["results_published"],
};

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-green-500/10">
      <Icon className="w-5 h-5 text-orange-400" />
    </div>
    <h2 className="text-lg font-semibold text-white">{title}</h2>
  </div>
);

// ═══════════════════════════════════════════════════════
//  ADMIN PAGE
// ═══════════════════════════════════════════════════════
const Admin = () => {
  const { toast } = useToast();

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Data
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [flags, setFlags] = useState<FlaggedUser[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [warningElectionId, setWarningElectionId] = useState("");
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // UI
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Create Election form
  const [newElection, setNewElection] = useState({
    name: "",
    description: "",
    constituencies: "",
    registration_start: "",
    registration_end: "",
    voting_start: "",
    voting_end: "",
    result_date: "",
    vote_duration: "60",
  });

  // Candidate form
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    party: "",
    symbol: "",
    constituency: "",
    election_id: "",
  });

  // Warning form
  const [newWarning, setNewWarning] = useState({ type: "system", message: "" });

  // ──── Check if already logged in ────
  useEffect(() => {
    const token = sessionStorage.getItem("bharatvote-token");
    const user = sessionStorage.getItem("bharatvote-user");
    if (token && user) {
      try {
        const u = JSON.parse(user);
        if (u.role === "admin") setIsAuthenticated(true);
      } catch { }
    }
  }, []);

  // ──── Admin Login ────
  const handleAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await api.admin.login(loginEmail, loginPassword);
      const d = res as any;
      sessionStorage.setItem("bharatvote-token", d.token);
      sessionStorage.setItem("bharatvote-user", JSON.stringify(d.user));
      setIsAuthenticated(true);
      toast({ title: "Welcome, Commissioner", description: "Admin access granted." });
    } catch (err: any) {
      toast({ title: "Login Failed", description: err.message || "Invalid credentials", variant: "destructive" });
    }
    setLoginLoading(false);
  };

  // ──── Fetch all data ────
  const fetchAllData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [electRes, candRes, statRes, flagRes, warnRes, compRes] = await Promise.allSettled([
        api.admin.getElections(),
        api.admin.getCandidates(),
        api.admin.getRealtimeStats(),
        api.admin.getDuplicateFlags(),
        api.admin.getWarnings(),
        api.admin.getComplaints(),
      ]);

      if (electRes.status === "fulfilled") setElections((electRes.value?.data as any)?.elections || []);
      if (candRes.status === "fulfilled") setCandidates((candRes.value?.data as any)?.candidates || []);
      if (statRes.status === "fulfilled") setStats(statRes.value?.data || null);
      if (flagRes.status === "fulfilled") setFlags((flagRes.value?.data as any)?.flags || []);
      if (warnRes.status === "fulfilled") {
        setWarnings((warnRes.value?.data as any)?.warnings || []);
        setWarningElectionId((warnRes.value?.data as any)?.election_id || "");
      }
      if (compRes.status === "fulfilled") setComplaints((compRes.value?.data as any)?.complaints || []);
    } catch { }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  // ──── Auto-refresh every 10 minutes ────
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;
    const interval = setInterval(() => {
      fetchAllData();
      toast({ title: "Stats Refreshed", description: "Data updated automatically." });
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, fetchAllData, toast]);

  const manualRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "All data updated." });
  };

  // ──── Create Election ────
  const handleCreateElection = async () => {
    if (!newElection.name) return toast({ title: "Error", description: "Election name is required", variant: "destructive" });
    try {
      await api.admin.createElection({
        name: newElection.name,
        description: newElection.description,
        constituencies: newElection.constituencies.split(",").map(c => c.trim()).filter(Boolean),
        timeline: {
          registration_start: newElection.registration_start || undefined,
          registration_end: newElection.registration_end || undefined,
          voting_start: newElection.voting_start || undefined,
          voting_end: newElection.voting_end || undefined,
          result_date: newElection.result_date || undefined,
        },
        settings: { vote_duration_seconds: parseInt(newElection.vote_duration) || 60 },
      });
      toast({ title: "Election Created!" });
      setNewElection({ name: "", description: "", constituencies: "", registration_start: "", registration_end: "", voting_start: "", voting_end: "", result_date: "", vote_duration: "60" });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Election Status Transition ────
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.admin.updateElectionStatus(id, status);
      toast({ title: "Status Updated", description: `Election is now "${status}"` });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Delete Election ────
  const handleDeleteElection = async (id: string, name: string) => {
    if (!confirm(`Delete election "${name}"? This will also remove all associated candidates.`)) return;
    try {
      await api.admin.deleteElection(id);
      toast({ title: "Election Deleted", description: `"${name}" has been removed.` });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Add Candidate ────
  const handleAddCandidate = async () => {
    if (!newCandidate.name || !newCandidate.party || !newCandidate.election_id) return toast({
      title: "Error", description: "Name, party, and election are required", variant: "destructive"
    });
    try {
      await api.admin.addCandidate(newCandidate);
      toast({ title: "Candidate Added!" });
      setNewCandidate({ name: "", party: "", symbol: "", constituency: "", election_id: "" });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Delete Candidate ────
  const handleDeleteCandidate = async (id: string) => {
    try {
      await api.admin.deleteCandidate(id);
      toast({ title: "Candidate Removed" });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Add Warning ────
  const handleAddWarning = async () => {
    const eid = warningElectionId || elections[0]?._id;
    if (!eid || !newWarning.message) return toast({ title: "Error", description: "Message and election required", variant: "destructive" });
    try {
      await api.admin.addWarning(eid, newWarning.type, newWarning.message);
      toast({ title: "Warning Added" });
      setNewWarning({ type: "system", message: "" });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Resolve Warning ────
  const handleResolveWarning = async (idx: number) => {
    const eid = warningElectionId || elections[0]?._id;
    if (!eid) return;
    try {
      await api.admin.resolveWarning(idx, eid);
      toast({ title: "Warning Resolved" });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ──── Update Complaint ────
  const handleComplaintStatus = async (id: string, status: string) => {
    try {
      await api.admin.updateComplaintStatus(id, status);
      toast({ title: "Complaint Updated", description: `Status → ${status}` });
      fetchAllData();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  // ═══════════════════════════════════════════════════════
  //  LOGIN GATE
  // ═══════════════════════════════════════════════════════
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-green-500 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Admin Console</h1>
              <p className="text-sm text-gray-400">Election Commission of India</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="admin@bharatvote.in"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Password</Label>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>

              <Button
                onClick={handleAdminLogin}
                disabled={loginLoading || !loginEmail || !loginPassword}
                className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-semibold h-11"
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                Sign In
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">Secure admin access. All actions are audit-logged.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  //  TABS
  // ═══════════════════════════════════════════════════════
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "elections", label: "Elections", icon: Vote },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "monitoring", label: "Monitoring", icon: Activity },
    { id: "flags", label: "Flags", icon: Flag },
    { id: "warnings", label: "Warnings", icon: Bell },
    { id: "complaints", label: "Complaints", icon: MessageCircle },
  ];

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">BharatVote Admin</h1>
              <p className="text-xs text-gray-400">Election Commissioner Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="accent-orange-500" />
              Auto-refresh (10 min)
            </label>
            <Button size="sm" variant="outline" onClick={manualRefresh} disabled={refreshing} className="border-white/10 text-gray-300 hover:bg-white/5">
              <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { sessionStorage.clear(); setIsAuthenticated(false); }} className="text-red-400 hover:bg-red-500/10">
              Logout
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.id === "flags" && flags.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500/30 text-red-300 rounded text-xs">{flags.length}</span>
              )}
              {t.id === "warnings" && warnings.filter(w => !w.resolved).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/30 text-yellow-300 rounded text-xs">{warnings.filter(w => !w.resolved).length}</span>
              )}
              {t.id === "complaints" && complaints.filter(c => c.status === "pending").length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500/30 text-blue-300 rounded text-xs">{complaints.filter(c => c.status === "pending").length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* ═══ DASHBOARD ═══ */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  <SectionHeader icon={BarChart3} title="Real-Time Dashboard" />

                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: "Registered", value: stats?.registeredVoters || 0, icon: Users, color: "from-blue-500 to-blue-600" },
                      { label: "Votes Cast", value: stats?.totalVotes || 0, icon: CheckCircle, color: "from-green-500 to-green-600" },
                      { label: "Turnout", value: `${stats?.turnout || 0}%`, icon: BarChart3, color: "from-orange-500 to-orange-600" },
                      { label: "Blocked", value: stats?.totalBlocked || 0, icon: Lock, color: "from-red-500 to-red-600" },
                      { label: "Flagged", value: stats?.totalFlagged || 0, icon: Flag, color: "from-yellow-500 to-yellow-600" },
                      { label: "Last 10 min", value: stats?.votes_last_10_min || 0, icon: Clock, color: "from-purple-500 to-purple-600" },
                    ].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 hover:border-white/20 transition">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                          <s.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-white">{typeof s.value === "number" ? s.value.toLocaleString("en-IN") : s.value}</div>
                        <div className="text-xs text-gray-400">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Live election info */}
                  {stats?.election_name && stats.election_status !== "none" && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold">{stats.election_name}</h3>
                          <p className="text-sm text-gray-400 mt-1">Status: <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[stats.election_status] || "text-gray-300"}`}>{stats.election_status?.toUpperCase()}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Last Updated</p>
                          <p className="text-sm text-gray-300">{new Date(stats.last_updated).toLocaleTimeString("en-IN")}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick timeline */}
                  {elections.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400" /> Election Timeline</h3>
                      <div className="space-y-2">
                        {elections.slice(0, 3).map(el => (
                          <div key={el._id} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${el.status === "live" ? "bg-green-400 animate-pulse" : el.status === "closed" ? "bg-orange-400" : "bg-gray-400"}`} />
                            <span className="text-sm text-gray-300 flex-1">{el.name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${statusColors[el.status]}`}>{el.status}</span>
                            {el.timeline?.voting_start && <span className="text-xs text-gray-500">{new Date(el.timeline.voting_start).toLocaleDateString("en-IN")}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ ELECTIONS ═══ */}
              {activeTab === "elections" && (
                <div className="space-y-6">
                  {/* Create Election */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <SectionHeader icon={Plus} title="Create New Election" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-300 text-sm">Election Name *</Label>
                        <Input value={newElection.name} onChange={e => setNewElection(p => ({ ...p, name: e.target.value }))} placeholder="General Election 2026" className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Description</Label>
                        <Input value={newElection.description} onChange={e => setNewElection(p => ({ ...p, description: e.target.value }))} placeholder="18th Lok Sabha Elections" className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-gray-300 text-sm">Constituencies (comma-separated)</Label>
                        <Input value={newElection.constituencies} onChange={e => setNewElection(p => ({ ...p, constituencies: e.target.value }))} placeholder="Delhi, Mumbai North, Bangalore South" className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Registration Start</Label>
                        <Input type="datetime-local" value={newElection.registration_start} onChange={e => setNewElection(p => ({ ...p, registration_start: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Registration End</Label>
                        <Input type="datetime-local" value={newElection.registration_end} onChange={e => setNewElection(p => ({ ...p, registration_end: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Voting Start</Label>
                        <Input type="datetime-local" value={newElection.voting_start} onChange={e => setNewElection(p => ({ ...p, voting_start: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Voting End</Label>
                        <Input type="datetime-local" value={newElection.voting_end} onChange={e => setNewElection(p => ({ ...p, voting_end: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Result Date</Label>
                        <Input type="datetime-local" value={newElection.result_date} onChange={e => setNewElection(p => ({ ...p, result_date: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Vote Duration (seconds)</Label>
                        <Input type="number" value={newElection.vote_duration} onChange={e => setNewElection(p => ({ ...p, vote_duration: e.target.value }))} className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                    </div>
                    <Button onClick={handleCreateElection} className="mt-4 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Create Election
                    </Button>
                  </div>

                  {/* Elections List */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <SectionHeader icon={Vote} title="All Elections" />
                    {elections.length === 0 ? (
                      <p className="text-gray-500 text-sm">No elections created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {elections.map(el => (
                          <div key={el._id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-white font-medium">{el.name}</h3>
                                {el.description && <p className="text-xs text-gray-400 mt-1">{el.description}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[el.status]}`}>{el.status.toUpperCase()}</span>
                                  <span className="text-xs text-gray-500">{el.total_votes_cast || 0} votes</span>
                                  <span className="text-xs text-gray-500">{el.constituencies?.length || 0} constituencies</span>
                                </div>
                                {el.timeline && (
                                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                    {el.timeline.voting_start && <span>📅 Vote: {new Date(el.timeline.voting_start).toLocaleDateString("en-IN")}</span>}
                                    {el.timeline.voting_end && <span>— {new Date(el.timeline.voting_end).toLocaleDateString("en-IN")}</span>}
                                    {el.timeline.result_date && <span>📊 Result: {new Date(el.timeline.result_date).toLocaleDateString("en-IN")}</span>}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 flex-wrap justify-end">
                                {(nextStatus[el.status] || []).map(ns => (
                                  <Button key={ns} size="sm" variant="outline" onClick={() => handleStatusChange(el._id, ns)}
                                    className={`text-xs border-white/10 ${ns === "live" ? "text-green-400 hover:bg-green-500/10" : ns === "closed" ? "text-red-400 hover:bg-red-500/10" : "text-gray-300 hover:bg-white/5"}`}>
                                    <ChevronRight className="w-3 h-3 mr-1" /> {ns}
                                  </Button>
                                ))}
                                {el.status !== "live" && el.status !== "results_published" && (
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteElection(el._id, el.name)}
                                    className="text-red-400 hover:bg-red-500/10 text-xs">
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ CANDIDATES ═══ */}
              {activeTab === "candidates" && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <SectionHeader icon={Plus} title="Add Candidate" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-300 text-sm">Election *</Label>
                        <select value={newCandidate.election_id} onChange={e => setNewCandidate(p => ({ ...p, election_id: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 mt-1 text-sm">
                          <option value="" className="bg-gray-900">Select election</option>
                          {elections.map(el => <option key={el._id} value={el._id} className="bg-gray-900">{el.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Candidate Name *</Label>
                        <Input value={newCandidate.name} onChange={e => setNewCandidate(p => ({ ...p, name: e.target.value }))} placeholder="Shri/Smt..." className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Party *</Label>
                        <Input value={newCandidate.party} onChange={e => setNewCandidate(p => ({ ...p, party: e.target.value }))} placeholder="Party name" className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Symbol</Label>
                        <Input value={newCandidate.symbol} onChange={e => setNewCandidate(p => ({ ...p, symbol: e.target.value }))} placeholder="🪷" className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                      <div>
                        <Label className="text-gray-300 text-sm">Constituency</Label>
                        <Input value={newCandidate.constituency} onChange={e => setNewCandidate(p => ({ ...p, constituency: e.target.value }))} placeholder="Delhi" className="bg-white/5 border-white/10 text-white mt-1" />
                      </div>
                    </div>
                    <Button onClick={handleAddCandidate} className="mt-4 bg-gradient-to-r from-orange-500 to-green-500 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Add Candidate
                    </Button>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <SectionHeader icon={Users} title={`Candidates (${candidates.length})`} />
                    {candidates.length === 0 ? (
                      <p className="text-gray-500 text-sm">No candidates added yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {candidates.map(c => (
                          <div key={c._id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{c.symbol || "👤"}</span>
                              <div>
                                <p className="text-white font-medium text-sm">{c.name}</p>
                                <p className="text-xs text-gray-400">{c.party} • {c.constituency}</p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteCandidate(c._id)} className="text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ MONITORING ═══ */}
              {activeTab === "monitoring" && (
                <div className="space-y-6">
                  <SectionHeader icon={Activity} title="Real-Time Monitoring" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Vote casting progress */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h3 className="text-white font-medium mb-3">Vote Casting Progress</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm text-gray-400 mb-1">
                            <span>Turnout</span>
                            <span>{stats?.turnout || 0}%</span>
                          </div>
                          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(parseFloat(stats?.turnout || 0), 100)}%` }}
                              transition={{ duration: 1 }}
                              className="h-full bg-gradient-to-r from-orange-500 to-green-500 rounded-full"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-xl font-bold text-green-400">{(stats?.totalVotes || 0).toLocaleString("en-IN")}</div>
                            <div className="text-xs text-gray-400">Total Votes</div>
                          </div>
                          <div className="text-center p-3 bg-white/5 rounded-lg">
                            <div className="text-xl font-bold text-purple-400">{stats?.votes_last_10_min || 0}</div>
                            <div className="text-xs text-gray-400">Last 10 Min</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System health */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h3 className="text-white font-medium mb-3">System Health</h3>
                      <div className="space-y-3">
                        {[
                          { label: "API Server", status: "operational", color: "bg-green-400" },
                          { label: "Database", status: "operational", color: "bg-green-400" },
                          { label: "Encryption Service", status: "operational", color: "bg-green-400" },
                          { label: "Active Warnings", status: `${warnings.filter(w => !w.resolved).length} active`, color: warnings.filter(w => !w.resolved).length > 0 ? "bg-yellow-400" : "bg-green-400" },
                          { label: "Flagged Users", status: `${flags.length} flagged`, color: flags.length > 0 ? "bg-red-400" : "bg-green-400" },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">{s.label}</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${s.color}`} />
                              <span className="text-xs text-gray-400">{s.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Voting rate visualization */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-4">Voter Distribution</h3>
                    <div className="flex items-end gap-2 h-32">
                      {[
                        { label: "Registered", val: stats?.registeredVoters || 0, color: "bg-blue-500" },
                        { label: "Verified", val: stats?.verifiedVoters || 0, color: "bg-cyan-500" },
                        { label: "Voted", val: stats?.totalVoted || 0, color: "bg-green-500" },
                        { label: "Blocked", val: stats?.totalBlocked || 0, color: "bg-red-500" },
                        { label: "Flagged", val: stats?.totalFlagged || 0, color: "bg-yellow-500" },
                      ].map((bar, i) => {
                        const max = Math.max(stats?.registeredVoters || 1, 1);
                        const pct = Math.max((bar.val / max) * 100, 3);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-400">{bar.val}</span>
                            <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`w-full rounded-t-md ${bar.color}`} />
                            <span className="text-[10px] text-gray-500">{bar.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ FLAGS ═══ */}
              {activeTab === "flags" && (
                <div className="space-y-6">
                  <SectionHeader icon={Flag} title={`Duplicate Attempt Flags (${flags.length})`} />
                  {flags.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
                      <p>No duplicate attempts detected.</p>
                    </div>
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white/5 text-gray-400 text-left">
                            <th className="px-4 py-3">Voter ID</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Violations</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Location</th>
                            <th className="px-4 py-3">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {flags.map((f, i) => (
                            <tr key={f._id} className={`border-t border-white/5 ${i % 2 ? "bg-white/[0.02]" : ""}`}>
                              <td className="px-4 py-3 text-white font-mono text-xs">{f.voter_id}</td>
                              <td className="px-4 py-3 text-gray-300">{f.name}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${f.violation_count >= 3 ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                  {f.violation_count}x
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {f.blocked ? <span className="text-red-400 text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Blocked</span> : <span className="text-yellow-400 text-xs">Flagged</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{f.constituency}, {f.state}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(f.updatedAt).toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ WARNINGS ═══ */}
              {activeTab === "warnings" && (
                <div className="space-y-6">
                  <SectionHeader icon={Bell} title="System Warnings" />

                  {/* Add warning form */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-white font-medium mb-3">Add Warning</h3>
                    <div className="flex flex-wrap gap-3">
                      <select value={newWarning.type} onChange={e => setNewWarning(p => ({ ...p, type: e.target.value }))}
                        className="bg-white/5 border border-white/10 text-white rounded-md px-3 py-2 text-sm">
                        <option value="system" className="bg-gray-900">System</option>
                        <option value="security" className="bg-gray-900">Security</option>
                        <option value="performance" className="bg-gray-900">Performance</option>
                        <option value="voter_blocked" className="bg-gray-900">Voter Blocked</option>
                        <option value="site_unresponsive" className="bg-gray-900">Site Unresponsive</option>
                      </select>
                      <Input value={newWarning.message} onChange={e => setNewWarning(p => ({ ...p, message: e.target.value }))} placeholder="Warning message..."
                        className="flex-1 bg-white/5 border-white/10 text-white min-w-[200px]" />
                      <Button onClick={handleAddWarning} className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30">
                        <AlertTriangle className="w-4 h-4 mr-2" /> Add Warning
                      </Button>
                    </div>
                  </div>

                  {/* Warning list */}
                  {warnings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
                      <p>No warnings. All systems normal.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {warnings.map((w, i) => (
                        <div key={i} className={`flex items-start justify-between bg-white/5 border rounded-lg px-4 py-3 ${w.resolved ? "border-white/5 opacity-50" : "border-yellow-500/20"}`}>
                          <div className="flex items-start gap-3">
                            {w.resolved ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />}
                            <div>
                              <p className="text-sm text-white">{w.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 uppercase">{w.type}</span>
                                <span className="text-xs text-gray-500">{new Date(w.timestamp).toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          </div>
                          {!w.resolved && (
                            <Button size="sm" variant="ghost" onClick={() => handleResolveWarning(i)} className="text-green-400 hover:bg-green-500/10 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ COMPLAINTS ═══ */}
              {activeTab === "complaints" && (
                <div className="space-y-6">
                  <SectionHeader icon={MessageCircle} title={`Complaints (${complaints.length})`} />
                  {complaints.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
                      <p>No complaints received yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {complaints.map(c => (
                        <div key={c._id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-gray-400">{c.complaint_id}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === "resolved" ? "bg-green-500/20 text-green-300" : c.status === "in_review" ? "bg-blue-500/20 text-blue-300" : c.status === "dismissed" ? "bg-gray-500/20 text-gray-300" : "bg-yellow-500/20 text-yellow-300"}`}>
                                  {c.status}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs ${c.category === "fraud" ? "bg-red-500/10 text-red-400" : "bg-gray-500/10 text-gray-400"}`}>
                                  {c.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300">{c.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {c.email && <span>📧 {c.email}</span>}
                                <span>{new Date(c.createdAt).toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-4">
                              {c.status !== "in_review" && c.status !== "resolved" && c.status !== "dismissed" && (
                                <Button size="sm" variant="ghost" onClick={() => handleComplaintStatus(c._id, "in_review")} className="text-blue-400 hover:bg-blue-500/10 text-xs">
                                  <Eye className="w-3 h-3 mr-1" /> Review
                                </Button>
                              )}
                              {c.status !== "resolved" && (
                                <Button size="sm" variant="ghost" onClick={() => handleComplaintStatus(c._id, "resolved")} className="text-green-400 hover:bg-green-500/10 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                                </Button>
                              )}
                              {c.status !== "dismissed" && c.status !== "resolved" && (
                                <Button size="sm" variant="ghost" onClick={() => handleComplaintStatus(c._id, "dismissed")} className="text-gray-400 hover:bg-gray-500/10 text-xs">
                                  <XCircle className="w-3 h-3 mr-1" /> Dismiss
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Admin;
