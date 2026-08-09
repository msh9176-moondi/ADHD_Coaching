import { useState } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../common/Card'
import { Button } from '../../common/Button'
import { FIELD_GUIDES, COLOR_MAP } from '../../../data/taskFieldGuides'

function FormField({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  )
}

function FormFieldWithGuide({ guide, value, onChange, expanded, onToggle, placeholder }) {
  const Icon = guide.icon
  const colors = COLOR_MAP[guide.color]

  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-colors ${expanded ? colors.border : 'border-gray-200'}`}>
      <div
        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${expanded ? colors.bg : 'hover:bg-gray-50'}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colors.text}`} />
          <span className="text-sm font-medium text-gray-700">{guide.title}</span>
        </div>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <HelpCircle className={`w-4 h-4 transition-colors ${expanded ? colors.text : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className={`px-4 py-3 ${colors.bg} border-t ${colors.border}`}>
          <p className="text-sm font-medium text-gray-800 mb-1">왜 필요한가요?</p>
          <p className="text-sm text-gray-600 mb-3">{guide.why}</p>

          <p className="text-sm font-medium text-gray-800 mb-1">어떻게 정하나요?</p>
          <p className="text-sm text-gray-600 mb-3">{guide.how}</p>

          <p className="text-sm font-medium text-gray-800 mb-1">예시</p>
          <div className="flex flex-wrap gap-1.5">
            {guide.examples.map((example, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(example)
                }}
                className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text} border ${colors.border} hover:opacity-80 transition-opacity`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 ${colors.ring}`}
        />
      </div>
    </div>
  )
}

export function TaskEditModal({ task, onClose, onSave }) {
  const [formData, setFormData] = useState({
    purpose: task.purpose || '',
    minAction: task.minAction || '',
    location: task.location || '',
    signal: task.signal || '',
    targetCount: task.targetCount || 5,
    fallback: task.fallback || '',
    returnAction: task.returnAction || '',
  })
  const [expandedGuide, setExpandedGuide] = useState(null)

  const update = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>실행 계획 세우기</CardTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{task.title}</p>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}
          </div>

          <FormField
            label="이 과제의 목적"
            placeholder="예: 아침에 몸을 깨우고 하루를 상쾌하게 시작하기"
            value={formData.purpose}
            onChange={(v) => update('purpose', v)}
          />

          <FormFieldWithGuide
            guide={FIELD_GUIDES.minAction}
            value={formData.minAction}
            onChange={(v) => update('minAction', v)}
            expanded={expandedGuide === 'minAction'}
            onToggle={() => setExpandedGuide(expandedGuide === 'minAction' ? null : 'minAction')}
            placeholder="예: 매트 위에 서기"
          />

          <FormFieldWithGuide
            guide={FIELD_GUIDES.location}
            value={formData.location}
            onChange={(v) => update('location', v)}
            expanded={expandedGuide === 'location'}
            onToggle={() => setExpandedGuide(expandedGuide === 'location' ? null : 'location')}
            placeholder="예: 거실"
          />

          <FormFieldWithGuide
            guide={FIELD_GUIDES.signal}
            value={formData.signal}
            onChange={(v) => update('signal', v)}
            expanded={expandedGuide === 'signal'}
            onToggle={() => setExpandedGuide(expandedGuide === 'signal' ? null : 'signal')}
            placeholder="예: 알람이 울리면"
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">목표 횟수</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="14"
                value={formData.targetCount}
                onChange={(e) => update('targetCount', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-lg font-bold text-emerald-600 w-12 text-center">
                {formData.targetCount}회
              </span>
            </div>
          </div>

          <FormFieldWithGuide
            guide={FIELD_GUIDES.fallback}
            value={formData.fallback}
            onChange={(v) => update('fallback', v)}
            expanded={expandedGuide === 'fallback'}
            onToggle={() => setExpandedGuide(expandedGuide === 'fallback' ? null : 'fallback')}
            placeholder="예: 기지개만 켜기"
          />

          <FormFieldWithGuide
            guide={FIELD_GUIDES.returnAction}
            value={formData.returnAction}
            onChange={(v) => update('returnAction', v)}
            expanded={expandedGuide === 'returnAction'}
            onToggle={() => setExpandedGuide(expandedGuide === 'returnAction' ? null : 'returnAction')}
            placeholder="예: 다시 매트 위로 가기"
          />

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button onClick={() => onSave(formData)} className="flex-1">
              저장하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
