import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText, ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import React, { useRef, useState } from "react";

interface FileUploadButtonProps {
  onFileSelect: (file: { base64: string; mimeType: string; fileName: string; previewUrl?: string }) => void;
  className?: string;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const MAX_SIZE_MB = 10;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_TYPES.includes(file.type)) {
      alert("Only PDF, JPEG, PNG, GIF, WebP supported");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_SIZE_MB}MB`);
      return;
    }

    const base64 = await fileToBase64(file);
    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;

    onFileSelect({
      base64,
      mimeType: file.type,
      fileName: file.name,
      previewUrl,
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
        title="Upload PDF or Image"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </div>
  );
};