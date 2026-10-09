<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class CloudinaryService
{
    private ?Cloudinary $client = null;

    /**
     * @return array{secure_url: string, public_id: string}
     */
    public function uploadImage(UploadedFile $file, string $folder): array
    {
        try {
            $response = $this->client()->uploadApi()->upload($file->getRealPath(), [
                'folder' => trim($folder, '/'),
                'public_id' => Str::uuid()->toString(),
                'resource_type' => 'image',
                'unique_filename' => false,
                'use_filename' => false,
            ]);

            $secureUrl = trim((string) ($response['secure_url'] ?? ''));
            $publicId = trim((string) ($response['public_id'] ?? ''));

            if ($secureUrl === '' || ! str_starts_with($secureUrl, 'https://') || $publicId === '') {
                throw CloudinaryServiceException::unavailable();
            }

            return [
                'secure_url' => $secureUrl,
                'public_id' => $publicId,
            ];
        } catch (CloudinaryServiceException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('Cloudinary image upload failed.', [
                'exception_class' => $exception::class,
                'folder' => trim($folder, '/'),
            ]);

            throw CloudinaryServiceException::unavailable($exception);
        }
    }

    public function deleteImage(?string $publicId): bool
    {
        $publicId = trim((string) $publicId);

        if ($publicId === '') {
            return true;
        }

        try {
            $this->client()->uploadApi()->destroy($publicId, [
                'invalidate' => true,
                'type' => 'upload',
            ]);

            return true;
        } catch (Throwable $exception) {
            Log::warning('Cloudinary image cleanup failed.', [
                'exception_class' => $exception::class,
                'public_id_present' => true,
            ]);

            return false;
        }
    }

    private function client(): Cloudinary
    {
        if ($this->client instanceof Cloudinary) {
            return $this->client;
        }

        $this->client = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key' => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
            ],
        ]);

        return $this->client;
    }
}
