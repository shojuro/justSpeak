'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useFormValidation, validators } from '@/lib/form-validation'
import { FormField, Input, Select, SubmitButton } from '@/components/ui/Form'
import { FeedbackButton } from '@/components/ui/FeedbackButton'
import { InlineThemeToggle } from '@/components/ui/ThemeToggle'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { logUserActivity } from '@/lib/auth'

function SettingsContent() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'account', label: 'Account', icon: '🛡️' }
  ]

  return (
    <div className="min-h-screen bg-deep-charcoal">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-warm-coral mb-8">Settings</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-jet rounded-lg p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 last:mb-0 ${
                    activeTab === tab.id
                      ? 'bg-warm-coral text-white'
                      : 'hover:bg-warm-coral/10 text-warm-coral-light'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-jet rounded-lg p-6">
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'preferences' && <PreferencesSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'privacy' && <PrivacySettings />}
              {activeTab === 'account' && <AccountSettings />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSettings() {
  const { profile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const schema = {
    name: [validators.required(), validators.minLength(2)],
    email: [validators.required(), validators.email()],
    age_group: [validators.required()]
  }

  const { values, errors, touched, handleChange, handleBlur, validate } = useFormValidation(
    {
      name: profile?.name || '',
      email: profile?.email || '',
      age_group: profile?.age_group || 'adult'
    },
    schema
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await updateProfile({
        name: values.name,
        age_group: values.age_group
      })
      
      // Log activity
      if (profile?.id) {
        await logUserActivity(profile.id, 'profile_updated', { fields: ['name', 'age_group'] })
      }
    } catch (error) {
      // Error handled by context
    } finally {
      setIsLoading(false)
    }
  }

  const ageGroups = [
    { value: 'child', label: 'Child (Under 13)' },
    { value: 'teen', label: 'Teen (13-17)' },
    { value: 'adult', label: 'Adult (18+)' }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-warm-coral mb-6">Profile Information</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        <FormField
          label="Full Name"
          name="name"
          error={errors.name}
          touched={touched.name}
          required
        >
          <Input
            type="text"
            name="name"
            value={values.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            error={errors.name}
            touched={touched.name}
          />
        </FormField>

        <FormField
          label="Email"
          name="email"
          error={errors.email}
          touched={touched.email}
          required
        >
          <Input
            type="email"
            name="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            touched={touched.email}
            disabled
          />
          <p className="text-xs text-warm-coral-light mt-1">
            Email cannot be changed
          </p>
        </FormField>

        <FormField
          label="Age Group"
          name="age_group"
          error={errors.age_group}
          touched={touched.age_group}
          required
        >
          <Select
            name="age_group"
            value={values.age_group}
            onChange={(e) => handleChange('age_group', e.target.value)}
            onBlur={() => handleBlur('age_group')}
            error={errors.age_group}
            touched={touched.age_group}
            options={ageGroups}
          />
        </FormField>

        <SubmitButton isLoading={isLoading}>
          Save Changes
        </SubmitButton>
      </form>
    </div>
  )
}

function PreferencesSettings() {
  const { theme } = useTheme()
  const [preferences, setPreferences] = useState({
    dailyGoal: 15,
    reminderTime: '09:00',
    voiceSpeed: 1.0,
    autoRecord: true
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-warm-coral mb-6">Preferences</h2>
      
      <div className="space-y-6">
        <InlineThemeToggle />

        <div className="bg-deep-charcoal p-4 rounded-lg">
          <h3 className="text-lg font-medium text-warm-coral mb-4">Learning Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-warm-coral-light">Daily Goal (minutes)</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={preferences.dailyGoal}
                  onChange={(e) => setPreferences({ ...preferences, dailyGoal: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-warm-coral font-bold w-12 text-center">
                  {preferences.dailyGoal}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-warm-coral-light">Voice Speed</label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={preferences.voiceSpeed}
                  onChange={(e) => setPreferences({ ...preferences, voiceSpeed: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-warm-coral font-bold w-12 text-center">
                  {preferences.voiceSpeed}x
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto-start Recording</div>
                <div className="text-xs text-warm-coral-light">
                  Automatically start recording when you enter a conversation
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoRecord}
                  onChange={(e) => setPreferences({ ...preferences, autoRecord: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-coral"></div>
              </label>
            </div>
          </div>
        </div>

        <FeedbackButton variant="primary">
          Save Preferences
        </FeedbackButton>
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    achievementAlerts: true,
    weeklyProgress: true,
    marketingEmails: false
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const notificationOptions = [
    {
      key: 'emailReminders',
      title: 'Daily Practice Reminders',
      description: 'Get reminded to practice your English every day'
    },
    {
      key: 'achievementAlerts',
      title: 'Achievement Notifications',
      description: 'Celebrate your milestones and achievements'
    },
    {
      key: 'weeklyProgress',
      title: 'Weekly Progress Reports',
      description: 'Receive a summary of your weekly learning progress'
    },
    {
      key: 'marketingEmails',
      title: 'Product Updates',
      description: 'Stay informed about new features and updates'
    }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-warm-coral mb-6">Notification Settings</h2>
      
      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="bg-deep-charcoal p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{option.title}</div>
                <div className="text-sm text-warm-coral-light">{option.description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={notifications[option.key as keyof typeof notifications]}
                  onChange={() => toggleNotification(option.key as keyof typeof notifications)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-coral"></div>
              </label>
            </div>
          </div>
        ))}
      </div>

      <FeedbackButton variant="primary" className="mt-6">
        Save Notification Settings
      </FeedbackButton>
    </div>
  )
}

function PrivacySettings() {
  const [privacy, setPrivacy] = useState({
    shareProgress: false,
    anonymousData: true,
    publicProfile: false
  })

  return (
    <div>
      <h2 className="text-2xl font-bold text-warm-coral mb-6">Privacy Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-deep-charcoal p-4 rounded-lg">
          <h3 className="text-lg font-medium text-warm-coral mb-4">Data Sharing</h3>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.shareProgress}
                onChange={(e) => setPrivacy({ ...privacy, shareProgress: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">Share Progress with Friends</div>
                <div className="text-sm text-warm-coral-light">
                  Allow friends to see your learning streaks and achievements
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.anonymousData}
                onChange={(e) => setPrivacy({ ...privacy, anonymousData: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">Anonymous Usage Analytics</div>
                <div className="text-sm text-warm-coral-light">
                  Help us improve TalkTime by sharing anonymous usage data
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy.publicProfile}
                onChange={(e) => setPrivacy({ ...privacy, publicProfile: e.target.checked })}
                className="mt-1"
              />
              <div>
                <div className="font-medium">Public Profile</div>
                <div className="text-sm text-warm-coral-light">
                  Make your profile visible to other TalkTime users
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-deep-charcoal p-4 rounded-lg">
          <h3 className="text-lg font-medium text-warm-coral mb-4">Data Export</h3>
          <p className="text-sm text-warm-coral-light mb-4">
            Download all your data including conversations, progress, and account information.
          </p>
          <FeedbackButton variant="secondary">
            Export My Data
          </FeedbackButton>
        </div>

        <FeedbackButton variant="primary">
          Save Privacy Settings
        </FeedbackButton>
      </div>
    </div>
  )
}

function AccountSettings() {
  const { signOut } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-warm-coral mb-6">Account Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-deep-charcoal p-4 rounded-lg">
          <h3 className="text-lg font-medium text-warm-coral mb-4">Password</h3>
          <p className="text-sm text-warm-coral-light mb-4">
            Change your password to keep your account secure.
          </p>
          <FeedbackButton variant="secondary">
            Change Password
          </FeedbackButton>
        </div>

        <div className="bg-deep-charcoal p-4 rounded-lg">
          <h3 className="text-lg font-medium text-warm-coral mb-4">Sign Out</h3>
          <p className="text-sm text-warm-coral-light mb-4">
            Sign out of your TalkTime account on this device.
          </p>
          <FeedbackButton variant="secondary" onClick={handleSignOut}>
            Sign Out
          </FeedbackButton>
        </div>

        <div className="bg-deep-charcoal p-4 rounded-lg border-2 border-error/20">
          <h3 className="text-lg font-medium text-error mb-4">Danger Zone</h3>
          <p className="text-sm text-warm-coral-light mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          {!showDeleteConfirm ? (
            <FeedbackButton 
              variant="danger" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </FeedbackButton>
          ) : (
            <div className="space-y-4">
              <p className="text-error font-medium">
                Are you absolutely sure? This will permanently delete your account and all data.
              </p>
              <div className="flex gap-3">
                <FeedbackButton variant="danger">
                  Yes, Delete My Account
                </FeedbackButton>
                <FeedbackButton 
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </FeedbackButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}