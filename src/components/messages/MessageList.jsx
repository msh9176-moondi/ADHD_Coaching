import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Avatar } from '../common/Avatar'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { SidePanel } from '../common/SidePanel'
import { QuickAction } from '../common/QuickAction'
import { GoalAgreementCard, DeclarationCard, TaskCard, SessionSummaryCard } from './cards'
import {
  Send, Target, CheckCircle, Plus, X, ChevronRight, ChevronDown,
  ScrollText, Shield, ClipboardList, Calendar, FileText, Edit3,
  Image, Paperclip
} from 'lucide-react'
import { sendMessage as sendMessageToDb, getMessages, subscribeToMessages, updateMessageMetadata } from '../../lib/messageService'
import { isSupabaseConfigured } from '../../lib/supabase'
import { createTask } from '../../lib/taskService'
import { saveCoachingTopicsFromGoal } from '../../lib/coacheeService'

const TOPIC_SUGGESTIONS = [
  '공부 시작 전환', '휴대폰 사용 조절', '중단 후 복귀', '일정 관리',
  '감정조절', '수면 루틴', '충동적 소비', '정리·청소 시작'
]

const DECLARATION_SECTIONS = [
  {
    id: 'common',
    title: '함께 지킬 약속',
    summary: '서로 존중하고, 솔직하게 소통하며, 함께 방법을 찾아갑니다.',
    details: [
      '비난보다 관찰하는 태도로 대화합니다',
      '목표와 실천은 함께 협의합니다',
      '불편하면 언제든 중단/수정 요청 가능합니다',
      '개인 이야기는 비밀보장 원칙에 따라 보호합니다'
    ]
  },
  {
    id: 'coachee',
    title: '피코치 약속',
    summary: '진솔하게 참여하고, 막힌 부분도 함께 나눕니다.',
    details: [
      '어려움과 원하는 변화를 솔직히 이야기합니다',
      '실천 못해도 숨기지 않고 함께 확인합니다',
      '컨디션이 안 좋으면 알립니다'
    ]
  },
  {
    id: 'coach',
    title: '코치 약속',
    summary: '판단하지 않고, 피코치의 속도를 존중합니다.',
    details: [
      '의지 부족으로 판단하지 않습니다',
      '정답을 강요하지 않습니다',
      '진단이나 약물 지시를 하지 않습니다'
    ]
  },
  {
    id: 'scope',
    title: '코칭 범위',
    summary: '코칭은 진료/치료를 대신하지 않습니다.',
    details: [
      '정신건강의학과 진료, 심리치료 대체 아님',
      '약물은 의료진과 상의',
      '긴급 시 안전 확보 우선'
    ]
  }
]

