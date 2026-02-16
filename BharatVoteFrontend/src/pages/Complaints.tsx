import { useState } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Phone,
  Mail,
  Clock,
  MapPin,
  Send,
  CheckCircle,
  AlertTriangle,
  Upload,
  MessageCircle,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const categories = [
  { value: "voting", label: "Voting Issue", labelHi: "मतदान समस्या" },
  { value: "aadhaar", label: "Aadhaar Issue", labelHi: "आधार समस्या" },
  { value: "technical", label: "Technical Problem", labelHi: "तकनीकी समस्या" },
  { value: "coercion", label: "Coercion Concern", labelHi: "बलात चिंता" },
  { value: "other", label: "Other", labelHi: "अन्य" },
];

const faqs = [
  {
    q: "How do I know my vote was counted?",
    a: "After voting, you'll receive a cryptographic receipt. Use the receipt ID on the Public Audit page to verify your vote is included in the Merkle tree.",
  },
  {
    q: "Can anyone see who I voted for?",
    a: "No. Your vote is encrypted with zero-knowledge proofs. Even election officials cannot link your identity to your vote choice.",
  },
  {
    q: "What if someone forces me to show my receipt?",
    a: "Use the 'Generate Fake Receipt' feature on your receipt page. This creates an invalid receipt that looks real but cannot be verified.",
  },
  {
    q: "I made a mistake while voting. Can I change my vote?",
    a: "For security reasons, votes cannot be changed after submission. Please review your choice carefully before confirming.",
  },
];

const Complaints = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    email: "",
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintRef, setComplaintRef] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Complaint tracking
  const [trackId, setTrackId] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("category", formData.category);
      fd.append("description", formData.description);
      fd.append("email", formData.email);
      if (attachment) fd.append("attachment", attachment);

      const res = await api.complaints.submit(fd);
      setComplaintRef((res.data as any)?.complaint?._id || (res.data as any)?.referenceId || `CMP-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
      toast({
        title: "Complaint Submitted",
        description: "We'll get back to you within 24-48 hours.",
      });
    } catch (err: any) {
      // Fallback to demo
      setComplaintRef(`CMP-${Date.now().toString(36).toUpperCase()}`);
      setSubmitted(true);
      toast({
        title: "Complaint Submitted (Demo)",
        description: err.message || "We'll get back to you within 24-48 hours.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!trackId) return;
    setIsTracking(true);
    try {
      const res = await api.complaints.track(trackId);
      setTrackResult(res.data || res);
      toast({ title: "Complaint Found", description: `Status: ${(res.data as any)?.status || 'Pending'}` });
    } catch {
      setTrackResult({ status: "pending", message: "Complaint not found or backend unavailable" });
      toast({ title: "Not Found", description: "Check the complaint ID", variant: "destructive" });
    } finally {
      setIsTracking(false);
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-hero-pattern py-8">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Helpdesk & Complaints
          </h1>
          <p className="text-muted-foreground text-lg">
            सहायता केंद्र और शिकायतें • We're here to help
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact Info + Tracking */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="govt-card-elevated p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Contact Us
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">1950</p>
                    <p className="text-sm text-muted-foreground">Toll Free Helpline</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-trust/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-trust" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">helpdesk@eci.gov.in</p>
                    <p className="text-sm text-muted-foreground">Email Support</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">10 AM – 5 PM</p>
                    <p className="text-sm text-muted-foreground">Mon - Sat</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-india-navy/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-india-navy" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Nirvachan Sadan</p>
                    <p className="text-sm text-muted-foreground">
                      Ashoka Road, New Delhi - 110001
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-secondary rounded-lg">
                <p className="text-xs text-muted-foreground italic">
                  * This is a demo project. Contact information is for illustrative purposes only.
                </p>
              </div>
            </div>

            {/* Track Complaint */}
            <div className="govt-card-elevated p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Track Complaint
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Complaint ID</Label>
                  <Input
                    placeholder="Enter complaint ID"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleTrack}
                  disabled={!trackId || isTracking}
                >
                  {isTracking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Track Status
                </Button>
                {trackResult && (
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm font-medium">Status: <span className="text-accent">{trackResult.status}</span></p>
                    {trackResult.message && <p className="text-xs text-muted-foreground mt-1">{trackResult.message}</p>}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Complaint Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="govt-card-elevated p-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Submit a Complaint
            </h2>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Complaint Submitted!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Reference ID: {complaintRef}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  We'll review your complaint and respond within 24-48 hours.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ category: "", description: "", email: "" });
                    setAttachment(null);
                  }}
                >
                  Submit Another
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label} • {cat.labelHi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your issue in detail..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email (for response)</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Attachment (optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      className="hidden"
                      id="complaintFile"
                    />
                    <label htmlFor="complaintFile" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {attachment ? `✓ ${attachment.name}` : "Click or drag to upload screenshot"}
                      </p>
                    </label>
                  </div>
                </div>

                {formData.category === "coercion" && (
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <p className="font-medium text-destructive">
                          Coercion Alert
                        </p>
                        <p className="text-sm text-muted-foreground">
                          If you're being forced to vote a certain way, your safety is our priority.
                          This complaint will be handled with complete confidentiality.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.category || !formData.description}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </form>
            )}
          </motion.div>

          {/* FAQs */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="govt-card-elevated p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-secondary rounded-lg"
                  >
                    <h3 className="font-medium text-foreground mb-2">{faq.q}</h3>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </motion.div>
                ))}

                {filteredFaqs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No FAQs found matching your search.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Complaints;
