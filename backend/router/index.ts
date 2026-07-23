import type { VehicleState } from '../../shared/types.ts';
import { RULES, type Rule } from './rules.ts';

export type RouteResult =
  | { path: 'rule'; rule: Rule; args: Record<string, unknown> }
  | { path: 'agent' };

export function route(
  message: string,
  state: VehicleState,
  zone: 'driver' | 'passenger',
): RouteResult {
  const text = message.trim();
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = text.match(pattern);
      if (match) {
        return { path: 'rule', rule, args: rule.buildArgs(match, state, zone) };
      }
    }
  }
  return { path: 'agent' };
}
