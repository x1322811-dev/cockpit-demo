import { create } from 'zustand';
import type { VehicleState, ChatMessage, ReasoningStep } from '../types';

const INITIAL_SEAT: VehicleState['seat'] = {
  zeroGravity: false, foreAft: 50, recline: 110, massage: false, heating: false, ventilation: 'off', lumbar: 2,
};

const INITIAL_VEHICLE_STATE: VehicleState = {
  climate: {
    tempFront: 22, tempRear: 22, fanSpeed: 2, fanSpeedRear: 2,
    acFront: true, acRear: true,
    airCirculation: 'recirculate', defrostFront: false,
    airflowMode: 'face', airflowModeRear: 'face',
    airPurifier: 'off', fragrance: 'none',
    steeringHeat: false, autoMode: false, tempSync: false,
  },
  ambientLight: { on: false, color: '#4A90D9', brightness: 60, mode: 'static' },
  media: {
    playing: false, genre: 'jazz', volume: 30, trackName: 'Autumn Leaves', artist: 'Bill Evans',
    repeatMode: 'sequence', liked: false,
  },
  seat:          { ...INITIAL_SEAT },
  seatPassenger: { ...INITIAL_SEAT },
  navigation: { destination: null, stops: [], eta: null, route: [] },
  reminders: [],
  windows: {
    driverWindow: 0, passengerWindow: 0, rearLeftWindow: 0, rearRightWindow: 0,
    sunroof: 'shade',
  },
  drive: { speed: 0 },
  context: {
    passengers: 'unknown', timeOfDay: 'day', batteryLevel: 68, location: '上海市浦东新区',
    pm25Outdoor: 85, pm25Indoor: 35, outdoorTemp: 8, windshieldFogged: false,
  },
};

interface AppStore {
  vehicle:     VehicleState;
  sessionBase: VehicleState | null;
  agentPatchedFields: string[];   // dot-paths changed by Agent/Rule in current round
  messages:    ChatMessage[];
  reasoning:   ReasoningStep[];
  isAgentThinking: boolean;

  updateVehicle:         (patch: Partial<VehicleState>) => void;
  takeSessionBase:       () => void;
  addAgentPatchedFields: (paths: string[]) => void;
  patchClimate:          (patch: Partial<VehicleState['climate']>) => void;
  patchAmbientLight:(patch: Partial<VehicleState['ambientLight']>) => void;
  patchMedia:       (patch: Partial<VehicleState['media']>) => void;
  patchSeat:        (patch: Partial<VehicleState['seat']>) => void;
  patchSeatPassenger:(patch: Partial<VehicleState['seatPassenger']>) => void;
  patchNavigation:  (patch: Partial<VehicleState['navigation']>) => void;
  patchWindows:     (patch: Partial<VehicleState['windows']>) => void;
  patchDrive:       (patch: Partial<VehicleState['drive']>) => void;

  addMessage:       (msg: ChatMessage) => void;
  addReasoningStep: (step: ReasoningStep) => void;
  clearReasoning:   () => void;
  clearMessages:    () => void;
  setAgentThinking: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  vehicle:             INITIAL_VEHICLE_STATE,
  sessionBase:         null,
  agentPatchedFields:  [],
  messages:            [],
  reasoning:           [],
  isAgentThinking:     false,

  updateVehicle: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, ...patch } })),

  takeSessionBase: () =>
    set((s) => ({ sessionBase: s.vehicle, agentPatchedFields: [] })),

  addAgentPatchedFields: (paths) =>
    set((s) => ({ agentPatchedFields: [...s.agentPatchedFields, ...paths] })),

  patchClimate: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, climate: { ...s.vehicle.climate, ...patch } } })),

  patchAmbientLight: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, ambientLight: { ...s.vehicle.ambientLight, ...patch } } })),

  patchMedia: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, media: { ...s.vehicle.media, ...patch } } })),

  patchSeat: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, seat: { ...s.vehicle.seat, ...patch } } })),

  patchSeatPassenger: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, seatPassenger: { ...s.vehicle.seatPassenger, ...patch } } })),

  patchNavigation: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, navigation: { ...s.vehicle.navigation, ...patch } } })),

  patchWindows: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, windows: { ...s.vehicle.windows, ...patch } } })),

  patchDrive: (patch) =>
    set((s) => ({ vehicle: { ...s.vehicle, drive: { ...s.vehicle.drive, ...patch } } })),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  addReasoningStep: (step) =>
    set((s) => ({ reasoning: [...s.reasoning, step] })),

  clearReasoning: () => set({ reasoning: [] }),
  clearMessages:  () => set({ messages: [] }),

  setAgentThinking: (v) => set({ isAgentThinking: v }),
}));
