"use client";

import Link from "next/link";
import { useFaces } from "@/hooks/useFaces";
import FaceRegistrationForm from "@/components/admin/FaceRegistrationForm";
import FaceGrid from "@/components/admin/FaceGrid";

export default function AdminPage() {
  const { faces, loading, error, registerFace, updateFace, deleteFace } = useFaces();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
              AI
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">FACE MANAGEMENT</h1>
              <p className="text-[10px] text-gray-400 -mt-0.5 tracking-widest uppercase">
                Registration & Administration
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
          <span className="text-sm font-semibold text-blue-400">HERACX.AI</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <FaceRegistrationForm onRegister={registerFace} />

        <div>
          <h2 className="text-lg font-semibold mb-4">
            Registered Faces
            {!loading && <span className="text-sm text-gray-500 font-normal ml-2">({faces.length})</span>}
          </h2>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <FaceGrid faces={faces} onUpdate={updateFace} onDelete={deleteFace} />
          )}
        </div>
      </main>
    </div>
  );
}
