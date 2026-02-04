// models/website.ts - Website Model
import { Website, WebsiteStatus } from '../types';

// Mock database for websites
const websites: Map<string, Website> = new Map();

export class WebsiteModel {
  static create(website: Omit<Website, 'id' | 'createdAt' | 'updatedAt'>): Website {
    const id = crypto.randomUUID();
    const now = new Date();
    const newWebsite: Website = {
      ...website,
      id,
      createdAt: now,
      updatedAt: now,
    };
    websites.set(id, newWebsite);
    return newWebsite;
  }

  static findAll(): Website[] {
    return Array.from(websites.values());
  }

  static findById(id: string): Website | undefined {
    return websites.get(id);
  }

  static update(id: string, updates: Partial<Website>): Website | undefined {
    const website = websites.get(id);
    if (!website) return undefined;
    
    const updatedWebsite = {
      ...website,
      ...updates,
      updatedAt: new Date(),
    };
    websites.set(id, updatedWebsite);
    return updatedWebsite;
  }

  static updateStatus(id: string, status: WebsiteStatus): Website | undefined {
    return this.update(id, { 
      status, 
      lastChecked: new Date() 
    });
  }

  static delete(id: string): boolean {
    return websites.delete(id);
  }

  static calculateUptime(id: string, days: number = 30): number {
    // Calculate uptime percentage for the last N days
    // This is a simplified calculation
    const website = websites.get(id);
    if (!website) return 0;
    
    // In real implementation, this would query check history
    return website.uptimePercentage;
  }
}
