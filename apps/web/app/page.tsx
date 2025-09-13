'use client';

import dynamic from 'next/dynamic';

const Homepage = dynamic(() =>
  import('@ui/plasmic-components/Homepage'), { ssr: false }
);

export default function Home() {
  return <Homepage />;
}
