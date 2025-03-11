import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Use service role key for admin privileges
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // Skip RLS modification as the function doesn't exist
    console.log("Skipping RLS modification - proceeding to bucket creation");

    // Check if public bucket exists first
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const publicBucketExists = buckets?.some(
        (bucket) => bucket.name === "public",
      );

      if (!publicBucketExists) {
        // Create public bucket only if it doesn't exist
        const { error: publicError } = await supabase.storage.createBucket(
          "public",
          {
            public: true,
            fileSizeLimit: 52428800,
          },
        );

        if (publicError) {
          console.error("Error creating public bucket:", publicError);
        } else {
          console.log("Successfully created public bucket");
        }
      } else {
        console.log("Public bucket already exists");
      }

      // Update bucket to be public regardless
      await supabase.storage.updateBucket("public", {
        public: true,
      });
    } catch (err) {
      console.log("Public bucket operation error:", err);
    }

    // Check if user-responses bucket exists first
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const responsesBucketExists = buckets?.some(
        (bucket) => bucket.name === "user-responses",
      );

      if (!responsesBucketExists) {
        // Create user-responses bucket only if it doesn't exist
        const { error: responseError } = await supabase.storage.createBucket(
          "user-responses",
          {
            public: true,
            fileSizeLimit: 52428800,
          },
        );

        if (responseError) {
          console.error("Error creating user-responses bucket:", responseError);
        } else {
          console.log("Successfully created user-responses bucket");
        }
      } else {
        console.log("User-responses bucket already exists");
      }

      // Update bucket to be public regardless
      await supabase.storage.updateBucket("user-responses", {
        public: true,
      });
    } catch (err) {
      console.log("User-responses bucket operation error:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in create-buckets API route:", err);
    return NextResponse.json({ success: false, error: err }, { status: 500 });
  }
}
