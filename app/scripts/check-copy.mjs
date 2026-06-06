// 검수 정책 위반 키워드 검출.
// R-03 (광고 클릭 유도 표현) / R-07 (비게임 분류 게임 용어) 자동 검증.
// 새 키워드 추가 시 BLOCKED 배열에 추가.
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '..');
const SCAN_DIRS = ['src', 'pages'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const BLOCKED = [
  '클릭',
  '눌러주',
  '광고를 누르',
  '당첨',
  '추첨',
  '꽝',
  '룰렛',
  '뽑기',
  '레벨업',
  '레벨 업',
  '퀘스트',
  '스탯',
  '도감',
  '랭킹',
  '미션 클리어',
];

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (EXTENSIONS.includes(path.extname(e.name))) out.push(p);
  }
  return out;
}

function stripComment(line) {
  let inStr = false;
  let strCh = '';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === strCh) inStr = false;
    } else if (c === '"' || c === "'" || c === '`') {
      inStr = true;
      strCh = c;
    } else if (c === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}

async function main() {
  const allFiles = [];
  for (const d of SCAN_DIRS) {
    try {
      allFiles.push(...(await walk(path.join(ROOT, d))));
    } catch {
      /* dir 부재 OK */
    }
  }
  const violations = [];
  for (const f of allFiles) {
    const content = await fs.readFile(f, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const code = stripComment(line);
      for (const w of BLOCKED) {
        if (code.includes(w)) {
          violations.push({ file: path.relative(ROOT, f), line: idx + 1, word: w });
        }
      }
    });
  }
  if (violations.length > 0) {
    console.error('블랙리스트 키워드 검출:');
    for (const v of violations) console.error(`  ${v.file}:${v.line} — "${v.word}"`);
    process.exit(1);
  }
  console.log(`OK — ${allFiles.length}개 파일 검사, 위반 0건`);
}

main();
