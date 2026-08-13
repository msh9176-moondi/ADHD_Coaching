import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set, get) => ({
      // 사용자 상태
      user: null,
      setUser: (newUser) => {
        const currentUser = get().user
        // 다른 사용자로 로그인하면 기존 데이터 초기화
        if (currentUser?.id && newUser?.id && currentUser.id !== newUser.id) {
          set({
            user: newUser,
            asrsResult: null,
            preSurvey: null,
            postSurvey: null,
            coachingPackage: null,
            matchedCoach: null,
            coacheeProfile: null,
            subscription: null,
            sessions: [],
            coachingTopics: [],
            coachingGoal: null,
            coachingAction: null,
            lastCoachMessage: null
          })
        } else {
          set({ user: newUser })
        }
      },
      logout: () => set({
        user: null,
        asrsResult: null,
        preSurvey: null,
        postSurvey: null,
        coachingPackage: null,
        matchedCoach: null,
        coacheeProfile: null,
        subscription: null,
        sessions: [],
        coachingTopics: [],
        coachingGoal: null,
        coachingAction: null,
        lastCoachMessage: null
      }),

      // 로딩 상태
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // 현재 선택된 피코치 (코치용)
      selectedCoachee: null,
      setSelectedCoachee: (coachee) => set({ selectedCoachee: coachee }),

      // 현재 세션 정보
      currentSession: null,
      setCurrentSession: (session) => set({ currentSession: session }),

      // 세션(상담 일정) 상태
      sessions: [],
      setSessions: (sessions) => set({ sessions }),
      addSession: (session) => set({ sessions: [...get().sessions, session] }),
      updateSessionInStore: (sessionId, updateData) =>
        set({
          sessions: get().sessions.map((s) =>
            s.id === sessionId ? { ...s, ...updateData } : s
          ),
        }),
      removeSession: (sessionId) =>
        set({ sessions: get().sessions.filter((s) => s.id !== sessionId) }),

      // 예약 모달 상태
      isBookingModalOpen: false,
      bookingCoachee: null,
      openBookingModal: (coachee = null) =>
        set({ isBookingModalOpen: true, bookingCoachee: coachee }),
      closeBookingModal: () =>
        set({ isBookingModalOpen: false, bookingCoachee: null }),

      // ========== 피코치 대시보드 상태 ==========

      // 코칭 진행 상태
      coachingStatus: {
        declarationCompleted: false,
        goalAgreementCompleted: false,
        nextSessionPrepared: false,
      },
      setCoachingStatus: (status) =>
        set({ coachingStatus: { ...get().coachingStatus, ...status } }),

      // 오늘의 할 일 (최대 3개)
      todayTasks: [],
      addTodayTask: (task) => {
        const tasks = get().todayTasks.filter((t) => !t.isCoachingTask)
        if (tasks.length >= 3) return
        set({ todayTasks: [...get().todayTasks, { ...task, id: `task-${Date.now()}` }] })
      },
      updateTaskStatus: (taskId, status) =>
        set({
          todayTasks: get().todayTasks.map((t) =>
            t.id === taskId ? { ...t, status } : t
          ),
        }),
      removeTask: (taskId) =>
        set({ todayTasks: get().todayTasks.filter((t) => t.id !== taskId) }),

      // 코칭에서 함께 정한 행동
      coachingAction: null,
      setCoachingAction: (action) =>
        set({ coachingAction: action }),

      // 최근 코치 메시지
      lastCoachMessage: null,
      setLastCoachMessage: (message) =>
        set({ lastCoachMessage: message }),

      // 코칭 목표
      coachingGoal: null,
      setCoachingGoal: (goal) =>
        set({ coachingGoal: { ...get().coachingGoal, ...goal } }),

      // ========== 패키지 시스템 (3/5/10 회기) ==========
      coachingPackage: {
        type: 'basic', // 'starter' (3회기), 'basic' (5회기), 'premium' (10회기)
        totalSessions: 5,
        completedSessions: 2,
        currentSession: 3,
      },
      setCoachingPackage: (pkg) =>
        set({ coachingPackage: { ...get().coachingPackage, ...pkg } }),

      // ========== 주제별 점수 ==========
      coachingTopics: [
        {
          id: 1,
          title: '공부 시작 행동 전환',
          description: '스카에 도착한 뒤 실제 공부 행동으로 전환',
          startScore: 0,
          currentScore: 4,
          targetScore: 5,
        },
        {
          id: 2,
          title: '전자기기 방해 관리',
          description: '카톡, 유튜브 대신 공부 행동을 먼저 선택',
          startScore: 0,
          currentScore: 3,
          targetScore: 5,
        },
        {
          id: 3,
          title: '복귀 행동 만들기',
          description: '공부가 끊겨도 다시 돌아올 수 있다',
          startScore: 2,
          currentScore: 4,
          targetScore: 5,
        },
      ],
      setCoachingTopics: (topics) => set({ coachingTopics: topics }),
      updateTopicScore: (topicId, currentScore) =>
        set({
          coachingTopics: get().coachingTopics.map((t) =>
            t.id === topicId ? { ...t, currentScore } : t
          ),
        }),

      // ========== 실행 기록 ==========
      executionRecords: [],
      addExecutionRecord: (record) =>
        set({
          executionRecords: [
            { ...record, id: Date.now() },
            ...get().executionRecords,
          ],
        }),
      toggleExecutionRecord: (recordId) =>
        set({
          executionRecords: get().executionRecords.map((r) =>
            r.id === recordId ? { ...r, completed: !r.completed } : r
          ),
        }),

      // ========== 다음 회기까지 과제 ==========
      sessionTasks: [],
      addSessionTask: (task) =>
        set({
          sessionTasks: [...get().sessionTasks, { ...task, id: Date.now() }],
        }),
      toggleSessionTask: (taskId) =>
        set({
          sessionTasks: get().sessionTasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        }),

      // 복귀 모달 상태
      isReturnModalOpen: false,
      openReturnModal: () => set({ isReturnModalOpen: true }),
      closeReturnModal: () => set({ isReturnModalOpen: false }),

      // ========== 알림/리마인더 시스템 ==========
      notifications: [],
      addNotification: (notification) =>
        set({
          notifications: [
            {
              id: Date.now(),
              createdAt: new Date().toISOString(),
              read: false,
              ...notification,
            },
            ...get().notifications,
          ],
        }),
      markNotificationRead: (notificationId) =>
        set({
          notifications: get().notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
        }),
      markAllNotificationsRead: () =>
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        }),
      clearNotification: (notificationId) =>
        set({
          notifications: get().notifications.filter((n) => n.id !== notificationId),
        }),
      // 코치가 피코치에게 리마인더 보내기
      sendTaskReminder: (coacheeId, taskTitle, message) =>
        get().addNotification({
          type: 'task_reminder',
          coacheeId,
          title: '과제 리마인더',
          taskTitle,
          message: message || `"${taskTitle}" 과제를 확인해주세요!`,
          from: 'coach',
        }),

      // ========== 설문 및 자가진단 ==========

      // ASRS 자가진단 결과
      asrsResult: null,
      setASRSResult: (result) => set({ asrsResult: result }),

      // 사전 설문 결과
      preSurvey: null,
      setPreSurvey: (survey) => set({ preSurvey: survey }),

      // 사후 설문 결과
      postSurvey: null,
      setPostSurvey: (survey) => set({ postSurvey: survey }),

      // 설문 결과 저장 (통합)
      setSurveyResult: (type, result) => {
        if (type === 'pre') {
          set({ preSurvey: result })
        } else if (type === 'post') {
          set({ postSurvey: result })
        }
      },

      // ========== 온보딩 상태 ==========

      // 온보딩 진행 상태
      onboardingStatus: {
        step: null, // null, 'survey', 'result', 'coach', 'complete'
        completed: false
      },
      setOnboardingStatus: (status) =>
        set({ onboardingStatus: { ...get().onboardingStatus, ...status } }),

      // 자기소개 정보
      selfIntro: null,
      setSelfIntro: (intro) => set({ selfIntro: intro }),

      // 매칭된 코치 정보
      matchedCoach: null,
      setMatchedCoach: (coach) => set({ matchedCoach: coach }),

      // 피코치 프로필 정보
      coacheeProfile: null,
      setCoacheeProfile: (profile) => set({ coacheeProfile: profile }),

      // 구독 정보
      subscription: null,
      setSubscription: (subscription) => set({ subscription: subscription }),

      // 전체 초기화 (로그아웃 시)
      resetAll: () => set({
        user: null,
        asrsResult: null,
        preSurvey: null,
        postSurvey: null,
        onboardingStatus: { step: null, completed: false },
        matchedCoach: null,
        coacheeProfile: null,
        subscription: null
      }),
    }),
    {
      name: 'floca-storage',
      partialize: (state) => ({
        user: state.user,
        asrsResult: state.asrsResult,
        preSurvey: state.preSurvey,
        postSurvey: state.postSurvey,
        onboardingStatus: state.onboardingStatus,
        selfIntro: state.selfIntro,
        matchedCoach: state.matchedCoach,
        coachingPackage: state.coachingPackage,
        coacheeProfile: state.coacheeProfile,
        subscription: state.subscription
      }),
    }
  )
)
