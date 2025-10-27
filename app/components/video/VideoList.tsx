import { useState } from "react";
import Image from "next/image";

interface Video {
  _id: string;
  title: string;
  channelAvatar: string;
  channelName: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  createdAt: string;
}

type VideoListProps = {
  videos: Video[];
  onEdit: (video: Video) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onRefresh: () => void;
};

export default function VideoList({
  videos,
  onEdit,
  onRefresh,
}: VideoListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      } else {
        alert("Failed to delete video");
      }
    } catch {
      alert("Error deleting video");
    } finally {
      setDeletingId(null);
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Video Library ({videos.length} videos)
        </h3>

        {videos.length === 0 ? (
          <p className="text-gray-500">No videos added yet.</p>
        ) : (
          <div className="space-y-4">
            {videos.map((video: Video) => (
              <div
                key={video._id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-32 h-20 object-cover rounded"
                  />

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Image
                        src={video.channelAvatar}
                        alt={video.channelName}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span className="text-sm text-gray-600">
                        {video.channelName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{formatViewCount(video.viewCount)} views</span>
                      <span>{video.duration}</span>
                      <span>
                        {new Date(video.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onEdit(video)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(video._id)}
                      disabled={deletingId === video._id}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === video._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
