import { DAILY_MESSAGES, type TarotCard } from "./tarot";
import type { SupportedLang } from "./i18n";

type CardText = { name: string; keywords: string; message: string };

// 22장 메이저 카드의 나라별 표준 이름 · 키워드 · 오늘의 메시지 (한국어 원문은 tarot.ts의 DECK / DAILY_MESSAGES)
const EN: CardText[] = [
  { name: "The Fool", keywords: "new beginnings, innocence, free spirit", message: "Travel light and luck tends to follow. Try something you've never done before today." },
  { name: "The Magician", keywords: "willpower, creativity, making it happen", message: "You already have what you need. A good day to start the thing you've been putting off." },
  { name: "The High Priestess", keywords: "intuition, inner voice, quiet wisdom", message: "Trust that quiet voice inside. A little stillness will bring the answer." },
  { name: "The Empress", keywords: "abundance, nurturing, warm love", message: "Take good care of yourself today. A warm cup of tea is a fine place for luck to start." },
  { name: "The Emperor", keywords: "stability, responsibility, solid ground", message: "A simple plan keeps the day steady. Pick one small routine and stick to it." },
  { name: "The Hierophant", keywords: "guidance, tradition, faith", message: "Advice from someone you trust can light the way. It's okay to ask first." },
  { name: "The Lovers", keywords: "love, choices, harmony", message: "Go where your heart leans. A good connection is closer than you think." },
  { name: "The Chariot", keywords: "drive, victory, self-control", message: "Full steam ahead. Today, momentum is your lucky charm." },
  { name: "Strength", keywords: "gentle courage, patience, self-belief", message: "Gentleness is its own kind of strength. Laugh it off instead of snapping back, and you win." },
  { name: "The Hermit", keywords: "reflection, solitude, looking inward", message: "Time alone will recharge you. Take a walk and let your thoughts settle." },
  { name: "Wheel of Fortune", keywords: "turning point, flow, cycles of luck", message: "Things are shifting today. An unexpected chance might come knocking." },
  { name: "Justice", keywords: "balance, fairness, cause and effect", message: "Honesty pays off today. Go for the fair, balanced choice." },
  { name: "The Hanged Man", keywords: "pause, new perspective, letting go", message: "It's fine to pause. Look at it from another angle and the answer shows up." },
  { name: "Death", keywords: "endings and beginnings, change, rebirth", message: "Every ending makes room for a beginning. Clear out something old and see what opens up." },
  { name: "Temperance", keywords: "harmony, healing, steady pace", message: "The right pace is the best pace. No need to push. Take it slow." },
  { name: "The Devil", keywords: "attachment, temptation, chains to break", message: "Notice one habit that keeps holding you back. Just noticing it sets you a little freer." },
  { name: "The Tower", keywords: "sudden change, revelation, release", message: "A little shake-up is okay. Something better can be built where things fell apart." },
  { name: "The Star", keywords: "hope, renewal, healing", message: "Hold on to hope. Something small and bright may happen tonight." },
  { name: "The Moon", keywords: "anxiety, the subconscious, a hazy path", message: "Worry is a passing cloud. If you're not sure yet, it can wait until tomorrow." },
  { name: "The Sun", keywords: "joy, success, bright energy", message: "A sunny kind of day. One smile tends to bring another." },
  { name: "Judgement", keywords: "awakening, renewal, a new calling", message: "News you've been waiting for may finally arrive. Keep your heart open." },
  { name: "The World", keywords: "completion, achievement, a cycle closing", message: "Something is coming full circle. Tell yourself you did a good job." },
];

const JA: CardText[] = [
  { name: "愚者", keywords: "新しい始まり・純粋さ・自由な冒険", message: "軽い足取りが幸運を呼びます。今日は初めてのことに挑戦してみて。" },
  { name: "魔術師", keywords: "意志・創造力・可能性の実現", message: "必要な道具は、もう手の中にそろっています。後回しにしていたことを始めるのにぴったりの日。" },
  { name: "女教皇", keywords: "直感・内なる声・静かな知恵", message: "心の奥の小さな声を信じてみましょう。静かな時間が答えをくれます。" },
  { name: "女帝", keywords: "豊かさ・慈しみ・あたたかい愛", message: "今日は自分をたっぷり甘やかしてあげて。温かいお茶一杯から幸運が始まります。" },
  { name: "皇帝", keywords: "安定・責任感・揺るがない土台", message: "予定を決めておくと一日がぶれません。小さな習慣をひとつ守ってみましょう。" },
  { name: "教皇", keywords: "教え・伝統・信頼", message: "信頼できる人のひと言が道を照らしてくれます。自分から聞いてみても大丈夫。" },
  { name: "恋人", keywords: "愛・選択・調和", message: "心が惹かれるほうを選んで。いいご縁がすぐそばまで来ています。" },
  { name: "戦車", keywords: "推進力・勝利・自分を律する力", message: "迷わず前へ！今日は勢いがそのまま幸運になる日です。" },
  { name: "力", keywords: "やさしい勇気・忍耐・自分を信じる心", message: "やわらかさこそ一番の強さ。カッとならずに笑って流せば、それで勝ちです。" },
  { name: "隠者", keywords: "内省・ひとりの時間・心の探求", message: "ひとりの時間がいい充電になります。散歩しながら考えを整理してみて。" },
  { name: "運命の輪", keywords: "転機・流れ・幸運のめぐり", message: "流れが変わる日。思いがけないチャンスが舞い込むかもしれません。" },
  { name: "正義", keywords: "バランス・公平さ・原因と結果", message: "誠実さが報われる日です。偏りのない選択を心がけて。" },
  { name: "吊るされた男", keywords: "ひと休み・新しい視点・手放すこと", message: "少し立ち止まっても大丈夫。角度を変えて見ると、答えが見えてきます。" },
  { name: "死神", keywords: "終わりと始まり・変化・再生", message: "終わりは新しい始まり。古いものを片づけると、心にも余白が生まれます。" },
  { name: "節制", keywords: "調和・癒やし・ちょうどいいペース", message: "ちょうどいいペースが一番の近道。無理せず、ゆっくりいきましょう。" },
  { name: "悪魔", keywords: "執着・誘惑・抜け出したいしがらみ", message: "自分を縛っている癖にひとつ気づいてみて。それだけで少し身軽になれます。" },
  { name: "塔", keywords: "突然の変化・気づき・解放", message: "少し揺れても大丈夫。崩れた場所には、もっといいものが建ちます。" },
  { name: "星", keywords: "希望・回復・癒やし", message: "希望を手放さないで。今夜、星のようにきらっと光る出来事がありそう。" },
  { name: "月", keywords: "不安・無意識・ぼんやりした道", message: "不安は通りすぎる雲のようなもの。はっきりしないことは明日決めましょう。" },
  { name: "太陽", keywords: "喜び・成功・明るいエネルギー", message: "お日さまみたいな一日！笑顔が笑顔を呼ぶ日です。" },
  { name: "審判", keywords: "目覚め・復活・新しい呼びかけ", message: "待ちわびていた知らせが届くかも。心の扉を開けておいてください。" },
  { name: "世界", keywords: "完成・達成・ひと区切り", message: "ひとつの区切りがつきます。自分に「おつかれさま」と言ってあげて。" },
];

