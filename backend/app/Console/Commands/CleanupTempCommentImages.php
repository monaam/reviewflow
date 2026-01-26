<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupTempCommentImages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'comment-images:cleanup {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up orphaned temporary comment images older than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $disk = Storage::disk('local');
        $basePath = 'temp-comment-images';

        if (!$disk->exists($basePath)) {
            $this->info('No temporary comment images directory found.');
            return Command::SUCCESS;
        }

        $deletedCount = 0;
        $cutoffTime = now()->subHours(24);

        // Get all user directories
        $userDirectories = $disk->directories($basePath);

        foreach ($userDirectories as $userDir) {
            $files = $disk->files($userDir);

            foreach ($files as $file) {
                $lastModified = $disk->lastModified($file);
                $lastModifiedTime = \Carbon\Carbon::createFromTimestamp($lastModified);

                if ($lastModifiedTime->lt($cutoffTime)) {
                    if ($dryRun) {
                        $this->line("Would delete: {$file} (last modified: {$lastModifiedTime->toDateTimeString()})");
                    } else {
                        $disk->delete($file);
                        $this->line("Deleted: {$file}");
                    }
                    $deletedCount++;
                }
            }

            // Remove empty user directories
            if (!$dryRun && count($disk->files($userDir)) === 0 && count($disk->directories($userDir)) === 0) {
                $disk->deleteDirectory($userDir);
                $this->line("Removed empty directory: {$userDir}");
            }
        }

        // Remove empty base directory
        if (!$dryRun && count($disk->files($basePath)) === 0 && count($disk->directories($basePath)) === 0) {
            $disk->deleteDirectory($basePath);
            $this->line("Removed empty base directory: {$basePath}");
        }

        $action = $dryRun ? 'would be' : 'were';
        $this->info("{$deletedCount} temporary comment images {$action} cleaned up.");

        return Command::SUCCESS;
    }
}
