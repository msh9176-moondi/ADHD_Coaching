import { useStore } from '../../store/useStore'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { MessageSquare, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function CoachMessage() {
  const { lastCoachMessage } = useStore()
  const navigate = useNavigate()

  // 메시지가 없는 경우
  if (!lastCoachMessage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            코치 메시지
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">아직 메시지가 없습니다.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => navigate('/coachee/messages')}
            >
              채팅방 열기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          코치 메시지
        </CardTitle>
        {lastCoachMessage.unreadCount > 0 && (
          <Badge variant="primary" className="text-xs">
            {lastCoachMessage.unreadCount}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            {lastCoachMessage.coachName}
          </div>

          <p className="text-sm text-gray-600 line-clamp-3">
            "{lastCoachMessage.content}"
          </p>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate('/coachee/messages')}
          >
            채팅방 열기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
