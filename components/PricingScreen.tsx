import React from 'react';
import type { User } from '../types';

interface PricingScreenProps {
  user: User;
  onBack: () => void;
}

const CheckIcon = () => (
    <svg className="h-6 w-6 flex-shrink-0 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const PricingScreen: React.FC<PricingScreenProps> = ({ user, onBack }) => {

  const handleUpgradeClick = (tier: string) => {
    alert(`Initiating checkout process for the ${tier} plan. A backend integration with a payment provider like Stripe would handle this in a real application.`);
  };

  const handleContactClick = () => {
    alert("Redirecting to a contact form or sales email. This would be a real link in a production app.");
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen antialiased">
      <header className="p-4 flex justify-between items-center">
         <div className="flex items-center">
            <svg
              className="h-8 w-auto text-brand-primary"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
            </svg>
            <span className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">Calert</span>
        </div>
        <button onClick={onBack} className="text-sm font-semibold text-gray-700 hover:text-brand-primary">
            &larr; Back to Dashboard
        </button>
      </header>
      
      <main className="mx-auto max-w-5xl px-4 pt-12 pb-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">Find the right plan for you</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
            Start free, and unlock more powerful features as you grow.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Free Tier */}
          <div className="border border-gray-200 rounded-2xl p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Free</h3>
            <p className="mt-4 text-gray-500">For personal use and getting started with assertive alerts.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-base font-medium text-gray-500">/ month</span>
            </div>
            <ul role="list" className="mt-8 space-y-4 flex-grow">
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Monitor 1 Google Calendar</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Full-screen event alerts</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">5 AI Event Briefings per month</span></li>
            </ul>
            <button disabled className="mt-8 w-full rounded-lg bg-gray-200 py-3 px-6 text-base font-medium text-gray-500 cursor-not-allowed">
              Your Current Plan
            </button>
          </div>

          {/* Pro Tier (Most Popular) */}
          <div className="relative border-2 border-brand-primary rounded-2xl p-8 flex flex-col shadow-2xl shadow-indigo-200">
             <div className="absolute top-0 -translate-y-1/2 transform">
                <span className="inline-flex items-center rounded-full bg-brand-primary px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
            <p className="mt-4 text-gray-500">For power users who need more calendars and unlimited AI.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900">$5</span>
              <span className="text-base font-medium text-gray-500">/ month</span>
            </div>
            <ul role="list" className="mt-8 space-y-4 flex-grow">
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Monitor up to 5 Google Calendars</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Unlimited AI Event Briefings</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Customizable alert themes</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Snooze alert functionality</span></li>
               <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Priority email support</span></li>
            </ul>
            <button onClick={() => handleUpgradeClick('Pro')} className="mt-8 w-full rounded-lg bg-brand-primary py-3 px-6 text-base font-medium text-white shadow-md transition-colors hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-dark focus:ring-offset-2">
              Upgrade to Pro
            </button>
          </div>

          {/* Teams Tier */}
          <div className="border border-gray-200 rounded-2xl p-8 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
            <p className="mt-4 text-gray-500">For businesses that need centralized management and billing.</p>
            <div className="mt-6">
              <span className="text-4xl font-bold text-gray-900">$15</span>
              <span className="text-base font-medium text-gray-500">/ user / month</span>
            </div>
            <ul role="list" className="mt-8 space-y-4 flex-grow">
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Everything in Pro</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Unlimited calendars</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Admin dashboard</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Centralized billing</span></li>
              <li className="flex items-start"><CheckIcon /><span className="ml-3 text-gray-700">Dedicated account manager</span></li>
            </ul>
            <button onClick={handleContactClick} className="mt-8 w-full rounded-lg bg-gray-800 py-3 px-6 text-base font-medium text-white shadow-md transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
              Contact Sales
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PricingScreen;