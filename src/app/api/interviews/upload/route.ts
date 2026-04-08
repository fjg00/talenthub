import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const video = formData.get("video") as File | null;
  const interviewId = formData.get("interviewId") as string;
  const questionIndex = formData.get("questionIndex") as string;

  if (!video || !interviewId || questionIndex == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const filePath = `${user.id}/${interviewId}/q${questionIndex}.webm`;

  const { error: uploadError } = await supabase.storage
    .from("interview-videos")
    .upload(filePath, video, { upsert: true });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed", details: uploadError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ videoUrl: filePath });
}
