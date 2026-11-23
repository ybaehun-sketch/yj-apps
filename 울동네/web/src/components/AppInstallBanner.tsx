export function AppInstallBanner() {
  const appUrl = process.env.NEXT_PUBLIC_APP_STORE_URL || 'https://yjstudio.app';

  return (
    <div className="my-6 flex flex-col justify-between gap-4 rounded-xl border border-[#d2e3fc] bg-[#f8fbff] p-5 sm:flex-row sm:items-center">
      <div>
        <div className="text-base font-bold text-[#202124]">
          우리 동네 긴급 돌봄·지원금 놓치지 않기
        </div>
        <p className="mt-1 text-sm text-[#5f6368]">
          회원가입 없이 10초 만에 동네와 관심 키워드를 고르면 새 공고를 바로 알림으로 받아보실 수 있어요.
        </p>
      </div>
      <a
        href={appUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#1a73e8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1557b0]"
      >
        울동네 앱 설치하기 →
      </a>
    </div>
  );
}
