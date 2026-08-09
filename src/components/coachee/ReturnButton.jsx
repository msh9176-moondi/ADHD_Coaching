import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { RotateCcw, Play, Minus, ListTodo, MessageSquare } from 'lucide-react'

export function ReturnButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [stoppedAt, setStoppedAt] = useState(null)

  const handleClose = () => {
    setIsOpen(false)
    setStep(1)
    setStoppedAt(null)
  }

  const handleStoppedAtSelect = (value) => {
    setStoppedAt(value)
    setStep(2)
  }

  const handleActionSelect = (action) => {
    // 실제로는 여기서 상태 업데이트나 기록 저장
    console.log('복귀 행동:', { stoppedAt, action })
    handleClose()
  }

  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">계획에서 벗어났나요?</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 돌아가기
          </Button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleClose} title="다시 돌아가기">
        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">어디에서 멈췄나요?</p>
            <div className="space-y-2">
              <ReturnOption
                onClick={() => handleStoppedAtSelect('before_start')}
                label="시작 전"
                description="아직 시작하지 못했어요"
              />
              <ReturnOption
                onClick={() => handleStoppedAtSelect('during')}
                label="하다가 중단"
                description="하다가 멈췄어요"
              />
              <ReturnOption
                onClick={() => handleStoppedAtSelect('distracted')}
                label="다른 일로 샘"
                description="다른 일을 하고 있었어요"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">지금 가능한 행동은?</p>
            <div className="space-y-2">
              <ReturnOption
                onClick={() => handleActionSelect('restart')}
                icon={Play}
                label="원래 행동 다시 시작"
                description="처음부터 다시 시작할게요"
              />
              <ReturnOption
                onClick={() => handleActionSelect('reduce_5min')}
                icon={Minus}
                label="5분으로 줄이기"
                description="더 작은 버전으로 할게요"
              />
              <ReturnOption
                onClick={() => handleActionSelect('first_step')}
                icon={ListTodo}
                label="첫 단계만 하기"
                description="가장 작은 시작만 할게요"
              />
              <ReturnOption
                onClick={() => handleActionSelect('record_only')}
                icon={MessageSquare}
                label="오늘은 기록만 하기"
                description="상태만 남기고 쉴게요"
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

function ReturnOption({ onClick, icon: Icon, label, description }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      {Icon && (
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      )}
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  )
}
