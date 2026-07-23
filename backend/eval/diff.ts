import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { EvalSummary, EvalResult } from './types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'results');

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m',
};

function loadLatestTwo(): [EvalSummary, EvalSummary] | null {
  if (!fs.existsSync(RESULTS_DIR)) return null;
  const files = fs.readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse();
  if (files.length < 2) return null;
  const a = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, files[1]), 'utf8')) as EvalSummary;
  const b = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, files[0]), 'utf8')) as EvalSummary;
  return [a, b];
}

function scoreDelta(v: number): string {
  const d = Math.round(v * 100);
  if (d > 0) return `${c.green}+${d}${c.reset}`;
  if (d < 0) return `${c.red}${d}${c.reset}`;
  return `${c.gray}±0${c.reset}`;
}

function main() {
  const pair = loadLatestTwo();
  if (!pair) {
    console.log(`\n${c.yellow}需要至少 2 次评估结果才能对比。先运行 npm run eval。${c.reset}\n`);
    return;
  }
  const [prev, curr] = pair;

  const prevMap = new Map<string, EvalResult>(prev.results.map((r) => [r.caseId, r]));
  const currMap = new Map<string, EvalResult>(curr.results.map((r) => [r.caseId, r]));

  const newPass: EvalResult[] = [];
  const newFail: EvalResult[] = [];

  for (const [id, cr] of currMap) {
    const pr = prevMap.get(id);
    if (!pr) continue;
    if (!pr.passed && cr.passed) newPass.push(cr);
    if (pr.passed && !cr.passed) newFail.push(cr);
  }

  console.log(`\n${c.bold}${c.cyan}📊 评估对比 ${prev.timestamp} → ${curr.timestamp}${c.reset}\n`);

  if (newPass.length === 0 && newFail.length === 0) {
    console.log(`${c.gray}通过/失败列表无变化。${c.reset}`);
  }

  if (newPass.length > 0) {
    console.log(`${c.green}${c.bold}新增通过（${newPass.length} 条）${c.reset}`);
    for (const r of newPass) {
      console.log(`  ${c.green}✓${c.reset}  ${r.caseId.padEnd(4)}  ${r.caseName}`);
    }
    console.log();
  }

  if (newFail.length > 0) {
    console.log(`${c.red}${c.bold}新增失败（${newFail.length} 条）⚠ 回归退化${c.reset}`);
    for (const r of newFail) {
      console.log(`  ${c.red}✗${c.reset}  ${r.caseId.padEnd(4)}  ${r.caseName}`);
    }
    console.log();
  }

  // 分数对比
  const ps = prev.scores;
  const cs = curr.scores;
  const overallDelta = cs.overall - ps.overall;

  console.log('─'.repeat(48));
  console.log(`综合得分  ${Math.round(ps.overall * 100)} → ${Math.round(cs.overall * 100)}  ${scoreDelta(overallDelta)}`);
  console.log(`通过数量  ${prev.passed}/${prev.total} → ${curr.passed}/${curr.total}\n`);

  const dims: [string, keyof typeof ps][] = [
    ['工具命中率', 'toolHit'],
    ['参数正确率', 'paramCorrect'],
    ['推理链完整率', 'chainComplete'],
    ['延迟达标率', 'latencyRate'],
    ['音区路由准确', 'zoneAccuracy'],
    ['路由精准度', 'routeAccuracy'],
  ];
  for (const [label, key] of dims) {
    const delta = cs[key] - ps[key];
    if (Math.abs(delta) >= 0.01) {
      console.log(`  ${label.padEnd(10)}  ${Math.round(ps[key] * 100)}% → ${Math.round(cs[key] * 100)}%  ${scoreDelta(delta)}`);
    }
  }
  console.log();
}

main();
