// 경량 다국어: 한국어 원문을 키로 쓰고 영어/일본어/대만번체/프랑스어/독일어/스페인어 번역을 매핑한다.
import { useSyncExternalStore } from "react";

export const LANGS = ["ko", "en", "ja", "zh", "fr", "de", "es"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
  zh: "繁體中文",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};
export const LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  zh: "zh-TW",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};
const KEY = "talk.lang";

// [ko, en, ja, zh-TW, fr, de, es]
const D: [string, string, string, string, string, string, string][] = [
  ["톡비서", "TalkSec", "トーク秘書", "對話秘書", "TalkSec", "TalkSec", "TalkSec"],
  ["채팅", "Chat", "チャット", "聊天", "Discussion", "Chat", "Chat"],
  ["캘린더", "Calendar", "カレンダー", "行事曆", "Calendrier", "Kalender", "Calendario"],
  ["설정", "Settings", "設定", "設定", "Paramètres", "Einstellungen", "Ajustes"],
  ["서류함 여는 중...", "Opening your drawer...", "書類箱を開いています...", "正在開啟資料夾...", "Ouverture de votre tiroir...", "Schublade wird geöffnet...", "Abriendo tu cajón..."],
  ["아직 비어 있어요", "Nothing here yet", "まだ空っぽです", "這裡還是空的", "Rien ici pour l'instant", "Noch nichts hier", "Aún no hay nada aquí"],
  [
    "스크린샷, 메모, 링크를 그냥 던져 주세요. 날짜가 있으면 제가 미리 챙겨 드릴게요.",
    "Just toss in screenshots, notes, or links. If there's a date, I'll remind you ahead of time.",
    "スクショ・メモ・リンクをポイッと投げてください。日付があれば先にお知らせします。",
    "隨手丟入截圖、筆記或連結吧。如果有日期，我會提前提醒您。",
    "Déposez simplement des captures, notes ou liens. S'il y a une date, je vous le rappellerai à l'avance.",
    "Wirf einfach Screenshots, Notizen oder Links rein. Bei Terminen erinnere ich dich rechtzeitig.",
    "Solo envía capturas, notas o enlaces. Si hay una fecha, te lo recordaré con tiempo.",
  ],
  ["비서가 서류함을 뒤지는 중...", "Digging through your drawer...", "書類箱を探しています...", "秘書正在翻找資料...", "Recherche dans vos dossiers...", "Durchsuche deine Ablage...", "Buscando en tu cajón..."],
  ["스샷 속 글자를 읽는 중...", "Reading text in the screenshot...", "スクショの文字を読んでいます...", "正在讀取截圖文字...", "Lecture du texte de la capture...", "Lese Text im Screenshot...", "Leyendo el texto de la captura..."],
  ["날짜를 챙기는 중...", "Checking dates...", "日付を確認しています...", "正在確認日期...", "Vérification des dates...", "Prüfe Termine...", "Revisando fechas..."],
  ["채팅창을 지금 모두 비울까요?", "Clear the whole chat now?", "チャットを今すべて消しますか？", "要立即清空所有對話嗎？", "Effacer toute la discussion ?", "Den gesamten Chat jetzt leeren?", "¿Vaciar todo el chat ahora?"],
  ["저장된 메모와 캘린더는 그대로 남아요", "Saved notes and calendar stay as they are", "保存したメモとカレンダーはそのまま残ります", "已儲存的筆記與行事曆會完整保留", "Vos notes et votre calendrier restent intacts", "Gespeicherte Notizen und Kalender bleiben erhalten", "Las notas y el calendario guardados se conservan"],
  ["비우기", "Clear", "消す", "清空", "Effacer", "Leeren", "Vaciar"],
  ["취소", "Cancel", "キャンセル", "取消", "Annuler", "Abbrechen", "Cancelar"],
  ["완료", "Done", "完了", "完成", "Terminé", "Fertig", "Listo"],
  ["녹음 중", "Recording", "録音中", "錄音中", "Enregistrement", "Aufnahme", "Grabando"],
  ["첨부 메뉴", "Attach menu", "添付メニュー", "附件選單", "Menu pièces jointes", "Anhang-Menü", "Menú de adjuntos"],
  ["스샷 첨부", "Attach screenshot", "スクショを添付", "附加截圖", "Joindre une capture", "Screenshot anhängen", "Adjuntar captura"],
  ["사진 촬영", "Take photo", "写真を撮る", "拍照", "Prendre une photo", "Foto aufnehmen", "Tomar foto"],
  ["음성 녹음", "Voice memo", "音声録音", "語音錄音", "Mémo vocal", "Sprachnotiz", "Nota de voz"],
  ["파일 첨부 · PDF·워드·PPT", "Attach file · PDF·Word·PPT", "ファイル添付 · PDF·Word·PPT", "附加檔案 · PDF·Word·PPT", "Joindre un fichier · PDF·Word·PPT", "Datei anhängen · PDF·Word·PPT", "Adjuntar archivo · PDF·Word·PPT"],
  ["파일 첨부 · 문서·모든 파일", "Attach file · Docs·All files", "ファイル添付 · 文書・すべて", "附加檔案 · 文件·所有格式", "Joindre · Docs·Tous fichiers", "Anhängen · Dokumente·Alle", "Adjuntar · Docs·Todos"],
  ["메모, 링크, 스샷을 던져 주세요", "Toss a note, link, or screenshot", "メモ・リンク・スクショをどうぞ", "請丟入筆記、連結或截圖", "Note, lien ou capture d'écran...", "Notiz, Link oder Screenshot...", "Envía una nota, enlace o captura"],
  ["메모, 링크, 스샷을 던져 주세요 (붙여넣기 가능)", "Toss a note, link, or screenshot (paste works)", "メモ・リンク・スクショを投げてください（貼り付けOK）", "請丟入筆記、連結或截圖（支援貼上）", "Déposez une note, lien ou capture (coller OK)", "Notiz, Link oder Screenshot (Einfügen OK)", "Envía nota, enlace o captura (puedes pegar)"],
  ["녹음 취소", "Cancel recording", "録音をキャンセル", "取消錄音", "Annuler l'enregistrement", "Aufnahme abbrechen", "Cancelar grabación"],
  ["받아쓰기 끝내기", "Stop dictation", "音声入力を終了", "結束語音輸入", "Arrêter la dictée", "Diktat stoppen", "Detener dictado"],
  ["말로 입력하기", "Dictate", "声で入力", "語音輸入", "Dicter", "Diktieren", "Dictar"],
  ["보내기", "Send", "送信", "傳送", "Envoyer", "Senden", "Enviar"],
  ["첨부 미리보기", "Attachment preview", "添付プレビュー", "附件預覽", "Aperçu de la pièce jointe", "Anhang-Vorschau", "Vista previa del adjunto"],
  ["첨부 취소", "Remove attachment", "添付を取り消す", "移除附件", "Retirer la pièce jointe", "Anhang entfernen", "Quitar adjunto"],
  ["여기에 놓으면 바로 정리해요", "Drop here and I'll sort it", "ここにドロップすればすぐ整理します", "拖放到這裡立即為您整理", "Déposez ici pour tout classer", "Hier ablegen zum Sortieren", "Suelta aquí para organizarlo"],
  ["복사", "Copy", "コピー", "複製", "Copier", "Kopieren", "Copiar"],
  ["복사됨", "Copied", "コピー済み", "已複製", "Copié", "Kopiert", "Copiado"],
  ["원문 복사", "Copy text", "原文をコピー", "複製原文", "Copier le texte", "Text kopieren", "Copiar texto"],
  ["요약 복사", "Copy summary", "要約をコピー", "複製摘要", "Copier le résumé", "Zusammenfassung kopieren", "Copiar resumen"],
  ["고정", "Pin", "固定", "釘選", "Épingler", "Anheften", "Fijar"],
  ["고정됨", "Pinned", "固定中", "已釘選", "Épinglé", "Angeheftet", "Fijado"],
  ["고정 해제", "Unpin", "固定解除", "取消釘選", "Désépingler", "Lösen", "Desfijar"],
  ["상단 고정", "Pin to top", "上部に固定", "釘選至頂部", "Épingler en haut", "Oben anheften", "Fijar arriba"],
  ["접기 ▲", "Collapse ▲", "閉じる ▲", "收起 ▲", "Réduire ▲", "Einklappen ▲", "Contraer ▲"],
  ["고정 {0}개 모두 보기 ▼", "Show all {0} pinned ▼", "固定 {0}件をすべて表示 ▼", "顯示全部 {0} 項釘選 ▼", "Voir les {0} épinglés ▼", "Alle {0} angehefteten ▼", "Ver los {0} fijados ▼"],
  ["카테고리 {0}개 모두 보기 ▼", "Show all {0} categories ▼", "全{0}カテゴリを表示 ▼", "顯示全部 {0} 個分類 ▼", "Voir les {0} catégories ▼", "Alle {0} Kategorien ▼", "Ver las {0} categorías ▼"],
  ["문서 · {0}자", "Document · {0} chars", "文書 · {0}文字", "文件 · {0} 字", "Document · {0} car.", "Dokument · {0} Zeichen", "Documento · {0} car."],
  ["내용 보기 ▼", "Show content ▼", "内容を見る ▼", "查看內容 ▼", "Voir le contenu ▼", "Inhalt anzeigen ▼", "Ver contenido ▼"],
  ["원본 받기", "Download original", "原本をダウンロード", "下載原檔", "Télécharger l'original", "Original laden", "Descargar original"],
  ["... 더보기", "... more", "... もっと見る", "... 更多", "... plus", "... mehr", "... más"],
  ["보낸 스크린샷", "Sent screenshot", "送ったスクショ", "傳送的截圖", "Capture envoyée", "Gesendeter Screenshot", "Captura enviada"],
  ["저장된 스크린샷", "Saved screenshot", "保存したスクショ", "已儲存的截圖", "Capture enregistrée", "Gespeicherter Screenshot", "Captura guardada"],
  ["음성 메모", "Voice memo", "音声メモ", "語音備忘錄", "Mémo vocal", "Sprachnotiz", "Nota de voz"],
  ["음성 메모 듣는 중...", "Listening to voice memo...", "音声メモを聞いています...", "正在聆聽語音...", "Écoute du mémo vocal...", "Höre Sprachnotiz ab...", "Escuchando nota de voz..."],
  ["이대로 저장할까요?", "Save it like this?", "このまま保存しますか？", "要這樣儲存嗎？", "Enregistrer ainsi ?", "So speichern?", "¿Guardar así?"],
  ["(\"그래\"라고 답해도 돼요)", "(you can just say \"yes\")", "（「はい」と答えてもOK）", "（也可直接回覆「好」）", "(dites simplement « oui »)", "(einfach «ja» sagen)", "(puedes responder «sí»)"],
  ["저장", "Save", "保存", "儲存", "Enregistrer", "Speichern", "Guardar"],
  ["버리기", "Discard", "捨てる", "捨棄", "Supprimer", "Verwerfen", "Descartar"],
  ["톡비서 · 찾아봤어요", "TalkSec · Looked it up", "トーク秘書 · 探しました", "對話秘書 · 幫您找到了", "TalkSec · Trouvé", "TalkSec · Gefunden", "TalkSec · Encontrado"],
  ["메모 {0}건, 모두 보여드릴까요?", "{0} notes — show them all?", "メモ{0}件、すべて表示しますか？", "共有 {0} 則筆記，要全部顯示嗎？", "{0} notes — tout afficher ?", "{0} Notizen — alle zeigen?", "{0} notas — ¿mostrar todas?"],
  ["▲ 목록 접기", "▲ Hide list", "▲ リストを閉じる", "▲ 收起列表", "▲ Masquer la liste", "▲ Liste ausblenden", "▲ Ocultar lista"],
  ["메모 {0}건 모두 보기", "Show all {0} notes", "メモ{0}件をすべて見る", "查看全部 {0} 則筆記", "Voir les {0} notes", "Alle {0} Notizen zeigen", "Ver las {0} notas"],
  ["{0}에 잊지 않게 챙겨드릴게요", "I'll remind you on {0}", "{0}にお知らせしますね", "我會在 {0} 提醒您", "Je vous rappellerai le {0}", "Ich erinnere dich am {0}", "Te lo recordaré el {0}"],
  ["알림을 전해드렸어요 ({0})", "Reminder sent ({0})", "リマインドしました（{0}）", "已發送提醒 ({0})", "Rappel envoyé ({0})", "Erinnerung gesendet ({0})", "Recordatorio enviado ({0})"],
  ["삭제된 메모예요", "This note was deleted", "削除されたメモです", "此筆記已刪除", "Cette note a été supprimée", "Diese Notiz wurde gelöscht", "Esta nota fue eliminada"],
  ["스샷", "Screenshot", "スクショ", "截圖", "Capture", "Screenshot", "Captura"],
  ["메모", "Note", "メモ", "筆記", "Note", "Notiz", "Nota"],
  // errors
  ["이미지를 읽지 못했어요", "Couldn't read the image", "画像を読み込めませんでした", "無法讀取圖片", "Impossible de lire l'image", "Bild konnte nicht gelesen werden", "No se pudo leer la imagen"],
  ["저장하지 못했어요", "Couldn't save", "保存できませんでした", "儲存失敗", "Échec de l'enregistrement", "Speichern fehlgeschlagen", "No se pudo guardar"],
  ["지우지 못했어요", "Couldn't delete", "削除できませんでした", "刪除失敗", "Échec de la suppression", "Löschen fehlgeschlagen", "No se pudo eliminar"],
  ["채팅창을 비우지 못했어요", "Couldn't clear the chat", "チャットを消せませんでした", "無法清空對話", "Impossible de vider le chat", "Chat konnte nicht geleert werden", "No se pudo vaciar el chat"],
  ["찾다가 문제가 생겼어요. 다시 물어봐 주세요", "Something went wrong while searching. Please ask again", "検索中に問題が起きました。もう一度聞いてください", "搜尋時發生問題，請再問一次", "Erreur lors de la recherche. Réessayez", "Fehler bei der Suche. Bitte erneut fragen", "Error al buscar. Inténtalo de nuevo"],
  ["앗, 정리하다 문제가 생겼어요. 다시 던져 주세요", "Oops, something went wrong. Please toss it again", "整理中に問題が起きました。もう一度投げてください", "整理時發生問題，請再傳一次", "Oups, erreur lors du tri. Réessayez", "Hoppla, Fehler beim Sortieren. Erneut versuchen", "Ups, hubo un problema al organizar. Inténtalo de nuevo"],
  ["AI 정리가 잠시 지연되어 원문만 먼저 보관해 두었어요", "AI sorting is delayed, so I saved your original note first", "AI整理が遅れているため、元のメモを先に保存しました", "AI 整理暫時延遲，已先為您保存原文", "Le tri IA est retardé, j'ai donc d'abord enregistré l'original", "KI-Sortierung verzögert sich, Originalnotiz wurde zuerst gespeichert", "El orden con IA se retrasó, así que guardé tu nota original primero"],
  ["다시 정리", "Retry sort", "再整理", "重新整理", "Retrier", "Neu sortieren", "Reordenar"],
  ["다시 정리하고 있어요...", "Sorting again...", "再整理しています...", "正在重新整理...", "Nouveau tri en cours...", "Wird neu sortiert...", "Reordenando..."],
  ["아직 PDF·워드·PPT·텍스트 문서만 읽을 수 있어요 (한글·엑셀은 준비 중)", "Only PDF, Word, PPT and text files for now (Excel coming soon)", "現在はPDF・Word・PPT・テキストのみ対応です（Excelは準備中）", "目前僅支援讀取 PDF、Word、PPT 與純文字檔", "Seuls PDF, Word, PPT et texte sont pris en charge", "Aktuell nur PDF, Word, PPT und Textdateien", "Solo PDF, Word, PPT y texto por ahora"],
  ["본문 글자를 읽을 수 없는 파일이라 원본 파일만 안전하게 보관했어요", "Couldn't read text from this file type, so I saved the original file safely", "本文を読み取れない形式のため、原本ファイルのみ安全に保管しました", "無法讀取此檔案文字，已安全保存原始檔案", "Texte illisible, fichier original sauvegardé", "Text nicht lesbar, Originaldatei sicher gespeichert", "No se pudo leer el texto, archivo original guardado"],
  ["내용을 읽을 수 없는 파일 형식이라 원본 파일만 보관했어요.", "Saved original file only (text could not be extracted).", "本文を読み取れない形式のため原本ファイルのみ保管しました。", "無法擷取文字，僅儲存原始檔案。", "Fichier original enregistré uniquement.", "Nur Originaldatei gespeichert.", "Solo se guardó el archivo original."],
  ["문서에서 글자를 찾지 못했어요", "No text found in the document", "文書に文字が見つかりませんでした", "文件中找不到文字", "Aucun texte trouvé dans le document", "Kein Text im Dokument gefunden", "No se encontró texto en el documento"],
  ["원본 파일을 보관하지 못했어요", "Couldn't store the original file", "原本ファイルを保管できませんでした", "無法保存原始檔案", "Impossible de stocker l'original", "Originaldatei nicht gespeichert", "No se pudo guardar el archivo original"],
  ["문서를 읽지 못했어요", "Couldn't read the document", "文書を読み込めませんでした", "無法讀取文件", "Impossible de lire le document", "Dokument nicht lesbar", "No se pudo leer el documento"],
  ["이 브라우저는 말로 입력을 지원하지 않아요. + 메뉴의 음성 녹음을 써 주세요", "This browser doesn't support dictation. Use Voice memo in the + menu", "このブラウザは音声入力に未対応です。+メニューの音声録音を使ってください", "此瀏覽器不支援語音輸入，請使用 + 選單中的語音錄音", "Dictée non prise en charge. Utilisez le mémo vocal (+)", "Diktat nicht unterstützt. Nutze Sprachnotiz im +-Menü", "Dictado no compatible. Usa nota de voz en el menú +"],
  ["마이크 권한을 허용해 주세요", "Please allow microphone access", "マイクの許可をお願いします", "請允許麥克風權限", "Veuillez autoriser le micro", "Bitte Mikrofonzugriff erlauben", "Por favor permite el acceso al micrófono"],
  ["녹음이 너무 짧아요. 다시 시도해 주세요", "Recording too short. Please try again", "録音が短すぎます。もう一度お試しください", "錄音時間太短，請再試一次", "Enregistrement trop court. Réessayez", "Aufnahme zu kurz. Bitte wiederholen", "Grabación muy corta. Inténtalo de nuevo"],
  ["녹음된 말이 없어요. 다시 말씀해 주세요", "I didn't hear anything. Please try again", "声が録音されていません。もう一度どうぞ", "沒有錄到聲音，請再說一次", "Je n'ai rien entendu. Réessayez", "Nichts gehört. Bitte wiederholen", "No se escuchó nada. Inténtalo de nuevo"],
  ["음성 메모를 정리하지 못했어요. 다시 시도해 주세요", "Couldn't process the voice memo. Please try again", "音声メモを整理できませんでした。もう一度お試しください", "無法處理語音備忘錄，請再試一次", "Impossible de traiter le mémo vocal", "Sprachnotiz konnte nicht verarbeitet werden", "No se pudo procesar la nota de voz"],
  ["파일 하나는 최대 20MB까지 올릴 수 있어요", "Each file can be up to 20MB", "1ファイル最大20MBまでです", "單一檔案上限為 20MB", "20 Mo maximum par fichier", "Maximal 20 MB pro Datei", "Máximo 20 MB por archivo"],
  ["무료 회원은 파일 하나당 최대 20MB까지 올릴 수 있어요 (프리미엄 50MB)", "Free plan allows up to 20MB per file (50MB on Premium)", "無料プランは1ファイル最大20MBまでです（プレミアム50MB）", "免費方案單檔上限 20MB（進階版 50MB）", "Gratuit : 20 Mo max/fichier (50 Mo en Premium)", "Kostenlos: max. 20 MB/Datei (50 MB Premium)", "Gratis: máx. 20 MB/archivo (50 MB Premium)"],
  ["파일 하나는 최대 50MB까지 올릴 수 있어요", "Each file can be up to 50MB", "1ファイル最大50MBまでです", "單一檔案上限為 50MB", "50 Mo maximum par fichier", "Maximal 50 MB pro Datei", "Máximo 50 MB por archivo"],
  ["파일 1개당 최대 20MB (프리미엄 50MB)", "Up to 20MB per file (50MB on Premium)", "1ファイル最大20MB（プレミアム50MB）", "單檔上限 20MB（進階版 50MB）", "Max 20 Mo/fichier (50 Mo Premium)", "Max. 20 MB/Datei (50 MB Premium)", "Máx. 20 MB/archivo (50 MB Premium)"],
  ["파일 1개당 최대 50MB", "Up to 50MB per file", "1ファイル最大50MB", "單檔上限 50MB", "Max 50 Mo/fichier", "Max. 50 MB/Datei", "Máx. 50 MB/archivo"],
  ["무료 체험 7일이 끝났어요. 프리미엄으로 업그레이드하면 계속 보관할 수 있어요", "Your 7-day free trial has ended. Upgrade to Premium to keep storing", "7日間の無料体験が終了しました。プレミアムで引き続き保管できます", "7 天免費試用已結束，升級進階版即可繼續保存", "Essai de 7 jours terminé. Passez à Premium", "7-Tage-Test beendet. Upgrade auf Premium", "Prueba de 7 días terminada. Pásate a Premium"],
  ["무료 보관함 100MB가 가득 찼어요. 프리미엄으로 20GB를 써보세요", "Free 100MB storage is full. Try 20GB with Premium", "無料の100MBがいっぱいです。プレミアムで20GBをどうぞ", "免費 100MB 空間已滿，升級進階版享 20GB", "100 Mo gratuits pleins. Passez à 20 Go Premium", "100 MB voll. Hol dir 20 GB mit Premium", "100 MB gratis llenos. Pasa a 20 GB Premium"],
  ["오늘 무료 AI 정리 20회를 모두 썼어요. 프리미엄(하루 50회)으로 업그레이드해 보세요", "Used all 20 free AI sorts today. Upgrade to Premium (50/day)", "本日の無料AI整理20回を使い切りました。プレミアム(1日50回)をお試しください", "今日免費 20 次 AI 整理已用完，升級進階版享每日 50 次", "20 tris IA gratuits épuisés. Passez à Premium (50/j)", "20 kostenlose KI-Sortierungen aufgebraucht", "20 usos diarios de IA agotados. Pásate a Premium"],
  ["오늘 AI 정리 50회(공정 사용)를 모두 썼어요. 내일 다시 이용해 주세요", "Used all 50 AI sorts (fair use) today. Please try again tomorrow", "本日のAI整理50回(公正利用)を使い切りました。明日またご利用ください", "今日 50 次 AI 整理（公平使用）已達上限，請明天再試", "50 tris IA utilisés aujourd'hui. À demain !", "50 KI-Sortierungen heute genutzt. Bis morgen!", "50 usos de IA alcanzados hoy. Vuelve mañana"],
  ["보관함이 가득 찼어요. 안 쓰는 파일을 지워 주세요", "Storage is full. Please delete unused files", "保管箱がいっぱいです。不要なファイルを削除してください", "儲存空間已滿，請刪除不用的檔案", "Espace plein. Supprimez d'anciens fichiers", "Speicher voll. Bitte alte Dateien löschen", "Espacio lleno. Elimina archivos antiguos"],
  // off-topic
  [
    "저는 톡비서예요. 실시간 웹검색은 서툴지만, 저장해주신 메모 검색·정리는 자신 있어요. 화면을 캡처하거나 링크로 툭 던져주시면 깔끔하게 보관해 드릴게요.",
    "I'm TalkSec. I'm not great at live web search, but I'm great at finding and organizing your saved notes. Toss me a screenshot or link and I'll keep it tidy.",
    "トーク秘書です。リアルタイムのWeb検索は苦手ですが、保存したメモの検索・整理は得意です。スクショやリンクを投げてくれればきれいに保管します。",
    "我是對話秘書。雖然不擅長即時網路搜尋，但我非常擅長整理與尋找您儲存的筆記與截圖！",
    "Je suis TalkSec. Je ne fais pas de recherche web en direct, mais j'excelle pour classer et retrouver vos notes et captures.",
    "Ich bin TalkSec. Websuche kann ich nicht gut, aber deine Notizen und Screenshots sortiere und finde ich perfekt.",
    "Soy TalkSec. No busco en la web en vivo, pero soy experto en organizar y encontrar tus notas y capturas.",
  ],
  [
    "저는 톡비서예요. 표 작성이나 문서 창작은 서툴지만, 던져주신 메모 정리와 검색은 전문이에요.",
    "I'm TalkSec. I'm not great at writing tables or documents, but organizing and finding your notes is my specialty.",
    "トーク秘書です。表や文章の作成は苦手ですが、メモの整理と検索は専門です。",
    "我是對話秘書。我不擅長製作表格或撰寫長文，但整理與搜尋筆記是我的專長。",
    "Je suis TalkSec. Mon point fort est l'organisation et la recherche de vos notes.",
    "Ich bin TalkSec. Mein Spezialgebiet ist das Sortieren und Finden deiner Notizen.",
    "Soy TalkSec. Mi especialidad es organizar y buscar tus notas.",
  ],
  [
    "저는 톡비서예요. 일상 잡담이나 역할놀이는 서툴지만, 저장해주신 메모 정리·검색·알림 수정은 자신 있어요. 뭐든 툭 던져 주세요.",
    "I'm TalkSec. I'm not great at small talk or role-play, but I'm great at organizing, finding, and reminding. Toss me anything.",
    "トーク秘書です。雑談やロールプレイは苦手ですが、メモの整理・検索・リマインドは得意です。何でも投げてください。",
    "我是對話秘書。我不擅長閒聊，但整理筆記、搜尋與設定提醒都交給我吧！",
    "Je suis TalkSec. Je préfère organiser vos notes, chercher et gérer vos rappels. Envoyez-moi tout !",
    "Ich bin TalkSec. Ich sortiere, finde und erinnere dich zuverlässig an deine Notizen.",
    "Soy TalkSec. Organizo, busco y gestiono tus recordatorios sin problema.",
  ],
  [
    "저는 초간편 AI 톡비서예요. 스크린샷·링크·메모를 툭 던져주시면 알아서 분류하고, 필요할 때 쏙쏙 찾아드리고, 중요한 날짜는 먼저 챙겨드려요.",
    "I'm TalkSec, your super-simple AI assistant. Toss me screenshots, links, or notes — I'll sort them, find them when you need them, and remind you of important dates.",
    "超かんたんAIのトーク秘書です。スクショ・リンク・メモを投げれば自動で分類し、必要な時にすぐ探し、大事な日付は先にお知らせします。",
    "我是超好用的 AI 對話秘書。只要丟入截圖、連結或筆記，我就會自動分類、隨時幫您找到，並在重要日期提前提醒您！",
    "Je suis TalkSec, votre assistant IA. Envoyez captures, liens ou notes : je classe tout et vous rappelle vos dates clés.",
    "Ich bin TalkSec, dein KI-Assistent. Wirf Screenshots, Links oder Notizen rein – ich sortiere alles und erinnere dich.",
    "Soy TalkSec, tu asistente IA. Envía capturas, enlaces o notas y lo ordenaré todo con recordatorios.",
  ],
  // calendar
  ["이전 달", "Previous month", "前の月", "上個月", "Mois précédent", "Vorheriger Monat", "Mes anterior"],
  ["다음 달", "Next month", "次の月", "下個月", "Mois suivant", "Nächster Monat", "Mes siguiente"],
  ["닫기", "Close", "閉じる", "關閉", "Fermer", "Schließen", "Cerrar"],
  ["{0}에 던진 것", "Tossed on {0}", "{0}に投げたもの", "{0}儲存的內容", "Envoyé le {0}", "Am {0} gespeichert", "Enviado el {0}"],
  ["{0}에 저장한 것", "Tossed in {0}", "{0}に投げたもの", "{0}儲存的內容", "Envoyé en {0}", "Im {0} gespeichert", "Enviado en {0}"],
  ["이 날은 던진 게 없어요", "Nothing tossed this day", "この日は何もありません", "這天沒有儲存任何內容", "Rien ce jour-là", "An diesem Tag nichts gespeichert", "Nada guardado ese día"],
  ["{0}건", "{0}", "{0}件", "{0} 筆", "{0}", "{0}", "{0}"],
  ["지금까지 던진 것", "Everything so far", "これまで投げたもの", "目前為止的紀錄", "Tout jusqu'ici", "Bisher gespeichert", "Todo hasta ahora"],
  ["총 {0}건", "{0} total", "合計{0}件", "共 {0} 筆", "{0} au total", "Gesamt {0}", "{0} en total"],
  ["아직 던진 게 없어요", "Nothing tossed yet", "まだ何もありません", "尚未儲存任何內容", "Rien pour l'instant", "Noch nichts gespeichert", "Aún no hay nada"],
  ["스샷", "Screenshot", "スクショ", "截圖", "Capture", "Screenshot", "Captura"],
  ["링크", "Link", "リンク", "連結", "Lien", "Link", "Enlace"],
  ["음성", "Voice", "音声", "語音", "Voix", "Sprache", "Voz"],
  ["문서", "Doc", "文書", "文件", "Doc", "Dok", "Doc"],
  // categories
  ["일정", "Schedule", "予定", "行程", "Agenda", "Termine", "Agenda"],
  ["쇼핑", "Shopping", "買い物", "購物", "Achats", "Einkauf", "Compras"],
  ["아이디어", "Ideas", "アイデア", "靈感", "Idées", "Ideen", "Ideas"],
  ["공부", "Study", "勉強", "學習", "Études", "Lernen", "Estudio"],
  ["금융", "Finance", "お金", "金融", "Finance", "Finanzen", "Finanzas"],
  ["맛집", "Food", "グルメ", "美食", "Resto", "Essen", "Comida"],
  ["할일", "To-Do", "やること", "待辦", "À faire", "Aufgaben", "Tareas"],
  ["기타", "Other", "その他", "其他", "Autre", "Sonstiges", "Otros"],
  // plans
  ["무료 사용자", "Free", "無料", "免費會員", "Gratuit", "Kostenlos", "Gratis"],
  ["무료", "Free", "無料", "免費", "Gratuit", "Kostenlos", "Gratis"],
  ["프리미엄", "Premium", "プレミアム", "進階版", "Premium", "Premium", "Premium"],
  ["평생 소장", "Lifetime", "永久版", "終身版", "À vie", "Lebenslang", "Vitalicio"],
  ["하루 AI 자동 정리 20회", "20 AI sorts per day", "AI自動整理 1日20回", "每日 20 次 AI 自動整理", "20 tris IA par jour", "20 KI-Sortierungen/Tag", "20 ordenamientos IA/día"],
  ["기본 카테고리 7개", "7 default categories", "基本カテゴリー7個", "7 個預設分類", "7 catégories par défaut", "7 Standard-Kategorien", "7 categorías base"],
  ["7일 무료 체험 · 보관함 100MB", "7-day free trial · 100MB storage", "7日間無料体験 · 保管100MB", "7 天免費試用 · 100MB 空間", "Essai 7j · 100 Mo", "7 Tage gratis · 100 MB", "7 días gratis · 100 MB"],
  ["AI 정리 무제한 (공정 사용)", "Unlimited AI sorting (fair use)", "AI整理無制限（公正利用）", "AI 無限整理（公平使用）", "Tri IA illimité*", "Unbegrenzte KI-Sortierung*", "Orden IA ilimitado*"],
  ["스샷·문서 정밀 분석", "Detailed screenshot & document analysis", "スクショ・文書の精密分析", "截圖與文件深度解析", "Analyse avancée captures & docs", "Tiefe Bild- & Dok-Analyse", "Análisis detallado de docs"],
  ["나만의 카테고리 10개", "10 custom categories", "マイカテゴリー10個", "10 個自訂分類", "10 catégories perso", "10 eigene Kategorien", "10 categorías propias"],
  ["선제적 일정 알림", "Proactive schedule reminders", "先回りの予定通知", "主動行程提醒", "Rappels proactifs", "Proaktive Erinnerungen", "Recordatorios proactivos"],
  ["하루 AI 자동 정리 50회 (공정 사용)", "50 AI sorts/day (fair use)", "AI自動整理 1日50回（公正利用）", "每日 50 次 AI 自動整理", "50 tris IA/jour", "50 KI-Sortierungen/Tag", "50 ordenamientos IA/día"],
  ["보관함 20GB · 원본 파일 보관", "20GB storage · keep original files", "保管20GB · 原本ファイル保管", "20GB 空間 · 保留原檔", "20 Go · fichiers originaux", "20 GB · Originaldateien", "20 GB · archivos originales"],
  ["하루 50회*", "50/day*", "1日50回*", "每日 50 次*", "50/jour*", "50/Tag*", "50/día*"],
  ["월 4,900원", "₩4,900/mo", "月4,900ウォン", "每月 ₩4,900", "₩4,900/mois", "₩4,900/Monat", "₩4,900/mes"],
  ["20GB", "20GB", "20GB", "20GB", "20 Go", "20 GB", "20 GB"],
  ["기본 8개", "8 built-in", "基本8個", "內建 8 個", "8 intégrées", "8 integriert", "8 integradas"],
  ["* 공정 사용 기준 (하루 최대 50회)", "* Fair use limit (up to 50/day)", "* 公正利用基準（1日最大50回）", "* 公平使用原則（每日上限 50 次）", "* Usage raisonnable (max 50/j)", "* Fair-Use-Limit (max. 50/Tag)", "* Uso justo (máx. 50/día)"],
  ["프리미엄 기능 평생 이용", "Premium features forever", "プレミアム機能を永久に利用", "終身使用進階功能", "Fonctions Premium à vie", "Premium-Funktionen dauerhaft", "Funciones Premium para siempre"],
  ["한 번 결제, 추가 비용 없음", "Pay once, no extra cost", "一度の支払いで追加費用なし", "一次付費，無額外費用", "Paiement unique", "Einmalzahlung", "Pago único"],
  ["나만의 카테고리 30개", "30 custom categories", "マイカテゴリー30個", "30 個自訂分類", "30 catégories perso", "30 eigene Kategorien", "30 categorías propias"],
  ["얼리버드 전용 뱃지", "Early-bird badge", "アーリーバード専用バッジ", "早鳥專屬徽章", "Badge pionnier", "Early-Bird-Abzeichen", "Insignia pionero"],
  ["보관함 30GB", "30GB storage", "保管30GB", "30GB 空間", "30 Go", "30 GB", "30 GB"],
  ["가격", "Price", "価格", "價格", "Prix", "Preis", "Precio"],
  ["7일 무료", "7 days free", "7日間無料", "7 天免費", "7 jours gratuits", "7 Tage gratis", "7 días gratis"],
  ["월 4,900원\n연 39,000원", "₩4,900/mo\n₩39,000/yr", "月4,900ウォン\n年39,000ウォン", "月付 ₩4,900\n年付 ₩39,000", "₩4,900/mois\n₩39,000/an", "₩4,900/Mt.\n₩39,000/Jr.", "₩4,900/mes\n₩39,000/año"],
  ["월 3,900원\n연 39,000원", "₩3,900/mo\n₩39,000/yr", "月3,900ウォン\n年39,000ウォン", "月付 ₩3,900\n年付 ₩39,000", "₩3,900/mois\n₩39,000/an", "₩3,900/Mt.\n₩39,000/Jr.", "₩3,900/mes\n₩39,000/año"],
  ["3,900원", "₩3,900", "3,900ウォン", "₩3,900", "₩3,900", "₩3,900", "₩3,900"],
  ["39,000원", "₩39,000", "39,000ウォン", "₩39,000", "₩39,000", "₩39,000", "₩39,000"],
  ["/년", "/yr", "/年", "/年", "/an", "/Jr.", "/año"],
  ["연간 구독", "Yearly", "年間プラン", "年付訂閱", "Annuel", "Jährlich", "Anual"],
  ["2개월 무료", "2 months free", "2ヶ月無料", "贈送2個月", "2 mois offerts", "2 Monate gratis", "2 meses gratis"],
  ["89,000원 1회", "₩89,000 once", "89,000ウォン 1回", "單次 ₩89,000", "₩89,000 une fois", "₩89,000 einmalig", "₩89,000 único"],
  ["AI 자동 정리", "AI sorting", "AI自動整理", "AI 自動整理", "Tri IA", "KI-Sortierung", "Orden IA"],
  ["하루 20회", "20/day", "1日20回", "每日 20 次", "20/jour", "20/Tag", "20/día"],
  ["무제한*", "Unlimited*", "無制限*", "無限制*", "Illimité*", "Unbegrenzt*", "Ilimitado*"],
  ["카테고리", "Categories", "カテゴリー", "分類", "Catégories", "Kategorien", "Categorías"],
  ["수정", "Edit", "編集", "編輯", "Modifier", "Bearbeiten", "Editar"],
  ["보기", "View", "表示", "檢視", "Voir", "Ansehen", "Ver"],
  ["삭제", "Delete", "削除", "刪除", "Supprimer", "Löschen", "Eliminar"],
  ["원본", "Original", "原本", "原圖", "Original", "Original", "Original"],
  ["확대", "Zoom in", "拡大", "放大", "Zoom +", "Vergrößern", "Acercar"],
  ["축소", "Zoom out", "縮小", "縮小", "Zoom -", "Verkleinern", "Alejar"],
  ["삭제할까요?", "Delete this?", "削除しますか？", "確定要刪除嗎？", "Supprimer ?", "Löschen?", "¿Eliminar?"],
  ["키워드", "Keywords", "キーワード", "關鍵字", "Mots-clés", "Schlüsselwörter", "Palabras clave"],
  ["띄어쓰기나 쉼표로 구분", "Separate with spaces or commas", "スペースやカンマで区切る", "以空格或逗號分隔", "Séparer par espaces/virgules", "Mit Leerzeichen/Komma trennen", "Separar con espacios o comas"],
  ["기본 7개", "7 default", "基本7個", "預設 7 個", "7 par défaut", "7 Standard", "7 base"],
  ["+ 나만의 10개", "+ 10 custom", "+ マイ10個", "+ 自訂 10 個", "+ 10 perso", "+ 10 eigene", "+ 10 propias"],
  ["+ 나만의 30개", "+ 30 custom", "+ マイ30個", "+ 自訂 30 個", "+ 30 perso", "+ 30 eigene", "+ 30 propias"],
  ["보관함", "Storage", "保管箱", "資料夾", "Stockage", "Ablage", "Almacén"],
  ["원본 파일 받기", "Download originals", "原本ダウンロード", "下載原始檔案", "Télécharger originaux", "Originale laden", "Descargar originales"],
  ["일정 미리 알림", "Early reminders", "予定の事前通知", "行程提前通知", "Rappels anticipés", "Vorab-Erinnerung", "Avisos anticipados"],
  ["이용 기간", "Duration", "利用期間", "使用期間", "Durée", "Laufzeit", "Duración"],
  ["가입 후 7일", "7 days after signup", "登録後7日", "註冊後 7 天", "7 jours après inscription", "7 Tage nach Registrierung", "7 días tras registro"],
  ["구독 중", "While subscribed", "購読中", "訂閱期間", "Pendant l'abonnement", "Während Abo", "Durante suscripción"],
  ["평생", "Forever", "永久", "終身", "À vie", "Für immer", "Para siempre"],
  ["* 공정 사용 범위 안에서 무제한", "* Unlimited within fair use", "* 公正利用の範囲で無制限", "* 公平使用範圍內無限次", "* Illimité (usage raisonnable)", "* Unbegrenzt (Fair Use)", "* Ilimitado (uso justo)"],
  ["월간 구독", "Monthly", "月額プラン", "月費方案", "Mensuel", "Monatlich", "Mensual"],
  ["연간 구독", "Yearly", "年額プラン", "年費方案", "Annuel", "Jährlich", "Anual"],
  ["4,900원", "₩4,900", "4,900ウォン", "₩4,900", "₩4,900", "₩4,900", "₩4,900"],
  ["39,000원", "₩39,000", "39,000ウォン", "₩39,000", "₩39,000", "₩39,000", "₩39,000"],
  ["89,000원", "₩89,000", "89,000ウォン", "₩89,000", "₩89,000", "₩89,000", "₩89,000"],
  ["/월", "/mo", "/月", "/月", "/mois", "/Mt.", "/mes"],
  ["/년", "/yr", "/年", "/年", "/an", "/Jr.", "/año"],
  [" 1회", " once", " 1回", " 單次", " unique", " einmalig", " único"],
  ["카카오페이", "KakaoPay", "カカオペイ", "KakaoPay", "KakaoPay", "KakaoPay", "KakaoPay"],
  ["토스페이", "TossPay", "トスペイ", "TossPay", "TossPay", "TossPay", "TossPay"],
  ["신용/체크카드", "Card", "カード", "信用卡/簽帳卡", "Carte", "Karte", "Tarjeta"],
  ["결제하기", "Checkout", "お支払い", "前往結帳", "Paiement", "Kasse", "Pagar"],
  ["테스트", "Test", "テスト", "測試", "Test", "Test", "Prueba"],
  ["결제 완료!", "Payment complete!", "お支払い完了！", "付款完成！", "Paiement réussi !", "Zahlung abgeschlossen!", "¡Pago completado!"],
  ["{0}이(가) 적용되었어요.", "{0} is now active.", "{0}が適用されました。", "已啟用 {0}。", "{0} est activé.", "{0} ist jetzt aktiv.", "{0} ya está activo."],
  ["확인", "OK", "OK", "確定", "OK", "OK", "Aceptar"],
  ["플랜별 차이 보기", "Compare plans", "プランの違いを見る", "比較方案差異", "Comparer les offres", "Pläne vergleichen", "Comparar planes"],
  ["결제 수단", "Payment method", "支払い方法", "付款方式", "Moyen de paiement", "Zahlungsart", "Método de pago"],
  ["결제 진행 중...", "Processing...", "処理中...", "付款處理中...", "Traitement...", "Wird bearbeitet...", "Procesando..."],
  ["{0} 결제하기", "Pay {0}", "{0}を支払う", "支付 {0}", "Payer {0}", "{0} zahlen", "Pagar {0}"],
  ["목업 결제창이에요. 실제로 돈이 나가지 않아요.", "This is a mock checkout. No real charge.", "これはモックの決済画面です。実際には請求されません。", "此為模擬結帳畫面，不會實際扣款。", "Paiement fictif. Aucun débit réel.", "Test-Kasse. Keine echte Belastung.", "Pago simulado. No habrá cobro real."],
  // custom categories
  ["이미 있는 카테고리예요", "That category already exists", "すでにあるカテゴリーです", "此分類已存在", "Cette catégorie existe déjà", "Kategorie existiert bereits", "Esa categoría ya existe"],
  ["최대 {0}개까지 만들 수 있어요", "You can create up to {0}", "最大{0}個まで作れます", "最多可建立 {0} 個", "Maximum {0} catégories", "Maximal {0} möglich", "Máximo {0} categorías"],
  ["추가하지 못했어요", "Couldn't add", "追加できませんでした", "新增失敗", "Impossible d'ajouter", "Hinzufügen fehlgeschlagen", "No se pudo añadir"],
  ["나만의 카테고리는 프리미엄 혜택이에요", "Custom categories are a Premium perk", "マイカテゴリーはプレミアム特典です", "自訂分類為進階版專屬功能", "Les catégories perso sont Premium", "Eigene Kategorien sind Premium", "Categorías propias son Premium"],
  ["학습 · 사업 · 육아 처럼 만들면 AI가 알아서 그 칸으로 분류해요", "Create ones like Study · Work · Kids and AI will sort into them", "勉強・仕事・育児のように作るとAIが自動で分類します", "建立如「學習、工作、育兒」等分類，AI 會自動為您歸類", "Créez Études, Travail... l'IA classera dedans", "Erstelle z.B. Lernen oder Arbeit – die KI sortiert", "Crea Estudio o Trabajo y la IA clasificará allí"],
  ["나만의 카테고리", "My categories", "マイカテゴリー", "我的自訂分類", "Mes catégories", "Meine Kategorien", "Mis categorías"],
  ["{0} 삭제", "Delete {0}", "{0}を削除", "刪除 {0}", "Supprimer {0}", "{0} löschen", "Eliminar {0}"],
  ["이름 (예: 학습)", "Name (e.g. Study)", "名前（例：勉強）", "名稱（例：學習）", "Nom (ex : Études)", "Name (z.B. Lernen)", "Nombre (ej. Estudio)"],
  ["AI 힌트 (선택) 단어 입력 후 스페이스", "AI hint (optional): type words & space", "AIヒント（任意）単語を入力後スペース", "AI 提示詞（選填）輸入後按空白鍵", "Indice IA (optionnel) + espace", "KI-Hinweis (optional) + Leertaste", "Pista IA (opcional) + espacio"],
  ["카테고리 추가", "Add category", "カテゴリー追加", "新增分類", "Ajouter catégorie", "Kategorie hinzufügen", "Añadir categoría"],
  ["다음에 던지는 것부터 AI가 이 카테고리로도 분류해요", "From your next toss, AI will sort into these too", "次に投げたものからAIがこのカテゴリーにも分類します", "下次傳送內容時，AI 就會自動歸類到這些分類", "Dès le prochain envoi, l'IA utilisera ces catégories", "Ab dem nächsten Eintrag nutzt die KI diese Kategorien", "Desde el próximo envío, la IA usará estas categorías"],
  // settings
  ["카카오 옐로우", "Kakao Yellow", "カカオイエロー", "經典黃", "Jaune", "Gelb", "Amarillo"],
  ["민트", "Mint", "ミント", "薄荷綠", "Menthe", "Minze", "Menta"],
  ["핑크", "Pink", "ピンク", "櫻花粉", "Rose", "Rosa", "Rosa"],
  ["스카이", "Sky", "スカイ", "天空藍", "Ciel", "Himmel", "Cielo"],
  ["뒤로", "Back", "戻る", "返回", "Retour", "Zurück", "Atrás"],
  ["내 가입 정보", "My account", "アカウント情報", "我的帳號資訊", "Mon compte", "Mein Konto", "Mi cuenta"],
  ["가입일 {0}", "Joined {0}", "登録日 {0}", "註冊日期 {0}", "Inscrit le {0}", "Dabei seit {0}", "Registrado el {0}"],
  ["로그아웃", "Log out", "ログアウト", "登出", "Déconnexion", "Abmelden", "Cerrar sesión"],
  ["결제 정보", "Billing", "お支払い情報", "付款資訊", "Facturation", "Abrechnung", "Facturación"],
  ["현재 플랜", "Current plan", "現在のプラン", "目前方案", "Forfait actuel", "Aktueller Plan", "Plan actual"],
  ["이용 중", "Active", "利用中", "使用中", "Actif", "Aktiv", "Activo"],
  ["플랜별 혜택 한눈에 비교", "Compare plan benefits", "プラン特典を比較", "一眼比較方案優惠", "Comparer les avantages", "Vorteile vergleichen", "Comparar beneficios"],
  ["프리미엄으로 업그레이드", "Upgrade to Premium", "プレミアムにアップグレード", "升級為進階版", "Passer à Premium", "Auf Premium upgraden", "Pasar a Premium"],
  ["평생 소장으로 변경", "Switch to Lifetime", "永久版に変更", "升級為終身版", "Passer à À vie", "Auf Lebenslang wechseln", "Cambiar a Vitalicio"],
  ["무료로 되돌리기 (테스트)", "Revert to Free (test)", "無料に戻す（テスト）", "恢復免費版（測試）", "Revenir au gratuit (test)", "Auf Kostenlos zurück (Test)", "Volver a Gratis (prueba)"],
  ["카테고리 관리", "Categories", "カテゴリー管理", "分類管理", "Catégories", "Kategorien", "Categorías"],
  ["내 보관함", "My storage", "保管箱", "我的儲存空間", "Mon stockage", "Mein Speicher", "Mi almacén"],
  ["{0} / {1} 사용 중", "{0} / {1} used", "{0} / {1} 使用中", "已使用 {0} / {1}", "{0} / {1} utilisés", "{0} / {1} belegt", "{0} / {1} usados"],
  ["무료 체험 {0}일 남았어요 (7일 · 100MB)", "{0} days left in free trial (7 days · 100MB)", "無料体験 残り{0}日（7日 · 100MB）", "免費試用尚餘 {0} 天（7天 · 100MB）", "{0}j restants (essai 7j · 100Mo)", "Noch {0} Tage Test (100 MB)", "Quedan {0} días de prueba"],
  ["무료 체험 7일이 끝났어요. 업그레이드하면 계속 보관할 수 있어요", "Your 7-day trial ended. Upgrade to keep storing", "7日間の無料体験が終了しました。アップグレードで保管を続けられます", "7 天試用已結束，升級即可繼續保存", "Essai terminé. Passez à Premium", "Testzeit beendet. Jetzt upgraden", "Prueba terminada. Actualiza para seguir"],
  ["파일 1개당 최대 20MB", "Up to 20MB per file", "1ファイル最大20MB", "單檔上限 20MB", "Max 20 Mo/fichier", "Max. 20 MB/Datei", "Máx. 20 MB/archivo"],
  ["알림", "Notifications", "通知", "通知", "Notifications", "Mitteilungen", "Notificaciones"],
  ["일정 미리 챙겨주기 알림", "Early schedule reminders", "予定の事前リマインド", "行程提前提醒", "Rappels anticipés", "Vorab-Erinnerungen", "Recordatorios anticipados"],
  ["앱 테마", "App theme", "アプリテーマ", "應用程式主題", "Thème", "App-Design", "Tema"],
  ["라이트", "Light", "ライト", "淺色", "Clair", "Hell", "Claro"],
  ["다크", "Dark", "ダーク", "深色", "Sombre", "Dunkel", "Oscuro"],
  ["언어", "Language", "言語", "語言", "Langue", "Sprache", "Idioma"],
  ["AI 답변과 음성 입력도 이 언어로 바뀌어요", "AI replies and voice input switch to this language too", "AIの返答と音声入力もこの言語になります", "AI 回覆與語音輸入也會同步切換為此語言", "L'IA et la voix s'adaptent aussi", "KI-Antworten & Sprache wechseln mit", "La IA y la voz también cambiarán"],
  ["개인정보처리방침", "Privacy Policy", "プライバシーポリシー", "隱私權政策", "Confidentialité", "Datenschutz", "Privacidad"],
  ["이용약관", "Terms of Service", "利用規約", "服務條款", "Conditions", "Nutzungsbedingungen", "Términos"],
  ["톡비서 웹 버전 v1.1.0", "TalkSec v1.1.0", "トーク秘書 v1.1.0", "對話秘書 v1.1.0", "TalkSec v1.1.0", "TalkSec v1.1.0", "TalkSec v1.1.0"],
  ["회원탈퇴", "Delete account", "退会", "刪除帳號", "Supprimer le compte", "Konto löschen", "Eliminar cuenta"],
  ["정말 떠나시나요?", "Are you really leaving?", "本当に退会しますか？", "真的要離開嗎？", "Voulez-vous vraiment partir ?", "Wirklich gehen?", "¿Seguro que quieres irte?"],
  [
    "탈퇴하면 저장된 메모, 캘린더 기록, 대화, 나만의 카테고리, 올린 파일이 모두 바로 지워지고 되돌릴 수 없어요.",
    "Deleting your account immediately erases all notes, calendar entries, chats, custom categories and files. This can't be undone.",
    "退会すると、メモ・カレンダー・会話・マイカテゴリー・ファイルがすべて即座に削除され、元に戻せません。",
    "刪除帳號後，所有筆記、行事曆、對話、自訂分類與檔案都將立即永久刪除，無法復原。",
    "La suppression effacera immédiatement toutes vos notes, calendriers, discussions et fichiers de façon irréversible.",
    "Beim Löschen werden alle Notizen, Termine, Chats und Dateien sofort unwiderruflich entfernt.",
    "Al eliminar tu cuenta se borrarán todas las notas, calendarios, chats y archivos de forma irreversible.",
  ],
  ["계속하려면 {0}라고 입력해 주세요.", "Type {0} to continue.", "続けるには「{0}」と入力してください。", "若要繼續，請輸入「{0}」。", "Tapez {0} pour continuer.", "Gib {0} ein, um fortzufahren.", "Escribe {0} para continuar."],
  ["탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요", "Couldn't delete the account. Please try again later", "退会できませんでした。しばらくしてからお試しください", "無法刪除帳號，請稍後再試", "Échec de la suppression. Réessayez plus tard", "Konto konnte nicht gelöscht werden", "No se pudo eliminar la cuenta"],
  ["지우는 중…", "Deleting…", "削除中…", "刪除中…", "Suppression…", "Wird gelöscht…", "Eliminando…"],
  ["탈퇴하기", "Delete", "退会する", "刪除帳號", "Supprimer", "Löschen", "Eliminar"],
  // login
  ["던지기만 하세요. 정리는 제가 할게요.", "Just toss it in. I'll keep it organized.", "ポイッと投げるだけ。整理はおまかせ。", "只需隨手丟入，整理就交給我。", "Déposez vos idées. Je m'occupe du tri.", "Einfach reinwerfen. Ich sortiere den Rest.", "Solo envíalo. Yo me encargo de ordenarlo."],
  ["이메일", "Email", "メールアドレス", "電子郵件", "E-mail", "E-Mail", "Correo electrónico"],
  ["비밀번호", "Password", "パスワード", "密碼", "Mot de passe", "Passwort", "Contraseña"],
  ["로그인", "Log in", "ログイン", "登入", "Connexion", "Anmelden", "Iniciar sesión"],
  ["회원가입", "Sign up", "新規登録", "註冊", "Inscription", "Registrieren", "Registrarse"],
  ["Google로 계속하기", "Continue with Google", "Googleで続ける", "使用 Google 繼續", "Continuer avec Google", "Mit Google fortfahren", "Continuar con Google"],
  ["Google로 1초 만에 시작하기", "Start in 1 sec with Google", "Googleで1秒スタート", "用 Google 1 秒開始", "Démarrer en 1s avec Google", "In 1 Sek. mit Google starten", "Empieza en 1s con Google"],
  ["이메일로 로그인 · 가입", "Sign in or sign up with email", "メールでログイン・登録", "使用電子郵件登入 · 註冊", "Connexion / Inscription par e-mail", "Mit E-Mail anmelden", "Entrar o registrarse con correo"],
  ["처음이신가요? ", "New here? ", "はじめてですか？ ", "初次使用嗎？ ", "Nouveau ici ? ", "Neu hier? ", "¿Nuevo aquí? "],
  ["이미 계정이 있나요? ", "Already have an account? ", "アカウントをお持ちですか？ ", "已有帳號了嗎？ ", "Déjà un compte ? ", "Bereits ein Konto? ", "¿Ya tienes cuenta? "],
  ["확인 메일을 보냈어요. 메일의 링크를 눌러 주세요", "We sent a confirmation email. Please click the link", "確認メールを送りました。リンクをクリックしてください", "已寄出驗證信，請點擊信中連結", "E-mail de confirmation envoyé", "Bestätigungs-E-Mail gesendet", "Correo de confirmación enviado"],
  ["구글 로그인에 실패했어요", "Google sign-in failed", "Googleログインに失敗しました", "Google 登入失敗", "Échec de connexion Google", "Google-Anmeldung fehlgeschlagen", "Error al iniciar con Google"],
  ["구글 로그인 화면으로 이동 중...", "Redirecting to Google sign-in...", "Googleログイン画面へ移動中...", "正在前往 Google 登入頁面...", "Redirection vers Google...", "Weiterleitung zu Google...", "Redirigiendo a Google..."],
  ["복사한 링크를 바로 정리할까요?", "Organize copied link now?", "コピーしたリンクをすぐ整理しますか？", "要立即整理複製的連結嗎？", "Organiser le lien copié ?", "Kopierten Link sortieren?", "¿Organizar el enlace copiado?"],
  ["바로 던지기", "Send now", "すぐ送る", "立即傳送", "Envoyer", "Jetzt senden", "Enviar ahora"],
  ["구독·보관함", "Plan & Storage", "プラン・保管", "方案與空間", "Offre & Stockage", "Abo & Speicher", "Plan y Almacén"],
  ["정리·알림", "Sort & Alerts", "整理・通知", "整理與通知", "Tri & Alertes", "Sortierung & Alarme", "Orden y Avisos"],
  ["화면·계정", "Display & Account", "画面・アカウント", "顯示與帳號", "Affichage & Compte", "Anzeige & Konto", "Pantalla y Cuenta"],
  ["맨 아래로", "Scroll to bottom", "一番下へ", "捲動到底部", "Aller en bas", "Nach unten", "Ir abajo"],
  ["눌러서 바로 체험해 보세요", "Tap to try right away", "タップしてすぐ試せます", "點擊立即體驗", "Appuyez pour essayer", "Zum Testen antippen", "Toca para probar"],
  ["내일 오전 10시 회의 9시에 알려줘", "Remind me at 9am for tomorrow's 10am meeting", "明日の午前10時の会議を9時に教えて", "明天上午 10 點的會議請在 9 點提醒我", "Rappelle-moi à 9h la réunion de demain 10h", "Erinnere mich um 9 Uhr an das Meeting morgen", "Recuérdame a las 9 la reunión de mañana"],
  ["장보기: 우유, 계란, 커피", "Groceries: milk, eggs, coffee", "買い物：牛乳、卵、コーヒー", "採買：牛奶、雞蛋、咖啡", "Courses : lait, œufs, café", "Einkauf: Milch, Eier, Kaffee", "Compras: leche, huevos, café"],
  ["이번 달 던진 메모 보여줘", "Show notes saved this month", "今月保存したメモを見せて", "顯示這個月儲存的筆記", "Afficher les notes de ce mois", "Notizen dieses Monats zeigen", "Mostrar notas de este mes"],
  ["톡비서 알림", "TalkSec reminder", "トーク秘書のお知らせ", "對話秘書提醒", "Rappel TalkSec", "TalkSec-Erinnerung", "Recordatorio TalkSec"],
  // server fallbacks
  ["아직 서류함이 비어 있어요. 먼저 뭐든 던져 주세요", "Your drawer is empty. Toss something in first", "書類箱はまだ空です。まず何か投げてください", "資料夾目前是空的，請先隨意丟入內容", "Votre tiroir est vide. Déposez quelque chose d'abord", "Ablage ist leer. Wirf zuerst etwas rein", "Tu cajón está vacío. Envía algo primero"],
  ["관련 메모를 찾지 못했어요", "Couldn't find a related note", "関連するメモが見つかりませんでした", "找不到相關筆記", "Aucune note correspondante trouvée", "Keine passende Notiz gefunden", "No se encontraron notas relacionadas"],
  ["아직 고칠 메모가 없어요. 먼저 뭐든 던져 주세요", "No notes to edit yet. Toss something in first", "まだ編集するメモがありません。まず何か投げてください", "尚無可編輯的筆記，請先丟入內容", "Aucune note à modifier pour l'instant", "Noch keine Notiz zum Bearbeiten", "Aún no hay notas para editar"],
  ["저는 톡비서예요. 메모 정리·검색·알림 수정을 도와드릴게요!", "I'm TalkSec. I can help organize, find, and adjust reminders!", "トーク秘書です。メモの整理・検索・通知の変更をお手伝いします！", "我是對話秘書！我可以幫您整理筆記、搜尋資料或修改提醒。", "Je suis TalkSec ! Je vous aide à classer, chercher et gérer vos rappels.", "Ich bin TalkSec! Ich helfe beim Sortieren, Suchen und Erinnern.", "¡Soy TalkSec! Te ayudo a organizar, buscar y ajustar avisos."],
  ["저는 톡비서예요. 메모 정리·검색·알림을 도와드릴게요!", "I'm TalkSec. I can help organize, find, and remind!", "トーク秘書です。メモの整理・検索・リマインドをお手伝いします！", "我是對話秘書！我可以幫您整理筆記、搜尋並提醒重要行程。", "Je suis TalkSec ! Je gère vos notes, recherches et rappels.", "Ich bin TalkSec! Ich helfe bei Notizen, Suche und Terminen.", "¡Soy TalkSec! Te ayudo con tus notas, búsquedas y avisos."],
  ["어떤 부분을 고칠지 잘 모르겠어요. 예: \"알람은 화요일 오전 10시로\"", "Not sure what to change. e.g. \"set the alarm to Tuesday 10am\"", "どこを直すかわかりませんでした。例：「通知は火曜の午前10時に」", "不太確定要修改哪裡，例如：「把提醒改成週二上午 10 點」", "Je ne sais pas quoi modifier, ex : « mardi à 10h »", "Unklar, was geändert werden soll, z.B. «Dienstag 10 Uhr»", "No sé qué cambiar, ej: «el martes a las 10»"],
  ["말씀하신 대로 고쳐 두었어요", "Updated as you asked", "おっしゃる通りに直しました", "已依您的指示修改完成", "Mis à jour selon votre demande", "Wie gewünscht aktualisiert", "Actualizado como pediste"],
  ["알겠어요! 잘 챙겨둘게요", "Got it! I'll keep it safe", "了解です！しっかり保管します", "好的！我會幫您妥善保存", "C'est noté, je garde ça précieusement", "Verstanden! Ich bewahre es sicher auf", "¡Entendido! Lo guardaré bien"],
  // Gemini-style Navigation Drawer & UI redesign
  ["사이드 메뉴", "Side menu", "サイドメニュー", "側邊選單", "Menu latéral", "Seitenmenü", "Menú lateral"],
  ["AI 스마트 비서", "AI Smart Secretary", "AIスマート秘書", "AI 智慧秘書", "Assistant IA intelligent", "Smarter KI-Assistent", "Asistente IA inteligente"],
  ["멤버십 상태", "Membership", "メンバーシップ", "會員方案", "Abonnement", "Mitgliedschaft", "Membresía"],
  ["프리미엄 이용 중", "Premium Active", "プレミアム利用中", "進階版使用中", "Premium actif", "Premium aktiv", "Premium activo"],
  ["무제한 스마트 혜택", "Unlimited Smart Perks", "無制限スマート特典", "無限智慧專屬優惠", "Avantages illimités", "Unbegrenzte Vorteile", "Beneficios ilimitados"],
  ["월 4,900원 정기구독", "₩4,900/mo Subscription", "月額4,900ウォン定期購読", "每月 ₩4,900 定期訂閱", "Abonnement ₩4,900/mois", "Abo ₩4,900/Monat", "Suscripción ₩4,900/mes"],
  ["혜택 보기", "View perks", "特典を見る", "查看優惠", "Voir les avantages", "Vorteile ansehen", "Ver beneficios"],
  ["업그레이드 안내", "Upgrade info", "プラン詳細", "升級方案說明", "Voir les offres", "Upgrade-Infos", "Ver planes"],
  ["기능 및 환경 설정", "Features & Preferences", "機能および環境設定", "功能與偏好設定", "Fonctions & Préférences", "Funktionen & Einstellungen", "Funciones y Preferencias"],
  ["카테고리 만들기 · 관리", "Create & Manage Categories", "カテゴリの作成・管理", "建立與管理分類", "Créer et gérer les catégories", "Kategorien verwalten", "Crear y gestionar categorías"],
  ["언어 선택", "Language", "言語設定", "選擇語言", "Langue", "Sprache", "Idioma"],
  ["일정 미리 알림", "Event Reminders", "予定の事前通知", "行程提前通知", "Rappels d'événements", "Terminerinnerungen", "Recordatorios de eventos"],
  ["보관함 용량", "Storage Space", "ストレージ容量", "儲存空間", "Espace de stockage", "Speicherplatz", "Espacio de almacenamiento"],
  ["보관된 서류", "Saved items", "保存済み書類", "已儲存項目", "Éléments enregistrés", "Gespeicherte Elemente", "Elementos guardados"],
  ["보관된 서류 {0}건", "{0} items saved", "保存済み書類 {0}件", "已儲存項目 {0} 筆", "{0} éléments enregistrés", "{0} Elemente gespeichert", "{0} elementos guardados"],
  ["건", " items", "件", " 筆", " él.", " Elem.", " elem."],
  ["용량 관리", "Manage storage", "容量管理", "管理空間", "Gérer l'espace", "Speicher verwalten", "Gestionar espacio"],
  ["로그인 계정", "Signed-in Account", "ログインアカウント", "登入帳號", "Compte connecté", "Angemeldetes Konto", "Cuenta conectada"],
  ["계정 설정", "Account settings", "アカウント設定", "帳號設定", "Paramètres du compte", "Kontoeinstellungen", "Ajustes de cuenta"],
  ["일정 알림", "Schedule Alerts", "予定通知", "行程提醒", "Alertes d'agenda", "Terminerinnerungen", "Alertas de agenda"],
  ["켜짐", "On", "オン", "開啟", "Activé", "Ein", "Activado"],
  ["꺼짐", "Off", "オフ", "關閉", "Désactivé", "Aus", "Desactivado"],
  ["기기 설정에서 알림 권한을 허용해 주세요", "Please allow notifications in device settings", "端末の設定で通知を許可してください", "請在裝置設定中允許通知權限", "Autorisez les notifications dans les réglages", "Bitte Benachrichtigungen in den Einstellungen erlauben", "Permite las notificaciones en los ajustes del dispositivo"],
  ["회원 탈퇴", "Delete Account", "退会する", "刪除帳號", "Supprimer le compte", "Konto löschen", "Eliminar cuenta"],
  ["개인정보", "Privacy", "プライバシー", "隱私權", "Confidentialité", "Datenschutz", "Privacidad"],
  ["이용방법", "Guide", "使い方", "使用說明", "Guide", "Anleitung", "Guía"],
  ["앱 테마 선택", "Select App Theme", "アプリテーマ選択", "選擇主題外觀", "Choisir le thème", "App-Design wählen", "Elegir tema"],
  ["라이트 모드", "Light Mode", "ライトモード", "淺色模式", "Mode clair", "Heller Modus", "Modo claro"],
  ["다크 모드", "Dark Mode", "ダークモード", "深色模式", "Mode sombre", "Dunkler Modus", "Modo oscuro"],
  ["정말 회원 탈퇴하시나요?", "Delete your account?", "本当に退会しますか？", "確定要刪除帳號嗎？", "Supprimer votre compte ?", "Konto wirklich löschen?", "¿Eliminar tu cuenta?"],
  [
    "탈퇴하면 저장된 메모, 캘린더 기록, 대화 내역, 사진 및 올린 파일이 즉시 영구 삭제되며 절대 복구할 수 없습니다.",
    "Deleting your account permanently removes all saved notes, calendar events, chat history, and uploaded files. This cannot be undone.",
    "退会すると、保存されたメモ・カレンダー・チャット履歴・写真やファイルは即座に完全削除され、復元できません。",
    "刪除帳號後，所有筆記、行事曆、對話紀錄、照片與檔案將立即永久刪除且無法復原。",
    "La suppression efface définitivement notes, calendriers, discussions et fichiers. Action irréversible.",
    "Beim Löschen werden alle Notizen, Termine, Chats und Dateien sofort unwiderruflich gelöscht.",
    "Al eliminar tu cuenta se borrarán permanentemente notas, calendarios, chats y archivos.",
  ],
  ["구글 플레이스토어 정기 구독 안내", "Google Play Subscription Notice", "Google Play 定期購読のご案内", "Google Play 訂閱注意事項", "Info abonnement Google Play", "Google Play-Abo-Hinweis", "Aviso suscripción Google Play"],
  [
    "구글 플레이스토어를 통해 정기 구독 중이신 경우, 앱을 탈퇴하셔도 구글 구독이 자동 해지되지 않습니다. 반드시 구글 플레이스토어 앱의 [결제 및 정기 결제] 메뉴에서 구독을 먼저 해지해 주세요.",
    "If you have an active Google Play subscription, deleting your account will NOT cancel it automatically. Please cancel your subscription in Google Play Store > Payments & subscriptions first.",
    "Google Play ストアで定期購読中の場合、アプリを退会しても購読は自動解約されません。必ず Google Play ストアアプリの［お支払いと定期購入］から先に解約してください。",
    "若您透過 Google Play 訂閱付費方案，刪除帳號不會自動取消訂閱。請務必先至 Google Play 商店的「付款與訂閱」取消訂閱。",
    "Si vous avez un abonnement Google Play, la suppression du compte ne l'annule pas. Résiliez-le d'abord dans Google Play Store > Paiements et abonnements.",
    "Bei einem Google Play-Abo wird dieses durch Kontolöschung nicht automatisch beendet. Bitte kündige es zuerst im Google Play Store.",
    "Si tienes suscripción en Google Play, borrar la cuenta no la cancela. Cancélala primero en Google Play > Pagos y suscripciones.",
  ],
  ["탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", "Could not delete account. Please try again shortly.", "退会処理中にエラーが発生しました。しばらくしてからお試しください。", "刪除帳號時發生錯誤，請稍後再試。", "Erreur lors de la suppression. Réessayez.", "Fehler beim Löschen. Bitte später erneut versuchen.", "Error al eliminar la cuenta. Inténtalo más tarde."],
  ["삭제 중...", "Deleting...", "削除中...", "刪除中...", "Suppression...", "Wird gelöscht...", "Eliminando..."],
  ["메뉴 열기", "Open menu", "メニューを開く", "開啟選單", "Ouvrir le menu", "Menü öffnen", "Abrir menú"],
  ["검색", "Search", "検索", "搜尋", "Rechercher", "Suchen", "Buscar"],
  ["찾아줘: ", "Find: ", "探して: ", "尋找: ", "Trouver : ", "Finde: ", "Buscar: "],
  ["톡비서 서류함이 비어 있어요", "Your drawer is empty", "トーク秘書の書類箱は空です", "對話秘書資料夾是空的", "Votre tiroir TalkSec est vide", "Deine TalkSec-Ablage ist leer", "Tu cajón TalkSec está vacío"],
  [
    "스크린샷, 영수증, 메모, 링크를 편하게 던져 주세요. 날짜와 중요한 할 일까지 알아서 똑똑하게 정리해 드릴게요.",
    "Toss in screenshots, receipts, notes, or links. I'll organize dates and important tasks automatically.",
    "スクショ・領収書・メモ・リンクを気軽に投げてください。日付や大切な予定も自動でスマートに整理します。",
    "隨手丟入截圖、收據、筆記或連結吧！我會自動為您整理日期與重要待辦事項。",
    "Déposez captures, reçus, notes ou liens. J'organise automatiquement vos dates et tâches.",
    "Wirf Screenshots, Belege, Notizen oder Links rein. Termine und Aufgaben ordne ich automatisch.",
    "Envía capturas, recibos, notas o enlaces. Organizaré fechas y tareas automáticamente.",
  ],
  ["이번 달 저장한 스샷 보여줘", "Show screenshots saved this month", "今月保存したスクショを見せて", "顯示這個月儲存的截圖", "Captures enregistrées ce mois-ci", "Screenshots dieses Monats zeigen", "Capturas guardadas este mes"],
  ["저장된 메모와 캘린더 기록은 그대로 안전하게 남아요", "Saved notes and calendar events stay safe.", "保存したメモとカレンダー記録はそのまま安全に残ります", "已儲存的筆記與行事曆紀錄會安全保留", "Vos notes et événements restent en sécurité.", "Gespeicherte Notizen und Termine bleiben sicher.", "Tus notas y eventos siguen a salvo."],
  ["첨부", "Attach", "添付", "附加", "Joindre", "Anhängen", "Adjuntar"],
  ["문서 · 모든 파일 첨부", "Attach docs · all files", "文書・すべてのファイルを添付", "附加文件 · 所有檔案", "Joindre docs · tous fichiers", "Dokumente · Alle Dateien", "Adjuntar docs · todos"],
  ["문서/이미지 첨부", "Attach docs / images", "文書・画像を添付", "附加文件 / 圖片", "Joindre docs / images", "Dokumente / Bilder", "Adjuntar docs / imágenes"],
  ["더보기", "More", "その他", "更多", "Plus", "Mehr", "Más"],
  // 출시 이벤트 무료 사용 기간 안내
  ["이용 안내", "Plan info", "ご利用案内", "使用說明", "Infos offre", "Nutzungsinfo", "Info del plan"],
  ["출시 이벤트", "Launch Event", "リリースイベント", "上市活動", "Offre de lancement", "Start-Aktion", "Evento de lanzamiento"],
  ["출시 이벤트 무료 사용 기간", "Launch Event Free Period", "リリースイベント無料期間", "上市活動免費使用期間", "Période gratuite de lancement", "Kostenlose Startphase", "Periodo gratuito de lanzamiento"],
  ["출시 이벤트 무료 사용 기간 중이에요 (100MB 제공)", "Free during the launch event (100MB included)", "リリースイベント無料期間中です（100MB提供）", "上市活動免費使用期間（提供 100MB）", "Gratuit pendant le lancement (100 Mo inclus)", "In der Startphase kostenlos (100 MB inkl.)", "Gratis durante el lanzamiento (100 MB incluidos)"],
  ["정식 결제 도입 전까지 무료로 제공돼요", "Free until official billing launches", "正式決済導入まで無料でご利用いただけます", "正式付費上線前皆免費提供", "Gratuit jusqu'au lancement des paiements", "Kostenlos bis zur Einführung der Zahlung", "Gratis hasta lanzar los pagos oficiales"],
  ["복사됨!", "Copied!", "コピー済み!", "已複製！", "Copié !", "Kopiert!", "¡Copiado!"],
  ["공유", "Share", "共有", "分享", "Partager", "Teilen", "Compartir"],
  ["톡비서 답변", "TalkSec Reply", "トーク秘書の回答", "對話秘書回覆", "Réponse TalkSec", "TalkSec-Antwort", "Respuesta TalkSec"],
  ["이대로 서류함에 보관할까요?", "Save this to your drawer?", "このまま書類箱に保存しますか？", "要這樣存入資料夾嗎？", "Enregistrer dans le tiroir ?", "In der Ablage speichern?", "¿Guardar en el cajón?"],
  ["목록 접기", "Collapse list", "リストを閉じる", "收起列表", "Réduire la liste", "Liste einklappen", "Contraer lista"],
  ["보관", "Save", "保存", "儲存", "Enregistrer", "Speichern", "Guardar"],
  ["수정 완료", "Save changes", "編集を保存", "儲存變更", "Enregistrer", "Änderungen speichern", "Guardar cambios"],
  ["수정하지 못했어요", "Could not update category", "編集できませんでした", "無法更新分類", "Modification impossible", "Kategorie nicht aktualisiert", "No se pudo actualizar"],
  ["새 카테고리 만들기", "Create new category", "新しいカテゴリを作成", "建立新分類", "Nouvelle catégorie", "Neue Kategorie erstellen", "Crear nueva categoría"],
  ["‘{0}’ 카테고리 수정 중", "Editing ‘{0}’", "「{0}」カテゴリを編集中", "正在編輯「{0}」分類", "Modification de « {0} »", "Bearbeite «{0}»", "Editando «{0}»"],
  ["‘{0}’ 카테고리가 추가되었어요!", "Added ‘{0}’!", "「{0}」カテゴリが追加されました！", "已新增「{0}」分類！", "Catégorie « {0} » ajoutée !", "Kategorie «{0}» hinzugefügt!", "¡Categoría «{0}» añadida!"],
  ["‘{0}’ 카테고리가 수정되었어요!", "Updated ‘{0}’!", "「{0}」カテゴリが更新されました！", "已更新「{0}」分類！", "Catégorie « {0} » mise à jour !", "Kategorie «{0}» aktualisiert!", "¡Categoría «{0}» actualizada!"],
  ["저장하기", "Save", "保存する", "儲存", "Enregistrer", "Speichern", "Guardar"],
  ["자세히", "Details", "詳細", "詳細", "Détails", "Details", "Detalles"],
  ["톡비서 프리미엄", "TalkSec Premium", "プレミアム", "對話秘書進階版", "TalkSec Premium", "TalkSec Premium", "TalkSec Premium"],
  ["컬러 테마", "Color theme", "カラーテーマ", "色彩主題", "Couleur du thème", "Farbthema", "Color del tema"],
  ["라벤더", "Lavender", "ラベンダー", "薰衣草紫", "Lavande", "Lavendel", "Lavanda"],
  ["앰버", "Amber", "アンバー", "琥珀黃", "Ambre", "Bernstein", "Ámbar"],
];

