import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { CheckCircle2, Circle, FileText, Target, Calendar } from 'lucide-react'

export function CoachingProgress() {
  const { coachingStatus } = useStore()

  const steps = [
    {
      id: 'declaration',
      label: '선언서',
      completed: coachingStatus.declarationCompleted,
      icon: FileText,
    },
    {
      id: 'goalAgreement',
      label: '목표합의서',
      completed: coachingStatus.goalAgreementCompleted,
      icon: Target,
    },
    {
      id: 'nextSession',
      label: '다음 상담 준비',
      completed: coachingStatus.nextSessionPrepared,
      icon: Calendar,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">코칭 진행 상태</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex items-center gap-3">
              {step.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
              <Icon className={`w-4 h-4 ${step.completed ? 'text-gray-600' : 'text-gray-400'}`} />
              <span
                className={`text-sm ${
                  step.completed ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {step.completed && (
                <span className="ml-auto text-xs text-green-600">완료</span>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
