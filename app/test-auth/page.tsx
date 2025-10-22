"use client";

import { useState } from "react";
import bcrypt from "bcryptjs";

export default function TestAuthPage() {
  const [password, setPassword] = useState("testPassword123!");
  const [hash, setHash] = useState("");
  const [testResult, setTestResult] = useState("");
  const [verifyResult, setVerifyResult] = useState("");

  const generateHash = async () => {
    try {
      const newHash = await bcrypt.hash(password, 12);
      setHash(newHash);
      setTestResult(`Generated hash: ${newHash}`);
    } catch (error) {
      setTestResult(`Error generating hash: ${error}`);
    }
  };

  const verifyPassword = async () => {
    if (!hash) {
      setVerifyResult("Please generate a hash first");
      return;
    }

    try {
      const isValid = await bcrypt.compare(password, hash);
      setVerifyResult(`Password verification: ${isValid ? "VALID" : "INVALID"}`);
    } catch (error) {
      setVerifyResult(`Error verifying password: ${error}`);
    }
  };

  const testExistingHash = async () => {
    const existingHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.A5iVqLHny";
    try {
      const isValid = await bcrypt.compare(password, existingHash);
      setVerifyResult(`Test with existing hash: ${isValid ? "VALID" : "INVALID"}`);
    } catch (error) {
      setVerifyResult(`Error testing existing hash: ${error}`);
    }
  };

  const testEnvVars = () => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "Not set";
    const hasHash = !!process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH;
    setTestResult(`Admin Email: ${adminEmail}\nHas Hash: ${hasHash}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Password Hash Tester
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Password Testing</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={generateHash}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Generate Hash
                </button>
                <button
                  onClick={verifyPassword}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Verify Password
                </button>
                <button
                  onClick={testExistingHash}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Test Existing Hash
                </button>
                <button
                  onClick={testEnvVars}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Check Environment
                </button>
              </div>

              {hash && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generated Hash
                  </label>
                  <textarea
                    value={hash}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>

            {testResult && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Generation Result:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {testResult}
                </pre>
              </div>
            )}

            {verifyResult && (
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Verification Result:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                  {verifyResult}
                </pre>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Expected Values:</h3>
              <div className="text-sm text-blue-700">
                <p><strong>Email:</strong> admin@test.com</p>
                <p><strong>Password:</strong> testPassword123!</p>
                <p><strong>Hash starts with:</strong> $2a$12$LQv3...</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
              <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
              <div className="text-xs text-yellow-700">
                <p>Check browser console for NextAuth debug logs</p>
                <p>Check server terminal for auth debug messages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Known Good Hashes</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="p-2 bg-gray-50 rounded">
              <strong>testPassword123!</strong><br />
              $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj.A5iVqLHny
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
