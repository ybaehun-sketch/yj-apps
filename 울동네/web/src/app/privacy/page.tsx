import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 울동네',
  description:
    '울동네 웹 매거진 및 모바일 앱의 개인정보 처리 기준, 푸시 알림, 쿠키 및 광고 관련 안내입니다.'
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl rounded-2xl border border-[#dfe3ea] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4">
        <Link href="/" className="text-sm font-medium text-[#1a73e8] hover:underline">
          ← 전체 소식으로 돌아가기
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-[#202124] sm:text-3xl">
        개인정보처리방침
      </h1>
      <p className="mt-2 text-sm text-[#5f6368]">시행일: 2026년 11월 27일</p>

      <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#3c4043]">
        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            1. 개인정보의 수집 및 이용
          </h2>
          <p className="mt-3">
            YJ 스튜디오가 운영하는 <strong>울동네(wooldongne.com)</strong> 웹 매거진과{' '}
            <strong>울동네 - 우리동네 복지알림</strong> 모바일 앱은 회원가입이나 로그인 절차 없이
            누구나 이용할 수 있는 공개 정보 서비스입니다. 따라서 이름, 전화번호, 주민등록번호,
            정밀 위치 정보(GPS) 등 이용자를 직접 식별할 수 있는 개인정보를 별도로 수집하거나
            운영자 서버에 저장하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            2. 쿠키(Cookie) 및 제3자 광고(Google AdSense · AdMob) 안내
          </h2>
          <p className="mt-3">
            본 웹 매거진 및 모바일 앱은 서비스 운영 및 광고 게재를 위해 Google AdSense(웹) 및
            Google AdMob(모바일 앱) 등 제3자 광고 서비스를 이용할 수 있습니다.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Google을 포함한 제3자 공급업체는 이용자의 본 웹사이트 및 다른 웹사이트 이전 방문
              기록을 기반으로 광고를 게재하기 위해 쿠키를 사용합니다.
            </li>
            <li>
              Google의 광고 쿠키 사용으로 인해 Google과 파트너는 이용자의 본 사이트 및 인터넷상의
              다른 사이트 방문 기록을 토대로 맞춤형 광고를 제공할 수 있습니다.
            </li>
            <li>
              이용자는{' '}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a73e8] hover:underline"
              >
                Google 광고 설정
              </a>
              에 방문하여 맞춤형 광고를 사용 중지(해제)할 수 있으며,{' '}
              <a
                href="https://www.aboutads.info"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a73e8] hover:underline"
              >
                aboutads.info
              </a>
              를 통해 제3자 공급업체의 맞춤형 광고용 쿠키 사용을 차단할 수 있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            3. 기기 내 설정 저장 및 푸시 알림(FCM) 처리
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong>기기 내 저장소:</strong> 웹사이트 접속 시 일부 편의 기능은 브라우저
              저장소(localStorage)에 보관되며, 모바일 앱에서 선택한 관심 지역(시·도/시·군·구), 관심
              키워드, 즐겨찾기, 글자 크기 및 화면 테마 설정은 이용자 스마트폰 내부 저장소에만
              보관되고 운영자 서버로 전송되지 않습니다.
            </li>
            <li>
              <strong>모바일 앱 푸시 알림:</strong> 이용자가 앱 내 알림 수신에 동의한 경우, 선택한
              관심 지역 및 관심 키워드 새 소식 알림을 전달하기 위해 Google Firebase Cloud
              Messaging(FCM)을 통한 익명 기기 알림 토큰 및 주제(토픽) 구독 정보만 처리됩니다. 알림
              수신 여부는 앱 설정 또는 기기 알림 설정에서 언제든 해제할 수 있습니다.
            </li>
            <li>
              <strong>서비스 안정성 로그:</strong> 웹사이트 및 앱 접속 과정에서 서비스 안정성 유지와
              오류 점검을 위해 접속 시간, 기기·브라우저 종류, 오류 로그 등이 일시적으로 처리될 수
              있습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            4. 외부 링크에 대한 책임
          </h2>
          <p className="mt-3">
            울동네가 안내하는 공식 기관 원문 및 외부 신청 사이트는 각 기관의 독립된
            개인정보처리방침을 따릅니다. 외부 사이트 이용 시 해당 기관의 안내를 확인해 주세요.
          </p>
        </section>

        <section>
          <h2 className="border-b border-[#e8eaed] pb-2 text-lg font-bold text-[#202124]">
            5. 문의처
          </h2>
          <p className="mt-3">
            개인정보 처리와 관련한 문의사항이나 요청이 있으신 경우 아래 이메일로 연락해 주시면
            신속히 확인해 드리겠습니다.
          </p>
          <p className="mt-2 font-medium text-[#202124]">
            이메일:{' '}
            <a href="mailto:contact@yjstudio.app" className="text-[#1a73e8] hover:underline">
              contact@yjstudio.app
            </a>{' '}
            (운영: YJ 스튜디오)
          </p>
        </section>
      </div>
    </article>
  );
}
