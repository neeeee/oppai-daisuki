"use client";

import { useState } from "react";
import TagInput from "../../components/admin/TagInput";

export default function TestTagsPage() {
  const [tags1, setTags1] = useState<string[]>([]);
  const [tags2, setTags2] = useState<string[]>(["existing", "tags", "here"]);
  const [tags3, setTags3] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          TagInput Component Test
        </h1>

        <div className="space-y-8">
          {/* Test 1: Empty tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test 1: Empty Tags</h2>
            <TagInput
              tags={tags1}
              onChange={setTags1}
              label="Empty Tags Test"
              placeholder="Start typing to add tags..."
            />
            <div className="mt-4 text-sm text-gray-600">
              <strong>Current tags:</strong> {JSON.stringify(tags1)}
            </div>
          </div>

          {/* Test 2: Pre-populated tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test 2: Pre-populated Tags</h2>
            <TagInput
              tags={tags2}
              onChange={setTags2}
              label="Pre-populated Tags Test"
              placeholder="Add more tags..."
            />
            <div className="mt-4 text-sm text-gray-600">
              <strong>Current tags:</strong> {JSON.stringify(tags2)}
            </div>
          </div>

          {/* Test 3: Custom styling */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test 3: Custom Styling</h2>
            <TagInput
              tags={tags3}
              onChange={setTags3}
              label="Custom Style Test"
              placeholder="Try different interactions..."
              className="border-2 border-purple-200"
            />
            <div className="mt-4 text-sm text-gray-600">
              <strong>Current tags:</strong> {JSON.stringify(tags3)}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              How to Test
            </h2>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>Type text and press Enter to add a tag</li>
              <li>Type text and press comma (,) to add a tag</li>
              <li>Click the × button to remove a tag</li>
              <li>Press Backspace on empty input to remove the last tag</li>
              <li>Press Escape to blur the input</li>
              <li>Click anywhere in the tag container to focus the input</li>
              <li>Try typing multiple words and separating with commas</li>
            </ul>
          </div>

          {/* Reset buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setTags1([])}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Test 1
            </button>
            <button
              onClick={() => setTags2(["existing", "tags", "here"])}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset Test 2
            </button>
            <button
              onClick={() => setTags3([])}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Clear Test 3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
