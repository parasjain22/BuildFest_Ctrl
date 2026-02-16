import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LogIn,
  Fingerprint,
  Shield,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ChevronDown,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/language";
import { useFlow } from "@/lib/flowControl";

interface LiveElection {
  id: string;
  name: string;
  description?: string;
  status: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { completeStep, login } = useFlow();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [debugOtp, setDebugOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Election state
  const [liveElections, setLiveElections] = useState<LiveElection[]>([]);
  const [selectedElection, setSelectedElection] = useState<string>("");
  const [loadingElections, setLoadingElections] = useState(true);
  const [noElections, setNoElections] = useState(false);

  // Fetch live elections on mount
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await api.public.getLiveElection();
        const data = res.data as any;
        if (data?.has_live_election) {
          if (data.elections && Array.isArray(data.elections)) {
            // Multiple elections support
            const electionsList = data.elections.map((e: any) => ({
              id: e.id || e._id,
              name: e.name,
              description: e.description,
              status: e.status,
            }));
            setLiveElections(electionsList);
            setSelectedElection(electionsList[0].id);
          } else if (data.election) {
            // Fallback for single election
            setLiveElections([{
              id: data.election.id || data.election._id,
              name: data.election.name,
              description: data.election.description,
              status: data.election.status,
            }]);
            setSelectedElection(data.election.id || data.election._id);
          }
        } else {
          setNoElections(true);
        }
      } catch {
        setNoElections(true);
      } finally {
        setLoadingElections(false);
      }
    };
    fetchElections();
  }, []);

  const handleSendOTP = async () => {
    if (aadhaar.length !== 12) return;
    if (!selectedElection) {
      toast({ title: "Select Election", description: "Please select an election before proceeding.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await api.auth.loginInitiate(aadhaar);
      setShowOTP(true);
      if ((res as any).data?.debug_otp) {
        setDebugOtp((res as any).data.debug_otp);
      }
      toast({ title: "OTP Sent", description: res.message });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP");
      if (err.status === 'not_registered') {
        toast({ title: "Not Registered", description: "Please register first.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      // Step 1: Verify OTP
      const otpRes = await api.auth.verifyOTP(aadhaar, otp);

      // Step 2: Face verification (mock mode skips live image)
      const faceRes = await api.auth.faceVerify(otpRes.data?.temp_token || otpRes.temp_token);

      // Store JWT and user data
      const token = faceRes.data?.token || faceRes.token;
      const user = faceRes.data?.user || faceRes.user;

      // Use context login to update global state immediately
      login(token, user);

      // Store addition session data
      sessionStorage.setItem("bharatvote-vote-time", Date.now().toString());
      sessionStorage.setItem("bharatvote-election-id", selectedElection);

      toast({ title: "Login Successful", description: "Welcome! Proceeding to vote..." });
      navigate("/vote");
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center py-8">
      <div className="container max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="govt-card-elevated p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-trust/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-10 h-10 text-trust" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t("login.title")}</h1>
            <p className="text-muted-foreground text-sm">
              {t("login.subtitle")}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Election Selector */}
          <div className="mb-6">
            <Label htmlFor="election" className="mb-2 block">Select Election</Label>
            {loadingElections ? (
              <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading elections…
              </div>
            ) : noElections ? (
              <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20 text-center">
                <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
                <p className="text-sm font-medium text-destructive">No Live Elections Currently</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please check back when an election is scheduled.
                </p>
              </div>
            ) : (
              <div className="relative">
                <Radio className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                <select
                  id="election"
                  value={selectedElection}
                  onChange={(e) => setSelectedElection(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-card border border-border rounded-lg text-sm appearance-none focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  disabled={showOTP}
                >
                  <option value="">— Choose an Election —</option>
                  {liveElections.map((el) => (
                    <option key={el.id} value={el.id}>
                      🟢 {el.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Aadhaar Input */}
            <div className="space-y-2">
              <Label htmlFor="aadhaar">{t("register.aadhaar")}</Label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="aadhaar"
                  type="text"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                  className="pl-10 text-lg tracking-wider"
                  disabled={showOTP || noElections}
                />
                {showOTP && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                )}
              </div>
            </div>

            {/* OTP Section */}
            {showOTP ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    <p className="text-sm text-accent font-medium">
                      OTP sent to registered mobile
                    </p>
                  </div>
                </div>

                {debugOtp && (
                  <div className="p-3 bg-trust/10 rounded-lg border border-trust/20">
                    <p className="text-xs text-trust font-medium">
                      🔧 Dev Mode OTP: <span className="font-mono text-lg">{debugOtp}</span>
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp">{t("login.enter_otp")}</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type={showPassword ? "text" : "password"}
                      placeholder="• • • • • •"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="pl-10 pr-10 text-lg tracking-[0.5em] text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={otp.length !== 6 || isLoading}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Login & Proceed to Vote
                    </>
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full text-sm text-primary hover:underline"
                  onClick={() => { setShowOTP(false); setOtp(""); setDebugOtp(""); }}
                >
                  Didn't receive OTP? Resend
                </button>
              </motion.div>
            ) : (
              <Button
                type="button"
                onClick={handleSendOTP}
                disabled={aadhaar.length !== 12 || isLoading || !selectedElection || noElections}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending OTP…
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    {t("login.send_otp")}
                  </>
                )}
              </Button>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-secondary rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Security Notice</p>
                <p className="text-muted-foreground">
                  Your login session expires after casting your vote. Re-login required for future elections.
                </p>
              </div>
            </div>
          </div>

          {/* Registration Link */}
          <p className="text-center text-muted-foreground mt-6">
            {t("login.not_registered")}{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t("login.register_here")}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
