import { Suspense } from 'react'
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <main>
        <Hero />
      </main>
    </>
  );
}