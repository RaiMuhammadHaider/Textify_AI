import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ArrowRight, FileText, ImageIcon, Loader2, Square, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
// import { FileUploadButton } from "./file-upload-button";
import { FileUploadButton } from "./fileUploadButton";
import { WritingPromptsToolbar } from "./writing-prompts-toolbar";

export interface ChatInputProps {
  className?: string;
  sendMessage: (message: { text: string }) => Promise<void> | void;
  isGenerating?: boolean;
  onStopGenerating?: () => void;
  placeholder?: string;
  value: string;
  onValueChange: (text: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  showPromptToolbar?: boolean;
  channelId?: string;
  backendUrl?: string;
}

interface SelectedFile {
  base64: string;
  mimeType: string;
  fileName: string;
  previewUrl?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  className,
  sendMessage,
  isGenerating,
  onStopGenerating,
  placeholder = "Ask me to write something, or paste text to improve...",
  value,
  onValueChange,
  textareaRef: externalTextareaRef,
  showPromptToolbar = false,
  channelId,
  backendUrl,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalTextareaRef || internalTextareaRef;

  const handlePromptSelect = (prompt: string) => {
    onValueChange(value ? `${value.trim()} ${prompt}` : prompt);
    textareaRef.current?.focus();
  };

  const updateTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [textareaRef]);

  useEffect(() => {
    updateTextareaHeight();
  }, [value, updateTextareaHeight]);

  const handleFileSelect = (file: SelectedFile) => {
    setSelectedFile(file);
    textareaRef.current?.focus();
  };

  const handleRemoveFile = () => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!value.trim() && !selectedFile) || isLoading || isGenerating) return;

    setIsLoading(true);
    try {
      // File + text ek saath bhejo
      if (selectedFile && channelId && backendUrl) {
        const response = await fetch(`${backendUrl}/analyze-file`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64Data: selectedFile.base64,
            mimeType: selectedFile.mimeType,
            fileName: selectedFile.fileName,
            prompt: value.trim() || undefined,
            channelId,
            channelType: "messaging",
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.reason || "File analysis failed");
        }

        // File remove karo
        handleRemoveFile();
        onValueChange("");
      } else if (value.trim()) {
        // Normal text message
        await sendMessage({ text: value.trim() });
        onValueChange("");
      }

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const canSend = (value.trim() || selectedFile) && !isLoading && !isGenerating;

  return (
    <div
      className={cn(
        "flex flex-col bg-background",
        showPromptToolbar && "border-t border-border/50"
      )}
    >
      {showPromptToolbar && (
        <WritingPromptsToolbar onPromptSelect={handlePromptSelect} />
      )}

      <div className={cn("p-4", className)}>
        {/* File Preview — ChatGPT style */}
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-muted/40 rounded-lg border border-border/50 w-fit max-w-xs">
            {selectedFile.previewUrl ? (
              <img
                src={selectedFile.previewUrl}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-md flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-red-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{selectedFile.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile.mimeType === "application/pdf" ? "PDF" : "Image"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              className="h-6 w-6 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Input Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFile
                ? "Ask something about this file... (or press Enter to analyze)"
                : placeholder
            }
            className={cn(
              "min-h-[44px] max-h-[120px] resize-none py-3 pl-4 pr-24 text-sm",
              "border-input focus:border-primary/50 rounded-lg",
              "transition-colors duration-200 bg-background"
            )}
            disabled={isLoading || isGenerating}
          />

          {/* Right side buttons */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* File Upload */}
            {channelId && backendUrl && !isGenerating && !selectedFile && (
              <FileUploadButton onFileSelect={handleFileSelect} />
            )}

            {/* Clear text */}
            {value.trim() && !isLoading && !isGenerating && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onValueChange("")}
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            {/* Send / Stop */}
            {isGenerating ? (
              <Button
                type="button"
                onClick={onStopGenerating}
                className="h-8 w-8 rounded-md p-0"
                variant="destructive"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={!canSend}
                className={cn(
                  "h-8 w-8 rounded-md p-0 transition-all duration-200",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  !canSend ? "bg-muted hover:bg-muted" : ""
                )}
                variant={canSend ? "default" : "ghost"}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};