const ZH: CardText[] = [
  { name: "愚者", keywords: "新的開始、純真、自由的冒險", message: "輕鬆的腳步會帶來好運。今天不妨試試從沒做過的事。" },
  { name: "魔術師", keywords: "意志、創造力、把可能變成現實", message: "你需要的東西其實都已經在手上了。今天很適合開始那件一直拖著的事。" },
  { name: "女祭司", keywords: "直覺、內在的聲音、安靜的智慧", message: "試著相信心裡那個小小的聲音。安靜下來，答案就會出現。" },
  { name: "皇后", keywords: "豐盛、照顧、溫暖的愛", message: "今天好好寵愛自己吧。一杯熱茶，就是好運的開始。" },
  { name: "皇帝", keywords: "穩定、責任感、穩固的根基", message: "先排好計畫，一整天都會很踏實。試著守住一個小小的習慣。" },
  { name: "教皇", keywords: "指引、傳統、信念", message: "信任的人一句話，可能就是你的指路燈。主動開口問也沒關係。" },
  { name: "戀人", keywords: "愛情、選擇、和諧", message: "跟著心裡的感覺走。好的緣分已經離你不遠了。" },
  { name: "戰車", keywords: "衝勁、勝利、掌控自己", message: "別猶豫，往前衝！今天的衝勁就是你的幸運符。" },
  { name: "力量", keywords: "溫柔的勇氣、耐心、相信自己", message: "溫柔才是最強大的力量。不生氣、一笑置之，你就贏了。" },
  { name: "隱者", keywords: "沉澱、獨處、向內探索", message: "獨處的時間就是充電。出門散散步，讓思緒慢慢沉澱。" },
  { name: "命運之輪", keywords: "轉捩點、流動、好運的循環", message: "今天是風向轉變的一天。意想不到的機會可能會找上門。" },
  { name: "正義", keywords: "平衡、公平、因果", message: "誠實會有回報的一天。試著做出不偏不倚的選擇。" },
  { name: "倒吊人", keywords: "暫停、新的角度、放下", message: "停下來一下也沒關係。換個角度看，答案就出來了。" },
  { name: "死神", keywords: "結束與開始、改變、重生", message: "結束也是新的開始。把舊的東西整理掉，才會空出位置。" },
  { name: "節制", keywords: "調和、療癒、剛剛好的步調", message: "剛剛好的速度就是最好的速度。別勉強，慢慢來。" },
  { name: "惡魔", keywords: "執著、誘惑、該掙脫的枷鎖", message: "試著察覺一個綁住你的習慣。光是發現它，就能輕鬆一點。" },
  { name: "高塔", keywords: "突如其來的改變、頓悟、解脫", message: "有點動搖也沒關係。倒下的地方，會蓋起更好的東西。" },
  { name: "星星", keywords: "希望、復原、療癒", message: "別放棄希望。今晚可能會有像星星一樣閃亮的事發生。" },
  { name: "月亮", keywords: "不安、潛意識、模糊的道路", message: "不安就像飄過的雲。還不確定的事，明天再決定也不遲。" },
  { name: "太陽", keywords: "喜悅、成功、明亮的能量", message: "陽光滿滿的一天！笑容會帶來更多笑容。" },
  { name: "審判", keywords: "覺醒、重生、新的召喚", message: "等了好久的消息可能就快到了。把心門打開吧。" },
  { name: "世界", keywords: "圓滿、成就、一段旅程的句點", message: "一件事即將告一段落。記得跟自己說一聲：辛苦了。" },
];

const TABLE: Partial<Record<SupportedLang, CardText[]>> = { en: EN, ja: JA, "zh-TW": ZH };

/** 화면에 보여줄 카드 이름·키워드·오늘의 메시지 (AI 상담에 보내는 값은 바꾸지 않음) */
export function cardText(card: TarotCard, lang: SupportedLang) {
  const local = TABLE[lang]?.[card.id];
  if (!local) {
    return { name: card.name, label: `'${card.name}' 카드`, keywords: card.keywords, message: DAILY_MESSAGES[card.id] ?? "" };
  }
  const label = lang === "en" ? local.name : `「${local.name}」`;
  return { name: local.name, label, keywords: local.keywords, message: local.message };
}
