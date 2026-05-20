/**
 * Frontend Route Definitions
 * Centralized route management for layon
 */


export const FrontendRoutes = {
  home: '/',
  dashboard: '/dashboard',

  dashboardRoutes: {
    main: '/dashboard',
    overview: '/dashboard',
    latestAssessment: '/dashboard/latest-assessment',
    quickStats: '/dashboard/quick-stats',
    trendSummaries: '/dashboard/trend-summaries',
    assessments: '/dashboard/assessments',
    startAssessment: '/dashboard/assessments/start',
    assessmentResults: '/dashboard/assessments/results',
    moodTracker: '/dashboard/mood-tracker',
    chat: '/dashboard/chat',
    chatThread: (id: string) => `/dashboard/chats/${id}`,
    privateNotes: '/dashboard/journal/notes',
    reflectionPrompts: '/dashboard/journal/prompts',
    assessmentHistory: '/dashboard/assessment-history',
    insights: '/dashboard/insights',
    stressPatterns: '/dashboard/insights/stress-patterns',
    assessmentAnalytics: '/dashboard/insights/analytics',
    weeklySummaries: '/dashboard/insights/weekly',
    monthlySummaries: '/dashboard/insights/monthly',
    notifications: '/dashboard/notifications',
    reminders: '/dashboard/notifications/reminders',
    streakUpdates: '/dashboard/notifications/streaks',
    assessmentReminders: '/dashboard/notifications/assessment-reminders',
    motivationalNotifications: '/dashboard/notifications/motivational',
    settings: '/dashboard/settings',
    profileSettings: '/dashboard/settings/profile',
    passwordSecurity: '/dashboard/settings/security',
    notificationPreferences: '/dashboard/settings/notifications',
    privacySettings: '/dashboard/settings/privacy',
    teams: '/dashboard/team',
    roles: '/dashboard/settings/roles',
    invitations: '/dashboard/settings/invitations',
    auditLogs: '/dashboard/settings/audit-logs',
    themePreferences: '/dashboard/settings/theme',
    organization: '/dashboard/organization',
    trash: '/dashboard/trash',
    profile: '/dashboard/profile',
  },

  // Auth routes
  auth: {
    login: '/auth/login',
    mfa: '/auth/login/mfa',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    oauthCallback: (provider: string) => `/auth/oauth/callback/${provider}`,
    onboarding: {
      root: '/auth/onboarding', 
      basicInfo: '/auth/onboarding/basic-info',
      password: '/auth/onboarding/password',
      verifyEmail: '/auth/onboarding/verify-email',
      verifyPhone: '/auth/onboarding/phone-verification',
      username: '/auth/onboarding/username',
      profilePicture: '/auth/onboarding/profile-picture',
      complete: '/auth/onboarding/complete',
      organization: '/auth/onboarding/organization',
    }
  },

  organization: '/dashboard/organization',
  trash: '/dashboard/trash',
} as const;

export const Routes = FrontendRoutes;

export default FrontendRoutes;
