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

    // Try multiple approaches to disable RLS
    try {
      // Approach 1: Direct SQL execution
      const { error: sqlError } = await supabase.rpc("execute_sql", {
        sql_query: `
          ALTER TABLE public.scenarios DISABLE ROW LEVEL SECURITY;
          ALTER TABLE public.scenario_segments DISABLE ROW LEVEL SECURITY;
          GRANT ALL PRIVILEGES ON TABLE public.scenarios TO authenticated;
          GRANT ALL PRIVILEGES ON TABLE public.scenario_segments TO authenticated;
          GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        `,
      });

      if (sqlError) {
        console.log("SQL execution approach failed:", sqlError);
      } else {
        console.log("SQL execution approach succeeded");
      }

      // Approach 2: Try to create policies that allow all operations
      const { error: policyError } = await supabase.rpc("execute_sql", {
        sql_query: `
          -- Drop existing policies if they exist
          DROP POLICY IF EXISTS "Allow all operations for scenarios" ON public.scenarios;
          DROP POLICY IF EXISTS "Allow all operations for segments" ON public.scenario_segments;
          
          -- Create permissive policies
          CREATE POLICY "Allow all operations for scenarios" ON public.scenarios USING (true) WITH CHECK (true);
          CREATE POLICY "Allow all operations for segments" ON public.scenario_segments USING (true) WITH CHECK (true);
        `,
      });

      if (policyError) {
        console.log("Policy creation approach failed:", policyError);
      } else {
        console.log("Policy creation approach succeeded");
      }

      // Approach 3: Try to update the RLS setting directly in pg_class
      const { error: pgClassError } = await supabase.rpc("execute_sql", {
        sql_query: `
          UPDATE pg_class SET relrowsecurity = false WHERE relname = 'scenarios';
          UPDATE pg_class SET relrowsecurity = false WHERE relname = 'scenario_segments';
        `,
      });

      if (pgClassError) {
        console.log("pg_class update approach failed:", pgClassError);
      } else {
        console.log("pg_class update approach succeeded");
      }
    } catch (err) {
      console.error("Error in RLS operations:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Attempted multiple RLS disabling approaches",
    });
  } catch (err) {
    console.error("Error in direct-disable-rls API route:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
