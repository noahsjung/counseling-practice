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

    // Get existing scenarios
    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("id, title")
      .limit(3);

    if (scenariosError) {
      throw new Error(`Error fetching scenarios: ${scenariosError.message}`);
    }

    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No scenarios found to create responses for",
      });
    }

    // Get segments for the first scenario
    const { data: segments, error: segmentsError } = await supabase
      .from("scenario_segments")
      .select("id, title")
      .eq("scenario_id", scenarios[0].id)
      .limit(3);

    if (segmentsError) {
      throw new Error(`Error fetching segments: ${segmentsError.message}`);
    }

    if (!segments || segments.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No segments found to create responses for",
      });
    }

    // Get users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name")
      .limit(3);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No users found to create responses for",
      });
    }

    // Sample video URLs (these are public videos that can be used for testing)
    const sampleVideoUrls = [
      "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
      "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
      "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
    ];

    // Create dummy responses
    const responses = [];
    for (const user of users) {
      for (const segment of segments) {
        const responseData = {
          user_id: user.id,
          scenario_id: scenarios[0].id,
          segment_id: segment.id,
          response_url:
            sampleVideoUrls[Math.floor(Math.random() * sampleVideoUrls.length)],
          notes: `Sample ${Math.random() > 0.5 ? "video" : "audio"} response`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          supervisor_feedback:
            Math.random() > 0.5
              ? "Good job on reflecting the client's feelings. Try to be more specific in your next response."
              : null,
          supervisor_rating:
            Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : null,
          reviewed_at: Math.random() > 0.5 ? new Date().toISOString() : null,
        };

        responses.push(responseData);
      }
    }

    // Insert responses
    const { error: insertError } = await supabase
      .from("user_responses")
      .upsert(responses);

    if (insertError) {
      throw new Error(`Error inserting responses: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${responses.length} sample responses`,
      data: {
        scenarios: scenarios,
        segments: segments,
        users: users,
        responseCount: responses.length,
      },
    });
  } catch (err: any) {
    console.error("Error in seed-responses API route:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
