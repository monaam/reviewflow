<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comment_reactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji', 20);
            $table->timestamps();

            $table->unique(['comment_id', 'user_id', 'emoji']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_reactions');
    }
};
