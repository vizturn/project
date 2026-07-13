<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'sso_ref',
        'jabatan',
        'status_aktif',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status_aktif' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------
    | Role / RBAC (skema custom: roles + user_roles)
    |--------------------------------------------------------------------
    */

    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'user_roles')
            ->withTimestamps();
    }

    /**
     * Cek apakah user memiliki role tertentu berdasarkan kode_role
     * (mis. 'PA', 'AA', 'IA', 'AGT', 'PJ', 'SPV', 'SHE', 'ADM').
     */
    public function hasRole(string $kodeRole): bool
    {
        return $this->roles()->where('kode_role', $kodeRole)->exists();
    }

    /*
    |--------------------------------------------------------------------
    | Penapisan
    |--------------------------------------------------------------------
    */

    public function screeningsRequested(): HasMany
    {
        return $this->hasMany(Screening::class, 'requested_by');
    }

    /*
    |--------------------------------------------------------------------
    | Izin (Permit) - sebagai pemegang peran PA / AA / IA
    |--------------------------------------------------------------------
    */

    public function permitsAsPerformingAuthority(): HasMany
    {
        return $this->hasMany(Permit::class, 'performing_authority_id');
    }

    public function permitsAsApprovalAuthority(): HasMany
    {
        return $this->hasMany(Permit::class, 'approval_authority_id');
    }

    public function permitsAsIssuingAuthority(): HasMany
    {
        return $this->hasMany(Permit::class, 'issuing_authority_id');
    }

    /*
    |--------------------------------------------------------------------
    | Keterlibatan sebagai personel/pekerja
    |--------------------------------------------------------------------
    */

    public function permitPersonnel(): HasMany
    {
        return $this->hasMany(PermitPersonnel::class);
    }

    /*
    |--------------------------------------------------------------------
    | PSB, Uji Gas, Live Audit, Standby, Override, Revalidasi
    |--------------------------------------------------------------------
    */

    public function psbFormsFilled(): HasMany
    {
        return $this->hasMany(PsbForm::class, 'diisi_oleh');
    }

    /**
     * Uji gas yang dilakukan user ini sebagai AGT (Authorized Gas Tester).
     */
    public function gasTests(): HasMany
    {
        return $this->hasMany(GasTest::class, 'agt_id');
    }

    /**
     * Live audit yang dilakukan user ini sebagai auditor.
     */
    public function liveAudits(): HasMany
    {
        return $this->hasMany(LiveAudit::class, 'auditor_id');
    }

    /**
     * Standby log yang dicatat user ini sebagai petugas jaga (PJ).
     */
    public function standbyLogs(): HasMany
    {
        return $this->hasMany(StandbyLog::class, 'petugas_jaga_id');
    }

    public function safetyOverridesGiven(): HasMany
    {
        return $this->hasMany(SafetyOverride::class, 'override_by');
    }

    public function safetyOverridesReinstated(): HasMany
    {
        return $this->hasMany(SafetyOverride::class, 'reinstate_by');
    }

    public function revalidationsReturned(): HasMany
    {
        return $this->hasMany(Revalidation::class, 'returned_by');
    }

    public function revalidationsProcessed(): HasMany
    {
        return $this->hasMany(Revalidation::class, 'revalidated_by');
    }

    /*
    |--------------------------------------------------------------------
    | Riwayat status & audit log
    |--------------------------------------------------------------------
    */

    public function statusChanges(): HasMany
    {
        return $this->hasMany(PermitStatusHistory::class, 'changed_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
