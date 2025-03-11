"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw new Error(userError.message);
        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // Get the user's profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw new Error(profileError.message);
        }

        if (profileData) {
          setProfile(profileData);
          setFullName(profileData.full_name || "");
          setEmail(profileData.email || user.email || "");
          setIsSupervisor(user.user_metadata?.role === "supervisor");
        } else {
          // Set defaults from auth user if profile doesn't exist
          setFullName(user.user_metadata?.full_name || "");
          setEmail(user.email || "");
        }
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [supabase, router]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Skip trying to add the role column directly

      // Update the user's profile without the role field
      const { error: updateError } = await supabase.from("users").upsert(
        {
          id: user.id,
          full_name: fullName,
          email: email,
          updated_at: new Date().toISOString(),
          token_identifier: user.id, // Ensure token_identifier is set to prevent null constraint error
        },
        { onConflict: "id" },
      );

      if (updateError) throw new Error(updateError.message);

      // This line was causing an error - updateError is not defined

      // Update auth user metadata including role
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          role: isSupervisor ? "supervisor" : "counselor",
        },
      });

      if (authUpdateError) throw new Error(authUpdateError.message);

      setSuccess("Profile updated successfully!");

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <div className="animate-pulse text-center">
              <p className="text-lg">Loading profile...</p>
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
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-gray-600">
              Manage your account settings and role
            </p>
          </header>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg">
              {success}
            </div>
          )}

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-gray-100 rounded-full p-4">
                <UserCircle className="h-16 w-16 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{fullName || "User"}</h2>
                <p className="text-gray-500">{email}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="supervisor"
                    checked={isSupervisor}
                    onCheckedChange={(checked) =>
                      setIsSupervisor(checked === true)
                    }
                  />
                  <Label
                    htmlFor="supervisor"
                    className="font-medium cursor-pointer"
                  >
                    Enable Supervisor Role
                  </Label>
                </div>
                <p className="text-sm text-gray-500 ml-6">
                  Supervisors can upload scenarios, review counselor responses,
                  and provide feedback.
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSaveProfile}
                  className="bg-teal-600 hover:bg-teal-700"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
