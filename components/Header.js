"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import config from "@/config";
import { motion } from "framer-motion";

const links = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Reviews" },
  { href: "/#faq", label: "FAQ" }
];

const Header = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { session, loading } = useAuth();
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('Error signing out:', error.message);
  };

  if (loading) {
    return <header className="bg-gradient-to-r from-primary to-accent"><div className="container mx-auto px-8 py-4 text-white">Loading...</div></header>;
  }

  const AuthButtons = () => (
    session ? (
      <>
        <Link href="/profile" className="btn btn-ghost text-white mr-2 hover:bg-white hover:text-primary transition-colors duration-300">User Profile</Link>
        <Link href="/buy-tokens" className="btn btn-secondary mr-2 hover:bg-white hover:text-accent transition-colors duration-300">Buy Tokens</Link>
        <button onClick={handleSignOut} className="btn btn-ghost text-white hover:bg-white hover:text-primary transition-colors duration-300">Log out</button>
      </>
    ) : (
      <>
        <Link href="/login" className="btn btn-ghost text-white mr-2 hover:bg-white hover:text-primary transition-colors duration-300">Log in</Link>
        <Link href="/register" className="btn btn-secondary mr-2 hover:bg-white hover:text-accent transition-colors duration-300">Register</Link>
        <Link href="/buy-tokens" className="btn btn-primary hover:bg-white hover:text-primary transition-colors duration-300">Buy Tokens</Link>
      </>
    )
  );

  return (
    <motion.header 
      className="bg-gradient-to-r from-primary to-accent"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="container flex items-center justify-between px-8 py-4 mx-auto" aria-label="Global">
        <motion.div 
          className="flex lg:flex-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link className="flex items-center gap-2 shrink-0" href="/" title={`${config.appName} homepage`}>
            <span className="font-extrabold text-lg text-white">{config.appName}</span>
          </Link>
        </motion.div>
        
        <div className="flex lg:hidden">
          <button type="button" className="text-white" onClick={() => setIsOpen(!isOpen)}>
            <span className="sr-only">{isOpen ? 'Close main menu' : 'Open main menu'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
            </svg>
          </button>
        </div>

        <div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          {links.map((link) => (
            <motion.div
              key={link.href}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link href={link.href} className="text-white hover:text-secondary transition-colors duration-300" title={link.label}>
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="hidden lg:flex lg:justify-end lg:flex-1">
          <AuthButtons />
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lg:hidden ${isOpen ? "block" : "hidden"}`}>
        <div className="px-8 py-4 space-y-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block text-white hover:text-secondary transition-colors duration-300" title={link.label}>
              {link.label}
            </Link>
          ))}
          <div className="pt-4">
            <AuthButtons />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
