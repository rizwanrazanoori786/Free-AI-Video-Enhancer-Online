const { v4: uuidv4 } = require('uuid');

class JobManager {
    constructor() {
        this.jobs = new Map();
    }

    createJob(type, originalFile) {
        const jobId = uuidv4();
        const job = {
            id: jobId,
            type,
            status: 'queued', // queued, processing, completed, failed
            progress: 0,
            originalFile,
            outputFile: null,
            error: null,
            createdAt: new Date(),
            completedAt: null
        };
        this.jobs.set(jobId, job);
        return job;
    }

    getJob(jobId) {
        return this.jobs.get(jobId);
    }

    updateProgress(jobId, percent) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.progress = percent;
            job.status = 'processing';
        }
    }

    completeJob(jobId, outputFile) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.outputFile = outputFile;
            job.completedAt = new Date();
        }
    }

    failJob(jobId, error) {
        const job = this.jobs.get(jobId);
        if (job) {
            job.status = 'failed';
            job.error = error.message || error;
            job.completedAt = new Date();
        }
    }
}

module.exports = new JobManager();
