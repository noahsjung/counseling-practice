export async function createRequiredBuckets() {
  // Just trigger the API endpoints that use service role key
  try {
    // Create/fix storage buckets only
    const response = await fetch("/api/create-buckets");
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Error creating buckets:", err);
    return { success: false, error: err };
  }
}
