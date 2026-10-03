/**
 * In-memory progress tracker for long-running jobs (scraping, AI extraction).
 *
 * Each job is identified by a UUID. Clients connect via SSE to receive
 * real-time progress events. Events are buffered so late-connecting clients
 * receive the full history.
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface ProgressEvent {
  step: string;        // Machine-readable step key
  message: string;     // Human-readable status message
  detail?: string;     // Optional extra info (source name, count, etc.)
  percent?: number;    // Optional 0-100 progress estimate
  timestamp: string;   // ISO 8601
}

export interface JobProgress {
  jobId: string;
  status: 'running' | 'complete' | 'error';
  events: ProgressEvent[];
  result?: any;        // Final result payload on completion
  error?: string;      // Error message on failure
}

class ProgressManager extends EventEmitter {
  private jobs = new Map<string, JobProgress>();

  /** Create a new tracked job and return its ID. */
  createJob(): string {
    const jobId = crypto.randomUUID();
    this.jobs.set(jobId, {
      jobId,
      status: 'running',
      events: [],
    });
    // Auto-cleanup after 5 minutes
    setTimeout(() => this.jobs.delete(jobId), 5 * 60 * 1000);
    return jobId;
  }

  /** Emit a progress event for a running job. */
  emit_progress(jobId: string, step: string, message: string, detail?: string, percent?: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const event: ProgressEvent = {
      step,
      message,
      detail,
      percent,
      timestamp: new Date().toISOString(),
    };
    job.events.push(event);
    this.emit(`progress:${jobId}`, event);
  }

  /** Mark a job as complete with its result payload. */
  complete(jobId: string, result: any): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'complete';
    job.result = result;
    this.emit(`complete:${jobId}`, result);
  }

  /** Mark a job as failed. */
  fail(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'error';
    job.error = error;
    this.emit(`error:${jobId}`, error);
  }

  /** Get the current state of a job (including buffered events). */
  getJob(jobId: string): JobProgress | undefined {
    return this.jobs.get(jobId);
  }
}

/** Singleton instance. */
export const progressManager = new ProgressManager();
