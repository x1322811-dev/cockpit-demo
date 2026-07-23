import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EVAL_CASES } from './cases.ts';
import { runCase, checkResponseQuality } from './runner.ts';
import type { EvalResult, EvalSummary, DimensionScores } from './types.ts';

const evalModuleDir = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(evalModuleDir, 'results');

// ── ANSI 颜色 ────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m', white: '\x1b[97m',
};
const pass  = `${c.green}✓${c.reset}`;
const fail  = `${c.red}✗${c.reset}`;
const bar   = (v: number, w = 16) => '█'.repeat(Math.round(v * w)) + '░'.repeat(w - Math.round(v * w));

// ── 汇总维度分数 ─────────────────────────────────────────────────
function calcScores(results: EvalResult[], cases: typeof EVAL_CASES): DimensionScores {
  const total = results.length;
  if (total === 0) return { toolHit: 0, paramCorrect: 0, chainComplete: 0, latencyRate: 0, zoneAccuracy: 0, routeAccuracy: 0, overall: 0 };

  const toolHit       = results.reduce((s, r) => s + r.scores.toolHit, 0) / total;
  const routeAccuracy = results.filter((r) => r.scores.routeCorrect).length / total;
  const latencyRate   = results.filter((r) => r.scores.latencyOk).length / total;

  // 参数正确率（仅计有 keyArgs 的用例）
  const paramResults = results.filter((r) => r.scores.paramCorrect !== null);
  const paramCorrect = paramResults.length > 0
    ? paramResults.reduce((s, r) => s + (r.scores.paramCorrect ?? 0), 0) / paramResults.length
    : 1;

  // 推理链完整率（仅计 agent 用例）
  const chainResults = results.filter((r) => r.scores.chainComplete !== null);
  const chainComplete = chainResults.length > 0
    ? chainResults.filter((r) => r.scores.chainComplete === true).length / chainResults.length
    : 1;

  // 音区路由准确率（仅计含 zone 要求的用例）
  const zoneResults = results.filter((r) => r.scores.zoneCorrect !== null);
  const zoneAccuracy = zoneResults.length > 0
    ? zoneResults.filter((r) => r.scores.zoneCorrect === true).length / zoneResults.length
    : 1;

  const overall =
    toolHit       * 0.30 +
    paramCorrect  * 0.25 +
    chainComplete * 0.20 +
    latencyRate   * 0.12 +
    zoneAccuracy  * 0.08 +
    routeAccuracy * 0.05;

  return { toolHit, paramCorrect, chainComplete, latencyRate, zoneAccuracy, routeAccuracy, overall };
}

// ── 主流程 ───────────────────────────────────────────────────────
async function main() {
  const total = EVAL_CASES.length;
  console.log(`\n${c.bold}${c.cyan}🧪 智能座舱 Agent 评估  (${total} 条用例)${c.reset}`);
  console.log('━'.repeat(52));

  const results: EvalResult[] = [];
  let redundantCallCount = 0;
  let qualityIssues = 0;

  for (let i = 0; i < EVAL_CASES.length; i++) {
    const ec = EVAL_CASES[i];
    process.stdout.write(
      `${c.gray}[${ec.route === 'rule' ? 'Rule ' : 'Agent'}]${c.reset} ${ec.id.padEnd(4)} ${ec.name.padEnd(16)} `
    );

    const result = await runCase(ec);
    results.push(result);

    // 冗余调用统计
    redundantCallCount += result.toolsCalled.filter((t) => t.name === 'get_car_state').length;

    // 回复质量
    if (!checkResponseQuality(result, ec)) qualityIssues++;

    const statusStr = result.passed ? pass : fail;
    const timeStr = `${c.gray}${result.latencyMs}ms${c.reset}`;
    const errStr = result.error ? ` ${c.red}[ERR]${c.reset}` : '';
    console.log(`${statusStr}  ${timeStr}${errStr}`);
  }

  // ── 失败明细 ──────────────────────────────────────────────────
  const failed = results.filter((r) => !r.passed);
  if (failed.length > 0) {
    console.log('\n' + '━'.repeat(52));
    console.log(`${c.bold}失败明细：${c.reset}\n`);
    for (const r of failed) {
      const ec = EVAL_CASES.find((c) => c.id === r.caseId)!;
      console.log(`${fail} ${c.bold}${r.caseId}  ${r.caseName}${c.reset}`);
      if (r.error) {
        console.log(`  ${c.red}错误：${r.error}${c.reset}`);
        continue;
      }
      const hitPct = Math.round(r.scores.toolHit * 100);
      const expected = ec.requiredTools.join(', ');
      const actual = r.toolsCalled.map((t) => t.name).join(', ') || '（无）';
      console.log(`  工具命中  ${hitPct < 100 ? c.red : c.green}${hitPct}%${c.reset}  期望 [${expected}]`);
      console.log(`           ${c.gray}实际 [${actual}]${c.reset}`);
      if (r.scores.paramCorrect !== null)
        console.log(`  参数正确  ${r.scores.paramCorrect ? `${c.green}✓` : `${c.red}✗`}${c.reset}`);
      if (r.scores.zoneCorrect !== null)
        console.log(`  音区路由  ${r.scores.zoneCorrect ? `${c.green}✓` : `${c.red}✗`}${c.reset}`);
      if (r.scores.chainComplete !== null)
        console.log(`  推理链    ${r.scores.chainComplete ? `${c.green}✓ intent+decide` : `${c.red}✗`}${c.reset}`);
      console.log(`  延迟      ${r.scores.latencyOk ? `${c.green}✓` : `${c.red}✗`}${c.reset}  ${r.latencyMs}ms`);
      console.log();
    }
  }

  // ── 综合评分 ──────────────────────────────────────────────────
  const scores = calcScores(results, EVAL_CASES);
  const passed = results.filter((r) => r.passed).length;
  const pct = Math.round((passed / total) * 100);
  const overallScore = Math.round(scores.overall * 100);

  console.log('━'.repeat(52));
  console.log(`${c.bold}综合得分：${overallScore >= 90 ? c.green : overallScore >= 75 ? c.yellow : c.red}${overallScore} 分${c.reset}  (${passed}/${total} 通过，${pct}%)\n`);

  const dims: [string, number][] = [
    ['工具命中率    ', scores.toolHit],
    ['参数正确率    ', scores.paramCorrect],
    ['推理链完整率  ', scores.chainComplete],
    ['延迟达标率    ', scores.latencyRate],
    ['音区路由准确  ', scores.zoneAccuracy],
    ['路由精准度    ', scores.routeAccuracy],
  ];
  for (const [label, val] of dims) {
    const pctStr = `${Math.round(val * 100)}%`.padStart(4);
    const color = val >= 0.9 ? c.green : val >= 0.75 ? c.yellow : c.red;
    console.log(`  ${label} ${color}${bar(val)}${c.reset}  ${pctStr}`);
  }

  console.log(`\n${c.gray}附加指标：${c.reset}`);
  console.log(`  冗余调用（get_car_state）  ${redundantCallCount} 次`);
  console.log(`  回复质量问题               ${qualityIssues} 条`);

  // ── 保存结果 ──────────────────────────────────────────────────
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(RESULTS_DIR, `${timestamp}.json`);
  const summary: EvalSummary = {
    timestamp,
    total,
    passed,
    scores,
    extras: { redundantCallCount, qualityIssues },
    results,
  };
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\n${c.gray}结果已保存 → backend/eval/results/${timestamp}.json${c.reset}\n`);
}

main().catch((err) => {
  console.error(`\n${c.red}评估中断：${err.message}${c.reset}\n`);
  process.exit(1);
});
