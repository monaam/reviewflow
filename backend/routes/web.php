<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Briefloop API',
        'status' => 'ok',
    ]);
});
