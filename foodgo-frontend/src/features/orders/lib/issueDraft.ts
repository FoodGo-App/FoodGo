export type IssueRequest = { requestKey: string; reason: string };
export type IssueDraft = { text: string; pending: IssueRequest | null };
/** A retry must retain the complete request that may already have reached the server. */
export function prepareIssue(draft: IssueDraft, makeKey: () => string): IssueRequest {
  if (draft.pending) return draft.pending;
  const reason = draft.text.trim();
  if (!reason || reason.length > 300) throw new Error("Nhập lý do từ 1 đến 300 ký tự nhé.");
  return { requestKey: makeKey(), reason };
}
