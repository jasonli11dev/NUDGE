import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("waitlist")
      .insert([{ email: email.toLowerCase() }]);

    if (error) {
      if (error.code === "23505") {
        // unique constraint violation
        return NextResponse.json({ message: "You're already on the list!" });
      }
      throw error;
    }

    return NextResponse.json({ message: "You're on the list ✓" });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
