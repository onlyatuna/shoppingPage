import { Landmark } from "../types";

// Calculate Euclidean distance between two 2D points (ignoring Z for zoom)
export const calculateDistance = (p1: Landmark, p2: Landmark): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Linear interpolation for smoothing
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

// Map a value from one range to another
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

// Clamp a value between min and max
export const clamp = (val: number, min: number, max: number): number => {
  return Math.min(Math.max(val, min), max);
};
