import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Zap, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import type { BillingTier } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  currentTier: BillingTier;
  onClose: () => void;
  onUpgradeSuccess: (tier: 'pro_monthly' | 'pro_annual') => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  currentTier,
  onClose,
  onUpgradeSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    const selectedTier = billingCycle === 'annual' ? 'pro_annual' : 'pro_monthly';

    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier }),
      });

      const data = await res.json() as any;

      if (!res.ok) {
        throw new Error(data.error || 'Checkout session failed.');
      }

      // If Stripe Checkout URL returned, redirect to Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // If in sandbox / testing mode
      if (data.mockUpgraded) {
        onUpgradeSuccess(selectedTier);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Payment provider error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-prairie-100 dark:bg-prairie-900/60 text-prairie-800 dark:text-prairie-300 text-xs font-bold uppercase tracking-wider mb-2 border border-prairie-200 dark:border-prairie-700/50">
            <CreditCard className="w-3.5 h-3.5 text-prairie-600" />
            <span>Secure Stripe Billing</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Southwest Iowa Community Pro
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Free for individual residents. High-impact Pro tools for active landlords and local service contractors.
          </p>

          {/* Billing Cycle Switch */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              Monthly ($10/mo)
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 bg-prairie-600 rounded-full p-0.5 transition-colors relative"
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1 ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
              <span>Annual ($100/yr)</span>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 dark:border-emerald-700">
                Save $20/yr
              </span>
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Tier Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-850/50">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Free Community</h3>
                {currentTier === 'free' && (
                  <span className="bg-slate-200 dark:bg-slate-700 text-[10px] font-bold px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Ideal for individual residents posting a one-time room rental, yard sale, or small event.
              </p>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-prairie-600 dark:text-prairie-400 flex-shrink-0" />
                  <span><strong>1 active listing</strong> at a time</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-prairie-600 dark:text-prairie-400 flex-shrink-0" />
                  <span>Standard 30-day listing lifespan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-prairie-600 dark:text-prairie-400 flex-shrink-0" />
                  <span>Up to 3 photos (auto-compressed)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-prairie-600 dark:text-prairie-400 flex-shrink-0" />
                  <span>Direct Call & SMS inquiry buttons</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="block text-center text-xs font-semibold text-slate-400">
                Included with every registered account
              </span>
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className="border-2 border-prairie-500 rounded-3xl p-5 flex flex-col justify-between bg-prairie-50/20 dark:bg-prairie-950/20 relative shadow-lg">
            <div className="absolute -top-3 right-4 bg-prairie-600 text-white font-black text-[10px] tracking-wide uppercase px-2.5 py-0.5 rounded-full shadow">
              Stripe Verified
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-prairie-800 dark:text-prairie-300">Pro Landlord & Contractor</h3>
                {(currentTier === 'pro_monthly' || currentTier === 'pro_annual') && (
                  <span className="bg-prairie-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Active Plan
                  </span>
                )}
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                {billingCycle === 'annual' ? '$100' : '$10'}
                <span className="text-xs font-normal text-slate-500">
                  {billingCycle === 'annual' ? ' / year' : ' / month'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Built for active landlords managing multiple units, seasonal snow/lawn crews, and local contractors.
              </p>

              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span><strong>Unlimited active listings</strong> simultaneously</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span><strong>Gold "Featured" priority placement</strong> on top of town feeds</span>
                </li>
                <li className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span><strong>24/7 Emergency Dispatch Badge</strong> for snow, plumbing & HVAC</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span><strong>Verified Local Badge</strong> protecting against scam concerns</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-prairie-600 flex-shrink-0" />
                  <span>Up to 8 high-resolution photos per post</span>
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={loading}
                onClick={handleCheckout}
                className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-black py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to Stripe...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Checkout with Stripe ({billingCycle === 'annual' ? '$100/yr' : '$10/mo'})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
