import React, { useState } from 'react';
import { X, Mail, Lock, User, ShieldCheck, Sparkles, AlertCircle, KeyRound, Info } from 'lucide-react';
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
      const endpoint = mode === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'signin'
          ? { email: email.trim().toLowerCase(), password }
          : { name: name.trim(), email: email.trim().toLowerCase(), password, role: 'user' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      if (data.user) {
        if (data.token) {
          localStorage.setItem('sw_session_token', data.token);
        }
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        onSuccess(data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setMode('signin');
    setEmail('curtis@builtnetworks.com');
    setPassword('[REDACTED_PASSWORD_SEC]');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-11 h-11 bg-prairie-100 dark:bg-prairie-900/60 text-prairie-700 dark:text-prairie-300 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-prairie-200 dark:border-prairie-700/50">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {mode === 'signin' ? 'Sign In to Community Hub' : 'Create Your Community Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real authenticated edge access for Southwest Iowa residents, landlords, and contractors.
          </p>
        </div>

        {/* Administrator Default Credentials Info Banner */}
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Admin Account Provisioned</span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                User: <strong>curtis@builtnetworks.com</strong><br />
                Pass: <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded font-mono text-[10px]">[REDACTED_PASSWORD_SEC]</code>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="text-[11px] font-bold text-prairie-700 dark:text-prairie-300 hover:underline flex-shrink-0 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 shadow-sm"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name / Business Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe or Creston Rentals"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
            className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-black py-3 rounded-xl text-xs transition-colors min-h-[44px] shadow-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In Securely' : 'Create Free Account'}
          </button>
        </form>

        {/* Toggle sign in / register */}
        <div className="mt-4 text-center text-xs text-slate-500">
          {mode === 'signin' ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-bold text-prairie-700 dark:text-prairie-400 hover:underline"
              >
                Register free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-bold text-prairie-700 dark:text-prairie-400 hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
