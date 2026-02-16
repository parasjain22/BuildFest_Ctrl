import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ═══════════════════════════════════════════════════════
//  Translation Dictionaries — English & Hindi
// ═══════════════════════════════════════════════════════

const translations: Record<string, Record<string, string>> = {
    en: {
        // Navbar
        "nav.home": "Home",
        "nav.register": "Register",
        "nav.login": "Login",
        "nav.vote": "Vote",
        "nav.receipt": "Receipt",
        "nav.audit": "Audit",
        "nav.complaints": "Complaints",
        "nav.admin": "Admin",
        "nav.tagline": "Election Commission of India",

        // Home / Index
        "home.hero_title": "Secure Digital Voting for India",
        "home.hero_subtitle": "BharatVote empowers every citizen with a transparent, tamper-proof, and accessible voting experience.",
        "home.register_now": "Register Now",
        "home.learn_more": "Learn More",
        "home.feature_secure": "End-to-End Encrypted",
        "home.feature_secure_desc": "Your vote is encrypted and cannot be linked to your identity.",
        "home.feature_transparent": "Fully Transparent",
        "home.feature_transparent_desc": "Every vote is recorded on an immutable audit trail.",
        "home.feature_accessible": "Accessible to All",
        "home.feature_accessible_desc": "Designed for every Indian citizen with multi-language support.",

        // Register
        "register.title": "Voter Registration",
        "register.subtitle": "Register securely using your Aadhaar identity",
        "register.aadhaar": "Aadhaar Number",
        "register.aadhaar_placeholder": "Enter 12-digit Aadhaar number",
        "register.verify_aadhaar": "Verify Aadhaar",
        "register.full_name": "Full Name",
        "register.mobile": "Mobile Number",
        "register.email": "Email (Optional)",
        "register.voter_id": "Voter ID",
        "register.state": "State",
        "register.constituency": "Constituency",
        "register.aadhaar_image": "Aadhaar Card Image",
        "register.selfie": "Your Photo / Selfie",
        "register.declaration": "I declare that all information is true and I am an eligible voter.",
        "register.submit": "Complete Registration",
        "register.already_registered": "Already registered?",
        "register.login_here": "Login here",

        // Login
        "login.title": "Voter Login",
        "login.subtitle": "Authenticate securely to cast your vote",
        "login.aadhaar_placeholder": "Enter your 12-digit Aadhaar number",
        "login.send_otp": "Send OTP",
        "login.enter_otp": "Enter OTP",
        "login.otp_placeholder": "Enter 6-digit OTP",
        "login.verify_otp": "Verify OTP",
        "login.face_verify": "Face Verification",
        "login.face_verify_desc": "Look at the camera for identity verification",
        "login.verify_face": "Verify Face",
        "login.not_registered": "Not registered yet?",
        "login.register_here": "Register here",

        // Vote
        "vote.title": "Cast Your Vote",
        "vote.subtitle": "Select your candidate",
        "vote.encrypted": "End-to-End Encrypted",
        "vote.encrypted_desc": "Your vote is anonymous and cannot be linked to your identity",
        "vote.cast_button": "Cast Vote",
        "vote.confirm_title": "Confirm Your Vote",
        "vote.confirm_desc": "Are you sure? This action cannot be undone.",
        "vote.confirm_yes": "Yes, Cast My Vote",
        "vote.confirm_cancel": "Cancel",
        "vote.session_expired": "Session Expired",
        "vote.session_expired_desc": "Your voting session has timed out for security reasons. Please login again to cast your vote.",
        "vote.login_again": "Login Again",
        "vote.not_recorded": "Not recorded",
        "vote.camera_off": "Camera off",

        // Receipt
        "receipt.title": "Vote Receipt",
        "receipt.subtitle": "Your vote has been securely recorded",
        "receipt.id": "Receipt ID",
        "receipt.timestamp": "Timestamp",
        "receipt.vote_hash": "Vote Hash",
        "receipt.merkle_root": "Merkle Root",
        "receipt.download": "Download PDF",
        "receipt.copy": "Copy",
        "receipt.email_receipt": "Email Receipt",
        "receipt.verify": "Verify on Audit Trail",
        "receipt.proud_voter": "I am a Proud Voter of India 🇮🇳",

        // Audit
        "audit.title": "Public Audit Trail",
        "audit.subtitle": "Transparent and verifiable election records",
        "audit.total_votes": "Total Votes",
        "audit.turnout": "Turnout",
        "audit.merkle_root": "Merkle Root",
        "audit.verify_receipt": "Verify Receipt",
        "audit.verify_placeholder": "Enter receipt ID",
        "audit.verify_button": "Verify",

        // Complaints
        "complaints.title": "File a Complaint",
        "complaints.subtitle": "Report any election irregularities",
        "complaints.category": "Category",
        "complaints.description": "Description",
        "complaints.email": "Your Email",
        "complaints.attachment": "Attachment (Optional)",
        "complaints.submit": "Submit Complaint",
        "complaints.track_title": "Track Complaint",
        "complaints.track_placeholder": "Enter complaint ID",
        "complaints.track_button": "Track",

        // Common
        "common.loading": "Loading...",
        "common.error": "Error",
        "common.success": "Success",
        "common.submit": "Submit",
        "common.cancel": "Cancel",
        "common.back": "Back",
        "common.next": "Next",
        "common.select": "Select",
    },

    hi: {
        // Navbar
        "nav.home": "होम",
        "nav.register": "पंजीकरण",
        "nav.login": "लॉगिन",
        "nav.vote": "मतदान",
        "nav.receipt": "रसीद",
        "nav.audit": "ऑडिट",
        "nav.complaints": "शिकायतें",
        "nav.admin": "प्रशासक",
        "nav.tagline": "भारत निर्वाचन आयोग",

        // Home / Index
        "home.hero_title": "भारत के लिए सुरक्षित डिजिटल मतदान",
        "home.hero_subtitle": "भारतवोट हर नागरिक को पारदर्शी, छेड़छाड़-प्रूफ और सुलभ मतदान अनुभव प्रदान करता है।",
        "home.register_now": "अभी पंजीकरण करें",
        "home.learn_more": "और जानें",
        "home.feature_secure": "एंड-टू-एंड एन्क्रिप्टेड",
        "home.feature_secure_desc": "आपका वोट एन्क्रिप्टेड है और आपकी पहचान से जोड़ा नहीं जा सकता।",
        "home.feature_transparent": "पूर्ण पारदर्शी",
        "home.feature_transparent_desc": "हर वोट अपरिवर्तनीय ऑडिट ट्रेल पर दर्ज होता है।",
        "home.feature_accessible": "सभी के लिए सुलभ",
        "home.feature_accessible_desc": "बहु-भाषा समर्थन के साथ हर भारतीय नागरिक के लिए डिज़ाइन किया गया।",

        // Register
        "register.title": "मतदाता पंजीकरण",
        "register.subtitle": "अपनी आधार पहचान का उपयोग करके सुरक्षित रूप से पंजीकरण करें",
        "register.aadhaar": "आधार नंबर",
        "register.aadhaar_placeholder": "12 अंकों का आधार नंबर दर्ज करें",
        "register.verify_aadhaar": "आधार सत्यापित करें",
        "register.full_name": "पूरा नाम",
        "register.mobile": "मोबाइल नंबर",
        "register.email": "ईमेल (वैकल्पिक)",
        "register.voter_id": "मतदाता पहचान पत्र",
        "register.state": "राज्य",
        "register.constituency": "निर्वाचन क्षेत्र",
        "register.aadhaar_image": "आधार कार्ड की फोटो",
        "register.selfie": "आपकी फोटो / सेल्फी",
        "register.declaration": "मैं घोषणा करता/करती हूँ कि सभी जानकारी सत्य है और मैं एक पात्र मतदाता हूँ।",
        "register.submit": "पंजीकरण पूरा करें",
        "register.already_registered": "पहले से पंजीकृत हैं?",
        "register.login_here": "लॉगिन करें",

        // Login
        "login.title": "मतदाता लॉगिन",
        "login.subtitle": "मतदान के लिए सुरक्षित रूप से प्रमाणित करें",
        "login.aadhaar_placeholder": "अपना 12 अंकों का आधार नंबर दर्ज करें",
        "login.send_otp": "OTP भेजें",
        "login.enter_otp": "OTP दर्ज करें",
        "login.otp_placeholder": "6 अंकों का OTP दर्ज करें",
        "login.verify_otp": "OTP सत्यापित करें",
        "login.face_verify": "चेहरा सत्यापन",
        "login.face_verify_desc": "पहचान सत्यापन के लिए कैमरे की ओर देखें",
        "login.verify_face": "चेहरा सत्यापित करें",
        "login.not_registered": "अभी तक पंजीकृत नहीं हैं?",
        "login.register_here": "पंजीकरण करें",

        // Vote
        "vote.title": "अपना मत दें",
        "vote.subtitle": "अपने उम्मीदवार का चयन करें",
        "vote.encrypted": "एंड-टू-एंड एन्क्रिप्टेड",
        "vote.encrypted_desc": "आपका वोट गुमनाम है और आपकी पहचान से जोड़ा नहीं जा सकता",
        "vote.cast_button": "वोट दें",
        "vote.confirm_title": "अपने वोट की पुष्टि करें",
        "vote.confirm_desc": "क्या आप सुनिश्चित हैं? यह क्रिया पूर्ववत नहीं की जा सकती।",
        "vote.confirm_yes": "हाँ, मेरा वोट डालें",
        "vote.confirm_cancel": "रद्द करें",
        "vote.session_expired": "सत्र समाप्त",
        "vote.session_expired_desc": "सुरक्षा कारणों से आपका मतदान सत्र समाप्त हो गया है। कृपया वोट देने के लिए दोबारा लॉगिन करें।",
        "vote.login_again": "दोबारा लॉगिन करें",
        "vote.not_recorded": "रिकॉर्ड नहीं किया गया",
        "vote.camera_off": "कैमरा बंद",

        // Receipt
        "receipt.title": "मतदान रसीद",
        "receipt.subtitle": "आपका वोट सुरक्षित रूप से दर्ज किया गया है",
        "receipt.id": "रसीद आईडी",
        "receipt.timestamp": "समय",
        "receipt.vote_hash": "वोट हैश",
        "receipt.merkle_root": "मर्कल रूट",
        "receipt.download": "PDF डाउनलोड करें",
        "receipt.copy": "कॉपी करें",
        "receipt.email_receipt": "रसीद ईमेल करें",
        "receipt.verify": "ऑडिट ट्रेल पर सत्यापित करें",
        "receipt.proud_voter": "मैं भारत का गर्वित मतदाता हूँ 🇮🇳",

        // Audit
        "audit.title": "सार्वजनिक ऑडिट ट्रेल",
        "audit.subtitle": "पारदर्शी और सत्यापन योग्य चुनाव रिकॉर्ड",
        "audit.total_votes": "कुल मत",
        "audit.turnout": "मतदान प्रतिशत",
        "audit.merkle_root": "मर्कल रूट",
        "audit.verify_receipt": "रसीद सत्यापित करें",
        "audit.verify_placeholder": "रसीद आईडी दर्ज करें",
        "audit.verify_button": "सत्यापित करें",

        // Complaints
        "complaints.title": "शिकायत दर्ज करें",
        "complaints.subtitle": "किसी भी चुनावी अनियमितता की रिपोर्ट करें",
        "complaints.category": "श्रेणी",
        "complaints.description": "विवरण",
        "complaints.email": "आपका ईमेल",
        "complaints.attachment": "संलग्नक (वैकल्पिक)",
        "complaints.submit": "शिकायत दर्ज करें",
        "complaints.track_title": "शिकायत ट्रैक करें",
        "complaints.track_placeholder": "शिकायत आईडी दर्ज करें",
        "complaints.track_button": "ट्रैक करें",

        // Common
        "common.loading": "लोड हो रहा है...",
        "common.error": "त्रुटि",
        "common.success": "सफल",
        "common.submit": "जमा करें",
        "common.cancel": "रद्द करें",
        "common.back": "वापस",
        "common.next": "अगला",
        "common.select": "चुनें",
    },
};

// ═══════════════════════════════════════════════════════
//  Language Context
// ═══════════════════════════════════════════════════════

type LanguageCode = "en" | "hi";

interface LanguageContextType {
    lang: LanguageCode;
    setLang: (code: LanguageCode) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: "en",
    setLang: () => { },
    t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<LanguageCode>(() => {
        const saved = sessionStorage.getItem("bharatvote-language");
        return (saved === "hi" ? "hi" : "en") as LanguageCode;
    });

    const setLang = (code: LanguageCode) => {
        setLangState(code);
        sessionStorage.setItem("bharatvote-language", code);
    };

    const t = (key: string): string => {
        return translations[lang]?.[key] || translations["en"]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
