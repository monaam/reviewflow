<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\CreativeRequestController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Projects
    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{project}/members', [ProjectController::class, 'addMember']);
    Route::delete('/projects/{project}/members/{user}', [ProjectController::class, 'removeMember']);
    Route::get('/projects/{project}/members', [ProjectController::class, 'members']);

    // Assets
    Route::get('/projects/{project}/assets', [AssetController::class, 'index']);
    Route::post('/projects/{project}/assets', [AssetController::class, 'store']);
    Route::get('/assets/{asset}', [AssetController::class, 'show']);
    Route::patch('/assets/{asset}', [AssetController::class, 'update']);
    Route::delete('/assets/{asset}', [AssetController::class, 'destroy']);
    Route::post('/assets/{asset}/versions', [AssetController::class, 'uploadVersion']);
    Route::get('/assets/{asset}/versions', [AssetController::class, 'versions']);
    Route::post('/assets/{asset}/approve', [AssetController::class, 'approve']);
    Route::post('/assets/{asset}/request-revision', [AssetController::class, 'requestRevision']);
    Route::post('/assets/{asset}/link-request', [AssetController::class, 'linkRequest']);

    // Comments
    Route::get('/assets/{asset}/comments', [CommentController::class, 'index']);
    Route::post('/assets/{asset}/comments', [CommentController::class, 'store']);
    Route::patch('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
    Route::post('/comments/{comment}/resolve', [CommentController::class, 'resolve']);
    Route::post('/comments/{comment}/unresolve', [CommentController::class, 'unresolve']);

    // Creative Requests
    Route::get('/requests/my-queue', [CreativeRequestController::class, 'myQueue']);
    Route::get('/projects/{project}/requests', [CreativeRequestController::class, 'index']);
    Route::post('/projects/{project}/requests', [CreativeRequestController::class, 'store']);
    Route::get('/requests/{creativeRequest}', [CreativeRequestController::class, 'show']);
    Route::patch('/requests/{creativeRequest}', [CreativeRequestController::class, 'update']);
    Route::delete('/requests/{creativeRequest}', [CreativeRequestController::class, 'destroy']);
    Route::post('/requests/{creativeRequest}/start', [CreativeRequestController::class, 'start']);
    Route::post('/requests/{creativeRequest}/complete', [CreativeRequestController::class, 'complete']);
    Route::post('/requests/{creativeRequest}/attachments', [CreativeRequestController::class, 'addAttachment']);
    Route::delete('/requests/{creativeRequest}/attachments/{attachment}', [CreativeRequestController::class, 'removeAttachment']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::patch('/settings', [AdminController::class, 'updateSettings']);
        Route::get('/analytics', [AdminController::class, 'analytics']);
    });
});
