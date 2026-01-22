<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'ReviewFlow API',
        'status' => 'ok',
    ]);
});
