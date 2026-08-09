import { useState, useEffect, useCallback } from 'react'
import { coacheeService } from '../lib'

/**
 * 코치의 피코치 목록을 관리하는 훅
 * @param {string} coachId - 코치 ID
 * @returns {Object} { coachees, pending, loading, error, refetch }
 */
export function useCoachCoachees(coachId) {
  const [coachees, setCoachees] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const formatCoachee = useCallback((c) => ({
    id: c.id,
    odId: c.user_id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    matchedAt: c.matched_at,
    packageType: c.package_type,
    currentSession: c.current_session || 0,
    totalSessions: c.total_sessions || 5,
    status: c.status,
    recentScore: c.recent_score || 0,
    targetScore: c.target_score || 5,
    hasWarning: c.has_warning || false,
    declarationCompleted: c.declaration_completed,
    goalAgreementCompleted: c.goal_agreement_completed,
    topics: c.topics || []
  }), [])

  const fetchData = useCallback(async () => {
    if (!coachId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { matched, pending: pendingData } = await coacheeService.getAllCoacheesForCoach(coachId)

      const formattedCoachees = (matched || []).map(formatCoachee)
      const formattedPending = (pendingData || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        email: p.email,
        packageType: p.package_type,
        totalSessions: p.total_sessions,
        status: p.status,
        createdAt: p.created_at
      }))

      setCoachees(formattedCoachees)
      setPending(formattedPending)
    } catch (err) {
      if (err.message === 'LOCAL_MODE') {
        setError('Supabase가 설정되지 않았습니다.')
      } else {
        setError(err.message)
      }
      setCoachees([])
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [coachId, formatCoachee])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    coachees,
    pending,
    loading,
    error,
    refetch: fetchData
  }
}

/**
 * 피코치 목록만 가져오는 간단한 훅
 */
export function useCoacheeList(coachId) {
  const { coachees, loading, error, refetch } = useCoachCoachees(coachId)
  return { coachees, loading, error, refetch }
}
