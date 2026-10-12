<?php

namespace App\Services;

use App\Models\MediaAsset;
use App\Models\PaymentSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class AdminPaymentSettingsService
{
    public function __construct(
        private readonly CloudinaryService $cloudinaryService,
        private readonly MediaAssetService $mediaAssetService,
    ) {}

    public function show(): array
    {
        return $this->settingsPayload(PaymentSetting::query()->find(1));
    }

    public function publicInstructions(): array
    {
        $settings = $this->settingsPayload(PaymentSetting::query()->find(1));

        return [
            'payment_instructions' => [
                'configured' => $settings['is_configured'],
                'gcash_account_name' => $settings['gcash_account_name'],
                'gcash_number' => $settings['gcash_number'],
                'payment_instructions' => $settings['payment_instructions'],
                'qr_image_url' => $settings['qr_image_url'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(
        array $attributes,
        ?UploadedFile $qrImage,
        ?User $actor = null,
    ): array {
        $setting = PaymentSetting::query()->find(1);

        if (! $setting) {
            $setting = new PaymentSetting;
            $setting->id = 1;
        }

        $previousQrPath = $setting->qr_image_path;
        $previousQrPublicId = $setting->qr_image_public_id;
        $previousQrUrl = $setting->qr_image_url;
        $newAsset = null;
        $removeQrImage = filter_var(
            $attributes['remove_qr_image'] ?? false,
            FILTER_VALIDATE_BOOLEAN,
        );

        if ($qrImage !== null) {
            $newAsset = $this->cloudinaryService->uploadImage(
                $qrImage,
                'ald-motorshop/payment-settings',
            );
        }

        $setting->fill(array_intersect_key($attributes, array_flip([
            'gcash_account_name',
            'gcash_number',
            'payment_instructions',
        ])));

        if ($newAsset !== null) {
            $setting->qr_image_path = null;
            $setting->qr_image_url = $newAsset['secure_url'];
            $setting->qr_image_public_id = $newAsset['public_id'];
        } elseif ($removeQrImage) {
            $setting->qr_image_path = null;
            $setting->qr_image_url = null;
            $setting->qr_image_public_id = null;
        }

        try {
            DB::transaction(function () use ($setting, $newAsset, $actor): void {
                $setting->save();

                if ($newAsset !== null) {
                    $this->mediaAssetService->registerUploadedAsset(
                        $newAsset,
                        MediaAsset::PURPOSE_PAYMENT_QR,
                        'payment_setting',
                        (int) $setting->id,
                        $actor,
                    );
                }
            });
        } catch (Throwable $exception) {
            if ($newAsset !== null) {
                $this->cloudinaryService->deleteImage($newAsset['public_id']);
            }

            throw $exception;
        }

        if (($newAsset !== null || $removeQrImage)
            && $previousQrPublicId
            && $previousQrPublicId !== $setting->qr_image_public_id) {
            $this->mediaAssetService->cleanupLinkedAsset(
                'payment_setting',
                (int) $setting->id,
                $previousQrPublicId,
                $previousQrUrl,
                $actor,
            );
        }

        if (($newAsset !== null || $removeQrImage)
            && $previousQrPath
            && $previousQrPath !== $setting->qr_image_path) {
            Storage::disk('public')->delete($previousQrPath);
        }

        return $this->settingsPayload($setting->fresh());
    }

    private function settingsPayload(?PaymentSetting $setting): array
    {
        $qrImageUrl = $setting?->qr_image_url
            ?: ($setting?->qr_image_path
                ? Storage::disk('public')->url($setting->qr_image_path)
                : null);

        return [
            'gcash_account_name' => $setting?->gcash_account_name,
            'gcash_number' => $setting?->gcash_number,
            'payment_instructions' => $setting?->payment_instructions,
            'qr_image_url' => $qrImageUrl,
            'is_configured' => (bool) ($setting?->gcash_account_name
                || $setting?->gcash_number
                || $setting?->payment_instructions
                || $qrImageUrl),
            'updated_at' => $setting?->updated_at?->toISOString(),
        ];
    }
}
