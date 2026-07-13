<?php

namespace Tests\Feature;

class RbacTest extends ApiTestCase
{
    public function test_pa_boleh_akses_route_pa(): void
    {
        $this->actingAsRole('PA');
        $this->getJson('/api/rbac-check/pa')
            ->assertOk()
            ->assertJsonPath('scope', 'PA');
    }

    public function test_pa_dilarang_akses_route_aa(): void
    {
        $this->actingAsRole('PA');
        $this->getJson('/api/rbac-check/aa')->assertStatus(403);
    }

    public function test_she_boleh_akses_route_she_adm(): void
    {
        $this->actingAsRole('SHE');
        $this->getJson('/api/rbac-check/she-adm')->assertOk();
    }
}
