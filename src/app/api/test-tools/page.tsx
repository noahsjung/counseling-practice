"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function TestTools() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/${endpoint}`);
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Testing Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">RLS Management</h2>
          <div className="space-y-4">
            <Button
              onClick={() => runAction("disable-rls")}
              className="w-full"
              disabled={loading}
            >
              Disable RLS (All Tables)
            </Button>
            <Button
              onClick={() => runAction("disable-rls-for-upload")}
              className="w-full"
              disabled={loading}
            >
              Disable RLS (Scenarios Only)
            </Button>
            <Button
              onClick={() => runAction("fix-rls")}
              className="w-full"
              disabled={loading}
            >
              Fix RLS Policies
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Storage Management</h2>
          <div className="space-y-4">
            <Button
              onClick={() => runAction("create-buckets")}
              className="w-full"
              disabled={loading}
            >
              Create Storage Buckets
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Sample Data</h2>
          <div className="space-y-4">
            <Button
              onClick={() => runAction("seed-scenarios")}
              className="w-full"
              disabled={loading}
            >
              Create Sample Scenarios
            </Button>
            <Button
              onClick={() => runAction("seed-responses")}
              className="w-full"
              disabled={loading}
            >
              Create Sample Responses
            </Button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <p className="text-center">Loading...</p>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 border rounded-lg bg-red-50 text-red-700">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 p-4 border rounded-lg bg-gray-50">
          <p className="font-medium mb-2">Result:</p>
          <pre className="bg-white p-4 rounded border overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
