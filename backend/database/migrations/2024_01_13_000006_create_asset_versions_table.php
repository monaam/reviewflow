<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('asset_id');
            $table->integer('version_number');
            $table->string('file_url');
            $table->string('file_path');
            $table->bigInteger('file_size');
            $table->json('file_meta')->nullable();
            $table->uuid('uploaded_by');
            $table->timestamps();

            $table->foreign('asset_id')->references('id')->on('assets')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['asset_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_versions');
    }
};
