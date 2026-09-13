export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(
  email: string | undefined,
  emailVerified: boolean | undefined,
  allowlist: Set<string>,
): boolean {
  return Boolean(email && emailVerified && allowlist.has(email.toLowerCase()));
}
