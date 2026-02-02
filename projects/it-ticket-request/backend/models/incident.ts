// models/incident.ts - Incident Model
import { Incident, WebsiteStatus, IncidentStats } from '../types';

// Mock database for incidents
const incidents: Map<string, Incident> = new Map();

export class IncidentModel {
  static create(incident: Omit<Incident, 'id' | 'createdAt'>): Incident {
    const id = crypto.randomUUID();
    const newIncident: Incident = {
      ...incident,
      id,
      createdAt: new Date(),
    };
    incidents.set(id, newIncident);
    return newIncident;
  }

  static findAll(): Incident[] {
    return Array.from(incidents.values());
  }

  static findById(id: string): Incident | undefined {
    return incidents.get(id);
  }

  static findByWebsiteId(websiteId: string): Incident[] {
    return Array.from(incidents.values()).filter(
      (incident) => incident.websiteId === websiteId
    );
  }

  static findOngoing(): Incident[] {
    return Array.from(incidents.values()).filter(
      (incident) => !incident.resolvedAt
    );
  }

  static findResolved(): Incident[] {
    return Array.from(incidents.values()).filter(
      (incident) => incident.resolvedAt
    );
  }

  static resolve(id: string): Incident | undefined {
    const incident = incidents.get(id);
    if (!incident) return undefined;
    
    const resolvedAt = new Date();
    const duration = Math.floor(
      (resolvedAt.getTime() - incident.startedAt.getTime()) / (1000 * 60)
    );
    
    const updatedIncident: Incident = {
      ...incident,
      resolvedAt,
      duration,
    };
    incidents.set(id, updatedIncident);
    return updatedIncident;
  }

  static getStats(): IncidentStats {
    const allIncidents = Array.from(incidents.values());
    const resolved = allIncidents.filter((i) => i.resolvedAt);
    const ongoing = allIncidents.filter((i) => !i.resolvedAt);
    
    const totalResolutionTime = resolved.reduce(
      (sum, i) => sum + (i.duration || 0),
      0
    );
    
    return {
      total: allIncidents.length,
      resolved: resolved.length,
      ongoing: ongoing.length,
      averageResolutionTime: resolved.length > 0 
        ? Math.round(totalResolutionTime / resolved.length) 
        : 0,
    };
  }

  static delete(id: string): boolean {
    return incidents.delete(id);
  }
}
