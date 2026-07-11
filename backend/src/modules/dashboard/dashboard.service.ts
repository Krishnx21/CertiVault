import { eventBus } from "../../core/events.js";

interface DashboardStats {
  total: number;
  verified: number;
  pending: number;
  storageBytes: number;
}

export class DashboardService {
  private stats: DashboardStats = {
    total: 0,
    verified: 0,
    pending: 0,
    storageBytes: 0,
  };

  private initialized = false;

  constructor() {
    this.registerListeners();
    // Request initial state from the store
    eventBus.emit("document.requestSync", undefined as void);
  }

  private registerListeners() {
    eventBus.on("document.sync", ({ documents }) => {
      this.stats = {
        total: documents.length,
        verified: documents.filter((d) => d.status === "verified").length,
        pending: documents.filter((d) => d.status === "pending").length,
        storageBytes: documents.reduce((total, d) => total + d.size, 0),
      };
      this.initialized = true;
    });

    eventBus.on("document.created", ({ document }) => {
      this.stats.total += 1;
      this.stats.storageBytes += document.size;
      if (document.status === "verified") {
        this.stats.verified += 1;
      } else {
        this.stats.pending += 1;
      }
    });

    eventBus.on("document.verified", ({ document }) => {
      // Assuming a document goes from pending -> verified
      if (this.stats.pending > 0) {
        this.stats.pending -= 1;
      }
      this.stats.verified += 1;
    });

    eventBus.on("document.deleted", ({ size }) => {
      // In a more complex system, we'd know if it was verified or pending
      // For this simple MVP refactor, we just ask for a re-sync on delete
      // to keep it perfectly accurate without storing all doc states here.
      eventBus.emit("document.requestSync", undefined as void);
    });
  }

  public getSummary(): DashboardStats {
    if (!this.initialized) {
      eventBus.emit("document.requestSync", undefined as void);
    }
    return this.stats;
  }
}

export const dashboardService = new DashboardService();
