import {
  Wind,
  RectangleHorizontal,
  Armchair,
  Music,
  Volume2,
  Sparkles,
  Maximize2,
  Navigation,
  Heart,
  User,
  Users,
  Gauge,
  Repeat,
  Shuffle,
  Repeat1,
  Send,
  Smile,
  Footprints,
  ChevronsUpDown,
  AirVent,
  Flame,
  Waves,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const MAP = {
  ac:         Wind,
  window:     RectangleHorizontal,
  seat:       Armchair,
  music:      Music,
  volume:     Volume2,
  ambient:    Sparkles,
  sunroof:    Maximize2,
  nav:        Navigation,
  heart:      Heart,
  driver:     User,
  passenger:  Users,
  drive:      Gauge,
  listLoop:   Repeat,
  shuffle:    Shuffle,
  singleLoop: Repeat1,
  send:       Send,
  airFace:     Smile,
  airFeet:     Footprints,
  airBoth:     ChevronsUpDown,
  ventilation: AirVent,
  heating:     Flame,
  massage:     Waves,
  winUp:       ChevronUp,
  winDown:     ChevronDown,
} as const;

export type IconName = keyof typeof MAP;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 12, strokeWidth = 1.5, ...rest }: IconProps) {
  const C = MAP[name];
  return <C size={size} strokeWidth={strokeWidth} {...rest} />;
}
