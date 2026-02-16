import { motion } from "framer-motion";
import { Radio, Users, CheckCircle2, Clock } from "lucide-react";

interface ElectionStatusBarProps {
  status?: "upcoming" | "active" | "completed";
  electionName?: string;
}

const ElectionStatusBar = ({
  status = "active",
  electionName = "General Election 2024 Demo",
}: ElectionStatusBarProps) => {
  const statusConfig = {
    upcoming: {
      label: "Upcoming",
      labelHi: "आगामी",
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      icon: <Clock className="w-4 h-4" />,
    },
    active: {
      label: "Live Now",
      labelHi: "चालू",
      color: "bg-accent",
      textColor: "text-accent",
      bgColor: "bg-accent/10",
      icon: <Radio className="w-4 h-4" />,
    },
    completed: {
      label: "Completed",
      labelHi: "समाप्त",
      color: "bg-trust",
      textColor: "text-trust",
      bgColor: "bg-trust/10",
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} border-b border-border`}>
      <div className="container py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Election Name & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {status === "active" && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-2.5 h-2.5 bg-accent rounded-full"
                />
              )}
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
                {config.icon}
                {config.label} • {config.labelHi}
              </span>
            </div>
            <h2 className="font-semibold text-foreground">{electionName}</h2>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>
                <strong className="text-foreground">1,24,567</strong> votes cast
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>
                <strong className="text-foreground">99.9%</strong> verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionStatusBar;
