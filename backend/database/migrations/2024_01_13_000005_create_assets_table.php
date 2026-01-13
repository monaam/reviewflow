<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->uuid('uploaded_by');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['image', 'video', 'pdf', 'design'])->default('image');
            $table->enum('status', ['pending_review', 'in_review', 'approved', 'revision_requested'])->default('pending_review');
            $table->integer('current_version')->default(1);
            $table->timestamp('deadline')->nullable();
            $table->timestamps();

            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
