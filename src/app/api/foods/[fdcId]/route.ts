import { NextResponse } from "next/server";
import { getFoodById } from "@/lib/usda";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fdcId: string }> },
) {
  const { fdcId: raw } = await context.params;
  const fdcId = Number(raw);

  if (!Number.isFinite(fdcId)) {
    return NextResponse.json({ message: "Invalid FDC ID" }, { status: 400 });
  }

  try {
    const result = await getFoodById(fdcId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to load food",
      },
      { status: 404 },
    );
  }
}
