import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import Link from "next/link";

export default async function SupervisorResponsesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check if user is a supervisor from metadata
  const isSupervisor = user.user_metadata?.role === "supervisor";

  // If not a supervisor, redirect to regular dashboard
  if (!isSupervisor) {
    return redirect("/dashboard");
  }

  // Log user metadata for debugging
  console.log("User metadata:", user.user_metadata);

  // Fetch all responses that need review
  const { data: pendingResponses, error: responsesError } = await supabase
    .from("user_responses")
    .select(
      "*, scenarios!user_responses_scenario_id_fkey(title), scenario_segments!user_responses_segment_id_fkey(title)",
    )
    .order("created_at", { ascending: false });

  if (responsesError) {
    console.error("Error fetching responses:", responsesError);
  }

  // Group responses by reviewed status using notes field
  const reviewedResponses =
    pendingResponses?.filter((response) =>
      response.notes?.includes("[REVIEWED]"),
    ) || [];
  const unreviewedResponses =
    pendingResponses?.filter(
      (response) => !response.notes?.includes("[REVIEWED]"),
    ) || [];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Counselor Responses</h1>
            <p className="text-gray-600">
              Review and provide feedback on counselor practice responses
            </p>
          </header>

          {/* Pending Reviews */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Pending Reviews</h2>
            {unreviewedResponses && unreviewedResponses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Counselor</th>
                      <th className="text-left py-3 px-4">Scenario</th>
                      <th className="text-left py-3 px-4">Segment</th>
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unreviewedResponses.map((response) => (
                      <tr
                        key={response.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">
                          {response.user_id
                            ? response.user_id.substring(0, 8) + "..."
                            : "Unknown User"}
                        </td>
                        <td className="py-3 px-4">
                          {response.scenarios?.title || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          {response.scenario_segments?.title || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(response.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/supervisor/review/${response.id}`}>
                            <Button size="sm">Review</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No pending reviews at this time.
              </div>
            )}
          </section>

          {/* Completed Reviews */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Completed Reviews</h2>
            {reviewedResponses && reviewedResponses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Counselor</th>
                      <th className="text-left py-3 px-4">Scenario</th>
                      <th className="text-left py-3 px-4">Segment</th>
                      <th className="text-left py-3 px-4">Rating</th>
                      <th className="text-left py-3 px-4">Reviewed</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewedResponses.map((response) => (
                      <tr
                        key={response.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">Unknown User</td>
                        <td className="py-3 px-4">
                          {response.scenarios?.title || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          {response.scenario_segments?.title || "Unknown"}
                        </td>
                        <td className="py-3 px-4">
                          {response.notes?.match(/Rating: (\d)\/5/)
                            ? response.notes.match(/Rating: (\d)\/5/)[1] + "/5"
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {response.updated_at
                            ? new Date(response.updated_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/supervisor/review/${response.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No completed reviews yet.
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
