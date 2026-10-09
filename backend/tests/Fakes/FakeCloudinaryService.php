<?php

namespace Tests\Fakes;

use App\Services\CloudinaryService;
use App\Services\CloudinaryServiceException;
use Illuminate\Http\UploadedFile;

class FakeCloudinaryService extends CloudinaryService
{
    public bool $failUploads = false;

    public bool $failDeletes = false;

    /** @var array<int, array{secure_url: string, public_id: string, folder: string}> */
    public array $uploads = [];

    /** @var array<int, string> */
    public array $deletions = [];

    public function uploadImage(UploadedFile $file, string $folder): array
    {
        if ($this->failUploads) {
            throw new CloudinaryServiceException(
                'Image storage is temporarily unavailable. Please try again.',
            );
        }

        $publicId = trim($folder, '/').'/fake-'.(count($this->uploads) + 1);
        $asset = [
            'secure_url' => 'https://res.cloudinary.com/test/image/upload/'.$publicId.'.'.$file->extension(),
            'public_id' => $publicId,
            'folder' => trim($folder, '/'),
        ];
        $this->uploads[] = $asset;

        return [
            'secure_url' => $asset['secure_url'],
            'public_id' => $asset['public_id'],
        ];
    }

    public function deleteImage(?string $publicId): bool
    {
        if ($publicId) {
            $this->deletions[] = $publicId;
        }

        return ! $this->failDeletes;
    }
}
