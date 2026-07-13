<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\PermitType;
use App\Models\PsbType;
use App\Models\WorkOrder;

class MasterDataController extends Controller
{
    public function permitTypes()
    {
        return response()->json([
            'data' => PermitType::orderBy('id')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function psbTypes()
    {
        return response()->json([
            'data' => PsbType::orderBy('id')->get(['id', 'kode', 'nama']),
        ]);
    }

    public function workOrders()
    {
        return response()->json([
            'data' => WorkOrder::orderBy('id')->get(['id', 'wo_number', 'deskripsi']),
        ]);
    }

    public function equipment()
    {
        return response()->json([
            'data' => Equipment::orderBy('id')->get(['id', 'nama_alat', 'status_kalibrasi']),
        ]);
    }
}
