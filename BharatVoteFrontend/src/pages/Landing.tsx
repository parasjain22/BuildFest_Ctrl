import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Fingerprint,
  Vote,
  FileText,
  BarChart3,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ElectionStatusBar from "@/components/ElectionStatusBar";
import { useFlow } from "@/lib/flowControl";
import { api } from "@/lib/api";

const slogans = [
  {
    hindi: "मतदान है अधिकार, लोकतंत्र की पहचान।",
    english: "Voting is a right, the identity of democracy.",
  },
  {
    hindi: "एक मत का मान, मजबूत हिंदुस्तान।",
    english: "Respect each vote, a stronger India.",
  },
  {
    hindi: "आज का मतदान, कल का निर्माण।",
    english: "Today's vote, tomorrow's foundation.",
  },
  {
    hindi: "हर वोट की है कीमत, यही लोकतंत्र की ताकत।",
    english: "Every vote has value, this is democracy's power.",
  },
  {
    hindi: "मत डालो, भविष्य गढ़ो।",
    english: "Cast your vote, shape your future.",
  },
];

const features = [
  {
    icon: <Lock className="w-6 h-6" />,
    title: "End-to-End Encryption",
    titleHi: "पूर्ण एन्क्रिप्शन",
    description: "Your vote is encrypted from the moment you cast it until it's counted.",
  },
  {
    icon: <Eye className="w-6 h-6" />,
    title: "Complete Anonymity",
    titleHi: "पूर्ण गोपनीयता",
    description: "Zero-knowledge proofs ensure your vote cannot be linked to your identity.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Tamper-Proof",
    titleHi: "छेड़छाड़-रहित",
    description: "Blockchain-inspired Merkle trees make vote manipulation impossible.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Public Verification",
    titleHi: "सार्वजनिक सत्यापन",
    description: "Anyone can audit the election without compromising voter privacy.",
  },
];

const steps = [
  {
    icon: <Fingerprint className="w-8 h-8" />,
    title: "Register",
    titleHi: "पंजीकरण",
    description: "Verify identity with Aadhaar",
    color: "bg-primary",
  },
  {
    icon: <Vote className="w-8 h-8" />,
    title: "Vote",
    titleHi: "मतदान",
    description: "Cast your encrypted vote",
    color: "bg-trust",
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Receipt",
    titleHi: "रसीद",
    description: "Get cryptographic proof",
    color: "bg-accent",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Verify",
    titleHi: "सत्यापन",
    description: "Audit anytime publicly",
    color: "bg-india-navy",
  },
];

