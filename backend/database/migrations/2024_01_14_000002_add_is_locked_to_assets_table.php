<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->boolean('is_locked')->default(false)->after('deadline');
            $table->uuid('locked_by')->nullable()->after('is_locked');
            $table->timestamp('locked_at')->nullable()->after('locked_by');

            $table->foreign('locked_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['locked_by']);
            $table->dropColumn(['is_locked', 'locked_by', 'locked_at']);
        });
    }
};