const IDX: Record<Exclude<Lang, "ko">, number> = { en: 0, ja: 1, zh: 2, fr: 3, de: 4, es: 5 };
const MAP: Record<string, [string, string, string, string, string, string]> = Object.fromEntries(
  D.map(([k, en, ja, zh, fr, de, es]) => [k, [en, ja, zh, fr, de, es]]),
);

let current: Lang = "ko";
const subs = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function detectLang(): Lang {
  try {
    const s = localStorage.getItem(KEY);
    if (s && (LANGS as readonly string[]).includes(s)) return s as Lang;
    const rawList =
      typeof navigator !== "undefined"
        ? [...(navigator.languages ?? []), navigator.language].filter(Boolean)
        : [];
    for (const raw of rawList) {
      const code = raw.toLowerCase().slice(0, 2);
      if (
        code === "ko" ||
        code === "ja" ||
        code === "zh" ||
        code === "fr" ||
        code === "de" ||
        code === "es" ||
        code === "en"
      ) {
        return code as Lang;
      }
    }
    return "en";
  } catch {
    return "ko";
  }
}

export function setLang(l: Lang, persist = true) {
  current = l;
  if (typeof document !== "undefined") document.documentElement.lang = LOCALE[l];
  if (persist) {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }
  subs.forEach((f) => f());
}

