import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 소개 | 울동네',
  description:
    '울동네는 중앙 정부와 전국 지자체의 지원금·복지·생활 혜택 공고를 누구나 이해하기 쉽게 정리해 드리는 민간 생활정보 큐레이션 매거진입니다.'
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-[#dfe3ea] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <Link href="/" className="text-sm font-medium text-[#1a73e8] hover:underline">
          ← 전체 소식으로 돌아가기
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#202124] sm:text-3xl">
        울동네 서비스 소개
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[#5f6368]">
        어렵고 흩어져 있는 정부·지자체 지원금과 생활 혜택 공고를 누구나 한눈에 이해할 수 있도록
        쉬운 일상어로 정리해 드리는 민간 생활정보 큐레이션 매거진입니다.
      </p>

      <div className="mt-8 space-y-6 text-[16px] leading-relaxed text-[#202124]">
        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold">
            1. 울동네가 하는 일
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[#3c4043]">
            <li>
              <strong>쉬운 일상어 번역:</strong> 복잡한 행정 용어와 HWP·PDF 공고문을 핵심 지원 대상,
              혜택 내용, 신청 기간, 준비 서류 중심으로 알기 쉽게 정리합니다.
            </li>
            <li>
              <strong>로그인 없는 빠른 열람:</strong> 회원가입이나 본인인증 절차 없이 누구나 바로
              필요한 생활 혜택 정보를 읽을 수 있습니다.
            </li>
            <li>
              <strong>공식 원문 링크 제공:</strong> 모든 안내 글에는 해당 지자체·공공기관의 공식
              원문 및 신청 페이지 바로가기 링크를 함께 안내합니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold">
            2. 정보 출처 및 검수 원칙
          </h2>
          <p className="mt-3 text-[#3c4043]">
            울동네의 모든 소식은 복지로, 보조금24 등 중앙부처 공식 안내와 전국 시·도·군·구청 및
            가족센터 등 공공기관 홈페이지에 공개된 공고를 바탕으로 작성됩니다. 발행 전 내용 정확도와
            마감일, 원문 연결 여부를 점검하여 제공합니다.
          </p>
          <p className="mt-2 rounded-xl bg-[#f8f9fa] p-4 text-sm text-[#5f6368]">
            ※ 울동네는 정부 또는 지방자치단체의 공식 대행 기관이 아닌{' '}
            <strong>YJ 스튜디오가 운영하는 민간 정보 큐레이션 서비스</strong>입니다. 최종 신청
            자격과 세부 기준은 반드시 공식 기관 원문에서 다시 확인해 주세요.
          </p>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold">
            3. 운영자 및 문의 안내
          </h2>
          <div className="mt-3 rounded-xl border border-[#e3e7ed] bg-[#fcfbf8] p-4 text-sm text-[#3c4043]">
            <p>
              <strong>서비스명:</strong> 울동네 (wooldongne.com)
            </p>
            <p className="mt-1">
              <strong>운영사:</strong> YJ 스튜디오 (
              <a
                href="https://yjstudio.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a73e8] hover:underline"
              >
                yjstudio.app
              </a>
              )
            </p>
            <p className="mt-1">
              <strong>문의 및 정정 요청:</strong>{' '}
              <a href="mailto:contact@yjstudio.app" className="text-[#1a73e8] hover:underline">
                contact@yjstudio.app
              </a>
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
