import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/lib/language";

interface LangOption {
  code: "en" | "hi";
  name: string;
  nativeName: string;
}

const languageOptions: LangOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
];

interface LanguageSelectorProps {
  className?: string;
}

const LanguageSelector = ({ className = "" }: LanguageSelectorProps) => {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const selected = languageOptions.find((l) => l.code === lang) || languageOptions[0];

  const handleSelect = (option: LangOption) => {
    setLang(option.code);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
      >
        <Globe className="w-4 h-4 text-trust" />
        <span>{selected.nativeName}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-elevated z-50 overflow-hidden"
            >
              <div className="p-2">
                {languageOptions.map((option) => (
                  <button
                    key={option.code}
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors ${lang === option.code
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary"
                      }`}
                  >
                    <div>
                      <span className="font-medium">{option.nativeName}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({option.name})
                      </span>
                    </div>
                    {lang === option.code && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
