import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '이용약관 | 울동네',
  description: '울동네 생활·복지·지원금 큐레이션 웹 매거진 이용약관 및 면책 안내입니다.'
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-[#dfe3ea] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <Link href="/" className="text-sm font-medium text-[#1a73e8] hover:underline">
          ← 전체 소식으로 돌아가기
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#202124] sm:text-3xl">이용약관</h1>
      <p className="mt-2 text-sm text-[#5f6368]">시행일: 2026년 11월 26일</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#3c4043]">
        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            제1조 (목적 및 서비스 성격)
          </h2>
          <p className="mt-3">
            본 약관은 YJ 스튜디오(이하 &ldquo;운영자&rdquo;)가 제공하는{' '}
            <strong>울동네(wooldongne.com)</strong> 웹 매거진 서비스의 이용 조건과 책임 범위를
            규정합니다. 울동네는 중앙 정부 및 지방자치단체, 공공기관이 공개한 복지·지원금·생활혜택
            공고를 주민이 이해하기 쉽게 요약·정리해 제공하는 민간 정보 큐레이션 서비스입니다.
          </p>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            제2조 (비공식 서비스 고지 및 면책)
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              울동네는 정부, 지자체 또는 공공기관의 공식 사이트나 대행 기관이 아니며, 공고 내용의
              최종 심사·선정·지급 권한을 가지지 않습니다.
            </li>
            <li>
              공고 내용은 발표 기관의 사정에 따라 변경, 조기 마감, 예산 소진될 수 있으므로, 실제
              신청 전 반드시 각 게시물에 연결된 <strong>공식 원문·신청 페이지</strong>에서 최신
              공고문과 세부 자격을 확인하셔야 합니다.
            </li>
            <li>
              운영자는 정확한 정보 전달을 위해 노력하나, 요약 과정에서 발생할 수 있는 시차나 해석
              차이로 인한 직·간접적 손해에 대해서는 법령상 허용되는 범위 내에서 책임을 부담하지
              않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            제3조 (지식재산권 및 이용 제한)
          </h2>
          <p className="mt-3">
            울동네가 직접 작성·편집한 안내문과 화면 구성의 권리는 운영자에게 있으며, 원문 공고의
            권리는 해당 공공기관에 귀속됩니다. 본 서비스의 콘텐츠를 무단으로 대량 수집(스크래핑)하거나
            상업적 목적으로 재배포하는 행위는 금지됩니다.
          </p>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            제4조 (서비스 변경 및 문의)
          </h2>
          <p className="mt-3">
            운영자는 서비스 품질 개선을 위해 화면 구성이나 제공 기능을 변경할 수 있습니다. 게시된
            정보의 오류 제보, 삭제 요청 또는 기타 문의는{' '}
            <a href="mailto:contact@yjstudio.app" className="text-[#1a73e8] hover:underline">
              contact@yjstudio.app
            </a>
            으로 연락해 주시기 바랍니다.
          </p>
        </section>
      </div>
    </article>
  );
}
