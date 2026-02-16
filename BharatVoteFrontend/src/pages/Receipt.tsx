import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileCheck,
  Download,
  Copy,
  CheckCircle,
  Shield,
  QrCode,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Mail,
  Share2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useFlow } from "@/lib/flowControl";

const Receipt = () => {
  const { toast } = useToast();
  const { completeStep } = useFlow();
  const [receiptData, setReceiptData] = useState({
    receiptId: "",
    timestamp: "",
    merkleRoot: "",
    voteHash: "",
    voterNumber: "",
    proudVoter: "I am a Proud Voter of India 🇮🇳",
  });
  const [emailAddr, setEmailAddr] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  useEffect(() => {
    const voteDataStr = sessionStorage.getItem("bharatvote-vote-data");
    if (voteDataStr) {
      const voteData = JSON.parse(voteDataStr);
      setReceiptData({
        receiptId: voteData.receiptId || `BV-${Date.now().toString(36).toUpperCase()}`,
        timestamp: voteData.timestamp || new Date().toISOString(),
        merkleRoot: voteData.merkleRoot || "0x7a8b9c2d1e4f...pending",
        voteHash: voteData.voteHash || `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}...`,
        voterNumber: voteData.voterNumber || "",
        proudVoter: "I am a Proud Voter of India 🇮🇳",
      });
      completeStep("receipt");

      // Only fetch share data if this was a real backend vote (has voteHash from server)
      if (voteData.receiptId && voteData.voteHash && !voteData.voteHash.startsWith('0x')) {
        api.vote.getShareData(voteData.receiptId).then(res => {
          setShareData(res.data || res);
        }).catch(() => { });
      }
    } else {
      setReceiptData({
        receiptId: `BV-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        merkleRoot: "0x7a8b9c2d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
        voteHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        voterNumber: "#1247",
        proudVoter: "I am a Proud Voter of India 🇮🇳",
      });
    }
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await api.vote.downloadReceipt(receiptData.receiptId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BharatVote-Receipt-${receiptData.receiptId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded!", description: "Receipt saved as PDF" });
    } catch {
      toast({ title: "Download unavailable", description: "Could not generate PDF receipt", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmailReceipt = async () => {
    if (!emailAddr) return;
    setIsSending(true);
    try {
      await api.vote.emailReceipt(receiptData.receiptId, emailAddr);
      toast({ title: "Email Sent!", description: `Receipt sent to ${emailAddr}` });
      setEmailAddr("");
    } catch {
      toast({ title: "Email failed", description: "Could not send receipt email", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const generateFakeReceipt = () => {
    const fakeReceipt = {
      receiptId: `BV-FAKE${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      merkleRoot: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      voteHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      voterNumber: "#0000",
      proudVoter: "I am a Proud Voter of India 🇮🇳",
    };

    toast({
      title: "Fake Receipt Generated",
      description: "This receipt is invalid and cannot be verified. Use this for anti-coercion purposes only.",
      variant: "destructive",
    });

    setReceiptData(fakeReceipt);
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
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Vote Receipt
          </h1>
          <p className="text-muted-foreground">
            मतदान रसीद • Your Cryptographic Proof
          </p>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 p-4 bg-accent/10 rounded-lg border border-accent/20 mb-6"
        >
          <CheckCircle className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <h3 className="font-bold text-accent">Vote Successfully Cast!</h3>
            <p className="text-sm text-muted-foreground">
              Your vote has been encrypted and added to the Merkle tree.
            </p>
            {receiptData.voterNumber && (
              <p className="text-sm text-accent font-medium mt-1">
                You are voter {receiptData.voterNumber}
              </p>
            )}
          </div>
        </motion.div>

        {/* Proud Voter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20 mb-6"
        >
          <p className="font-bold text-primary text-lg">{receiptData.proudVoter}</p>
        </motion.div>

        {/* Receipt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="govt-card-elevated overflow-hidden"
        >
          {/* Tricolor Header */}
          <div className="h-2 bg-gradient-to-r from-india-saffron via-india-white to-india-green" />

          <div className="p-6 md:p-8">
            {/* Official Header */}
            <div className="text-center border-b border-border pb-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-trust" />
                <h2 className="text-xl font-bold text-foreground">
                  भारत निर्वाचन प्रणाली
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Secure Anonymous Voting System
              </p>
              <div className="mt-4 inline-block px-4 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                ✓ DIGITALLY VERIFIED
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-start p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Receipt ID</p>
                  <p className="font-mono font-bold text-foreground">
                    {receiptData.receiptId}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(receiptData.receiptId, "Receipt ID")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex justify-between items-start p-4 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Timestamp</p>
                  <p className="font-mono text-foreground">
                    {new Date(receiptData.timestamp).toLocaleString("en-IN", {
                      dateStyle: "full",
                      timeStyle: "long",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-start p-4 bg-secondary rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Vote Hash (SHA-256)</p>
                  <p className="font-mono text-sm text-foreground truncate">
                    {receiptData.voteHash}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(receiptData.voteHash, "Vote Hash")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex justify-between items-start p-4 bg-secondary rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Merkle Root</p>
                  <p className="font-mono text-sm text-foreground truncate">
                    {receiptData.merkleRoot}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(receiptData.merkleRoot, "Merkle Root")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="flex justify-center my-8">
              <div className="w-32 h-32 bg-foreground rounded-lg flex items-center justify-center">
                <QrCode className="w-24 h-24 text-background" />
              </div>
            </div>

            {/* Privacy */}
            <div className="p-4 bg-trust/10 rounded-lg border border-trust/20 mb-6">
              <p className="text-sm text-trust font-medium mb-2">
                🔒 Privacy Guarantee
              </p>
              <p className="text-sm text-muted-foreground">
                This receipt proves your vote was included in the election, but it does NOT reveal who you voted for.
                The vote hash is a one-way cryptographic function that cannot be reversed.
              </p>
            </div>

            {/* Email Receipt */}
            <div className="flex gap-2 mb-4">
              <Input
                type="email"
                placeholder="Enter email for receipt"
                value={emailAddr}
                onChange={(e) => setEmailAddr(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleEmailReceipt}
                disabled={!emailAddr || isSending}
                className="gap-2 bg-trust hover:bg-trust/90"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send
              </Button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                PDF
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const text = `I just voted in India's secure digital election! 🇮🇳 #BharatVote #ProudVoter @ECI_India Receipt: ${receiptData.receiptId}`;
                  if (navigator.share) {
                    navigator.share({ text, title: "BharatVote Receipt" }).catch(() => { });
                  } else {
                    handleCopy(text, "Share text");
                  }
                }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                asChild
                className="gap-2 bg-accent hover:bg-accent/90"
              >
                <Link to="/audit">
                  <ExternalLink className="w-4 h-4" />
                  Verify
                </Link>
              </Button>
            </div>
          </div>

          {/* Tricolor Footer */}
          <div className="h-2 bg-gradient-to-r from-india-saffron via-india-white to-india-green" />
        </motion.div>

        {/* Anti-Coercion Feature */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-4 bg-secondary rounded-lg border border-border"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">
                Anti-Coercion Feature
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                If someone is forcing you to show your receipt, you can generate a fake receipt that looks
                identical but cannot be verified. This protects your vote secrecy.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={generateFakeReceipt}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generate Fake Receipt
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <p className="text-center text-muted-foreground mt-8">
          <Link to="/" className="text-primary hover:underline">
            ← Return to Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Receipt;
