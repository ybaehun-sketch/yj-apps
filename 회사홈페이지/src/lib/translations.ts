import type { Language } from "@/lib/i18n";
import { extraTranslations } from "@/lib/translations-extra";

export interface TranslationBundle {
  nav: {
    about: string;
    products: string;
    contact: string;
    menuAria: string;
  };
  hero: {
    badge: string;
    titlePrefix: string;
    titleAccent: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  about: {
    eyebrow: string;
    headline: string;
    body: string;
  };
  products: {
    eyebrow: string;
    title: string;
    items: {
      tokbiseo: {
        tag: string;
        name: string;
        desc: string;
        quickLinks: {
          terms: string;
          privacy: string;
          guide: string;
        };
      };
      tarot: { tag: string; name: string; desc: string };
      dream: { tag: string; name: string; desc: string };
      bamboo: { tag: string; name: string; desc: string };
    };
  };
  contact: {
    title: string;
    subtitle: string;
    form: {
      namePlaceholder: string;
      emailPlaceholder: string;
      messagePlaceholder: string;
      submit: string;
      directEmailPrefix: string;
      doneTitle: string;
      doneBody: string;
      newMessage: string;
      errorGeneric: string;
      copyEmail: string;
      copied: string;
      openMailApp: string;
      emailHelper: string;
    };
  };
  footer: {
    companyLabel: string;
    companyValue: string;
    ceoLabel: string;
    businessLabel: string;
    businessValue: string;
    emailLabel: string;
    privacyLink: string;
    termsLink: string;
  };
  legal: {
    effectiveDate: string;
    termsTitle: string;
    privacyTitle: string;
    termsSections: { title: string; body: string }[];
    termsContact: string;
  };
  tokbiseo: {
    pageTitle: string;
    introPrefix: string;
    introStrong: string;
    introSuffix: string;
    navAria: string;
    tabs: { guide: string; terms: string; privacy: string };
    guideHeading: string;
    guideIntro: string;
    guideSteps: { title: string; body: string }[];
    termsHeading: string;
    termsArticles: { title: string; body: string }[];
    privacyHeading: string;
    privacyServiceName: string;
  };
  privacy: {
    generalServiceName: string;
    introPrefix: string;
    introSuffix: string;
    sections: {
      s1Title: string;
      s1AccountLabel: string;
      s1AccountBody: string;
      s1TokbiseoLabel: string;
      s1TokbiseoBody: string;
      s1PaymentLabel: string;
      s1PaymentBody: string;
      s1ContactLabel: string;
      s1ContactBody: string;
      s2Title: string;
      s2Items: string[];
      s2AiItem: string;
      s3Title: string;
      s3Body: string;
      s3Items: string[];
      s4Title: string;
      s4ProcedureLabel: string;
      s4ProcedureBody: string;
      s4MethodLabel: string;
      s4MethodBody: string;
      s5Title: string;
      s5Body: string;
      s5CloudLabel: string;
      s5CloudBody: string;
      s5AiLabel: string;
      s5AiBody: string;
      s5MailLabel: string;
      s5MailBody: string;
      s6Title: string;
      s6Body: string;
      s6DeleteLabel: string;
      s6DeleteBeforeEmail: string;
      s6DeleteAfterEmail: string;
      s6ChildLabel: string;
      s6ChildBody: string;
      s7Title: string;
      s7Body: string;
      s8Title: string;
      s8Items: string[];
      s9Title: string;
      s9Officer: string;
      s9Company: string;
      s9Email: string;
      s10Title: string;
      s10Body: string;
      s10Items: string[];
      s11Title: string;
      s11Body: string;
    };
  };
}

export const translations: Record<Language, TranslationBundle> = {
  ...extraTranslations,
  ko: {
    nav: {
      about: "About",
      products: "Products & Universe",
      contact: "Contact",
      menuAria: "메뉴",
    },
    hero: {
      badge: "Life-Centric Software Studio",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "하루의 일상을 정비하고 생각을 나누는 곳. 웹과 모바일 생태계를 아우르며 삶을 더 편리하고 윤택하게 만드는 디지털 서비스를 만듭니다.",
      primaryCta: "프로덕트 라인업 보기",
      secondaryCta: "문의하기",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "작지만 빠르고, 깊이 있는 하이테크 스튜디오",
      body: "와이제이스튜디오는 AI를 레버리지하는 1인 풀스택 체제로 기획부터 출시·운영까지 군더더기 없는 속도로 돌파합니다. 모바일 생태계와 대중적인 생활 유틸리티까지 빠르게 검증하고 실현합니다.",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "프로덕트 라인업",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "톡비서",
          desc: "AI 기억 비서 — 텍스트, 스크린샷, 음성까지 던지기만 하면 AI가 알아서 정리하는 나만의 기억 비서.",
          quickLinks: {
            terms: "약관",
            privacy: "개인정보처리방침",
            guide: "이용방법",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "찻잔타로",
          desc: "Digital Tarot & Fortune — 일상에 위로와 영감을 전하는 디지털 타로·운세 서비스.",
        },
        dream: {
          tag: "Dream",
          name: "꿈소반",
          desc: "Dream Interpretation Platform — 꿈의 의미를 직관적으로 풀어주는 꿈 해몽 서비스.",
        },
        bamboo: {
          tag: "Community",
          name: "대나무숲 속풀이",
          desc: "Anonymous Venting Space — 솔직한 마음을 익명으로 털어놓고 위로받는 공간.",
        },
      },
    },
    contact: {
      title: "함께 만들어 갈 프로젝트가 있나요?",
      subtitle: "제휴, 협업, 서비스 문의를 환영합니다.",
      form: {
        namePlaceholder: "성함 / 기업명",
        emailPlaceholder: "회신받을 이메일",
        messagePlaceholder: "문의 내용",
        submit: "문의 보내기",
        directEmailPrefix: "직접 메일:",
        doneTitle: "문의가 접수되었습니다.",
        doneBody: "확인 후 남겨주신 이메일로 회신드리겠습니다.",
        newMessage: "새 문의 작성",
        errorGeneric: "입력 내용을 확인한 뒤 다시 시도해 주세요.",
        copyEmail: "메일 주소 복사",
        copied: "복사되었습니다",
        openMailApp: "메일 앱으로 보내기",
        emailHelper: "아래 이메일 주소로 편하게 연락해 주세요. 영업일 기준 빠르게 회신드리겠습니다.",
      },
    },
    footer: {
      companyLabel: "상호명: ",
      companyValue: "와이제이스튜디오 (YJ Studio)",
      ceoLabel: "대표자: ",
      businessLabel: "업종: ",
      businessValue: "IT Software Development & Web Services",
      emailLabel: "이메일: ",
      privacyLink: "개인정보처리방침",
      termsLink: "이용약관",
    },
    legal: {
      effectiveDate: "시행일: 2026년 11월 8일",
      termsTitle: "이용약관",
      privacyTitle: "개인정보처리방침",
      termsSections: [
        {
          title: "제1조 (목적)",
          body: '본 약관은 와이제이스튜디오(이하 "회사")가 제공하는 웹·앱 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무를 규정함을 목적으로 합니다.',
        },
        {
          title: "제2조 (약관의 효력 및 변경)",
          body: "본 약관은 서비스 화면에 게시함으로써 효력이 발생하며, 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있고 개정 시 7일 전 공지합니다.",
        },
        {
          title: "제3조 (서비스의 제공)",
          body: "회사는 생산성 유틸리티, 콘텐츠 플랫폼, 에듀테크, 공간정보 분석 등 디지털 서비스를 제공하며, 일부 서비스는 유료로 제공될 수 있습니다.",
        },
        {
          title: "제4조 (유료 서비스 및 환불)",
          body: "유료 서비스의 가격과 결제 조건은 각 서비스 화면에 표시됩니다. 환불은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 각 앱마켓 정책에 따릅니다.",
        },
        {
          title: "제5조 (이용자의 의무)",
          body: "이용자는 타인의 정보 도용, 서비스 운영 방해, 법령 위반 행위를 해서는 안 됩니다.",
        },
        {
          title: "제6조 (책임의 제한)",
          body: "회사는 천재지변 등 불가항력 또는 이용자의 귀책 사유로 인한 손해에 대해 책임을 지지 않습니다. 운세·타로 등 오락성 콘텐츠는 참고용입니다.",
        },
        {
          title: "제7조 (분쟁 해결)",
          body: "본 약관은 대한민국 법률에 따르며, 분쟁 발생 시 민사소송법상 관할 법원에 제기합니다.",
        },
      ],
      termsContact: "문의: contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "톡비서 (AI 기억 비서)",
      introPrefix: "던지기만 하면 AI가 알아서 정리하는 나만의 기억 비서, ",
      introStrong: "톡비서",
      introSuffix: "의 이용방법과 약관 및 개인정보처리방침을 안내합니다.",
      navAria: "톡비서 문서 바로가기",
      tabs: {
        guide: "이용방법",
        terms: "이용약관",
        privacy: "개인정보처리방침",
      },
      guideHeading: "이용방법",
      guideIntro:
        "톡비서는 복잡한 폴더 분류나 정리 없이, 떠오른 생각·메모·스크린샷·음성을 빠르고 가볍게 기록해 두는 AI 기억 비서입니다.",
      guideSteps: [
        {
          title: "1단계 — 편하게 던지기:",
          body: "해야 할 일, 아이디어, 메모, 스크린샷 이미지, 음성 녹음 등 기억해야 할 내용을 입력창에 평소처럼 자유롭게 남깁니다.",
        },
        {
          title: "2단계 — AI 자동 정리:",
          body: "톡비서가 입력된 내용을 분석해 핵심 내용을 요약하고 카테고리별로 자동 정리해 줍니다.",
        },
        {
          title: "3단계 — 언제든 꺼내 보기:",
          body: "보관함(인박스)에서 정리된 기록을 한눈에 확인하고, 완료한 항목을 체크하며 하루를 가볍게 관리할 수 있습니다.",
        },
      ],
      termsHeading: "이용약관",
      termsArticles: [
        {
          title: "제1조 (목적)",
          body: '본 약관은 와이제이스튜디오(이하 "회사")가 제공하는 톡비서 서비스(이하 "서비스")의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.',
        },
        {
          title: "제2조 (약관의 효력 및 개정)",
          body: "본 약관은 서비스 내 화면 또는 홈페이지에 게시함으로써 효력이 발생합니다. 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 중요한 변경 시 시행일 최소 7일 전(이용자에게 불리한 경우 30일 전)부터 공지합니다.",
        },
        {
          title: "제3조 (계정 및 외부 로그인 연동)",
          body: "이용자는 Google 계정 등 회사가 지원하는 로그인 방식을 통해 서비스에 가입·이용할 수 있습니다. 외부 계정 연동 시 해당 플랫폼(Google 등)의 이용정책이 함께 적용되며, 이용자는 언제든지 서비스 내 설정 또는 이메일 요청을 통해 연동 해제 및 회원 탈퇴를 할 수 있습니다.",
        },
        {
          title: "제4조 (서비스의 내용 및 변경·중단)",
          body: "회사는 이용자가 입력한 메모·일정·아이디어 등을 AI로 요약·분류·보관하는 생산성 유틸리티 기능을 제공합니다. 회사는 시스템 점검, 기술적 개선 등 운영상 필요한 경우 서비스의 전부 또는 일부를 변경·일시 중단할 수 있으며, 사전에 공지합니다(긴급한 경우 사후 공지).",
        },
        {
          title: "제5조 (유료 서비스, 정기 구독 및 환불)",
          body: "일부 부가 기능은 유료 또는 정기 구독 형태로 제공될 수 있으며, 요금·결제 주기·무료 체험 조건은 결제 화면에 명확히 표시됩니다. 정기 구독은 이용자가 다음 결제일 최소 24시간 전까지 앱마켓(Google Play 등) 또는 계정 설정에서 해지하지 않으면 자동 갱신됩니다. 환불은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 Google Play 등 각 앱마켓의 환불 정책에 따릅니다.",
        },
        {
          title: "제6조 (이용자 콘텐츠의 권리 및 AI 처리)",
          body: "이용자가 서비스에 입력한 메모·일정 등 모든 콘텐츠의 권리는 이용자 본인에게 있습니다. 회사는 AI 요약·분류 및 기기 간 동기화 등 서비스 제공 목적에 한하여 해당 콘텐츠를 처리하며, 이용자의 개인 메모를 외부 공개나 무단 상업적 목적으로 사용하지 않습니다.",
        },
        {
          title: "제7조 (이용자의 의무 및 이용 제한)",
          body: "이용자는 타인의 계정·정보 도용, 서비스 시스템 무단 공격, 자동화 도구를 이용한 비정상적 과부하 유발, 법령에 위반되는 불법·유해 콘텐츠 저장 행위를 해서는 안 됩니다. 위반 시 회사는 사전 통지 후(긴급 시 즉시) 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.",
        },
        {
          title: "제8조 (지식재산권)",
          body: "서비스의 소프트웨어, 디자인, 상표, 로고 등 이용자 콘텐츠를 제외한 일체의 지식재산권은 회사에 귀속되며, 회사의 사전 서면 동의 없이 복제·배포·변형할 수 없습니다.",
        },
        {
          title: "제9조 (AI 결과물의 한계 및 책임의 제한)",
          body: "AI가 생성한 요약·분류·일정 제안 결과는 이용자의 편의를 돕기 위한 참고 자료이며, 정확성이나 완전성을 100% 보장하지 않습니다. 이용자는 법률·의료·재무 등 중요한 의사결정에 AI 결과를 단독으로 의존해서는 안 되며, 회사는 천재지변·불가항력 또는 이용자의 귀책 사유로 발생한 손해에 대해 책임을 지지 않습니다.",
        },
        {
          title: "제10조 (준거법, 분쟁 해결 및 문의처)",
          body: "본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련해 분쟁이 발생할 경우 민사소송법상 관할 법원을 전속 관할로 합니다. 약관 및 서비스 관련 문의는 contact@yjstudio.app으로 접수해 주시기 바랍니다.",
        },
      ],
      privacyHeading: "개인정보처리방침",
      privacyServiceName: "톡비서 서비스",
    },
    privacy: {
      generalServiceName: "와이제이스튜디오가 제공하는 웹·앱 서비스",
      introPrefix: '와이제이스튜디오(이하 "회사")는 「개인정보 보호법」 등 관련 법령을 준수하며, ',
      introSuffix: " 이용자의 개인정보를 소중히 보호하고 있습니다.",
      sections: {
        s1Title: "1. 수집하는 개인정보 항목 및 수집 방법",
        s1AccountLabel: "회원가입 및 서비스 이용 시(필수):",
        s1AccountBody: " 이메일 주소, 계정 식별자(소셜 로그인 연동 시), 서비스 이용 기록, 접속 로그, 기기 정보(OS 버전, 브라우저 정보)",
        s1TokbiseoLabel: "톡비서 기능 이용 시:",
        s1TokbiseoBody: " 이용자가 AI 정리 및 보관을 위해 직접 입력·업로드한 메모, 일정, 할 일 텍스트, 스크린샷·이미지 파일 및 음성 녹음(오디오) 데이터",
        s1PaymentLabel: "유료 서비스 결제 시:",
        s1PaymentBody: " 결제 승인 내역 및 구독 상태 정보(신용카드 번호 등 민감 결제 정보는 결제대행사(PG) 및 앱마켓이 직접 처리하며 회사는 저장하지 않음)",
        s1ContactLabel: "고객 문의 시:",
        s1ContactBody: " 성함, 회신받을 이메일 주소, 문의 내용",
        s2Title: "2. 개인정보의 수집 및 이용 목적",
        s2Items: [
          "이용자 본인 식별, 로그인 유지 및 맞춤형 서비스 제공",
          "유료 서비스 요금 정산, 결제 및 환불 처리",
          "고객 문의·불만 응대, 공지사항 전달 및 부정 이용 방지·보안 강화",
        ],
        s2AiItem: "입력·업로드된 메모, 일정, 이미지, 음성 녹음의 AI 자동 요약, 분류 및 기기 간 동기화 보관",
        s3Title: "3. 개인정보의 보유 및 이용 기간",
        s3Body:
          "회사는 개인정보 수집 및 이용 목적이 달성되거나 이용자가 회원 탈퇴(계정 삭제)를 요청한 경우 지체 없이 해당 정보를 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 아래 기간 동안 안전하게 보관합니다.",
        s3Items: [
          "계약 또는 청약철회, 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)",
          "소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)",
          "서비스 방문 및 접속에 관한 로그 기록: 3개월 (통신비밀보호법)",
        ],
        s4Title: "4. 개인정보의 파기 절차 및 방법",
        s4ProcedureLabel: "파기 절차:",
        s4ProcedureBody: " 보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 내부 방침 및 관련 법령에 따라 별도 분리 보관 후 지체 없이 파기합니다.",
        s4MethodLabel: "파기 방법:",
        s4MethodBody: " 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 영구 삭제하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.",
        s5Title: "5. 개인정보의 제3자 제공 및 처리 위탁·국외 이전",
        s5Body:
          "회사는 이용자의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다. 다만, 원활한 서비스 제공을 위해 아래와 같이 필수 업무를 위탁하거나 해외 클라우드·AI 인프라를 이용할 수 있습니다.",
        s5CloudLabel: "클라우드 인프라 및 데이터베이스 호스팅:",
        s5CloudBody: " 서비스 데이터 저장 및 로그인 인증 처리 (보안 암호화 적용)",
        s5AiLabel: "AI 콘텐츠 처리 위탁(텍스트·이미지·음성, 국외 이전 포함):",
        s5AiBody:
          " 이용자가 입력·업로드한 메모, 이미지, 음성 데이터를 AI로 자동 요약·전사·분류하기 위해 글로벌 AI 모델 제공사(미국 등 해외 서버 포함)에 암호화된 통신으로 처리를 위탁할 수 있으며, 해당 데이터는 처리 목적 외 별도 학습이나 영구 저장에 사용되지 않도록 관리합니다.",
        s5MailLabel: "이메일 발송 및 결제 대행:",
        s5MailBody: " 문의 메일 전달 및 유료 결제 승인·환불 처리",
        s6Title: "6. 이용자(정보주체)의 권리 및 계정·데이터 삭제 방법",
        s6Body: "이용자는 언제든지 등록되어 있는 자신의 개인정보를 열람·정정·삭제·처리정지 요청할 수 있습니다.",
        s6DeleteLabel: "계정 및 데이터 삭제 요청 방법:",
        s6DeleteBeforeEmail: " 서비스 내 계정 설정(회원탈퇴) 메뉴를 통해 직접 삭제하거나, 개인정보 보호책임자 이메일(",
        s6DeleteAfterEmail: ")로 계정 이메일 주소와 함께 삭제를 요청하시면 본인 확인 후 지체 없이(최대 영업일 기준 7일 이내) 모든 계정 정보와 저장 데이터를 영구 삭제합니다.",
        s6ChildLabel: "만 14세 미만 아동의 개인정보:",
        s6ChildBody: " 회사는 원칙적으로 만 14세 미만 아동의 회원가입 및 개인정보 수집을 제한하고 있으며, 만 14세 미만 아동의 정보가 수집된 사실을 인지한 경우 지체 없이 파기합니다.",
        s7Title: "7. 개인정보 자동 수집 장치(쿠키 등)의 설치·운영 및 거부",
        s7Body:
          "회사는 이용자의 로그인 상태 유지 및 편리한 서비스 이용을 위해 쿠키(Cookie) 및 브라우저 저장소를 사용할 수 있습니다. 이용자는 웹 브라우저의 설정 메뉴에서 쿠키 저장을 거부하거나 삭제할 수 있으며, 다만 이 경우 로그인 유지 등 일부 기능 이용이 제한될 수 있습니다.",
        s8Title: "8. 개인정보의 안전성 확보 조치",
        s8Items: [
          "전송 구간 암호화(HTTPS/TLS) 및 주요 인증 정보 암호화 저장",
          "개인정보 처리 시스템 접근 권한 최소화 및 보안 점검 실시",
          "외부 침입 및 무단 접근을 차단하기 위한 보안 대책 운영",
        ],
        s9Title: "9. 개인정보 보호책임자 및 문의처",
        s9Officer: "성명: KETSIRI IRATDA (대표)",
        s9Company: "상호: 와이제이스튜디오 (YJ Studio)",
        s9Email: "이메일: contact@yjstudio.app",
        s10Title: "10. 권익침해 구제방법",
        s10Body:
          "이용자는 개인정보 침해로 인한 피해구제나 상담이 필요한 경우 아래 대한민국 정부·공공 기관에 분쟁조정이나 상담을 신청하실 수 있습니다.",
        s10Items: [
          "개인정보분쟁조정위원회: (국번없이) 1833-6972 (www.kopico.go.kr)",
          "개인정보침해신고센터 (한국인터넷진흥원): (국번없이) 118 (privacy.kisa.or.kr)",
          "대검찰청 사이버수사과: (국번없이) 1301 (www.spo.go.kr)",
          "경찰청 사이버수사국: (국번없이) 182 (ecrm.police.go.kr)",
        ],
        s11Title: "11. 개인정보처리방침의 변경",
        s11Body:
          "본 개인정보처리방침은 관련 법령 및 서비스 정책 변경에 따라 수정될 수 있으며, 변경 사항이 있을 경우 시행일 최소 7일 전부터 홈페이지 또는 서비스 내 공지를 통해 안내합니다.",
      },
    },
  },
  en: {
    nav: {
      about: "About",
      products: "Products & Universe",
      contact: "Contact",
      menuAria: "Menu",
    },
    hero: {
      badge: "Life-Centric Software Studio",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "A place to organize your day and share your thoughts. We build web and mobile digital services that make everyday life simpler and more fulfilling.",
      primaryCta: "View Product Lineup",
      secondaryCta: "Contact Us",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "Small, Fast, and Deeply Crafted High-Tech Studio",
      body: "YJ Studio operates as an AI-leveraged full-stack studio, moving seamlessly from ideation to launch and operation with zero friction. We rapidly validate and ship mobile ecosystems and everyday utility apps people genuinely love.",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "Product Lineup",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "TalkSecretary - AI Memo",
          desc: "AI Memory Assistant — Drop in text, screenshots, or voice memos, and AI organizes everything automatically.",
          quickLinks: {
            terms: "Terms",
            privacy: "Privacy Policy",
            guide: "How to Use",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "Teacup Tarot",
          desc: "Digital Tarot & Fortune — A digital tarot and fortune service offering daily comfort and inspiration.",
        },
        dream: {
          tag: "Dream",
          name: "DreamSoban",
          desc: "Dream Interpretation Platform — An intuitive platform that helps you uncover the meaning behind your dreams.",
        },
        bamboo: {
          tag: "Community",
          name: "Bamboo Forest",
          desc: "Anonymous Venting Space — A safe, anonymous space to share honest feelings and find comfort.",
        },
      },
    },
    contact: {
      title: "Have a Project We Can Build Together?",
      subtitle: "We welcome partnerships, collaborations, and service inquiries.",
      form: {
        namePlaceholder: "Your Name / Company",
        emailPlaceholder: "Email Address for Reply",
        messagePlaceholder: "Your Message",
        submit: "Send Inquiry",
        directEmailPrefix: "Direct email:",
        doneTitle: "Your inquiry has been received.",
        doneBody: "We will review your message and reply to the email address you provided.",
        newMessage: "Send Another Inquiry",
        errorGeneric: "Please check your input and try again.",
        copyEmail: "Copy Email",
        copied: "Copied!",
        openMailApp: "Send Email",
        emailHelper: "Feel free to reach out at the email address below. We'll get back to you promptly.",
      },
    },
    footer: {
      companyLabel: "Company: ",
      companyValue: "YJ Studio",
      ceoLabel: "CEO: ",
      businessLabel: "Industry: ",
      businessValue: "IT Software Development & Web Services",
      emailLabel: "Email: ",
      privacyLink: "Privacy Policy",
      termsLink: "Terms of Service",
    },
    legal: {
      effectiveDate: "Effective Date: November 8, 2026",
      termsTitle: "Terms of Service",
      privacyTitle: "Privacy Policy",
      termsSections: [
        {
          title: "Article 1 (Purpose)",
          body: 'These Terms govern the conditions and procedures for using the web and mobile services ("Services") provided by YJ Studio ("Company"), as well as the rights and obligations of the Company and users.',
        },
        {
          title: "Article 2 (Effectiveness & Amendments)",
          body: "These Terms take effect upon posting within the Service. The Company may amend these Terms within the bounds of applicable laws and will provide notice at least 7 days prior to any changes taking effect.",
        },
        {
          title: "Article 3 (Provision of Services)",
          body: "The Company provides digital services including productivity utilities, content platforms, edtech, and spatial data tools. Certain features or services may be offered on a paid basis.",
        },
        {
          title: "Article 4 (Paid Services & Refunds)",
          body: "Pricing and payment terms for paid services are displayed on each service screen. Refunds are handled in accordance with the Act on the Consumer Protection in Electronic Commerce of the Republic of Korea and applicable app marketplace policies.",
        },
        {
          title: "Article 5 (User Obligations)",
          body: "Users must not misappropriate another person's information, disrupt Service operations, or engage in any unlawful activities.",
        },
        {
          title: "Article 6 (Limitation of Liability)",
          body: "The Company is not liable for damages caused by force majeure or user negligence. Entertainment content such as fortune-telling and tarot readings is provided for reference purposes only.",
        },
        {
          title: "Article 7 (Dispute Resolution)",
          body: "These Terms are governed by the laws of the Republic of Korea, and any disputes shall be submitted to the competent court under the Civil Procedure Act.",
        },
      ],
      termsContact: "Contact: contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "TalkSecretary - AI Memo",
      introPrefix: "Welcome to the user guide, Terms of Service, and Privacy Policy for ",
      introStrong: "TalkSecretary - AI Memo",
      introSuffix: " — your AI memory assistant that organizes whatever you drop in.",
      navAria: "TalkSecretary quick navigation",
      tabs: {
        guide: "How to Use",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
      },
      guideHeading: "How to Use",
      guideIntro:
        "TalkSecretary is an AI memory assistant designed to capture fleeting thoughts, screenshots, voice notes, and tasks effortlessly—without complex folders or manual sorting.",
      guideSteps: [
        {
          title: "Step 1 — Drop It In Naturally:",
          body: "Submit tasks, sudden ideas, notes, screenshots/images, or voice recordings into TalkSecretary just as naturally as you think of them.",
        },
        {
          title: "Step 2 — Automatic AI Organization:",
          body: "TalkSecretary analyzes your text, images, and voice memos, summarizes the key points, and neatly categorizes them for you.",
        },
        {
          title: "Step 3 — Retrieve Anytime:",
          body: "Review everything at a glance in your inbox, check off completed items, and stay on top of your day effortlessly.",
        },
      ],
      termsHeading: "Terms of Service",
      termsArticles: [
        {
          title: "Article 1 (Purpose)",
          body: 'These Terms govern the conditions of use, procedures, rights, obligations, and responsibilities between YJ Studio ("Company") and users regarding the TalkSecretary service ("Service").',
        },
        {
          title: "Article 2 (Effectiveness & Amendments)",
          body: "These Terms take effect upon posting within the Service or on our website. The Company may amend these Terms in compliance with applicable laws and will provide notice at least 7 days prior to the effective date (or 30 days in advance for changes that negatively affect your rights or obligations).",
        },
        {
          title: "Article 3 (Accounts & Third-Party Sign-In)",
          body: "Users may register and sign in using supported authentication methods such as Google Sign-In. When linking a third-party account, the respective provider's terms also apply. Users may disconnect their account or delete their membership at any time via in-app settings or by emailing us.",
        },
        {
          title: "Article 4 (Service Scope, Changes & Maintenance)",
          body: "The Company provides productivity utility features that allow users to store, summarize, and organize notes, schedules, and ideas with AI. The Company may modify or temporarily suspend all or part of the Service for system maintenance or technical improvements, with prior notice whenever practicable.",
        },
        {
          title: "Article 5 (Paid Features, Subscriptions & Refunds)",
          body: "Certain premium features may be offered as paid purchases or recurring subscriptions, with pricing, billing cycles, and any free trial terms clearly shown at checkout. Subscriptions automatically renew unless canceled via your app marketplace (e.g., Google Play) or account settings at least 24 hours before the next billing date. Refunds are processed under the Korean Electronic Commerce Consumer Protection Act and applicable app store policies (such as Google Play's refund policy).",
        },
        {
          title: "Article 6 (User Content Rights & AI Processing)",
          body: "You retain full ownership and rights to all notes, schedules, and content you submit to the Service. The Company processes your content solely to deliver core features such as AI summarization, categorization, and cross-device syncing, and never publishes, sells, or shares your private notes without your permission.",
        },
        {
          title: "Article 7 (User Obligations & Restrictions)",
          body: "Users must not impersonate others, attack or disrupt Service infrastructure, cause abnormal load using unauthorized automated tools, or store unlawful or harmful content. In the event of a violation, the Company may restrict access or terminate the account upon notice (or immediately in urgent cases).",
        },
        {
          title: "Article 8 (Intellectual Property)",
          body: "Excluding user-submitted content, all intellectual property rights in the Service—including software, design, trademarks, and logos—belong to the Company and may not be copied, distributed, or modified without prior written consent.",
        },
        {
          title: "Article 9 (AI Limitations & Disclaimers)",
          body: "AI-generated summaries, classifications, and suggestions are provided strictly for convenience and reference, and their accuracy or completeness is not guaranteed. Users should not rely solely on AI outputs for critical legal, medical, or financial decisions. The Company is not liable for damages caused by force majeure or user fault.",
        },
        {
          title: "Article 10 (Governing Law, Disputes & Contact)",
          body: "These Terms are governed by the laws of the Republic of Korea, and any disputes shall be submitted to the competent court under the Civil Procedure Act. For inquiries regarding these Terms or the Service, please contact contact@yjstudio.app.",
        },
      ],
      privacyHeading: "Privacy Policy",
      privacyServiceName: "TalkSecretary - AI Memo (TalkSecretary)",
    },
    privacy: {
      generalServiceName: "web and mobile services provided by YJ Studio",
      introPrefix: "YJ Studio (\"Company\") complies with the Personal Information Protection Act (PIPA) and applicable data protection regulations, and is committed to protecting the personal data of users of ",
      introSuffix: ".",
      sections: {
        s1Title: "1. Personal Data Collected & Collection Methods",
        s1AccountLabel: "Account Registration & Service Use (Required):",
        s1AccountBody: " Email address, account identifier (when signing in via social/Google login), service usage logs, access logs, and device details (OS version, browser type).",
        s1TokbiseoLabel: "When Using TalkSecretary Features:",
        s1TokbiseoBody: " Notes, schedules, task text, uploaded screenshots/images, and voice recordings (audio) entered or uploaded directly by the user for AI organization and storage.",
        s1PaymentLabel: "Paid Service Transactions:",
        s1PaymentBody: " Payment confirmation records and subscription status (sensitive card details are processed directly by payment gateways or app stores and are never stored by the Company).",
        s1ContactLabel: "Customer Inquiries:",
        s1ContactBody: " Name, email address, and inquiry details.",
        s2Title: "2. Purpose of Collection and Use",
        s2Items: [
          "User identification, session authentication, and personalized service delivery",
          "Billing, payment processing, and refund handling for paid features",
          "Customer support, important notices, fraud prevention, and security enhancement",
        ],
        s2AiItem: "AI-powered summarization, transcription, categorization, and cross-device synchronization of user notes, images, and voice recordings",
        s3Title: "3. Retention and Use Period",
        s3Body:
          "Personal data is promptly deleted once the purpose of collection is fulfilled or upon user account deletion. Where retention is required by applicable law, data is securely preserved for the following periods:",
        s3Items: [
          "Records of contracts, subscription cancellations, payments, and supply of goods/services: 5 years (Electronic Commerce Act)",
          "Records of consumer complaints or dispute resolution: 3 years (Electronic Commerce Act)",
          "Service access and login logs: 3 months (Protection of Communications Secrets Act)",
        ],
        s4Title: "4. Destruction Procedures and Methods",
        s4ProcedureLabel: "Destruction Procedure:",
        s4ProcedureBody: " Data whose retention period has expired or purpose has been achieved is segregated and permanently deleted promptly in accordance with internal policy and law.",
        s4MethodLabel: "Destruction Method:",
        s4MethodBody: " Electronic files are permanently erased using technical methods that prevent recovery; physical documents are shredded or incinerated.",
        s5Title: "5. Third-Party Sharing, Processing Entrustment & International Transfers",
        s5Body:
          "The Company does not sell or share personal data with third parties except with user consent or as required by law. To operate the Service reliably, essential processing may be entrusted to trusted partners or international cloud/AI infrastructure:",
        s5CloudLabel: "Cloud Infrastructure & Database Hosting:",
        s5CloudBody: " Secure encrypted data storage and authentication management.",
        s5AiLabel: "AI Content Processing (Text, Images & Audio, Including International Transfer):",
        s5AiBody:
          " User-submitted notes, uploaded screenshots/images, and voice recordings may be transmitted via encrypted channels to global AI model providers (including servers in the United States) solely for automated transcription, summarization, and categorization, and are managed so they are not used for external model training or permanent retention.",
        s5MailLabel: "Email Delivery & Payment Processing:",
        s5MailBody: " Handling contact inquiries and payment/refund transactions.",
        s6Title: "6. User Rights & Account / Data Deletion Requests",
        s6Body: "Users may request access, correction, deletion, or suspension of processing of their personal data at any time.",
        s6DeleteLabel: "How to Request Account & Data Deletion:",
        s6DeleteBeforeEmail: " You can delete your account directly through the in-app account settings (Delete Account), or email our Data Protection Officer at ",
        s6DeleteAfterEmail: " with your registered email address. Upon identity verification, all account information and stored data will be permanently deleted promptly (within 7 business days).",
        s6ChildLabel: "Children Under 14:",
        s6ChildBody: " The Company does not knowingly allow registration or collect personal data from children under 14. If such data is discovered, it is deleted immediately.",
        s7Title: "7. Cookies & Automatic Data Collection",
        s7Body:
          "We may use cookies and browser storage to maintain login sessions and improve usability. You can refuse or delete cookies through your browser settings, though some features such as staying signed in may be limited.",
        s8Title: "8. Data Security Measures",
        s8Items: [
          "Encrypted data transmission (HTTPS/TLS) and encrypted storage of authentication credentials",
          "Strict least-privilege access controls and regular security reviews",
          "Technical safeguards against unauthorized access and external intrusion",
        ],
        s9Title: "9. Data Protection Officer & Contact",
        s9Officer: "Name: KETSIRI IRATDA (CEO)",
        s9Company: "Company: YJ Studio",
        s9Email: "Email: contact@yjstudio.app",
        s10Title: "10. Remedies for Infringement of Rights",
        s10Body:
          "If you have any privacy concerns or believe your rights have been infringed, please contact us first or reach out to the data protection authority in your country or region:",
        s10Items: [
          "YJ Studio Data Protection Officer: contact@yjstudio.app (prompt review and resolution)",
          "Local Data Protection Authority: You may file a complaint or seek guidance from the relevant privacy regulator in your jurisdiction.",
        ],
        s11Title: "11. Changes to This Privacy Policy",
        s11Body:
          "This Privacy Policy may be updated to reflect changes in laws or our Services. Any material changes will be announced on our website or within the Service at least 7 days before taking effect.",
      },
    },
  },
  ja: {
    nav: {
      about: "About",
      products: "Products & Universe",
      contact: "Contact",
      menuAria: "メニュー",
    },
    hero: {
      badge: "Life-Centric Software Studio",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "日々の暮らしを整え、想いを分かち合う場所。ウェブとモバイルをつなぎ、毎日をより便利で豊かにするデジタルサービスをお届けします。",
      primaryCta: "プロダクト一覧を見る",
      secondaryCta: "お問い合わせ",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "小さく、速く、深く届けるハイテクスタジオ",
      body: "YJ StudioはAIを最大限に活用したフルスタック体制で、企画から開発・リリース・運用まで無駄のないスピードで駆け抜けます。モバイルエコシステムから日常に寄り添う実用アプリまで、素早く検証し形にします。",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "プロダクトラインアップ",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "トーク秘書 - AIメモ",
          desc: "AI記憶アシスタント — テキストやスクリーンショット、音声まで投げるだけでAIが自動で整理します。",
          quickLinks: {
            terms: "利用規約",
            privacy: "プライバシーポリシー",
            guide: "ご利用方法",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "ティーカップタロット",
          desc: "Digital Tarot & Fortune — 日常にそっと癒やしとひらめきを届けるデジタルタロット・占いサービス。",
        },
        dream: {
          tag: "Dream",
          name: "ユメソバン（夢占い）",
          desc: "Dream Interpretation Platform — 夢が伝えるメッセージを直感的に紐解く夢占いプラットフォーム。",
        },
        bamboo: {
          tag: "Community",
          name: "竹林の本音",
          desc: "Anonymous Venting Space — 素直な気持ちを匿名で打ち明け、心を軽くできる安心のコミュニティ。",
        },
      },
    },
    contact: {
      title: "一緒に新しいプロジェクトを始めませんか？",
      subtitle: "業務提携、コラボレーション、サービスに関するお問い合わせを歓迎します。",
      form: {
        namePlaceholder: "お名前 / 企業名",
        emailPlaceholder: "返信先メールアドレス",
        messagePlaceholder: "お問い合わせ内容",
        submit: "お問い合わせを送信",
        directEmailPrefix: "直接メール：",
        doneTitle: "お問い合わせを受け付けました。",
        doneBody: "内容を確認のうえ、ご入力いただいたメールアドレス宛にご返信いたします。",
        newMessage: "新しいお問い合わせを作成",
        errorGeneric: "入力内容をご確認のうえ、もう一度お試しください。",
        copyEmail: "アドレスをコピー",
        copied: "コピーしました",
        openMailApp: "メールを送る",
        emailHelper: "以下のメールアドレス宛にお気軽にご連絡ください。確認のうえ速やかにご返信いたします。",
      },
    },
    footer: {
      companyLabel: "屋号：",
      companyValue: "YJ Studio（ワイジェイスタジオ）",
      ceoLabel: "代表：",
      businessLabel: "事業内容：",
      businessValue: "ITソフトウェア開発・ウェブサービス運営",
      emailLabel: "メール：",
      privacyLink: "プライバシーポリシー",
      termsLink: "利用規約",
    },
    legal: {
      effectiveDate: "施行日：2026年11月8日",
      termsTitle: "利用規約",
      privacyTitle: "プライバシーポリシー",
      termsSections: [
        {
          title: "第1条（目的）",
          body: "本規約は、YJ Studio（以下「当社」）が提供するウェブ・アプリサービス（以下「本サービス」）の利用条件および手続き、当社と利用者の権利・義務を定めることを目的とします。",
        },
        {
          title: "第2条（規約の効力および変更）",
          body: "本規約は本サービス画面に掲示することにより効力を生じます。当社は関連法令に違反しない範囲で本規約を改定できるものとし、改定時は施行日の7日前までに告知します。",
        },
        {
          title: "第3条（サービスの提供）",
          body: "当社は、生産性ユーティリティ、コンテンツプラットフォーム、エドテック、空間情報分析などのデジタルサービスを提供しており、一部のサービスまたは機能は有料で提供される場合があります。",
        },
        {
          title: "第4条（有料サービスおよび返金）",
          body: "有料サービスの料金および決済条件は各サービス画面に表示されます。返金については、大韓民国「電子商取引等における消費者保護に関する法律」および各アプリストアのポリシーに従います。",
        },
        {
          title: "第5条（利用者の義務）",
          body: "利用者は、他人の情報の不正使用、本サービスの運営妨害、その他法令に違反する行為を行ってはなりません。",
        },
        {
          title: "第6条（免責事項）",
          body: "当社は、天災地変等の不可抗力または利用者の帰責事由による損害について責任を負いません。占い・タロット等のエンターテインメントコンテンツは参考情報として提供されるものです。",
        },
        {
          title: "第7条（準拠法および紛争解決）",
          body: "本規約の解釈および適用にあたっては、大韓民国法を準拠法とします。本サービスに関連して紛争が生じた場合は、法令の定める管轄裁判所にて解決を図るものとします。",
        },
      ],
      termsContact: "お問い合わせ：contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "トーク秘書 - AIメモ",
      introPrefix: "思いついたことを投げるだけでAIが自動で整理する記憶アシスタント、",
      introStrong: "トーク秘書 - AIメモ",
      introSuffix: "のご利用方法・利用規約・プライバシーポリシーをご案内します。",
      navAria: "トーク秘書ページ内メニュー",
      tabs: {
        guide: "ご利用方法",
        terms: "利用規約",
        privacy: "プライバシーポリシー",
      },
      guideHeading: "ご利用方法",
      guideIntro:
        "トーク秘書（トーク秘書 - AIメモ）は、複雑なフォルダ分けや整理の手間なく、アイデア・メモ・スクリーンショット・音声を手軽に記録できるAI記憶アシスタントです。",
      guideSteps: [
        {
          title: "ステップ1 — 気軽に投げ込む：",
          body: "やるべきこと、アイデア、メモ、スクリーンショットや画像、音声録音など、覚えておきたい内容を普段通りに入力・アップロードします。",
        },
        {
          title: "ステップ2 — AIが自動で整理：",
          body: "トーク秘書がテキスト・画像・音声を解析し、要点をわかりやすく要約してカテゴリー別に自動で整理します。",
        },
        {
          title: "ステップ3 — いつでも見返す：",
          body: "受信トレイ（インボックス）から整理された記録をひと目で確認し、完了した項目をチェックしながら毎日をスマートに管理できます。",
        },
      ],
      termsHeading: "利用規約",
      termsArticles: [
        {
          title: "第1条（目的）",
          body: "本規約は、YJ Studio（以下「当社」）が提供する「トーク秘書 - AIメモ」（以下「トーク秘書」または「本サービス」）の利用条件および手続き、当社と利用者の権利・義務および責任事項を定めることを目的とします。",
        },
        {
          title: "第2条（規約の効力および改定）",
          body: "本規約は、本サービス画面またはウェブサイトに掲示することにより効力を生じます。当社は関連法令に違反しない範囲で本規約を改定できるものとし、重要な変更がある場合は施行日の少なくとも7日前（利用者に不利益となる場合は30日前）までに告知します。",
        },
        {
          title: "第3条（アカウントおよび外部ログイン連携）",
          body: "利用者は、Googleアカウント等の当社が対応する認証方式を通じて本サービスに登録・利用することができます。外部アカウントを連携する場合、当該プラットフォーム（Google等）の規約も適用されます。利用者はいつでもアプリ内設定またはメールでのご連絡により、連携解除および退会を行うことができます。",
        },
        {
          title: "第4条（サービス内容および変更・中断）",
          body: "当社は、利用者が入力したメモ・予定・アイデア等をAIによって要約・整理・保管できる生産性ユーティリティ機能を提供します。当社は、システム保守や技術改善等の運営上の必要に応じ、事前告知のうえ本サービスの全部または一部を変更・一時中断できるものとします（緊急時は事後告知）。",
        },
        {
          title: "第5条（有料機能、定期購読および返金）",
          body: "一部の追加機能は有料または定期購読（サブスクリプション）形式で提供される場合があり、料金・課金周期・無料トライアル条件は購入画面に明示されます。定期購読は、次回課金日の少なくとも24時間前までにアプリストア（Google Play等）またはアカウント設定から解約しない限り自動更新されます。返金は韓国の電子商取引消費者保護法およびGoogle Play等各アプリストアの返金ポリシーに従います。",
        },
        {
          title: "第6条（利用者コンテンツの権利およびAI処理）",
          body: "利用者が本サービスに入力したメモ・予定等すべてのコンテンツの権利は利用者ご本人に帰属します。当社は、AIによる要約・分類および端末間同期など本サービス提供の目的に限って当該コンテンツを処理し、利用者のプライベートなメモを無断で公開または商業利用することはありません。",
        },
        {
          title: "第7条（利用者の義務および利用制限）",
          body: "利用者は、他人へのなりすまし、システムへの不正攻撃、自動化ツールを用いた異常な負荷の発生、法令に違反する違法・有害コンテンツの保存等を行ってはなりません。違反が確認された場合、当社は事前通知のうえ（緊急時は直ちに）利用制限またはアカウント停止を行うことができます。",
        },
        {
          title: "第8条（知的財産権）",
          body: "利用者が入力したコンテンツを除き、本サービスのソフトウェア、デザイン、商標、ロゴ等に関する一切の知的財産権は当社に帰属し、当社の事前の書面による承諾なく複製・配布・改変することはできません。",
        },
        {
          title: "第9条（AI出力の限界および免責事項）",
          body: "AIが生成する要約・分類・予定提案は利便性向上のための参考情報であり、その正確性や完全性を100%保証するものではありません。利用者は法律・医療・財務等の重要な判断をAI出力のみに依存してはならず、当社は不可抗力や利用者の責めに帰すべき事由による損害について責任を負いません。",
        },
        {
          title: "第10条（準拠法、紛争解決およびお問い合わせ）",
          body: "本規約の解釈および適用にあたっては、大韓民国法を準拠法とします。本サービスに関連して紛争が生じた場合は、法令の定める管轄裁判所にて誠実に解決を図るものとします。本規約や本サービスに関するお問い合わせは contact@yjstudio.app までご連絡ください。",
        },
      ],
      privacyHeading: "プライバシーポリシー",
      privacyServiceName: "トーク秘書 - AIメモ（トーク秘書）",
    },
    privacy: {
      generalServiceName: "YJ Studioが提供するウェブ・アプリサービス",
      introPrefix: "YJ Studio（以下「当社」）は、大韓民国「個人情報保護法」および関連法令を遵守し、",
      introSuffix: "をご利用いただく皆様の個人情報を大切に保護しています。",
      sections: {
        s1Title: "1. 収集する個人情報の項目および収集方法",
        s1AccountLabel: "会員登録およびサービス利用時（必須）：",
        s1AccountBody: " メールアドレス、アカウント識別子（ソーシャル／Googleログイン連携時）、サービス利用履歴、アクセスログ、端末情報（OSバージョン、ブラウザ情報）",
        s1TokbiseoLabel: "トーク秘書（トーク秘書 - AIメモ）機能のご利用時：",
        s1TokbiseoBody: " AIによる整理・保管のために利用者が直接入力・アップロードしたメモ、予定、タスクのテキストデータ、スクリーンショットや画像、および音声録音（オーディオ）データ",
        s1PaymentLabel: "有料サービスのご決済時：",
        s1PaymentBody: " 決済承認履歴およびサブスクリプション状態（クレジットカード番号等の決済情報は決済代行会社およびアプリストアが直接処理し、当社では保持しません）",
        s1ContactLabel: "お問い合わせ時：",
        s1ContactBody: " お名前、返信先メールアドレス、お問い合わせ内容",
        s2Title: "2. 個人情報の収集および利用目的",
        s2Items: [
          "ご本人確認、ログイン状態の維持、および最適化されたサービスの提供",
          "有料サービスの料金精算、決済および返金処理",
          "お問い合わせへの対応、重要なお知らせの通知、不正利用防止およびセキュリティ強化",
        ],
        s2AiItem: "入力・アップロードされたメモ、予定、画像、音声録音のAI自動要約・文字起こし・分類および端末間での同期保管",
        s3Title: "3. 個人情報の保有および利用期間",
        s3Body:
          "当社は、収集・利用目的が達成された場合、または利用者から退会（アカウント削除）の要請があった場合、遅滞なく当該情報を破棄します。ただし、関連法令により保存が義務付けられている場合は、以下の期間安全に保管します。",
        s3Items: [
          "契約・キャンセル・解約、代金決済および商品・サービスの提供に関する記録：5年（韓国電子商取引法）",
          "消費者の不満または紛争処理に関する記録：3年（韓国電子商取引法）",
          "サービスの訪問およびアクセスログ記録：3ヶ月（韓国通信秘密保護法）",
        ],
        s4Title: "4. 個人情報の破棄手続きおよび方法",
        s4ProcedureLabel: "破棄手続き：",
        s4ProcedureBody: " 保有期間が経過または処理目的が達成された個人情報は、社内方針および関連法令に従い分別保管のうえ、遅滞なく破棄します。",
        s4MethodLabel: "破棄方法：",
        s4MethodBody: " 電子的ファイル形式で保存された情報は、記録を復元できない技術的方法を用いて永久削除し、紙文書はシュレッダー裁断または焼却により破棄します。",
        s5Title: "5. 個人情報の第三者提供および処理委託・国外移転",
        s5Body:
          "当社は、利用者の同意がある場合または法令に基づく場合を除き、個人情報を第三者に提供しません。ただし、円滑なサービス運営のため、以下の通り業務を委託し海外のクラウド・AIインフラを利用する場合があります。",
        s5CloudLabel: "クラウドインフラおよびデータベースホスティング：",
        s5CloudBody: " 暗号化された安全なデータ保管およびログイン認証処理",
        s5AiLabel: "AIコンテンツ処理の委託（テキスト・画像・音声、国外移転を含む）：",
        s5AiBody:
          " 入力・アップロードされたメモ、スクリーンショットや画像、音声録音データの自動文字起こし・要約・分類を行うため、グローバルAIモデル提供事業者（米国等の海外サーバーを含む）へ暗号化通信により処理を委託する場合があります。当該データは処理目的以外の学習や恒久的な保存には使用されないよう管理します。",
        s5MailLabel: "メール配信および決済代行：",
        s5MailBody: " お問い合わせメールの送信および有料決済・返金処理",
        s6Title: "6. 利用者の権利およびアカウント・データの削除方法",
        s6Body: "利用者はいつでもご自身の個人情報の閲覧、訂正、削除、処理停止を請求することができます。",
        s6DeleteLabel: "アカウントおよびデータの削除方法：",
        s6DeleteBeforeEmail: " アプリ内のアカウント設定（退会）メニューから直接削除するか、個人情報保護責任者宛メール（",
        s6DeleteAfterEmail: "）へご登録メールアドレスを添えて削除をご請求ください。ご本人確認後、遅滞なく（最大7営業日以内）すべてのアカウント情報および保存データを永久削除いたします。",
        s6ChildLabel: "14歳未満のお子様の個人情報：",
        s6ChildBody: " 当社は原則として14歳未満の方の会員登録および個人情報収集を制限しており、該当情報が収集されたことが判明した場合は直ちに破棄します。",
        s7Title: "7. Cookie（クッキー）等の利用について",
        s7Body:
          "当社は、ログイン状態の維持および利便性向上のためCookieやブラウザストレージを使用する場合があります。利用者はブラウザ設定からCookieの保存を拒否または削除できますが、その場合ログイン維持等の機能が制限されることがあります。",
        s8Title: "8. 個人情報の安全管理措置",
        s8Items: [
          "通信経路の暗号化（HTTPS/TLS）および認証情報の暗号化保存",
          "個人情報処理システムへのアクセス権限の最小化と定期的なセキュリティ点検",
          "不正アクセスや外部からの侵入を遮断する技術的保護対策の運用",
        ],
        s9Title: "9. 個人情報保護責任者およびお問い合わせ窓口",
        s9Officer: "責任者：KETSIRI IRATDA（代表）",
        s9Company: "屋号：YJ Studio（ワイジェイスタジオ）",
        s9Email: "メール：contact@yjstudio.app",
        s10Title: "10. 権利侵害に関するご相談・救済窓口",
        s10Body:
          "個人情報の取扱いに関するご相談や権利侵害のお申し出がある場合は、まず当社窓口までご連絡いただくか、お住まいの国・地域の監督機関へご相談いただけます。",
        s10Items: [
          "YJ Studio 個人情報保護窓口：contact@yjstudio.app（迅速に確認・対応いたします）",
          "日本の監督機関：個人情報保護委員会（PPC）個人情報保護法相談ダイヤル 03-6457-9849 (www.ppc.go.jp)",
        ],
        s11Title: "11. プライバシーポリシーの変更",
        s11Body:
          "本プライバシーポリシーは法令やサービス内容の変更に伴い改定されることがあります。重要な変更がある場合は、施行日の少なくとも7日前までにウェブサイトまたはサービス内にて告知いたします。",
      },
    },
  },
};
