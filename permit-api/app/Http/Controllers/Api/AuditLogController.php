<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    /** 200 audit log terbaru (khusus SHE/ADM via middleware). */
    public function index()
    {
        return response()->json([
            'data' => AuditLog::with('user:id,name')
                ->latest('id')->limit(200)->get(),
        ]);
    }
}
