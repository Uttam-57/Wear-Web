// src/shared/ui/atoms/Icon/Icon.jsx
import { cn } from '@/shared/utils/cn';

export const Icon = ({ name, className, ...props }) => {
  const baseClass = cn("w-5 h-5 fill-current", className);

  switch (name) {
    case 'eye':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)} {...props}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'eye-off':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("w-5 h-5", className)} {...props}>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      );
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} {...props}>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 24 24" className={baseClass} {...props}>
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.172 14.853c-.87.037-1.761-.51-2.65-.51-.89 0-1.782.548-2.651.51-1.716-.08-3.415-1.393-4.305-3.003-1.802-3.255-1.547-7.24.238-9.055.885-.898 2.072-1.472 3.313-1.472.848 0 1.654.298 2.378.69.723-.392 1.53-.69 2.378-.69 1.24 0 2.428.574 3.312 1.472 1.785 1.815 2.04 5.8.238 9.055-.89 1.61-2.589 2.923-4.305 3.003h.054zM14.6 6.32c-.08 1.13-.67 2.15-1.52 2.8-.82.63-1.9.98-2.98.98-.07-1.13.52-2.15 1.37-2.8.85-.63 1.93-.98 3.01-.98h.12z" />
        </svg>
      );
    default:
      return null;
  }
};