import type { VehicleState } from '../../shared/types.ts';

const INITIAL_SEAT: VehicleState['seat'] = {
  zeroGravity: false, foreAft: 50, recline: 110, massage: false, heating: false, ventilation: 'off', lumbar: 2,
};

export const vehicleState: VehicleState = {
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
    playing: false, genre: null, volume: 30, trackName: null, artist: null,
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

export function patchVehicleState(patch: Partial<VehicleState>): void {
  Object.assign(vehicleState, patch);
}

export function syncVehicleState(state: Partial<VehicleState>): void {
  Object.assign(vehicleState, state);
}
