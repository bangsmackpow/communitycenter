import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const ScamWarningBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 text-amber-200 text-xs my-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300 text-sm">
              Southwest Iowa Rental Safety Alert: Avoid Scams
            </p>
            <p className="text-amber-200/90 mt-0.5 leading-relaxed">
              Never wire money, send Zelle/Venmo, or pay a security deposit before touring the unit inside and meeting in person.
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-400 hover:text-amber-300 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
          aria-label={expanded ? 'Collapse tips' : 'Expand tips'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-600/30 text-xs space-y-1.5 text-amber-200/90 pl-7">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Verify local county parcel records (Union, Adams, Clarke, Montgomery GIS).</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Legitimate local landlords will never demand gift cards or out-of-state wire transfers.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>If a rental price seems too good to be true for the town, proceed with caution.</span>
          </div>
        </div>
      )}
    </div>
  );
};
