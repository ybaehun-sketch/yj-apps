import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  // 로컬(내 컴퓨터) Node.js 환경에서만 직접 통합 순찰 스크립트 실행
  const scriptPath = path.resolve(process.cwd(), '..', 'worker', 'scripts', 'run-full-patrol.mjs');
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json(
      { error: '로컬 순찰 스크립트를 찾을 수 없습니다. 내 컴퓨터(미리보기) 환경에서 실행해 주세요.' },
      { status: 400 }
    );
  }

  try {
    // Cloudflare Workers 빌드 번들링 시 node:child_process 정적 포함 방지
    const dynamicRequire = eval('require') as NodeRequire;
    const { execFile } = dynamicRequire('node:child_process') as typeof import('node:child_process');

    const result = await new Promise<{ ok: boolean; stdout: string; stderr: string }>((resolve) => {
      execFile(
        process.execPath,
        [scriptPath],
        {
          cwd: path.resolve(process.cwd(), '..', 'worker'),
          timeout: 240000,
          maxBuffer: 1024 * 1024 * 4,
          windowsHide: true
        },
        (error, stdout, stderr) => {
          resolve({
            ok: !error,
            stdout: stdout || '',
            stderr: stderr || ''
          });
        }
      );
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: '수동 순찰 실행 중 오류가 발생했습니다. 순찰 로그를 확인해 주세요.' },
        { status: 500 }
      );
    }

    const match = result.stdout.match(/\[울동네 통합 순찰 완료\]\s*(\{.*\})/);
    let summary: {
      checkedTargets?: number;
      successCount?: number;
      createdPosts?: number;
      failedCount?: number;
    } = {};
    if (match?.[1]) {
      try {
        summary = JSON.parse(match[1]);
      } catch {
        // 무시
      }
    }

    return NextResponse.json({
      ok: true,
      summary
    });
  } catch {
    return NextResponse.json(
      { error: '클라우드 실서버에서는 로컬 수동 순찰을 실행할 수 없습니다. 내 컴퓨터 검수실에서 실행해 주세요.' },
      { status: 501 }
    );
  }
}
