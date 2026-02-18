<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('asset_versions', function (Blueprint $table) {
            // Make file columns nullable (documents have no file)
            $table->string('file_url')->nullable()->change();
            $table->string('file_path')->nullable()->change();
            $table->unsignedBigInteger('file_size')->nullable()->change();

            // Add content column for document asset type
            $table->longText('content')->nullable()->after('file_meta');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asset_versions', function (Blueprint $table) {
            $table->dropColumn('content');

            $table->string('file_url')->nullable(false)->change();
            $table->string('file_path')->nullable(false)->change();
            $table->unsignedBigInteger('file_size')->nullable(false)->change();
        });
    }
};
