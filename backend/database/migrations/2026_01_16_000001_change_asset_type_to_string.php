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
        // For MySQL, we need to alter the column type from enum to varchar
        // First, create a temporary column, copy data, drop old column, rename new
        Schema::table('assets', function (Blueprint $table) {
            $table->string('type_new', 50)->default('image')->after('type');
        });

        // Copy existing data
        DB::statement('UPDATE assets SET type_new = type');

        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->renameColumn('type_new', 'type');
        });

        // Add an index for type queries
        Schema::table('assets', function (Blueprint $table) {
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the index first
        Schema::table('assets', function (Blueprint $table) {
            $table->dropIndex(['type']);
        });

        // Convert back to enum (note: this may fail if new types were added)
        Schema::table('assets', function (Blueprint $table) {
            $table->enum('type_old', ['image', 'video', 'pdf', 'design'])->default('image')->after('type');
        });

        // Copy data back (will fail if there are types not in the enum)
        DB::statement("UPDATE assets SET type_old = type WHERE type IN ('image', 'video', 'pdf', 'design')");

        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->renameColumn('type_old', 'type');
        });
    }
};
