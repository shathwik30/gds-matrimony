import { NextRequest, NextResponse } from "next/server";
import {
  getAdminUsersCsvRows,
  type AdminUserCsvRow,
  type AdminUserFilters,
} from "@/lib/actions/admin";

export const dynamic = "force-dynamic";

const CSV_COLUMNS = [
  "userId",
  "email",
  "emailVerified",
  "phoneNumber",
  "secondaryPhoneNumber",
  "profileFor",
  "role",
  "createdByStaffId",
  "createdByStaffEmail",
  "isActive",
  "lastActive",
  "failedLoginAttempts",
  "lockedUntil",
  "userCreatedAt",
  "userUpdatedAt",
  "firstName",
  "lastName",
  "fullName",
  "gender",
  "dateOfBirth",
  "age",
  "height",
  "weight",
  "bodyType",
  "complexion",
  "physicalStatus",
  "religion",
  "caste",
  "subCaste",
  "motherTongue",
  "gothra",
  "countryLivingIn",
  "residingState",
  "residingCity",
  "citizenship",
  "highestEducation",
  "educationDetail",
  "employedIn",
  "occupation",
  "jobTitle",
  "annualIncome",
  "maritalStatus",
  "diet",
  "smoking",
  "drinking",
  "hobbies",
  "familyStatus",
  "familyType",
  "familyValue",
  "fatherOccupation",
  "motherOccupation",
  "brothers",
  "brothersMarried",
  "sisters",
  "sistersMarried",
  "aboutMe",
  "profileImage",
  "profileCompletion",
  "trustScore",
  "trustLevel",
  "hideProfile",
  "isMarried",
  "showOnlineStatus",
  "showLastActive",
  "profileCreatedAt",
  "profileUpdatedAt",
  "subscriptionPlan",
  "subscriptionIsActive",
  "subscriptionStartDate",
  "subscriptionEndDate",
  "interestsPerDay",
  "contactViews",
  "profileBoosts",
  "interestsSentToday",
  "contactViewsUsed",
  "boostsUsed",
  "lastBoostAt",
  "boostExpiresAt",
  "subscriptionCreatedAt",
  "subscriptionUpdatedAt",
] as const satisfies ReadonlyArray<keyof AdminUserCsvRow>;

function parseFilters(searchParams: URLSearchParams): AdminUserFilters {
  return {
    status: searchParams.get("status") || undefined,
    gender: searchParams.get("gender") || undefined,
    subscription: searchParams.get("subscription") || undefined,
    trustLevel: searchParams.get("trustLevel") || undefined,
    married: searchParams.get("married") || undefined,
    profileCompletion: searchParams.get("profileCompletion") || undefined,
    emailVerified: searchParams.get("emailVerified") || undefined,
    subCaste: searchParams.get("subCaste") || undefined,
    country: searchParams.get("country") || undefined,
    state: searchParams.get("state") || undefined,
    birthYearFrom: searchParams.get("birthYearFrom") || undefined,
    birthYearTo: searchParams.get("birthYearTo") || undefined,
    sort: searchParams.get("sort") || undefined,
  };
}

function serializeCsvValue(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function buildCsv(rows: AdminUserCsvRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const lines = rows.map((row) =>
    CSV_COLUMNS.map((column) => `"${serializeCsvValue(row[column]).replace(/"/g, '""')}"`).join(",")
  );

  return `\uFEFF${[header, ...lines].join("\n")}`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const filter = searchParams.get("filter") || undefined;
  const filters = parseFilters(searchParams);

  const result = await getAdminUsersCsvRows(search, filter, filters);

  if (!result.success || !result.data) {
    const status =
      result.error === "Unauthorized" || result.error === "Not authenticated" ? 401 : 500;

    return NextResponse.json(
      { success: false, error: result.error || "Failed to export users" },
      { status }
    );
  }

  const csv = buildCsv(result.data);
  const filename = `admin-users-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
