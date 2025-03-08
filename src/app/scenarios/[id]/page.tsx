import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { ArrowLeft, Clock, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import ScenarioPlayer from "@/components/scenario-player";

export default async function ScenarioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch scenario details
  const { data: scenario, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !scenario) {
    console.error("Error fetching scenario:", error);
    return redirect("/scenarios");
  }

  // Fetch scenario segments
  const { data: segments, error: segmentsError } = await supabase
    .from("scenario_segments")
    .select("*")
    .eq("scenario_id", params.id)
    .order("start_time", { ascending: true });

  if (segmentsError) {
    console.error("Error fetching scenario segments:", segmentsError);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Link href="/scenarios">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Scenarios
              </Button>
            </Link>
          </div>

          {/* Scenario details */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="md:flex">
              {/* Thumbnail */}
              <div className="md:w-1/3 relative h-60 md:h-auto">
                <Image
                  src={
                    scenario.thumbnail_url ||
                    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80"
                  }
                  alt={scenario.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Details */}
              <div className="p-6 md:w-2/3">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      {scenario.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {scenario.duration} minutes
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {scenario.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full">
                        {scenario.category || "General"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-6">{scenario.description}</p>

                <div className="bg-teal-50 p-4 rounded-lg flex gap-3 mb-6">
                  <Info className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-teal-800 mb-1">
                      How this works
                    </h3>
                    <p className="text-sm text-teal-700">
                      You'll watch a video scenario that will pause at key
                      moments. Record your response to practice your counseling
                      skills, then compare with expert examples.
                    </p>
                  </div>
                </div>

                <Link href={`/scenarios/${params.id}/practice`}>
                  <Button className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto">
                    Start Practice Session
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Video player section */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Preview</h2>
            <ScenarioPlayer
              videoUrl={
                scenario.video_url ||
                "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4"
              }
              segments={segments || []}
            />
          </div>

          {/* Segments/Pause Points */}
          {segments && segments.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Session Structure</h2>
              <div className="space-y-4">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="border-l-4 border-teal-500 pl-4 py-2"
                  >
                    <div className="flex justify-between">
                      <h3 className="font-medium">{segment.title}</h3>
                      <span className="text-sm text-gray-500">
                        {Math.floor(segment.start_time / 60)}:
                        {(segment.start_time % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                    {segment.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {segment.description}
                      </p>
                    )}
                    {segment.pause_point && (
                      <div className="mt-2 text-xs font-medium text-teal-600 bg-teal-50 inline-block px-2 py-1 rounded">
                        Response Point
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
