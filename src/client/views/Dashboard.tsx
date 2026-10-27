import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  PlusCircle,
  Home,
  Wrench,
  Calendar,
  Sparkles,
  Shield,
  Zap,
  MessageSquarePlus,
  Check,
  X,
  Users,
  KeyRound,
  Mail,
  Loader2,
  Gift,
} from 'lucide-react';
import type { Listing, UserProfile, Suggestion } from '../types';

interface DashboardProps {
  listings: Listing[];
  currentUser: UserProfile;
  initialTab?: 'my' | 'admin_all' | 'suggestions' | 'users';
  onBack: () => void;
  onOpenCreate: () => void;
  onOpenPricing: () => void;
  onToggleRented: (listingId: string, currentStatus: string) => Promise<void>;
  onDelete: (listingId: string) => Promise<void>;
  onSelectListing: (listing: Listing) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  listings,
  currentUser,
  initialTab,
  onBack,
  onOpenCreate,
  onOpenPricing,
  onToggleRented,
  onDelete,
  onSelectListing,
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'admin_all' | 'suggestions' | 'users'>(
    initialTab || 'my'
  );
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'rented'>('all');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Admin user management state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<any | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isPro = currentUser.tier === 'pro_monthly' || currentUser.tier === 'pro_annual';

  const displayedListings = listings.filter((l) => {
    if (activeTab === 'my') {
      if (l.userId !== currentUser.id && !isAdmin) return false;
    }
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    return true;
  });

  const myActiveCount = listings.filter((l) => l.userId === currentUser.id && l.status === 'active').length;

