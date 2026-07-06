import { useState, useEffect } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants";

export function FloatingActions() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all duration-300 hover:scale-110 hover:bg-foreground/90 ${
          showScrollTop ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>

      {/* WhatsApp CTA */}
      <a
        href={SOCIAL_LINKS.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#20b858]"
        aria-label="Chat via WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
