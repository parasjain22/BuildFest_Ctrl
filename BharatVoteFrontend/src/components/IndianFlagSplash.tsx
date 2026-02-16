import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IndianFlagSplashProps {
  onComplete: () => void;
}

const IndianFlagSplash = ({ onComplete }: IndianFlagSplashProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleEnter = () => {
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  // Ashoka Chakra spokes
  const spokes = Array.from({ length: 24 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Flag Stripes */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-1/3 bg-india-saffron origin-left"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            className="absolute top-1/3 left-0 right-0 h-1/3 bg-india-white origin-left"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="absolute top-2/3 left-0 right-0 h-1/3 bg-india-green origin-left"
          />

          {/* Ashoka Chakra */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
            className="relative z-10 w-32 h-32 md:w-48 md:h-48"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full ashoka-chakra">
              {/* Outer circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#0000CC"
                strokeWidth="2"
              />
              {/* Inner circle */}
              <circle
                cx="50"
                cy="50"
                r="8"
                fill="#0000CC"
              />
              {/* 24 Spokes */}
              {spokes.map((_, index) => {
                const angle = (index * 15 * Math.PI) / 180;
                const x1 = 50 + 10 * Math.cos(angle);
                const y1 = 50 + 10 * Math.sin(angle);
                const x2 = 50 + 43 * Math.cos(angle);
                const y2 = 50 + 43 * Math.sin(angle);
                return (
                  <line
                    key={index}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#0000CC"
                    strokeWidth="1.5"
                  />
                );
              })}
              {/* Small circles between spokes */}
              {spokes.map((_, index) => {
                const angle = ((index * 15 + 7.5) * Math.PI) / 180;
                const x = 50 + 40 * Math.cos(angle);
                const y = 50 + 40 * Math.sin(angle);
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={x}
                    cy={y}
                    r="2"
                    fill="#0000CC"
                  />
                );
              })}
            </svg>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="z-10 mt-8 text-center px-4"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-india-navy mb-2">
              भारत निर्वाचन प्रणाली
            </h1>
            <p className="text-lg md:text-xl text-india-navy/80">
              Secure Anonymous Voting System
            </p>
          </motion.div>

          {/* Enter Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnter}
            className="z-10 mt-8 px-8 py-3 bg-india-navy text-white font-semibold rounded-lg shadow-lg hover:bg-india-navy/90 transition-colors"
          >
            Enter / प्रवेश करें
          </motion.button>

          {/* Auto-dismiss indicator */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-india-navy/30 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IndianFlagSplash;
