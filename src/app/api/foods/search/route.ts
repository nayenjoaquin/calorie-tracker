import { NextResponse } from "next/server";
import { searchFoods } from "@/lib/usda";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const result = await searchFoods(query);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        foods: [],
        source: "mock",
        message:
          error instanceof Error ? error.message : "Failed to search foods",
      },
      { status: 500 },
    );
  }
}
