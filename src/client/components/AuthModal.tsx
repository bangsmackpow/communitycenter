import React, { useState } from 'react';
import { X, Mail, Lock, User, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check if Curtis Admin email
      if (email.toLowerCase() === 'curtis@builtnetworks.com') {
        const adminUser: UserProfile = {
          id: 'admin-curtis',
          name: name || 'Curtis',
          email: 'curtis@builtnetworks.com',
          role: 'admin',
          tier: 'pro_annual',
        };
        localStorage.setItem('auth_user', JSON.stringify(adminUser));
        onSuccess(adminUser);
        onClose();
        return;
      }

      // Standard user / landlord
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'landlord',
        tier: 'free',
      };
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      onSuccess(newUser);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLoginCurtis = () => {
    const adminUser: UserProfile = {
      id: 'admin-curtis',
      name: 'Curtis',
      email: 'curtis@builtnetworks.com',
      role: 'admin',
      tier: 'pro_annual',
    };
    localStorage.setItem('auth_user', JSON.stringify(adminUser));
    onSuccess(adminUser);
    onClose();
  };

  const handleQuickLoginContractor = () => {
    const demoContractor: UserProfile = {
      id: 'user-contractor-1',
      name: 'Cornbelt Snow & Plowing',
      email: 'dispatch@cornbeltsnow.com',
      role: 'business',
      tier: 'pro_monthly',
    };
    localStorage.setItem('auth_user', JSON.stringify(demoContractor));
    onSuccess(demoContractor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative text-slate-800 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-11 h-11 bg-prairie-100 dark:bg-prairie-900/60 text-prairie-700 dark:text-prairie-300 rounded-xl flex items-center justify-center mx-auto mb-2 border border-prairie-200 dark:border-prairie-700/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'signin' ? 'Sign in to Southwest Iowa Hub' : 'Create Your Community Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Post rentals, list contractor services, and manage your community listings.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Social OAuth Buttons */}
        <div className="space-y-2 mb-4">
          <a
            href="/api/auth/sign-in/social?provider=google"
            onClick={(e) => {
              // For demonstration or immediate social mock if oauth keys pending
              const guestUser: UserProfile = {
                id: crypto.randomUUID(),
                name: 'Google Community User',
                email: 'google.user@gmail.com',
                role: 'user',
                tier: 'free',
              };
              localStorage.setItem('auth_user', JSON.stringify(guestUser));
              onSuccess(guestUser);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </a>

          <a
            href="/api/auth/sign-in/social?provider=facebook"
            onClick={(e) => {
              const guestUser: UserProfile = {
                id: crypto.randomUUID(),
                name: 'Facebook Community User',
                email: 'facebook.user@facebook.com',
                role: 'user',
                tier: 'free',
              };
              localStorage.setItem('auth_user', JSON.stringify(guestUser));
              onSuccess(guestUser);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[#1877F2] text-white rounded-xl text-xs font-semibold hover:bg-[#166fe5] transition-colors min-h-[44px]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>Continue with Facebook</span>
          </a>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white dark:bg-slate-900 text-slate-400">or with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name / Business Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe or Creston Property Mgmt"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors min-h-[44px] shadow-sm"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle sign in / register */}
        <div className="mt-3 text-center text-xs text-slate-500">
          {mode === 'signin' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-semibold text-prairie-600 dark:text-prairie-400 hover:underline"
              >
                Register now
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-semibold text-prairie-600 dark:text-prairie-400 hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {/* One-Click Fast Roles (For Instant Testing) */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
            Quick Sign-In Switchers
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickLoginCurtis}
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 flex items-center justify-center gap-1 min-h-[36px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curtis (Admin)</span>
            </button>
            <button
              type="button"
              onClick={handleQuickLoginContractor}
              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 min-h-[36px]"
            >
              <span>Demo Contractor (Pro)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
