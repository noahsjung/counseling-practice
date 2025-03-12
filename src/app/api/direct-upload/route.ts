import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { scenarioData, segmentsData } = body;

    if (!scenarioData) {
      return NextResponse.json(
        { success: false, error: "Missing scenario data" },
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

    // Insert scenario directly using the Supabase API with service role
    const { data: insertedScenario, error: scenarioError } = await supabase
      .from("scenarios")
      .insert(scenarioData)
      .select();

    if (scenarioError) {
      console.error(`Error inserting scenario:`, scenarioError);
      return NextResponse.json(
        { success: false, error: scenarioError.message },
        { status: 500 },
      );
    }

    // Get the inserted scenario ID
    const scenarioId = insertedScenario?.[0]?.id;

    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: "Failed to get inserted scenario ID" },
        { status: 500 },
      );
    }

    // Insert segments if provided
    const insertedSegments = [];
    if (segmentsData && segmentsData.length > 0) {
      for (const segment of segmentsData) {
        // Insert segment directly using the Supabase API
        const segmentWithScenarioId = {
          ...segment,
          scenario_id: scenarioId,
        };

        const { data: insertedSegment, error: segmentError } = await supabase
          .from("scenario_segments")
          .insert(segmentWithScenarioId)
          .select();

        if (segmentError) {
          console.error(`Error inserting segment:`, segmentError);
          // Continue with other segments even if one fails
        } else {
          insertedSegments.push(insertedSegment?.[0]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scenario: insertedScenario?.[0],
        segments: insertedSegments,
      },
    });
  } catch (err: any) {
    console.error("Error in direct-upload API route:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
