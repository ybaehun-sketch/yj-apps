import type { Section } from "@/components/LegalPage";
import type { SupportedLang } from "./i18n";

type LegalContent = { title: string; updated: string; sections: Section[] };

export const TERMS_I18N: Partial<Record<SupportedLang, LegalContent>> = {
  en: {
    title: "Terms of Service",
    updated: "Nov 27, 2026",
    sections: [
      { title: "Purpose", body: <p>These terms govern your use of Teacup Tarot ("Service") and outline the rights and responsibilities between you and the operator.</p> },
      {
        title: "Nature of the Service",
        body: (
          <>
            <p>All readings on the Service are AI-generated conversations meant for personal reflection, comfort, and entertainment using tarot cards.</p>
            <p>AI replies may be inaccurate or differ from facts, and do not predict the future or guarantee any outcome.</p>
          </>
        ),
      },
      {
        title: "No Professional Advice",
        body: (
          <>
            <p>The Service does not provide medical, mental health, legal, or financial/investment diagnosis or advice, and cannot replace qualified professionals.</p>
            <p>You are responsible for decisions you make based on a reading. In an emergency, please contact local emergency services or a crisis hotline right away.</p>
          </>
        ),
      },
      {
        title: "How to Use",
        body: (
          <>
            <p>Anyone aged 14 or older may use the Service for free without signing up.</p>
            <p>Daily free reading and reply limits exist to keep the Service running smoothly and may change as needed.</p>
          </>
        ),
      },
      {
        title: "Restrictions",
        body: (
          <>
            <p>Access may be restricted without prior notice if you:</p>
            <ul className="list-disc pl-5">
              <li>Repeatedly ask for medical, legal, or investment advice</li>
              <li>Send abusive, hateful, or sexually explicit messages</li>
              <li>Try to obtain another person's private information</li>
              <li>Input content encouraging crime or self-harm</li>
              <li>Disrupt operations using automated tools or bots</li>
            </ul>
          </>
        ),
      },
      {
        title: "Content Rights",
        body: (
          <>
            <p>All reading texts, card guides, articles, and designs belong to the operator.</p>
            <p>You may not copy, distribute, scrape with automated tools, or use Service content to train other AI models without permission.</p>
          </>
        ),
      },
      { title: "Changes & Suspension", body: <p>We may update or suspend parts of the Service for maintenance or operational needs, and will give notice when possible.</p> },
      { title: "Limitation of Liability", body: <p>We are not liable for damages caused by force majeure, external AI or hosting outages, or decisions you make based on AI replies.</p> },
      { title: "Governing Law", body: <p>These terms are governed by the laws of the Republic of Korea.</p> },
      {
        title: "Operator & Contact",
        body: (
          <>
            <p>Service: Teacup Tarot (teacuptarot.com)</p>
            <p>Operator: YJ Studio</p>
            <p>Email: <a className="underline" href="mailto:contact@yjstudio.app">contact@yjstudio.app</a></p>
          </>
        ),
      },
    ],
  },
  ja: {
    title: "利用規約",
    updated: "2026年11月27日",
    sections: [
      { title: "目的", body: <p>本規約は、ティーカップタロット（以下「本サービス」）の利用条件および利用者と運営者の権利・義務を定めるものです。</p> },
      {
        title: "サービスの性質",
        body: (
          <>
            <p>本サービスの占いはすべてAIとのやり取りであり、タロットカードを通じて気持ちを整えたり楽しんだりするための娯楽・参考コンテンツです。</p>
            <p>AIの回答は事実と異なる場合があり、未来を予言したり結果を保証したりするものではありません。</p>
          </>
        ),
      },
      {
        title: "専門的助言の制限",
        body: (
          <>
            <p>本サービスは医療・心理・法律・投資などの専門的な診断や助言を行うものではなく、専門家の代わりにはなりません。</p>
            <p>占いの内容を参考にしたご判断はご自身の責任となります。緊急時や深刻なつらさを感じるときは、119番や「いのちの電話」など専門窓口へご連絡ください。</p>
          </>
        ),
      },
      {
        title: "利用方法",
        body: (
          <>
            <p>14歳以上であれば、会員登録なしでどなたでも無料でご利用いただけます。</p>
            <p>1日の無料占い回数やチャットのやり取り回数には上限があり、運営状況により変更されることがあります。</p>
          </>
        ),
      },
      {
        title: "利用制限",
        body: (
          <>
            <p>以下の場合、予告なく利用を制限することがあります。</p>
            <ul className="list-disc pl-5">
              <li>医療・法律・投資などの専門的判断を繰り返し求める場合</li>
              <li>暴言、ヘイト表現、性的な内容など不適切なやり取りを続ける場合</li>
              <li>他者の個人情報やプライバシーを探る目的で利用する場合</li>
              <li>犯罪や自傷を助長する内容を入力する場合</li>
              <li>自動化ツール等でサービス運営を妨害する場合</li>
            </ul>
          </>
        ),
      },
      {
        title: "コンテンツの権利",
        body: (
          <>
            <p>本サービス内の文章、カード解説、コラム、デザイン等の権利は運営者に帰属します。</p>
            <p>運営者の許可なく複製・配布、自動収集、他のAIの学習データとして利用することは禁止します。</p>
          </>
        ),
      },
      { title: "サービスの変更・中断", body: <p>メンテナンスや障害、運営上の都合により、本サービスの一部または全部を変更・中断する場合があります。</p> },
      { title: "免責事項", body: <p>天災地変、外部AIやサーバーの障害、またはAIの回答に基づく利用者の判断と結果について、運営者は責任を負いません。</p> },
      { title: "準拠法", body: <p>本規約は大韓民国法に準拠します。</p> },
      {
        title: "運営者・お問い合わせ",
        body: (
          <>
            <p>サービス名：ティーカップタロット（teacuptarot.com）</p>
            <p>運営：YJスタジオ</p>
            <p>メール：<a className="underline" href="mailto:contact@yjstudio.app">contact@yjstudio.app</a></p>
          </>
        ),
      },
    ],
  },
  "zh-TW": {
    title: "服務條款",
    updated: "2026年11月27日",
    sections: [
      { title: "目的", body: <p>本條款旨在規範使用茶盞塔羅（以下簡稱「本服務」）的條件，以及使用者與營運方之間的權利義務。</p> },
      {
        title: "服務性質",
        body: (
          <>
            <p>本服務的占卜內容皆為人工智慧（AI）生成的對話，透過塔羅牌提供心情沉澱與娛樂參考。</p>
            <p>AI的回覆可能與事實不符，亦不具備預言未來或保證結果之效力。</p>
          </>
        ),
      },
      {
        title: "非專業建議聲明",
        body: (
          <>
            <p>本服務不提供醫療、心理健康、法律或投資理財等專業診斷或建議，亦無法取代專業人士。</p>
            <p>使用者依據占卜內容所做之決定，其責任由使用者自行承擔。若遇緊急或危機狀況，請立即撥打當地緊急電話或心理支持專線。</p>
          </>
        ),
      },
      {
        title: "使用方式",
        body: (
          <>
            <p>年滿14歲以上者，無需註冊即可免費使用本服務。</p>
            <p>每日免費占卜次數與對話次數上限係為維持服務穩定而設，可能視營運狀況調整。</p>
          </>
        ),
      },
      {
        title: "使用限制",
        body: (
          <>
            <p>若有下列情形，營運方得不經通知限制使用：</p>
            <ul className="list-disc pl-5">
              <li>反覆要求醫療、法律或投資等專業意見</li>
              <li>輸入辱罵、仇恨言論或色情等不當內容</li>
              <li>意圖探查他人隱私或個人資料</li>
              <li>輸入助長犯罪或自傷之內容</li>
              <li>使用自動化工具干擾服務正常運作</li>
            </ul>
          </>
        ),
      },
      {
        title: "內容權利",
        body: (
          <>
            <p>本服務內之解讀文字、牌義介紹、專欄文章與設計等著作權均歸營運方所有。</p>
            <p>未經同意，禁止複製、散布、以自動化工具擷取或用於訓練其他AI模型。</p>
          </>
        ),
      },
      { title: "服務變更與中斷", body: <p>因維護、系統異常或營運需要，營運方得變更或暫停部分或全部服務。</p> },
      { title: "免責聲明", body: <p>對於天災、外部AI或主機服務異常所致之損害，以及使用者依AI回覆所做決定之後果，營運方概不負責。</p> },
      { title: "準據法", body: <p>本條款以大韓民國法律為準據法。</p> },
      {
        title: "營運資訊與聯絡方式",
        body: (
          <>
            <p>服務名稱：茶盞塔羅（teacuptarot.com）</p>
            <p>營運單位：YJ Studio</p>
            <p>電子郵件：<a className="underline" href="mailto:contact@yjstudio.app">contact@yjstudio.app</a></p>
          </>
        ),
      },
    ],
  },
};

