"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import EnhancedVideoForm from "../components/video/VideoForm";
import VideoList from "../components/video/VideoList";

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  videoSourceUrl: string;
  createdAt: string;
}

export default function AdminVideos() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState<Video[]>([]);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchVideos();
    }
  }, [status, session]);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      const data = await response.json();
      if (data.success) {
        setVideos(data.data);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (formData: Omit<Video, "_id" | "createdAt">) => {
    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchVideos();
        setShowForm(false);
        alert("Video added successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to add video: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Error adding video");
      console.error("Error adding video:", error);
    }
  };

  const handleEditVideo = async (
    formData: Omit<Video, "_id" | "createdAt">,
  ) => {
    if (!editingVideo) return;

    try {
      const response = await fetch(`/api/videos/${editingVideo._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchVideos();
        setEditingVideo(null);
        alert("Video updated successfully!");
      } else {
        const errorData = await response.json();
        alert(`Failed to update video: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Error updating video");
      console.error("Error updating video:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <div className="text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-2">Access Denied</div>
          <div className="text-gray-600">Admin privileges required</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Video Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your video library with file uploads
        </p>
      </div>

      <div className="mb-6">
        {!showForm && !editingVideo && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium text-lg"
          >
            Add New Video
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8">
          <EnhancedVideoForm
            onSubmit={handleAddVideo}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingVideo && (
        <div className="mb-8">
          <EnhancedVideoForm
            onSubmit={handleEditVideo}
            initialData={editingVideo}
            onCancel={() => setEditingVideo(null)}
          />
        </div>
      )}

      <VideoList
        videos={videos}
        onEdit={setEditingVideo}
        onRefresh={fetchVideos}
      />
    </>
  );
}
