import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import {
  BarChart,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react";

export default async function ProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user progress data
  const { data: progressData, error } = await supabase
    .from("user_progress")
    .select("*, scenarios(title, difficulty, duration)")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching progress data:", error);
  }

  // Calculate stats
  const completedScenarios =
    progressData?.filter((item) => item.completed) || [];
  const totalPracticeTime =
    progressData?.reduce((total, item) => {
      return total + (item.scenarios?.duration || 0);
    }, 0) || 0;

  // Sample data for charts (in a real app, this would be calculated from actual user data)
  const weeklyActivity = [
    { day: "Mon", count: 2 },
    { day: "Tue", count: 1 },
    { day: "Wed", count: 3 },
    { day: "Thu", count: 0 },
    { day: "Fri", count: 2 },
    { day: "Sat", count: 1 },
    { day: "Sun", count: 0 },
  ];

  const skillCategories = [
    { category: "Active Listening", score: 85 },
    { category: "Empathy", score: 72 },
    { category: "Questioning", score: 68 },
    { category: "Reflection", score: 90 },
    { category: "Goal Setting", score: 65 },
  ];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Your Progress</h1>
            <p className="text-gray-600">
              Track your counseling skills development over time
            </p>
          </header>

          {/* Stats Overview */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <CheckCircle className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed Scenarios</p>
                <p className="text-2xl font-bold">
                  {completedScenarios.length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <Clock className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Practice Time</p>
                <p className="text-2xl font-bold">{totalPracticeTime} min</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <Calendar className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="text-2xl font-bold">3 days</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4">
              <div className="bg-teal-50 p-3 rounded-full">
                <TrendingUp className="h-5 w-5 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overall Improvement</p>
                <p className="text-2xl font-bold">+15%</p>
              </div>
            </div>
          </section>

          {/* Weekly Activity Chart */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Weekly Activity</h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {weeklyActivity.map((day) => (
                <div
                  key={day.day}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className="bg-teal-500 w-full rounded-t-md"
                    style={{ height: `${day.count * 20}%` }}
                  ></div>
                  <p className="text-sm mt-2">{day.day}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Skill Breakdown */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-6">Skill Breakdown</h2>
            <div className="space-y-4">
              {skillCategories.map((skill) => (
                <div key={skill.category} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {skill.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {skill.score}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
