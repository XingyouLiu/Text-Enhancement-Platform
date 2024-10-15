'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from 'next/dynamic';

const MotionDiv = dynamic(() => import('framer-motion').then((mod) => mod.motion.div), { ssr: false });
const MotionH1 = dynamic(() => import('framer-motion').then((mod) => mod.motion.h1), { ssr: false });
const MotionP = dynamic(() => import('framer-motion').then((mod) => mod.motion.p), { ssr: false });

const Hero = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary to-accent min-h-screen flex items-center justify-center">
      <div className="absolute inset-0 bg-grid-white/[0.2] bg-grid-8 [mask-image:linear-gradient(to_bottom,white,rgba(255,255,255,0.1))] pointer-events-none" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        {isClient ? (
          <>
            <MotionH1 
              className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-8"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Text Enhancement
            </MotionH1>
            <MotionP 
              className="mt-6 text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Transform your text with AI-powered enhancements. Elevate your writing to new heights.
            </MotionP>
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Link href="/input" className="btn btn-secondary btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
                Start Enhancing
              </Link>
            </MotionDiv>
          </>
        ) : (
          <>
            <h1 className="font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-white mb-8">
              Text Enhancement
            </h1>
            <p className="mt-6 text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-12">
              Transform your text with AI-powered enhancements. Elevate your writing to new heights.
            </p>
            <div>
              <Link href="/input" className="btn btn-secondary btn-lg text-lg px-8 py-3 rounded-full hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">
                Start Enhancing
              </Link>
            </div>
          </>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-base-100 to-transparent" />
    </section>
  );
};

export default Hero;
