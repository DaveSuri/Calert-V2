export type SubscriptionTier = 'free' | 'pro' | 'teams';

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
  accessToken: string;
  tier: SubscriptionTier;
}

export interface Calendar {
  id: string;
  summary: string;
  primary: boolean;
}

export interface Settings {
  selectedCalendarId: string | null;
  isEnabled: boolean;
}

export interface Event {
  id: string;
  summary: string;
  start: string; // ISO string
  end: string; // ISO string
}