import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { table, data } = body;

    if (!table || !data) {
      return NextResponse.json(
        { success: false, error: "Missing table or data" },
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

    // Insert data directly using service role
    const { data: insertedData, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: insertedData });
  } catch (err: any) {
    console.error("Error in bypass-rls API route:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
