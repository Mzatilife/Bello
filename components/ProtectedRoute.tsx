import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AuthPrompt from './AuthPrompt';

interface ProtectedRouteProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: 'user' | 'lock' | 'cart' | 'sell';
  redirectTo?: string;
  showPrompt?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  title = "Authentication Required",
  description = "You need to be logged in to access this feature.",
  icon = "lock",
  redirectTo,
  showPrompt = true
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && redirectTo) {
      router.replace(redirectTo as any);
    }
  }, [user, loading, redirectTo]);

  // Still loading
  if (loading) {
    return null;
  }

  // User not authenticated
  if (!user) {
    if (showPrompt) {
      return (
        <AuthPrompt
          title={title}
          description={description}
          icon={icon}
        />
      );
    }
    return null;
  }

  // User authenticated, render children
  return <>{children}</>;
}
