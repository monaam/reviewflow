<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix dangerous cascade deletes on user foreign keys.
 *
 * Previously, deleting a user would cascade-delete all their projects,
 * assets, comments, approval logs, creative requests, etc. This migration
 * changes those foreign keys to SET NULL so data is preserved when a user
 * is deactivated or removed.
 */
return new class extends Migration
{
    public function up(): void
    {
        // projects.created_by — was CASCADE (deleted entire projects!)
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->uuid('created_by')->nullable()->change();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        // assets.uploaded_by — was CASCADE (deleted all assets)
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->uuid('uploaded_by')->nullable()->change();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        // asset_versions.uploaded_by — was CASCADE
        Schema::table('asset_versions', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->uuid('uploaded_by')->nullable()->change();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        // comments.user_id — was CASCADE (deleted all comments)
        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->uuid('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        // approval_logs.user_id — was CASCADE (lost audit trail)
        Schema::table('approval_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->uuid('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        // creative_requests.created_by — was CASCADE
        Schema::table('creative_requests', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->uuid('created_by')->nullable()->change();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });

        // request_attachments.uploaded_by — was CASCADE
        Schema::table('request_attachments', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->uuid('uploaded_by')->nullable()->change();
            $table->foreign('uploaded_by')->references('id')->on('users')->nullOnDelete();
        });

        // version_locks.user_id — was CASCADE
        Schema::table('version_locks', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->uuid('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        // asset_published_links.published_by — was CASCADE
        Schema::table('asset_published_links', function (Blueprint $table) {
            $table->dropForeign(['published_by']);
            $table->uuid('published_by')->nullable()->change();
            $table->foreign('published_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Revert to cascade (not recommended, but preserves rollback ability)
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->uuid('created_by')->nullable(false)->change();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->uuid('uploaded_by')->nullable(false)->change();
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('asset_versions', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->uuid('uploaded_by')->nullable(false)->change();
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('approval_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('creative_requests', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->uuid('created_by')->nullable(false)->change();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('request_attachments', function (Blueprint $table) {
            $table->dropForeign(['uploaded_by']);
            $table->uuid('uploaded_by')->nullable(false)->change();
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('version_locks', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->uuid('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::table('asset_published_links', function (Blueprint $table) {
            $table->dropForeign(['published_by']);
            $table->uuid('published_by')->nullable(false)->change();
            $table->foreign('published_by')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
