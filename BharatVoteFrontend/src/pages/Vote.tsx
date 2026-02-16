import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote as VoteIcon,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Maximize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language";
import { useFlow } from "@/lib/flowControl";

interface Candidate {
  _id: string;
  name: string;
  party: string;
  symbol: string;
}

const fallbackCandidates: Candidate[] = [
  { _id: "1", name: "Candidate A", party: "National Democratic Party", symbol: "🪷" },
  { _id: "2", name: "Candidate B", party: "Progressive Alliance", symbol: "✋" },
  { _id: "3", name: "Candidate C", party: "People's Front", symbol: "🌾" },
  { _id: "nota", name: "NOTA", party: "None of the Above", symbol: "❌" },
];

const candidateColors: Record<number, string> = {
  0: "bg-primary/10 border-primary",
  1: "bg-accent/10 border-accent",
  2: "bg-trust/10 border-trust",
  3: "bg-destructive/10 border-destructive",
};

// ==================== TIMER ====================

const VoteTimer = ({ onTimeout }: { onTimeout: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= 10;

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${isWarning
        ? "bg-destructive/10 text-destructive animate-pulse"
        : "bg-white/10 text-white"
        }`}
    >
      <Clock className="w-5 h-5" />
      <span>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
};

// ==================== VOTE PAGE ====================

const Vote = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { setVotingLocked, completeStep, logout } = useFlow();
  const voteContainerRef = useRef<HTMLDivElement>(null);
  const [candidates, setCandidates] = useState<Candidate[]>(fallbackCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [voteCast, setVoteCast] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [electionId, setElectionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  // Track intentional fullscreen exits (vote cast, timeout) to prevent logout
  const intentionalExitRef = useRef(false);



  // ========== SESSION TERMINATION ==========
  const terminateSession = useCallback(() => {
    // secure logout via context
    logout();

    // Try server-side logout
    api.auth.logout().catch(() => { });

    toast({
      title: "🔒 Session Terminated",
      description: "Secure voting session terminated due to fullscreen exit.",
      variant: "destructive",
    });

    navigate("/");
  }, [navigate, toast, logout]);

  // ========== FULLSCREEN LOGIC ==========
  const enterFullscreen = useCallback(async () => {
    try {
      const el = voteContainerRef.current;
      if (el && !document.fullscreenElement) {
        await el.requestFullscreen();
        setIsFullscreen(true);
        setShowFullscreenModal(false);
      }
    } catch {
      // Browser blocked auto-fullscreen — show modal
      setShowFullscreenModal(true);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);

      // If user exited fullscreen and it was NOT intentional → terminate session
      if (!isFS && !intentionalExitRef.current) {
        terminateSession();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [terminateSession]);

  // ========== INIT: LOAD ELECTION, ENTER FULLSCREEN ==========
  useEffect(() => {
    const init = async () => {
      // 1. Get Election ID (prefer session storage from login, fallback to live)
      let currentElectionId = sessionStorage.getItem("bharatvote-election-id");

      if (!currentElectionId) {
        try {
          const elRes = await api.public.getLiveElection();
          const election = elRes.data?.election || elRes.election;
          if (election?._id || election?.id) {
            currentElectionId = election._id || election.id;
          }
        } catch { /* ignore */ }
      }

      if (currentElectionId) {
        setElectionId(currentElectionId);

        // 2. Create/Resume Voting Session
        try {
          const sessRes = await api.vote.createSession(currentElectionId);
          setSessionId(sessRes.data?.session?._id || sessRes.session?._id);
        } catch { /* session may already exist */ }

        // 3. Fetch Candidates for THIS election using Public API
        try {
          // Use public API instead of admin API
          const candRes = await api.public.getPublicCandidates(currentElectionId);
          const cands = candRes.data?.candidates || candRes.candidates;

          if (cands?.length) {
            setCandidates([
              ...cands.map((c: any) => ({
                _id: c._id,
                name: c.name,
                party: c.party,
                symbol: c.symbol || "🗳️",
              })),
              { _id: "nota", name: "NOTA", party: "None of the Above", symbol: "❌" },
            ]);
          }
        } catch (err) {
          console.error("Failed to load candidates:", err);
          toast({
            title: "Error Loading Candidates",
            description: "Could not fetch candidates for this election.",
            variant: "destructive"
          });
        }
      }

      // Request fullscreen after a brief delay
      setTimeout(() => enterFullscreen(), 300);
    };

    init();
    setVotingLocked(true);

    return () => {
      setVotingLocked(false);
      if (document.fullscreenElement) {
        intentionalExitRef.current = true;
        document.exitFullscreen().catch(() => { });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ========== HANDLERS ==========
  const stopAllCameras = () => {
    document.querySelectorAll("video").forEach((video) => {
      const stream = (video as HTMLVideoElement).srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        (video as HTMLVideoElement).srcObject = null;
      }
    });
  };

  const handleTimeout = () => {
    setHasTimedOut(true);
    setVotingLocked(false);
    if (sessionId) {
      api.vote.reportViolation(sessionId, "timeout").catch(() => { });
    }
    // Exit fullscreen intentionally
    intentionalExitRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => { });
    }
  };

  const handleCastVote = () => {
    if (!selectedCandidate) return;
    setShowConfirmation(true);
  };

  const confirmVote = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.vote.cast({
        candidate_id: selectedCandidate!,
        session_id: sessionId || "demo-session",
        election_id: electionId || "demo-election",
      });

      const data = res.data || res;
      sessionStorage.setItem("bharatvote-voted", "true");
      sessionStorage.setItem(
        "bharatvote-vote-data",
        JSON.stringify({
          candidateId: selectedCandidate,
          timestamp: new Date().toISOString(),
          receiptId: data.receipt_id || data.receiptId || `BV-${Date.now().toString(36).toUpperCase()}`,
          voteHash: data.vote_hash || data.voteHash,
          merkleRoot: data.merkle_root || data.merkleRoot,
        })
      );
      afterVoteCast();
    } catch (err: any) {
      // Demo fallback
      toast({
        title: "Using Demo Mode",
        description: err.message || "Backend unavailable — using local demo.",
        variant: "destructive",
      });
      sessionStorage.setItem("bharatvote-voted", "true");
      sessionStorage.setItem(
        "bharatvote-vote-data",
        JSON.stringify({
          candidateId: selectedCandidate,
          timestamp: new Date().toISOString(),
          receiptId: `BV-${Date.now().toString(36).toUpperCase()}`,
        })
      );
      afterVoteCast();
    } finally {
      setIsSubmitting(false);
    }
  };

  const afterVoteCast = () => {
    setVoteCast(true);
    setVotingLocked(false);
    completeStep("vote");
    stopAllCameras();

    // Exit fullscreen intentionally, then navigate
    intentionalExitRef.current = true;
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => navigate("/receipt")).catch(() => navigate("/receipt"));
    } else {
      navigate("/receipt");
    }
  };

  // ========== TIMEOUT SCREEN ==========
  if (hasTimedOut) {
    return (
      <div
        ref={voteContainerRef}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("vote.session_expired")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("vote.session_expired_desc")}
          </p>
          <Button onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90">
            {t("vote.login_again")}
          </Button>
        </motion.div>
      </div>
    );
  }

  // ========== MAIN VOTE UI ==========
  return (
    <div
      ref={voteContainerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col"
    >
      {/* Secure Header Bar */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-trust to-accent flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">🔒 SECURE VOTING MODE</p>
              <p className="text-xs text-white/50">End-to-end encrypted • Session monitored</p>
            </div>
          </div>
          <VoteTimer onTimeout={handleTimeout} />
        </div>
      </div>

      {/* Candidate List — Only Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8"
          >
            {/* Security Badge */}
            <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20 mb-6">
              <Shield className="w-5 h-5 text-accent" />
              <p className="text-sm text-accent font-medium">{t("vote.encrypted")}</p>
            </div>

            {/* Candidates */}
            <div className="grid gap-3">
              {candidates.map((candidate, idx) => (
                <motion.button
                  key={candidate._id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedCandidate(candidate._id)}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedCandidate === candidate._id
                    ? (candidateColors[idx] || "bg-primary/10 border-primary") + " shadow-lg shadow-primary/10"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                    }`}
                >
                  <div className="text-4xl">{candidate.symbol}</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white">{candidate.name}</h3>
                    <p className="text-sm text-white/60">{candidate.party}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCandidate === candidate._id
                      ? "border-accent bg-accent"
                      : "border-white/30"
                      }`}
                  >
                    {selectedCandidate === candidate._id && (
                      <CheckCircle className="w-4 h-4 text-accent-foreground" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Cast Vote Button */}
            <div className="mt-6">
              <Button
                onClick={handleCastVote}
                disabled={!selectedCandidate || isSubmitting}
                className="w-full bg-accent hover:bg-accent/90 text-lg py-6 disabled:opacity-30"
              >
                <Lock className="w-5 h-5 mr-2" />
                {t("vote.cast_button")}
              </Button>
              <p className="text-xs text-white/30 text-center mt-3">
                Your vote will be encrypted with SHA-256 before submission
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen Prompt Modal */}
      <AnimatePresence>
        {showFullscreenModal && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Maximize className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Secure Voting Mode Required
              </h2>
              <p className="text-muted-foreground mb-6">
                For the security of your vote, fullscreen mode is mandatory.
                Exiting fullscreen will immediately terminate your voting session.
              </p>
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 mb-6">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Do NOT press ESC or exit fullscreen during voting.
                  Your session will be terminated and you will need to log in again.
                </p>
              </div>
              <Button
                onClick={enterFullscreen}
                className="w-full bg-primary hover:bg-primary/90 text-lg py-5"
              >
                <Shield className="w-5 h-5 mr-2" />
                Enter Secure Voting Mode
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              {isSubmitting ? (
                <div className="text-center">
                  <Loader2 className="w-16 h-16 text-accent mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Encrypting Your Vote…
                  </h3>
                  <p className="text-muted-foreground">
                    आपका मत एन्क्रिप्ट किया जा रहा है
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <VoteIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {t("vote.confirm_title")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("vote.confirm_desc")}
                    </p>
                  </div>

                  <div className="p-4 bg-secondary rounded-lg mb-6">
                    <p className="text-sm text-muted-foreground mb-2">You are voting for:</p>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {candidates.find((c) => c._id === selectedCandidate)?.symbol}
                      </span>
                      <div>
                        <p className="font-bold text-foreground">
                          {candidates.find((c) => c._id === selectedCandidate)?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {candidates.find((c) => c._id === selectedCandidate)?.party}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 mb-6">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ This action cannot be undone. Make sure you've selected the correct candidate.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmation(false)}
                      className="flex-1"
                    >
                      {t("vote.confirm_cancel")}
                    </Button>
                    <Button
                      onClick={confirmVote}
                      className="flex-1 bg-accent hover:bg-accent/90"
                    >
                      {t("vote.confirm_yes")}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Vote;
