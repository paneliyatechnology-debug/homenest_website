'use client';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastMessage {
  severity?: ToastSeverity;
  summary?: string;
  detail: string;
  life?: number;
}

type ToastListener = (message: ToastMessage) => void;

class ToastManager {
  private listeners: Set<ToastListener> = new Set();
  private recentMessages: Map<string, number> = new Map();
  private readonly DEDUP_INTERVAL_MS = 1000;

  /**
   * Register a toast listener (called by GlobalToastContainer)
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Display a toast notification with centralized deduplication
   */
  show(message: ToastMessage): void {
    if (!message || !message.detail) return;

    const trimmedDetail = message.detail.trim();
    if (!trimmedDetail) return;

    const severity = message.severity || 'info';
    const key = `${severity}:${trimmedDetail}`;
    const now = Date.now();
    const lastTime = this.recentMessages.get(key) || 0;

    // Prevent duplicate toasts within deduplication window
    if (now - lastTime < this.DEDUP_INTERVAL_MS) {
      return;
    }

    this.recentMessages.set(key, now);

    // Garbage-collect old keys
    if (this.recentMessages.size > 50) {
      this.recentMessages.forEach((time, k) => {
        if (now - time > 5000) {
          this.recentMessages.delete(k);
        }
      });
    }

    const payload: ToastMessage = {
      severity,
      summary: message.summary,
      detail: trimmedDetail,
      life: message.life ?? (severity === 'error' ? 4500 : 3500),
    };

    // If no active listeners (e.g. before mount or during page transition), save flash message
    if (this.listeners.size === 0 && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('mypgpms_flash_toast', JSON.stringify(payload));
      } catch {
        // ignore storage errors
      }
      return;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('Toast listener error:', err);
      }
    });
  }

  success(detail: string, summary?: string, life?: number): void {
    this.show({ severity: 'success', summary, detail, life });
  }

  error(detail: string, summary?: string, life?: number): void {
    this.show({ severity: 'error', summary, detail, life: life ?? 4500 });
  }

  warn(detail: string, summary?: string, life?: number): void {
    this.show({ severity: 'warn', summary, detail, life });
  }

  info(detail: string, summary?: string, life?: number): void {
    this.show({ severity: 'info', summary, detail, life });
  }
}

export const toast = new ToastManager();

