import type {
  CallAccess,
  Conversation,
  Message,
  MessageInput,
  Requester,
  Review,
  ReviewInput,
} from "../../../shared/types/domain";
import { normalizeMessage } from "../../../shared/api/adapters";
export const communicationService = (request: Requester) => ({
  conversation: (id: string) =>
    request<Conversation>(`/orders/${id}/conversation`),
  messages: async (id: string, beforeId?: string) =>
    (
      await request<Message[]>(
        `/orders/${id}/messages?limit=20${beforeId ? `&beforeId=${encodeURIComponent(beforeId)}` : ""}`,
      )
    ).map(normalizeMessage),
  send: (id: string, input: MessageInput) =>
    request<Message>(`/orders/${id}/messages`, "POST", input),
  call: (id: string) =>
    request<CallAccess>(`/orders/${id}/call-access`, "POST", {}),
  review: (id: string) => request<Review>(`/orders/${id}/driver-review`),
  sendReview: (id: string, input: ReviewInput) =>
    request<Review>(`/orders/${id}/driver-review`, "POST", input),
});
