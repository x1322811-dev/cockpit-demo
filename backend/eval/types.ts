import type { VehicleState } from '../../shared/types.ts';

export interface EvalCase {
  id: string;
  name: string;
  category: 'music' | 'climate' | 'ambient' | 'window' | 'seat' | 'zone' | 'scene' | 'navigation' | 'query' | 'edge';
  route: 'rule' | 'agent';
  input: string;
  zone?: 'driver' | 'passenger';
  requiredTools: string[];
  // 关键参数验证：返回期望的 args 子集（每个 key 必须匹配）
  keyArgs?: (state: VehicleState) => Record<string, unknown>;
  latencyMs: number;
  note?: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface CaseScores {
  toolHit: number;           // 0-1，按比例（实际命中 / 期望总数）
  paramCorrect: number | null; // 0-1，null = 本条未设 keyArgs，不参与计算
  chainComplete: boolean | null; // null = rule 路径，不参与计算
  latencyOk: boolean;
  zoneCorrect: boolean | null;   // null = 无音区要求
  routeCorrect: boolean;
}

export interface EvalResult {
  caseId: string;
  caseName: string;
  category: string;
  expectedRoute: 'rule' | 'agent';
  passed: boolean;
  scores: CaseScores;
  actualRoute: 'rule' | 'agent';
  toolsCalled: ToolCall[];
  latencyMs: number;
  finalMessage: string;
  error?: string;
}

export interface DimensionScores {
  toolHit: number;       // 工具命中率 30%
  paramCorrect: number;  // 参数正确率 25%
  chainComplete: number; // 推理链完整率 20%
  latencyRate: number;   // 延迟达标率 12%
  zoneAccuracy: number;  // 音区路由准确率 8%
  routeAccuracy: number; // 路由精准度 5%
  overall: number;       // 综合得分
}

export interface EvalSummary {
  timestamp: string;
  total: number;
  passed: number;
  scores: DimensionScores;
  extras: {
    redundantCallCount: number;  // get_car_state 冗余调用次数
    qualityIssues: number;       // 回复字数超标或含禁用词的用例数
  };
  results: EvalResult[];
}
