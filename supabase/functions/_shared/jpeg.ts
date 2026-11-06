/** Strip JPEG APP1–APP15 metadata and COM segments server-side. Reject malformed framing.
 * This is metadata sanitation, not an image safety detector or a decoder. */
export function sanitizeJpeg(input: Uint8Array): Uint8Array | null {
  if (
    input.length < 4 ||
    input.length > 5242880 ||
    input[0] !== 255 ||
    input[1] !== 216
  )
    return null;
  const chunks: Uint8Array[] = [input.subarray(0, 2)];
  let at = 2;
  while (at < input.length) {
    if (input[at] !== 255) return null;
    const start = at;
    while (input[at] === 255) at++;
    const marker = input[at++];
    if (marker === 0xd9) {
      chunks.push(input.subarray(start, at));
      break;
    }
    if (marker === 0xda) {
      if (input[input.length - 2] !== 255 || input[input.length - 1] !== 0xd9)
        return null;
      chunks.push(input.subarray(start));
      at = input.length;
      break;
    }
    if (marker === 0xd8 || marker === 0 || marker === undefined) return null;
    if (marker >= 0xd0 && marker <= 0xd7) {
      chunks.push(input.subarray(start, at));
      continue;
    }
    const length = (input[at] << 8) | input[at + 1];
    if (length < 2 || at + length > input.length) return null;
    at += length;
    if (!(marker >= 0xe1 && marker <= 0xef) && marker !== 0xfe)
      chunks.push(input.subarray(start, at));
  }
  if (at !== input.length) return null;
  const size = chunks.reduce((n, c) => n + c.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