export function MessageList({
  userRole = 'coachee',
  messages: externalMessages,
  setMessages: externalSetMessages,
  coacheeName = '피코치',
  coachName = '플로카 코치',
  // Supabase 연동을 위한 새 props
  conversationId = null,
  userId = null,
  coacheeUserId = null,
}) {
  // 외부에서 messages를 받으면 사용, 아니면 내부 상태 사용
  const [internalMessages, setInternalMessages] = useState([])
  const messages = externalMessages || internalMessages
  const setMessages = externalSetMessages || setInternalMessages

  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showGoalPanel, setShowGoalPanel] = useState(false)
  const [editingGoalMessage, setEditingGoalMessage] = useState(null)
  const [viewingGoalMessage, setViewingGoalMessage] = useState(null)
  const [showDeclarationCreatePanel, setShowDeclarationCreatePanel] = useState(false)
  const [viewingDeclaration, setViewingDeclaration] = useState(null)
  const [showTaskPanel, setShowTaskPanel] = useState(false)
  const [showTaskSubmitPanel, setShowTaskSubmitPanel] = useState(false)
  const [submittingTaskId, setSubmittingTaskId] = useState(null)
  const [feedbackingTaskId, setFeedbackingTaskId] = useState(null)
  const [feedbackText, setFeedbackText] = useState('')
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  // 성찰일지 페이지로 이동 핸들러
  const handleNavigateToReflection = () => {
    navigate('/coachee/reflections')
  }

  const declarationCompleted = messages.some(
    m => m.type === 'declaration' && m.declarationData?.status === 'completed'
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Supabase에서 메시지 로드 및 실시간 구독
  useEffect(() => {
    if (!conversationId || !isSupabaseConfigured()) return

    // 기존 메시지 로드
    async function loadMessages() {
      try {
        const dbMessages = await getMessages(conversationId, 100)
        let formattedMessages = dbMessages.map(msg => {
          const metadata = msg.metadata || {}
          // metadata에 실제 타입이 있으면 사용 (declaration_confirm_request 등)
          const actualType = metadata.type || msg.type || 'normal'
          return {
            id: msg.id,
            sender: msg.sender_role,
            senderName: msg.sender_role === 'coach' ? coachName : coacheeName,
            content: msg.content,
            timestamp: msg.created_at,
            type: actualType,
            ...metadata
          }
        })

        // 선언서 상태 복원
        const confirmRequests = formattedMessages.filter(m => m.type === 'declaration_confirm_request')
        const declarationCompleteMsg = formattedMessages.find(m =>
          m.type === 'system' && m.content?.includes('코칭 참여 선언이 완료되었습니다')
        )

        if (confirmRequests.length > 0 || declarationCompleteMsg) {
          const confirmedIds = new Set(confirmRequests.map(m => m.originalDeclarationId))
          formattedMessages = formattedMessages.map(m => {
            if (m.type === 'declaration') {
              // 완료 메시지가 있으면 completed, 확인 요청만 있으면 pending_coach
              if (declarationCompleteMsg) {
                return {
                  ...m,
                  declarationData: {
                    ...m.declarationData,
                    coacheeAgreed: true,
                    coachAgreed: true,
                    status: 'completed'
                  }
                }
              } else if (confirmedIds.has(m.id)) {
                return {
                  ...m,
                  declarationData: {
                    ...m.declarationData,
                    coacheeAgreed: true,
                    status: 'pending_coach'
                  }
                }
              }
            }
            return m
          })
        }

        // 목표합의서 상태 복원
        const goalAgreeMessages = formattedMessages.filter(m =>
          m.type === 'goal_agree' || m.type === 'goal_confirm_request'
        )
        // 완료된 목표합의서 ID 목록 수집
        const completedGoalIds = new Set()
        formattedMessages.forEach(m => {
          if (m.type === 'goal_completed' || (m.type === 'system' && m.content?.includes('목표 합의가 완료되었습니다'))) {
            if (m.originalGoalId) {
              completedGoalIds.add(m.originalGoalId)
            }
          }
        })

        if (goalAgreeMessages.length > 0 || completedGoalIds.size > 0) {
          // 목표합의서별로 동의한 역할 수집
          const goalAgreements = {}
          goalAgreeMessages.forEach(m => {
            const goalId = m.originalGoalId
            if (goalId) {
              if (!goalAgreements[goalId]) goalAgreements[goalId] = []
              if (m.sender && !goalAgreements[goalId].includes(m.sender)) {
                goalAgreements[goalId].push(m.sender)
              }
            }
          })

          formattedMessages = formattedMessages.map(m => {
            if (m.type === 'goal_agreement') {
              const agreedBy = goalAgreements[m.id] || m.goalData?.agreedBy || []
              // 해당 목표합의서에 대한 완료 메시지가 있거나 양측이 동의한 경우에만 confirmed
              const isConfirmed = completedGoalIds.has(m.id) || (agreedBy.includes('coach') && agreedBy.includes('coachee'))
              return {
                ...m,
                goalData: {
                  ...m.goalData,
                  agreedBy,
                  status: isConfirmed ? 'confirmed' : m.goalData?.status
                }
              }
            }
            return m
          })
        }

        setMessages(formattedMessages)
      } catch (err) {
        console.error('메시지 로드 실패:', err)
      }
    }

    loadMessages()

    // 실시간 구독
    const unsubscribe = subscribeToMessages(conversationId, (newMsg) => {
      // 내가 보낸 메시지는 이미 추가했으므로 무시
      if (newMsg.sender_id === userId) return

      const metadata = newMsg.metadata || {}
      const actualType = metadata.type || newMsg.type || 'normal'
      const formattedMsg = {
        id: newMsg.id,
        sender: newMsg.sender_role,
        senderName: newMsg.sender_role === 'coach' ? coachName : coacheeName,
        content: newMsg.content,
        timestamp: newMsg.created_at,
        type: actualType,
        ...metadata
      }

      // 특수 메시지 처리
      if (actualType === 'declaration_confirm_request' && metadata.originalDeclarationId) {
        // 선언서 확인 요청 → coacheeAgreed 업데이트
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.id === metadata.originalDeclarationId && m.type === 'declaration') {
              return {
                ...m,
                declarationData: {
                  ...m.declarationData,
                  coacheeAgreed: true,
                  status: 'pending_coach'
                }
              }
            }
            return m
          })
          return [...updated, formattedMsg]
        })
      } else if ((actualType === 'goal_agree' || actualType === 'goal_confirm_request') && metadata.originalGoalId) {
        // 목표합의서 동의/확인요청 → agreedBy 업데이트
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.id === metadata.originalGoalId && m.type === 'goal_agreement') {
              const agreedBy = [...(m.goalData?.agreedBy || [])]
              if (newMsg.sender_role && !agreedBy.includes(newMsg.sender_role)) {
                agreedBy.push(newMsg.sender_role)
              }
              const isConfirmed = agreedBy.includes('coach') && agreedBy.includes('coachee')
              return {
                ...m,
                goalData: {
                  ...m.goalData,
                  agreedBy,
                  status: isConfirmed ? 'confirmed' : `agreed_by_${newMsg.sender_role}`
                }
              }
            }
            return m
          })
          return [...updated, formattedMsg]
        })
      } else if (actualType === 'goal_completed' || (newMsg.type === 'system' && newMsg.content?.includes('목표 합의가 완료되었습니다'))) {
        // 목표합의 완료 메시지 - 해당 목표합의서만 업데이트
        const completedGoalId = metadata.originalGoalId
        setMessages(prev => {
          const updated = prev.map(m => {
            // 특정 목표합의서만 confirmed로 변경
            if (m.type === 'goal_agreement' && m.id === completedGoalId) {
              return {
                ...m,
                goalData: { ...m.goalData, status: 'confirmed' }
              }
            }
            return m
          })
          return [...updated, formattedMsg]
        })
      } else if (newMsg.type === 'system' && newMsg.content?.includes('코칭 참여 선언이 완료되었습니다')) {
        // 선언서 완료 메시지
        setMessages(prev => {
          const updated = prev.map(m => {
            if (m.type === 'declaration') {
              return {
                ...m,
                declarationData: { ...m.declarationData, coacheeAgreed: true, coachAgreed: true, status: 'completed' }
              }
            }
            return m
          })
          return [...updated, formattedMsg]
        })
      } else {
        setMessages(prev => [...prev, formattedMsg])
      }
    })

    return () => unsubscribe()
  }, [conversationId, userId, coachName, coacheeName])

  const mySenderName = userRole === 'coach' ? coachName : coacheeName
  const otherSenderName = userRole === 'coach' ? coacheeName : coachName

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    const content = newMessage
    setNewMessage('')

    // 로컬에 즉시 추가 (optimistic update)
    const tempId = Date.now() + Math.random()
    const message = {
      id: tempId,
      sender: userRole,
      senderName: mySenderName,
      content,
      timestamp: new Date().toISOString(),
      type: 'normal',
    }
    setMessages(prev => [...prev, message])

    // Supabase에 저장
    if (conversationId && userId && isSupabaseConfigured()) {
      setIsSending(true)
      try {
        const savedMsg = await sendMessageToDb(conversationId, userId, userRole, content, 'normal')
        // 저장 성공 시 임시 ID를 실제 ID로 교체
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: savedMsg.id } : m
        ))
      } catch (err) {
        console.error('메시지 전송 실패:', err)
        // 실패 시에도 로컬 메시지는 유지 (오프라인 지원)
      } finally {
        setIsSending(false)
      }
    }
  }

  // ===== 선언서 관련 =====
  const handleStartDeclaration = () => {
    setShowDeclarationCreatePanel(true)
    closeAllPanels('declaration_create')
  }

  const handleViewDeclaration = (message) => {
    setViewingDeclaration(message)
    closeAllPanels('declaration_view')
  }

  const handleDeclarationSubmit = async (customPromises) => {
    const declarationData = {
      status: 'pending_coachee',
      customPromises,
      coacheeChecked: [],
      coachChecked: [],
      coacheeAgreed: false,
      coachAgreed: false,
    }
    const tempId = Date.now() + Math.random()
    const message = {
      id: tempId,
      sender: 'coach',
      senderName: coachName,
      content: '',
      timestamp: new Date().toISOString(),
      type: 'declaration',
      declarationData,
    }
    setMessages(prev => [...prev, message])
    setShowDeclarationCreatePanel(false)

    // Supabase에 저장
    if (conversationId && userId && isSupabaseConfigured()) {
      try {
        const savedMsg = await sendMessageToDb(
          conversationId, userId, 'coach', '', 'declaration', { declarationData }
        )
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: savedMsg.id } : m
        ))
      } catch (err) {
        console.error('선언서 전송 실패:', err)
      }
    }
  }

  const handleDeclarationCheck = (messageId, sectionId, _index, checked) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      const checkedKey = userRole === 'coachee' ? 'coacheeChecked' : 'coachChecked'
      const currentChecked = [...(m.declarationData[checkedKey] || [])]

      if (checked && !currentChecked.includes(sectionId)) {
        currentChecked.push(sectionId)
      } else if (!checked) {
        const idx = currentChecked.indexOf(sectionId)
        if (idx > -1) currentChecked.splice(idx, 1)
      }

      return {
        ...m,
        declarationData: { ...m.declarationData, [checkedKey]: currentChecked }
      }
    }))

    if (viewingDeclaration?.id === messageId) {
      setViewingDeclaration(prev => {
        const checkedKey = userRole === 'coachee' ? 'coacheeChecked' : 'coachChecked'
        const currentChecked = [...(prev.declarationData[checkedKey] || [])]

        if (checked && !currentChecked.includes(sectionId)) {
          currentChecked.push(sectionId)
        } else if (!checked) {
          const idx = currentChecked.indexOf(sectionId)
          if (idx > -1) currentChecked.splice(idx, 1)
        }

        return {
          ...prev,
          declarationData: { ...prev.declarationData, [checkedKey]: currentChecked }
        }
      })
    }
  }

  const handleDeclarationAgree = async () => {
    if (!viewingDeclaration) return
    const messageId = viewingDeclaration.id

    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m

      const newData = { ...m.declarationData }
      if (userRole === 'coachee') {
        newData.coacheeAgreed = true
        newData.status = 'pending_coach'
      } else {
        newData.coachAgreed = true
        if (newData.coacheeAgreed) {
          newData.status = 'completed'
        }
      }

      return { ...m, declarationData: newData }
    }))

    if (userRole === 'coachee') {
      const tempId = Date.now() + Math.random()
      const confirmRequestMessage = {
        id: tempId,
        sender: 'coachee',
        senderName: coacheeName,
        content: '',
        timestamp: new Date().toISOString(),
        type: 'declaration_confirm_request',
        originalDeclarationId: messageId,
      }
      setMessages(prev => [...prev, confirmRequestMessage])

      // Supabase에 저장 (system 타입으로 저장, metadata로 실제 타입 구분)
      if (conversationId && userId && isSupabaseConfigured()) {
        try {
          const savedMsg = await sendMessageToDb(
            conversationId, userId, 'coachee', '선언서 확인을 요청했습니다.', 'system',
            { type: 'declaration_confirm_request', originalDeclarationId: messageId }
          )
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...m, id: savedMsg.id } : m
          ))
        } catch (err) {
          console.error('선언서 확인요청 전송 실패:', err)
        }
      }
    } else {
      const currentDecl = messages.find(m => m.id === messageId)
      if (currentDecl?.declarationData?.coacheeAgreed) {
        const tempId = Date.now() + Math.random()
        const completeMessage = {
          id: tempId,
          sender: 'system',
          senderName: '시스템',
          content: '코칭 참여 선언이 완료되었습니다. 이제 목표합의서를 작성할 수 있습니다.',
          timestamp: new Date().toISOString(),
          type: 'system',
        }
        setMessages(prev => [...prev, completeMessage])

        // Supabase에 저장
        if (conversationId && userId && isSupabaseConfigured()) {
          try {
            await sendMessageToDb(
              conversationId, userId, 'coach', '코칭 참여 선언이 완료되었습니다. 이제 목표합의서를 작성할 수 있습니다.', 'system'
            )
          } catch (err) {
            console.error('시스템 메시지 전송 실패:', err)
          }
        }
      }
    }

    setViewingDeclaration(null)
  }

  // ===== 과제 관련 =====
  const handleStartTask = () => {
    setShowTaskPanel(true)
    closeAllPanels('task')
  }

  const handleTaskSubmit = async (taskData) => {
    const fullTaskData = {
      ...taskData,
      status: 'pending',
      completedAt: null,
      // 피코치가 실행과제 페이지에서 채울 상세 필드
      purpose: '',
      minAction: '',
      location: '',
      signal: '',
      targetCount: taskData.targetCount || 5,
      completedCount: 0,
      fallback: '',
      returnAction: '',
      detailsCompleted: false,
    }
    const tempId = Date.now() + Math.random()
    const message = {
      id: tempId,
      sender: 'coach',
      senderName: coachName,
      content: '',
      timestamp: new Date().toISOString(),
      type: 'task',
      taskData: fullTaskData,
    }
    setMessages(prev => [...prev, message])
    setShowTaskPanel(false)

    // Supabase에 저장
    if (conversationId && userId && isSupabaseConfigured()) {
      try {
        const savedMsg = await sendMessageToDb(
          conversationId, userId, 'coach', '', 'task', { taskData: fullTaskData }
        )
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: savedMsg.id } : m
        ))

        // tasks 테이블에도 저장 (CoacheeDetailPage 과제 현황 연동)
        if (coacheeUserId) {
          try {
            await createTask({
              coachee_id: coacheeUserId,
              coach_id: userId,
              title: taskData.title,
              description: taskData.description || '',
              due_date: taskData.dueDate || null,
              status: 'pending',
              target_count: taskData.targetCount || 5,
              completed_count: 0
            })
          } catch (taskErr) {
            console.error('tasks 테이블 저장 실패:', taskErr)
          }
        }
      } catch (err) {
        console.error('과제 전송 실패:', err)
      }
    }
  }

  const handleTaskComplete = (messageId) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      return {
        ...m,
        taskData: {
          ...m.taskData,
          status: 'completed',
          completedAt: new Date().toISOString(),
        }
      }
    }))

    const completeMessage = {
      id: Date.now() + Math.random(),
      sender: 'coachee',
      senderName: coacheeName,
      content: '과제를 완료했습니다!',
      timestamp: new Date().toISOString(),
      type: 'normal',
    }
    setMessages(prev => [...prev, completeMessage])
  }

  // 과제 제출 패널 열기
  const handleOpenTaskSubmit = (taskId) => {
    setSubmittingTaskId(taskId)
    setShowTaskSubmitPanel(true)
    closeAllPanels('task_submit')
  }

  // 과제 제출 처리
  const handleTaskSubmitContent = async (content, images) => {
    if (!submittingTaskId) return

    const taskMessage = messages.find(m => m.id === submittingTaskId)
    const submissionData = {
      taskId: submittingTaskId,
      taskTitle: taskMessage?.taskData?.title || '과제',
      content,
      images: images.map(img => ({ name: img.name, url: img.url })), // file 객체 제외
      submittedAt: new Date().toISOString()
    }

    // 과제에 제출 내용 추가
    setMessages(prev => prev.map(m => {
      if (m.id !== submittingTaskId) return m
      return {
        ...m,
        taskData: {
          ...m.taskData,
          submission: submissionData,
          status: 'submitted',
        }
      }
    }))

    // 제출 메시지 추가 (로컬)
    const tempId = Date.now() + Math.random()
    const submitMessage = {
      id: tempId,
      sender: 'coachee',
      senderName: coacheeName,
      content: '',
      timestamp: new Date().toISOString(),
      type: 'task_submission',
      submissionData
    }
    setMessages(prev => [...prev, submitMessage])

    // Supabase에 저장 (코치가 볼 수 있도록)
    if (conversationId && userId && isSupabaseConfigured()) {
      try {
        const savedMsg = await sendMessageToDb(
          conversationId, userId, 'coachee', '', 'system',
          { type: 'task_submission', submissionData }
        )
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: savedMsg.id } : m
        ))
      } catch (err) {
        console.error('과제 제출 저장 실패:', err)
      }
    }

    setShowTaskSubmitPanel(false)
    setSubmittingTaskId(null)
  }

  // 피드백 모달 열기
  const handleOpenFeedbackModal = (submissionMessageId) => {
    setFeedbackingTaskId(submissionMessageId)
    setFeedbackText('')
  }

  // 피드백 모달 닫기
  const handleCloseFeedbackModal = () => {
    setFeedbackingTaskId(null)
    setFeedbackText('')
  }

  // 과제 피드백 제출 (코치용)
  const handleSubmitFeedback = async () => {
    if (!feedbackingTaskId || !feedbackText.trim()) return

    const feedback = feedbackText.trim()
    const submissionMessageId = feedbackingTaskId

    const updatedSubmissionData = {
      feedback,
      feedbackAt: new Date().toISOString()
    }

    // 원본 메시지 찾기 (메타데이터 업데이트용)
    const originalMessage = messages.find(m => m.id === submissionMessageId)

    // 로컬 상태 업데이트
    setMessages(prev => prev.map(m => {
      if (m.id === submissionMessageId && m.type === 'task_submission') {
        return {
          ...m,
          submissionData: {
            ...m.submissionData,
            ...updatedSubmissionData
          }
        }
      }
      return m
    }))

    // 피드백 메시지 전송
    const feedbackMessage = {
      id: Date.now() + Math.random(),
      sender: 'coach',
      senderName: coachName,
      content: `📝 과제 피드백: ${feedback}`,
      timestamp: new Date().toISOString(),
      type: 'normal',
    }
    setMessages(prev => [...prev, feedbackMessage])

    // Supabase에 저장
    if (conversationId && userId && isSupabaseConfigured()) {
      try {
        // 원본 과제 제출 메시지의 메타데이터 업데이트
        if (originalMessage?.submissionData) {
          const updatedMetadata = {
            type: 'task_submission',
            submissionData: {
              ...originalMessage.submissionData,
              ...updatedSubmissionData
            }
          }
          await updateMessageMetadata(submissionMessageId, updatedMetadata)
        }

        // 피드백 메시지도 전송
        await sendMessageToDb(conversationId, userId, 'coach', `📝 과제 피드백: ${feedback}`, 'normal')
      } catch (err) {
        console.error('피드백 저장 실패:', err)
      }
    }

    // 모달 닫기
    handleCloseFeedbackModal()
  }

  // ===== 목표 합의서 관련 =====
  const handleStartGoalAgreement = () => {
    setEditingGoalMessage(null)
    setViewingGoalMessage(null)
    setShowGoalPanel(true)
    closeAllPanels('goal')
  }

  const handleViewGoal = (message) => {
    setViewingGoalMessage(message)
    closeAllPanels('goal_view')
  }

  const handleEditGoal = () => {
    if (viewingGoalMessage) {
      setEditingGoalMessage(viewingGoalMessage)
      setViewingGoalMessage(null)
      setShowGoalPanel(true)
    }
  }

  const handleGoalSubmit = async (goals) => {
    const newVersion = editingGoalMessage
      ? (editingGoalMessage.goalData.version || 1) + 1
      : 1

    if (editingGoalMessage) {
      setMessages(prev => prev.map(m =>
        m.id === editingGoalMessage.id
          ? { ...m, goalData: { ...m.goalData, status: 'revised' } }
          : m
      ))
    }

    const goalData = {
      version: newVersion,
      status: 'pending',
      goals,
      agreedBy: [],
    }
    const tempId = Date.now() + Math.random()
    const message = {
      id: tempId,
      sender: userRole,
      senderName: mySenderName,
      content: '',
      timestamp: new Date().toISOString(),
      type: 'goal_agreement',
      goalData,
    }
    setMessages(prev => [...prev, message])
    setShowGoalPanel(false)
    setEditingGoalMessage(null)

    // Supabase에 저장
    if (conversationId && userId && isSupabaseConfigured()) {
      try {
        const savedMsg = await sendMessageToDb(
          conversationId, userId, userRole, '', 'goal_agreement', { goalData }
        )
        setMessages(prev => prev.map(m =>
          m.id === tempId ? { ...m, id: savedMsg.id } : m
        ))
      } catch (err) {
        console.error('목표합의서 전송 실패:', err)
      }
    }
  }

  // 카드에서 직접 동의 (message를 인자로 받음)
  const handleGoalAgreeFromCard = async (goalMessage) => {
    if (!goalMessage) return
    await handleGoalAgreeInternal(goalMessage)
  }

  const handleGoalAgree = async () => {
    if (!viewingGoalMessage) return
    await handleGoalAgreeInternal(viewingGoalMessage)
    setViewingGoalMessage(null)
  }

  const handleGoalAgreeInternal = async (targetMessage) => {
    const messageId = targetMessage.id
    const currentGoal = messages.find(m => m.id === messageId)
    const currentAgreedBy = currentGoal?.goalData?.agreedBy || []
    const otherRole = userRole === 'coach' ? 'coachee' : 'coach'
    const willBeConfirmed = currentAgreedBy.includes(otherRole)

    // 새 agreedBy 배열 계산
    const newAgreedBy = [...currentAgreedBy]
    if (!newAgreedBy.includes(userRole)) {
      newAgreedBy.push(userRole)
    }
    const isConfirmed = newAgreedBy.includes('coach') && newAgreedBy.includes('coachee')
    const newStatus = isConfirmed ? 'confirmed' : `agreed_by_${userRole}`

    // 로컬 상태 업데이트
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      return {
        ...m,
        goalData: {
          ...m.goalData,
          agreedBy: newAgreedBy,
          status: newStatus
        }
      }
    }))

    // DB에 메타데이터 업데이트 (goalData 래퍼 유지)
    if (isSupabaseConfigured() && currentGoal?.goalData) {
      try {
        await updateMessageMetadata(messageId, {
          goalData: {
            ...currentGoal.goalData,
            agreedBy: newAgreedBy,
            status: newStatus
          }
        })
      } catch (err) {
        console.error('목표 합의서 메타데이터 업데이트 실패:', err)
      }
    }

    // 아직 상대방이 동의하지 않았으면 확인 요청 카드 전송
    if (!willBeConfirmed) {
      const tempId = Date.now() + Math.random()
      const confirmRequestMessage = {
        id: tempId,
        sender: userRole,
        senderName: mySenderName,
        content: '',
        timestamp: new Date().toISOString(),
        type: 'goal_confirm_request',
        originalGoalId: messageId,
      }
      setMessages(prev => [...prev, confirmRequestMessage])

      // Supabase에 저장
      if (conversationId && userId && isSupabaseConfigured()) {
        try {
          const savedMsg = await sendMessageToDb(
            conversationId, userId, userRole, '목표 합의서 확인을 요청했습니다.', 'system',
            { type: 'goal_confirm_request', originalGoalId: messageId }
          )
          setMessages(prev => prev.map(m =>
            m.id === tempId ? { ...m, id: savedMsg.id } : m
          ))
        } catch (err) {
          console.error('목표합의서 확인요청 전송 실패:', err)
        }
      }
    } else {
      // 양측 모두 동의 → 완료 메시지
      const completeMessage = {
        id: Date.now() + Math.random(),
        sender: 'system',
        senderName: '시스템',
        content: '목표 합의가 완료되었습니다. 이제 코칭을 시작할 수 있습니다!',
        timestamp: new Date().toISOString(),
        type: 'system',
      }
      setMessages(prev => [...prev, completeMessage])

      if (conversationId && userId && isSupabaseConfigured()) {
        try {
          await sendMessageToDb(
            conversationId, userId, userRole, '목표 합의가 완료되었습니다. 이제 코칭을 시작할 수 있습니다!', 'system',
            { type: 'goal_completed', originalGoalId: messageId }
          )

          // 코칭 주제 저장 (피코치 userId 필요)
          const targetUserId = coacheeUserId || (userRole === 'coachee' ? userId : null)
          console.log('=== 목표 합의 완료 - 코칭 주제 저장 시도 ===')
          console.log('targetUserId:', targetUserId)
          console.log('coacheeUserId:', coacheeUserId)
          console.log('userRole:', userRole)
          console.log('userId:', userId)
          console.log('goals:', currentGoal?.goalData?.goals)

          if (targetUserId && currentGoal?.goalData?.goals) {
            try {
              await saveCoachingTopicsFromGoal(targetUserId, currentGoal.goalData.goals)
              console.log('코칭 주제 저장 완료!')
            } catch (topicErr) {
              console.error('코칭 주제 저장 실패:', topicErr)
            }
          } else {
            console.warn('코칭 주제 저장 건너뜀 - targetUserId 또는 goals 없음')
          }
        } catch (err) {
          console.error('목표합의 완료 처리 실패:', err)
        }
      }
    }
  }

  // 새 목표 합의서 작성 (확정된 합의서에서)
  const handleNewGoalFromView = () => {
    setViewingGoalMessage(null)
    setEditingGoalMessage(null)
    setShowGoalPanel(true)
  }

  // 목표 합의서 삭제
  const handleDeleteGoal = async () => {
    if (!viewingGoalMessage) return

    const confirmDelete = window.confirm('이 목표 합의서를 삭제하시겠습니까?')
    if (!confirmDelete) return

    const messageId = viewingGoalMessage.id

    // 로컬 상태에서 제거
    setMessages(prev => prev.filter(m => m.id !== messageId))
    setViewingGoalMessage(null)

    // Supabase에서 삭제
    if (isSupabaseConfigured()) {
      try {
        const { supabase } = await import('../../lib/supabase')
        await supabase.from('messages').delete().eq('id', messageId)
      } catch (err) {
        console.error('목표 합의서 삭제 실패:', err)
      }
    }
  }

  // ===== 유틸 =====
  const closeAllPanels = (except) => {
    if (except !== 'goal') setShowGoalPanel(false)
    if (except !== 'goal_view') setViewingGoalMessage(null)
    if (except !== 'declaration_create') setShowDeclarationCreatePanel(false)
    if (except !== 'declaration_view') setViewingDeclaration(null)
    if (except !== 'task') setShowTaskPanel(false)
    if (except !== 'task_submit') { setShowTaskSubmitPanel(false); setSubmittingTaskId(null) }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }

  const hasOpenPanel = showGoalPanel || viewingGoalMessage || showDeclarationCreatePanel || viewingDeclaration || showTaskPanel || showTaskSubmitPanel

  return (
    <div className="flex gap-3 relative">
      <Card className={`h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] min-h-[300px] md:min-h-[400px] max-h-[800px] flex flex-col transition-all duration-300 w-full ${hasOpenPanel ? 'lg:flex-1' : ''}`}>
        <CardHeader className="flex-shrink-0 border-b py-2 md:py-3">
          <div className="flex items-center gap-2 md:gap-3">
            <Avatar name={otherSenderName} size="sm" />
            <div>
              <CardTitle className="text-xs md:text-sm">{otherSenderName}</CardTitle>
              <p className="text-[10px] md:text-xs text-green-500">온라인</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 md:space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-gray-600 font-medium mb-2">아직 대화가 없습니다</h3>
              <p className="text-sm text-gray-400">
                {userRole === 'coach'
                  ? '피코치에게 먼저 메시지를 보내보세요.'
                  : '코치님이 곧 연락드릴 거예요.'}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender === userRole}
                userRole={userRole}
                formatTime={formatTime}
                onViewGoal={handleViewGoal}
                onViewDeclaration={handleViewDeclaration}
                onTaskComplete={handleTaskComplete}
                onTaskSubmit={handleOpenTaskSubmit}
                onOpenFeedback={handleOpenFeedbackModal}
                onNavigateToReflection={handleNavigateToReflection}
                onGoalAgree={handleGoalAgreeFromCard}
                messages={messages}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {userRole === 'coach' && (
          <div className="px-2 md:px-3 py-1.5 md:py-2 border-t bg-gray-50">
            <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {!declarationCompleted && (
                <QuickAction label="참여 선언서" icon={ScrollText} onClick={handleStartDeclaration} primary />
              )}
              {declarationCompleted ? (
                <QuickAction label="목표 합의서" icon={Target} onClick={handleStartGoalAgreement} primary />
              ) : (
                <QuickAction label="목표 합의서" icon={Target} disabled tooltip="선언서 완료 후 작성 가능" />
              )}
              {declarationCompleted && (
                <QuickAction label="과제 부여" icon={ClipboardList} onClick={handleStartTask} />
              )}
            </div>
          </div>
        )}

        <div className="p-2 md:p-3 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지 입력..."
            className="flex-1 min-w-0 px-3 py-2 text-sm bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2 flex-shrink-0 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {showGoalPanel && (
        <GoalAgreementPanel
          userRole={userRole}
          editingMessage={editingGoalMessage}
          onClose={() => { setShowGoalPanel(false); setEditingGoalMessage(null) }}
          onSubmit={handleGoalSubmit}
        />
      )}

      {viewingGoalMessage && (
        <GoalViewPanel
          message={viewingGoalMessage}
          userRole={userRole}
          onClose={() => setViewingGoalMessage(null)}
          onEdit={handleEditGoal}
          onAgree={handleGoalAgree}
          onNewGoal={handleNewGoalFromView}
          onDelete={handleDeleteGoal}
        />
      )}

      {showDeclarationCreatePanel && (
        <DeclarationCreatePanel
          onClose={() => setShowDeclarationCreatePanel(false)}
          onSubmit={handleDeclarationSubmit}
        />
      )}

      {viewingDeclaration && (
        <DeclarationViewPanel
          message={viewingDeclaration}
          userRole={userRole}
          onClose={() => setViewingDeclaration(null)}
          onCheck={handleDeclarationCheck}
          onAgree={handleDeclarationAgree}
        />
      )}

      {showTaskPanel && (
        <TaskCreatePanel
          onClose={() => setShowTaskPanel(false)}
          onSubmit={handleTaskSubmit}
        />
      )}

      {showTaskSubmitPanel && (
        <TaskSubmitPanel
          taskMessage={messages.find(m => m.id === submittingTaskId)}
          onClose={() => { setShowTaskSubmitPanel(false); setSubmittingTaskId(null) }}
          onSubmit={handleTaskSubmitContent}
        />
      )}

      {/* 피드백 작성 모달 */}
      {feedbackingTaskId && (
        <FeedbackModal
          taskMessage={messages.find(m => m.id === feedbackingTaskId)}
          feedbackText={feedbackText}
          setFeedbackText={setFeedbackText}
          onClose={handleCloseFeedbackModal}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </div>
  )
}