export const PRIVACY_I18N: Partial<Record<SupportedLang, LegalContent>> = {
  en: {
    title: "Privacy Policy",
    updated: "Nov 27, 2026",
    sections: [
      {
        title: "Information We Collect",
        body: (
          <ul className="list-disc pl-5">
            <li>No sign-up is needed, so we do not collect your name, email, or phone number to use readings.</li>
            <li>Reading data: the question you write, the cards drawn, and your chat messages.</li>
            <li>Automatic data: a temporary token for daily limits, access time, device/browser info, and cookies used for web ads.</li>
          </ul>
        ),
      },
      {
        title: "How We Use It",
        body: (
          <ul className="list-disc pl-5">
            <li>Generating AI tarot replies and continuing your reading</li>
            <li>Managing daily free limits and preventing abuse</li>
            <li>Maintaining stability, improving quality, and showing web ads</li>
          </ul>
        ),
      },
      {
        title: "Retention & Deletion",
        body: (
          <>
            <p>Guest readings are stored temporarily only in your own browser/device and are deleted right away if you clear browser data.</p>
            <p>Server access logs are kept for 3 months under applicable law and then deleted.</p>
          </>
        ),
      },
      {
        title: "Third-Party Processors & International Transfer",
        body: (
          <>
            <p>We rely on the following service providers:</p>
            <ul className="list-disc pl-5">
              <li>Hosting & Security: Cloudflare (global edge servers including the US)</li>
              <li>Database: Supabase (cloud servers outside Korea)</li>
              <li>AI Replies: Google Gemini and AI model providers (servers outside Korea)</li>
              <li>Web Ads: Google AdSense (cookie-based personalized or non-personalized ads)</li>
            </ul>
            <p>Your question and drawn cards are sent over encrypted HTTPS to AI servers only when generating a reply. No personal identifiers are attached.</p>
          </>
        ),
      },
      { title: "Sharing with Others", body: <p>We do not share your information with third parties except with your consent or as required by law.</p> },
      {
        title: "Your Choices",
        body: (
          <div className="space-y-1.5">
            <p>You can clear browser storage and cookies anytime, or turn off ad personalization.</p>
            <p>
              Manage personalized ads in{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Google Ad Settings
              </a>
              , and learn more in{" "}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Google's Advertising Policy
              </a>
              .
            </p>
          </div>
        ),
      },
      { title: "Security", body: <p>All traffic is encrypted via HTTPS, and guest usage tokens are protected with server-side signatures.</p> },
      { title: "Children Under 14", body: <p>We do not knowingly collect personal information from children under 14.</p> },
      { title: "Contact", body: <p>Operator: YJ Studio · Email: contact@yjstudio.app</p> },
    ],
  },
  ja: {
    title: "プライバシーポリシー",
    updated: "2026年11月27日",
    sections: [
      {
        title: "収集する情報",
        body: (
          <ul className="list-disc pl-5">
            <li>会員登録やログインは不要のため、氏名・メールアドレス・電話番号などの個人情報は収集しません。</li>
            <li>占いの利用：入力されたお悩み、引いたカード、チャットの内容</li>
            <li>自動収集：1日の利用回数確認用の一時トークン、アクセス日時、端末・ブラウザ情報、広告配信用のCookie</li>
          </ul>
        ),
      },
      {
        title: "利用目的",
        body: (
          <ul className="list-disc pl-5">
            <li>AIタロットの回答生成およびチャットの継続</li>
            <li>1日の無料利用回数の管理および不正利用の防止</li>
            <li>サービスの安定運用、品質改善、ウェブ広告の配信</li>
          </ul>
        ),
      },
      {
        title: "保管期間と削除",
        body: (
          <>
            <p>登録なしで行う占いの会話は、お使いのブラウザや端末内にのみ一時保存され、ブラウザデータを消去するとすぐに削除されます。</p>
            <p>サーバーのアクセス記録は法令に基づき3か月間保管したのち速やかに削除します。</p>
          </>
        ),
      },
      {
        title: "外部委託と国外移転",
        body: (
          <>
            <p>本サービスの運営にあたり、以下の外部事業者に業務を委託しています。</p>
            <ul className="list-disc pl-5">
              <li>ホスティング・セキュリティ：Cloudflare（米国等のグローバルサーバー）</li>
              <li>データ管理：Supabase（国外クラウドサーバー）</li>
              <li>AI回答生成：Google Gemini等のAI提供事業者（国外サーバー）</li>
              <li>ウェブ広告：Google AdSense（Cookieを利用した広告配信）</li>
            </ul>
            <p>AIが回答を作成する際、お悩みとカード情報は暗号化通信（HTTPS）でAIサーバーへ送信されますが、個人を特定する情報は含まれません。</p>
          </>
        ),
      },
      { title: "第三者提供", body: <p>利用者の同意がある場合や法令に基づく場合を除き、情報を第三者に提供しません。</p> },
      {
        title: "利用者の権利",
        body: (
          <div className="space-y-1.5">
            <p>ブラウザの保存データやCookieはいつでも削除でき、広告のパーソナライズ設定もオフにできます。</p>
            <p>
              パーソナライズ広告の設定は{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Google広告設定
              </a>
              から変更でき、Cookieの取り扱いは{" "}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Google広告ポリシー
              </a>
              で確認できます。
            </p>
          </div>
        ),
      },
      { title: "安全管理措置", body: <p>すべての通信はHTTPSで暗号化し、利用回数確認トークンはサーバー署名により保護しています。</p> },
      { title: "14歳未満の利用", body: <p>本サービスは14歳未満のお子様から個人情報を収集しません。</p> },
      { title: "お問い合わせ", body: <p>運営：YJスタジオ · メール：contact@yjstudio.app</p> },
    ],
  },
  "zh-TW": {
    title: "隱私權政策",
    updated: "2026年11月27日",
    sections: [
      {
        title: "蒐集之資訊",
        body: (
          <ul className="list-disc pl-5">
            <li>本服務免註冊即可使用，不會蒐集姓名、電子郵件或電話號碼等可直接識別身分的個人資料。</li>
            <li>占卜使用：您輸入的煩惱內容、抽出的牌面及對話內容</li>
            <li>自動蒐集：確認每日使用次數的暫存憑證、連線時間、裝置與瀏覽器資訊，以及網頁廣告所需之 Cookie</li>
          </ul>
        ),
      },
      {
        title: "使用目的",
        body: (
          <ul className="list-disc pl-5">
            <li>生成AI塔羅回覆與延續對話</li>
            <li>管理每日免費使用次數及防止異常使用</li>
            <li>維持服務穩定、改善品質及提供網頁廣告</li>
          </ul>
        ),
      },
      {
        title: "保存期限與刪除",
        body: (
          <>
            <p>免登入之占卜對話僅暫存於您的個人瀏覽器與裝置中，清除瀏覽器資料即可立即刪除。</p>
            <p>伺服器連線紀錄依法令規定保存3個月後立即銷毀。</p>
          </>
        ),
      },
      {
        title: "委外處理與跨境傳輸",
        body: (
          <>
            <p>為維持服務運作，我們使用以下外部服務：</p>
            <ul className="list-disc pl-5">
              <li>網站代管與防護：Cloudflare（美國等全球邊緣伺服器）</li>
              <li>資料儲存：Supabase（境外雲端伺服器）</li>
              <li>AI回覆生成：Google Gemini 等AI模型服務商（境外伺服器）</li>
              <li>網頁廣告：Google AdSense（基於 Cookie 之個人化或非個人化廣告）</li>
            </ul>
            <p>生成AI回覆時，您的煩惱與牌面資訊將透過加密連線（HTTPS）傳送至AI伺服器，不會夾帶可識別您身分的個人資料。</p>
          </>
        ),
      },
      { title: "第三方提供", body: <p>除經您同意或依法令要求外，我們不會將資訊提供給第三方。</p> },
      {
        title: "您的權利",
        body: (
          <div className="space-y-1.5">
            <p>您隨時可以清除瀏覽器儲存空間與 Cookie，或關閉廣告個人化設定。</p>
            <p>
              您可在{" "}
              <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Google 廣告設定
              </a>
              調整個人化廣告，並於{" "}
              <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                Google 廣告政策
              </a>
              瞭解 Cookie 使用方式。
            </p>
          </div>
        ),
      },
      { title: "安全措施", body: <p>所有傳輸皆採用 HTTPS 加密，使用次數驗證憑證亦受伺服器簽章保護。</p> },
      { title: "未滿14歲使用者", body: <p>本服務不會針對未滿14歲兒童蒐集個人資料。</p> },
      { title: "聯絡窗口", body: <p>營運單位：YJ Studio · 電子郵件：contact@yjstudio.app</p> },
    ],
  },
};
