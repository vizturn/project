<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Permit extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_izin',
        'screening_id',
        'permit_type_id',
        'wo_id',
        'equipment_id',
        'performing_authority_id',
        'approval_authority_id',
        'issuing_authority_id',
        'lokasi',
        'deskripsi_pekerjaan',
        'hazard_diisi_at',
        'durasi',
        'nomor_jsa',
        'jsa_file_path',
        'wah_menggunakan_perancah',
        'wah_scaffolding_cert_nomor',
        'wah_scaffolding_cert_file_path',
        'wah_persiapan_diisi_at',
        'wah_peralatan',
        'wah_peralatan_lainnya',
        'tingkat_risiko',
        'bahaya_lainnya',
        'ref_permit_cse',
        'ref_permit_wah',
        'cert_isolation',
        'cert_scaffolding',
        'cert_excavation',
        'sistem_safety_dinonaktifkan',
        'referensi_lainnya',
        'referensi_diisi_at',
        'gas_uji_flammable',
        'gas_uji_oksigen',
        'gas_uji_beracun',
        'gas_periode_ulang',
        'gas_ditetapkan_at',
        'diterima_pa_at',
        'status',
        'tgl_terbit',
        'tgl_kadaluarsa',
    ];

    protected function casts(): array
    {
        return [
            'tgl_terbit' => 'datetime',
            'tgl_kadaluarsa' => 'datetime',
            // STEP 27 — Bagian 4, 5, 7
            'referensi_diisi_at' => 'datetime',
            'gas_ditetapkan_at'  => 'datetime',
            'diterima_pa_at'     => 'datetime',
            'gas_uji_flammable'  => 'boolean',
            'gas_uji_oksigen'    => 'boolean',
            'gas_uji_beracun'    => 'boolean',
            // Bagian 3 (Persiapan) khusus WAH
            'wah_menggunakan_perancah' => 'boolean',
            'wah_persiapan_diisi_at'   => 'datetime',
            'hazard_diisi_at'          => 'datetime',
            'wah_peralatan'            => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------
    | Relasi ke master data & referensi
    |--------------------------------------------------------------------
    */

    public function permitType(): BelongsTo
    {
        // Jenis utama (jenis pertama). Dipertahankan untuk kompatibilitas data lama.
        return $this->belongsTo(PermitType::class);
    }

    /**
     * STEP 25 — Satu izin dapat mencakup beberapa jenis izin sekaligus
     * (mis. Hot Work + Work at Height). Ini sumber kebenarannya.
     */
    public function permitTypes(): BelongsToMany
    {
        return $this->belongsToMany(PermitType::class, 'permit_permit_type');
    }

    public function screening(): BelongsTo
    {
        return $this->belongsTo(Screening::class);
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class, 'wo_id');
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }

    /*
    |--------------------------------------------------------------------
    | Relasi ke pemegang peran (PA / AA / IA)
    |--------------------------------------------------------------------
    */

    public function performingAuthority(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performing_authority_id');
    }

    public function approvalAuthority(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approval_authority_id');
    }

    public function issuingAuthority(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issuing_authority_id');
    }

    /*
    |--------------------------------------------------------------------
    | Relasi anak (satu izin punya banyak dokumen pendukung)
    |--------------------------------------------------------------------
    */

    public function personnel(): HasMany
    {
        return $this->hasMany(PermitPersonnel::class);
    }

    public function psbForms(): HasMany
    {
        return $this->hasMany(PsbForm::class);
    }

    public function jsaReferences(): HasMany
    {
        return $this->hasMany(JsaReference::class);
    }

    public function hazards(): HasMany
    {
        return $this->hasMany(Hazard::class);
    }

    public function gasTests(): HasMany
    {
        return $this->hasMany(GasTest::class);
    }

    /**
     * Uji gas terbaru untuk izin ini (dipakai validasi timer 12/72 jam).
     */
    public function latestGasTest(): HasOne
    {
        return $this->hasOne(GasTest::class)->latestOfMany('tanggal');
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function safetyOverrides(): HasMany
    {
        return $this->hasMany(SafetyOverride::class);
    }

    public function revalidations(): HasMany
    {
        return $this->hasMany(Revalidation::class);
    }

    public function liveAudits(): HasMany
    {
        return $this->hasMany(LiveAudit::class);
    }

    public function standbyLogs(): HasMany
    {
        return $this->hasMany(StandbyLog::class);
    }

    /** Riwayat naik/turun PA untuk izin WAH (Bagian 7). */
    public function wahAccessLogs(): HasMany
    {
        return $this->hasMany(WahAccessLog::class);
    }
    
    public function wahWorkers(): HasMany
    {
        return $this->hasMany(WahWorker::class);
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(PermitStatusHistory::class);
    }

    /*
    |--------------------------------------------------------------------
    | Scopes bantu query
    |--------------------------------------------------------------------
    */

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'aktif');
    }
}
