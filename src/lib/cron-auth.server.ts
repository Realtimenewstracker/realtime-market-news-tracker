/** Fail-closed shared-secret guard for scheduled server routes. */
export async function requireCronSecret(request: Request): Promise<Response | null> {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 32) {
    console.error("[cron-auth] CRON_SECRET is missing or too short");
    return Response.json({ ok: false, error: "Scheduled jobs are not configured" }, { status: 503 });
  }

  const supplied = request.headers.get("x-cron-secret") ?? "";
  if (!supplied || supplied.length > 512 || !(await constantTimeEqual(expected, supplied))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

async function constantTimeEqual(expected: string, supplied: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [expectedDigest, suppliedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
  ]);
  const a = new Uint8Array(expectedDigest);
  const b = new Uint8Array(suppliedDigest);
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
