"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type PhotoPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

const maxPhotos = 5;

export function ReportPhotoUploader() {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingCount = maxPhotos - photos.length;
  const helperText = useMemo(() => {
    if (remainingCount <= 0) {
      return "사진은 최대 5장까지 첨부할 수 있습니다.";
    }

    return "사진이나 영상을 첨부하면 더 정확하게 담당 업체에 배정될 수 있습니다.";
  }, [remainingCount]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, [photos]);

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remainingCount)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    setPhotos((current) => [...current, ...selected].slice(0, maxPhotos));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((photo) => photo.id !== id);
    });
  }

  return (
    <div className="photo-uploader">
      <div className="photo-uploader-header">
        <div>
          <label htmlFor="report-photos">사진 첨부</label>
          <p>{helperText}</p>
        </div>
        <button
          className="secondary-button"
          disabled={remainingCount <= 0}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={18} />
          사진 선택
        </button>
      </div>

      <input
        accept="image/*"
        className="visually-hidden"
        id="report-photos"
        multiple
        name="photos"
        onChange={(event) => handleFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />

      {photos.length > 0 ? (
        <div className="photo-preview-grid" aria-label="첨부한 사진">
          {photos.map((photo) => (
            <figure className="photo-preview" key={photo.id}>
              <img alt={photo.file.name} src={photo.previewUrl} />
              <figcaption>{photo.file.name}</figcaption>
              <button
                aria-label={`${photo.file.name} 삭제`}
                className="icon-button"
                onClick={() => removePhoto(photo.id)}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