  // Load suggestions
  useEffect(() => {
    if (isAdmin && activeTab === 'suggestions') {
      setLoadingSuggestions(true);
      fetch('/api/suggestions')
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.suggestions) setSuggestions(data.suggestions);
        })
        .catch(() => {})
        .finally(() => setLoadingSuggestions(false));
    }
  }, [isAdmin, activeTab]);

  // Load users for admin management
  const fetchAdminUsers = () => {
    if (isAdmin) {
      setLoadingUsers(true);
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data: any) => {
          if (data?.users) setAdminUsers(data.users);
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      fetchAdminUsers();
    }
  }, [isAdmin, activeTab]);

  const handleUpdateSuggestionStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    } catch {
      setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    }
  };

  // Admin: Grant Pro License
  const handleGrantPro = async (userId: string, userEmail: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro_annual', durationDays: 365 }),
      });
      const data = await res.json() as any;
      if (res.ok) {
        setAdminFeedback(`Granted 1-Year Pro Testing License to ${userEmail}!`);
        fetchAdminUsers();
      } else {
        setAdminFeedback(data.error || 'Failed to grant license');
      }
    } catch {
      setAdminFeedback('Error granting license');
    }
    setTimeout(() => setAdminFeedback(null), 4000);
  };

  // Admin: Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordReset || !newPasswordInput.trim()) return;

    setResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUserForPasswordReset.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPasswordInput.trim() }),
      });
      const data = await res.json() as any;
      if (res.ok) {
        setAdminFeedback(`Password reset successfully for ${selectedUserForPasswordReset.email}`);
        setSelectedUserForPasswordReset(null);
        setNewPasswordInput('');
      } else {
        setAdminFeedback(data.error || 'Failed to reset password');
      }
    } catch {
      setAdminFeedback('Error resetting password');
    } finally {
      setResettingPassword(false);
      setTimeout(() => setAdminFeedback(null), 4000);
    }
  };

  const filteredAdminUsers = adminUsers.filter((u) => {
    if (!searchUserQuery) return true;
    const q = searchUserQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 pt-3 px-3 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="bg-prairie-600 hover:bg-prairie-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 min-h-[44px] shadow-sm"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Post New Listing</span>
        </button>
      </div>

      {adminFeedback && (
        <div className="mb-4 p-3 bg-prairie-100 dark:bg-prairie-900/60 border border-prairie-300 dark:border-prairie-700 rounded-2xl text-xs font-bold text-prairie-900 dark:text-prairie-200 animate-fade-in flex items-center gap-2">
          <span>✓ {adminFeedback}</span>
        </div>
      )}

      {/* Account & Tier Banner */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              {isAdmin && (
                <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                  ADMINISTRATOR
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  isPro
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                }`}
              >
                {isPro ? '⭐ Pro Tier ($10/mo)' : 'Free Tier'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentUser.email} • {isPro ? 'Unlimited active listings & featured placement' : `Active listings: ${myActiveCount}/1 (Free Tier Limit)`}
            </p>
          </div>

          {!isPro && (
            <button
              onClick={onOpenPricing}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 min-h-[44px]"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Upgrade to Pro ($10/mo)</span>
            </button>
          )}
        </div>

        {/* Dashboard Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[38px] transition-colors ${
              activeTab === 'my'
                ? 'bg-prairie-600 text-white'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
            }`}
          >
            My Postings
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin_all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[38px] transition-colors ${
                  activeTab === 'admin_all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                All Directory Postings ({listings.length})
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[38px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'users'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Management & Licenses</span>
              </button>

              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[38px] transition-colors flex items-center gap-1.5 ${
                  activeTab === 'suggestions'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                }`}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Suggestions</span>
              </button>
            </>
          )}

          {activeTab === 'my' || activeTab === 'admin_all' ? (
            <div className="ml-auto flex items-center gap-1.5">
              {(['all', 'active', 'rented'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize min-h-[32px] ${
                    filterStatus === s
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* TAB: USER MANAGEMENT & PRO LICENSING (ADMIN ONLY) */}
      {isAdmin && activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Platform Users & Pro Licenses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reset passwords, update credentials, and grant Pro licenses to testers.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs focus:border-prairie-500 outline-none min-h-[40px]"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-prairie-600" />
              <span>Loading user database from Cloudflare D1...</span>
            </div>
          ) : filteredAdminUsers.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No matching users found.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAdminUsers.map((u) => {
                const userIsPro = u.tier === 'pro_annual' || u.tier === 'pro_monthly';
                return (
                  <div
                    key={u.id}
                    className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm text-slate-900 dark:text-slate-100"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black px-1.5 py-0.2 rounded">
                            ADMIN
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            userIsPro
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {userIsPro ? 'PRO TIER' : 'FREE TIER'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {u.email} • Role: <strong className="capitalize">{u.role}</strong>
                      </p>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-2">
                      {/* Grant Pro License */}
                      {!userIsPro ? (
                        <button
                          type="button"
                          onClick={() => handleGrantPro(u.id, u.email)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 min-h-[38px] transition-colors shadow-sm"
                          title="Grant 1-Year Pro Testing License"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>Grant Pro License</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          ✓ Pro Licensed
                        </span>
                      )}

                      {/* Reset Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserForPasswordReset(u);
                          setNewPasswordInput('');
                        }}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 min-h-[38px] transition-colors border border-slate-300 dark:border-slate-600"
                        title="Reset User Password"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-prairie-600" />
                        <span>Reset Pass</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reset Password Modal */}
          {selectedUserForPasswordReset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl relative text-slate-800 dark:text-slate-100">
                <button
                  onClick={() => setSelectedUserForPasswordReset(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-black">Reset Password for User</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  User: <strong>{selectedUserForPasswordReset.email}</strong>
                </p>

                <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      New Password (min 6 characters)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter new password..."
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={resettingPassword || newPasswordInput.length < 6}
                      className="flex-1 bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-2.5 rounded-xl text-xs min-h-[44px] transition-colors disabled:opacity-50"
                    >
                      {resettingPassword ? 'Updating...' : 'Save New Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUserForPasswordReset(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 min-h-[44px]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: SUGGESTIONS VIEW */}
      {isAdmin && activeTab === 'suggestions' && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">
            Pending Recommendations & Edit Suggestions
          </h2>
          {loadingSuggestions ? (
            <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-prairie-600" />
              <span>Loading suggestions from D1...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No pending community suggestions.
            </div>
          ) : (
            suggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-900 dark:text-slate-100"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-prairie-100 dark:bg-prairie-900 text-prairie-800 dark:text-prairie-200">
                      {sug.type === 'new_listing' ? 'New Business' : 'Edit Request'}
                    </span>
                    <span className="text-xs font-bold">
                      {sug.title} {sug.town && `(${sug.town}, IA)`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sug.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      sug.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sug.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {sug.details}
                  </p>
                  {(sug.submitterName || sug.submitterEmail) && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Submitted by: {sug.submitterName || 'Neighbor'} ({sug.submitterEmail || 'No email'})
                    </span>
                  )}
                </div>

                {sug.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateSuggestionStatus(sug.id, 'approved')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 min-h-[38px]"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleUpdateSuggestionStatus(sug.id, 'rejected')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 min-h-[38px]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: LISTINGS VIEW */}
      {(activeTab === 'my' || activeTab === 'admin_all') && (
        <div className="space-y-3">
          {displayedListings.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No listings found in this filter.</p>
              <button
                onClick={onOpenCreate}
                className="mt-3 text-xs font-bold text-prairie-600 dark:text-prairie-400 hover:underline"
              >
                Post your first listing now →
              </button>
            </div>
          ) : (
            displayedListings.map((item) => {
              const isRented = item.status === 'rented';
              const primaryImg = item.media?.[0]?.url;

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-slate-900 dark:text-slate-100"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer flex-1"
                    onClick={() => onSelectListing(item)}
                  >
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
                        {item.categoryType === 'rental' && <Home className="w-6 h-6" />}
                        {item.categoryType === 'service' && <Wrench className="w-6 h-6" />}
                        {item.categoryType === 'event' && <Calendar className="w-6 h-6" />}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-prairie-700 dark:text-prairie-400">
                          {item.town}, IA
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            isRented
                              ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200'
                              : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60'
                          }`}
                        >
                          {isRented ? 'Rented' : 'Active'}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm mt-0.5 line-clamp-1 hover:text-prairie-600">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.priceCents ? `$${(item.priceCents / 100).toLocaleString()}` : 'Free / Contact'}
                        {' • '}Expires {new Date(item.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => onToggleRented(item.id, item.status)}
                      className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] transition-colors ${
                        isRented
                          ? 'bg-prairie-600 hover:bg-prairie-500 text-white'
                          : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 hover:bg-amber-200'
                      }`}
                    >
                      {isRented ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Mark Rented</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onSelectListing(item)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="View public listing"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-750 hover:bg-rose-600 hover:text-white text-rose-600 dark:text-rose-300 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                      title="Archive listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
