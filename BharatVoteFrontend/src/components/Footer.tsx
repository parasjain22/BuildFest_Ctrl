import { Link } from "react-router-dom";
import { Phone, Mail, Clock, MapPin, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* Tricolor Top Border */}
      <div className="h-1 bg-gradient-to-r from-india-saffron via-india-white to-india-green" />

      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4 tricolor-underline inline-block">
              BharatVote
            </h3>
            <p className="text-background/70 text-sm leading-relaxed mt-6">
              A secure, anonymous digital voting system inspired by the Election Commission of India. 
              Ensuring transparency, trust, and the sanctity of every vote.
            </p>
            <p className="text-background/50 text-xs mt-4">
              🔒 End-to-end encrypted | Zero-knowledge proofs
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { path: "/", label: "Home" },
                { path: "/register", label: "Voter Registration" },
                { path: "/vote", label: "Cast Your Vote" },
                { path: "/audit", label: "Public Audit" },
                { path: "/complaints", label: "Complaints & Helpdesk" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-background/70 hover:text-primary transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Helpdesk */}
          <div>
            <h3 className="text-lg font-bold mb-4">Helpdesk</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="w-4 h-4 text-primary" />
                <span>1950 (Toll Free)</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="w-4 h-4 text-primary" />
                <span>helpdesk@eci.gov.in</span>
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Clock className="w-4 h-4 text-primary" />
                <span>10 AM – 5 PM (Mon-Sat)</span>
              </li>
              <li className="flex items-start gap-3 text-background/70">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>Election Commission of India, Nirvachan Sadan, New Delhi</span>
              </li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Official Resources</h3>
            <ul className="space-y-2 text-sm">
              {[
                { url: "https://eci.gov.in", label: "Election Commission of India" },
                { url: "https://nvsp.in", label: "National Voter Service Portal" },
                { url: "https://voterportal.eci.gov.in", label: "Voter Portal" },
              ].map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/70 hover:text-primary transition-colors inline-flex items-center gap-2 group"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-background/40 text-xs mt-4 italic">
              * This is a demo project for educational purposes
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/50 text-sm text-center md:text-left">
            © 2024 BharatVote Demo. Built with 🇮🇳 for India's Democracy.
          </p>
          <div className="flex items-center gap-4 text-sm text-background/50">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <span>•</span>
            <Link to="/accessibility" className="hover:text-primary transition-colors">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