/** 앱 시작 시 한 번 (useEffect 안에서) 호출 */
export function syncClientLang() {
  if (typeof window !== "undefined") setLang(detectLang(), false);
}

/** 번역: 한국어 원문 키, {0} {1} 치환 */
export function trL(lang: Lang, ko: string, ...args: (string | number)[]): string {
  const m = MAP[ko];
  let s = lang === "ko" || !m ? ko : m[IDX[lang]];
  args.forEach((a, i) => {
    s = s.split(`{${i}}`).join(String(a));
  });
  return s;
}

export const t = (ko: string, ...args: (string | number)[]) => trL(current, ko, ...args);
export const locale = () => LOCALE[current];

/** 언어 변경 시 컴포넌트를 다시 그리게 한다 */
export function useLang(): Lang {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => {
        subs.delete(f);
      };
    },
    () => current,
    () => "ko" as Lang,
  );
}

const AI_LANG_INFO: Record<Exclude<Lang, "ko">, { name: string; self: string }> = {
  en: { name: "English", self: "TalkSec" },
  ja: { name: "Japanese (polite 丁寧語)", self: "トーク秘書" },
  zh: { name: "Traditional Chinese (繁體中文 / Taiwan Mandarin)", self: "對話秘書" },
  fr: { name: "French (Français)", self: "TalkSec" },
  de: { name: "German (Deutsch)", self: "TalkSec" },
  es: { name: "Spanish (Español)", self: "TalkSec" },
};

/** AI 프롬프트에 덧붙일 출력 언어 지시 (카테고리 값은 한국어 키 그대로 유지) */
export function aiLangRule(lang: Lang): string {
  if (lang === "ko") return "";
  const info = AI_LANG_INFO[lang];
  return `\n\n[OUTPUT LANGUAGE] The user uses ${info.name}. Write ALL user-facing text (summary, reply, answer, remind_message, tags, secretary_reply) in ${info.name}, and call yourself "${info.self}" instead of 톡비서. Keep "category" values EXACTLY as the given Korean enum strings and keep JSON keys/action values unchanged.`;
}
