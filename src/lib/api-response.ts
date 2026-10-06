import { NextResponse } from "next/server";

export function apiError(
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...(fields && Object.keys(fields).length > 0 ? { fields } : {}),
      },
    },
    { status },
  );
}

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}
