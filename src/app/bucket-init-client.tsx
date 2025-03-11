"use client";

import { useEffect, useState } from "react";

export function BucketInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      // Only call create-buckets to avoid module errors
      fetch("/api/create-buckets")
        .then((response) => response.json())
        .then((data) => {
          console.log("Bucket initialization result:", data);
          setInitialized(true);
        })
        .catch((err) => console.error("Failed to initialize buckets:", err));
    }
  }, [initialized]);

  return null;
}
