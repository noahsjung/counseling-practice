import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  UserCircle,
  Video,
  Clock,
  BarChart4,
  BookOpen,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Sample data for scenarios
  const recentScenarios = [
    {
      id: 1,
      title: "Initial Client Assessment",
      difficulty: "Beginner",
      duration: "15 min",
      image:
        "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&q=80",
    },
    {
      id: 2,
      title: "Managing Client Resistance",
      difficulty: "Intermediate",
      duration: "20 min",
      image:
        "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80",
    },
    {
      id: 3,
      title: "Crisis Intervention",
      difficulty: "Advanced",
      duration: "25 min",
      image:
        "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80",
    },
  ];

  // Sample data for progress stats
  const progressStats = [
    {
      label: "Scenarios Completed",
      value: "12",
      icon: <Video className="h-5 w-5 text-teal-500" />,
    },
    {
      label: "Practice Hours",
      value: "8.5",
      icon: <Clock className="h-5 w-5 text-teal-500" />,
    },
    {
      label: "Skill Improvement",
      value: "+15%",
      icon: <BarChart4 className="h-5 w-5 text-teal-500" />,
    },
    {
      label: "Resources Viewed",
      value: "7",
      icon: <BookOpen className="h-5 w-5 text-teal-500" />,
    },
  ];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">
              Welcome, {user.user_metadata?.full_name || user.email}
            </h1>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm text-gray-600 flex gap-2 items-center">
              <InfoIcon size="16" className="text-teal-500" />
              <span>
                Continue your counseling practice journey by selecting a
                scenario below.
              </span>
            </div>
          </header>

          {/* Stats Overview */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {progressStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border shadow-sm flex items-center gap-4"
              >
                <div className="bg-teal-50 p-3 rounded-full">{stat.icon}</div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Recent Scenarios */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-xl">Recent Scenarios</h2>
              <Link
                href="/scenarios"
                className="text-teal-600 text-sm hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-40 w-full">
                    <Image
                      src={scenario.image}
                      alt={scenario.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-2">
                      {scenario.title}
                    </h3>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{scenario.difficulty}</span>
                      <span>{scenario.duration}</span>
                    </div>
                    <Link
                      href={`/scenarios/${scenario.id}`}
                      className="mt-4 block text-center py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                    >
                      Start Practice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recommended Resources */}
          <section className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="font-semibold text-xl mb-4">
              Recommended Resources
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <BookOpen className="h-6 w-6 text-teal-500 mt-1" />
                <div>
                  <h3 className="font-medium">Active Listening Techniques</h3>
                  <p className="text-sm text-gray-500">
                    Learn the fundamentals of effective counseling communication
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <BookOpen className="h-6 w-6 text-teal-500 mt-1" />
                <div>
                  <h3 className="font-medium">Building Therapeutic Rapport</h3>
                  <p className="text-sm text-gray-500">
                    Strategies for establishing trust with clients
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <BookOpen className="h-6 w-6 text-teal-500 mt-1" />
                <div>
                  <h3 className="font-medium">
                    Ethical Considerations in Counseling
                  </h3>
                  <p className="text-sm text-gray-500">
                    Understanding professional boundaries and responsibilities
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
