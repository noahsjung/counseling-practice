import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { CheckCircle, Clock, FileVideo, Upload, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SupervisorDashboard() {
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

  // Fetch pending responses that need review
  const { data: pendingResponses, error: responsesError } = await supabase
    .from("user_responses")
    .select(
      "*, scenarios!user_responses_scenario_id_fkey(title), scenario_segments!user_responses_segment_id_fkey(title)",
    )
    .is("supervisor_feedback", null)
    .order("created_at", { ascending: false });

  if (responsesError) {
    console.error("Error fetching responses:", responsesError);
  }

  // Fetch all users as potential counselors
  const { data: counselors, error: counselorsError } = await supabase
    .from("users")
    .select("id, full_name, email, created_at")
    .order("created_at", { ascending: false });

  if (counselorsError) {
    console.error("Error fetching counselors:", counselorsError);
  }

  // Fetch scenarios count
  const { count: scenariosCount, error: scenariosError } = await supabase
    .from("scenarios")
    .select("*", { count: "exact", head: true });

  if (scenariosError) {
    console.error("Error fetching scenarios count:", scenariosError);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
            <p className="text-gray-600">
              Monitor counselor progress and provide feedback on their practice
              sessions
            </p>
          </header>

          {/* Stats Overview */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <Users className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Counselors</p>
                <p className="text-2xl font-bold">{counselors?.length || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <FileVideo className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Scenarios</p>
                <p className="text-2xl font-bold">{scenariosCount || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <Clock className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-bold">
                  {pendingResponses?.length || 0}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Reviews</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Quick Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Link href="/supervisor/upload-scenario">
                <Button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700">
                  <Upload className="h-4 w-4" />
                  Upload New Scenario
                </Button>
              </Link>
              <Link href="/supervisor/manage-counselors">
                <Button variant="outline" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Manage Counselors
                </Button>
              </Link>
            </div>
          </section>

          {/* Pending Reviews */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Pending Reviews</h2>
            {pendingResponses && pendingResponses.length > 0 ? (
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
                    {pendingResponses.map((response) => (
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

          {/* Recent Counselors */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-xl">Counselors</h2>
              <Link
                href="/supervisor/manage-counselors"
                className="text-teal-600 text-sm hover:underline"
              >
                View All
              </Link>
            </div>

            {counselors && counselors.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counselors.slice(0, 5).map((counselor) => (
                      <tr
                        key={counselor.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-3 px-4">{counselor.full_name}</td>
                        <td className="py-3 px-4">{counselor.email}</td>
                        <td className="py-3 px-4">
                          {new Date(counselor.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/supervisor/counselor/${counselor.id}`}>
                            <Button size="sm" variant="outline">
                              View Progress
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
                No counselors found.
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
