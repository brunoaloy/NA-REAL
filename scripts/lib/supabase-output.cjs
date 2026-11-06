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
  if (!result || typeof result !== "object" || !Array.isArray(result.rows))
    throw new Error(
      "Resposta JSON inesperada da CLI. Preparação interrompida; nenhuma migration foi aplicada.",
    );
  return result.rows;
}
module.exports = { readOnlyArgs, parseQueryRows };
