import { NextResponse } from "next/server";
import { getServiceSupabase, supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, username, address, phone } = body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: "Failed to create user account" },
        { status: 500 }
      );
    }

    // 2. Insert detailed user profile into 'users' table
    // We use the service role client to bypass RLS for this initial insertion
    // to ensure the record is created even if the user isn't fully verified/logged in yet.
    const serviceSupabase = getServiceSupabase();
    
    const { error: dbError } = await serviceSupabase
      .from("users")
      .insert({
        id: authData.user.id, // Link to auth.users
        email,
        username,
        firstname: firstName,
        lastname: lastName,
        address,
        phone,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      // Optional: Consider deleting the auth user if DB insert fails to maintain consistency
      console.error("Database insertion error:", dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Account created but failed to save profile details. Please contact support." 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Registration successful", 
        user: authData.user 
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
