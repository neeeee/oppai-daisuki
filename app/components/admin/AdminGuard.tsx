'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();

  useEffect(() => {
    const checkHost = () => {
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
      const allowAdminOnMainSite = process.env.NEXT_PUBLIC_ALLOW_ADMIN_ON_MAIN_SITE === 'true';
      
      if (adminUrl && !allowAdminOnMainSite) {
        const currentHost = window.location.host;
        const adminHost = new URL(adminUrl).host;
        
        if (currentHost !== adminHost) {
          // Redirect to admin URL
          const adminUrlWithPath = `${adminUrl}${window.location.pathname}${window.location.search}`;
          window.location.href = adminUrlWithPath;
          return;
        }
      }
    };

    checkHost();
  }, [router]);

  return <>{children}</>;
}
