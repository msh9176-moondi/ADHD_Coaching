import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/common/Button'
import { Card, CardContent } from '../components/common/Card'
import {
  PartyPopper, MessageCircle, FileText,
  ArrowRight, Target
} from 'lucide-react'

export function MatchCompletePage() {
  const navigate = useNavigate()
  const { user, asrsResult, preSurvey } = useStore()

  const handleGoToDashboard = () => {
    navigate('/coachee')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* 축하 메시지 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            코칭 준비가 완료되었습니다!
          </h1>
          <p className="text-gray-600">
            FLOCA 코칭과 함께 실행력 회복을 시작합니다
          </p>
        </div>

        {/* 플로카 서비스 카드 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">FLOCA 코칭</h2>
                <p className="text-sm text-gray-500">ADHD 실행회복 전문 코칭</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {user?.name || '회원'}님의 분석 결과를 바탕으로 맞춤 코칭 프로그램이 준비되었습니다.
            </p>
          </CardContent>
        </Card>

        {/* 나의 분석 요약 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              나의 분석 요약
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">ADHD 유형</span>
                <span className="text-sm font-medium text-gray-900">
                  {asrsResult?.interpretation || '-'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">종합 점수</span>
                <span className="text-sm font-medium text-gray-900">
                  {preSurvey?.categoryScores?.total?.toFixed(1) || '-'}점 / 5점
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 다음 단계 안내 */}
        <Card className="bg-emerald-50 border-emerald-100 mb-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 mb-4">이제 시작해볼까요?</h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">오늘의 할 일을 확인하세요</p>
                  <p className="text-xs text-emerald-700">대시보드에서 맞춤 과제를 확인합니다</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">매일 체크인으로 기록하세요</p>
                  <p className="text-xs text-emerald-700">오늘의 컨디션과 목표를 체크합니다</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">꾸준히 성장을 확인하세요</p>
                  <p className="text-xs text-emerald-700">분석 결과로 나의 변화를 추적합니다</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 대시보드 이동 버튼 */}
        <Button onClick={handleGoToDashboard} className="w-full" size="lg">
          대시보드로 이동
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
