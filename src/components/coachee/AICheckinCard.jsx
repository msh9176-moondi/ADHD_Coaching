import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { chatWithAI, isAIConfigured } from '../../lib/aiService'
import { Sparkles, Send, X, MessageCircle, Loader2 } from 'lucide-react'

export function AICheckinCard({ userName, currentGoal, currentTask }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesContainerRef = useRef(null)

  // 채팅 컨테이너 내에서만 스크롤 (페이지 전체 스크롤 방지)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleStart = () => {
    setIsOpen(true)
    if (messages.length === 0) {
      // 첫 인사 메시지
      setMessages([{
        role: 'assistant',
        content: `안녕하세요 ${userName || ''}님! 👋\n오늘 하루는 어떠셨어요?`
      }])
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const history = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))

      const response = await chatWithAI(userMessage, history, {
        name: userName,
        goal: currentGoal,
        currentTask
      })

      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      console.error('AI 응답 실패:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송해요, 잠시 문제가 생겼어요. 다시 말씀해주시겠어요?'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!isAIConfigured()) {
    return null
  }

  // 닫힌 상태 - 시작 버튼
  if (!isOpen) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-orange-50 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI 체크인</h3>
                <p className="text-sm text-gray-500">오늘 하루를 나눠보세요</p>
              </div>
            </div>
            <Button
              onClick={handleStart}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              대화 시작
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 열린 상태 - 채팅 UI
  return (
    <Card className="border-purple-200">
      <CardHeader className="py-3 bg-gradient-to-r from-purple-50 to-orange-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            AI 체크인
          </CardTitle>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-purple-100 rounded text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* 메시지 영역 */}
        <div ref={messagesContainerRef} className="h-64 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
