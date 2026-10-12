export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const IMAGE_UPLOAD_ACCEPT_ATTRIBUTE =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export const IMAGE_UPLOAD_HELP_TEXT = "JPG, PNG, or WEBP up to 5 MB.";

export function validateImageFile(
  file: File | null | undefined,
  label = "image",
): string | null {
  if (!file) {
    return null;
  }

  if (
    !IMAGE_UPLOAD_ACCEPTED_TYPES.includes(
      file.type as (typeof IMAGE_UPLOAD_ACCEPTED_TYPES)[number],
    )
  ) {
    return "Please choose a supported image format: JPG, PNG, or WEBP.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `The selected ${label} is too large. Maximum file size is 5 MB.`;
  }

  return null;
}

export function getImageUploadTransportError(status: number): string | null {
  if (status === 413) {
    return "The image is too large to upload. Maximum file size is 5 MB.";
  }

  return null;
}
