"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Mic,
  Save,
  Video as VideoIcon,
  Split,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../../../supabase/client";
import { useRouter } from "next/navigation";
import VideoPlayer from "./video-player";

export default function PracticePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [scenario, setScenario] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [recordingType, setRecordingType] = useState<"video" | "audio" | null>(
    null,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSplitView, setShowSplitView] = useState(false);
  const [expertResponse, setExpertResponse] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch scenario and segments data
  useEffect(() => {
    async function fetchData() {
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

        // Fetch scenario details
        const { data: scenarioData, error: scenarioError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("id", params.id)
          .single();

        if (scenarioError) throw new Error(scenarioError.message);
        if (!scenarioData) throw new Error("Scenario not found");

        setScenario(scenarioData);

        // Fetch scenario segments
        const { data: segmentsData, error: segmentsError } = await supabase
          .from("scenario_segments")
          .select("*")
          .eq("scenario_id", params.id)
          .order("start_time", { ascending: true });

        if (segmentsError) throw new Error(segmentsError.message);

        setSegments(segmentsData || []);

        // Check if there's an existing response for the current user and segment
        if (segmentsData && segmentsData.length > 0) {
          await checkExistingResponse(user.id, params.id, segmentsData[0].id);
        }
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Cleanup function to stop any active streams when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [params.id, supabase, router]);

  // Check for existing responses when segment changes
  useEffect(() => {
    if (
      segments.length > 0 &&
      currentSegmentIndex >= 0 &&
      currentSegmentIndex < segments.length
    ) {
      const checkResponse = async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await checkExistingResponse(
            user.id,
            params.id,
            segments[currentSegmentIndex].id,
          );
        }
      };
      checkResponse();
    }
  }, [currentSegmentIndex, segments, params.id, supabase]);

  // Check if there's an existing response for this segment
  const checkExistingResponse = async (
    userId: string,
    scenarioId: string,
    segmentId: string,
  ) => {
    try {
      // Check for user response
      const { data: responseData, error: responseError } = await supabase
        .from("user_responses")
        .select("*")
        .eq("user_id", userId)
        .eq("scenario_id", scenarioId)
        .eq("segment_id", segmentId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (responseError) throw new Error(responseError.message);

      // Check for expert response
      const { data: segmentData, error: segmentError } = await supabase
        .from("scenario_segments")
        .select("expert_response_url")
        .eq("id", segmentId)
        .single();

      if (segmentError) throw new Error(segmentError.message);

      if (segmentData && segmentData.expert_response_url) {
        setExpertResponse(segmentData.expert_response_url);
      } else {
        setExpertResponse(null);
      }
    } catch (err) {
      console.error("Error checking existing responses:", err);
    }
  };

  // Start recording function
  const startRecording = async (type: "video" | "audio") => {
    try {
      setRecordingType(type);
      videoChunksRef.current = [];

      // Request appropriate media based on type
      const constraints = {
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current && type === "video") {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .catch((err) => console.error("Error playing video:", err));
      }

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, {
          type: type === "video" ? "video/webm" : "audio/webm",
        });
        setRecordedVideo(blob);
        setShowPreview(true);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = null;
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setFeedback(
        "Could not access camera/microphone. Please check permissions.",
      );
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Save recording function
  const saveRecording = async () => {
    if (!recordedVideo) return;

    try {
      setIsSaving(true);
      setFeedback("Saving your response...");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get current segment
      const currentSegment = segments[currentSegmentIndex];
      if (!currentSegment) throw new Error("Segment not found");

      // Upload to storage
      const fileName = `${user.id}/${params.id}/${currentSegment.id}_${Date.now()}.${recordingType === "video" ? "webm" : "webm"}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("user-responses")
        .upload(fileName, recordedVideo);

      if (uploadError) throw new Error(uploadError.message);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("user-responses").getPublicUrl(fileName);

      // Save response in database
      const { error: responseError } = await supabase
        .from("user_responses")
        .insert({
          user_id: user.id,
          scenario_id: params.id,
          segment_id: currentSegment.id,
          response_url: publicUrl,
          notes: `${recordingType} response`,
        });

      if (responseError) throw new Error(responseError.message);

      setFeedback("Response saved successfully!");

      // Move to next segment if available
      if (currentSegmentIndex < segments.length - 1) {
        setCurrentSegmentIndex(currentSegmentIndex + 1);
      } else {
        // Update user progress
        await supabase.from("user_progress").upsert({
          user_id: user.id,
          scenario_id: params.id,
          completed: true,
          completion_date: new Date().toISOString(),
        });

        setFeedback("Congratulations! You've completed this scenario.");
      }

      // Reset recording state
      setRecordedVideo(null);
      setShowPreview(false);
      setRecordingType(null);
    } catch (err: any) {
      console.error("Error saving recording:", err);
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Discard recording function
  const discardRecording = () => {
    setRecordedVideo(null);
    setShowPreview(false);
    setRecordingType(null);
  };

  // Handle segment navigation
  const goToNextSegment = () => {
    if (currentSegmentIndex < segments.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
    }
  };

  const goToPreviousSegment = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
    }
  };

  // Toggle split view
  const toggleSplitView = () => {
    setShowSplitView(!showSplitView);
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center">
            <div className="animate-pulse text-center">
              <p className="text-lg">Loading practice session...</p>
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
                href="/scenarios"
                className="text-teal-600 hover:underline mt-4 inline-block"
              >
                Return to scenarios
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const currentSegment = segments[currentSegmentIndex];

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <Link href={`/scenarios/${params.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Scenario
              </Button>
            </Link>
            <div className="text-sm text-gray-500">
              Segment {currentSegmentIndex + 1} of {segments.length}
            </div>
          </div>

          {/* Scenario title */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">{scenario?.title}</h1>
            <p className="text-gray-600">{scenario?.description}</p>
          </div>

          {/* Current segment */}
          {currentSegment && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                {currentSegment.title}
              </h2>
              {currentSegment.description && (
                <p className="text-gray-600 mb-6">
                  {currentSegment.description}
                </p>
              )}

              {/* Video player */}
              <div className="mb-8">
                <VideoPlayer
                  videoUrl={
                    scenario.video_url ||
                    "https://storage.googleapis.com/tempo-public-assets/sample-counseling-session.mp4"
                  }
                  segments={segments}
                  currentSegmentIndex={currentSegmentIndex}
                />
              </div>

              {/* Recording interface */}
              <div className="mt-6">
                {!isRecording && !showPreview ? (
                  <div className="flex flex-col items-center">
                    <p className="mb-6 text-center">
                      Record your response to this counseling situation. Choose
                      whether to record video or audio only.
                    </p>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => startRecording("video")}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                      >
                        <Camera className="h-4 w-4" />
                        Record Video
                      </Button>
                      <Button
                        onClick={() => startRecording("audio")}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Mic className="h-4 w-4" />
                        Record Audio Only
                      </Button>
                    </div>
                  </div>
                ) : isRecording ? (
                  <div className="flex flex-col items-center">
                    {recordingType === "video" && (
                      <div className="w-full max-w-2xl mb-6 bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="w-full aspect-video"
                          style={{
                            transform: "scaleX(-1)",
                          }} /* Mirror the video for a more natural self-view */
                        />
                      </div>
                    )}

                    {recordingType === "audio" && (
                      <div className="w-full max-w-2xl mb-6 flex items-center justify-center p-12 bg-gray-100 rounded-lg">
                        <div className="animate-pulse">
                          <Mic className="h-16 w-16 text-teal-500" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="animate-pulse mr-2">
                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                      </div>
                      <p className="text-gray-600">Recording in progress...</p>
                    </div>

                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="mt-4"
                    >
                      Stop Recording
                    </Button>
                  </div>
                ) : showPreview && recordedVideo ? (
                  <div className="flex flex-col items-center">
                    {/* Split view toggle */}
                    {expertResponse && (
                      <div className="w-full flex justify-end mb-4">
                        <Button
                          onClick={toggleSplitView}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Split className="h-4 w-4" />
                          {showSplitView
                            ? "Hide Expert Response"
                            : "Compare with Expert"}
                        </Button>
                      </div>
                    )}

                    {/* Split view or single view */}
                    {showSplitView && expertResponse ? (
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <h3 className="text-center font-medium mb-2">
                            Your Response
                          </h3>
                          {recordingType === "video" ? (
                            <div className="bg-black rounded-lg overflow-hidden">
                              <video
                                src={URL.createObjectURL(recordedVideo)}
                                controls
                                className="w-full aspect-video"
                              />
                            </div>
                          ) : (
                            <div className="p-6 bg-gray-100 rounded-lg">
                              <audio
                                src={URL.createObjectURL(recordedVideo)}
                                controls
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-center font-medium mb-2">
                            Expert Response
                          </h3>
                          <div className="bg-black rounded-lg overflow-hidden">
                            <video
                              src={expertResponse}
                              controls
                              className="w-full aspect-video"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-2xl mb-6">
                        {recordingType === "video" ? (
                          <div className="bg-black rounded-lg overflow-hidden">
                            <video
                              src={URL.createObjectURL(recordedVideo)}
                              controls
                              className="w-full aspect-video"
                            />
                          </div>
                        ) : (
                          <div className="p-6 bg-gray-100 rounded-lg">
                            <audio
                              src={URL.createObjectURL(recordedVideo)}
                              controls
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        onClick={saveRecording}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Response"}
                      </Button>
                      <Button
                        onClick={discardRecording}
                        variant="outline"
                        disabled={isSaving}
                      >
                        Discard & Re-record
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Feedback message */}
              {feedback && (
                <div className="mt-6 p-4 bg-teal-50 text-teal-700 rounded-lg">
                  {feedback}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="mt-8 flex justify-between">
                <Button
                  onClick={goToPreviousSegment}
                  variant="outline"
                  disabled={currentSegmentIndex === 0 || isRecording}
                >
                  Previous Segment
                </Button>
                {segments.length > 1 &&
                currentSegmentIndex < segments.length - 1 ? (
                  <Button onClick={goToNextSegment} disabled={isRecording}>
                    Next Segment
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      if (recordedVideo) {
                        await saveRecording();
                      }

                      // Update user progress to mark scenario as completed
                      try {
                        const {
                          data: { user },
                        } = await supabase.auth.getUser();
                        if (user) {
                          await supabase.from("user_progress").upsert({
                            user_id: user.id,
                            scenario_id: params.id,
                            completed: true,
                            completion_date: new Date().toISOString(),
                          });

                          setFeedback(
                            "Congratulations! You've completed this scenario.",
                          );
                          setTimeout(() => {
                            router.push(`/scenarios/${params.id}`);
                          }, 2000);
                        }
                      } catch (err) {
                        console.error("Error completing scenario:", err);
                      }
                    }}
                    disabled={isRecording}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Complete Scenario
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
