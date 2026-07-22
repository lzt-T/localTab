import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type FileDropZoneProps = {
  accept: string;
  title: string;
  description: string;
  disabled?: boolean;
  onFileSelect: (file: File) => void | Promise<void>;
};

export default function FileDropZone({
  accept,
  title,
  description,
  disabled = false,
  onFileSelect,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const selectFile = (file?: File) => {
    if (!file || disabled) return;
    void onFileSelect(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  return (
    <div
      data-dragging={isDragging}
      className="group rounded-xl border border-dashed border-white/20 bg-white/[0.035] transition-colors data-[dragging=true]:border-blue-300/70 data-[dragging=true]:bg-blue-400/10"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        className="h-auto min-h-24 w-full cursor-pointer flex-col gap-2 whitespace-normal rounded-xl bg-transparent px-6 py-5 text-white hover:bg-white/[0.06] hover:text-white group-data-[dragging=true]:text-blue-100"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={22} className="text-blue-200/90" />
        <span>{title}</span>
        <span className="text-xs font-normal text-white/55">{description}</span>
      </Button>
    </div>
  );
}
