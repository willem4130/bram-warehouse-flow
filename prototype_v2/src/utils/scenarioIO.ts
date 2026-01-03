/**
 * Scenario Import/Export utilities
 */

import { Area, Actor, Flow } from '../types';

// Simplified scenario format for export
export interface ExportedScenario {
  version: string;
  name: string;
  exportedAt: number;
  areas: Area[];
  actors: Actor[];
  flows: Flow[];
  gridBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Export current scenario to JSON string
 */
export function exportScenario(
  name: string,
  areas: Area[],
  actors: Actor[],
  flows: Flow[],
  gridBounds?: { minX: number; maxX: number; minY: number; maxY: number }
): string {
  const scenario: ExportedScenario = {
    version: '1.0',
    name,
    exportedAt: Date.now(),
    areas,
    actors,
    flows,
    gridBounds,
  };

  return JSON.stringify(scenario, null, 2);
}

/**
 * Import scenario from JSON string
 * Returns null if invalid
 */
export function importScenario(jsonString: string): ExportedScenario | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (!parsed.version || !parsed.areas || !parsed.actors || !parsed.flows) {
      console.error('Invalid scenario: missing required fields');
      return null;
    }

    // Validate areas
    if (!Array.isArray(parsed.areas)) {
      console.error('Invalid scenario: areas must be an array');
      return null;
    }

    // Validate actors
    if (!Array.isArray(parsed.actors)) {
      console.error('Invalid scenario: actors must be an array');
      return null;
    }

    // Validate flows
    if (!Array.isArray(parsed.flows)) {
      console.error('Invalid scenario: flows must be an array');
      return null;
    }

    return parsed as ExportedScenario;
  } catch (error) {
    console.error('Failed to parse scenario JSON:', error);
    return null;
  }
}

/**
 * Download scenario as JSON file
 */
export function downloadScenario(
  name: string,
  areas: Area[],
  actors: Actor[],
  flows: Flow[],
  gridBounds?: { minX: number; maxX: number; minY: number; maxY: number }
): void {
  const json = exportScenario(name, areas, actors, flows, gridBounds);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_').toLowerCase()}_scenario.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Trigger file upload dialog and return parsed scenario
 */
export function uploadScenario(): Promise<ExportedScenario | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const scenario = importScenario(content);
        resolve(scenario);
      };
      reader.onerror = () => {
        console.error('Failed to read file');
        resolve(null);
      };
      reader.readAsText(file);
    };

    input.click();
  });
}
