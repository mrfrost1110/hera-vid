"use client";

import { useState } from "react";
import { FaceEntry } from "@/lib/types";

interface FaceGridProps {
  faces: FaceEntry[];
  onUpdate: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function FaceGrid({ faces, onUpdate, onDelete }: FaceGridProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const startEdit = (face: FaceEntry) => {
    setEditingId(face.id);
    setEditName(face.name);
  };

  const saveEdit = async () => {
    if (editingId === null || !editName.trim()) return;
    await onUpdate(editingId, editName.trim());
    setEditingId(null);
  };

  const confirmDelete = async (id: number) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (faces.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p>No faces registered yet</p>
        <p className="text-sm text-gray-600 mt-1">Register a face using the form above</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {faces.map((face) => (
        <div
          key={face.id}
          className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden group"
        >
          <div className="aspect-square bg-gray-800 relative">
            <img
              src={`/api/faces/${face.id}/image`}
              alt={face.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-3">
            {editingId === face.id ? (
              <div className="flex gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                  className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={saveEdit}
                  className="px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <p className="font-medium text-sm truncate">{face.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(face.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(face)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(face.id)}
                    disabled={deletingId === face.id}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {deletingId === face.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
