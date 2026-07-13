<?php

namespace App\Http\Requests;

use App\Models\Permit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ApprovePermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:AA
    }

    /**
     * STEP 25 — PSB ditetapkan PER JENIS IZIN.
     * Format: psb[] = [ { permit_type_id, psb_type_ids: [...] }, ... ]
     */
    public function rules(): array
    {
        return [
            'psb'                  => ['required', 'array', 'min:1'],
            'psb.*.permit_type_id' => ['required', 'integer', 'exists:permit_types,id'],
            'psb.*.psb_type_ids'   => ['required', 'array', 'min:1'],
            // CATATAN: JANGAN pakai rule 'distinct' di sini. Laravel membandingkan
            // seluruh nilai lintas kelompok, sehingga PSB yang sama untuk dua jenis izin
            // (mis. PSB-6 pada HWP dan CWP) salah dianggap duplikat. Keunikan diperiksa
            // PER KELOMPOK di withValidator().
            'psb.*.psb_type_ids.*' => ['integer', 'exists:psb_types,id'],
        ];
    }

    /**
     * Pastikan AA mengisi PSB untuk SETIAP jenis izin yang tercakup.
     * Tanpa ini, izin HWP+WAH bisa disetujui padahal PSB ketinggian belum ditetapkan.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            /** @var Permit|null $permit */
            $permit = $this->route('permit');

            if (! $permit instanceof Permit) {
                return;
            }

            $jenisWajib = $permit->permitTypes()->pluck('permit_types.id');

            // Fallback izin lama (belum punya baris pivot).
            if ($jenisWajib->isEmpty() && $permit->permit_type_id) {
                $jenisWajib = collect([$permit->permit_type_id]);
            }

            $jenisDiisi = collect($this->input('psb', []))
                ->pluck('permit_type_id')
                ->map(fn ($id) => (int) $id);

            $belum = $jenisWajib->map(fn ($id) => (int) $id)->diff($jenisDiisi);

            if ($belum->isNotEmpty()) {
                $v->errors()->add('psb', 'PSB wajib ditetapkan untuk SETIAP jenis izin yang tercakup.');
            }

            // Satu jenis izin tidak boleh dikirim dua kali.
            if ($jenisDiisi->count() !== $jenisDiisi->unique()->count()) {
                $v->errors()->add('psb', 'Terdapat jenis izin yang dikirim lebih dari sekali.');
            }

            // Keunikan PSB diperiksa DI DALAM masing-masing kelompok
            // (PSB yang sama boleh dipakai pada jenis izin berbeda).
            foreach ((array) $this->input('psb', []) as $i => $kelompok) {
                $ids = collect($kelompok['psb_type_ids'] ?? []);

                if ($ids->count() !== $ids->unique()->count()) {
                    $v->errors()->add("psb.{$i}.psb_type_ids", 'Terdapat PSB yang terduplikasi pada jenis izin ini.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'psb.required'                  => 'PSB wajib ditetapkan.',
            'psb.*.psb_type_ids.required'   => 'Minimal satu PSB per jenis izin.',
            'psb.*.psb_type_ids.min'        => 'Minimal satu PSB per jenis izin.',
        ];
    }
}
