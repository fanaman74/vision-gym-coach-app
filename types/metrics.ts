export type ConsoleType = 'rowing' | 'cycling' | 'unknown'

export interface BaseSession {
  consoleType: ConsoleType
  capturedAt: string
  imageDataUrl?: string
}

export interface RowingSession extends BaseSession {
  consoleType: 'rowing'
  duration?: string
  distanceMeters?: number
  splitPer500m?: string
  strokeRate?: number
  calories?: number
  watts?: number
  heartRate?: number
}

export interface CyclingSession extends BaseSession {
  consoleType: 'cycling'
  duration?: string
  distanceKm?: number
  avgWatts?: number
  avgRpm?: number
  avgSpeedKmh?: number
  calories?: number
  heartRate?: number
  resistanceLevel?: number
}

export type GymSession = RowingSession | CyclingSession | (BaseSession & { consoleType: 'unknown' })
