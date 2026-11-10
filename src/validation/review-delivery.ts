/** Matching old approved/rejected text is not evidence that a new edit was received. */
export function confirmsPendingReview(
  row: {
    id: string;
    rating: number;
    body: string;
    moderation_state: string;
  } | null,
  value: { rating: number; body: string },
) {
  return Boolean(
    row?.id &&
    row.moderation_state === "pending" &&
    row.rating === value.rating &&
    row.body === value.body,
  );
}
