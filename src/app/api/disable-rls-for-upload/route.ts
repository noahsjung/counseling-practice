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

    // Execute SQL to completely disable RLS for scenarios table
    try {
      const { error } = await supabase.rpc("execute_sql_admin", {
        sql_query: `
          -- Disable RLS on scenarios table
          ALTER TABLE public.scenarios DISABLE ROW LEVEL SECURITY;
          
          -- Grant all privileges to authenticated users
          GRANT ALL PRIVILEGES ON TABLE public.scenarios TO authenticated;
          GRANT ALL PRIVILEGES ON TABLE public.scenario_segments TO authenticated;
          
          -- Grant usage on sequences
          GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        `,
      });

      if (error) {
        console.error("Error executing SQL:", error);
        // Fallback method if RPC fails
        await supabase
          .from("scenarios")
          .update({ rls_enabled: false })
          .eq("id", "dummy");
      } else {
        console.log("Successfully disabled RLS");
      }
    } catch (err) {
      console.error("Error disabling RLS:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in disable-rls API route:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
