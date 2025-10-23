def estimate_uploadthing_cost(
    videos_per_week: int,
    video_size_mb: float,
    images_per_week: int,
    image_size_mb: float,
    cost_per_gb: float = 0.20
) -> float:
    MB_PER_GB = 1024
    weeks_per_month = 4
    monthly_upload_gb = (
        (videos_per_week * video_size_mb + images_per_week * image_size_mb)
        * weeks_per_month
        / MB_PER_GB
    )
    monthly_cost = monthly_upload_gb * cost_per_gb
    return round(monthly_cost, 2)


cost = estimate_uploadthing_cost(10, 800, 10, 1)
print(f"Estimated monthly UploadThing cost: ${cost}")
