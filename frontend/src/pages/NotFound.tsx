import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import logo from "../assets/logo.png";
import { Instagram, Mail } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center max-w-md mx-auto px-4">
        {/* CrowdPay Logo */}
        <div className="mb-2">
          <img src={logo} alt="CrowdPay Logo" className="w-32 h-32 mx-auto object-contain" />
        </div>
        <h2 className="mb-8 text-3xl font-bold text-primary">CrowdPay</h2>

        <h1 className="mb-4 text-6xl font-extrabold text-primary">404</h1>
        <p className="mb-4 text-2xl font-bold text-muted-foreground">Oops! Something went wrong.</p>
        <p className="mb-8 text-lg text-muted-foreground">The page you are looking for does not exist or an error occurred.</p>

        <a href="/" className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-semibold shadow hover:bg-primary/90 transition-colors mb-8">
          Return to Home
        </a>

        {/* Social Media Links & Contact */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">or contact us on</p>
          <div className="flex items-center justify-center gap-6">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/crowd.pay"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5" />
              <span className="text-sm">Instagram</span>
            </a>

            {/* X (Twitter) */}
            <a
              href="https://x.com/crowdpay_ke"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Follow us on X"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-sm">X</span>
            </a>

            {/* Email */}
            <a
              href="mailto:crowdpay2026@gmail.com"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Email us"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm">Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
