import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());

  const data = {
    filters: params,
    generatedAt: new Date().toISOString(),
    metrics: {
      totalRevenue: 0,
      conversionRate: 0,
      activeLeads: 0,
    },
    activity: [],
  };

  return NextResponse.json(data);
}
