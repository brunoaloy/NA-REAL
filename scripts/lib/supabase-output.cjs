// Do not depend on terminal/OS defaults when consuming CLI output as data.
function readOnlyArgs(projectRef, file) {
  return [
    "db",
    "query",
    "--remote=" + projectRef,
    "--read-only",
    "--output",
    "json",
    "--file",
    file,
  ];
}
function parseQueryRows(output) {
  let result;
  try {
    result = JSON.parse(
      String(output)
        .replace(/^\uFEFF/, "")
        .trim(),
    );
  } catch {
    // Never echo output: it can contain definitions or private database rows.
    throw new Error(
      "A CLI não retornou JSON válido. Preparação interrompida; nenhuma migration foi aplicada.",
    );
  }
  // CLI 3 returns a row array in a regular terminal and an envelope in agent mode.
  const rows = Array.isArray(result) ? result : result?.rows;
  if (
    result?.error ||
    !Array.isArray(rows) ||
    !rows.every(
      (row) => row !== null && typeof row === "object" && !Array.isArray(row),
    )
  )
    throw new Error(
      "Resposta JSON inesperada da CLI. Preparação interrompida; nenhuma migration foi aplicada.",
    );
  return rows;
}
module.exports = { readOnlyArgs, parseQueryRows };
