import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import {
  ChevronLeft, BookOpen, Target, RefreshCw, CheckSquare, Brain,
  AlertTriangle, Lightbulb, Clock, Heart, Zap, ChevronDown, ChevronUp
} from 'lucide-react'

const GUIDE_SECTIONS = [
  {
    id: 'task-writing',
    icon: CheckSquare,
    title: '실행 과제 작성법',
    color: 'blue',
    content: [
      {
        subtitle: 'SMART 원칙 적용하기',
        items: [
          '구체적(Specific): "공부하기" → "수학 문제집 3페이지 풀기"',
          '측정 가능(Measurable): 완료 여부를 명확히 판단할 수 있게',
          '달성 가능(Achievable): 현실적으로 할 수 있는 범위로',
          '관련성(Relevant): 코칭 목표와 연결되는 과제로',
          '시간 제한(Time-bound): 언제까지 할지 명시하기'
        ]
      },
      {
        subtitle: '작은 단위로 쪼개기',
        items: [
          '큰 과제는 10-15분 안에 끝낼 수 있는 단위로 분해',
          '예: "방 정리" → "책상 위 정리(10분) → 바닥 청소(10분) → 옷 정리(15분)"',
          '완료할 때마다 성취감을 느낄 수 있도록'
        ]
      },
      {
        subtitle: '시작 신호 정하기',
        items: [
          '언제/어디서 시작할지 구체적으로 정하기',
          '예: "저녁 식사 후 책상에 앉으면 수학 문제집 펼치기"',
          '기존 습관에 연결하면 더 쉽게 시작할 수 있음'
        ]
      }
    ]
  },
  {
    id: 'recovery',
    icon: RefreshCw,
    title: '복귀 전략',
    color: 'green',
    content: [
      {
        subtitle: '중단은 실패가 아닙니다',
        items: [
          'ADHD 특성상 집중이 흐트러지는 것은 자연스러운 현상',
          '중단했다고 자책하지 말고, 복귀하는 연습이 중요',
          '10번 중단해도 10번 복귀하면 성공'
        ]
      },
      {
        subtitle: '복귀 신호 만들기',
        items: [
          '5분마다 울리는 알람 설정 (정신 차리기 신호)',
          '포스트잇에 "지금 뭐 하고 있지?" 적어두기',
          '작업 전환 시 "원래 하려던 게 뭐였지?" 확인하기'
        ]
      },
      {
        subtitle: '복귀 루틴',
        items: [
          '1. 심호흡 3번 하기',
          '2. 지금 상태 인식하기 (탈선했구나)',
          '3. 자책 없이 원래 과제로 돌아가기',
          '4. 필요하면 과제를 더 작은 단위로 쪼개기'
        ]
      }
    ]
  },
  {
    id: 'self-evaluation',
    icon: Brain,
    title: '자가 평가 방법',
    color: 'purple',
    content: [
      {
        subtitle: '매일 점검 질문',
        items: [
          '오늘 가장 잘한 것 한 가지는?',
          '내일 개선하고 싶은 것 한 가지는?',
          '오늘 나에게 필요했던 것은?'
        ]
      },
      {
        subtitle: '주간 점검',
        items: [
          '이번 주 과제 완료율은? (목표: 60% 이상)',
          '복귀 횟수 vs 중단 시간',
          '가장 효과적이었던 전략은?',
          '다음 주에 시도해볼 것은?'
        ]
      },
      {
        subtitle: '점수 평가 기준',
        items: [
          '0-3점: 시작조차 어려운 상태 → 더 작은 과제로 쪼개기',
          '4-6점: 시작은 하지만 유지가 어려움 → 복귀 전략 강화',
          '7-8점: 대체로 잘 실행 중 → 현재 전략 유지',
          '9-10점: 완전히 습관화됨 → 새로운 목표 설정 가능'
        ]
      }
    ]
  },
  {
    id: 'environment',
    icon: Zap,
    title: '환경 설정',
    color: 'yellow',
    content: [
      {
        subtitle: '방해 요소 제거',
        items: [
          '스마트폰은 다른 방에 두거나 앱 타이머 사용',
          '작업 공간에 필요한 것만 두기',
          '알림/진동 끄기',
          '필요하면 소음 차단 이어폰 사용'
        ]
      },
      {
        subtitle: '시작을 쉽게 만들기',
        items: [
          '도구는 미리 준비해두기 (책, 펜, 노트북 등)',
          '전날 밤에 다음 날 할 일 적어두기',
          '작업 시작 전 "3, 2, 1, GO!" 카운트다운'
        ]
      },
      {
        subtitle: '보상 시스템',
        items: [
          '작은 과제 완료 후 즉각적인 보상 주기',
          '보상 예시: 좋아하는 음료, 5분 휴식, 좋아하는 영상 한 편',
          '큰 목표 달성 시 특별한 보상 계획하기'
        ]
      }
    ]
  },
  {
    id: 'emergency',
    icon: AlertTriangle,
    title: '위기 대처',
    color: 'red',
    content: [
      {
        subtitle: '전혀 시작이 안 될 때',
        items: [
          '"딱 2분만" 규칙: 2분만 해보고 그만둬도 됨',
          '과제를 더 작게 쪼개기 (1분 단위까지)',
          '몸을 먼저 움직이기 (스트레칭, 산책)',
          '누군가에게 선언하기 ("나 지금 ○○ 시작해")'
        ]
      },
      {
        subtitle: '자책 루프에 빠졌을 때',
        items: [
          '생각 멈추고 심호흡 3번',
          '"이건 ADHD 특성이지, 내 잘못이 아니야"',
          '지금 할 수 있는 가장 작은 행동 하나 하기',
          '필요하면 오늘은 쉬어도 괜찮음'
        ]
      },
      {
        subtitle: '도움 요청하기',
        items: [
          '혼자 해결이 안 되면 도움 요청은 현명한 선택',
          '코치에게 메시지 보내기',
          '가까운 사람에게 상황 공유하기',
          '전문가 상담 고려하기'
        ]
      }
    ]
  }
]

