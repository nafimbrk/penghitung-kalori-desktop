<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Exercise;

// class ExerciseController extends Controller
// {
//     // Sinkronisasi dari server ke lokal
//     public function getExercises()
//     {
//         return response()->json(Exercise::all());
//     }

//     // Sinkronisasi dari lokal ke server
//     public function syncToServer(Request $request)
//     {
//         $data = $request->validate([
//             '*.type' => 'required|string',
//             '*.duration' => 'required|integer',
//             '*.calories' => 'required|integer',
//         ]);

//         foreach ($data as $exercise) {
//             Exercise::updateOrCreate([
//                 'type' => $exercise['type'],
//                 'duration' => $exercise['duration'],
//                 'calories' => $exercise['calories'],
//             ]);
//         }

//         return response()->json(['message' => 'Data berhasil disinkronkan.']);
//     }
// }

class ExerciseController extends Controller
{
    // GET: Sinkronisasi data dari server ke IndexedDB
    public function syncFromServer()
    {
        $exercises = Exercise::all();
        return response()->json($exercises, 200);
    }

    // POST: Sinkronisasi data dari IndexedDB ke server
    public function syncToServer(Request $request)
    {
        $data = $request->all();
        foreach ($data as $exercise) {
            Exercise::updateOrCreate(
                ['id' => $exercise['id'] ?? null],
                [
                    'type' => $exercise['type'],
                    'duration' => $exercise['duration'],
                    'calories' => $exercise['calories'],
                ]
            );
        }
        return response()->json(['message' => 'Data berhasil disinkronisasi ke server.'], 200);
    }
}
