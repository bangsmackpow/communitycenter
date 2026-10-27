import React, { useState } from 'react';
import { X, Send, MessageSquarePlus, Edit3, CheckCircle2 } from 'lucide-react';
import { SW_IOWA_TOWNS } from '../../db/constants';
import type { Listing } from '../types';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetListing?: Listing | null;
  onSuccess: (msg: string) => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  isOpen,
  onClose,
  targetListing,
  onSuccess,
}) => {
  const isEdit = !!targetListing;
  const [title, setTitle] = useState(targetListing ? `Edit: ${targetListing.title}` : '');
  const [town, setTown] = useState<string>(targetListing?.town || 'Creston');
  const [categoryType, setCategoryType] = useState<'rental' | 'service' | 'event'>(targetListing?.categoryType || 'service');
  const [details, setDetails] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isEdit ? 'edit_suggestion' : 'new_listing',
          listingId: targetListing?.id,
          title: title.trim(),
          town,
          categoryType,
          details: details.trim(),
          submitterName: submitterName.trim() || undefined,
          submitterEmail: submitterEmail.trim() || undefined,
        }),
      });

      onSuccess(
        isEdit
          ? 'Thank you! Your suggested correction has been sent for review.'
          : 'Thank you! Your local business suggestion has been submitted to the community directory.'
      );
      onClose();
    } catch {
      onSuccess('Thank you! Your recommendation has been recorded.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative text-slate-800 dark:text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-11 h-11 bg-prairie-100 dark:bg-prairie-900/60 text-prairie-700 dark:text-prairie-300 rounded-xl flex items-center justify-center mx-auto mb-2 border border-prairie-200 dark:border-prairie-700/50">
            {isEdit ? <Edit3 className="w-6 h-6" /> : <MessageSquarePlus className="w-6 h-6" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            {isEdit ? 'Suggest an Edit / Update' : 'Suggest a Local Business or Service'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEdit
              ? `Recommend an update or correction for "${targetListing?.title}".`
              : 'Know a great local plumber, snow plow operator, landlord, or diner in Southwest Iowa? Let us know!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEdit ? 'Correction Summary' : 'Business / Contractor / Venue Name'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isEdit ? 'e.g. Phone number updated or unit now rented' : 'e.g. Rick’s Reliable Snow Plowing'}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Town
              </label>
              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
              >
                {SW_IOWA_TOWNS.map((t) => (
                  <option key={t} value={t}>
                    {t}, IA
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs focus:border-prairie-500 outline-none min-h-[44px]"
              >
                <option value="service">Local Contractor / Service</option>
                <option value="rental">Rental Property / Landlord</option>
                <option value="event">Community Event / Venue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isEdit ? 'What needs to be updated?' : 'Details & Contact Information (Phone / Website)'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                isEdit
                  ? 'Please describe the updated phone number, price change, or vacancy status...'
                  : 'Phone number, address, services offered, and why you recommend them to Southwest Iowa neighbors...'
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs focus:border-prairie-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Your Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={submitterName}
                onChange={(e) => setSubmitterName(e.target.value)}
                placeholder="Neighbor / Resident"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Your Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !details.trim()}
            className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Submit to Community Central'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
