<?php

namespace Tests\Feature;

use App\Models\PaymentSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPaymentSettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

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

    public function test_admin_can_upload_replace_and_remove_payment_qr_using_public_storage(): void
    {
        Storage::fake('public');
        $admin = $this->createUser('admin');

        $this->requestAs($admin)
            ->post('/api/admin/settings', [
                '_method' => 'PATCH',
                'gcash_account_name' => 'ALD Motorshop',
                'gcash_number' => '09171234567',
                'payment_instructions' => 'Pay using the account details above.',
                'qr_image' => $this->fakeQrImage('qr.png'),
            ])
            ->assertOk()
            ->assertJsonPath('settings.is_configured', true);

        $originalPath = PaymentSetting::query()->firstOrFail()->qr_image_path;
        $this->assertNotNull($originalPath);
        Storage::disk('public')->assertExists($originalPath);

        $this->requestAs($admin)
            ->post('/api/admin/settings', [
                '_method' => 'PATCH',
                'gcash_account_name' => 'ALD Motorshop',
                'gcash_number' => '09171234567',
                'payment_instructions' => 'Pay using the account details above.',
                'qr_image' => $this->fakeQrImage('replacement.png'),
            ])
            ->assertOk();

        $replacementPath = PaymentSetting::query()->firstOrFail()->qr_image_path;
        $this->assertNotSame($originalPath, $replacementPath);
        Storage::disk('public')->assertMissing($originalPath);
        Storage::disk('public')->assertExists($replacementPath);

        $this->requestAs($admin)
            ->patchJson('/api/admin/settings', ['remove_qr_image' => true])
            ->assertOk()
            ->assertJsonPath('settings.qr_image_url', null);

        Storage::disk('public')->assertMissing($replacementPath);
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
