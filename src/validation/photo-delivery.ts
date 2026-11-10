/** A retry uses the same receipt and never deletes metadata after an ambiguous upload. */
export async function deliverPhoto(actions: {
  ensureMetadata: () => Promise<void>;
  upload: () => Promise<{ error: unknown }>;
  exists: () => Promise<boolean>;
}) {
  await actions.ensureMetadata();
  let error: unknown;
  try {
    const result = await actions.upload();
    if (!result.error) return;
    error = result.error;
  } catch (e) {
    error = e;
  }
  // A lost response can mean the bytes arrived. Confirm the same immutable path.
  try {
    if (await actions.exists()) return;
  } catch {
    /* Preserve the original failure. */
  }
  throw error;
}
