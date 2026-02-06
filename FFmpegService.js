const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const JobManager = require('./JobManager');
const path = require('path');
const fs = require('fs-extra');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

class FFmpegService {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    addToQueue(jobId, inputPath, options) {
        this.queue.push({ jobId, inputPath, options });
        this.processNext();
    }

    async processNext() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const { jobId, inputPath, options } = this.queue.shift();
        const job = JobManager.getJob(jobId);

        if (!job) {
            this.isProcessing = false;
            return this.processNext();
        }

        const outputFilename = `enhanced_${jobId}.mp4`;
        const outputPath = path.join(__dirname, '../../processed', outputFilename);

        // filters
        const videoFilters = [];

        // 1. Denoise (Basic)
        if (options.denoise) {
            videoFilters.push('hqdn3d=1.5:1.5:6:6');
        }

        // 2. Sharpen (Deblur)
        if (options.deblur) {
            videoFilters.push('unsharp=5:5:1.0:5:5:0.0');
        }

        // 3. Upscale (Free Tier limit typically, but we implement logic)
        // If 4k is requested, we scale. For free tier maybe limit to 1080p? 
        // We'll trust the requested resolution for now or default to 1080p upscale logic
        if (options.resolution === '4k') {
            videoFilters.push('scale=3840:-2:flags=lanczos');
        } else if (options.resolution === '2k') {
            videoFilters.push('scale=2560:-2:flags=lanczos');
        } else if (options.resolution === '1080p') {
            videoFilters.push('scale=1920:-2:flags=lanczos');
        }

        // 4. Color Correction (Auto)
        if (options.colorCorrect) {
            // Simple contrast/saturation boost
            videoFilters.push('eq=contrast=1.1:saturation=1.2');
        }

        console.log(`[Job ${jobId}] Starting FFmpeg processing with filters:`, videoFilters);

        ffmpeg(inputPath)
            .outputOptions('-c:v libx264')
            .outputOptions('-preset medium')
            .outputOptions('-crf 23')
            .outputOptions('-c:a aac')
            .outputOptions('-b:a 128k')
            .videoFilters(videoFilters)
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
                JobManager.updateProgress(jobId, 0);
            })
            .on('progress', (progress) => {
                // progress.percent is not always reliable if duration is unknown, but usually ok for files
                const percent = progress.percent ? Math.round(progress.percent) : 0;
                if (percent > 0 && percent < 100) {
                    JobManager.updateProgress(jobId, percent);
                }
            })
            .on('error', (err) => {
                console.error(`[Job ${jobId}] Error:`, err);
                JobManager.failJob(jobId, err);
                this.isProcessing = false;
                this.processNext();
            })
            .on('end', () => {
                console.log(`[Job ${jobId}] Finished processing`);
                JobManager.completeJob(jobId, outputFilename);
                this.isProcessing = false;
                this.processNext();
            })
            .save(outputPath);
    }
}

module.exports = new FFmpegService();
