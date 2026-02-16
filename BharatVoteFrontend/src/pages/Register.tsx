import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Fingerprint,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  CreditCard,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useFlow } from "@/lib/flowControl";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh",
];

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeStep } = useFlow();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    aadhaar: "",
    name: "",
    email: "",
    phone: "",
    voter_id: "",
    state: "",
    constituency: "",
  });
  const [aadhaarImage, setAadhaarImage] = useState<File | null>(null);
  const [userImage, setUserImage] = useState<File | null>(null);

  const handleAadhaarVerify = async () => {
    if (formData.aadhaar.length !== 12) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Try to initiate login — if it succeeds, user is already registered
      await api.auth.loginInitiate(formData.aadhaar);

      // If we reach here, the user IS already registered
      setIsLoading(false);
      toast({
        title: "✅ Already Registered!",
        description: "Your Aadhaar is already registered. Redirecting you to the Login page...",
      });
      // Advance flow so login is accessible
      completeStep("register");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    } catch (err: any) {
      // User is NOT registered — this is the normal flow, proceed
      // (loginInitiate returns 404 / error for unregistered users)
    }

    // Normal flow: client-side format check (real verification happens on registration)
    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("mobile", formData.phone);
      fd.append("aadhaar", formData.aadhaar);
      fd.append("voter_id", formData.voter_id);
      fd.append("email", formData.email);
      fd.append("state", formData.state);
      fd.append("constituency", formData.constituency);
      fd.append("declaration_accepted", "true");

      if (aadhaarImage) fd.append("aadhaar_image", aadhaarImage);
      if (userImage) fd.append("user_image", userImage);

      const res = await api.auth.register(fd);

      sessionStorage.setItem("bharatvote-registered", "true");
      completeStep("register");
      toast({
        title: "Registration Successful!",
        description: res.message || "You can now login to vote.",
      });
      navigate("/login");
    } catch (err: any) {
      const msg = (err.message || "Registration failed").toLowerCase();
      // If user is already registered, redirect to login gracefully
      if (msg.includes("already registered") || msg.includes("already exists")) {
        toast({
          title: "✅ Already Registered!",
          description: "Your Aadhaar is already registered. Redirecting you to the Login page...",
        });
        completeStep("register");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      setErrorMsg(err.message || "Registration failed");
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern py-8">
      <div className="container max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Voter Registration
          </h1>
          <p className="text-muted-foreground">
            मतदाता पंजीकरण • Secure & Anonymous
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
                  }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 rounded ${step > s ? "bg-primary" : "bg-secondary"
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {/* Registration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="govt-card-elevated p-8"
        >
          <form onSubmit={handleSubmit}>
            {/* Step 1: Aadhaar Verification */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Fingerprint className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Aadhaar Verification</h2>
                  <p className="text-muted-foreground text-sm">
                    आधार सत्यापन • Step 1 of 3
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aadhaar">Aadhaar Number</Label>
                  <div className="relative">
                    <Input
                      id="aadhaar"
                      type="text"
                      placeholder="XXXX XXXX XXXX"
                      maxLength={12}
                      value={formData.aadhaar}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, aadhaar: value });
                      }}
                      className="text-lg tracking-wider"
                      disabled={isVerified}
                    />
                    {isVerified && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your Aadhaar is used for identity verification only and will not be linked to your vote.
                  </p>
                </div>

                {!isVerified ? (
                  <Button
                    type="button"
                    onClick={handleAadhaarVerify}
                    disabled={formData.aadhaar.length !== 12 || isLoading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying identity securely…
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 mr-2" />
                        Verify Aadhaar
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <CheckCircle className="w-6 h-6 text-accent" />
                      <div>
                        <p className="font-medium text-accent">Format Verified</p>
                        <p className="text-sm text-muted-foreground">
                          Continue to enter your details
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full bg-accent hover:bg-accent/90"
                    >
                      Continue to Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Personal Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-trust/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-trust" />
                  </div>
                  <h2 className="text-xl font-bold">Personal Details</h2>
                  <p className="text-muted-foreground text-sm">
                    व्यक्तिगत विवरण • Step 2 of 3
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name (as per Aadhaar)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number (10 digits)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                        className="pl-10"
                        placeholder="98XXXXXXXX"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voter_id">Voter ID (e.g., ABC1234567)</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="voter_id"
                        value={formData.voter_id}
                        onChange={(e) => setFormData({ ...formData, voter_id: e.target.value.toUpperCase() })}
                        className="pl-10"
                        placeholder="ABC1234567"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address (optional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div className="space-y-2">
                    <Label>Aadhaar Card Image (JPEG/PNG)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => setAadhaarImage(e.target.files?.[0] || null)}
                        className="hidden"
                        id="aadhaarFile"
                      />
                      <label htmlFor="aadhaarFile" className="cursor-pointer">
                        <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {aadhaarImage ? `✓ ${aadhaarImage.name}` : "Upload Aadhaar card"}
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Live Photo (JPEG/PNG)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => setUserImage(e.target.files?.[0] || null)}
                        className="hidden"
                        id="userPhotoFile"
                      />
                      <label htmlFor="userPhotoFile" className="cursor-pointer">
                        <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {userImage ? `✓ ${userImage.name}` : "Upload your photo"}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 bg-trust hover:bg-trust/90"
                    disabled={!formData.name || !formData.phone || !formData.voter_id || !aadhaarImage || !userImage}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Constituency */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-10 h-10 text-accent" />
                  </div>
                  <h2 className="text-xl font-bold">Select Constituency</h2>
                  <p className="text-muted-foreground text-sm">
                    निर्वाचन क्षेत्र चुनें • Step 3 of 3
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Union Territory</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="constituency">Constituency</Label>
                    <Input
                      id="constituency"
                      placeholder="e.g., New Delhi - 01"
                      value={formData.constituency}
                      onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-secondary rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-foreground">Privacy Notice</p>
                      <p className="text-muted-foreground">
                        Your registration data is encrypted and used only for eligibility verification.
                        It will never be linked to your vote.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent/90"
                    disabled={!formData.state || !formData.constituency || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering…
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Complete Registration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </motion.div>

        {/* Already Registered */}
        <p className="text-center text-muted-foreground mt-6">
          Already registered?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Login to Vote
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
