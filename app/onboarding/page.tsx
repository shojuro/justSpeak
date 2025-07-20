'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { FeedbackButton } from '@/components/ui/FeedbackButton'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface OnboardingStep {
  id: number
  title: string
  description: string
}

const steps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to TalkTime!',
    description: 'Let\'s set up your profile to personalize your learning experience.'
  },
  {
    id: 2,
    title: 'Set Your Learning Goals',
    description: 'What would you like to achieve with TalkTime?'
  },
  {
    id: 3,
    title: 'Choose Your Level',
    description: 'Help us understand your current English proficiency.'
  },
  {
    id: 4,
    title: 'Customize Your Experience',
    description: 'Set your preferences for the best learning experience.'
  }
]

function OnboardingContent() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const [onboardingData, setOnboardingData] = useState({
    learningGoals: [] as string[],
    proficiencyLevel: '',
    preferredTopics: [] as string[],
    dailyGoal: 15,
    preferredLanguage: 'en-US'
  })

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        learning_goals: onboardingData.learningGoals,
        preferred_language: onboardingData.preferredLanguage
      })
      
      showToast('Profile setup complete! Let\'s start learning!', 'success')
      router.push('/dashboard')
    } catch (error) {
      showToast('Failed to save profile. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep userName={profile?.name || 'there'} />
      
      case 2:
        return (
          <LearningGoalsStep
            selected={onboardingData.learningGoals}
            onChange={(goals) => setOnboardingData({ ...onboardingData, learningGoals: goals })}
          />
        )
      
      case 3:
        return (
          <ProficiencyStep
            selected={onboardingData.proficiencyLevel}
            onChange={(level) => setOnboardingData({ ...onboardingData, proficiencyLevel: level })}
          />
        )
      
      case 4:
        return (
          <PreferencesStep
            dailyGoal={onboardingData.dailyGoal}
            topics={onboardingData.preferredTopics}
            onDailyGoalChange={(goal) => setOnboardingData({ ...onboardingData, dailyGoal: goal })}
            onTopicsChange={(topics) => setOnboardingData({ ...onboardingData, preferredTopics: topics })}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-deep-charcoal flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-jet">
        <div className="h-2 bg-warm-coral transition-all duration-300" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleSkip}
          className="text-warm-coral-light hover:text-warm-coral transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-warm-coral mb-2">
              {steps[currentStep - 1].title}
            </h1>
            <p className="text-warm-coral-light">
              {steps[currentStep - 1].description}
            </p>
          </div>

          <div className="bg-jet rounded-lg shadow-xl p-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <FeedbackButton
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={currentStep === 1 ? 'invisible' : ''}
            >
              Back
            </FeedbackButton>

            <div className="flex gap-2">
              {[...Array(steps.length)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 === currentStep ? 'bg-warm-coral' : 'bg-warm-coral/30'
                  }`}
                />
              ))}
            </div>

            <FeedbackButton
              variant="primary"
              onClick={handleNext}
              loading={isLoading && currentStep === steps.length}
            >
              {currentStep === steps.length ? 'Complete' : 'Next'}
            </FeedbackButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// Step Components
function WelcomeStep({ userName }: { userName: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 bg-warm-coral/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">👋</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-4">
        Hi {userName}!
      </h2>
      <p className="text-warm-coral-light max-w-md mx-auto">
        We're excited to help you improve your English conversation skills. This quick setup will help us personalize your learning experience.
      </p>
    </div>
  )
}

function LearningGoalsStep({ 
  selected, 
  onChange 
}: { 
  selected: string[]
  onChange: (goals: string[]) => void 
}) {
  const goals = [
    { id: 'conversation', label: 'Improve conversation skills', icon: '💬' },
    { id: 'business', label: 'Business English', icon: '💼' },
    { id: 'travel', label: 'Travel English', icon: '✈️' },
    { id: 'academic', label: 'Academic English', icon: '🎓' },
    { id: 'pronunciation', label: 'Better pronunciation', icon: '🗣️' },
    { id: 'confidence', label: 'Build confidence', icon: '💪' }
  ]

  const toggleGoal = (goalId: string) => {
    if (selected.includes(goalId)) {
      onChange(selected.filter(g => g !== goalId))
    } else {
      onChange([...selected, goalId])
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selected.includes(goal.id)
                ? 'border-warm-coral bg-warm-coral/20'
                : 'border-warm-coral/30 hover:border-warm-coral/50'
            }`}
          >
            <span className="text-2xl mb-2 block">{goal.icon}</span>
            <span className="text-sm">{goal.label}</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-warm-coral-light mt-4 text-center">
        Select all that apply
      </p>
    </div>
  )
}

function ProficiencyStep({ 
  selected, 
  onChange 
}: { 
  selected: string
  onChange: (level: string) => void 
}) {
  const levels = [
    { id: 'beginner', label: 'Beginner', description: 'I know basic words and phrases' },
    { id: 'intermediate', label: 'Intermediate', description: 'I can have simple conversations' },
    { id: 'advanced', label: 'Advanced', description: 'I\'m comfortable in most situations' },
    { id: 'fluent', label: 'Near Fluent', description: 'I want to perfect my skills' }
  ]

  return (
    <div className="space-y-4">
      {levels.map((level) => (
        <button
          key={level.id}
          onClick={() => onChange(level.id)}
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selected === level.id
              ? 'border-warm-coral bg-warm-coral/20'
              : 'border-warm-coral/30 hover:border-warm-coral/50'
          }`}
        >
          <div className="font-semibold text-warm-coral">{level.label}</div>
          <div className="text-sm text-warm-coral-light mt-1">{level.description}</div>
        </button>
      ))}
    </div>
  )
}

function PreferencesStep({ 
  dailyGoal, 
  topics,
  onDailyGoalChange,
  onTopicsChange 
}: { 
  dailyGoal: number
  topics: string[]
  onDailyGoalChange: (goal: number) => void
  onTopicsChange: (topics: string[]) => void
}) {
  const topicOptions = [
    'Technology', 'Travel', 'Food', 'Sports', 'Movies', 'Music',
    'Business', 'Science', 'Culture', 'Health', 'Environment', 'Politics'
  ]

  const toggleTopic = (topic: string) => {
    if (topics.includes(topic)) {
      onTopicsChange(topics.filter(t => t !== topic))
    } else {
      onTopicsChange([...topics, topic])
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-warm-coral mb-4">
          Daily Practice Goal
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-warm-coral-light">Minutes per day:</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onDailyGoalChange(Math.max(5, dailyGoal - 5))}
              className="w-8 h-8 rounded-full bg-warm-coral/20 hover:bg-warm-coral/30 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold text-warm-coral w-12 text-center">
              {dailyGoal}
            </span>
            <button
              onClick={() => onDailyGoalChange(Math.min(60, dailyGoal + 5))}
              className="w-8 h-8 rounded-full bg-warm-coral/20 hover:bg-warm-coral/30 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-warm-coral mb-4">
          Favorite Topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {topicOptions.map((topic) => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                topics.includes(topic)
                  ? 'bg-warm-coral text-white'
                  : 'bg-warm-coral/20 text-warm-coral hover:bg-warm-coral/30'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingContent />
    </ProtectedRoute>
  )
}