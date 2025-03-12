"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../../../supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ReviewResponsePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [segment, setSegment] = useState<any>(null);
  const [counselor, setCounselor] = useState<any>(null);
  const [expertResponse, setExpertResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // No need to add columns, we'll use the notes field instead

    const fetchData = async () => {
      try {
        setLoading(true);

        // Check user authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Check if user is a supervisor from user metadata
        const isSupervisor = user.user_metadata?.role === "supervisor";

        if (!isSupervisor) {
          router.push("/dashboard");
          return;
        }

        // Fetch response details
        const { data: responseData, error: responseError } = await supabase
          .from("user_responses")
          .select("*")
          .eq("id", params.id)
          .single();

        if (responseError) throw new Error(responseError.message);
        if (!responseData) throw new Error("Response not found");

        setResponse(responseData);

        // Fetch scenario details
        const { data: scenarioData, error: scenarioError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("id", responseData.scenario_id)
          .single();

        if (scenarioError) throw new Error(scenarioError.message);
        setScenario(scenarioData);

        // Fetch segment details
        const { data: segmentData, error: segmentError } = await supabase
          .from("scenario_segments")
          .select("*")
          .eq("id", responseData.segment_id)
          .single();

        if (segmentError) throw new Error(segmentError.message);
        setSegment(segmentData);
        setExpertResponse(segmentData.expert_response_url);

        // Fetch counselor details using the API endpoint
        try {
          const counselorResponse = await fetch(
            `/api/get-user-details?userId=${responseData.user_id}`,
          );
          const counselorResult = await counselorResponse.json();

          if (counselorResult.success) {
            // Use either the public user data or auth user data
            const userData =
              counselorResult.data.public ||
              (counselorResult.data.auth
                ? {
                    full_name:
                      counselorResult.data.auth.user.user_metadata?.full_name ||
                      "Unknown User",
                    email: counselorResult.data.auth.user.email,
                  }
                : null);

            setCounselor(
              userData || {
                full_name: "Unknown User",
                email: responseData.user_id,
              },
            );
          } else {
            console.error(
              "Error fetching counselor details:",
              counselorResult.error,
            );
            setCounselor({
              full_name: "Unknown User",
              email: responseData.user_id,
            });
          }
        } catch (err) {
          console.error("Error fetching counselor details:", err);
          setCounselor({
            full_name: "Unknown User",
            email: responseData.user_id,
          });
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, supabase, router]);

  const handleSubmitFeedback = async () => {
    try {
      setSubmitting(true);

      if (!feedback.trim()) {
        throw new Error("Please provide feedback");
      }

      // First check if the columns exist by doing a select
      const { data: responseData, error: selectError } = await supabase
        .from("user_responses")
        .select("*")
        .eq("id", params.id)
        .single();

      if (selectError) {
        throw new Error(selectError.message);
      }

      // Just update the notes field with the feedback and a [REVIEWED] tag
      const notesWithFeedback = `[REVIEWED] Rating: ${rating}/5\n\nFeedback: ${feedback}\n\n${responseData.notes || ""}`;

      const { error: updateError } = await supabase
        .from("user_responses")
        .update({
          notes: notesWithFeedback,
        })
        .eq("id", params.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess("Feedback submitted successfully!");

      // Redirect after successful submission
      setTimeout(() => {
        router.push("/supervisor");
      }, 2000);
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <div className="animate-pulse text-center">
              <p className="text-lg">Loading response details...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              <p>Error: {error}</p>
              <Link
                href="/supervisor"
                className="text-teal-600 hover:underline mt-4 inline-block"
              >
                Return to Supervisor Dashboard
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header with back button */}
          <div className="flex items-center gap-4">
            <Link href="/supervisor">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Supervisor Dashboard
              </Button>
            </Link>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg">
              {success}
            </div>
          )}

          {/* Response details */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-2">
              Review Counselor Response
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Response Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Counselor</p>
                    <p className="font-medium">{counselor?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scenario</p>
                    <p className="font-medium">{scenario?.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Segment</p>
                    <p className="font-medium">{segment?.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted</p>
                    <p className="font-medium">
                      {new Date(response?.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Segment Description
                </h2>
                <p className="text-gray-700">{segment?.description}</p>
              </div>
            </div>
          </div>

          {/* Video comparison */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Response Comparison</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 text-center">
                  Counselor's Response
                </h3>
                {response?.response_url && (
                  <div className="bg-black rounded-lg overflow-hidden">
                    {response.response_url.includes("webm") ? (
                      <video
                        src={response.response_url}
                        controls
                        className="w-full aspect-video"
                      />
                    ) : (
                      <audio
                        src={response.response_url}
                        controls
                        className="w-full p-4"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2 text-center">
                  Expert Response
                </h3>
                {expertResponse ? (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={expertResponse}
                      controls
                      className="w-full aspect-video"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                    No expert response available for this segment
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback form */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Provide Feedback</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 rounded-full ${rating >= star ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Feedback Comments
                </label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback on the counselor's response..."
                  rows={6}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/supervisor")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
                  disabled={submitting}
                >
                  <MessageSquare className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
