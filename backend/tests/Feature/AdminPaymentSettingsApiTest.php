<?php

namespace Tests\Feature;

use App\Models\PaymentSetting;
use App\Models\MediaAsset;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\Fakes\FakeCloudinaryService;
use Tests\TestCase;

class AdminPaymentSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app->instance(CloudinaryService::class, new FakeCloudinaryService);

        return $app;
    }

    public function test_payment_settings_are_private_for_writes_and_publicly_expose_only_customer_instructions(): void
    {
        $admin = $this->createUser('admin');
        $this->requestAs($admin)
            ->getJson('/api/admin/settings')
            ->assertOk()
            ->assertJsonPath('settings.is_configured', false)
            ->assertJsonPath('settings.gcash_number', null);

        $this->requestAs($admin)
            ->patchJson('/api/admin/settings', [
                'gcash_account_name' => 'ALD Motorshop',
                'gcash_number' => '09171234567',
                'payment_instructions' => 'Send the exact total and upload your receipt.',
            ])
            ->assertOk()
            ->assertJsonPath('settings.is_configured', true);

        $this->assertDatabaseCount('payment_settings', 1);

        $this->getJson('/api/payment-instructions')
            ->assertOk()
            ->assertJsonPath('payment_instructions.configured', true)
            ->assertJsonPath('payment_instructions.gcash_account_name', 'ALD Motorshop')
            ->assertJsonPath('payment_instructions.gcash_number', '09171234567')
            ->assertJsonMissingPath('payment_instructions.updated_at')
            ->assertJsonMissingPath('payment_instructions.qr_image_path');
    }

    public function test_admin_can_upload_replace_and_remove_payment_qr_using_cloudinary(): void
    {
        $admin = $this->createUser('admin');

        $this->requestAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/admin/settings', [
                '_method' => 'PATCH',
                'gcash_account_name' => 'ALD Motorshop',
                'gcash_number' => '09171234567',
                'payment_instructions' => 'Pay using the account details above.',
                'qr_image' => $this->fakeQrImage('qr.png'),
            ])
            ->assertOk()
            ->assertJsonPath('settings.is_configured', true);

        $setting = PaymentSetting::query()->firstOrFail();
        $originalPublicId = $setting->qr_image_public_id;
        $this->assertSame(
            'ald-motorshop/payment-settings/fake-1',
            $originalPublicId,
        );
        $this->assertNull($setting->qr_image_path);
        $this->assertDatabaseHas('media_assets', [
            'purpose' => MediaAsset::PURPOSE_PAYMENT_QR,
            'linked_type' => 'payment_setting',
            'linked_id' => 1,
            'cloudinary_public_id' => $originalPublicId,
            'status' => MediaAsset::STATUS_ACTIVE,
        ]);

        $this->requestAs($admin)
            ->post('/api/admin/settings', [
                '_method' => 'PATCH',
                'gcash_account_name' => 'ALD Motorshop',
                'gcash_number' => '09171234567',
                'payment_instructions' => 'Pay using the account details above.',
                'qr_image' => $this->fakeQrImage('replacement.png'),
            ])
            ->assertOk();

        $replacementPublicId = PaymentSetting::query()->firstOrFail()->qr_image_public_id;
        $this->assertSame(
            'ald-motorshop/payment-settings/fake-2',
            $replacementPublicId,
        );
        $this->assertDatabaseHas('media_assets', [
            'cloudinary_public_id' => $originalPublicId,
            'status' => MediaAsset::STATUS_DELETED,
        ]);

        $this->requestAs($admin)
            ->patchJson('/api/admin/settings', ['remove_qr_image' => true])
            ->assertOk()
            ->assertJsonPath('settings.qr_image_url', null);

        $this->assertDatabaseHas('media_assets', [
            'cloudinary_public_id' => $replacementPublicId,
            'status' => MediaAsset::STATUS_DELETED,
        ]);
    }

    public function test_legacy_local_payment_qr_still_has_a_public_url(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('payment-settings/legacy.png', 'legacy');
        PaymentSetting::create([
            'qr_image_path' => 'payment-settings/legacy.png',
        ]);

        $this->getJson('/api/payment-instructions')
            ->assertOk()
            ->assertJsonPath(
                'payment_instructions.qr_image_url',
                Storage::disk('public')->url('payment-settings/legacy.png'),
            );
    }

    public function test_oversized_payment_qr_is_rejected_before_storage(): void
    {
        $admin = $this->createUser('admin');

        $this->requestAs($admin)
            ->withHeader('Accept', 'application/json')
            ->post('/api/admin/settings', [
                '_method' => 'PATCH',
                'qr_image' => UploadedFile::fake()->create('large.png', 5121, 'image/png'),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['qr_image'])
            ->assertJsonPath('errors.qr_image.0', 'Payment QR image must be 5 MB or smaller.');

        $this->assertDatabaseCount('payment_settings', 0);
        $this->assertDatabaseCount('media_assets', 0);
    }

    public function test_cloudinary_failure_returns_a_safe_payment_qr_error(): void
    {
        $admin = $this->createUser('admin');
        $cloudinary = app(CloudinaryService::class);
        $cloudinary->failUploads = true;

        $this->requestAs($admin)
            ->post('/api/admin/settings', [
                '_method' => 'PATCH',
                'qr_image' => $this->fakeQrImage('qr.png'),
            ])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Image storage is temporarily unavailable. Please try again.');
    }

    public function test_invalid_settings_and_non_admin_access_are_rejected(): void
    {
        $this->getJson('/api/admin/settings')->assertUnauthorized();
        $this->getJson('/api/payment-instructions')->assertOk()->assertJsonPath('payment_instructions.configured', false);

        $admin = $this->createUser('admin');
        $this->requestAs($admin)
            ->patchJson('/api/admin/settings', [
                'gcash_number' => str_repeat('1', 31),
                'payment_instructions' => str_repeat('x', 2001),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['gcash_number', 'payment_instructions']);
    }

    public function test_staff_cannot_read_or_update_admin_payment_settings(): void
    {
        $staff = $this->createUser('staff');
        $this->requestAs($staff)->getJson('/api/admin/settings')->assertForbidden();
        $this->requestAs($staff)->patchJson('/api/admin/settings', [])->assertForbidden();
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('payment-settings-test')->plainTextToken);
    }

    private function fakeQrImage(string $name): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=');

        return UploadedFile::fake()->createWithContent($name, $png);
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $role.'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => $role,
        ]);
    }
}
