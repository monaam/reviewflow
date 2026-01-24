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
        // Add 'client_review' to the status enum
        DB::statement("ALTER TABLE assets MODIFY COLUMN status ENUM('pending_review', 'in_review', 'client_review', 'approved', 'revision_requested') DEFAULT 'pending_review'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'client_review' from the status enum
        // First, update any assets with 'client_review' status to 'in_review'
        DB::table('assets')->where('status', 'client_review')->update(['status' => 'in_review']);

        DB::statement("ALTER TABLE assets MODIFY COLUMN status ENUM('pending_review', 'in_review', 'approved', 'revision_requested') DEFAULT 'pending_review'");
    }
};
