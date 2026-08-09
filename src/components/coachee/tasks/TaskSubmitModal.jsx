import { useState } from 'react'
import { X, Send, Upload, Image, Paperclip } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../common/Card'
import { Button } from '../../common/Button'

export function TaskSubmitModal({ task, onClose, onSubmit }) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const newAttachments = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }))
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    onSubmit({ content, attachments })
  }

  const canSubmit = content.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-600" />
            과제 제출
          </CardTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{task.title}</p>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              실행 결과 및 소감
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="과제를 어떻게 수행했는지 적어주세요. 어려웠던 점이나 느낀 점도 좋아요."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사진/파일 첨부 (선택)
            </label>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg"
                  >
                    {file.type?.startsWith('image/') ? (
                      <Image className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Paperclip className="w-4 h-4 text-purple-600" />
                    )}
                    <span className="text-sm text-purple-700">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-purple-400 hover:text-purple-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">파일 선택</span>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              제출하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
