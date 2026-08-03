<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permit;
use App\Models\PsbFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Upload & hapus file PSB (dokumen pendukung Formulir PSB / Life Saving Rules).
 *
 * File PSB diunggah oleh AA saat menyetujui izin (menentukan PSB yang dibutuhkan
 * berdasarkan uraian pekerjaan PA, lalu melampirkan dokumennya).
 *
 * Aturan: maksimal 6 file per izin, tiap file PDF <= 5 MB.
 */
class PsbFileController extends Controller
{
    private const MAKS_FILE = 6;

    public function store(Request $request, Permit $permit)
    {
        $user = $request->user();

        // Tentukan peran pengunggah berdasarkan status izin + kepemilikan.
        $peran = $this->tentukanPeran($permit, $user);
        if ($peran === null) {
            return response()->json([
                'message' => 'Anda tidak berhak mengunggah file PSB pada tahap ini.',
            ], 403);
        }

        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        // Batasi jumlah total file per izin.
        if ($permit->psbFiles()->count() >= self::MAKS_FILE) {
            return response()->json([
                'message' => 'Maksimal ' . self::MAKS_FILE . ' file PSB per izin.',
            ], 422);
        }

        $file = $request->file('file');
        $path = $file->store('psb/' . $permit->id, 'public');

        $psbFile = $permit->psbFiles()->create([
            'diupload_oleh'    => $user->id,
            'peran_pengupload' => $peran,
            'file_path'        => $path,
            'nama_asli'        => $file->getClientOriginalName(),
        ]);

        return response()->json([
            'message' => 'File PSB berhasil diunggah.',
            'data'    => $psbFile->load('diuploadOleh:id,name'),
        ], 201);
    }

    public function destroy(Request $request, Permit $permit, PsbFile $psbFile)
    {
        $user = $request->user();

        if ((int) $psbFile->permit_id !== (int) $permit->id) {
            return response()->json(['message' => 'File tidak ditemukan pada izin ini.'], 404);
        }

        // Hanya pengunggah yang berhak menghapus, dan hanya selama tahap yang sesuai.
        if ((int) $psbFile->diupload_oleh !== (int) $user->id
            || $this->tentukanPeran($permit, $user) === null) {
            return response()->json([
                'message' => 'Anda tidak berhak menghapus file ini pada tahap ini.',
            ], 403);
        }

        Storage::disk('public')->delete($psbFile->file_path);
        $psbFile->delete();

        return response()->json(['message' => 'File PSB dihapus.']);
    }

    /**
     * Peran pengunggah yang diizinkan: hanya AA yang ditugaskan, saat izin
     * masih menunggu approval. Mengembalikan "AA" bila boleh, atau null.
     */
    private function tentukanPeran(Permit $permit, $user): ?string
    {
        if ($permit->status === 'menunggu_approval'
            && ($permit->approval_authority_id === null
                || (int) $permit->approval_authority_id === (int) $user->id)) {
            return 'AA';
        }

        return null;
    }
}
