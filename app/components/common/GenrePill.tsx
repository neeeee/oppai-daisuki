'use client'

import Link from "next/link"

interface Genre {
    _id: string;
    name: string;
    slug: string;
    color?: string | undefined;
}

export default function GenrePill({ _id, name, slug, color}: Genre) {
    return (
        <>
            <Link
                href={`/genres/${slug}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity"
                style={{ backgroundColor: color || "#6366f1" }}
            >
                {name}
            </Link>
        </>
    )
}