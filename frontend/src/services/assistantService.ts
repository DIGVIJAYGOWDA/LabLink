import { apiRequest } from '@/services/api'
import type { ChatMessage, ChatResponse, Role } from '@/types/lab'

export const sendChat = (messages: ChatMessage[], role: Role, studentName?: string) =>
  apiRequest<ChatResponse>('/api/assistant/chat', {
    method: 'POST',
    body: { messages: messages.slice(-12), role, studentName: role === 'student' ? studentName : undefined },
  })
