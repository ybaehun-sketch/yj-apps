import type { TranslationBundle } from "@/lib/translations";

export const extraTranslations: Record<"zh-TW" | "fr" | "de" | "es", TranslationBundle> = {
  "zh-TW": {
    nav: {
      about: "關於我們",
      products: "產品陣容",
      contact: "聯絡我們",
      menuAria: "選單",
    },
    hero: {
      badge: "以生活為核心的軟體工作室",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "一個整理日常思緒、分享生活靈感的地方。我們打造橫跨網頁與行動裝置的數位服務，讓每一天都更便利、更充實。",
      primaryCta: "查看產品陣容",
      secondaryCta: "聯絡我們",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "精巧敏捷、深耕細節的高科技軟體工作室",
      body: "YJ Studio 以 AI 驅動的全端開發體系運作，從企劃、開發到上線營運一氣呵成。我們快速驗證並實現貼近日常生活的行動應用與實用數位工具。",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "產品陣容",
      showMore: "查看更多",
      showLess: "收起",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "對話秘書 - AI 筆記",
          desc: "AI 智慧秘書 — 隨手丟進文字、螢幕截圖或語音錄音，AI 就會自動為您整理歸檔。",
          quickLinks: {
            terms: "服務條款",
            privacy: "隱私權政策",
            guide: "使用方式",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "茶杯塔羅",
          desc: "Digital Tarot & Fortune — 為忙碌日常帶來溫柔慰藉與靈感的數位塔羅占卜服務。",
        },
        dream: {
          tag: "Dream",
          name: "夢小盤（解夢平台）",
          desc: "Dream Interpretation Platform — 以直覺方式解析夢境背後意義的解夢服務。",
        },
        bamboo: {
          tag: "Community",
          name: "竹林心事",
          desc: "Anonymous Venting Space — 讓您安心匿名傾訴真實心聲、獲得療癒的溫暖空間。",
        },
      },
    },
    contact: {
      title: "有想一起打造的專案嗎？",
      subtitle: "歡迎洽談商務合作、跨界聯名或服務諮詢。",
      form: {
        namePlaceholder: "姓名 / 公司名稱",
        emailPlaceholder: "回覆用電子郵件",
        messagePlaceholder: "諮詢內容",
        submit: "送出諮詢",
        directEmailPrefix: "聯絡信箱：",
        doneTitle: "已收到您的訊息。",
        doneBody: "我們確認後將儘快回覆至您留下的電子郵件。",
        newMessage: "撰寫新訊息",
        errorGeneric: "請確認輸入內容後再試一次。",
        copyEmail: "複製信箱",
        copied: "已複製！",
        openMailApp: "開啟郵件寄信",
        emailHelper: "歡迎透過下方電子郵件與我們聯繫，我們將於工作日內儘快回覆您。",
      },
    },
    footer: {
      companyLabel: "公司名稱：",
      companyValue: "YJ Studio（和以斯工作室）",
      ceoLabel: "負責人：",
      businessLabel: "營業項目：",
      businessValue: "IT 軟體開發與網頁服務",
      emailLabel: "電子郵件：",
      privacyLink: "隱私權政策",
      termsLink: "服務條款",
    },
    legal: {
      effectiveDate: "生效日期：2026 年 11 月 8 日",
      termsTitle: "服務條款",
      privacyTitle: "隱私權政策",
      termsSections: [
        {
          title: "第 1 條（目的）",
          body: "本條款旨在規範使用 YJ Studio（以下簡稱「本公司」）所提供之網頁及行動應用程式服務（以下簡稱「本服務」）的使用條件、程序，以及本公司與使用者之間的權利與義務。",
        },
        {
          title: "第 2 條（條款效力與修訂）",
          body: "本條款於公布於本服務畫面時生效。本公司得於不違反相關法令之範圍內修訂本條款，並於生效日前至少 7 日公告通知。",
        },
        {
          title: "第 3 條（服務提供）",
          body: "本公司提供生產力工具、內容平台、教育科技與空間資訊分析等數位服務，部分進階服務可能採付費方式提供。",
        },
        {
          title: "第 4 條（付費服務與退款）",
          body: "付費服務之價格與付款條件將顯示於各服務畫面。退款事宜依大韓民國《電子商務消費者保護法》及各應用程式商店政策辦理。",
        },
        {
          title: "第 5 條（使用者義務）",
          body: "使用者不得冒用他人資訊、干擾本服務正常運作或從事任何違反法令之行為。",
        },
        {
          title: "第 6 條（責任限制）",
          body: "因天災等不可抗力或可歸責於使用者之事由所致之損害，本公司不負賠償責任。占卜、塔羅等娛樂性質內容僅供參考。",
        },
        {
          title: "第 7 條（準據法與爭議解決）",
          body: "本條款以大韓民國法律為準據法，若因本服務產生爭議，應依民事訴訟法規定之管轄法院審理。",
        },
      ],
      termsContact: "聯絡信箱：contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "對話秘書 - AI 筆記",
      introPrefix: "隨手輸入即可由 AI 自動整理歸檔的個人 AI 智慧秘書 — ",
      introStrong: "對話秘書 - AI 筆記",
      introSuffix: " 的使用方式、服務條款與隱私權政策說明。",
      navAria: "對話秘書文件快速導覽",
      tabs: {
        guide: "使用方式",
        terms: "服務條款",
        privacy: "隱私權政策",
      },
      guideHeading: "使用方式",
      guideIntro:
        "對話秘書（對話秘書 - AI 筆記）是一款不需繁瑣資料夾分類，就能隨時快速記下靈感、螢幕截圖、語音與待辦事項的 AI 智慧秘書。",
      guideSteps: [
        {
          title: "步驟 1 — 輕鬆丟入想法：",
          body: "將待辦事項、靈感、備忘錄、螢幕截圖或語音錄音，自由輸入或上傳到對話秘書中。",
        },
        {
          title: "步驟 2 — AI 自動整理：",
          body: "對話秘書會分析您輸入的文字、圖片與語音內容，自動摘要重點並依類別妥善歸檔。",
        },
        {
          title: "步驟 3 — 隨時輕鬆查看：",
          body: "在收件匣（Inbox）中一目了然地查看整理好的紀錄，勾選已完成項目，輕鬆管理每一天。",
        },
      ],
      termsHeading: "服務條款",
      termsArticles: [
        {
          title: "第 1 條（目的）",
          body: "本條款旨在規範 YJ Studio（以下簡稱「本公司」）所提供之「對話秘書 - AI 筆記」（以下簡稱「對話秘書」或「本服務」）的使用條件、程序，以及雙方之權利、義務與責任。",
        },
        {
          title: "第 2 條（條款效力與修訂）",
          body: "本條款於公布於本服務或官方網站時生效。本公司得於符合相關法令之範圍內修訂條款，重大變更將於生效前至少 7 日（若對使用者不利則為 30 日）公告通知。",
        },
        {
          title: "第 3 條（帳號與第三方登入連動）",
          body: "使用者可透過 Google 帳號等本公司支援之登入方式註冊並使用本服務。連動外部帳號時亦須遵守該平台（如 Google）之條款，使用者隨時可透過服務內設定或來信要求解除連動與刪除帳號。",
        },
        {
          title: "第 4 條（服務內容、變更與暫停）",
          body: "本公司提供運用 AI 摘要、分類與保存使用者備忘錄、行程及想法之生產力工具功能。因系統維護或技術升級需要，本公司得於事前通知後變更或暫時中斷全部或部分服務。",
        },
        {
          title: "第 5 條（付費服務、定期訂閱與退款）",
          body: "部分進階功能可能採付費或定期訂閱制，費用、計費週期及免費試用條件將清楚標示於結帳畫面。除非於下期扣款前至少 24 小時在應用程式商店（如 Google Play）或帳號設定中取消，否則訂閱將自動續約。退款依大韓民國電子商務消費者保護法及各應用程式商店政策辦理。",
        },
        {
          title: "第 6 條（使用者內容權利與 AI 處理）",
          body: "使用者輸入至本服務之所有備忘錄、行程等內容，其所有權均歸使用者本人所有。本公司僅於提供 AI 摘要、分類及跨裝置同步等服務必要範圍內處理該內容，絕不未經授權對外公開或作商業用途。",
        },
        {
          title: "第 7 條（使用者義務與使用限制）",
          body: "使用者不得冒用他人帳號、攻擊或干擾服務系統、利用自動化工具造成異常負載，或儲存違法有害內容。若有違反，本公司得於通知後（緊急情況得立即）限制使用或終止帳號。",
        },
        {
          title: "第 8 條（智慧財產權）",
          body: "除使用者輸入之內容外，本服務之軟體、設計、商標與標誌等一切智慧財產權均歸本公司所有，未經事前書面同意不得重製、散布、修改或進行衍生創作。",
        },
        {
          title: "第 9 條（AI 生成結果之限制與免責聲明）",
          body: "AI 所生成之摘要、分類與建議僅供便利參考，並不保證 100% 準確或完整。使用者不應單獨依賴 AI 結果進行法律、醫療或財務等重大決策。因不可抗力或使用者自身因素所致之損害，本公司不負賠償責任。",
        },
        {
          title: "第 10 條（準據法、爭議解決與聯絡方式）",
          body: "本條款以大韓民國法律為準據法，相關爭議應依民事訴訟法規定之管轄法院為專屬管轄法院。若有任何疑問，請來信至 contact@yjstudio.app。",
        },
      ],
      privacyHeading: "隱私權政策",
      privacyServiceName: "對話秘書 - AI 筆記（對話秘書）",
    },
    privacy: {
      generalServiceName: "YJ Studio 所提供之網頁與行動服務",
      introPrefix: "YJ Studio（以下簡稱「本公司」）遵守《個人資料保護法》及相關法令，致力於妥善保護 ",
      introSuffix: " 使用者的個人資料。",
      sections: {
        s1Title: "1. 蒐集之個人資料項目與蒐集方式",
        s1AccountLabel: "註冊與使用服務時（必填）：",
        s1AccountBody: " 電子郵件地址、帳號識別碼（使用社群／Google 登入時）、服務使用紀錄、存取日誌、裝置資訊（作業系統版本、瀏覽器資訊）。",
        s1TokbiseoLabel: "使用對話秘書（對話秘書 - AI 筆記）功能時：",
        s1TokbiseoBody: " 使用者為進行 AI 整理與保存而直接輸入或上傳的備忘錄、行程與待辦事項文字、螢幕截圖／圖片檔案及語音錄音（音訊）資料。",
        s1PaymentLabel: "付費服務交易時：",
        s1PaymentBody: " 付款授權紀錄與訂閱狀態資訊（信用卡卡號等敏感付款資訊由金流業者或應用程式商店直接處理，本公司不會儲存）。",
        s1ContactLabel: "聯絡諮詢時：",
        s1ContactBody: " 姓名、回覆用電子郵件地址及諮詢內容。",
        s2Title: "2. 個人資料蒐集與利用目的",
        s2Items: [
          "使用者身分識別、維持登入狀態及提供個人化服務",
          "付費服務計費、付款處理與退款作業",
          "客戶諮詢回覆、重要公告通知、防範不當使用及強化系統安全",
        ],
        s2AiItem: "針對輸入或上傳之備忘錄、行程、圖片與語音錄音進行 AI 自動摘要、轉錄、分類及跨裝置同步保存",
        s3Title: "3. 個人資料保存與利用期間",
        s3Body:
          "於蒐集目的達成或使用者申請刪除帳號時，本公司將立即刪除相關資料。惟依相關法令規定須保存者，將依下列期間妥善保管：",
        s3Items: [
          "契約、取消訂閱、付款及商品或服務供應紀錄：5 年（電子商務法）",
          "消費者申訴或爭議處理紀錄：3 年（電子商務法）",
          "服務連線及登入日誌紀錄：3 個月（通訊秘密保護法）",
        ],
        s4Title: "4. 個人資料銷毀程序與方法",
        s4ProcedureLabel: "銷毀程序：",
        s4ProcedureBody: " 超過保存期限或處理目的已達成之資料，將依內部規範及法令規定分別保管後立即永久銷毀。",
        s4MethodLabel: "銷毀方法：",
        s4MethodBody: " 以電子檔案儲存之資料將採用無法還原之技術方式永久刪除；紙本文件則予以碎紙或焚毀。",
        s5Title: "5. 第三方提供、委託處理與跨境傳輸",
        s5Body:
          "除經使用者同意或法令明文規定外，本公司不會將個人資料提供予第三方。為確保服務穩定運作，必要時得委託下列專業機構或使用海外雲端及 AI 基礎設施：",
        s5CloudLabel: "雲端基礎設施與資料庫託管：",
        s5CloudBody: " 採用加密安全機制進行資料儲存與登入驗證處理。",
        s5AiLabel: "AI 內容處理委託（文字、圖片與語音，含跨境傳輸）：",
        s5AiBody:
          " 為將使用者輸入或上傳的備忘錄、螢幕截圖與語音錄音進行 AI 自動轉錄、摘要與分類，可能透過加密通道委託全球 AI 模型供應商（含美國等海外伺服器）處理，並確保該資料不會用於外部模型訓練或永久留存。",
        s5MailLabel: "郵件寄送與金流代收付：",
        s5MailBody: " 處理客服聯繫信件與付費訂閱及退款作業。",
        s6Title: "6. 使用者權利及帳號與資料刪除方式",
        s6Body: "使用者得隨時請求查閱、更正、刪除或停止處理其個人資料。",
        s6DeleteLabel: "帳號與資料刪除申請方式：",
        s6DeleteBeforeEmail: " 您可直接於應用程式內帳號設定（刪除帳號）選單中執行刪除，或來信至個人資料保護負責人信箱（",
        s6DeleteAfterEmail: "）並附上您的註冊電子郵件地址提出申請。經確認身分後，我們將於 7 個工作日內永久刪除所有帳號資訊與儲存資料。",
        s6ChildLabel: "未滿 14 歲兒童之個人資料：",
        s6ChildBody: " 本公司原則上不開放未滿 14 歲兒童註冊或蒐集其個人資料；若發現誤為蒐集，將立即予以刪除。",
        s7Title: "7. Cookie 與類似技術之使用及拒絕方式",
        s7Body:
          "本公司可能使用 Cookie 及瀏覽器儲存空間以維持登入狀態並提升使用體驗。您可透過瀏覽器設定拒絕或刪除 Cookie，惟此舉可能導致自動登入等部分功能受限。",
        s8Title: "8. 個人資料安全維護措施",
        s8Items: [
          "全程傳輸加密（HTTPS/TLS）及重要驗證資訊加密儲存",
          "最小化個人資料系統存取權限並定期執行安全檢測",
          "建置技術性防護機制以阻擋未經授權之存取與外部入侵",
        ],
        s9Title: "9. 個人資料保護負責人與聯絡窗口",
        s9Officer: "姓名：KETSIRI IRATDA（代表）",
        s9Company: "公司：YJ Studio（和以斯工作室）",
        s9Email: "電子郵件：contact@yjstudio.app",
        s10Title: "10. 權益受損救濟管道",
        s10Body: "如對個人資料保護有任何疑問、申訴或權益受損之虞，請先聯繫本公司窗口，或向您所在國家／地區之主管機關尋求協助：",
        s10Items: [
          "YJ Studio 個人資料保護聯絡窗口：contact@yjstudio.app（我們將儘速確認並協助處理）",
          "所在地主管機關：您可向所屬國家或地區之個人資料保護主管機關（例如臺灣相關目的事業主管機關或個人資料保護委員會籌備處）提出諮詢或申訴。",
        ],
        s11Title: "11. 隱私權政策之修訂",
        s11Body:
          "本政策得配合法令或服務調整進行修訂；如有重要變更，將於生效日前至少 7 日於網站或服務內公告通知。",
      },
    },
  },
  fr: {
    nav: {
      about: "À propos",
      products: "Produits",
      contact: "Contact",
      menuAria: "Menu",
    },
    hero: {
      badge: "Studio logiciel centré sur le quotidien",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "Un espace pour organiser votre quotidien et partager vos idées. Nous concevons des services web et mobiles qui simplifient et enrichissent la vie de tous les jours.",
      primaryCta: "Découvrir nos produits",
      secondaryCta: "Nous contacter",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "Un studio high-tech agile, rapide et exigeant",
      body: "YJ Studio fonctionne comme un studio full-stack propulsé par l'IA, passant de l'idée au lancement et à l'exploitation avec une fluidité totale. Nous concevons et validons rapidement des applications mobiles et des outils pratiques pensés pour le quotidien.",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "Gamme de produits",
      showMore: "Voir plus",
      showLess: "Réduire",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "TalkSecretary - Mémo IA",
          desc: "Assistant mémoire IA — Déposez textes, captures d'écran ou mémos vocaux, l'IA les classe et les organise automatiquement.",
          quickLinks: {
            terms: "Conditions",
            privacy: "Confidentialité",
            guide: "Mode d'emploi",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "Teacup Tarot",
          desc: "Digital Tarot & Fortune — Un service numérique de tarot et de prédictions pour apporter réconfort et inspiration au quotidien.",
        },
        dream: {
          tag: "Dream",
          name: "DreamSoban",
          desc: "Dream Interpretation Platform — Une plateforme intuitive pour explorer et comprendre la signification de vos rêves.",
        },
        bamboo: {
          tag: "Community",
          name: "Bamboo Forest",
          desc: "Anonymous Venting Space — Un espace bienveillant et anonyme pour exprimer librement ses émotions et trouver du soutien.",
        },
      },
    },
    contact: {
      title: "Un projet à construire ensemble ?",
      subtitle: "Nous accueillons avec plaisir les partenariats, collaborations et demandes d'information.",
      form: {
        namePlaceholder: "Nom / Entreprise",
        emailPlaceholder: "Adresse e-mail de réponse",
        messagePlaceholder: "Votre message",
        submit: "Envoyer",
        directEmailPrefix: "E-mail direct :",
        doneTitle: "Votre message a bien été reçu.",
        doneBody: "Nous l'examinerons et vous répondrons rapidement à l'adresse indiquée.",
        newMessage: "Nouveau message",
        errorGeneric: "Veuillez vérifier les champs saisis et réessayer.",
        copyEmail: "Copier l'e-mail",
        copied: "Copié !",
        openMailApp: "Envoyer un e-mail",
        emailHelper: "N'hésitez pas à nous écrire à l'adresse ci-dessous. Nous vous répondrons dans les plus brefs délais.",
      },
    },
    footer: {
      companyLabel: "Entreprise : ",
      companyValue: "YJ Studio",
      ceoLabel: "Dirigeant : ",
      businessLabel: "Activité : ",
      businessValue: "Développement logiciel IT & Services Web",
      emailLabel: "E-mail : ",
      privacyLink: "Politique de confidentialité",
      termsLink: "Conditions d'utilisation",
    },
    legal: {
      effectiveDate: "Date d'entrée en vigueur : 8 novembre 2026",
      termsTitle: "Conditions d'utilisation",
      privacyTitle: "Politique de confidentialité",
      termsSections: [
        {
          title: "Article 1 (Objet)",
          body: "Les présentes Conditions définissent les modalités d'utilisation des services web et mobiles (« Services ») fournis par YJ Studio (« la Société »), ainsi que les droits et obligations de la Société et des utilisateurs.",
        },
        {
          title: "Article 2 (Entrée en vigueur et modifications)",
          body: "Les présentes Conditions prennent effet dès leur publication au sein du Service. La Société peut les modifier dans le respect des lois applicables et en informera les utilisateurs au moins 7 jours avant leur entrée en vigueur.",
        },
        {
          title: "Article 3 (Fourniture des Services)",
          body: "La Société propose des services numériques tels que des utilitaires de productivité, des plateformes de contenu, de l'edtech et des outils d'analyse spatiale. Certains services peuvent être payants.",
        },
        {
          title: "Article 4 (Services payants et remboursements)",
          body: "Les tarifs et modalités de paiement sont affichés sur chaque écran de service. Les remboursements sont traités conformément à la loi sud-coréenne sur la protection des consommateurs dans le commerce électronique et aux politiques des boutiques d'applications.",
        },
        {
          title: "Article 5 (Obligations de l'utilisateur)",
          body: "Les utilisateurs s'interdisent d'usurper l'identité d'autrui, de perturber le fonctionnement du Service ou de se livrer à toute activité illicite.",
        },
        {
          title: "Article 6 (Limitation de responsabilité)",
          body: "La Société ne saurait être tenue responsable des dommages résultant d'un cas de force majeure ou d'une faute de l'utilisateur. Les contenus de divertissement (astrologie, tarot, etc.) sont fournis à titre purement indicatif.",
        },
        {
          title: "Article 7 (Droit applicable et juridiction)",
          body: "Les présentes Conditions sont régies par le droit de la République de Corée. Tout litige relèvera de la compétence des tribunaux désignés par le Code de procédure civile.",
        },
      ],
      termsContact: "Contact : contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "TalkSecretary - Mémo IA",
      introPrefix: "Découvrez le mode d'emploi, les conditions d'utilisation et la politique de confidentialité de ",
      introStrong: "TalkSecretary - Mémo IA",
      introSuffix: " — votre assistant mémoire IA qui organise tout ce que vous lui confiez.",
      navAria: "Navigation rapide TalkSecretary",
      tabs: {
        guide: "Mode d'emploi",
        terms: "Conditions d'utilisation",
        privacy: "Politique de confidentialité",
      },
      guideHeading: "Mode d'emploi",
      guideIntro:
        "TalkSecretary est un assistant mémoire IA conçu pour capturer instantanément vos idées, captures d'écran, mémos vocaux et tâches sans dossiers complexes.",
      guideSteps: [
        {
          title: "Étape 1 — Notez ou importez librement :",
          body: "Saisissez vos tâches, idées, notes, captures d'écran ou enregistrements vocaux dans TalkSecretary en toute simplicité.",
        },
        {
          title: "Étape 2 — Organisation automatique par l'IA :",
          body: "TalkSecretary analyse vos textes, images et enregistrements vocaux, en résume l'essentiel et les classe automatiquement.",
        },
        {
          title: "Étape 3 — Retrouvez tout à tout moment :",
          body: "Consultez vos notes organisées d'un coup d'œil dans votre boîte de réception et cochez les tâches accomplies pour gérer votre journée sereinement.",
        },
      ],
      termsHeading: "Conditions d'utilisation",
      termsArticles: [
        {
          title: "Article 1 (Objet)",
          body: "Les présentes Conditions régissent les modalités d'utilisation, les droits et les obligations entre YJ Studio (« la Société ») et les utilisateurs concernant le service TalkSecretary (« le Service »).",
        },
        {
          title: "Article 2 (Effet et modifications)",
          body: "Les présentes Conditions prennent effet dès leur publication dans le Service ou sur notre site web. Toute modification majeure sera annoncée au moins 7 jours à l'avance (ou 30 jours en cas de changement défavorable aux utilisateurs).",
        },
        {
          title: "Article 3 (Comptes et connexion tierce)",
          body: "Les utilisateurs peuvent s'inscrire via les méthodes prises en charge, notamment la connexion Google. Les conditions du fournisseur tiers s'appliquent également. Vous pouvez déconnecter votre compte ou supprimer votre profil à tout moment depuis les paramètres ou par e-mail.",
        },
        {
          title: "Article 4 (Contenu, modifications et maintenance)",
          body: "La Société fournit des fonctionnalités de productivité permettant d'enregistrer, résumer et organiser des notes, plannings et idées grâce à l'IA. La Société peut modifier ou suspendre temporairement le Service pour maintenance ou amélioration, avec préavis dans la mesure du possible.",
        },
        {
          title: "Article 5 (Options payantes, abonnements et remboursements)",
          body: "Certaines fonctionnalités avancées peuvent être proposées sous forme d'achat ou d'abonnement récurrent, dont les tarifs et conditions d'essai sont affichés avant paiement. Les abonnements sont renouvelés automatiquement sauf résiliation au moins 24 heures avant la prochaine échéance via votre boutique d'applications (ex. Google Play) ou les paramètres du compte. Les remboursements suivent la loi sud-coréenne et les politiques des boutiques.",
        },
        {
          title: "Article 6 (Droits sur le contenu et traitement par l'IA)",
          body: "Vous conservez l'entière propriété de toutes les notes et données que vous saisissez. La Société traite vos contenus uniquement pour assurer les fonctionnalités du Service (résumé IA, classement, synchronisation) et ne les publie ni ne les exploite commercialement sans votre accord.",
        },
        {
          title: "Article 7 (Obligations et restrictions)",
          body: "Il est interdit d'usurper l'identité d'autrui, d'attaquer l'infrastructure du Service, de provoquer une surcharge via des outils automatisés non autorisés ou de stocker des contenus illicites. En cas d'infraction, la Société pourra restreindre l'accès ou résilier le compte.",
        },
        {
          title: "Article 8 (Propriété intellectuelle)",
          body: "À l'exception des contenus des utilisateurs, tous les droits de propriété intellectuelle du Service (logiciel, design, marques, logos) appartiennent à la Société et ne peuvent être reproduits ou modifiés sans autorisation écrite préalable.",
        },
        {
          title: "Article 9 (Limites de l'IA et responsabilité)",
          body: "Les résumés et suggestions générés par l'IA sont fournis à titre purement indicatif sans garantie d'exactitude absolue. Ils ne doivent pas servir de base unique à des décisions juridiques, médicales ou financières critiques. La Société n'est pas responsable des dommages liés à un cas de force majeure ou à une faute de l'utilisateur.",
        },
        {
          title: "Article 10 (Droit applicable et contact)",
          body: "Les présentes Conditions sont régies par le droit de la République de Corée et tout litige relève des tribunaux compétents selon le Code de procédure civile. Pour toute question, écrivez à contact@yjstudio.app.",
        },
      ],
      privacyHeading: "Politique de confidentialité",
      privacyServiceName: "TalkSecretary - Mémo IA (TalkSecretary)",
    },
    privacy: {
      generalServiceName: "services web et mobiles fournis par YJ Studio",
      introPrefix: "YJ Studio (« la Société ») respecte la loi sud-coréenne sur la protection des données personnelles (PIPA) ainsi que les réglementations applicables, et s'engage à protéger les données des utilisateurs de ",
      introSuffix: ".",
      sections: {
        s1Title: "1. Données personnelles collectées et modalités",
        s1AccountLabel: "Inscription et utilisation du Service (obligatoire) :",
        s1AccountBody: " Adresse e-mail, identifiant de compte (connexion sociale / Google), journaux d'utilisation et d'accès, informations sur l'appareil (OS, navigateur).",
        s1TokbiseoLabel: "Utilisation des fonctions TalkSecretary :",
        s1TokbiseoBody: " Notes, plannings, tâches, captures d'écran/images importées et enregistrements vocaux (audio) saisis ou transmis directement par l'utilisateur pour l'organisation et la sauvegarde par l'IA.",
        s1PaymentLabel: "Transactions payantes :",
        s1PaymentBody: " Historique de validation de paiement et statut d'abonnement (les données bancaires sensibles sont traitées directement par le prestataire de paiement ou la boutique d'applications et jamais stockées par la Société).",
        s1ContactLabel: "Demandes de contact :",
        s1ContactBody: " Nom, adresse e-mail de réponse et contenu du message.",
        s2Title: "2. Finalités de la collecte et de l'utilisation",
        s2Items: [
          "Identification de l'utilisateur, maintien de session et fourniture du service",
          "Facturation, traitement des paiements et gestion des remboursements",
          "Support client, notifications importantes, prévention des fraudes et sécurité",
        ],
        s2AiItem: "Résumé automatique, transcription, catégorisation par IA et synchronisation multi-appareils des notes, images et enregistrements vocaux",
        s3Title: "3. Durée de conservation des données",
        s3Body:
          "Les données personnelles sont supprimées sans délai dès que la finalité est atteinte ou lors de la suppression du compte. Lorsque la loi impose une conservation, les durées suivantes s'appliquent :",
        s3Items: [
          "Contrats, résiliations, paiements et fourniture de services : 5 ans (Loi sur le commerce électronique)",
          "Réclamations clients et résolution des litiges : 3 ans (Loi sur le commerce électronique)",
          "Journaux d'accès et de connexion : 3 mois (Loi sur la protection du secret des communications)",
        ],
        s4Title: "4. Procédure et méthodes de suppression",
        s4ProcedureLabel: "Procédure :",
        s4ProcedureBody: " À l'expiration de la durée de conservation ou une fois l'objectif atteint, les données sont isolées puis supprimées définitivement sans délai.",
        s4MethodLabel: "Méthode :",
        s4MethodBody: " Les fichiers électroniques sont effacés de manière irréversible par des procédés techniques ; les documents papier sont déchiquetés ou incinérés.",
        s5Title: "5. Partage avec des tiers, sous-traitance et transferts internationaux",
        s5Body:
          "La Société ne vend ni ne partage vos données avec des tiers sans votre consentement ou obligation légale. Pour assurer le bon fonctionnement du Service, certaines opérations techniques sont confiées à des partenaires ou infrastructures cloud/IA internationales :",
        s5CloudLabel: "Hébergement cloud et bases de données :",
        s5CloudBody: " Stockage chiffré et gestion sécurisée de l'authentification.",
        s5AiLabel: "Traitement de contenu par IA (texte, images et audio, y compris transfert international) :",
        s5AiBody:
          " Les notes, captures d'écran/images et enregistrements vocaux transmis peuvent être envoyés via des canaux chiffrés à des fournisseurs mondiaux de modèles d'IA (y compris sur des serveurs situés aux États-Unis) uniquement pour la transcription, le résumé et le classement automatisés, sans jamais être utilisés pour l'entraînement de modèles d'IA externes ni conservés de façon permanente.",
        s5MailLabel: "Envoi d'e-mails et paiements :",
        s5MailBody: " Traitement des messages de contact et des paiements ou remboursements.",
        s6Title: "6. Droits des utilisateurs et suppression de compte / données",
        s6Body: "Vous pouvez à tout moment demander l'accès, la rectification, la suppression, la portabilité ou la limitation du traitement de vos données personnelles.",
        s6DeleteLabel: "Comment demander la suppression du compte et des données :",
        s6DeleteBeforeEmail: " Vous pouvez supprimer votre compte directement dans les paramètres de l'application (Supprimer le compte) ou écrire à notre responsable de la protection des données à ",
        s6DeleteAfterEmail: " en précisant votre adresse e-mail associée. Après vérification, toutes vos données seront définitivement supprimées sous 7 jours ouvrés maximum.",
        s6ChildLabel: "Mineurs de moins de 14 ans :",
        s6ChildBody: " La Société n'autorise pas l'inscription ni la collecte de données auprès des enfants de moins de 14 ans. Toute donnée identifiée sera immédiatement supprimée.",
        s7Title: "7. Cookies et collecte automatique",
        s7Body:
          "Nous utilisons des cookies et le stockage du navigateur pour maintenir votre session et améliorer l'expérience utilisateur. Vous pouvez les bloquer ou les supprimer dans les réglages de votre navigateur, ce qui peut limiter certaines fonctions comme la connexion persistante.",
        s8Title: "8. Mesures de sécurité",
        s8Items: [
          "Chiffrement des communications (HTTPS/TLS) et stockage chiffré des identifiants",
          "Contrôle strict des accès aux systèmes et audits de sécurité réguliers",
          "Protections techniques contre les accès non autorisés et intrusions",
        ],
        s9Title: "9. Responsable de la protection des données",
        s9Officer: "Nom : KETSIRI IRATDA (CEO)",
        s9Company: "Entreprise : YJ Studio",
        s9Email: "E-mail : contact@yjstudio.app",
        s10Title: "10. Recours et autorités compétentes",
        s10Body: "Si vous avez des questions ou estimez que vos droits relatifs aux données personnelles ont été enfreints, vous pouvez d'abord nous contacter ou saisir l'autorité de contrôle compétente de votre pays :",
        s10Items: [
          "Responsable de la protection des données (YJ Studio) : contact@yjstudio.app",
          "Autorité de contrôle locale : En France, vous pouvez adresser une réclamation auprès de la CNIL (www.cnil.fr), ou auprès de l'autorité nationale de protection des données de votre pays de résidence.",
        ],
        s11Title: "11. Modifications de la politique",
        s11Body:
          "La présente politique peut être mise à jour selon l'évolution légale ou technique. Toute modification importante sera annoncée au moins 7 jours avant son entrée en vigueur.",
      },
    },
  },
  de: {
    nav: {
      about: "Über uns",
      products: "Produkte",
      contact: "Kontakt",
      menuAria: "Menü",
    },
    hero: {
      badge: "Alltagsnahes Software-Studio",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "Ein Ort, um den Alltag zu ordnen und Gedanken zu teilen. Wir entwickeln Web- und Mobile-Services, die das tägliche Leben einfacher und angenehmer machen.",
      primaryCta: "Produkte ansehen",
      secondaryCta: "Kontakt aufnehmen",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "Kompakt, schnell und tiefgehend – ein modernes High-Tech-Studio",
      body: "YJ Studio arbeitet als KI-gestütztes Full-Stack-Studio und bewegt sich reibungslos von der Idee bis zum Launch und Betrieb. Wir testen und verwirklichen mobile Ökosysteme sowie alltagstaugliche Software mit hoher Geschwindigkeit.",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "Produktportfolio",
      showMore: "Mehr anzeigen",
      showLess: "Weniger",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "TalkSecretary - KI-Notizen",
          desc: "KI-Gedächtnisassistent — Texte, Screenshots oder Sprachnotizen eingeben, und die KI sortiert und organisiert alles automatisch.",
          quickLinks: {
            terms: "Nutzungsbedingungen",
            privacy: "Datenschutz",
            guide: "Anleitung",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "Teacup Tarot",
          desc: "Digital Tarot & Fortune — Ein digitaler Tarot- und Orakelservice für kleine Auszeiten und Inspiration im Alltag.",
        },
        dream: {
          tag: "Dream",
          name: "DreamSoban",
          desc: "Dream Interpretation Platform — Eine intuitive Plattform zur Deutung Ihrer Träume.",
        },
        bamboo: {
          tag: "Community",
          name: "Bamboo Forest",
          desc: "Anonymous Venting Space — Ein geschützter, anonymer Raum, um sich ehrlich auszusprechen und Trost zu finden.",
        },
      },
    },
    contact: {
      title: "Haben Sie ein Projekt für uns?",
      subtitle: "Wir freuen uns über Partnerschaften, Kooperationen und Serviceanfragen.",
      form: {
        namePlaceholder: "Ihr Name / Unternehmen",
        emailPlaceholder: "E-Mail-Adresse für Antworten",
        messagePlaceholder: "Ihre Nachricht",
        submit: "Anfrage senden",
        directEmailPrefix: "Direkte E-Mail:",
        doneTitle: "Ihre Anfrage ist eingegangen.",
        doneBody: "Wir prüfen Ihre Nachricht und antworten Ihnen zeitnah per E-Mail.",
        newMessage: "Weitere Anfrage senden",
        errorGeneric: "Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.",
        copyEmail: "E-Mail kopieren",
        copied: "Kopiert!",
        openMailApp: "E-Mail senden",
        emailHelper: "Kontaktieren Sie uns gerne über die untenstehende E-Mail-Adresse. Wir melden uns schnellstmöglich zurück.",
      },
    },
    footer: {
      companyLabel: "Unternehmen: ",
      companyValue: "YJ Studio",
      ceoLabel: "Geschäftsführung: ",
      businessLabel: "Branche: ",
      businessValue: "IT-Softwareentwicklung & Web-Services",
      emailLabel: "E-Mail: ",
      privacyLink: "Datenschutzerklärung",
      termsLink: "Nutzungsbedingungen",
    },
    legal: {
      effectiveDate: "Stand: 8. November 2026",
      termsTitle: "Nutzungsbedingungen",
      privacyTitle: "Datenschutzerklärung",
      termsSections: [
        {
          title: "§ 1 (Zweck)",
          body: "Diese Nutzungsbedingungen regeln die Bedingungen und Abläufe für die Nutzung der Web- und App-Dienste („Dienste“) von YJ Studio („Unternehmen“) sowie die Rechte und Pflichten zwischen dem Unternehmen und den Nutzern.",
        },
        {
          title: "§ 2 (Geltung und Änderungen)",
          body: "Diese Bedingungen treten mit ihrer Veröffentlichung im Dienst in Kraft. Das Unternehmen kann sie im Rahmen der geltenden Gesetze ändern und informiert darüber mindestens 7 Tage vor Inkrafttreten.",
        },
        {
          title: "§ 3 (Leistungsangebot)",
          body: "Das Unternehmen bietet digitale Dienste wie Produktivitäts-Tools, Content-Plattformen, EdTech und Geodatenanalysen an. Einzelne Dienste können kostenpflichtig sein.",
        },
        {
          title: "§ 4 (Kostenpflichtige Dienste und Erstattungen)",
          body: "Preise und Zahlungsbedingungen werden jeweils auf der Dienstseite angezeigt. Erstattungen erfolgen nach dem südkoreanischen Verbraucherschutzgesetz im elektronischen Geschäftsverkehr sowie den Richtlinien der jeweiligen App-Stores.",
        },
        {
          title: "§ 5 (Pflichten der Nutzer)",
          body: "Nutzer dürfen keine fremden Daten missbrauchen, den Betrieb der Dienste stören oder rechtswidrige Handlungen vornehmen.",
        },
        {
          title: "§ 6 (Haftungsbeschränkung)",
          body: "Das Unternehmen haftet nicht für Schäden durch höhere Gewalt oder Nutzerverschulden. Unterhaltungsinhalte wie Tarot oder Horoskope dienen ausschließlich zu Referenzzwecken.",
        },
        {
          title: "§ 7 (Anwendbares Recht und Gerichtsstand)",
          body: "Es gilt das Recht der Republik Korea. Für Streitigkeiten sind die nach der Zivilprozessordnung zuständigen Gerichte verantwortlich.",
        },
      ],
      termsContact: "Kontakt: contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "TalkSecretary - KI-Notizen",
      introPrefix: "Hier finden Sie die Anleitung, Nutzungsbedingungen und Datenschutzerklärung für ",
      introStrong: "TalkSecretary - KI-Notizen",
      introSuffix: " – Ihren KI-Gedächtnisassistenten, der jede Notiz automatisch ordnet.",
      navAria: "TalkSecretary-Schnellnavigation",
      tabs: {
        guide: "Anleitung",
        terms: "Nutzungsbedingungen",
        privacy: "Datenschutzerklärung",
      },
      guideHeading: "Anleitung",
      guideIntro:
        "TalkSecretary ist ein KI-Gedächtnisassistent, mit dem Sie spontane Ideen, Screenshots, Sprachnotizen und Aufgaben mühelos festhalten können – ganz ohne komplizierte Ordner.",
      guideSteps: [
        {
          title: "Schritt 1 – Einfach eingeben oder hochladen:",
          body: "Erfassen Sie Aufgaben, Ideen, Notizen, Screenshots oder Sprachaufnahmen ganz natürlich in TalkSecretary.",
        },
        {
          title: "Schritt 2 – Automatische KI-Ordnung:",
          body: "TalkSecretary analysiert Ihre Texte, Bilder und Sprachaufnahmen, fasst die wichtigsten Punkte zusammen und ordnet sie passenden Kategorien zu.",
        },
        {
          title: "Schritt 3 – Jederzeit abrufen:",
          body: "Behalten Sie in Ihrem Posteingang alles im Blick, haken Sie erledigte Aufgaben ab und organisieren Sie Ihren Tag ganz entspannt.",
        },
      ],
      termsHeading: "Nutzungsbedingungen",
      termsArticles: [
        {
          title: "§ 1 (Zweck)",
          body: "Diese Bedingungen regeln die Nutzung sowie die Rechte und Pflichten zwischen YJ Studio („Unternehmen“) und den Nutzern in Bezug auf den Dienst TalkSecretary („Dienst“).",
        },
        {
          title: "§ 2 (Geltung und Änderungen)",
          body: "Diese Bedingungen gelten ab Veröffentlichung im Dienst oder auf unserer Website. Wesentliche Änderungen werden mindestens 7 Tage im Voraus angekündigt (bei nachteiligen Änderungen 30 Tage im Voraus).",
        },
        {
          title: "§ 3 (Konto und Drittanbieter-Login)",
          body: "Nutzer können sich über unterstützte Verfahren wie Google Sign-In anmelden. Bei Verknüpfung eines Drittkontos gelten ergänzend dessen Bedingungen. Sie können Ihr Konto jederzeit in den Einstellungen oder per E-Mail trennen bzw. löschen.",
        },
        {
          title: "§ 4 (Leistungsumfang und Wartung)",
          body: "Das Unternehmen bietet Produktivitätsfunktionen zum Speichern, Zusammenfassen und Ordnen von Notizen, Terminen und Ideen per KI. Für Wartungen oder Verbesserungen kann der Dienst nach vorheriger Ankündigung angepasst oder vorübergehend unterbrochen werden.",
        },
        {
          title: "§ 5 (Kostenpflichtige Funktionen, Abonnements und Erstattung)",
          body: "Premium-Funktionen können als Einmalkauf oder Abonnement angeboten werden; Preise und Testphasen werden vor Abschluss klar angezeigt. Abonnements verlängern sich automatisch, sofern sie nicht mindestens 24 Stunden vor dem nächsten Abrechnungsdatum über den App-Store (z. B. Google Play) oder die Kontoeinstellungen gekündigt werden. Erstattungen richten sich nach koreanischem Recht und den Store-Richtlinien.",
        },
        {
          title: "§ 6 (Rechte an Nutzerinhalten und KI-Verarbeitung)",
          body: "Alle Rechte an Ihren eingegebenen Notizen und Terminen verbleiben vollständig bei Ihnen. Das Unternehmen verarbeitet diese ausschließlich zur Bereitstellung der Kernfunktionen (KI-Zusammenfassung, Sortierung, Synchronisierung) und nutzt sie niemals unbefugt kommerziell.",
        },
        {
          title: "§ 7 (Nutzerpflichten und Einschränkungen)",
          body: "Es ist untersagt, sich als andere auszugeben, die Infrastruktur anzugreifen, übermäßige Last durch automatisierte Tools zu erzeugen oder rechtswidrige Inhalte zu speichern. Bei Verstößen kann der Zugang eingeschränkt oder das Konto gekündigt werden.",
        },
        {
          title: "§ 8 (Geistiges Eigentum)",
          body: "Mit Ausnahme der Nutzerinhalte liegen alle Rechte an Software, Design, Marken und Logos beim Unternehmen und dürfen ohne vorherige schriftliche Zustimmung nicht vervielfältigt oder verändert werden.",
        },
        {
          title: "§ 9 (Grenzen der KI und Haftung)",
          body: "KI-generierte Zusammenfassungen und Vorschläge dienen nur zur Unterstützung ohne Gewähr für vollständige Richtigkeit. Sie ersetzen keine professionelle rechtliche, medizinische oder finanzielle Beratung. Für höhere Gewalt oder Nutzerverschulden haftet das Unternehmen nicht.",
        },
        {
          title: "§ 10 (Anwendbares Recht und Kontakt)",
          body: "Es gilt das Recht der Republik Korea; Gerichtsstand ist das zuständige Gericht nach der Zivilprozessordnung. Kontakt: contact@yjstudio.app.",
        },
      ],
      privacyHeading: "Datenschutzerklärung",
      privacyServiceName: "TalkSecretary - KI-Notizen (TalkSecretary)",
    },
    privacy: {
      generalServiceName: "Web- und App-Diensten von YJ Studio",
      introPrefix: "YJ Studio („Unternehmen“) hält sich an das südkoreanische Datenschutzgesetz (PIPA) sowie geltende Datenschutzvorschriften und schützt die personenbezogenen Daten der Nutzer von ",
      introSuffix: " mit größter Sorgfalt.",
      sections: {
        s1Title: "1. Erhobene personenbezogene Daten und Erhebungsmethoden",
        s1AccountLabel: "Registrierung und Nutzung (erforderlich):",
        s1AccountBody: " E-Mail-Adresse, Konto-ID (bei Social-/Google-Login), Nutzungs- und Zugriffsprotokolle sowie Geräteinformationen (OS-Version, Browsertyp).",
        s1TokbiseoLabel: "Bei Nutzung von TalkSecretary:",
        s1TokbiseoBody: " Notizen, Termine, Aufgabentexte, hochgeladene Screenshots/Bilder sowie Sprachaufnahmen (Audio), die der Nutzer zur KI-Organisation und Speicherung direkt eingibt oder hochlädt.",
        s1PaymentLabel: "Kostenpflichtige Transaktionen:",
        s1PaymentBody: " Zahlungsbestätigungen und Abonnementstatus (sensible Zahlungsdaten wie Kreditkartennummern werden direkt vom Zahlungsanbieter oder App-Store verarbeitet und nicht von uns gespeichert).",
        s1ContactLabel: "Kundenanfragen:",
        s1ContactBody: " Name, Antwort-E-Mail-Adresse und Nachrichteninhalt.",
        s2Title: "2. Zweck der Erhebung und Verarbeitung",
        s2Items: [
          "Nutzeridentifizierung, Sitzungsauthentifizierung und Bereitstellung des Dienstes",
          "Abrechnung, Zahlungsabwicklung und Bearbeitung von Erstattungen",
          "Kundensupport, wichtige Mitteilungen, Missbrauchsprävention und Sicherheit",
        ],
        s2AiItem: "KI-gestützte Zusammenfassung, Transkription, Kategorisierung und geräteübergreifende Synchronisierung von Notizen, Bildern und Sprachaufnahmen",
        s3Title: "3. Speicherdauer",
        s3Body:
          "Personenbezogene Daten werden unverzüglich gelöscht, sobald der Zweck erfüllt ist oder das Konto gelöscht wird. Bestehen gesetzliche Aufbewahrungspflichten, gelten folgende Fristen:",
        s3Items: [
          "Vertrags-, Kündigungs-, Zahlungs- und Leistungsnachweise: 5 Jahre (E-Commerce-Gesetz)",
          "Kundenbeschwerden und Streitbeilegung: 3 Jahre (E-Commerce-Gesetz)",
          "Zugriffs- und Anmeldeprotokolle: 3 Monate (Kommunikationsgeheimnisgesetz)",
        ],
        s4Title: "4. Löschverfahren und -methoden",
        s4ProcedureLabel: "Verfahren:",
        s4ProcedureBody: " Nach Ablauf der Frist oder Zweckerfüllung werden Daten getrennt gesichert und unverzüglich dauerhaft gelöscht.",
        s4MethodLabel: "Methode:",
        s4MethodBody: " Elektronische Dateien werden technisch unwiederbringlich gelöscht; Papierdokumente werden geschreddert oder verbrannt.",
        s5Title: "5. Weitergabe an Dritte, Auftragsverarbeitung und Auslandsübermittlung",
        s5Body:
          "Wir geben personenbezogene Daten nicht ohne Einwilligung oder gesetzliche Grundlage an Dritte weiter. Für einen zuverlässigen Betrieb nutzen wir jedoch ausgewählte Cloud- und KI-Partner:",
        s5CloudLabel: "Cloud-Infrastruktur und Datenbank-Hosting:",
        s5CloudBody: " Verschlüsselte Datenspeicherung und sichere Authentifizierung.",
        s5AiLabel: "KI-Inhaltsverarbeitung (Text, Bilder und Audio, inkl. Auslandsübermittlung):",
        s5AiBody:
          " Eingegebene Notizen, hochgeladene Screenshots/Bilder und Sprachaufnahmen können verschlüsselt an globale KI-Modellanbieter (einschließlich Servern in den USA) ausschließlich zur automatischen Transkription, Zusammenfassung und Sortierung übermittelt werden; sie werden niemals zum Training externer KI-Modelle verwendet oder dauerhaft gespeichert.",
        s5MailLabel: "E-Mail-Versand und Zahlungsabwicklung:",
        s5MailBody: " Bearbeitung von Kontaktanfragen sowie Zahlungen und Erstattungen.",
        s6Title: "6. Nutzerrechte sowie Konto- und Datenlöschung",
        s6Body: "Sie können jederzeit Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung Ihrer Daten verlangen.",
        s6DeleteLabel: "So beantragen Sie die Konto- und Datenlöschung:",
        s6DeleteBeforeEmail: " Sie können Ihr Konto direkt in den App-Einstellungen (Konto löschen) entfernen oder eine E-Mail an den Verantwortlichen für den Datenschutz unter ",
        s6DeleteAfterEmail: " mit Ihrer registrierten E-Mail-Adresse senden. Nach Identitätsprüfung werden alle Kontodaten und gespeicherten Inhalte spätestens innerhalb von 7 Werktagen dauerhaft gelöscht.",
        s6ChildLabel: "Kinder unter 14 Jahren:",
        s6ChildBody: " Das Unternehmen erlaubt keine Registrierung und erhebt wissentlich keine Daten von Kindern unter 14 Jahren. Entsprechende Daten werden sofort gelöscht.",
        s7Title: "7. Cookies und automatische Datenerfassung",
        s7Body:
          "Wir verwenden ggf. Cookies und Browserspeicher zur Aufrechterhaltung von Anmeldungen und zur Verbesserung der Bedienbarkeit. Sie können Cookies in Ihren Browsereinstellungen ablehnen oder löschen, wodurch einige Funktionen eingeschränkt sein können.",
        s8Title: "8. Datensicherheitsmaßnahmen",
        s8Items: [
          "Verschlüsselte Übertragung (HTTPS/TLS) und verschlüsselte Speicherung von Zugangsdaten",
          "Strenge Zugriffsbeschränkungen und regelmäßige Sicherheitsüberprüfungen",
          "Technische Schutzmaßnahmen gegen unbefugten Zugriff und Angriffe",
        ],
        s9Title: "9. Verantwortlicher für den Datenschutz und Kontakt",
        s9Officer: "Name: KETSIRI IRATDA (CEO)",
        s9Company: "Unternehmen: YJ Studio",
        s9Email: "E-Mail: contact@yjstudio.app",
        s10Title: "10. Beschwerderecht und Aufsichtsbehörden",
        s10Body: "Wenn Sie Fragen zum Datenschutz haben oder eine Verletzung Ihrer Rechte vermuten, können Sie sich jederzeit zuerst an uns oder an die zuständige Datenschutzaufsichtsbehörde Ihres Wohnsitzlandes wenden:",
        s10Items: [
          "Verantwortlicher für den Datenschutz (YJ Studio): contact@yjstudio.app",
          "Zuständige Aufsichtsbehörde: Sie haben das Recht, sich bei der für Ihren Wohnsitz zuständigen Datenschutz-Aufsichtsbehörde in Deutschland, Österreich, der Schweiz oder Ihrem EU-Mitgliedstaat zu beschweren.",
        ],
        s11Title: "11. Änderungen dieser Datenschutzerklärung",
        s11Body:
          "Diese Erklärung kann bei rechtlichen oder technischen Änderungen aktualisiert werden. Wesentliche Änderungen werden mindestens 7 Tage vor Inkrafttreten angekündigt.",
      },
    },
  },
  es: {
    nav: {
      about: "Nosotros",
      products: "Productos",
      contact: "Contacto",
      menuAria: "Menú",
    },
    hero: {
      badge: "Estudio de software centrado en la vida diaria",
      titlePrefix: "Empowering Daily Life with ",
      titleAccent: "Smart Software",
      description:
        "Un espacio para organizar tu día y compartir ideas. Creamos servicios digitales web y móviles que hacen tu vida cotidiana más práctica y enriquecedora.",
      primaryCta: "Ver productos",
      secondaryCta: "Contáctanos",
    },
    about: {
      eyebrow: "About YJ Studio",
      headline: "Un estudio tecnológico ágil, rápido y cuidado al detalle",
      body: "YJ Studio opera como un estudio full-stack impulsado por IA, avanzando desde la idea hasta el lanzamiento y la operación sin fricciones. Validamos y lanzamos rápidamente ecosistemas móviles y utilidades prácticas para el día a día.",
    },
    products: {
      eyebrow: "Products & Universe",
      title: "Línea de productos",
      showMore: "Ver más",
      showLess: "Mostrar menos",
      items: {
        tokbiseo: {
          tag: "Utility",
          name: "TalkSecretary - Notas IA",
          desc: "Asistente de memoria con IA — Anota textos, sube capturas de pantalla o notas de voz y la IA lo organiza automáticamente.",
          quickLinks: {
            terms: "Términos",
            privacy: "Privacidad",
            guide: "Cómo usar",
          },
        },
        tarot: {
          tag: "Fortune",
          name: "Teacup Tarot",
          desc: "Digital Tarot & Fortune — Un servicio digital de tarot y fortuna para brindar alivio e inspiración diaria.",
        },
        dream: {
          tag: "Dream",
          name: "DreamSoban",
          desc: "Dream Interpretation Platform — Una plataforma intuitiva para descubrir el significado de tus sueños.",
        },
        bamboo: {
          tag: "Community",
          name: "Bamboo Forest",
          desc: "Anonymous Venting Space — Un espacio anónimo y seguro para desahogarte con sinceridad y encontrar apoyo.",
        },
      },
    },
    contact: {
      title: "¿Tienes un proyecto en mente?",
      subtitle: "Damos la bienvenida a alianzas, colaboraciones y consultas de servicio.",
      form: {
        namePlaceholder: "Nombre / Empresa",
        emailPlaceholder: "Correo electrónico de respuesta",
        messagePlaceholder: "Tu mensaje",
        submit: "Enviar consulta",
        directEmailPrefix: "Correo directo:",
        doneTitle: "Hemos recibido tu consulta.",
        doneBody: "La revisaremos y te responderemos pronto al correo proporcionado.",
        newMessage: "Enviar otra consulta",
        errorGeneric: "Verifica tus datos e inténtalo de nuevo.",
        copyEmail: "Copiar correo",
        copied: "¡Copiado!",
        openMailApp: "Enviar correo",
        emailHelper: "Escríbenos con total confianza al correo que aparece abajo. Te responderemos a la brevedad.",
      },
    },
    footer: {
      companyLabel: "Empresa: ",
      companyValue: "YJ Studio",
      ceoLabel: "Director: ",
      businessLabel: "Actividad: ",
      businessValue: "Desarrollo de Software TI y Servicios Web",
      emailLabel: "Correo: ",
      privacyLink: "Política de Privacidad",
      termsLink: "Términos de Servicio",
    },
    legal: {
      effectiveDate: "Fecha de entrada en vigor: 8 de noviembre de 2026",
      termsTitle: "Términos de Servicio",
      privacyTitle: "Política de Privacidad",
      termsSections: [
        {
          title: "Artículo 1 (Objeto)",
          body: "Estos Términos regulan las condiciones y procedimientos de uso de los servicios web y móviles («Servicios») ofrecidos por YJ Studio («la Empresa»), así como los derechos y obligaciones entre la Empresa y los usuarios.",
        },
        {
          title: "Artículo 2 (Vigencia y modificaciones)",
          body: "Estos Términos entran en vigor al publicarse en el Servicio. La Empresa podrá modificarlos conforme a la legislación aplicable y lo notificará al menos 7 días antes de su entrada en vigor.",
        },
        {
          title: "Artículo 3 (Prestación de servicios)",
          body: "La Empresa ofrece servicios digitales que incluyen utilidades de productividad, plataformas de contenido, tecnología educativa y análisis espacial. Algunos servicios pueden ser de pago.",
        },
        {
          title: "Artículo 4 (Servicios de pago y reembolsos)",
          body: "Las tarifas y condiciones de pago se muestran en cada pantalla del servicio. Los reembolsos se gestionan conforme a la Ley de Protección al Consumidor en el Comercio Electrónico de Corea del Sur y las políticas de cada tienda de aplicaciones.",
        },
        {
          title: "Artículo 5 (Obligaciones del usuario)",
          body: "Los usuarios no deben suplantar a terceros, interferir en el funcionamiento del Servicio ni realizar actividades ilícitas.",
        },
        {
          title: "Artículo 6 (Limitación de responsabilidad)",
          body: "La Empresa no será responsable por daños derivados de fuerza mayor o negligencia del usuario. El contenido de entretenimiento como tarot o predicciones tiene fines meramente orientativos.",
        },
        {
          title: "Artículo 7 (Legislación aplicable y jurisdicción)",
          body: "Estos Términos se rigen por las leyes de la República de Corea, y cualquier controversia se someterá a los tribunales competentes según la Ley de Procedimiento Civil.",
        },
      ],
      termsContact: "Contacto: contact@yjstudio.app",
    },
    tokbiseo: {
      pageTitle: "TalkSecretary - Notas IA",
      introPrefix: "Consulta la guía de uso, los Términos de Servicio y la Política de Privacidad de ",
      introStrong: "TalkSecretary - Notas IA",
      introSuffix: " — tu asistente de memoria con IA que organiza todo lo que anotas.",
      navAria: "Navegación rápida de TalkSecretary",
      tabs: {
        guide: "Cómo usar",
        terms: "Términos de Servicio",
        privacy: "Política de Privacidad",
      },
      guideHeading: "Cómo usar",
      guideIntro:
        "TalkSecretary es un asistente de memoria con IA diseñado para capturar ideas, capturas de pantalla, notas de voz y tareas al instante, sin carpetas complejas.",
      guideSteps: [
        {
          title: "Paso 1 — Anótalo o súbelo con naturalidad:",
          body: "Ingresa tareas, ideas, notas, capturas de pantalla o grabaciones de voz en TalkSecretary de la forma más natural.",
        },
        {
          title: "Paso 2 — Organización automática con IA:",
          body: "TalkSecretary analiza tus textos, imágenes y audios, resume los puntos clave y los clasifica automáticamente.",
        },
        {
          title: "Paso 3 — Consúltalo cuando quieras:",
          body: "Revisa todo de un vistazo en tu bandeja de entrada, marca lo completado y organiza tu día sin esfuerzo.",
        },
      ],
      termsHeading: "Términos de Servicio",
      termsArticles: [
        {
          title: "Artículo 1 (Objeto)",
          body: "Estos Términos definen las condiciones de uso, derechos y obligaciones entre YJ Studio («la Empresa») y los usuarios respecto al servicio TalkSecretary («el Servicio»).",
        },
        {
          title: "Artículo 2 (Vigencia y cambios)",
          body: "Estos Términos entran en vigor al publicarse en el Servicio o sitio web. Los cambios relevantes se anunciarán con al menos 7 días de antelación (o 30 días si resultan desfavorables para el usuario).",
        },
        {
          title: "Artículo 3 (Cuentas e inicio de sesión externo)",
          body: "Los usuarios pueden registrarse mediante métodos compatibles como Google Sign-In. Al vincular cuentas externas, también aplican las políticas del proveedor correspondiente. Puedes desvincular o eliminar tu cuenta en cualquier momento desde los ajustes o por correo electrónico.",
        },
        {
          title: "Artículo 4 (Alcance, cambios y mantenimiento)",
          body: "La Empresa ofrece funciones de productividad para guardar, resumir y organizar notas, agendas e ideas con IA. Podrá modificar o suspender temporalmente el Servicio por mantenimiento o mejoras técnicas, con aviso previo cuando sea posible.",
        },
        {
          title: "Artículo 5 (Funciones de pago, suscripciones y reembolsos)",
          body: "Ciertas funciones avanzadas pueden ofrecerse mediante pago único o suscripción periódica, mostrando claramente precios y pruebas gratuitas antes de pagar. Las suscripciones se renuevan automáticamente salvo cancelación al menos 24 horas antes del siguiente cobro desde la tienda de aplicaciones (como Google Play) o los ajustes de la cuenta. Los reembolsos siguen la ley surcoreana y las políticas de cada tienda.",
        },
        {
          title: "Artículo 6 (Derechos del contenido y procesamiento por IA)",
          body: "Conservas la plena propiedad sobre todas las notas y datos que ingreses. La Empresa procesa tu contenido únicamente para prestar las funciones del Servicio (resumen por IA, clasificación, sincronización) y nunca lo publica ni lo utiliza con fines comerciales sin tu permiso.",
        },
        {
          title: "Artículo 7 (Obligaciones y restricciones)",
          body: "No está permitido suplantar a terceros, atacar la infraestructura, generar carga anormal con herramientas automatizadas ni almacenar contenido ilegal. Ante incumplimientos, la Empresa podrá restringir el acceso o cancelar la cuenta.",
        },
        {
          title: "Artículo 8 (Propiedad intelectual)",
          body: "Salvo el contenido de los usuarios, todos los derechos de propiedad intelectual del Servicio (software, diseño, marcas y logotipos) pertenecen a la Empresa y no pueden copiarse ni modificarse sin permiso previo por escrito.",
        },
        {
          title: "Artículo 9 (Limitaciones de la IA y exención)",
          body: "Los resúmenes y sugerencias generados por IA se ofrecen solo como referencia práctica y no garantizan exactitud absoluta. No deben usarse como base única para decisiones legales, médicas o financieras críticas. La Empresa no responde por daños causados por fuerza mayor o culpa del usuario.",
        },
        {
          title: "Artículo 10 (Ley aplicable y contacto)",
          body: "Estos Términos se rigen por las leyes de la República de Corea y las disputas se someterán a los tribunales competentes. Contacto: contact@yjstudio.app.",
        },
      ],
      privacyHeading: "Política de Privacidad",
      privacyServiceName: "TalkSecretary - Notas IA (TalkSecretary)",
    },
    privacy: {
      generalServiceName: "los servicios web y móviles ofrecidos por YJ Studio",
      introPrefix: "YJ Studio («la Empresa») cumple con la Ley de Protección de Datos Personales de Corea (PIPA) y la normativa aplicable, comprometiéndose a proteger los datos personales de los usuarios de ",
      introSuffix: ".",
      sections: {
        s1Title: "1. Datos personales recopilados y métodos",
        s1AccountLabel: "Registro y uso del Servicio (obligatorio):",
        s1AccountBody: " Correo electrónico, identificador de cuenta (inicio de sesión social / Google), registros de uso y acceso, e información del dispositivo (versión de SO, navegador).",
        s1TokbiseoLabel: "Al usar funciones de TalkSecretary:",
        s1TokbiseoBody: " Notas, agendas, recordatorios, tareas, capturas de pantalla o imágenes subidas y grabaciones de voz (audio) ingresadas o cargadas directamente por el usuario para su organización y almacenamiento con IA.",
        s1PaymentLabel: "Transacciones de pago:",
        s1PaymentBody: " Registros de confirmación de pago y estado de suscripción (los datos sensibles de tarjeta son procesados directamente por la pasarela de pago o tienda de apps y nunca los almacenamos).",
        s1ContactLabel: "Consultas de contacto:",
        s1ContactBody: " Nombre, correo electrónico de respuesta y contenido del mensaje.",
        s2Title: "2. Finalidad de la recopilación y uso",
        s2Items: [
          "Identificación del usuario, mantenimiento de sesión y prestación del servicio",
          "Facturación, procesamiento de pagos y gestión de reembolsos",
          "Atención al cliente, avisos importantes, prevención de fraude y seguridad",
        ],
        s2AiItem: "Resumen automático, transcripción, categorización por IA y sincronización entre dispositivos de tus notas, imágenes y grabaciones de voz",
        s3Title: "3. Periodo de conservación",
        s3Body:
          "Los datos se eliminan sin demora al cumplirse la finalidad o al solicitar la eliminación de la cuenta. Cuando la ley exija conservarlos, aplican los siguientes plazos:",
        s3Items: [
          "Registros de contratos, cancelaciones, pagos y suministro de servicios: 5 años (Ley de Comercio Electrónico)",
          "Reclamaciones de consumidores y resolución de disputas: 3 años (Ley de Comercio Electrónico)",
          "Registros de acceso e inicio de sesión: 3 meses (Ley de Protección del Secreto de las Comunicaciones)",
        ],
        s4Title: "4. Procedimientos y métodos de eliminación",
        s4ProcedureLabel: "Procedimiento:",
        s4ProcedureBody: " Vencido el plazo o cumplida la finalidad, los datos se separan y se eliminan de forma permanente sin demora.",
        s4MethodLabel: "Método:",
        s4MethodBody: " Los archivos electrónicos se borran con técnicas irreversibles; los documentos físicos se trituran o incineran.",
        s5Title: "5. Compartición con terceros, encargados y transferencias internacionales",
        s5Body:
          "No vendemos ni compartimos datos personales con terceros salvo consentimiento o mandato legal. Para operar el Servicio de forma fiable, recurrimos a socios esenciales e infraestructura cloud/IA internacional:",
        s5CloudLabel: "Infraestructura cloud y bases de datos:",
        s5CloudBody: " Almacenamiento cifrado y gestión segura de autenticación.",
        s5AiLabel: "Procesamiento de contenido con IA (texto, imágenes y audio, incluida transferencia internacional):",
        s5AiBody:
          " Las notas, capturas de pantalla/imágenes y grabaciones de voz enviadas pueden transmitirse de forma cifrada a proveedores globales de modelos de IA (incluidos servidores en EE. UU.) únicamente para su transcripción, resumen y clasificación automáticos, sin utilizarse para entrenar modelos externos ni conservarse permanentemente.",
        s5MailLabel: "Envío de correos y pagos:",
        s5MailBody: " Gestión de consultas de contacto y cobros o reembolsos.",
        s6Title: "6. Derechos del usuario y eliminación de cuenta / datos",
        s6Body: "Puedes solicitar en cualquier momento el acceso, rectificación, cancelación, oposición (derechos ARCO), portabilidad o limitación del tratamiento de tus datos personales.",
        s6DeleteLabel: "Cómo solicitar la eliminación de cuenta y datos:",
        s6DeleteBeforeEmail: " Puedes eliminar tu cuenta directamente en los ajustes de la app (Eliminar cuenta) o escribir a nuestro responsable de protección de datos a ",
        s6DeleteAfterEmail: " indicando tu correo registrado. Tras verificar tu identidad, todos tus datos se eliminarán permanentemente en un máximo de 7 días hábiles.",
        s6ChildLabel: "Menores de 14 años:",
        s6ChildBody: " La Empresa no permite el registro ni recopila intencionadamente datos de menores de 14 años; de detectarse, se eliminarán de inmediato.",
        s7Title: "7. Cookies y recopilación automática",
        s7Body:
          "Podemos usar cookies y almacenamiento del navegador para mantener la sesión iniciada y mejorar la experiencia. Puedes rechazarlas o borrarlas en la configuración de tu navegador, aunque algunas funciones podrían verse limitadas.",
        s8Title: "8. Medidas de seguridad",
        s8Items: [
          "Cifrado en tránsito (HTTPS/TLS) y almacenamiento cifrado de credenciales",
          "Control estricto de accesos y revisiones periódicas de seguridad",
          "Protecciones técnicas frente a accesos no autorizados e intrusiones",
        ],
        s9Title: "9. Responsable de protección de datos y contacto",
        s9Officer: "Nombre: KETSIRI IRATDA (CEO)",
        s9Company: "Empresa: YJ Studio",
        s9Email: "Correo: contact@yjstudio.app",
        s10Title: "10. Vías de reclamación y autoridades locales",
        s10Body: "Si tienes dudas sobre privacidad o consideras que se han vulnerado tus derechos, puedes comunicarte primero con nosotros o acudir a la autoridad de protección de datos de tu país o región:",
        s10Items: [
          "Responsable de Protección de Datos (YJ Studio): contact@yjstudio.app",
          "Autoridad de control local: Puedes presentar una reclamación ante la autoridad de protección de datos competente de tu país de residencia (como la AEPD en España, www.aepd.es, o el organismo local correspondiente).",
        ],
        s11Title: "11. Cambios en esta Política",
        s11Body:
          "Esta Política podrá actualizarse por cambios legales o del Servicio. Cualquier cambio relevante se anunciará al menos 7 días antes de entrar en vigor.",
      },
    },
  },
};
