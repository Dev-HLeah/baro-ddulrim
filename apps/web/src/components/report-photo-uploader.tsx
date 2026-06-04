"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AttachmentPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

const maxAttachments = 5;

export function ReportPhotoUploader() {
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const remainingCount = maxAttachments - attachments.length;
  const helperText = useMemo(() => {
    if (remainingCount <= 0) {
      return "사진이나 영상은 최대 5개까지 첨부할 수 있습니다.";
    }

    return "사진이나 영상을 첨부하면 더 정확하게 담당 업체에 배정될 수 있습니다.";
  }, [remainingCount]);

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
    };
  }, [attachments]);

  function handleFiles(files: FileList | null) {
    if (!files) {
      return;
    }

    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .slice(0, remainingCount)
      .map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file)
      }));

    setAttachments((current) => [...current, ...selected].slice(0, maxAttachments));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((attachment) => attachment.id !== id);
    });
  }

  return (
    <div className="photo-uploader">
      <div className="photo-uploader-header">
        <div>
          <label htmlFor="report-photos">사진/영상 첨부</label>
          <p>{helperText}</p>
        </div>
        <button
          className="secondary-button"
          disabled={remainingCount <= 0}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          <ImagePlus aria-hidden="true" size={18} />
          사진/영상 선택
        </button>
      </div>

      <input
        accept="image/*,video/*"
        className="visually-hidden"
        id="report-photos"
        multiple
        name="attachments"
        onChange={(event) => handleFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />

      {attachments.length > 0 ? (
        <div className="photo-preview-grid" aria-label="첨부한 사진과 영상">
          {attachments.map((attachment) => (
            <figure className="photo-preview" key={attachment.id}>
              {attachment.file.type.startsWith("video/") ? (
                <video aria-label={attachment.file.name} muted src={attachment.previewUrl} />
              ) : (
                <img alt={attachment.file.name} src={attachment.previewUrl} />
              )}
              <figcaption>{attachment.file.name}</figcaption>
              <button
                aria-label={`${attachment.file.name} 삭제`}
                className="icon-button"
                onClick={() => removeAttachment(attachment.id)}
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
