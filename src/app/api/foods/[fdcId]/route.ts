import { NextResponse } from "next/server";
import { getFoodById } from "@/lib/openfoodfacts";

export async function GET(
  _request: Request,
  context: { params: Promise<{ fdcId: string }> },
) {
  const { fdcId } = await context.params;
  const code = fdcId.trim();

  if (!code) {
    return NextResponse.json({ message: "Invalid product code" }, { status: 400 });
  }

  try {
    const result = await getFoodById(code);
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
