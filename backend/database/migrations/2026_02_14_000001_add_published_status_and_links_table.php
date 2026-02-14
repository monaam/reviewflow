<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add 'published' to the status enum
        DB::statement("ALTER TABLE assets MODIFY COLUMN status ENUM('pending_review', 'in_review', 'client_review', 'approved', 'revision_requested', 'published') DEFAULT 'pending_review'");

        // Create published links table
        Schema::create('asset_published_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('asset_id');
            $table->unsignedInteger('asset_version');
            $table->text('url');
            $table->string('platform')->nullable();
            $table->uuid('published_by');
            $table->timestamps();

            $table->foreign('asset_id')->references('id')->on('assets')->cascadeOnDelete();
            $table->foreign('published_by')->references('id')->on('users')->cascadeOnDelete();
            $table->index('asset_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_published_links');

        // Revert published assets to approved
        DB::table('assets')->where('status', 'published')->update(['status' => 'approved']);

        DB::statement("ALTER TABLE assets MODIFY COLUMN status ENUM('pending_review', 'in_review', 'client_review', 'approved', 'revision_requested') DEFAULT 'pending_review'");
    }
};
