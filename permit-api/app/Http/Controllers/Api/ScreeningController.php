<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScreeningRequest;
use App\Models\AuditLog;
use App\Models\Screening;
use App\Models\ScreeningCriteria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScreeningController extends Controller
{
    /**
     * Daftar penapisan.
     * PA hanya melihat miliknya; SHE/ADM melihat semua.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Screening::with('requestedBy:id,name') // diperbaiki: sebelumnya 'pemohon:id,name'
            ->withCount('items')
            ->latest();

        if (! $user->hasRole('SHE') && ! $user->hasRole('ADM')) {
            $query->where('requested_by', $user->id);
        }

        return response()->json(['data' => $query->get()]);
    }

    /**
     * Simpan penapisan + item tercentang (snapshot), simpulkan butuh_izin.
     */
    public function store(StoreScreeningRequest $request)
    {
        $user    = $request->user();
        $checked = collect($request->validated()['checked_criteria'])->unique()->values();

        $screening = DB::transaction(function () use ($user, $checked) {
            $screening = Screening::create([
                'requested_by' => $user->id,
                'tanggal'      => now()->toDateString(),
                'butuh_izin'   => $checked->isNotEmpty(),
            ]);

            if ($checked->isNotEmpty()) {
                $master = ScreeningCriteria::whereIn('no_kriteria', $checked)
                    ->get()->keyBy('no_kriteria');

                $rows = $checked->map(fn ($no) => [
                    'screening_id' => $screening->id,
                    'no_kriteria'  => $no,
                    'deskripsi'    => $master[$no]->deskripsi ?? '',
                    'dicentang'    => true,
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ])->all();

                DB::table('screening_items')->insert($rows);
            }

            return $screening;
        });

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'create_screening',
            'entitas'    => 'screenings',
            'entitas_id' => $screening->id,
            'data_baru'  => [
                'butuh_izin'      => $screening->butuh_izin,
                'jumlah_kriteria' => $checked->count(),
            ],
            'logged_at'  => now(),
        ]);

        return response()->json([
            'message' => $screening->butuh_izin
                ? 'Pekerjaan WAJIB mengajukan izin kerja.'
                : 'Pekerjaan tidak memerlukan izin kerja.',
            'data' => $screening->load('items'),
        ], 201);
    }

    /**
     * Detail satu penapisan (dengan pembatasan kepemilikan).
     */
    public function show(Request $request, Screening $screening)
    {
        $user = $request->user();

        $bolehLihat = $user->hasRole('SHE')
            || $user->hasRole('ADM')
            || (int) $screening->requested_by === (int) $user->id;

        if (! $bolehLihat) {
            return response()->json(['message' => 'Tidak diizinkan melihat penapisan ini.'], 403);
        }

        return response()->json([
            'data' => $screening->load('items', 'requestedBy:id,name'), // diperbaiki: sebelumnya 'pemohon:id,name'
        ]);
    }
}
