type Photo = { id: string; owner_id: string; content_revision: string };
type Signed = {
  path?: string | null;
  signedUrl?: string | null;
  error?: string | null;
};
/** Associate URLs by path, never by response order; one missing photo need not hide the others. */
export async function batchPhotoUrls(
  photos: Photo[],
  sign: (paths: string[]) => Promise<{ data: Signed[] | null; error: unknown }>,
) {
  if (!photos.length) return [];
  const paths = photos.map((p) => `${p.owner_id}/${p.content_revision}.jpg`);
  const result = await sign(paths);
  if (result.error) throw result.error;
  const links = new Map(
    (result.data ?? [])
      .filter((v) => !v.error && v.path && v.signedUrl)
      .map((v) => [v.path, v.signedUrl!]),
  );
  const found = photos.flatMap((p, i) => {
    const url = links.get(paths[i]);
    return url ? [{ id: p.id, url }] : [];
  });
  if (!found.length)
    throw new Error(
      "Não conseguimos carregar as fotos agora. Atualize para tentar novamente.",
    );
  return found;
}