const Landing = () => {
  const [currentSlogan, setCurrentSlogan] = useState(0);
  const { completeStep } = useFlow();
  const [liveElection, setLiveElection] = useState<any>(null);
  const [scheduledElections, setScheduledElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useFlow();

  const handleAuditClick = () => {
    if (isAuthenticated) {
      navigate("/audit");
    } else {
      toast({
        title: "Authentication Required",
        description: "Please login first to view the audit.",
        variant: "destructive",
      });
      navigate("/login");
    }
  };

  useEffect(() => {
    // Mark home step as complete so Register is unlocked
    completeStep("home");

    // Fetch elections
    const fetchElections = async () => {
      try {
        const [liveRes, scheduledRes] = await Promise.allSettled([
          api.public.getLiveElection(),
          api.public.getScheduledElections(),
        ]);

        if (liveRes.status === "fulfilled" && (liveRes.value as any).data?.has_live_election) {
          setLiveElection((liveRes.value as any).data.election);
        }

        if (scheduledRes.status === "fulfilled" && (scheduledRes.value as any).data?.elections) {
          setScheduledElections((scheduledRes.value as any).data.elections);
        }
      } catch (err) {
        console.error("Failed to fetch elections", err);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlogan((prev) => (prev + 1) % slogans.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Dynamic Election Status Bar */}
      {!loading && (
        <>
          {liveElection ? (
            <ElectionStatusBar
              status="active"
              electionName={liveElection.name}
            />
          ) : scheduledElections.length > 0 ? (
            <ElectionStatusBar
              status="upcoming"
              electionName={scheduledElections[0].name}
            />
          ) : (
            <div className="bg-secondary border-b border-border py-2 text-center text-sm text-muted-foreground">
              No elections currently live or scheduled.
            </div>
          )}
        </>
      )}

      {/* Live Election Hero Alert (if live) */}
      {liveElection && (
        <div className="bg-accent/10 border-b border-accent/20">
          <div className="container py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </span>
              <div>
                <h3 className="font-bold text-foreground">Voting is Live: {liveElection.name}</h3>
                <p className="text-sm text-muted-foreground">Polls are open. Cast your vote now!</p>
              </div>
            </div>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20">
              <Link to="/login">Vote Now <Radio className="w-4 h-4 ml-2 animate-pulse" /></Link>
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-pattern">
        <div className="container py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Rotating Slogans */}
              <div className="h-24 mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlogan}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center lg:text-left"
                  >
                    <p className="text-2xl md:text-3xl font-bold text-foreground mb-2 tricolor-underline inline-block">
                      {slogans[currentSlogan].hindi}
                    </p>
                    <p className="text-lg text-muted-foreground mt-4">
                      {slogans[currentSlogan].english}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slogan Indicators */}
              <div className="flex justify-center lg:justify-start gap-2 mb-8">
                {slogans.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlogan(index)}
                    className={`h-1.5 rounded-full transition-all ${index === currentSlogan
                      ? "w-8 bg-primary"
                      : "w-2 bg-border hover:bg-muted-foreground"
                      }`}
                  />
                ))}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Secure{" "}
                <span className="text-gradient-saffron">Anonymous</span>
                <br />
                Digital Voting
              </h1>

              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Experience the future of democracy with our blockchain-inspired
                voting system. Your vote is encrypted, anonymous, and
                verifiable.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-saffron"
                >
                  <Link to="/register">
                    <Fingerprint className="w-5 h-5" />
                    Register Now
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  onClick={handleAuditClick}
                >
                  <BarChart3 className="w-5 h-5" />
                  View Public Audit
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>100% Anonymous</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Auditable</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Open Source</span>
                </div>
              </div>
            </motion.div>

            {/* Right - Video Placeholder */}
            {/* Right - Video Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-video bg-gradient-to-br from-primary/10 via-trust/10 to-accent/10 rounded-2xl overflow-hidden shadow-elevated border border-border">

                {/* ===================== VIDEO ADDED HERE ===================== */}
                {/* 
                  Place your video file inside the `public` folder.
                  Example path: public/vote-awareness.mp4

                  Using `public/` avoids imports and works instantly in Vite.
                */}
                <video
                  src="/vote-awareness.mp4"   // <-- video file path
                  autoPlay                    // auto play on load
                  muted                       // required for autoplay
                  loop                        // loops continuously
                  controls                    // user can play/pause
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  Your browser does not support the video tag.
                </video>
                {/* ============================================================= */}

                {/* Overlay Play UI (kept for visual appeal) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-saffron mb-4 mx-auto"
                    >
                      <Play className="w-8 h-8 text-primary-foreground ml-1" />
                    </motion.div>
                  </div>
                </div>

                {/* Decorative Elements (unchanged) */}
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-primary/20 animate-float" />
                <div
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-accent/20 animate-float"
                  style={{ animationDelay: "1s" }}
                />
              </div>

              {/* ECI Style Badge (unchanged) */}
              <div className="absolute -bottom-4 -right-4 bg-card rounded-xl shadow-elevated p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-trust/10 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-trust" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">ECI Inspired</p>
                    <p className="text-xs text-muted-foreground">
                      Government Standards
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-secondary/50">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              कैसे काम करता है • Simple, Secure, Transparent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="govt-card-elevated p-6 text-center h-full hover:shadow-lg transition-shadow">
                  <div
                    className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white`}
                  >
                    {step.icon}
                  </div>
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-primary font-medium mb-2">
                    {step.titleHi}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-border" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why BharatVote?
            </h2>
            <p className="text-lg text-muted-foreground">
              भारतवोट क्यों? • Built for Trust & Transparency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="govt-card p-6 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-primary font-medium mb-2">
                  {feature.titleHi}
                </p>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary via-trust to-accent">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Make Your Voice Count?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
              Join millions of Indians in shaping the future of our democracy.
              Your vote is your power. Use it wisely.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                <Link to="/register">
                  Start Voting Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-trust gap-2"
                onClick={handleAuditClick}
              >
                Explore Public Audit
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
