# ImageUpload Component

A reusable image upload component that integrates with Cloudinary for image uploading and management.

## Features

- Cloudinary integration for image uploads
- Preview of uploaded images
- Delete/re-upload functionality
- Customizable labels and descriptions
- File size limits
- Loading states

## Usage

```tsx
import { ImageUpload } from "@/components/image-upload";

// Basic usage
<ImageUpload
  value={field.value || ""}
  onChange={field.onChange}
/>

// With custom props
<ImageUpload
  value={field.value || ""}
  onChange={field.onChange}
  label="Upload Logo"
  description="Maximum file size 2MB"
  maxFileSize={1024 * 1024 * 2} // 2MB
  uploadPreset="your-preset"
/>
```

## Props

| Prop         | Type     | Default           | Description                                |
| ------------ | -------- | ----------------- | ------------------------------------------ |
| value        | string   | ""                | The current image URL                      |
| onChange     | function | required          | Callback when image is uploaded or removed |
| label        | string   | "Upload Image"    | Label text for the upload button           |
| description  | string   | "Upload an image" | Description text for the upload button     |
| maxFileSize  | number   | 2MB               | Maximum file size in bytes                 |
| uploadPreset | string   | "jrm"             | Cloudinary upload preset                   |

## Integration

The component uses the `/api/sign-cloudinary-params` endpoint for signing upload requests. Make sure this endpoint is properly configured in your application.

## Examples

Used in:

- `src/app/seller-new/page.tsx` - Store logo upload
- `src/app/settings/page.tsx` - User profile image and store logo uploads
- `src/app/seller/products/new/page.tsx` - Product image upload
- `src/app/seller/products/[id]/page.tsx` - Product image edit

## Recent Improvements

1. Fixed TypeScript error by removing explicit `any` type
2. Improved slug field behavior to properly handle user input in forms
3. Enhanced real-time slug generation in both seller-new and product-new pages
4. Added ImageUpload component to product edit page
