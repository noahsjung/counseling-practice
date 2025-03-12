import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
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

    // Add missing columns to user_responses table
    try {
      // Execute SQL directly using service role
      let error = null;
      try {
        const result = await supabase.rpc("execute_sql_admin", {
          sql_query: `
          -- Add missing columns to user_responses table if they don't exist
          DO $
          BEGIN
            -- Check if supervisor_feedback column exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'user_responses' 
                          AND column_name = 'supervisor_feedback') THEN
              ALTER TABLE public.user_responses ADD COLUMN supervisor_feedback TEXT;
            END IF;

            -- Check if supervisor_rating column exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'user_responses' 
                          AND column_name = 'supervisor_rating') THEN
              ALTER TABLE public.user_responses ADD COLUMN supervisor_rating INTEGER;
            END IF;

            -- Check if reviewed_at column exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_name = 'user_responses' 
                          AND column_name = 'reviewed_at') THEN
              ALTER TABLE public.user_responses ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
            END IF;
          END
          $;
          `,
        });
        if (result.error) {
          error = result.error;
        }
      } catch (err) {
        error = new Error("Failed to execute SQL");
      }

      if (error) {
        console.error("Error adding columns:", error);
        return NextResponse.json({ success: false, error: error.message });
      }

      return NextResponse.json({
        success: true,
        message: "Columns added successfully",
      });
    } catch (err) {
      console.error("Error in add-column operation:", err);
      return NextResponse.json({ success: false, error: err });
    }
  } catch (err) {
    console.error("Error in add-column API route:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
