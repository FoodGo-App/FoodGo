/** Use only the conversation participant supplied for the current signed-in user. */
export function conversationPeer<T extends { id: string; displayName: string }>(participants: T[], userId: string) {
  return participants.find((participant) => participant.id !== userId);
}

export function callDuration(seconds: number) {
  const elapsed = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
}

export function ratingDescription(stars: number) {
  return ["", "Chưa hài lòng", "Cần cải thiện", "Bình thường", "Hài lòng", "Rất hài lòng"][stars] ?? "";
}
