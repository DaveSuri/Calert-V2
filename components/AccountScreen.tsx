import React from 'react';
import type { User } from '../types';

interface AccountScreenProps {
  user: User;
  onBack: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ user, onBack }) => {
  const tierInfo = {
    free: { label: 'Free Plan', description: 'Basic access to Calert features.' },
    pro: { label: 'Pro Plan', description: 'Full access to all Pro features.' },
    teams: { label: 'Teams Plan', description: 'Admin features for your entire team.' },
  };

  const handleManageBilling = () => {
    alert("This would redirect to a customer billing portal, like Stripe's, where you can manage payment methods and view invoices.");
  };

  const handleCancelSubscription = () => {
    if (confirm('Are you sure you want to cancel your subscription? Your plan will remain active until the end of the current billing period.')) {
        alert("Your subscription has been cancelled. In a real app, this would trigger a backend process.");
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action is irreversible and all your data will be lost.')) {
        alert("Your account is being deleted. In a real app, this would remove your data from the database and log you out.");
        // In a real app, you would also call a logout/cleanup function here.
    }
  };


  return (
    <div className="min-h-screen bg-brand-light">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
                <div className="flex items-center">
                    <svg className="h-8 w-auto text-brand-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z" />
                    </svg>
                    <span className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">Calert</span>
                </div>
                <button onClick={onBack} className="text-sm font-semibold text-gray-700 hover:text-brand-primary">
                    &larr; Back to Dashboard
                </button>
            </div>
        </div>
      </header>

      <main className="py-10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Management</h1>
          
          <div className="mt-8 space-y-8">

            {/* User Profile Section */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
                <div className="flex items-center space-x-4">
                    <img className="h-16 w-16 rounded-full" src={user.avatarUrl} alt="User avatar" />
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                        <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-4">Subscription</h3>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <p className="text-sm font-medium text-gray-500">Current Plan</p>
                    <p className="mt-1 text-lg font-semibold text-brand-dark">{tierInfo[user.tier].label}</p>
                    <p className="text-sm text-gray-500">{tierInfo[user.tier].description}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Next Billing Date</p>
                    <p className="mt-1 text-lg font-semibold text-gray-800">{user.tier === 'free' ? 'N/A' : 'October 26, 2024'}</p>
                    {user.tier !== 'free' && <p className="text-sm text-gray-500">You will be billed automatically.</p>}
                </div>
              </div>
            </div>

            {/* Billing Section */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-4">Billing</h3>
              <div className="mt-6">
                 <p className="text-gray-600 mb-4">Manage your payment methods and view your invoice history.</p>
                 <button 
                    onClick={handleManageBilling}
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                 >
                    Manage Billing & Invoices
                 </button>
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border-2 border-red-200">
              <h3 className="text-xl font-semibold text-red-800 border-b border-red-200 pb-4">Danger Zone</h3>
              <div className="mt-6 space-y-4">
                {user.tier !== 'free' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Cancel Subscription</p>
                      <p className="text-sm text-gray-500">Your plan will not renew at the end of the billing period.</p>
                    </div>
                    <button 
                        onClick={handleCancelSubscription}
                        className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                    >
                        Cancel
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Delete Account</p>
                    <p className="text-sm text-gray-500">Permanently delete your account and all associated data.</p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountScreen;
