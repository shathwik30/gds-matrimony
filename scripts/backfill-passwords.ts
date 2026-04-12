/**
 * One-time backfill script: generate secondary passwords for existing users
 * and email them via Brevo.
 *
 * Usage:
 *   BREVO_KEY=<api_key> npx tsx scripts/backfill-passwords.ts --skip 0   --take 300
 *   BREVO_KEY=<api_key> npx tsx scripts/backfill-passwords.ts --skip 300 --take 300
 *
 * Run both at the same time in two terminals with different BREVO_KEY values.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import * as schema from "../src/lib/db/schema";

// ─── Config ──────────────────────────────────────────────────────────────────

const BREVO_KEY = process.env.BREVO_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@gdsmarriagelinks.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "GDS Marriage Links";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gdsmarriagelinks.com";

// Delay between each email send (ms) — keeps Brevo happy
const SEND_DELAY_MS = 250;

// ─── CLI args ─────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);

function getArg(name: string, fallback: number): number {
  const idx = argv.indexOf(`--${name}`);
  if (idx !== -1 && argv[idx + 1]) return parseInt(argv[idx + 1], 10);
  return fallback;
}

const SKIP = getArg("skip", 0);
const TAKE = getArg("take", 300);

// ─── Guards ───────────────────────────────────────────────────────────────────

if (!BREVO_KEY) {
  console.error("❌  BREVO_KEY env var is required");
  console.error("    Run: BREVO_KEY=your_key npx tsx scripts/backfill-passwords.ts ...");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL is missing — check .env.local");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSecondaryPassword(): string {
  // Same charset as src/lib/utils/server.ts — no ambiguous chars (0/O, 1/I/l)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars[bytes[i] % chars.length];
  }
  return pwd;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Brevo ────────────────────────────────────────────────────────────────────

async function sendBrevoEmail(to: string, password: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:12px;overflow:hidden;
                      box-shadow:0 1px 3px rgba(0,0,0,.1);">

          <!-- Header -->
          <tr>
            <td style="background:#C00F0C;padding:28px 32px;">
              <h1 style="margin:0;color:#fff;font-size:22px;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">
                Hi, we have set up an alternative login password for your account
                so you can always access it even if you forget your main password.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#f3f4f6;border-radius:8px;margin:24px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;
                               text-transform:uppercase;letter-spacing:.05em;">
                      Your Login Details
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#6b7280;font-size:14px;padding:4px 0;
                                   width:90px;">Email</td>
                        <td style="color:#111827;font-size:14px;font-weight:600;
                                   padding:4px 0;">${to}</td>
                      </tr>
                      <tr>
                        <td style="color:#6b7280;font-size:14px;padding:4px 0;">
                          Password
                        </td>
                        <td style="padding:4px 0;">
                          <span style="background:#fff;border:1px solid #d1d5db;
                                       border-radius:6px;padding:4px 12px;
                                       font-family:monospace;font-size:16px;
                                       font-weight:700;color:#111827;
                                       letter-spacing:.05em;">
                            ${password}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#374151;font-size:14px;">
                Your original password continues to work as usual —
                this is an <strong>additional</strong> password, not a replacement.
              </p>

              <a href="${APP_URL}/login"
                 style="display:inline-block;background:#C00F0C;color:#fff;
                        text-decoration:none;padding:12px 28px;border-radius:8px;
                        font-size:15px;font-weight:600;">
                Login Now
              </a>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
                Keep this email safe. If you need help, reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 32px;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: APP_NAME, email: FROM_EMAIL },
      to: [{ email: to }],
      subject: `Your login credentials – ${APP_NAME}`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${res.status}: ${body}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀  Backfill starting  (skip=${SKIP}, take=${TAKE})\n`);

  const sql = neon(DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // Fetch users with no secondary password in this batch
  const users = await db.query.users.findMany({
    where: isNull(schema.users.secondaryPassword),
    columns: { id: true, email: true },
    offset: SKIP,
    limit: TAKE,
  });

  if (users.length === 0) {
    console.log("✅  No users found without a secondary password in this range.");
    return;
  }

  console.log(`Found ${users.length} users to process.\n`);

  let succeeded = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const label = `[${i + 1}/${users.length}]`;

    try {
      const password = generateSecondaryPassword();

      // 1. Save to DB first — if email fails we still have the password
      await db
        .update(schema.users)
        .set({ secondaryPassword: password })
        .where(eq(schema.users.id, user.id));

      // 2. Send email
      await sendBrevoEmail(user.email, password);

      succeeded++;
      console.log(`${label} ✓  ${user.email}`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`  ${user.email} — ${msg}`);
      console.error(`${label} ✗  ${user.email}: ${msg}`);
    }

    await sleep(SEND_DELAY_MS);
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅  Success : ${succeeded}`);
  if (failed > 0) {
    console.log(`❌  Failed  : ${failed}`);
    console.log("\nFailed addresses:");
    failures.forEach((f) => console.log(f));
  }
  console.log("─".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
