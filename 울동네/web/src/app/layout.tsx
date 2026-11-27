import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-1356528417680958';

export const metadata: Metadata = {
  metadataBase: new URL('https://wooldongne.com'),
  title: '울동네 - 우리 동네 생활·복지·지원금 매거진',
  description:
    '로그인 없이 우리 동네와 중앙 정부의 보조금·돌봄·생활 혜택 소식을 쉽고 빠르게 확인하세요.',
  other: {
    'google-adsense-account': adsenseClient
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#eff2f6] text-[#202124] antialiased">

        <header className="border-b border-[#e3e7ed] bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a73e8] text-sm font-bold text-white">
                울
              </span>
              <div>
                <div className="text-lg font-bold tracking-tight text-[#202124]">울동네</div>
                <div className="text-xs text-[#5f6368]">생활밀착 복지·지원금 매거진</div>
              </div>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-[#e3e7ed] bg-[#eef1f5]">
          <div className="mx-auto max-w-4xl px-4 py-8 text-sm leading-relaxed text-[#5f6368]">
            <p className="font-medium text-[#202124]">
              울동네 · YJ 스튜디오 민간 생활정보 큐레이션 서비스
            </p>
            <p className="mt-2">
              본 서비스는 정부·지자체 공식 앱이나 웹사이트가 아니며, 공개된 공공 공고와 지원금 정보를
              주민이 이해하기 쉽게 정리해 제공하는 민간 안내 서비스입니다. 최종 신청 자격과 세부 기준은
              반드시 각 공고에 안내된 공식 기관 원문에서 확인해 주세요.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <Link href="/about" className="text-[#1a73e8] hover:underline">
                서비스 소개
              </Link>
              <Link href="/privacy" className="text-[#1a73e8] hover:underline">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="text-[#1a73e8] hover:underline">
                이용약관
              </Link>
              <a href="mailto:contact@yjstudio.app" className="text-[#1a73e8] hover:underline">
                문의하기
              </a>
              <a
                href="https://yjstudio.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5f6368] hover:text-[#1a73e8] hover:underline"
              >
                YJ 스튜디오
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
