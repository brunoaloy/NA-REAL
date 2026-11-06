// CLI status may contain local credentials. Capture to a private temporary directory, never stdout.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
exports.capture = function capture(command, args, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "na-real-command-"));
  const out = fs.openSync(path.join(dir, "out"), "w", 0o600),
    err = fs.openSync(path.join(dir, "err"), "w", 0o600);
  try {
    const result = spawnSync(command, args, {
      ...options,
      stdio: ["ignore", out, err],
    });
    if (result.error || result.status !== 0)
      throw new Error("Command unavailable or failed; private output omitted");
    return fs.readFileSync(path.join(dir, "out"), "utf8");
  } finally {
    fs.closeSync(out);
    fs.closeSync(err);
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
