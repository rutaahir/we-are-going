import { Logo } from "./Navbar";
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

export default function Footer() {
  return (
    <footer className="bg-sand border-t border-warm mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <Logo />
          <p className="text-sm text-warm-muted mt-4 max-w-xs">Connecting India's samaj communities digitally — from the village panchayat to the global diaspora.</p>
          <div className="flex gap-2 mt-5">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full bg-surface border border-warm flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition"><Icon className="w-4 h-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-ui font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-warm-muted">
            {["Home", "Communities", "Directory", "Events", "Jobs", "Matrimony"].map(l => <li key={l}><Link to={`/${l === "Home" ? "" : l.toLowerCase()}` as any} className="hover:text-primary">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-ui font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm text-warm-muted">
            {["About Us", "Pricing", "Help Center", "Privacy Policy", "Terms of Service", "Blog"].map(l => <li key={l}><a href="#" className="hover:text-primary">{l}</a></li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-ui font-semibold mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-warm-muted">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 text-gold" />Rajula, Amreli, Gujarat 365560</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gold" />+91 98240 12345</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-gold" />hello@wearegoing.in</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-warm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-warm-muted">
          <div>© 2026 We Are Going. All rights reserved.</div>
          <div>Made with <span className="text-red-500">♥</span> for Indian communities</div>
        </div>
      </div>
    </footer>
  );
}
