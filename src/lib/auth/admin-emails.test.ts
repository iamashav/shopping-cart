import { describe, expect, it } from "vitest";
import { isAdminEmail, parseAdminEmails } from "./admin-emails";

describe("parseAdminEmails", () => {
  it("splits, trims, lowercases and drops empty entries", () => {
    expect([...parseAdminEmails(" Owner@Example.com, ,second@example.com ")]).toEqual([
      "owner@example.com",
      "second@example.com",
    ]);
  });

  it("returns an empty allowlist when unset", () => {
    expect(parseAdminEmails(undefined).size).toBe(0);
  });
});

describe("isAdminEmail", () => {
  const allowlist = parseAdminEmails("owner@example.com");

  it("accepts a verified allowlisted email regardless of case", () => {
    expect(isAdminEmail("OWNER@example.com", true, allowlist)).toBe(true);
  });

  it("rejects unverified, missing or unlisted emails", () => {
    expect(isAdminEmail("owner@example.com", false, allowlist)).toBe(false);
    expect(isAdminEmail(undefined, true, allowlist)).toBe(false);
    expect(isAdminEmail("someone@example.com", true, allowlist)).toBe(false);
  });

  it("rejects everyone when the allowlist is empty", () => {
    expect(isAdminEmail("owner@example.com", true, parseAdminEmails(""))).toBe(false);
  });
});
