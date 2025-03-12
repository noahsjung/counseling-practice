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

    // Sample scenario data
    const scenarios = [
      {
        title: "Initial Client Assessment",
        description:
          "Practice conducting an initial assessment with a new client presenting with anxiety symptoms.",
        difficulty: "Beginner",
        duration: 15,
        category: "Assessment",
        thumbnail_url:
          "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&q=80",
        video_url:
          "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        title: "Managing Client Resistance",
        description:
          "Learn techniques for working with resistant clients who are hesitant to engage in the therapeutic process.",
        difficulty: "Intermediate",
        duration: 20,
        category: "Therapeutic Techniques",
        thumbnail_url:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80",
        video_url:
          "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        title: "Crisis Intervention",
        description:
          "Practice crisis intervention techniques with a client experiencing acute distress.",
        difficulty: "Advanced",
        duration: 25,
        category: "Crisis Management",
        thumbnail_url:
          "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
        video_url:
          "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Insert scenarios
    const { data: scenariosData, error: scenariosError } = await supabase
      .from("scenarios")
      .upsert(scenarios)
      .select();

    if (scenariosError) {
      throw new Error(`Error inserting scenarios: ${scenariosError.message}`);
    }

    // Create segments for each scenario
    const segments = [];
    for (const scenario of scenariosData || []) {
      segments.push(
        {
          scenario_id: scenario.id,
          title: "Introduction and Building Rapport",
          description:
            "The counselor introduces themselves and begins to establish rapport with the client.",
          start_time: 0,
          end_time: 60,
          pause_point: false,
          expert_response_url:
            "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          scenario_id: scenario.id,
          title: "Client Presents Symptoms",
          description:
            "The client describes their symptoms and how they are affecting daily life.",
          start_time: 61,
          end_time: 180,
          pause_point: false,
          expert_response_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          scenario_id: scenario.id,
          title: "Response Point: Initial Reflection",
          description:
            "Provide an empathetic response that reflects the client's feelings.",
          start_time: 181,
          end_time: 240,
          pause_point: true,
          expert_response_url:
            "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      );
    }

    // Insert segments
    const { error: segmentsError } = await supabase
      .from("scenario_segments")
      .upsert(segments);

    if (segmentsError) {
      throw new Error(`Error inserting segments: ${segmentsError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${scenariosData?.length || 0} scenarios and ${segments.length} segments`,
      data: {
        scenarios: scenariosData,
        segmentsCount: segments.length,
      },
    });
  } catch (err: any) {
    console.error("Error in seed-scenarios API route:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
