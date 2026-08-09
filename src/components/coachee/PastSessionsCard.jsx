import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Modal } from '../common/Modal'
import {
  History, Calendar, Clock, ChevronRight, FileText,
  MessageSquare, Loader2
} from 'lucide-react'
import { getPastSessions } from '../../lib/sessionService'
import { useStore } from '../../store/useStore'
import { isSupabaseConfigured } from '../../lib/supabase'

export function PastSessionsCard() {
  const { user } = useStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    async function loadSessions() {
      if (!user?.id || !isSupabaseConfigured()) {
        setLoading(false)
        return
      }

      try {
        const data = await getPastSessions(user.id, 5)
        setSessions(data)
      } catch (err) {
        console.error('지난 세션 로드 실패:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
  }, [user?.id])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            지난 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            아직 완료된 세션이 없습니다
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-purple-600" />
            지난 세션
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => {
              const hasNote = session.session_notes && session.session_notes.length > 0
              const note = hasNote ? session.session_notes[0] : null

              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {session.session_number === 0 ? '사후관리' : `${session.session_number}회기`}
                      </span>
                      {hasNote && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                          일지
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{formatDate(session.date)}</span>
                      {session.time && (
                        <>
                          <span>·</span>
                          <span>{session.time}</span>
                        </>
                      )}
                    </div>
                    {session.topic && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {session.topic}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 세션 상세 모달 */}
      <SessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </>
  )
}

function SessionDetailModal({ session, onClose }) {
  if (!session) return null

  const hasNote = session.session_notes && session.session_notes.length > 0
  const note = hasNote ? session.session_notes[0] : null

  // 노트 데이터 파싱
  let insights = {}
  let clientState = {}
  if (note) {
    try {
      insights = typeof note.insights === 'string' ? JSON.parse(note.insights) : (note.insights || {})
      clientState = typeof note.client_state === 'string' ? JSON.parse(note.client_state) : (note.client_state || {})
    } catch (e) {
      console.error('노트 파싱 실패:', e)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Modal
      isOpen={!!session}
      onClose={onClose}
      title={`${session.session_number === 0 ? '사후관리' : `${session.session_number}회기`} 세션`}
    >
      <div className="space-y-4">
        {/* 기본 정보 */}
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {formatDate(session.date)}
          </div>
          {session.time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {session.time}
            </div>
          )}
        </div>

        {/* 세션 주제 */}
        {session.topic && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">세션 주제</h4>
            <p className="text-sm text-gray-600 p-3 bg-purple-50 rounded-lg">
              {session.topic}
            </p>
          </div>
        )}

        {/* 세션 노트 */}
        {hasNote ? (
          <div className="space-y-4">
            {note.summary && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  세션 요약
                </h4>
                <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  {note.summary}
                </p>
              </div>
            )}

            {insights.achievement && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">달성한 것</h4>
                <p className="text-sm text-gray-600 p-3 bg-green-50 rounded-lg">
                  {insights.achievement}
                </p>
              </div>
            )}

            {note.next_actions && note.next_actions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">다음 할 일</h4>
                <ul className="space-y-1">
                  {note.next_actions.map((action, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-600 p-2 bg-amber-50 rounded-lg flex items-start gap-2"
                    >
                      <span className="text-amber-500">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">세션 노트가 없습니다</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
