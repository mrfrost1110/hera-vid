"use client";

import { useState, useEffect, useCallback } from "react";
import { FaceEntry } from "@/lib/types";

export function useFaces() {
  const [faces, setFaces] = useState<FaceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faces");
      if (!res.ok) throw new Error("Failed to fetch faces");
      const data = await res.json();
      setFaces(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaces();
  }, [fetchFaces]);

  const registerFace = useCallback(
    async (name: string, image: File | Blob | string) => {
      const formData = new FormData();
      formData.append("name", name);

      if (typeof image === "string") {
        // base64 data URL
        formData.append("image_base64", image);
      } else {
        formData.append("image", image);
      }

      const res = await fetch("/api/faces", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to register face");
      }

      await fetchFaces();
      return res.json();
    },
    [fetchFaces]
  );

  const updateFace = useCallback(
    async (id: number, name: string) => {
      const formData = new FormData();
      formData.append("name", name);

      const res = await fetch(`/api/faces/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update face");
      await fetchFaces();
    },
    [fetchFaces]
  );

  const deleteFace = useCallback(
    async (id: number) => {
      const res = await fetch(`/api/faces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete face");
      await fetchFaces();
    },
    [fetchFaces]
  );

  return { faces, loading, error, registerFace, updateFace, deleteFace, refetch: fetchFaces };
}
