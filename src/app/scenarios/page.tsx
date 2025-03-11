import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Database } from "@/types/database.types";
import Image from "next/image";
import Link from "next/link";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function ScenariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch scenarios from Supabase
  const { data: scenarios, error } = await supabase
    .from("scenarios")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scenarios:", error);
  }

  // Group scenarios by category
  const categorizedScenarios: Record<string, typeof scenarios> = {};

  scenarios?.forEach((scenario) => {
    const category = scenario.category || "Uncategorized";
    if (!categorizedScenarios[category]) {
      categorizedScenarios[category] = [];
    }
    categorizedScenarios[category].push(scenario);
  });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Counseling Scenarios</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search scenarios..."
                className="pl-10 bg-white"
              />
            </div>
          </header>

          {/* Scenarios by Category */}
          {Object.entries(categorizedScenarios).map(
            ([category, categoryScenarios]) => (
              <section
                key={category}
                className="bg-white rounded-xl p-6 border shadow-sm"
              >
                <h2 className="font-semibold text-xl mb-6">{category}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryScenarios?.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-40 w-full">
                        <Image
                          src={
                            scenario.thumbnail_url ||
                            "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80"
                          }
                          alt={scenario.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-2 right-2 bg-white text-xs font-medium px-2 py-1 rounded-full">
                          {scenario.difficulty}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-2">
                          {scenario.title}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {scenario.description}
                        </p>
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <span>{scenario.duration} min</span>
                        </div>
                        <Link
                          href={`/scenarios/${scenario.id}`}
                          className="block text-center py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                        >
                          Start Practice
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ),
          )}

          {/* If no scenarios */}
          {Object.keys(categorizedScenarios).length === 0 && (
            <div className="bg-white rounded-xl p-12 border shadow-sm text-center">
              <h2 className="text-xl font-medium mb-2">
                No scenarios available
              </h2>
              <p className="text-gray-500">
                Check back later for new counseling scenarios.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
