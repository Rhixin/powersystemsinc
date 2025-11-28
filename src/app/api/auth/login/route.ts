import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { success: false, message: "Login failed" },
        { status: 500 }
      );
    }

    // In a real-world scenario, you might want to set cookies here or return the token
    // For now, we'll return the user and token as requested
    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: data.user,
          access_token: data.session.access_token,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
