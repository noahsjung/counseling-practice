import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 },
      );
    }

    // Use service role key for admin privileges
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // Get user details from auth.users table
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError) {
      console.error("Error fetching auth user:", authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 500 },
      );
    }

    // Get user details from public.users table
    const { data: publicUser, error: publicError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (publicError && publicError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error fetching public user:", publicError);
      return NextResponse.json(
        { success: false, error: publicError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        auth: authUser,
        public: publicUser || null,
      },
    });
  } catch (err: any) {
    console.error("Error in get-user-details API route:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
