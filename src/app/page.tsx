import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  Video,
  MessageSquare,
  BookOpen,
  BarChart,
} from "lucide-react";
import { createClient } from "../../supabase/server";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform provides a structured approach to improving your
              counseling skills through practice and feedback.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Video className="w-6 h-6" />,
                title: "Watch Scenarios",
                description:
                  "View realistic counseling scenarios with clients presenting various issues",
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Practice Responses",
                description:
                  "Record your verbal and non-verbal responses at key moments",
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Compare with Experts",
                description:
                  "See how professionals would handle the same situation",
              },
              {
                icon: <BarChart className="w-6 h-6" />,
                title: "Track Progress",
                description:
                  "Monitor your improvement over time with detailed metrics",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-teal-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg overflow-hidden shadow-lg bg-white">
              <div className="relative h-[300px] w-full">
                <Image
                  src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&q=80"
                  alt="Counseling session demonstration"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Practice Makes Perfect
              </h2>
              <p className="text-gray-600 mb-6">
                Our platform offers a safe environment to practice your
                counseling skills before working with real clients. With our
                extensive library of scenarios, you can:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>
                    Practice with diverse client presentations and issues
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>Receive immediate feedback on your approach</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>
                    Review your responses and compare with expert examples
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 mt-1">•</span>
                  <span>
                    Track your progress and identify areas for improvement
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-teal-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-teal-100">Practice Scenarios</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1,000+</div>
              <div className="text-teal-100">Counselors Trained</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30%</div>
              <div className="text-teal-100">Skill Improvement</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Improve Your Counseling Skills?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join counselors worldwide who are enhancing their practice through
            our interactive platform.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Start Practicing Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