function GuideSection({ section, isOpen, onToggle }) {
  const Icon = section.icon
  const colorMap = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' }
  }
  const colors = colorMap[section.color] || colorMap.blue

  return (
    <Card className={`border-2 ${colors.border}`}>
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardHeader className={`${colors.bg} cursor-pointer`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <CardTitle className={colors.text}>{section.title}</CardTitle>
            </div>
            {isOpen ? (
              <ChevronUp className={`w-5 h-5 ${colors.text}`} />
            ) : (
              <ChevronDown className={`w-5 h-5 ${colors.text}`} />
            )}
          </div>
        </CardHeader>
      </button>

      {isOpen && (
        <CardContent className="space-y-6 py-6">
          {section.content.map((block, idx) => (
            <div key={idx}>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                {block.subtitle}
              </h4>
              <ul className="space-y-2 pl-6">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-gray-700 text-sm list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

export function ExecutionGuidePage() {
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState(['task-writing'])

  const toggleSection = (sectionId) => {
    setOpenSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
      >
        <ChevronLeft className="w-4 h-4" />
        돌아가기
      </button>

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">실행기능 사용 설명서</h1>
            <p className="text-indigo-100">
              코칭 이후에도 스스로 실천하기 위한 가이드
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm text-indigo-100">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>읽는 시간: 약 10분</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>ADHD 특성을 고려한 맞춤 가이드</span>
          </div>
        </div>
      </div>

      {/* 핵심 원칙 */}
      <Card className="border-2 border-indigo-200 bg-indigo-50">
        <CardContent className="py-6">
          <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            핵심 원칙
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">1</p>
              <p className="text-sm font-medium text-gray-800">완벽보다 시작</p>
              <p className="text-xs text-gray-500 mt-1">일단 시작하면 절반은 성공</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">2</p>
              <p className="text-sm font-medium text-gray-800">작게 쪼개기</p>
              <p className="text-xs text-gray-500 mt-1">큰 과제는 작은 단계로</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">3</p>
              <p className="text-sm font-medium text-gray-800">자책 없이 복귀</p>
              <p className="text-xs text-gray-500 mt-1">중단해도 다시 시작하면 OK</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 가이드 섹션 */}
      <div className="space-y-4">
        {GUIDE_SECTIONS.map(section => (
          <GuideSection
            key={section.id}
            section={section}
            isOpen={openSections.includes(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* 하단 안내 */}
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-gray-600 mb-4">
            어려운 점이 있으면 언제든 코치에게 연락하세요.
            <br />
            1개월 후 사후관리 세션에서 다시 만나요!
          </p>
          <Button onClick={() => navigate('/coachee/messages')}>
            코치에게 메시지 보내기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
