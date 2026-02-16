import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCheck, LogIn, Vote, FileCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: <UserCheck className="w-12 h-12" />,
    title: "Verify Aadhaar",
    titleHi: "आधार सत्यापन",
    description: "Securely verify your identity using Aadhaar authentication",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: <LogIn className="w-12 h-12" />,
    title: "Login Securely",
    titleHi: "सुरक्षित लॉगिन",
    description: "Access the voting portal with encrypted credentials",
    color: "text-trust",
    bgColor: "bg-trust/10",
  },
  {
    icon: <Vote className="w-12 h-12" />,
    title: "Cast Your Vote",
    titleHi: "मतदान करें",
    description: "Your vote is encrypted and completely anonymous",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: <FileCheck className="w-12 h-12" />,
    title: "Verify Receipt",
    titleHi: "रसीद सत्यापन",
    description: "Get cryptographic proof that your vote was counted",
    color: "text-india-navy",
    bgColor: "bg-india-navy/10",
  },
];

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal = ({ onClose }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if onboarding was shown this session
    const hasSeenOnboarding = sessionStorage.getItem("bharatvote-onboarding");
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("bharatvote-onboarding", "true");
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-card rounded-2xl shadow-elevated max-w-lg w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary via-trust to-accent p-6 text-white">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">Welcome to BharatVote</h2>
            <p className="text-white/80 text-sm mt-1">
              भारतवोट में आपका स्वागत है
            </p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 py-4 bg-secondary/50">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-primary w-8"
                    : index < currentStep
                    ? "bg-accent"
                    : "bg-border"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div
                  className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${steps[currentStep].bgColor} ${steps[currentStep].color} mb-6`}
                >
                  {steps[currentStep].icon}
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {steps[currentStep].title}
                </h3>
                <p className="text-muted-foreground text-sm mb-2">
                  {steps[currentStep].titleHi}
                </p>
                <p className="text-foreground/80">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-6 border-t border-border bg-secondary/30">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>

            <Button onClick={handleNext} className="gap-1 bg-primary hover:bg-primary/90">
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
