<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScreeningCriteria;

class ScreeningCriteriaController extends Controller
{
    // Daftar 43 kriteria master untuk merender form penapisan di frontend.
    public function index()
    {
        return response()->json([
            'data' => ScreeningCriteria::orderBy('no_kriteria')
                ->get(['id', 'no_kriteria', 'deskripsi']),
        ]);
    }
}
