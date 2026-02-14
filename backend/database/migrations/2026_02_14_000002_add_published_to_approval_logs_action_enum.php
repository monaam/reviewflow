<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE approval_logs MODIFY COLUMN action ENUM('approved', 'revision_requested', 'reopened', 'published') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE approval_logs MODIFY COLUMN action ENUM('approved', 'revision_requested', 'reopened') NOT NULL");
    }
};
