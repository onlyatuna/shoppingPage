/**
 * Barrel file — re-exports every type from the unified definitions file
 * so that `import { Cart } from '../../../types'` resolves correctly.
 *
 * Note: frame.ts and mockup.ts contain duplicate types already present
 * in interface_definitions.ts, so we only re-export from the canonical source.
 */
export * from './interface_definitions';
