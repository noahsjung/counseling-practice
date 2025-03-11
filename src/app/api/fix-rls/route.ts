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

    // Execute SQL to fix RLS policies for scenarios table
    try {
      await supabase.rpc("execute_sql", {
        sql_query: `
          -- Enable RLS on scenarios table
          ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
          
          -- Create policies for authenticated users to manage scenarios
          DROP POLICY IF EXISTS "Allow authenticated users to insert scenarios" ON public.scenarios;
          CREATE POLICY "Allow authenticated users to insert scenarios" 
          ON public.scenarios FOR INSERT TO authenticated WITH CHECK (true);
          
          DROP POLICY IF EXISTS "Allow authenticated users to update scenarios" ON public.scenarios;
          CREATE POLICY "Allow authenticated users to update scenarios" 
          ON public.scenarios FOR UPDATE TO authenticated USING (true);
          
          DROP POLICY IF EXISTS "Allow authenticated users to read scenarios" ON public.scenarios;
          CREATE POLICY "Allow authenticated users to read scenarios" 
          ON public.scenarios FOR SELECT TO authenticated USING (true);
          
          DROP POLICY IF EXISTS "Allow authenticated users to delete scenarios" ON public.scenarios;
          CREATE POLICY "Allow authenticated users to delete scenarios" 
          ON public.scenarios FOR DELETE TO authenticated USING (true);
          
          -- Enable RLS on scenario_segments table
          ALTER TABLE public.scenario_segments ENABLE ROW LEVEL SECURITY;
          
          -- Create policies for authenticated users to manage scenario segments
          DROP POLICY IF EXISTS "Allow authenticated users to insert segments" ON public.scenario_segments;
          CREATE POLICY "Allow authenticated users to insert segments" 
          ON public.scenario_segments FOR INSERT TO authenticated WITH CHECK (true);
          
          DROP POLICY IF EXISTS "Allow authenticated users to update segments" ON public.scenario_segments;
          CREATE POLICY "Allow authenticated users to update segments" 
          ON public.scenario_segments FOR UPDATE TO authenticated USING (true);
          
          DROP POLICY IF EXISTS "Allow authenticated users to read segments" ON public.scenario_segments;
          CREATE POLICY "Allow authenticated users to read segments" 
          ON public.scenario_segments FOR SELECT TO authenticated USING (true);
          
          DROP POLICY IF EXISTS "Allow authenticated users to delete segments" ON public.scenario_segments;
          CREATE POLICY "Allow authenticated users to delete segments" 
          ON public.scenario_segments FOR DELETE TO authenticated USING (true);
        `,
      });
      console.log("Successfully updated scenarios RLS policies");
    } catch (err) {
      console.error("Error updating scenarios RLS policies:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in fix-rls API route:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
