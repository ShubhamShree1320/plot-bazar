"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import CoordinateTagger from "./CoordinateTagger";

interface UploadedImage {
  file: File;
  preview: string;
  name: string;
  coordinates: { x: number; y: number; label: string }[];
}

interface ImageUploaderProps {
  plotId?: string;
  onUpload?: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [taggerIndex, setTaggerIndex] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const remaining = 20 - images.length;
    if (remaining <= 0) return;

    const newImages: UploadedImage[] = fileArr.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      coordinates: [],
    }));

    const updated = [...images, ...newImages];
    setImages(updated);
    onUpload?.(updated);
  }, [images, onUpload]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onUpload?.(updated);
    if (taggerIndex === index) setTaggerIndex(null);
  }

  function updateCoordinates(index: number, coords: { x: number; y: number; label: string }[]) {
    const updated = images.map((img, i) => i === index ? { ...img, coordinates: coords } : img);
    setImages(updated);
    onUpload?.(updated);
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
      >
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600">Drag & drop images here</p>
        <p className="text-xs text-gray-400 mb-3">or</p>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Browse Files
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </label>
        <p className="text-xs text-gray-400 mt-2">Up to 20 images, JPG/PNG/WebP ({images.length}/20)</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div key={i} className={`relative rounded-lg overflow-hidden border-2 transition-colors
              ${i === 0 ? "border-blue-400" : "border-gray-200"} ${taggerIndex === i ? "ring-2 ring-blue-500" : ""}`}>
              <div className="relative aspect-square">
                <Image src={img.preview} alt={img.name} fill className="object-cover" />
              </div>

              {i === 0 && (
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Primary
                </div>
              )}

              {img.coordinates.length > 0 && (
                <div className="absolute top-1 right-7 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {img.coordinates.length} pins
                </div>
              )}

              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>

              <button
                onClick={() => setTaggerIndex(taggerIndex === i ? null : i)}
                className="absolute bottom-1 right-1 bg-gray-900/70 text-white rounded p-1 hover:bg-gray-900"
              >
                <ImageIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {taggerIndex !== null && images[taggerIndex] && (
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Tagging: <span className="text-blue-600">{images[taggerIndex].name}</span>
          </p>
          <CoordinateTagger
            imageUrl={images[taggerIndex].preview}
            initialCoords={images[taggerIndex].coordinates}
            onSave={(coords) => updateCoordinates(taggerIndex, coords)}
          />
        </div>
      )}
    </div>
  );
}
