import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * Flow Control — Enforces sequential navigation through the voting process.
 * 
 * Flow:  Home → Register → Login → Vote → Receipt → Audit → Helpdesk
 * 
 * A user cannot access a later step until they've completed the previous one.
 * The current step is persisted in sessionStorage so it survives page reloads.
 */

export type FlowStep = "home" | "register" | "login" | "vote" | "receipt" | "audit" | "complaints";

const STEP_ORDER: FlowStep[] = ["home", "register", "login", "vote", "receipt", "audit", "complaints"];

const PATH_TO_STEP: Record<string, FlowStep> = {
    "/": "home",
    "/register": "register",
    "/login": "login",
    "/vote": "vote",
    "/receipt": "receipt",
    "/audit": "audit",
    "/complaints": "complaints",
};

interface FlowContextType {
    /** The highest step the user has unlocked (can visit this and all before it) */
    currentStep: FlowStep;
    /** Advance to the next step (call when a step is completed) */
    completeStep: (step: FlowStep) => void;
    /** Check if a specific path is accessible */
    canAccess: (path: string) => boolean;
    /** Get step index for comparison */
    getStepIndex: (step: FlowStep) => number;
    /** Whether the user is on the Vote page and voting is in progress */
    isVotingLocked: boolean;
    setVotingLocked: (locked: boolean) => void;
    /** Reset flow to the beginning */
    resetFlow: () => void;
    /** Auth State */
    isAuthenticated: boolean;
    login: (token: string, user: any) => void;
    logout: () => void;
}

const FlowContext = createContext<FlowContextType>({
    currentStep: "home",
    completeStep: () => { },
    canAccess: () => true,
    getStepIndex: () => 0,
    isVotingLocked: false,
    setVotingLocked: () => { },
    resetFlow: () => { },
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
});

export const FlowProvider = ({ children }: { children: ReactNode }) => {
    const [currentStep, setCurrentStep] = useState<FlowStep>(() => {
        const saved = sessionStorage.getItem("bharatvote-flow-step") as FlowStep | null;
        if (!saved) return "home";

        // Validate: if flow says we're past login but there's no auth token,
        // the user isn't actually logged in — reset to at most "login"
        const token = sessionStorage.getItem("bharatvote-token");
        const isAuthenticated = sessionStorage.getItem("bharatvote-authenticated") === "true";
        const stepIdx = STEP_ORDER.indexOf(saved);
        const loginIdx = STEP_ORDER.indexOf("login");

        if (stepIdx > loginIdx && (!token || !isAuthenticated)) {
            // Not logged in — cap at "login" (Register and Login are accessible)
            return "login";
        }

        return saved;
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isVotingLocked, setVotingLocked] = useState(false);

    // Initial auth check
    useEffect(() => {
        const token = sessionStorage.getItem("bharatvote-token");
        setIsAuthenticated(!!token);
    }, []);

    // Persist to sessionStorage
    useEffect(() => {
        sessionStorage.setItem("bharatvote-flow-step", currentStep);
    }, [currentStep]);

    const getStepIndex = (step: FlowStep) => STEP_ORDER.indexOf(step);

    const completeStep = (step: FlowStep) => {
        const stepIdx = getStepIndex(step);
        const currentIdx = getStepIndex(currentStep);
        if (stepIdx >= currentIdx) {
            const nextIdx = Math.min(stepIdx + 1, STEP_ORDER.length - 1);
            setCurrentStep(STEP_ORDER[nextIdx]);
        }
    };

    const login = (token: string, user: any) => {
        sessionStorage.setItem("bharatvote-token", token);
        sessionStorage.setItem("bharatvote-authenticated", "true");
        if (user) sessionStorage.setItem("bharatvote-user", JSON.stringify(user));
        setIsAuthenticated(true);
        completeStep("login");
    };

    const logout = () => {
        sessionStorage.clear();
        localStorage.removeItem("bharatvote-token");
        setIsAuthenticated(false);
        resetFlow();
    };

    const canAccess = (path: string) => {
        // Admin is always accessible (handled by its own auth)
        if (path === "/admin") return true;

        // Protected Access Check
        const protectedPaths = ["/vote", "/receipt", "/audit", "/complaints"];
        if (protectedPaths.includes(path) && !isAuthenticated) {
            return false;
        }

        const targetStep = PATH_TO_STEP[path];
        if (!targetStep) return true;

        // Vote page access strictly controlled by auth in addition to step
        if (targetStep === "vote" && !isAuthenticated) return false;

        const targetIdx = getStepIndex(targetStep);
        const currentIdx = getStepIndex(currentStep);

        if (targetStep === "login" && currentIdx >= getStepIndex("register")) return true;

        return targetIdx <= currentIdx;
    };

    const resetFlow = () => {
        setCurrentStep("home");
        setVotingLocked(false);
        sessionStorage.removeItem("bharatvote-flow-step");
    };

    return (
        <FlowContext.Provider value={{
            currentStep,
            completeStep,
            canAccess,
            getStepIndex,
            isVotingLocked,
            setVotingLocked,
            resetFlow,
            isAuthenticated,
            login,
            logout
        }}>
            {children}
        </FlowContext.Provider>
    );
};

export const useFlow = () => useContext(FlowContext);

export default FlowContext;
