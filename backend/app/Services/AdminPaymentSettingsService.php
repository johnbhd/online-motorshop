<?php

namespace App\Services;

use App\Models\PaymentSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class AdminPaymentSettingsService
{
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
    public function update(array $attributes, ?UploadedFile $qrImage): array
    {
        $setting = PaymentSetting::query()->find(1);

        if (! $setting) {
            $setting = new PaymentSetting;
            $setting->id = 1;
        }

        $previousQrPath = $setting->qr_image_path;
        $newQrPath = null;

        if ($qrImage !== null) {
            $newQrPath = $qrImage->store('payment-settings', 'public');

            if (! is_string($newQrPath) || $newQrPath === '') {
                throw new RuntimeException('The payment QR image could not be stored.');
            }
        }

        $setting->fill(array_intersect_key($attributes, array_flip([
            'gcash_account_name',
            'gcash_number',
            'payment_instructions',
        ])));

        if ($newQrPath !== null) {
            $setting->qr_image_path = $newQrPath;
        } elseif (filter_var($attributes['remove_qr_image'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $setting->qr_image_path = null;
        }

        try {
            DB::transaction(fn () => $setting->save());
        } catch (Throwable $exception) {
            if ($newQrPath !== null) {
                Storage::disk('public')->delete($newQrPath);
            }

            throw $exception;
        }

        if ($previousQrPath && $previousQrPath !== $setting->qr_image_path) {
            Storage::disk('public')->delete($previousQrPath);
        }

        return $this->settingsPayload($setting->fresh());
    }

    private function settingsPayload(?PaymentSetting $setting): array
    {
        return [
            'gcash_account_name' => $setting?->gcash_account_name,
            'gcash_number' => $setting?->gcash_number,
            'payment_instructions' => $setting?->payment_instructions,
            'qr_image_url' => $setting?->qr_image_path
                ? Storage::disk('public')->url($setting->qr_image_path)
                : null,
            'is_configured' => (bool) ($setting?->gcash_account_name
                || $setting?->gcash_number
                || $setting?->payment_instructions
                || $setting?->qr_image_path),
            'updated_at' => $setting?->updated_at?->toISOString(),
        ];
    }
}
