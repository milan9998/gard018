import { sql } from "@/lib/db-singleton"; // Use singleton DB connection
import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { belgradeDateToday, isValidDateOnly } from "@/lib/membership-status";
import { addCalendarMonthToDate } from "@/lib/date-only";
import bcrypt from "bcryptjs";

const DEFAULT_MEMBER_PASSWORD = "trenirajboks";

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "").slice(0, 255);
}

export async function GET() {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.error || "Nemate pristup" },
        { status: auth.isAuthenticated ? 403 : 401 },
      );
    }

    const members = await sql`
      SELECT id, first_name, last_name, email, start_date, expiry_date, status, membership_type,
             membership_configured,
             individual_training_paid, individual_start_date, individual_expiry_date, created_at
      FROM members
      ORDER BY
        CASE
          WHEN membership_configured = TRUE
            AND expiry_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')::date
            OR (
              membership_configured = TRUE
              AND individual_training_paid = TRUE
              AND individual_expiry_date IS NOT NULL
              AND individual_expiry_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Belgrade')::date
            )
          THEN 0
          ELSE 1
        END,
        id ASC
    `;
    return NextResponse.json(members);
  } catch (error) {
    console.error("[v0] Error fetching members:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.error || "Nemate pristup" },
        { status: auth.isAuthenticated ? 403 : 401 },
      );
    }

    const { first_name, last_name, email, start_date, expiry_date } =
      await request.json();
    const startDate =
      typeof start_date === "string" && start_date
        ? start_date
        : belgradeDateToday();
    const calculatedExpiryDate = addCalendarMonthToDate(startDate);
    // New admin-created memberships always use one calendar month from the
    // selected payment/start date. Keep the old expiry-only input compatible
    // for already deployed clients that do not send start_date yet.
    const finalExpiryDate = start_date
      ? calculatedExpiryDate
      : typeof expiry_date === "string" && expiry_date
        ? expiry_date
        : calculatedExpiryDate;

    if (!first_name || !last_name || !email || !finalExpiryDate) {
      return NextResponse.json(
        { success: false, error: "Sva polja su obavezna" },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Nevažeća email adresa" },
        { status: 400 },
      );
    }

    if (!isValidDateOnly(startDate) || !isValidDateOnly(finalExpiryDate)) {
      return NextResponse.json(
        { success: false, error: "Nevažeći datum članarine" },
        { status: 400 },
      );
    }

    if (finalExpiryDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Datum isteka ne može biti pre datuma početka",
        },
        { status: 400 },
      );
    }

    const sanitizedFirstName = sanitizeInput(first_name);
    const sanitizedLastName = sanitizeInput(last_name);
    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    const existingMember = await sql`
      SELECT id FROM members WHERE email = ${sanitizedEmail}
    `;

    if (existingMember.length > 0) {
      return NextResponse.json(
        { success: false, error: "Član sa ovom email adresom već postoji" },
        { status: 400 },
      );
    }

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${sanitizedEmail} LIMIT 1
    `;

    const memberResult = await sql`
      INSERT INTO members (first_name, last_name, email, start_date, expiry_date, membership_type, status, membership_configured, qr_code_id)
      VALUES (
        ${sanitizedFirstName}, 
        ${sanitizedLastName}, 
        ${sanitizedEmail}, 
        ${startDate},
        ${finalExpiryDate},
        'MANUAL',
        'active',
        TRUE,
        gen_random_uuid()
      )
      RETURNING id
    `;

    let accountCreated = false;
    if (existingUser.length === 0) {
      try {
        const passwordHash = await bcrypt.hash(DEFAULT_MEMBER_PASSWORD, 10);
        await sql`
          INSERT INTO users (email, password_hash, first_name, last_name, password_hash_type, must_change_password, email_verified_at)
          VALUES (${sanitizedEmail}, ${passwordHash}, ${sanitizedFirstName}, ${sanitizedLastName}, 'bcrypt', TRUE, CURRENT_TIMESTAMP)
        `;
        accountCreated = true;
      } catch (accountError) {
        await sql`DELETE FROM members WHERE id = ${memberResult[0].id}`;
        throw accountError;
      }
    } else {
      // Admin-created memberships do not require email verification. Preserve
      // the existing password, but allow the admin to activate an account that
      // was previously created through public registration and not verified.
      await sql`
        UPDATE users
        SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP),
            email_verification_token_hash = NULL,
            email_verification_expires_at = NULL
        WHERE email = ${sanitizedEmail}
      `;
    }

    console.log("[v0] Member added successfully:", sanitizedEmail);

    return NextResponse.json({
      success: true,
      accountCreated,
      temporaryPassword: accountCreated ? DEFAULT_MEMBER_PASSWORD : null,
      message: accountCreated
        ? "Član i korisnički nalog su uspešno kreirani"
        : "Član je dodat, a postojeći korisnički nalog i lozinka su sačuvani",
    });
  } catch (error) {
    console.error("[v0] Error adding member:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Greška pri dodavanju člana. Molimo pokušajte ponovo.",
      },
      { status: 500 },
    );
  }
}
