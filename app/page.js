import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
        <div className="flex justify-center mt-4">
          <Link href="/input" className="btn btn-accent">
            Start to Input
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}