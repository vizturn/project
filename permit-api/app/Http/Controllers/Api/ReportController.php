<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permit;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /** Rekap izin untuk evaluasi (opsional rentang tanggal from/to). */
    public function summary(Request $request)
    {
        $base = Permit::query();

        if ($request->filled('from')) {
            $base->whereDate('permits.created_at', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $base->whereDate('permits.created_at', '<=', $request->query('to'));
        }

        $total = (clone $base)->count();

        $byStatus = (clone $base)
            ->selectRaw('status, COUNT(*) AS jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $byType = (clone $base)
            ->join('permit_types', 'permits.permit_type_id', '=', 'permit_types.id')
            ->selectRaw('permit_types.kode AS kode, COUNT(*) AS jumlah')
            ->groupBy('permit_types.kode')
            ->pluck('jumlah', 'kode');

        return response()->json([
            'data' => [
                'total'     => $total,
                'by_status' => $byStatus,
                'by_type'   => $byType,
            ],
        ]);
    }
}
