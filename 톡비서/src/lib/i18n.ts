// 경량 다국어: 한국어 원문을 키로 쓰고 영어/일본어 번역을 매핑한다 (번역이 없으면 원문 표시).
import { useSyncExternalStore } from "react";

export const LANGS = ["ko", "en", "ja"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { ko: "한국어", en: "English", ja: "日本語" };
export const LOCALE: Record<Lang, string> = { ko: "ko-KR", en: "en-US", ja: "ja-JP" };
const KEY = "talk.lang";

// [ko, en, ja]
const D: [string, string, string][] = [
  ["톡비서", "TalkSec", "トーク秘書"],
  ["채팅", "Chat", "チャット"],
  ["캘린더", "Calendar", "カレンダー"],
  ["설정", "Settings", "設定"],
  ["서류함 여는 중...", "Opening your drawer...", "書類箱を開いています..."],
  ["아직 비어 있어요", "Nothing here yet", "まだ空っぽです"],
  ["스크린샷, 메모, 링크를 그냥 던져 주세요. 날짜가 있으면 제가 미리 챙겨 드릴게요.", "Just toss in screenshots, notes, or links. If there's a date, I'll remind you ahead of time.", "スクショ・メモ・リンクをポイッと投げてください。日付があれば先にお知らせします。"],
  ["비서가 서류함을 뒤지는 중...", "Digging through your drawer...", "書類箱を探しています..."],
  ["스샷 속 글자를 읽는 중...", "Reading text in the screenshot...", "スクショの文字を読んでいます..."],
  ["날짜를 챙기는 중...", "Checking dates...", "日付を確認しています..."],
  ["채팅창을 지금 모두 비울까요?", "Clear the whole chat now?", "チャットを今すべて消しますか？"],
  ["저장된 메모와 캘린더는 그대로 남아요", "Saved notes and calendar stay as they are", "保存したメモとカレンダーはそのまま残ります"],
  ["비우기", "Clear", "消す"],
  ["취소", "Cancel", "キャンセル"],
  ["완료", "Done", "完了"],
  ["녹음 중", "Recording", "録音中"],
  ["첨부 메뉴", "Attach menu", "添付メニュー"],
  ["스샷 첨부", "Attach screenshot", "スクショを添付"],
  ["사진 촬영", "Take photo", "写真を撮る"],
  ["음성 녹음", "Voice memo", "音声録音"],
  ["파일 첨부 · PDF·워드·PPT", "Attach file · PDF·Word·PPT", "ファイル添付 · PDF·Word·PPT"],
  ["파일 첨부 · 문서·모든 파일", "Attach file · Docs·All files", "ファイル添付 · 文書・すべて"],
  ["메모, 링크, 스샷을 던져 주세요", "Toss a note, link, or screenshot", "メモ・リンク・スクショをどうぞ"],
  ["메모, 링크, 스샷을 던져 주세요 (붙여넣기 가능)", "Toss a note, link, or screenshot (paste works)", "メモ・リンク・スクショを投げてください（貼り付けOK）"],
  ["녹음 취소", "Cancel recording", "録音をキャンセル"],
  ["받아쓰기 끝내기", "Stop dictation", "音声入力を終了"],
  ["말로 입력하기", "Dictate", "声で入力"],
  ["보내기", "Send", "送信"],
  ["첨부 미리보기", "Attachment preview", "添付プレビュー"],
  ["첨부 취소", "Remove attachment", "添付を取り消す"],
  ["여기에 놓으면 바로 정리해요", "Drop here and I'll sort it", "ここにドロップすればすぐ整理します"],
  ["복사", "Copy", "コピー"],
  ["복사됨", "Copied", "コピー済み"],
  ["원문 복사", "Copy text", "原文をコピー"],
  ["요약 복사", "Copy summary", "要約をコピー"],
  ["고정", "Pin", "固定"],
  ["고정됨", "Pinned", "固定中"],
  ["고정 해제", "Unpin", "固定解除"],
  ["상단 고정", "Pin to top", "上部に固定"],
  ["접기 ▲", "Collapse ▲", "閉じる ▲"],
  ["고정 {0}개 모두 보기 ▼", "Show all {0} pinned ▼", "固定 {0}件をすべて表示 ▼"],
  ["카테고리 {0}개 모두 보기 ▼", "Show all {0} categories ▼", "カテゴリ{0}件をすべて表示 ▼"],
  ["문서 · {0}자", "Document · {0} chars", "文書 · {0}文字"],
  ["내용 보기 ▼", "Show content ▼", "内容を見る ▼"],
  ["원본 받기", "Download original", "原本をダウンロード"],
  ["... 더보기", "... more", "... もっと見る"],
  ["보낸 스크린샷", "Sent screenshot", "送ったスクショ"],
  ["저장된 스크린샷", "Saved screenshot", "保存したスクショ"],
  ["음성 메모", "Voice memo", "音声メモ"],
  ["음성 메모 듣는 중...", "Listening to voice memo...", "音声メモを聞いています..."],
  ["이대로 저장할까요?", "Save it like this?", "このまま保存しますか？"],
  ["(\"그래\"라고 답해도 돼요)", "(you can just say \"yes\")", "（「はい」と答えてもOK）"],
  ["저장", "Save", "保存"],
  ["버리기", "Discard", "捨てる"],
  ["톡비서 · 찾아봤어요", "TalkSec · Looked it up", "トーク秘書 · 探しました"],
  ["메모 {0}건, 모두 보여드릴까요?", "{0} notes — show them all?", "メモ{0}件、すべて表示しますか？"],
  ["▲ 목록 접기", "▲ Hide list", "▲ リストを閉じる"],
  ["메모 {0}건 모두 보기", "Show all {0} notes", "メモ{0}件をすべて見る"],
  ["{0}에 잊지 않게 챙겨드릴게요", "I'll remind you on {0}", "{0}にお知らせしますね"],
  ["알림을 전해드렸어요 ({0})", "Reminder sent ({0})", "リマインドしました（{0}）"],
  ["삭제된 메모예요", "This note was deleted", "削除されたメモです"],
  ["스샷", "Screenshot", "スクショ"],
  ["메모", "Note", "メモ"],
  // errors
  ["이미지를 읽지 못했어요", "Couldn't read the image", "画像を読み込めませんでした"],
  ["저장하지 못했어요", "Couldn't save", "保存できませんでした"],
  ["지우지 못했어요", "Couldn't delete", "削除できませんでした"],
  ["채팅창을 비우지 못했어요", "Couldn't clear the chat", "チャットを消せませんでした"],
  ["찾다가 문제가 생겼어요. 다시 물어봐 주세요", "Something went wrong while searching. Please ask again", "検索中に問題が起きました。もう一度聞いてください"],
  ["앗, 정리하다 문제가 생겼어요. 다시 던져 주세요", "Oops, something went wrong. Please toss it again", "整理中に問題が起きました。もう一度投げてください"],
  ["아직 PDF·워드·PPT·텍스트 문서만 읽을 수 있어요 (한글·엑셀은 준비 중)", "Only PDF, Word, PPT and text files for now (Excel coming soon)", "現在はPDF・Word・PPT・テキストのみ対応です（Excelは準備中）"],
  ["본문 글자를 읽을 수 없는 파일이라 원본 파일만 안전하게 보관했어요", "Couldn't read text from this file type, so I saved the original file safely", "本文を読み取れない形式のため、原本ファイルのみ安全に保管しました"],
  ["내용을 읽을 수 없는 파일 형식이라 원본 파일만 보관했어요.", "Saved original file only (text could not be extracted).", "本文を読み取れない形式のため原本ファイルのみ保管しました。"],
  ["문서에서 글자를 찾지 못했어요", "No text found in the document", "文書に文字が見つかりませんでした"],
  ["원본 파일을 보관하지 못했어요", "Couldn't store the original file", "原本ファイルを保管できませんでした"],
  ["문서를 읽지 못했어요", "Couldn't read the document", "文書を読み込めませんでした"],
  ["이 브라우저는 말로 입력을 지원하지 않아요. + 메뉴의 음성 녹음을 써 주세요", "This browser doesn't support dictation. Use Voice memo in the + menu", "このブラウザは音声入力に未対応です。+メニューの音声録音を使ってください"],
  ["마이크 권한을 허용해 주세요", "Please allow microphone access", "マイクの許可をお願いします"],
  ["녹음이 너무 짧아요. 다시 시도해 주세요", "Recording too short. Please try again", "録音が短すぎます。もう一度お試しください"],
  ["녹음된 말이 없어요. 다시 말씀해 주세요", "I didn't hear anything. Please try again", "声が録音されていません。もう一度どうぞ"],
  ["음성 메모를 정리하지 못했어요. 다시 시도해 주세요", "Couldn't process the voice memo. Please try again", "音声メモを整理できませんでした。もう一度お試しください"],
  ["파일 하나는 최대 20MB까지 올릴 수 있어요", "Each file can be up to 20MB", "1ファイル最大20MBまでです"],
  ["무료 회원은 파일 하나당 최대 20MB까지 올릴 수 있어요 (프리미엄 50MB)", "Free plan allows up to 20MB per file (50MB on Premium)", "無料プランは1ファイル最大20MBまでです（プレミアム50MB）"],
  ["파일 하나는 최대 50MB까지 올릴 수 있어요", "Each file can be up to 50MB", "1ファイル最大50MBまでです"],
  ["파일 1개당 최대 20MB (프리미엄 50MB)", "Up to 20MB per file (50MB on Premium)", "1ファイル最大20MB（プレミアム50MB）"],
  ["파일 1개당 최대 50MB", "Up to 50MB per file", "1ファイル最大50MB"],
  ["무료 체험 7일이 끝났어요. 프리미엄으로 업그레이드하면 계속 보관할 수 있어요", "Your 7-day free trial has ended. Upgrade to Premium to keep storing", "7日間の無料体験が終了しました。プレミアムで引き続き保管できます"],
  ["무료 보관함 100MB가 가득 찼어요. 프리미엄으로 20GB를 써보세요", "Free 100MB storage is full. Try 20GB with Premium", "無料の100MBがいっぱいです。プレミアムで20GBをどうぞ"],
  ["오늘 무료 AI 정리 20회를 모두 썼어요. 프리미엄(하루 50회)으로 업그레이드해 보세요", "Used all 20 free AI sorts today. Upgrade to Premium (50/day)", "本日の無料AI整理20回を使い切りました。プレミアム(1日50回)をお試しください"],
  ["오늘 AI 정리 50회(공정 사용)를 모두 썼어요. 내일 다시 이용해 주세요", "Used all 50 AI sorts (fair use) today. Please try again tomorrow", "本日のAI整理50回(公正利用)を使い切りました。明日またご利用ください"],
  ["보관함이 가득 찼어요. 안 쓰는 파일을 지워 주세요", "Storage is full. Please delete unused files", "保管箱がいっぱいです。不要なファイルを削除してください"],
  // off-topic
  ["저는 톡비서예요. 실시간 웹검색은 서툴지만, 저장해주신 메모 검색·정리는 자신 있어요. 화면을 캡처하거나 링크로 툭 던져주시면 깔끔하게 보관해 드릴게요.", "I'm TalkSec. I'm not great at live web search, but I'm great at finding and organizing your saved notes. Toss me a screenshot or link and I'll keep it tidy.", "トーク秘書です。リアルタイムのWeb検索は苦手ですが、保存したメモの検索・整理は得意です。スクショやリンクを投げてくれればきれいに保管します。"],
  ["저는 톡비서예요. 표 작성이나 문서 창작은 서툴지만, 던져주신 메모 정리와 검색은 전문이에요.", "I'm TalkSec. I'm not great at writing tables or documents, but organizing and finding your notes is my specialty.", "トーク秘書です。表や文章の作成は苦手ですが、メモの整理と検索は専門です。"],
  ["저는 톡비서예요. 일상 잡담이나 역할놀이는 서툴지만, 저장해주신 메모 정리·검색·알림 수정은 자신 있어요. 뭐든 툭 던져 주세요.", "I'm TalkSec. I'm not great at small talk or role-play, but I'm great at organizing, finding, and reminding. Toss me anything.", "トーク秘書です。雑談やロールプレイは苦手ですが、メモの整理・検索・リマインドは得意です。何でも投げてください。"],
  ["저는 초간편 AI 톡비서예요. 스크린샷·링크·메모를 툭 던져주시면 알아서 분류하고, 필요할 때 쏙쏙 찾아드리고, 중요한 날짜는 먼저 챙겨드려요.", "I'm TalkSec, your super-simple AI assistant. Toss me screenshots, links, or notes — I'll sort them, find them when you need them, and remind you of important dates.", "超かんたんAIのトーク秘書です。スクショ・リンク・メモを投げれば自動で分類し、必要な時にすぐ探し、大事な日付は先にお知らせします。"],
  // calendar
  ["이전 달", "Previous month", "前の月"],
  ["다음 달", "Next month", "次の月"],
  ["닫기", "Close", "閉じる"],
  ["{0}에 던진 것", "Tossed on {0}", "{0}に投げたもの"],
  ["이 날은 던진 게 없어요", "Nothing tossed this day", "この日は何もありません"],
  ["{0}건", "{0}", "{0}件"],
  ["지금까지 던진 것", "Everything so far", "これまで投げたもの"],
  ["총 {0}건", "{0} total", "合計{0}件"],
  ["아직 던진 게 없어요", "Nothing tossed yet", "まだ何もありません"],
  ["스샷", "Screenshot", "スクショ"],
  ["링크", "Link", "リンク"],
  ["음성", "Voice", "音声"],
  ["문서", "Doc", "文書"],
  // categories
  ["일정", "Schedule", "予定"],
  ["쇼핑", "Shopping", "買い物"],
  ["아이디어", "Ideas", "アイデア"],
  ["공부", "Study", "勉強"],
  ["금융", "Finance", "お金"],
  ["맛집", "Food", "グルメ"],
  ["할일", "To-Do", "やること"],
  ["기타", "Other", "その他"],
  // plans
  ["무료 사용자", "Free", "無料"],
  ["무료", "Free", "無料"],
  ["프리미엄", "Premium", "プレミアム"],
  ["평생 소장", "Lifetime", "永久版"],
  ["하루 AI 자동 정리 20회", "20 AI sorts per day", "AI自動整理 1日20回"],
  ["기본 카테고리 7개", "7 default categories", "基本カテゴリー7個"],
  ["7일 무료 체험 · 보관함 100MB", "7-day free trial · 100MB storage", "7日間無料体験 · 保管100MB"],
  ["AI 정리 무제한 (공정 사용)", "Unlimited AI sorting (fair use)", "AI整理無制限（公正利用）"],
  ["스샷·문서 정밀 분석", "Detailed screenshot & document analysis", "スクショ・文書の精密分析"],
  ["나만의 카테고리 10개", "10 custom categories", "マイカテゴリー10個"],
  ["선제적 일정 알림", "Proactive schedule reminders", "先回りの予定通知"],
  ["하루 AI 자동 정리 50회 (공정 사용)", "50 AI sorts/day (fair use)", "AI自動整理 1日50回（公正利用）"],
  ["보관함 20GB · 원본 파일 보관", "20GB storage · keep original files", "保管20GB · 原本ファイル保管"],
  ["하루 50회*", "50/day*", "1日50回*"],
  ["월 4,900원", "₩4,900/mo", "月4,900ウォン"],
  ["20GB", "20GB", "20GB"],
  ["기본 8개", "8 built-in", "基本8個"],
  ["* 공정 사용 기준 (하루 최대 50회)", "* Fair use limit (up to 50/day)", "* 公正利用基準（1日最大50回）"],
  ["프리미엄 기능 평생 이용", "Premium features forever", "プレミアム機能を永久に利用"],
  ["한 번 결제, 추가 비용 없음", "Pay once, no extra cost", "一度の支払いで追加費用なし"],
  ["나만의 카테고리 30개", "30 custom categories", "マイカテゴリー30個"],
  ["얼리버드 전용 뱃지", "Early-bird badge", "アーリーバード専用バッジ"],
  ["보관함 30GB", "30GB storage", "保管30GB"],
  ["가격", "Price", "価格"],
  ["7일 무료", "7 days free", "7日間無料"],
  ["월 4,900원\n연 39,000원", "₩4,900/mo\n₩39,000/yr", "月4,900ウォン\n年39,000ウォン"],
  ["89,000원 1회", "₩89,000 once", "89,000ウォン 1回"],
  ["AI 자동 정리", "AI sorting", "AI自動整理"],
  ["하루 20회", "20/day", "1日20回"],
  ["무제한*", "Unlimited*", "無制限*"],
  ["카테고리", "Categories", "カテゴリー"],
  ["수정", "Edit", "編集"],
  ["보기", "View", "表示"],
  ["삭제", "Delete", "削除"],
  ["원본", "Original", "原本"],
  ["확대", "Zoom in", "拡大"],
  ["축소", "Zoom out", "縮小"],
  ["삭제할까요?", "Delete this?", "削除しますか？"],
  ["키워드", "Keywords", "キーワード"],
  ["띄어쓰기나 쉼표로 구분", "Separate with spaces or commas", "スペースやカンマで区切る"],
  ["기본 7개", "7 default", "基本7個"],
  ["+ 나만의 10개", "+ 10 custom", "+ マイ10個"],
  ["+ 나만의 30개", "+ 30 custom", "+ マイ30個"],
  ["보관함", "Storage", "保管箱"],
  ["원본 파일 받기", "Download originals", "原本ダウンロード"],
  ["일정 미리 알림", "Early reminders", "予定の事前通知"],
  ["이용 기간", "Duration", "利用期間"],
  ["가입 후 7일", "7 days after signup", "登録後7日"],
  ["구독 중", "While subscribed", "購読中"],
  ["평생", "Forever", "永久"],
  ["* 공정 사용 범위 안에서 무제한", "* Unlimited within fair use", "* 公正利用の範囲で無制限"],
  ["월간 구독", "Monthly", "月額プラン"],
  ["연간 구독", "Yearly", "年額プラン"],
  ["4,900원", "₩4,900", "4,900ウォン"],
  ["39,000원", "₩39,000", "39,000ウォン"],
  ["89,000원", "₩89,000", "89,000ウォン"],
  ["/월", "/mo", "/月"],
  ["/년", "/yr", "/年"],
  [" 1회", " once", " 1回"],
  ["카카오페이", "KakaoPay", "カカオペイ"],
  ["토스페이", "TossPay", "トスペイ"],
  ["신용/체크카드", "Card", "カード"],
  ["결제하기", "Checkout", "お支払い"],
  ["테스트", "Test", "テスト"],
  ["결제 완료!", "Payment complete!", "お支払い完了！"],
  ["{0}이(가) 적용되었어요.", "{0} is now active.", "{0}が適用されました。"],
  ["확인", "OK", "OK"],
  ["플랜별 차이 보기", "Compare plans", "プランの違いを見る"],
  ["결제 수단", "Payment method", "支払い方法"],
  ["결제 진행 중...", "Processing...", "処理中..."],
  ["{0} 결제하기", "Pay {0}", "{0}を支払う"],
  ["목업 결제창이에요. 실제로 돈이 나가지 않아요.", "This is a mock checkout. No real charge.", "これはモックの決済画面です。実際には請求されません。"],
  // custom categories
  ["이미 있는 카테고리예요", "That category already exists", "すでにあるカテゴリーです"],
  ["최대 {0}개까지 만들 수 있어요", "You can create up to {0}", "最大{0}個まで作れます"],
  ["추가하지 못했어요", "Couldn't add", "追加できませんでした"],
  ["나만의 카테고리는 프리미엄 혜택이에요", "Custom categories are a Premium perk", "マイカテゴリーはプレミアム特典です"],
  ["학습 · 사업 · 육아 처럼 만들면 AI가 알아서 그 칸으로 분류해요", "Create ones like Study · Work · Kids and AI will sort into them", "勉強・仕事・育児のように作るとAIが自動で分類します"],
  ["나만의 카테고리", "My categories", "マイカテゴリー"],
  ["{0} 삭제", "Delete {0}", "{0}を削除"],
  ["이름 (예: 학습)", "Name (e.g. Study)", "名前（例：勉強）"],
  ["AI 힌트 (선택) 단어 입력 후 스페이스", "AI hint (optional): type words & space", "AIヒント（任意）単語を入力後スペース"],
  ["카테고리 추가", "Add category", "カテゴリー追加"],
  ["다음에 던지는 것부터 AI가 이 카테고리로도 분류해요", "From your next toss, AI will sort into these too", "次に投げたものからAIがこのカテゴリーにも分類します"],
  // settings
  ["카카오 옐로우", "Kakao Yellow", "カカオイエロー"],
  ["민트", "Mint", "ミント"],
  ["핑크", "Pink", "ピンク"],
  ["스카이", "Sky", "スカイ"],
  ["뒤로", "Back", "戻る"],
  ["내 가입 정보", "My account", "アカウント情報"],
  ["가입일 {0}", "Joined {0}", "登録日 {0}"],
  ["로그아웃", "Log out", "ログアウト"],
  ["결제 정보", "Billing", "お支払い情報"],
  ["현재 플랜", "Current plan", "現在のプラン"],
  ["이용 중", "Active", "利用中"],
  ["플랜별 혜택 한눈에 비교", "Compare plan benefits", "プラン特典を比較"],
  ["프리미엄으로 업그레이드", "Upgrade to Premium", "プレミアムにアップグレード"],
  ["평생 소장으로 변경", "Switch to Lifetime", "永久版に変更"],
  ["무료로 되돌리기 (테스트)", "Revert to Free (test)", "無料に戻す（テスト）"],
  ["카테고리 관리", "Categories", "カテゴリー管理"],
  ["내 보관함", "My storage", "保管箱"],
  ["{0} / {1} 사용 중", "{0} / {1} used", "{0} / {1} 使用中"],
  ["무료 체험 {0}일 남았어요 (7일 · 100MB)", "{0} days left in free trial (7 days · 100MB)", "無料体験 残り{0}日（7日 · 100MB）"],
  ["무료 체험 7일이 끝났어요. 업그레이드하면 계속 보관할 수 있어요", "Your 7-day trial ended. Upgrade to keep storing", "7日間の無料体験が終了しました。アップグレードで保管を続けられます"],
  ["파일 1개당 최대 20MB", "Up to 20MB per file", "1ファイル最大20MB"],
  ["알림", "Notifications", "通知"],
  ["일정 미리 챙겨주기 알림", "Early schedule reminders", "予定の事前リマインド"],
  ["앱 테마", "App theme", "アプリテーマ"],
  ["라이트", "Light", "ライト"],
  ["다크", "Dark", "ダーク"],
  ["언어", "Language", "言語"],
  ["AI 답변과 음성 입력도 이 언어로 바뀌어요", "AI replies and voice input switch to this language too", "AIの返答と音声入力もこの言語になります"],
  ["개인정보처리방침", "Privacy Policy", "プライバシーポリシー"],
  ["이용약관", "Terms of Service", "利用規約"],
  ["톡비서 웹 버전 v1.0.0", "TalkSec v1.0.0", "トーク秘書 v1.0.0"],
  ["회원탈퇴", "Delete account", "退会"],
  ["정말 떠나시나요?", "Are you really leaving?", "本当に退会しますか？"],
  ["탈퇴하면 저장된 메모, 캘린더 기록, 대화, 나만의 카테고리, 올린 파일이 모두 바로 지워지고 되돌릴 수 없어요.", "Deleting your account immediately erases all notes, calendar entries, chats, custom categories and files. This can't be undone.", "退会すると、メモ・カレンダー・会話・マイカテゴリー・ファイルがすべて即座に削除され、元に戻せません。"],
  ["계속하려면 {0}라고 입력해 주세요.", "Type {0} to continue.", "続けるには「{0}」と入力してください。"],
  ["탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요", "Couldn't delete the account. Please try again later", "退会できませんでした。しばらくしてからお試しください"],
  ["지우는 중…", "Deleting…", "削除中…"],
  ["탈퇴하기", "Delete", "退会する"],
  // login
  ["던지기만 하세요. 정리는 제가 할게요.", "Just toss it in. I'll keep it organized.", "ポイッと投げるだけ。整理はおまかせ。"],
  ["이메일", "Email", "メールアドレス"],
  ["비밀번호", "Password", "パスワード"],
  ["로그인", "Log in", "ログイン"],
  ["회원가입", "Sign up", "新規登録"],
  ["Google로 계속하기", "Continue with Google", "Googleで続ける"],
  ["Google로 1초 만에 시작하기", "Start in 1 sec with Google", "Googleで1秒スタート"],
  ["이메일로 로그인 · 가입", "Sign in or sign up with email", "メールでログイン・登録"],
  ["처음이신가요? ", "New here? ", "はじめてですか？ "],
  ["이미 계정이 있나요? ", "Already have an account? ", "アカウントをお持ちですか？ "],
  ["확인 메일을 보냈어요. 메일의 링크를 눌러 주세요", "We sent a confirmation email. Please click the link", "確認メールを送りました。リンクをクリックしてください"],
  ["구글 로그인에 실패했어요", "Google sign-in failed", "Googleログインに失敗しました"],
  ["구글 로그인 화면으로 이동 중...", "Redirecting to Google sign-in...", "Googleログイン画面へ移動中..."],
  ["복사한 링크를 바로 정리할까요?", "Organize copied link now?", "コピーしたリンクをすぐ整理しますか？"],
  ["바로 던지기", "Send now", "すぐ送る"],
  ["구독·보관함", "Plan & Storage", "プラン・保管"],
  ["정리·알림", "Sort & Alerts", "整理・通知"],
  ["화면·계정", "Display & Account", "画面・アカウント"],
  ["맨 아래로", "Scroll to bottom", "一番下へ"],
  ["눌러서 바로 체험해 보세요", "Tap to try right away", "タップしてすぐ試せます"],
  ["내일 오전 10시 회의 9시에 알려줘", "Remind me at 9am for tomorrow's 10am meeting", "明日の午前10時の会議を9時に教えて"],
  ["장보기: 우유, 계란, 커피", "Groceries: milk, eggs, coffee", "買い物：牛乳、卵、コーヒー"],
  ["이번 달 던진 메모 보여줘", "Show notes saved this month", "今月保存したメモを見せて"],
  ["톡비서 알림", "TalkSec reminder", "トーク秘書のお知らせ"],
  // server fallbacks
  ["아직 서류함이 비어 있어요. 먼저 뭐든 던져 주세요", "Your drawer is empty. Toss something in first", "書類箱はまだ空です。まず何か投げてください"],
  ["관련 메모를 찾지 못했어요", "Couldn't find a related note", "関連するメモが見つかりませんでした"],
  ["아직 고칠 메모가 없어요. 먼저 뭐든 던져 주세요", "No notes to edit yet. Toss something in first", "まだ編集するメモがありません。まず何か投げてください"],
  ["저는 톡비서예요. 메모 정리·검색·알림 수정을 도와드릴게요!", "I'm TalkSec. I can help organize, find, and adjust reminders!", "トーク秘書です。メモの整理・検索・通知の変更をお手伝いします！"],
  ["저는 톡비서예요. 메모 정리·검색·알림을 도와드릴게요!", "I'm TalkSec. I can help organize, find, and remind!", "トーク秘書です。メモの整理・検索・通知をお手伝いします！"],
  ["어떤 부분을 고칠지 잘 모르겠어요. 예: \"알람은 화요일 오전 10시로\"", "Not sure what to change. e.g. \"set the alarm to Tuesday 10am\"", "どこを直すかわかりませんでした。例：「通知は火曜の午前10時に」"],
  ["말씀하신 대로 고쳐 두었어요", "Updated as you asked", "おっしゃる通りに直しました"],
  ["알겠어요! 잘 챙겨둘게요", "Got it! I'll keep it safe", "了解です！しっかり保管します"],
];

const MAP: Record<string, [string, string]> = Object.fromEntries(D.map(([k, e, j]) => [k, [e, j]]));

let current: Lang = "ko";
const subs = new Set<() => void>();

export function getLang(): Lang { return current; }
export function detectLang(): Lang {
  try {
    const s = localStorage.getItem(KEY);
    if (s && (LANGS as readonly string[]).includes(s)) return s as Lang;
    const n = (navigator.language || "ko").slice(0, 2);
    return n === "ja" ? "ja" : n === "ko" ? "ko" : "en";
  } catch { return "ko"; }
}
export function setLang(l: Lang, persist = true) {
  current = l;
  if (typeof document !== "undefined") document.documentElement.lang = l;
  if (persist) { try { localStorage.setItem(KEY, l); } catch { /* ignore */ } }
  subs.forEach((f) => f());
}
/** 앱 시작 시 한 번 (useEffect 안에서) 호출 */
export function syncClientLang() { if (typeof window !== "undefined") setLang(detectLang(), false); }

/** 번역: 한국어 원문 키, {0} {1} 치환 */
export function trL(lang: Lang, ko: string, ...args: (string | number)[]): string {
  const m = MAP[ko];
  let s = lang === "ko" || !m ? ko : lang === "en" ? m[0] : m[1];
  args.forEach((a, i) => { s = s.split(`{${i}}`).join(String(a)); });
  return s;
}
export const t = (ko: string, ...args: (string | number)[]) => trL(current, ko, ...args);
export const locale = () => LOCALE[current];

/** 언어 변경 시 컴포넌트를 다시 그리게 한다 */
export function useLang(): Lang {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => { subs.delete(f); }; },
    () => current,
    () => "ko" as Lang,
  );
}

/** AI 프롬프트에 덧붙일 출력 언어 지시 (카테고리 값은 한국어 키 그대로 유지) */
export function aiLangRule(lang: Lang): string {
  if (lang === "ko") return "";
  const name = lang === "en" ? "English" : "Japanese (polite 丁寧語)";
  const self = lang === "en" ? "TalkSec" : "トーク秘書";
  return `\n\n[OUTPUT LANGUAGE] The user uses ${name}. Write ALL user-facing text (summary, reply, answer, remind_message, tags, secretary_reply) in ${name}, and call yourself "${self}" instead of 톡비서. Keep "category" values EXACTLY as the given Korean enum strings and keep JSON keys/action values unchanged.`;
}
