<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GasTestController;
use App\Http\Controllers\Api\HazardController;
use App\Http\Controllers\Api\LiveAuditController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermitController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScreeningController;
use App\Http\Controllers\Api\ScreeningCriteriaController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['status' => 'ok', 'message' => 'Backend Laravel terhubung']);
});

// Auth publik
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    /* ===== Master data + referensi integrasi (S21) ===== */
    Route::get('/permit-types', [MasterDataController::class, 'permitTypes']);
    Route::get('/psb-types', [MasterDataController::class, 'psbTypes']);
    Route::get('/work-orders', [MasterDataController::class, 'workOrders']);
    Route::get('/equipment', [MasterDataController::class, 'equipment']);

    // STEP 24 — daftar user per role (untuk memilih AA & IA saat pengajuan)
    Route::get('/users', [UserController::class, 'index']);

    /* ===== STEP 10 — Penapisan ===== */
    Route::get('/screening-criteria', [ScreeningCriteriaController::class, 'index']);
    Route::get('/screenings', [ScreeningController::class, 'index']);
    Route::get('/screenings/{screening}', [ScreeningController::class, 'show']);
    Route::middleware('role:PA')->group(function () {
        Route::post('/screenings', [ScreeningController::class, 'store']);
    });

    /* ===== STEP 11-18 — Izin Kerja (Permit) ===== */
    Route::get('/permits', [PermitController::class, 'index']);
    Route::get('/permits/{permit}', [PermitController::class, 'show']);
    Route::get('/permits/{permit}/gas-tests', [GasTestController::class, 'index']);
    Route::get('/permits/{permit}/live-audits', [LiveAuditController::class, 'index']);

    // STEP 26 — master daftar bahaya (Bagian 3), dikelompokkan per jenis izin
    Route::get('/permits/{permit}/hazard-options', [HazardController::class, 'options']);

    Route::middleware('role:PA')->group(function () {
        Route::post('/permits', [PermitController::class, 'store']);
        Route::post('/permits/{permit}/submit', [PermitController::class, 'submit']);
        Route::post('/permits/{permit}/return', [PermitController::class, 'returnPermit']);
        Route::post('/permits/{permit}/complete', [PermitController::class, 'complete']);
        Route::post('/permits/{permit}/hazards', [HazardController::class, 'store']);
    });
    Route::middleware('role:AA')->group(function () {
        Route::post('/permits/{permit}/approve', [PermitController::class, 'approve']);
        Route::post('/permits/{permit}/reject', [PermitController::class, 'reject']);
    });
    Route::middleware('role:AGT')->group(function () {
        Route::post('/permits/{permit}/gas-tests', [GasTestController::class, 'store']);
    });
    Route::middleware('role:IA')->group(function () {
        Route::put('/permits/{permit}/hazards', [HazardController::class, 'update']);
        Route::post('/permits/{permit}/issue', [PermitController::class, 'issue']);
        Route::post('/permits/{permit}/revalidate', [PermitController::class, 'revalidate']);
        Route::post('/permits/{permit}/close', [PermitController::class, 'close']);
    });
    Route::middleware('role:SPV')->group(function () {
        Route::post('/permits/{permit}/live-audits', [LiveAuditController::class, 'store']);
    });

    /* ===== STEP 19 — Notifikasi ===== */
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);

    /* ===== STEP 20 — Audit Log & Rekap (SHE/ADM) ===== */
    Route::middleware('role:SHE,ADM')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/reports/summary', [ReportController::class, 'summary']);
    });

    /* ===== Contoh route RBAC ===== */
    Route::middleware('role:PA')->group(fn () => Route::get('/rbac-check/pa', fn () => response()->json(['ok' => true, 'scope' => 'PA'])));
    Route::middleware('role:AA')->group(fn () => Route::get('/rbac-check/aa', fn () => response()->json(['ok' => true, 'scope' => 'AA'])));
    Route::middleware('role:IA')->group(fn () => Route::get('/rbac-check/ia', fn () => response()->json(['ok' => true, 'scope' => 'IA'])));
    Route::middleware('role:AGT')->group(fn () => Route::get('/rbac-check/agt', fn () => response()->json(['ok' => true, 'scope' => 'AGT'])));
    Route::middleware('role:PJ')->group(fn () => Route::get('/rbac-check/pj', fn () => response()->json(['ok' => true, 'scope' => 'PJ'])));
    Route::middleware('role:SHE,ADM')->group(fn () => Route::get('/rbac-check/she-adm', fn () => response()->json(['ok' => true, 'scope' => 'SHE/ADM'])));
});
