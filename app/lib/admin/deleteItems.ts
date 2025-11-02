export async function deleteItems(
  type: "galleries" | "photos" | "videos",
  ids: string[],
): Promise<{ success: boolean; message: string }> {
  if (!ids.length) {
    return { success: false, message: "No items selected." };
  }

  if (!confirm(`Delete ${ids.length} ${type}(s)? This cannot be undone.`))
    return { success: false, message: "Cancelled." };

  try {
    const res = await fetch(`/api/${type}?ids=${encodeURIComponent(ids.join(","))}`, {
      method: "DELETE",
    });
    const json = await res.json();

    if (!json?.success) {
      return {
        success: false,
        message: json?.error || `Failed to delete ${type}(s).`,
      };
    }

    return {
      success: true,
      message: `${json.deletedCount} ${type} deleted successfully.`,
    };
  } catch (err) {
    console.error(`Failed to delete ${type}(s):`, err);
    return { success: false, message: "Network or API error." };
  }
}