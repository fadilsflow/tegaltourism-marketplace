"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface CloudinaryInfo {
    secure_url: string;
}

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    description?: string;
    maxFileSize?: number; // in bytes
    uploadPreset?: string;
}

export function ImageUpload({
    value,
    onChange,
    label = "Upload Image",
    description = "Upload an image",
    maxFileSize = 1024 * 1024 * 2, // 2MB default
    uploadPreset = "jrm"
}: ImageUploadProps) {

    return (
        <div className="flex flex-col gap-4">
            {!value ? (
                <CldUploadWidget
                    uploadPreset={uploadPreset}
                    signatureEndpoint="/api/sign-cloudinary-params"
                    onSuccess={(result, { widget }) => {
                        const info = result?.info as CloudinaryInfo;
                        if (info?.secure_url) {
                            onChange(info.secure_url);
                        }
                        widget.close();
                    }}
                    onQueuesEnd={(result, { widget }) => {
                        widget.close();
                    }}
                    onError={(error) => {
                        console.error("Upload error:", error);
                    }}
                    options={{
                        maxFiles: 1,
                        maxFileSize: maxFileSize,
                        resourceType: "image",
                        sources: ["local", "camera", "url"],
                        multiple: false,
                    }}
                >
                    {({ open }) => {
                        function handleOnClick() {
                            // setIsUploading(true);
                            open();
                        }
                        return (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-24 flex flex-col items-center justify-center cursor-pointer"
                                onClick={handleOnClick}
                            >

                                <ImageIcon className="h-6 w-6" />
                                <span>{label}</span>
                                <span className="text-xs text-muted-foreground">
                                    {description}
                                </span>

                            </Button>
                        );
                    }}
                </CldUploadWidget>
            ) : (
                <div className="relative w-full">
                    <div className="relative h-full w-full overflow-hidden rounded-lg border p-3 flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Image
                                src={value}
                                alt="Uploaded image"
                                width={50}
                                height={50}
                                className="object-cover"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">
                                {label}
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => {
                                onChange("");
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}