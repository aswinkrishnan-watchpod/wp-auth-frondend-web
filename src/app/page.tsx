'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to email signup by default
    // In the future, you can show an auth selection page here
    router.push('/auth/email-signup');
  }, [router]);

  return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-t-[#FF9E80] border-gray-700 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    </div>
  );
}
