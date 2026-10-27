import React, { useState } from 'react';
import { Shield, Home, Wrench, X, Scale, FileText } from 'lucide-react';
import { SW_IOWA_TOWNS } from '../../db/constants';

interface FooterProps {
  onSelectTown: (town: string) => void;
  onOpenPricing: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTown, onOpenPricing }) => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'housing' | 'contractor' | null>(null);

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top: Branding & Iowa Coverage */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-prairie-600 text-white flex items-center justify-center font-black text-sm">
                IA
              </div>
              <div>
                <span className="text-white font-bold text-sm block">Southwest Iowa Community Central</span>
                <span className="text-[11px] text-prairie-400">Independent Local Directory & Housing Exchange</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
              Connecting rural neighbors, property managers, and independent contractors across Union, Adams, Adair, Clarke, Montgomery, Page, and Ringgold counties. Free for local residents; powered by edge infrastructure.
            </p>
          </div>

          <div>
            <h3 className="text-slate-200 font-bold mb-2.5">Towns & Communities</h3>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              {SW_IOWA_TOWNS.slice(0, 8).map((town) => (
                <button
                  key={town}
                  onClick={() => onSelectTown(town)}
                  className="text-left hover:text-prairie-400 py-0.5 transition-colors"
                >
                  {town}, IA
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-slate-200 font-bold mb-2.5">Legal & Disclaimers</h3>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  onClick={() => setLegalModal('housing')}
                  className="hover:text-prairie-400 flex items-center gap-1.5 text-left"
                >
                  <Home className="w-3.5 h-3.5 text-prairie-500" />
                  <span>Equal Housing Opportunity</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalModal('contractor')}
                  className="hover:text-prairie-400 flex items-center gap-1.5 text-left"
                >
                  <Wrench className="w-3.5 h-3.5 text-prairie-500" />
                  <span>Contractor Disclaimer</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalModal('terms')}
                  className="hover:text-prairie-400 flex items-center gap-1.5 text-left"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalModal('privacy')}
                  className="hover:text-prairie-400 flex items-center gap-1.5 text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Privacy Policy</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Federal Equal Housing Opportunity & Small Business Banner */}
        <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-prairie-400 font-black text-xs">
              ⌂ EQUAL HOUSING
            </span>
            <p className="text-slate-400 leading-snug">
              All housing advertised herein is subject to the federal <strong>Fair Housing Act</strong> which makes it illegal to advertise any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, or national origin.
            </p>
          </div>
          <button
            onClick={onOpenPricing}
            className="text-prairie-400 font-bold hover:underline flex-shrink-0"
          >
            Advertise / Pro Listing →
          </button>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <p>© {new Date().getFullYear()} Built Networks LLC. Built for Southwest Iowa communities.</p>
          <p>Protected by Cloudflare Edge & D1 SQLite Encryption.</p>
        </div>
      </div>

      {/* Legal Dialog Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-200 my-6">
            <button
              onClick={() => setLegalModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {legalModal === 'housing' && (
              <div>
                <div className="flex items-center gap-2 text-prairie-400 mb-2">
                  <Home className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Equal Housing Opportunity Policy</h3>
                </div>
                <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed mt-3">
                  <p>
                    Southwest Iowa Community Central is committed to ensuring that all rental and real estate listings published on our directory comply with the Federal Fair Housing Act (Title VIII of the Civil Rights Act of 1968, as amended) and the Iowa Civil Rights Act (Iowa Code Chapter 216).
                  </p>
                  <p>
                    We do not knowingly accept or publish advertising for real estate or rental housing that states or implies any preference, limitation, or discrimination based on race, color, religion, sex, handicap, familial status, national origin, sexual orientation, or gender identity.
                  </p>
                  <p>
                    All persons are hereby informed that all dwellings advertised are available on an equal opportunity basis. To report discriminatory housing advertising, use the "Report Listing" flag or contact the U.S. Department of Housing and Urban Development (HUD) at 1-800-669-9777.
                  </p>
                </div>
              </div>
            )}

            {legalModal === 'contractor' && (
              <div>
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <Wrench className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Independent Contractor Disclaimer</h3>
                </div>
                <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed mt-3">
                  <p>
                    Service providers, tradespeople, mechanics, snow plowers, and contractors listed on this platform are independent third parties and are not employees, agents, or joint venturers of Southwest Iowa Community Central or Built Networks LLC.
                  </p>
                  <p>
                    While we allow contractors to indicate whether they carry commercial liability insurance or provide free estimates, we do not verify license numbers, bond status, or insurance policies.
                  </p>
                  <p>
                    Property owners and homeowners are strongly encouraged to independently verify references, request a Certificate of Insurance (COI), and review written estimates before engaging any contractor or authorizing work on their premises.
                  </p>
                </div>
              </div>
            )}

            {legalModal === 'terms' && (
              <div>
                <div className="flex items-center gap-2 text-prairie-400 mb-2">
                  <Scale className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Terms of Service</h3>
                </div>
                <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed mt-3">
                  <p>
                    By accessing or submitting content to Southwest Iowa Community Central, you agree not to submit fraudulent rental postings, spam, defamatory content, or violate any applicable municipal, state, or federal laws.
                  </p>
                  <p>
                    We reserve the right to remove or moderate any listing flagged for scam indicators, outdated availability, or abusive conduct without prior notice.
                  </p>
                  <p>
                    Free tier users are entitled to 1 active listing at any time. Pro subscriptions are billed at $10/month or $100/year and can be cancelled anytime via the Stripe billing portal.
                  </p>
                </div>
              </div>
            )}

            {legalModal === 'privacy' && (
              <div>
                <div className="flex items-center gap-2 text-prairie-400 mb-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">Privacy Policy</h3>
                </div>
                <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed mt-3">
                  <p>
                    We respect the privacy of Southwest Iowa residents. Contact phone numbers and email addresses submitted on public listings are made available solely to facilitate inquiries from local community members.
                  </p>
                  <p>
                    We do not sell, rent, or trade your personal information to third-party data brokers or marketing lists.
                  </p>
                  <p>
                    Authentication sessions are secured using encrypted HTTP-only cookies and Cloudflare edge encryption.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setLegalModal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-xl min-h-[40px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
