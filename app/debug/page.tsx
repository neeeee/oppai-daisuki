"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [testResult, setTestResult] = useState("");

  const testAuth = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  const testSignIn = async () => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@test.com",
          password: "testPassword123!",
        }),
      });
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          NextAuth Debug Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>
            <div className="space-y-2">
              <p>
                <strong>Status:</strong> {status}
              </p>
              <div>
                <strong>Session Data:</strong>
                <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
            <div className="space-y-4">
              <button
                onClick={testAuth}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test Auth Session
              </button>
              <button
                onClick={testSignIn}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Test Sign In
              </button>
            </div>

            {testResult && (
              <div className="mt-4">
                <strong>Test Result:</strong>
                <pre className="bg-gray-100 p-3 rounded text-xs mt-2 overflow-auto">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>NextAuth URL:</strong>{" "}
              {process.env.NEXT_PUBLIC_NEXTAUTH_URL || "Not set"}
            </div>
            <div>
              <strong>Node Environment:</strong> {process.env.NODE_ENV}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Test Credentials
          </h2>
          <div className="text-sm text-yellow-700">
            <p>Email: admin@test.com</p>
            <p>Password: testPassword123!</p>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Navigation Links
          </h2>
          <div className="space-x-4">
            <Link
              href="/admin/login"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Go to Admin Login
            </Link>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Go to Admin Dashboard
            </Link>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
