<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add pdf_pages_status to asset_versions
        Schema::table('asset_versions', function (Blueprint $table) {
            $table->string('pdf_pages_status')->nullable()->after('thumbnail_path');
        });

        // Create pdf_pages table
        Schema::create('pdf_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('asset_version_id');
            $table->integer('page_number');
            $table->string('image_path');
            $table->integer('width');
            $table->integer('height');
            $table->integer('file_size');
            $table->timestamps();

            $table->foreign('asset_version_id')->references('id')->on('asset_versions')->onDelete('cascade');
            $table->unique(['asset_version_id', 'page_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pdf_pages');

        Schema::table('asset_versions', function (Blueprint $table) {
            $table->dropColumn('pdf_pages_status');
        });
    }
};
