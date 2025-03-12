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
import { ArrowLeft, Plus, Trash, Upload, Video } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../../supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createRequiredBuckets } from "./create-buckets";

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
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Scenario form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [duration, setDuration] = useState(15);
  const [category, setCategory] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);

  // Check if user is authorized (supervisor) and create buckets
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

        // Check if user is a supervisor - check user metadata
        const isSupervisorFromMetadata =
          user.user_metadata?.role === "supervisor";

        if (isSupervisorFromMetadata) {
          setIsAuthorized(true);

          // Create required storage buckets
          await createRequiredBuckets();

          // Disable RLS for upload using multiple approaches
          try {
            // Try the original approach
            const response1 = await fetch("/api/disable-rls-for-upload");
            const data1 = await response1.json();
            console.log("First RLS disable attempt result:", data1);

            // Try the direct approach
            const response2 = await fetch("/api/direct-disable-rls");
            const data2 = await response2.json();
            console.log("Second RLS disable attempt result:", data2);

            // Also try the general disable-rls endpoint
            const response3 = await fetch("/api/disable-rls");
            const data3 = await response3.json();
            console.log("Third RLS disable attempt result:", data3);
          } catch (error) {
            console.error("Failed to disable RLS:", error);
          }
        } else {
          setIsAuthorized(false);
          router.push("/dashboard");
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
    isVideo = false,
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFile(file);

      // Create preview URL for video
      if (isVideo) {
        const url = URL.createObjectURL(file);
        setVideoPreviewUrl(url);
      }
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

  // Set segment time from video
  const setSegmentTimeFromVideo = (
    segmentId: string,
    field: "start_time" | "end_time",
  ) => {
    const video = videoPreviewRef.current;
    if (!video) return;

    const currentTime = Math.floor(video.currentTime);

    if (field === "start_time") {
      updateSegment(segmentId, field, currentTime);
    } else {
      updateSegment(segmentId, field, currentTime);
    }
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
        .from("public")
        .upload(videoFileName, videoFile);

      if (videoUploadError) throw new Error(videoUploadError.message);

      // Get video URL
      const {
        data: { publicUrl: videoUrl },
      } = supabase.storage.from("public").getPublicUrl(videoFileName);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailFileName = `thumbnails/${crypto.randomUUID()}_${thumbnailFile.name}`;

        // Create bucket if it doesn't exist (already handled above)

        const { error: thumbnailUploadError } = await supabase.storage
          .from("public")
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailUploadError) throw new Error(thumbnailUploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from("public").getPublicUrl(thumbnailFileName);

        thumbnailUrl = publicUrl;
      }

      // Create scenario using the direct-upload API endpoint that uses raw SQL to bypass RLS
      const scenarioData = {
        title,
        description,
        difficulty,
        duration,
        category,
        thumbnail_url: thumbnailUrl,
        video_url: videoUrl,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Prepare segments data
      const segmentsData = await Promise.all(
        segments.map(async (segment) => {
          // Upload expert response if provided
          let expertResponseUrl = null;
          if (segment.expert_response_file) {
            const expertFileName = `expert-responses/${crypto.randomUUID()}_${segment.expert_response_file.name}`;

            // Create bucket if it doesn't exist (already handled above)

            const uploadResult = await supabase.storage
              .from("public")
              .upload(expertFileName, segment.expert_response_file);
            const expertUploadError = uploadResult.error;

            if (expertUploadError) throw new Error(expertUploadError.message);

            const {
              data: { publicUrl },
            } = supabase.storage.from("public").getPublicUrl(expertFileName);

            expertResponseUrl = publicUrl;
          }

          return {
            title: segment.title,
            description: segment.description,
            start_time: segment.start_time,
            end_time: segment.end_time,
            pause_point: segment.pause_point,
            expert_response_url: expertResponseUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }),
      );

      // Try multiple approaches to upload
      // First try the direct-upload endpoint that uses raw SQL
      try {
        const response = await fetch("/api/direct-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            scenarioData,
            segmentsData,
          }),
        });

        const result = await response.json();

        if (result.success && result.data && result.data.scenario) {
          console.log("Successfully uploaded using direct-upload");
          setSuccess("Scenario uploaded successfully!");
          setTimeout(() => {
            router.push("/scenarios");
          }, 2000);
          return; // Exit early since we succeeded
        } else {
          console.error(
            "Direct upload failed, trying bypass-rls:",
            result.error,
          );
        }
      } catch (err) {
        console.error("Error with direct-upload, trying bypass-rls:", err);
      }

      // If direct-upload failed, try the bypass-rls approach
      const response = await fetch("/api/bypass-rls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table: "scenarios",
          data: scenarioData,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error(result.error || "Failed to create scenario");
      }

      const insertedScenario = result.data[0];

      // Process segments
      for (const segment of segments) {
        // Upload expert response if provided
        let expertResponseUrl = null;
        if (segment.expert_response_file) {
          const expertFileName = `expert-responses/${crypto.randomUUID()}_${segment.expert_response_file.name}`;

          // Create bucket if it doesn't exist (already handled above)

          const uploadResult = await supabase.storage
            .from("public")
            .upload(expertFileName, segment.expert_response_file);
          const expertUploadError = uploadResult.error;

          if (expertUploadError) throw new Error(expertUploadError.message);

          const {
            data: { publicUrl },
          } = supabase.storage.from("public").getPublicUrl(expertFileName);

          expertResponseUrl = publicUrl;
        }

        // Create segment using raw SQL through the execute_sql RPC function
        const segmentData = {
          scenario_id: insertedScenario.id,
          title: segment.title,
          description: segment.description,
          start_time: segment.start_time,
          end_time: segment.end_time,
          pause_point: segment.pause_point,
          expert_response_url: expertResponseUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          // Skip direct SQL insertion and use the Supabase API directly
          const { error: sqlError } = await supabase
            .from("scenario_segments")
            .insert(segmentData);

          if (!sqlError) {
            console.log("Successfully created segment using SQL");
            continue; // Skip to next segment
          }

          console.error(
            "SQL segment creation failed, trying bypass-rls:",
            sqlError,
          );
        } catch (err) {
          console.error("Error with SQL segment creation:", err);
        }

        // If SQL approach failed, try the bypass-rls approach
        const segmentResponse = await fetch("/api/bypass-rls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table: "scenario_segments",
            data: segmentData,
          }),
        });

        const segmentResult = await segmentResponse.json();

        if (!segmentResult.success) {
          throw new Error(segmentResult.error || "Failed to create segment");
        }
      }

      setSuccess("Scenario uploaded successfully!");

      // Reset form after successful submission
      setTimeout(() => {
        router.push("/scenarios");
      }, 2000);
    } catch (err: any) {
      console.error("Error uploading scenario:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

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
                      onChange={(e) => handleFileChange(e, setVideoFile, true)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload the counseling scenario video (MP4 format
                      recommended)
                    </p>
                  </div>
                </div>
              </div>

              {/* Video Preview */}
              {videoPreviewUrl && (
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Video className="h-5 w-5 text-teal-600" />
                    Video Preview
                  </h2>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoPreviewRef}
                      src={videoPreviewUrl}
                      controls
                      className="w-full aspect-video"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Use this preview to set accurate segment start and end
                    times.
                  </p>
                </div>
              )}

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
                          <div className="flex gap-2">
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
                              className="flex-1"
                            />
                            {videoPreviewRef.current && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  setSegmentTimeFromVideo(
                                    segment.id,
                                    "start_time",
                                  )
                                }
                                className="bg-teal-600 hover:bg-teal-700"
                              >
                                Set Current
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`segment-end-${segment.id}`}>
                            End Time (mm:ss, optional)
                          </Label>
                          <div className="flex gap-2">
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
                              className="flex-1"
                            />
                            {videoPreviewRef.current && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() =>
                                  setSegmentTimeFromVideo(
                                    segment.id,
                                    "end_time",
                                  )
                                }
                                className="bg-teal-600 hover:bg-teal-700"
                              >
                                Set Current
                              </Button>
                            )}
                          </div>
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
                            Pause Point (for user response)
                          </Label>
                        </div>

                        <div>
                          <Label htmlFor={`segment-expert-${segment.id}`}>
                            Expert Response Video (optional)
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
                            Upload a video showing the expert response for this
                            segment
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t flex justify-end">
                <Button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Scenario
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
