<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /** Notifikasi milik user login (terbaru). */
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data'         => Notification::where('user_id', $user->id)
                ->latest('id')->limit(50)->get(),
            'unread_count' => Notification::where('user_id', $user->id)
                ->where('dibaca', false)->count(),
        ]);
    }

    /** Tandai satu notifikasi sebagai dibaca (hanya milik sendiri). */
    public function markRead(Request $request, Notification $notification)
    {
        $user = $request->user();

        if ((int) $notification->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Bukan notifikasi Anda.'], 403);
        }

        $notification->update(['dibaca' => true]);

        return response()->json(['message' => 'Ditandai dibaca.']);
    }
}