// ===== MessageBubble =====
function MessageBubble({ message, isOwn, userRole, formatTime, onViewGoal, onViewDeclaration, onTaskComplete, onTaskSubmit, onOpenFeedback, onNavigateToReflection, onGoalAgree, messages }) {
  // 선언서 확인 요청
  if (message.type === 'declaration_confirm_request') {
    const originalDeclaration = messages?.find(m => m.id === message.originalDeclarationId)

    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && <Avatar name={message.senderName} size="xs" />}
        <div className={`max-w-[90%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className="w-56 rounded-xl border-2 border-amber-200 bg-amber-50 overflow-hidden text-sm">
            <div className="px-3 py-2 bg-amber-100 flex items-center gap-1.5">
              <ScrollText className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-800">선언서 확인 요청</span>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-gray-600">
                피코치가 참여 선언서에 동의했습니다. 코치님도 확인해주세요.
              </p>
              {userRole === 'coach' && originalDeclaration && !originalDeclaration.declarationData?.coachAgreed && (
                <button
                  onClick={() => onViewDeclaration(originalDeclaration)}
                  className="w-full py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  내용 확인하고 동의하기
                </button>
              )}
              {originalDeclaration?.declarationData?.coachAgreed && (
                <div className="flex items-center justify-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3" /> 확인 완료
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 목표합의서 확인 요청
  if (message.type === 'goal_confirm_request') {
    const originalGoal = messages?.find(m => m.id === message.originalGoalId)
    const senderName = message.sender === 'coach' ? '코치' : '피코치'
    const otherRole = message.sender === 'coach' ? 'coachee' : 'coach'
    const hasOtherAgreed = originalGoal?.goalData?.agreedBy?.includes(otherRole)

    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && <Avatar name={message.senderName} size="xs" />}
        <div className={`max-w-[90%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className="w-56 rounded-xl border-2 border-emerald-200 bg-emerald-50 overflow-hidden text-sm">
            <div className="px-3 py-2 bg-emerald-100 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="font-medium text-blue-800">목표합의서 확인 요청</span>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-gray-600">
                {senderName}가 목표 합의서에 동의했습니다. 확인해주세요.
              </p>
              {!isOwn && originalGoal && !hasOtherAgreed && (
                <button
                  onClick={() => onViewGoal(originalGoal)}
                  className="w-full py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  내용 확인하고 동의하기
                </button>
              )}
              {originalGoal?.goalData?.status === 'confirmed' && (
                <div className="flex items-center justify-center gap-1 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3" /> 합의 완료
                </div>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 선언서
  if (message.type === 'declaration') {
    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && <Avatar name={message.senderName} size="xs" />}
        <div className={`max-w-[90%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <DeclarationCard
            message={message}
            userRole={userRole}
            onView={() => onViewDeclaration(message)}
          />
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 목표 합의서
  if (message.type === 'goal_agreement') {
    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && <Avatar name={message.senderName} size="xs" />}
        <div className={`max-w-[90%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <GoalAgreementCard
            message={message}
            userRole={userRole}
            isOwn={isOwn}
            onView={() => onViewGoal(message)}
            onAgree={() => onGoalAgree && onGoalAgree(message)}
          />
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 과제
  if (message.type === 'task') {
    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && <Avatar name={message.senderName} size="xs" />}
        <div className={`max-w-[90%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <TaskCard
            message={message}
            userRole={userRole}
            onComplete={() => onTaskComplete(message.id)}
            onSubmit={onTaskSubmit}
          />
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 과제 제출
  if (message.type === 'task_submission') {
    const { submissionData } = message
    const hasFeedback = submissionData?.feedback
    return (
      <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && <Avatar name={message.senderName} size="xs" />}
        <div className={`max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className="rounded-xl border-2 border-green-200 bg-green-50 overflow-hidden">
            <div className="px-3 py-2 bg-green-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800 text-sm">과제 제출 완료</span>
              </div>
              {hasFeedback && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">피드백 완료</span>
              )}
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-gray-500 font-medium">📋 {submissionData.taskTitle}</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-2 rounded-lg border border-green-100">
                {submissionData.content}
              </p>
              {submissionData.images?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {submissionData.images.map((img, idx) => (
                    img.url ? (
                      <img
                        key={idx}
                        src={img.url}
                        alt={img.name || `이미지 ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-green-200 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(img.url, '_blank')}
                      />
                    ) : (
                      <div key={idx} className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500">
                        이미지 {idx + 1}
                      </div>
                    )
                  ))}
                </div>
              )}
              {hasFeedback && (
                <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-xs text-emerald-600 font-medium mb-1">💬 코치 피드백</p>
                  <p className="text-sm text-gray-700">{submissionData.feedback}</p>
                </div>
              )}
              {/* 코치용 피드백 버튼 */}
              {userRole === 'coach' && !hasFeedback && (
                <button
                  onClick={() => onOpenFeedback && onOpenFeedback(message.id)}
                  className="w-full mt-2 py-2 bg-gradient-to-r from-amber-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-blue-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  피드백 작성하기
                </button>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    )
  }

  // 회기 종료 메시지
  if (message.type === 'session_end') {
    // metadata에 요약 정보가 있으면 SessionSummaryCard 사용
    const metadata = message.metadata || message
    const hasRichData = metadata.summary || metadata.scoreChanges?.length > 0

    if (hasRichData) {
      return (
        <div className="flex justify-center my-4">
          <SessionSummaryCard message={message} userRole={userRole} />
        </div>
      )
    }

    // 기존 간단한 회기 종료 카드 (하위 호환)
    const sessionNumber = message.sessionNumber || message.sessionData?.sessionNumber || metadata.sessionNumber
    const endedAt = message.endedAt || message.sessionData?.endedAt || metadata.endedAt

    return (
      <div className="flex justify-center my-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl px-6 py-5 max-w-sm text-center shadow-sm">
          <div className="w-14 h-14 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <p className="font-bold text-green-800 text-lg mb-2">
            {sessionNumber}회기 종료
          </p>
          <p className="text-sm text-green-700 mb-3">
            오늘 세션 수고하셨습니다!
          </p>
          {endedAt && (
            <p className="text-xs text-green-600 mb-3">
              {new Date(endedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
          {/* 피코치에게만 성찰일지 버튼 표시 */}
          {userRole === 'coachee' && onNavigateToReflection && (
            <button
              onClick={onNavigateToReflection}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
            >
              <ScrollText className="w-4 h-4" />
              성찰일지 작성하기
            </button>
          )}
        </div>
      </div>
    )
  }

  // 시스템 메시지
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          {message.content}
        </div>
      </div>
    )
  }

  // 일반 메시지
  return (
    <div className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && <Avatar name={message.senderName} size="xs" />}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-3 py-2 rounded-2xl text-sm ${
          isOwn ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  )
}

// ===== GoalAgreementPanel =====
function GoalAgreementPanel({ userRole, editingMessage, onClose, onSubmit }) {
  const initialGoals = editingMessage?.goalData?.goals || [
    { id: 1, topic: '', desiredResult: '', currentScore: 5, targetScore: 7 }
  ]
  const [goals, setGoals] = useState(initialGoals)

  const isEditing = !!editingMessage
  const senderName = editingMessage?.senderName || ''

  const addGoal = () => {
    if (goals.length < 3) {
      setGoals([...goals, { id: Date.now(), topic: '', desiredResult: '', currentScore: 5, targetScore: 7 }])
    }
  }

  const removeGoal = (id) => {
    if (goals.length > 1) setGoals(goals.filter(g => g.id !== id))
  }

  const updateGoal = (id, field, value) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  return (
    <SidePanel
      title={isEditing ? '합의서 수정' : '합의서 작성'}
      icon={Target}
      iconColor="text-emerald-600"
      headerBg="bg-emerald-50"
      headerTextColor="text-blue-900"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" size="sm">취소</Button>
          <Button onClick={() => onSubmit(goals)} className="flex-1" size="sm" disabled={!goals.some(g => g.topic)}>
            <Send className="w-4 h-4 mr-1" /> 보내기
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {isEditing && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            {senderName}님 합의서를 수정합니다
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">추천 주제 (클릭하여 선택)</label>
          <div className="flex flex-wrap gap-1.5">
            {TOPIC_SUGGESTIONS.map((topic) => (
              <button
                key={topic}
                onClick={() => {
                  const emptyGoal = goals.find(g => !g.topic)
                  if (emptyGoal) updateGoal(emptyGoal.id, 'topic', topic)
                }}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {goals.map((goal, index) => (
          <div key={goal.id} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">목표 {index + 1}</span>
              {goals.length > 1 && (
                <button onClick={() => removeGoal(goal.id)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">코칭 주제</label>
                <input
                  type="text"
                  value={goal.topic}
                  onChange={(e) => updateGoal(goal.id, 'topic', e.target.value)}
                  placeholder="예: 공부 시작 전환"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">바람직한 결과</label>
                <textarea
                  value={goal.desiredResult}
                  onChange={(e) => updateGoal(goal.id, 'desiredResult', e.target.value)}
                  placeholder="이 목표가 달성되면 어떤 변화가 있을까요?"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-2">
                    현재 점수: <span className="text-emerald-600 font-bold text-base">{goal.currentScore}</span>점
                  </label>
                  <input type="range" min="1" max="10" value={goal.currentScore} onChange={(e) => updateGoal(goal.id, 'currentScore', parseInt(e.target.value))} className="w-full" />
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 block mb-2">
                    목표 점수: <span className="text-green-600 font-bold text-base">{goal.targetScore}</span>점
                  </label>
                  <input type="range" min="1" max="10" value={goal.targetScore} onChange={(e) => updateGoal(goal.id, 'targetScore', parseInt(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {goals.length < 3 && (
          <button
            onClick={addGoal}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> 목표 추가 (최대 3개)
          </button>
        )}
      </div>
    </SidePanel>
  )
}

// ===== GoalViewPanel =====
function GoalViewPanel({ message, userRole, onClose, onEdit, onAgree, onNewGoal, onDelete }) {
  const { goalData, senderName } = message
  const { version = 1, goals = [], agreedBy = [], status } = goalData || {}
  const isOwn = message.sender === userRole
  const hasAgreed = agreedBy.includes(userRole)
  const otherRole = userRole === 'coach' ? 'coachee' : 'coach'
  const otherHasAgreed = agreedBy.includes(otherRole)
  const isConfirmed = status === 'confirmed'
  const isCoach = userRole === 'coach'

  // 동의 버튼 표시 조건: 아직 동의 안 했고, 완료 상태 아님
  const canAgree = !hasAgreed && !isConfirmed
  // 수정 제안은 자신이 보낸 게 아니고 완료 상태 아닐 때만
  const canEdit = !isOwn && !isConfirmed

  return (
    <SidePanel
      title={`목표 합의서 v${version}`}
      icon={FileText}
      iconColor="text-emerald-600"
      headerBg="bg-emerald-50"
      headerTextColor="text-blue-900"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {canAgree && (
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" onClick={onEdit} className="flex-1" size="sm">
                  <Edit3 className="w-4 h-4 mr-1" /> 수정 제안
                </Button>
              )}
              <Button onClick={onAgree} className={canEdit ? "flex-1" : "w-full"} size="sm">
                <CheckCircle className="w-4 h-4 mr-1" /> 동의
              </Button>
            </div>
          )}
          {hasAgreed && !isConfirmed && (
            <div className="text-center text-sm text-emerald-600 py-2">
              동의 완료 - {otherHasAgreed ? '합의 완료!' : '상대방 확인 대기'}
            </div>
          )}
          {isConfirmed && (
            <>
              <div className="text-center text-sm text-green-600 py-2 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> 목표 합의가 완료되었습니다
              </div>
              {isCoach && onNewGoal && (
                <Button onClick={onNewGoal} className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> 새 목표 합의서 작성
                </Button>
              )}
            </>
          )}
          <div className="flex gap-2">
            {isCoach && onDelete && (
              <Button variant="outline" onClick={onDelete} className="flex-1 text-red-600 border-red-200 hover:bg-red-50" size="sm">
                <X className="w-4 h-4 mr-1" /> 삭제
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className={isCoach && onDelete ? "flex-1" : "w-full"} size="sm">닫기</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-2 bg-gray-100 rounded-lg text-sm text-gray-600 text-center">
          {senderName}님이 보낸 합의서
        </div>

        {goals.map((goal, index) => (
          <div key={goal.id || index} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">목표 {index + 1}</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">코칭 주제</label>
                <p className="text-sm font-medium text-gray-900 bg-emerald-50 px-3 py-2 rounded-lg">
                  {goal.topic || '(미입력)'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">바람직한 결과</label>
                <p className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg min-h-[40px]">
                  {goal.desiredResult || '(미입력)'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <label className="text-xs text-gray-500 block mb-1">현재 점수</label>
                  <span className="text-2xl font-bold text-emerald-600">{goal.currentScore}</span>
                  <span className="text-sm text-gray-500">점</span>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <label className="text-xs text-gray-500 block mb-1">목표 점수</label>
                  <span className="text-2xl font-bold text-green-600">{goal.targetScore}</span>
                  <span className="text-sm text-gray-500">점</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SidePanel>
  )
}

// ===== DeclarationCreatePanel =====
function DeclarationCreatePanel({ onClose, onSubmit }) {
  const [customPromises, setCustomPromises] = useState(['', ''])

  const handleSubmit = () => {
    const filteredPromises = customPromises.filter(p => p.trim())
    onSubmit(filteredPromises)
  }

  const updatePromise = (index, value) => {
    const newPromises = [...customPromises]
    newPromises[index] = value
    setCustomPromises(newPromises)
  }

  return (
    <SidePanel
      title="참여 선언서 보내기"
      icon={ScrollText}
      iconColor="text-purple-600"
      headerBg="bg-purple-50"
      headerTextColor="text-purple-900"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" size="sm">취소</Button>
          <Button onClick={handleSubmit} className="flex-1 bg-purple-600 hover:bg-purple-700" size="sm">
            <Send className="w-4 h-4 mr-1" /> 피코치에게 보내기
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-1">코칭 참여 선언서</h4>
          <p className="text-xs text-purple-700">
            코칭을 시작하기 전, 서로의 역할과 약속을 확인합니다.
          </p>
        </div>

        <div className="space-y-2">
          {DECLARATION_SECTIONS.map(section => (
            <div key={section.id} className="flex items-start gap-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-700">{section.title}</span>
                <span className="text-gray-500"> - {section.summary}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            우리 코칭의 추가 약속 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            이 피코치와 특별히 합의하고 싶은 내용을 추가할 수 있습니다.
          </p>
          {customPromises.map((promise, index) => (
            <input
              key={index}
              type="text"
              value={promise}
              onChange={(e) => updatePromise(index, e.target.value)}
              placeholder={`예: ${index === 0 ? '답변이 늦어져도 재촉하지 않습니다' : '힘든 날에는 계획을 줄일 수 있습니다'}`}
              className="w-full px-3 py-2 mb-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          ))}
        </div>
      </div>
    </SidePanel>
  )
}

// ===== DeclarationViewPanel =====
function DeclarationViewPanel({ message, userRole, onClose, onCheck, onAgree }) {
  const { declarationData } = message
  const { customPromises = [], coacheeChecked = [], coachChecked = [] } = declarationData

  const myChecked = userRole === 'coachee' ? coacheeChecked : coachChecked
  const isCoachee = userRole === 'coachee'
  const hasAgreed = isCoachee ? declarationData.coacheeAgreed : declarationData.coachAgreed
  const isWaitingForOther = (!isCoachee && !declarationData.coacheeAgreed)

  const mySections = DECLARATION_SECTIONS.filter(s =>
    s.id === 'common' || s.id === 'scope' || s.id === userRole
  )

  const allChecked = mySections.every(s => myChecked.includes(s.id))
  const [expandedSection, setExpandedSection] = useState(null)

  const handleSectionCheck = (sectionId) => {
    const isChecked = myChecked.includes(sectionId)
    onCheck(message.id, sectionId, 0, !isChecked)
  }

  return (
    <SidePanel
      title="참여 선언서"
      icon={ScrollText}
      iconColor="text-purple-600"
      headerBg="bg-purple-50"
      headerTextColor="text-purple-900"
      onClose={onClose}
      footer={
        <div className="space-y-2">
          {!hasAgreed && !isWaitingForOther && (
            <Button
              onClick={onAgree}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="sm"
              disabled={!allChecked}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {allChecked ? '동의합니다' : `${mySections.length - myChecked.length}개 항목 확인 필요`}
            </Button>
          )}
          {hasAgreed && (
            <div className="text-center text-sm text-purple-600 py-2">
              동의 완료 {!declarationData.coachAgreed && '- 코치님 확인 대기'}
            </div>
          )}
          {isWaitingForOther && !hasAgreed && (
            <div className="text-center text-sm text-gray-500 py-2">
              피코치 동의 대기중
            </div>
          )}
          <Button variant="outline" onClick={onClose} className="w-full" size="sm">닫기</Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 text-center">
          코치와 피코치가 함께 지킬 약속입니다
        </p>

        {mySections.map((section) => {
          const isChecked = myChecked.includes(section.id)
          const isExpanded = expandedSection === section.id

          return (
            <div key={section.id} className={`border-2 rounded-xl overflow-hidden transition-colors ${
              isChecked ? 'border-purple-300 bg-purple-50' : 'border-gray-200'
            }`}>
              <div className="p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleSectionCheck(section.id)}
                    disabled={hasAgreed}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{section.title}</span>
                    <p className="text-sm text-gray-600 mt-1">{section.summary}</p>
                  </div>
                </label>

                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="mt-2 ml-8 text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  {isExpanded ? '접기' : '자세히 보기'}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 ml-8 space-y-1">
                  {section.details.map((detail, idx) => (
                    <p key={idx} className="text-xs text-gray-500 flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {detail}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {customPromises.length > 0 && (
          <div className="border-2 border-gray-200 rounded-xl p-4">
            <span className="font-medium text-gray-900">추가 약속</span>
            <div className="mt-2 space-y-1">
              {customPromises.map((promise, idx) => (
                <p key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  {promise}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </SidePanel>
  )
}

// ===== TaskCreatePanel =====
function TaskCreatePanel({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [targetCount, setTargetCount] = useState(5)

  const handleSubmit = () => {
    if (!title.trim()) return
    onSubmit({ title, description, dueDate: dueDate || null, targetCount })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <SidePanel
      title="과제 부여하기"
      icon={ClipboardList}
      iconColor="text-teal-600"
      headerBg="bg-teal-50"
      headerTextColor="text-teal-900"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" size="sm">취소</Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
            size="sm"
            disabled={!title.trim()}
          >
            <Send className="w-4 h-4 mr-1" /> 과제 보내기
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 안내 메시지 */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-700">
          간단하게 과제를 보내면, 피코치가 실행과제 페이지에서 구체적인 실행 계획을 세울 수 있습니다.
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            과제 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 아침 루틴 실천하기"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            상세 설명 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="과제에 대한 추가 설명이나 팁을 적어주세요"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            목표 횟수
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="14"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-lg font-bold text-teal-600 w-12 text-center">
              {targetCount}회
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            기한 <span className="text-gray-400 font-normal">(선택)</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setDueDate(today)}
            className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            오늘
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date()
              tomorrow.setDate(tomorrow.getDate() + 1)
              setDueDate(tomorrow.toISOString().split('T')[0])
            }}
            className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            내일
          </button>
          <button
            onClick={() => {
              const nextWeek = new Date()
              nextWeek.setDate(nextWeek.getDate() + 7)
              setDueDate(nextWeek.toISOString().split('T')[0])
            }}
            className="flex-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            일주일 후
          </button>
        </div>
      </div>
    </SidePanel>
  )
}

// ===== TaskSubmitPanel =====
function TaskSubmitPanel({ taskMessage, onClose, onSubmit, userId }) {
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const taskTitle = taskMessage?.taskData?.title || '과제'

  const handleSubmit = () => {
    if (!content.trim() && images.length === 0) return
    onSubmit(content, images)
  }

  const handleImageAdd = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      // 파일을 Base64로 변환하여 미리보기 및 저장
      const newImages = await Promise.all(
        Array.from(files).map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              resolve({
                id: Date.now() + Math.random(),
                name: file.name,
                url: reader.result, // Base64 데이터 URL
                file: file // 나중에 업로드용
              })
            }
            reader.readAsDataURL(file)
          })
        })
      )
      setImages(prev => [...prev, ...newImages])
    } catch (err) {
      console.error('이미지 처리 실패:', err)
      alert('이미지를 처리하는 데 실패했습니다.')
    } finally {
      setIsUploading(false)
      // input 초기화 (같은 파일 다시 선택 가능하게)
      e.target.value = ''
    }
  }

  const handleImageRemove = (imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId))
  }

  return (
    <SidePanel
      title="과제 제출"
      icon={Send}
      iconColor="text-emerald-600"
      headerBg="bg-emerald-50"
      headerTextColor="text-blue-900"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" size="sm">취소</Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            size="sm"
            disabled={(!content.trim() && images.length === 0) || isUploading}
          >
            <Send className="w-4 h-4 mr-1" /> 제출하기
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 과제 정보 */}
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center gap-2 text-teal-800">
            <ClipboardList className="w-4 h-4" />
            <span className="font-medium text-sm">{taskTitle}</span>
          </div>
          {taskMessage?.taskData?.description && (
            <p className="text-xs text-teal-600 mt-1">{taskMessage.taskData.description}</p>
          )}
        </div>

        {/* 제출 내용 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            제출 내용 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="과제를 수행한 내용을 작성해주세요. 느낀 점이나 어려웠던 점도 함께 적어주세요."
            rows={5}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* 이미지 첨부 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            이미지 첨부 <span className="text-gray-400 font-normal">(선택)</span>
          </label>

          {/* 숨겨진 파일 input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((img) => (
                <div key={img.id} className="relative">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => handleImageRemove(img.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleImageAdd}
            disabled={isUploading}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Paperclip className="w-4 h-4" />
                이미지 추가하기
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1 text-center">
            과제 인증 사진이나 관련 자료를 첨부할 수 있어요
          </p>
        </div>

        {/* 팁 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700">
            💡 <strong>Tip:</strong> 과제를 하면서 느낀 점, 어려웠던 점, 다음에 시도해볼 것 등을 함께 적으면 코치가 더 좋은 피드백을 드릴 수 있어요!
          </p>
        </div>
      </div>
    </SidePanel>
  )
}

// ===== FeedbackModal (코치용 피드백 작성) =====
function FeedbackModal({ taskMessage, feedbackText, setFeedbackText, onClose, onSubmit }) {
  const submissionData = taskMessage?.submissionData || {}
  const canSubmit = feedbackText.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-amber-500 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">피드백 작성</h2>
                <p className="text-blue-100 text-sm">피코치의 과제 제출에 피드백을 보내세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 제출물 요약 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {submissionData.taskTitle || '과제 제출'}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {submissionData.content || '내용 없음'}
              </p>
              {submissionData.images?.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {submissionData.images.slice(0, 3).map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                  {submissionData.images.length > 3 && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">
                      +{submissionData.images.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 피드백 입력 */}
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            피드백 내용
          </label>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="피코치의 노력을 인정하고, 다음 단계를 위한 격려나 조언을 남겨주세요..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">
            좋은 피드백은 구체적이고 격려하는 메시지입니다.
          </p>

          {/* 피드백 예시 */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-gray-500">빠른 피드백 선택</p>
            <div className="flex flex-wrap gap-2">
              {[
                '잘 하셨어요! 꾸준히 해봐요 👏',
                '좋은 시도예요! 다음엔 조금 더 구체적으로 해볼까요?',
                '훌륭해요! 이 조자 꾸준히 유지해봐요 💪',
                '수고했어요! 어려운 점이 있으면 말씀해주세요'
              ].map((text, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeedbackText(text)}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 rounded-full transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-emerald-600 hover:to-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            피드백 보내기
          </Button>
        </div>
      </div>
    </div>
  )
}
