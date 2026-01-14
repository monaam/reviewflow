<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_assets', function (Blueprint $table) {
            $table->uuid('request_id');
            $table->uuid('asset_id');
            $table->timestamps();

            $table->foreign('request_id')->references('id')->on('creative_requests')->onDelete('cascade');
            $table->foreign('asset_id')->references('id')->on('assets')->onDelete('cascade');
            $table->primary(['request_id', 'asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_assets');
    }
};
