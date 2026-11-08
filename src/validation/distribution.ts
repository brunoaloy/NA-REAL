export function distributionIssues(
  config: {
    ios?: { bundleIdentifier?: string };
    android?: { package?: string };
    extra?: { eas?: { projectId?: string } };
  },
  platform = "ios",
) {
  const issues: string[] = [];
  const id =
    platform === "android"
      ? config.android?.package
      : config.ios?.bundleIdentifier;
  if (
    !id ||
    !/^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z0-9][a-zA-Z0-9-]*){2,}$/.test(id) ||
    id.startsWith("com.example.")
  )
    issues.push("Defina um identificador definitivo do aplicativo.");
  const project = config.extra?.eas?.projectId;
  if (
    !project ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      project,
    )
  )
    issues.push("Vincule o projeto à sua conta Expo/EAS.");
  return issues;
}
