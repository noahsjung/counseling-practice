"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash, Upload } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Segment {
  id: string;
  title: string;
  description: string;
  start_time: number;
  end_time: number | null;
  pause_point: boolean;
  expert_response_file: File | null;
}

export default function UploadScenarioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Scenario form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [duration, setDuration] = useState(15);
  const [category, setCategory] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);

  // Check if user is authorized (supervisor)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // Check if user is a supervisor
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw new Error(userError.message);

        if (!userData || userData.role !== "supervisor") {
          setIsAuthorized(false);
          router.push("/dashboard");
        } else {
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("Error checking authorization:", err);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  // Add a new segment
  const addSegment = () => {
    const newSegment: Segment = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      start_time: 0,
      end_time: null,
      pause_point: false,
      expert_response_file: null,
    };

    setSegments([...segments, newSegment]);
  };

  // Remove a segment
  const removeSegment = (id: string) => {
    setSegments(segments.filter((segment) => segment.id !== id));
  };

  // Update segment field
  const updateSegment = (id: string, field: keyof Segment, value: any) => {
    setSegments(
      segments.map((segment) => {
        if (segment.id === id) {
          return { ...segment, [field]: value };
        }
        return segment;
      }),
    );
  };

  // Handle file selection
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  // Handle expert response file selection
  const handleExpertResponseFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    segmentId: string,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      updateSegment(segmentId, "expert_response_file", e.target.files[0]);
    }
  };

  // Convert time string (mm:ss) to seconds
  const timeToSeconds = (timeStr: string): number => {
    const [minutes, seconds] = timeStr.split(":").map(Number);
    return minutes * 60 + seconds;
  };

  // Convert seconds to time string (mm:ss)
  const secondsToTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!videoFile) {
        throw new Error("Please upload a scenario video");
      }

      if (segments.length === 0) {
        throw new Error("Please add at least one segment");
      }

      // Upload video file
      const videoFileName = `scenarios/${crypto.randomUUID()}_${videoFile.name}`;
      const { error: videoUploadError } = await supabase.storage
        .from("scenario-videos")
        .upload(videoFileName, videoFile);

      if (videoUploadError) throw new Error(videoUploadError.message);

      // Get video URL
      const {
        data: { publicUrl: videoUrl },
      } = supabase.storage.from("scenario-videos").getPublicUrl(videoFileName);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailFileName = `thumbnails/${crypto.randomUUID()}_${thumbnailFile.name}`;
        const { error: thumbnailUploadError } = await supabase.storage
          .from("scenario-thumbnails")
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailUploadError) throw new Error(thumbnailUploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("scenario-thumbnails")
          .getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      }

      // Create scenario
      const { data: scenarioData, error: scenarioError } = await supabase
        .from("scenarios")
        .insert({
          title,
          description,
          difficulty,
          duration,
          category,
          thumbnail_url: thumbnailUrl,
          video_url: videoUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (scenarioError) throw new Error(scenarioError.message);

      // Process segments
      for (const segment of segments) {
        // Upload expert response if provided
        let expertResponseUrl = null;
        if (segment.expert_response_file) {
          const expertFileName = `expert-responses/${crypto.randomUUID()}_${segment.expert_response_file.name}`;
          const { error: expertUploadError } = await supabase.storage
            .from("expert-responses")
            .upload(expertFileName, segment.expert_response_file);

          if (expertUploadError) throw new Error(expertUploadError.message);

          const {
            data: { publicUrl },
          } = supabase.storage
            .from("expert-responses")
            .getPublicUrl(expertFileName);

          expertResponseUrl = publicUrl;
        }

        // Create segment
        const { error: segmentError } = await supabase
          .from("scenario_segments")
          .insert({
            scenario_id: scenarioData.id,
            title: segment.title,
            description: segment.description,
            start_time: segment.start_time,
            end_time: segment.end_time,
            pause_point: segment.pause_point,
            expert_response_url: expertResponseUrl,
          });

        if (segmentError) throw new Error(segmentError.message);
      }

      setSuccess("Scenario uploaded successfully!");

      // Reset form after successful submission
      setTimeout(() => {
        router.push("/supervisor");
      }, 2000);
    } catch (err: any) {
      console.error("Error uploading scenario:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-lg">Checking authorization...</p>
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

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-6">Upload New Scenario</h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Scenario Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Scenario Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Assessment, Crisis Intervention"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="thumbnail">Thumbnail Image</Label>
                    <Input
                      id="thumbnail"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setThumbnailFile)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 800x450px (16:9 ratio)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="video" className="text-red-500 font-medium">
                      Scenario Video (Required)
                    </Label>
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(e, setVideoFile)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload the counseling scenario video (MP4 format
                      recommended)
                    </p>
                  </div>
                </div>
              </div>

              {/* Segments */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Scenario Segments</h2>
                  <Button
                    type="button"
                    onClick={addSegment}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Segment
                  </Button>
                </div>

                {segments.length === 0 && (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-gray-500">
                      No segments added yet. Click "Add Segment" to create
                      segments for this scenario.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {segments.map((segment, index) => (
                    <div
                      key={segment.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Segment {index + 1}</h3>
                        <Button
                          type="button"
                          onClick={() => removeSegment(segment.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`segment-title-${segment.id}`}>
                            Title
                          </Label>
                          <Input
                            id={`segment-title-${segment.id}`}
                            value={segment.title}
                            onChange={(e) =>
                              updateSegment(segment.id, "title", e.target.value)
                            }
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`segment-description-${segment.id}`}>
                            Description
                          </Label>
                          <Input
                            id={`segment-description-${segment.id}`}
                            value={segment.description}
                            onChange={(e) =>
                              updateSegment(
                                segment.id,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor={`segment-start-${segment.id}`}>
                            Start Time (mm:ss)
                          </Label>
                          <Input
                            id={`segment-start-${segment.id}`}
                            value={secondsToTime(segment.start_time)}
                            onChange={(e) =>
                              updateSegment(
                                segment.id,
                                "start_time",
                                timeToSeconds(e.target.value),
                              )
                            }
                            placeholder="0:00"
                            pattern="[0-9]+:[0-5][0-9]"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`segment-end-${segment.id}`}>
                            End Time (mm:ss, optional)
                          </Label>
                          <Input
                            id={`segment-end-${segment.id}`}
                            value={
                              segment.end_time
                                ? secondsToTime(segment.end_time)
                                : ""
                            }
                            onChange={(e) =>
                              updateSegment(
                                segment.id,
                                "end_time",
                                e.target.value
                                  ? timeToSeconds(e.target.value)
                                  : null,
                              )
                            }
                            placeholder="0:00"
                            pattern="[0-9]+:[0-5][0-9]"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`segment-pause-${segment.id}`}
                            checked={segment.pause_point}
                            onChange={(e) =>
                              updateSegment(
                                segment.id,
                                "pause_point",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 text-teal-600"
                          />
                          <Label
                            htmlFor={`segment-pause-${segment.id}`}
                            className="cursor-pointer"
                          >
                            Pause Point (requires counselor response)
                          </Label>
                        </div>

                        {segment.pause_point && (
                          <div>
                            <Label htmlFor={`segment-expert-${segment.id}`}>
                              Expert Response Video
                            </Label>
                            <Input
                              id={`segment-expert-${segment.id}`}
                              type="file"
                              accept="video/*"
                              onChange={(e) =>
                                handleExpertResponseFile(e, segment.id)
                              }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Upload an expert's response to this segment
                              (optional)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
                  disabled={loading}
                >
                  <Upload className="h-4 w-4" />
                  {loading ? "Uploading..." : "Upload Scenario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
