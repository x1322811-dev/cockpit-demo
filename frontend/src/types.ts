export interface ClimateState {
  tempFront: number;
  tempRear: number;
  fanSpeed: number;
  fanSpeedRear: number;
  acFront: boolean;
  acRear: boolean;
  airCirculation: 'fresh' | 'recirculate' | 'auto';
  defrostFront: boolean;
  airflowMode: 'face' | 'feet' | 'diffuse';
  airflowModeRear: 'face' | 'feet' | 'diffuse';
  airPurifier: 'off' | 'low' | 'medium' | 'high';
  fragrance: 'none' | 'forest' | 'ocean' | 'floral';
  steeringHeat: boolean;
  autoMode: boolean;
  tempSync: boolean;
}

export interface AmbientLightState {
  on: boolean;
  color: string;
  brightness: number;
  mode: 'static' | 'breathe' | 'flow';
}

export interface MediaState {
  playing: boolean;
  genre: string | null;
  volume: number;
  trackName: string | null;
  artist: string | null;
  repeatMode: 'sequence' | 'shuffle' | 'single';
  liked: boolean;
}

export interface SeatState {
  zeroGravity: boolean;
  foreAft: number;
  recline: number;
  massage: boolean;
  heating: boolean;
  ventilation: 'off' | 'low' | 'medium' | 'high';
  lumbar: number;
}

export interface WindowState {
  driverWindow: number;
  passengerWindow: number;
  rearLeftWindow: number;
  rearRightWindow: number;
  sunroof: 'open' | 'shade';
}

export interface DriveState {
  speed: number;
}

export interface NavigationState {
  destination: string | null;
  stops: string[];
  eta: string | null;
  route: { name: string; type: string }[];
}

export interface VehicleContext {
  passengers: 'unknown' | 'solo' | 'couple' | 'family';
  timeOfDay: 'day' | 'night';
  batteryLevel: number;
  location: string;
  pm25Outdoor: number;
  pm25Indoor: number;
  outdoorTemp: number;
  windshieldFogged: boolean;
}

export interface VehicleState {
  climate: ClimateState;
  ambientLight: AmbientLightState;
  media: MediaState;
  seat: SeatState;
  seatPassenger: SeatState;
  navigation: NavigationState;
  reminders: Reminder[];
  windows: WindowState;
  drive: DriveState;
  context: VehicleContext;
}

export interface Reminder {
  id: string;
  text: string;
  trigger: string;
}

export interface SceneAction {
  tool: string;
  args: Record<string, unknown>;
}

export interface Scene {
  id: string;
  name: string;
  triggerPhrase: string;
  source: 'user_defined' | 'ai_generated';
  actions: SceneAction[];
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  zone?: 'driver' | 'passenger';
}

export interface ReasoningStep {
  type: 'intent' | 'plan' | 'decision' | 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'rule';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}
