/**
 * 다국어 지원(한국어 · 영어 · 일본어) 및 단말기 언어 자동 감지 모듈
 */
const LANG_PREF_KEY = 'yj_wrong_note_lang_v1';
const SUPPORTED_LANGS = ['ko', 'en', 'ja'];

export function detectDeviceLang() {
  const candidates = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'en'];

  for (const raw of candidates) {
    const code = String(raw || '').toLowerCase();
    if (code.startsWith('ko')) return 'ko';
    if (code.startsWith('ja')) return 'ja';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

export function getLangPref() {
  try {
    const saved = localStorage.getItem(LANG_PREF_KEY);
    if (saved === 'auto' || SUPPORTED_LANGS.includes(saved)) return saved;
  } catch {
    // 무시
  }
  return 'auto';
}

export function getLang() {
  const pref = getLangPref();
  return pref === 'auto' ? detectDeviceLang() : pref;
}

export function setLangPref(pref) {
  const normalized = pref === 'auto' || SUPPORTED_LANGS.includes(pref) ? pref : 'auto';
  try {
    localStorage.setItem(LANG_PREF_KEY, normalized);
  } catch {
    // 무시
  }
  applyStaticTranslations();
  return getLang();
}

const TRANSLATIONS = {
  ko: {
    'app.name': '오답정복',
    'app.titleFull': '오답정복 — 3초 등록 · 쓱-지우개 · 정복하기',

    'aria.openSettings': '설정 메뉴 열기',
    'aria.selectSubject': '과목 선택',
    'aria.back': '뒤로 가기',
    'aria.close': '닫기',
    'aria.exitReview': '정복 나가기',
    'aria.masteredSubjectSelect': '정복 문제 과목 선택',
    'aria.settingsMenu': '설정 메뉴',
    'aria.cardMenu': '문제 메뉴',
    'aria.deleteForever': '완전 삭제',
    'aria.help': '도움말',

    'home.masteredBtn': '정복함',
    'home.totalSummary': '전체 {count}문제',
    'home.startReview': '정복하기',
    'home.addWrong': '오답 올리기',
    'home.emptyTitle': '아직 등록된 오답이 없어요',
    'home.emptyDesc': '오른쪽 아래 <b>오답 올리기</b>를 눌러<br/>3초 만에 첫 오답을 등록해 보세요.',

    'subject.all': '전체',
    'subject.uncategorized': '미분류',
    'subject.manage': '과목설정',

    'card.wrongCount': '{count}번 틀림',
    'card.beforeMastery': '정복 전',
    'card.streak': '연속 {streak}/{target}',
    'card.photoProblem': '사진 문제',
    'card.thumbAlt': '문제 썸네일',
    'card.edit': '수정하기',
    'card.delete': '삭제하기',
    'card.deleteConfirmMsg': '이 오답 카드를 삭제할까요?',
    'card.deleteConfirmTitle': '오답 삭제',
    'card.mastered': '정복 완료',
    'card.masteredSub': '눌러서 다시 풀거나 복구할 수 있어요',
    'card.restore': '복구',
    'card.deleteForever': '영구삭제',
    'card.deleteForeverConfirmMsg': '정복 보관함에서도 이 문제를 완전히 지울까요?',
    'card.deleteForeverConfirmTitle': '완전 삭제',

    'add.titleNew': '3초 오답 올리기',
    'add.titleEdit': '오답 수정하기',
    'add.section1': '1. 틀린 문제',
    'add.section2': '2. 정답 · 해설',
    'add.section3': '3. 과목',
    'add.section3Hint': '(방금 고른 과목 자동 선택)',
    'add.pickPhoto': '사진 찍기 / 고르기 (최대 2장)',
    'add.clearPhoto': '선택 사진 지우기',
    'add.problemPlaceholder': '사진 대신 문제 내용을 간단히 적거나, 한 줄 메모를 남기세요 (선택)',
    'add.answerPlaceholder': '사진 대신 정답·해설을 간단히 적거나, 한 줄 메모를 남기세요 (선택)',
    'add.save': '저장하기',
    'add.saveEdit': '수정 완료',
    'add.photoTab': '사진 {num}',
    'add.maxPhotos': '사진은 최대 2장까지만 올릴 수 있습니다.\n기존 사진을 지운 뒤 다시 올려 주세요.',
    'add.maxPhotosPartial': '사진은 최대 2장까지만 올릴 수 있어 {remain}장만 추가합니다.',
    'add.invalidImage': '올바른 사진 파일(JPG, PNG 등)만 올릴 수 있습니다.',
    'add.imageTooLarge': '사진 용량이 너무 큽니다. 15MB 이하의 사진을 선택해 주세요.',
    'add.needProblem': '문제 사진을 올리거나 문제 내용을 간단히 적어 주세요!',
    'add.subjectFull': '\'{subject}\' 과목에는 최대 {max}문제까지만 저장할 수 있어요.\n정복하거나 기존 문제를 정리한 뒤 다시 올려 주세요.',
    'add.toastSaved': '오답을 쏙 저장했어요!',
    'add.toastUpdated': '오답을 수정했어요!',

    'editor.eraser': '쓱-지우개',
    'editor.crop': '자르기',
    'editor.rotate': '회전',
    'editor.undo': '되돌리기',
    'editor.eraserSize': '지우개 크기',
    'editor.modeSmart': '색깔 펜만 (글자 보호)',
    'editor.modeAll': '연필 · 모두 지우기',
    'editor.hintIdle': '필요할 때 위에서 쓱-지우개나 자르기를 눌러 편집하세요.',
    'editor.hintEraser': '내가 푼 볼펜·형광펜 자국 위를 손가락으로 쓱 문질러 지우세요.',
    'editor.hintEraserAnswer': '불필요한 낙서나 주변 여백을 지우거나 잘라내세요.',
    'editor.hintCrop': '모서리나 선을 끌어 영역을 맞춘 뒤, 바로 저장하거나 지우개로 넘어가세요.',
    'editor.cropNeedArea': '자르고 싶은 영역을 마우스나 손가락으로 먼저 지정해 주세요.',

    'review.swipeCorrect': '맞혔어요!',
    'review.swipeWrong': '한 번 더!',
    'review.revealAnswer': '터치해서 정답 확인',
    'review.doneTitle': '이번 판 정복 완료!',
    'review.reviewAgain': '미정복 문제 다시 정복',
    'review.backHome': '홈으로 돌아가기',
    'review.btnWrong': '틀렸어요',
    'review.btnCorrect': '맞혔어요',
    'review.swipeHintLeft': '← 왼쪽으로 던지세요',
    'review.swipeHintRight': '오른쪽으로 던지세요 →',
    'review.noProblems': '현재 과목에 등록된 문제가 없어요.\n오른쪽 아래 [오답 올리기]로 문제를 먼저 추가해 주세요.',
    'review.remainingToast': '미정복 {count}문제 남았어요!',
    'review.doneMasteredWithWrong': '정복 보관함 {total}문제 중 {correct}문제 맞혔고, 틀린 {wrong}문제는 오답 목록으로 복구했어요.',
    'review.doneMasteredAll': '정복 보관함 {total}문제를 모두 다시 맞혔어요!',
    'review.doneLoop': '미정복 {total}문제를 전부 정복해서 보관함으로 옮겼어요!',
    'review.doneNormalCleared': '총 {total}문제 중 {cleared}문제를 정복해서 보관함으로 옮겼어요!',
    'review.doneNormal': '총 {total}문제 중 {correct}문제 맞혔고, {wrong}문제 못 지웠어요.',
    'review.subjectFullKeepMastered': '\'{subject}\' 과목이 {max}문제 꽉 차서 정복함에 유지했어요',
    'review.restoredToWrongToast': '틀린 문제는 오답 목록으로 복구했어요',
    'review.clearedToast': '완전 정복! 정복 보관함으로 옮겼어요',
    'review.problemImgAlt': '오답 문제 사진 {num}',
    'review.answerImgAlt': '정답 해설 사진 {num}',
    'review.noAnswerMemo': '등록된 정답 메모가 없습니다.',

    'mastered.title': '정복 보관함',
    'mastered.summary': '정복 완료 {count}문제',
    'mastered.emptyTitle': '아직 정복 보관함이 비어 있어요',
    'mastered.emptyDesc': '오답을 정한 횟수만큼 연속으로 맞히면<br/>이곳에 안전하게 따로 모입니다.',
    'mastered.reviewAll': '정복한 문제 다시 풀기',
    'mastered.noneToReview': '정복 보관함에 다시 풀 문제가 아직 없어요.',
    'mastered.restoreFull': '\'{subject}\' 과목은 최대 {max}문제까지만 저장할 수 있어요.\n먼저 해당 과목의 문제를 조금 비운 뒤 복구해 주세요.',
    'mastered.restoredToast': '오답 목록으로 복구했어요!',

    'subjectModal.title': '과목설정',
    'subjectModal.addTitle': '과목 추가',
    'subjectModal.editTitle': '과목 수정',
    'subjectModal.placeholder': '예: 한국사, 과학',
    'subjectModal.add': '추가하기',
    'subjectModal.hint': '최대 13과목까지 만들 수 있어요.<br />과목을 지워도 문제는 ‘미분류’로 안전하게 남아요.',
    'subjectModal.hintPlain': '최대 13과목까지 만들 수 있어요.\n과목을 지워도 문제는 ‘미분류’로 안전하게 남아요.',
    'subjectModal.done': '완료',
    'subjectModal.empty': '등록된 과목이 없습니다. 상단의 ＋ 버튼으로 새 과목을 추가해 보세요.',
    'subjectModal.rename': '변경',
    'subjectModal.delete': '삭제',
    'subjectModal.needName': '과목 이름을 입력해 주세요.',
    'subjectModal.duplicate': '이미 같은 이름의 과목이 있습니다.',
    'subjectModal.deleteConfirmMsg': '\'{subject}\' 과목을 삭제할까요?\n(이 과목에 있던 문제는 \'미분류\'로 안전하게 남습니다.)',
    'subjectModal.deleteConfirmTitle': '과목 삭제',
    'subjectModal.needAddName': '추가할 과목 이름을 입력해 주세요.',
    'subjectModal.maxSubjects': '과목은 최대 {max}개까지만 만들 수 있어요.',

    'criteriaModal.title': '정복 기준 설정',
    'criteriaModal.sec1Title': '1. 정복 후 자동 삭제 기준',
    'criteriaModal.sec1Desc': '정복할 때 연속으로 몇 번 맞히면 목록에서 바로 지울까요? (1~19회)',
    'criteriaModal.streakPrefix': '연속',
    'criteriaModal.streakSuffix': '번 맞히면 목록에서 자동 삭제',
    'criteriaModal.apply': '적용하기',
    'criteriaModal.invalidNumber': '자동 삭제 기준 횟수는 1에서 19(20회 미만) 사이의 숫자로 입력해 주세요.',

    'dialog.alertTitle': '안내',
    'dialog.confirmTitle': '확인',
    'dialog.ok': '확인',
    'dialog.cancel': '취소',

    'license.trialLabel': '무료 체험 {days}일 남음',
    'license.purchasedLabel': '평생 소장 이용 중',
    'license.expiredLabel': '무료 체험 만료',
    'license.badgePurchased': '평생 소장',
    'license.badgeExpired': '체험 만료',
    'license.badgeTrial': '체험 중',
    'license.titleExpired': '7일 무료 체험이 종료되었어요',
    'license.titlePurchased': '평생 소장 이용 중',
    'license.titleTrial': '7일 무료 체험 · 평생 소장 안내',
    'license.headline': '단 한 번 3,900원 결제로<br />오답정복을 평생 소장하세요',
    'license.sub': '매달 나가는 구독료 부담 없이 커피 한 잔 값으로 쓱-지우개, 가림막 복습, 무제한 오답 등록까지 모든 기능을 평생 이용하실 수 있습니다. (이미 등록한 오답 복습은 계속 가능해요.)',
    'license.perk1': '구독료 없는 1회 결제 평생 소장 (₩3,900)',
    'license.perk2': '광고 없는 쾌적하고 깔끔한 학습 환경',
    'license.perk3': '쓱-지우개 · 가림막 복습 · 무제한 등록',
    'license.buyBtn': '평생 소장 구매하기 (₩3,900)',
    'license.buyBtnWithPrice': '평생 소장 구매하기 ({price})',
    'license.restoreBtn': '이미 구매하셨나요? 구매 복원',
    'license.buySuccessMsg': '평생 소장 결제가 완료되었어요! 이제 제한 없이 모든 기능을 사용하실 수 있습니다.',
    'license.buySuccessTitle': '평생 소장 완료',
    'license.restoreSuccessMsg': '이전 구매 내역이 확인되어 평생 소장 권한을 복원했어요!',
    'license.restoreNotFoundMsg': '현재 구글 계정에서 확인된 평생 소장 구매 내역이 없어요.',
    'license.playOnlyMsg': '구글 플레이 스토어에서 설치한 앱 안에서 결제 및 복원할 수 있어요.',
    'license.storeUnavailableMsg': '스토어 상품 정보를 아직 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    'license.buyCancelledMsg': '결제가 취소되었어요.',
    'license.buyErrorMsg': '구글 플레이 결제를 진행하지 못했어요. 잠시 후 다시 시도해 주세요.',
    'license.productTitle': '오답정복 평생 소장',

    'settings.title': '설정',
    'settings.subjects': '과목 설정',
    'settings.subjectsSub': '과목 추가, 이름 변경, 삭제',
    'settings.criteria': '정복 기준 설정',
    'settings.criteriaSub': '완전 정복 및 또 틀린 문제 기준 정하기',
    'settings.theme': '테마 설정',
    'settings.themeSub': '밝은·어두운 화면 및 5가지 앱 색상',
    'settings.language': '언어 설정',
    'settings.languageSub': '단말기 자동 맞춤 · 한국어 · English · 日本語',
    'settings.welcomeGuide': '사용 안내 다시 보기',
    'welcome.title': '오답정복 시작 안내',
    'welcome.ok': '시작하기',
    'welcome.message':
      '1. 1주일간 마음껏 사용해 보세요.\n\n2. 과목과 문제를 내 맘대로 변경할 수 있어요.\n\n3. 현재 있는 문제는 예시입니다.\n\n4. 정답을 확인 후 왼쪽으로 밀면 오답 처리, 오른쪽으로 밀면 정답 처리 됩니다.\n\n5. 틀린 문제는 사용자가 설정한 횟수만큼 연속해서 맞출 때까지 계속 반복해서 풀 수 있습니다.',
    'settings.license': '이용권 · 7일 무료 체험',
    'settings.licensePurchased': '평생 소장 중',
    'settings.guide': '이용방법',
    'settings.terms': '이용약관',
    'settings.privacy': '개인정보처리방침',
    'settings.guideBody': '1. 틀린 문제를 사진(최대 2장)이나 메모로 3초 만에 올립니다. (최대 13과목, 과목당 최대 50문제 저장 가능)\n2. 정복하기를 눌러 가림막을 열어 풀고 맞혔어요/틀렸어요를 누르거나 카드를 슥 밀어 넘깁니다. 틀린 문제는 다 지울 때까지 계속 돌아옵니다.\n3. 내가 정한 횟수만큼 연속으로 맞히면 정복 완료로 보고 목록에서 미련 없이 자동 정리됩니다.',
    'settings.termsBody': '이 앱은 틀린 문제만 가볍게 보고 정복한 문제는 자동 정리되는 초간편 오답정복 앱입니다. (최대 13과목 · 과목당 최대 50문제 지원)\n회원가입 없이 내 휴대폰에만 저장되므로, 앱을 지우면 저장된 문제도 함께 삭제됩니다.',
    'settings.privacyBody': '이 앱은 회원가입을 받지 않으며, 올리신 문제 사진과 메모를 외부 서버로 보내거나 수집하지 않고 내 휴대폰 안에만 안전하게 보관합니다.',

    'themeModal.title': '테마 설정',
    'themeModal.sec1Title': '화면 모드',
    'themeModal.sec1Desc': '공부하는 환경에 맞게 밝은 화면과 어두운 화면을 고르세요.',
    'themeModal.light': '화이트 모드',
    'themeModal.dark': '다크 모드',
    'themeModal.lightShort': '화이트',
    'themeModal.darkShort': '다크',
    'themeModal.sec2Title': '앱 테마 색상 (5가지)',
    'themeModal.sec2Desc': '버튼과 강조 색상에 적용될 대표 색을 선택하세요.',
    'themeModal.done': '적용 완료',
    'theme.color.indigo': '인디고',
    'theme.color.blue': '블루',
    'theme.color.emerald': '에메랄드',
    'theme.color.amber': '오렌지',
    'theme.color.gold': '골드',

    'langModal.title': '언어 설정',
    'langModal.desc': '사용할 언어를 선택하세요.',
    'langModal.auto': '자동 (기기 언어)',
    'langModal.autoSub': '현재 기기 언어: {langName}',
    'langModal.ko': '한국어',
    'langModal.en': 'English',
    'langModal.ja': '日本語',
    'langModal.done': '적용 완료',
    'lang.name.ko': '한국어',
    'lang.name.en': 'English',
    'lang.name.ja': '日本語',

    'storage.fullMsg': '저장 공간이 부족합니다. 오래된 오답 카드를 몇 개 정리해 주세요.',
    'storage.fullTitle': '저장 안내'
  },

  en: {
    'app.name': 'MistakeCrush',
    'app.titleFull': 'MistakeCrush — Flashcard & Mistake Note',

    'aria.openSettings': 'Open settings menu',
    'aria.selectSubject': 'Select subject',
    'aria.back': 'Go back',
    'aria.close': 'Close',
    'aria.exitReview': 'Exit study',
    'aria.masteredSubjectSelect': 'Select mastered subject',
    'aria.settingsMenu': 'Settings menu',
    'aria.cardMenu': 'Card menu',
    'aria.deleteForever': 'Delete permanently',
    'aria.help': 'Help',

    'home.masteredBtn': 'Mastered',
    'home.totalSummary': '{count} total',
    'home.startReview': 'Crush Now',
    'home.addWrong': 'Add Mistake',
    'home.emptyTitle': 'No mistakes saved yet',
    'home.emptyDesc': 'Tap <b>Add Mistake</b> below to save<br/>your first wrong answer in 3 seconds.',

    'subject.all': 'All',
    'subject.uncategorized': 'Uncategorized',
    'subject.manage': 'Subjects',

    'card.wrongCount': 'Missed {count}x',
    'card.beforeMastery': 'New',
    'card.streak': 'Streak {streak}/{target}',
    'card.photoProblem': 'Photo problem',
    'card.thumbAlt': 'Problem thumbnail',
    'card.edit': 'Edit',
    'card.delete': 'Delete',
    'card.deleteConfirmMsg': 'Delete this mistake card?',
    'card.deleteConfirmTitle': 'Delete Mistake',
    'card.mastered': 'Mastered',
    'card.masteredSub': 'Tap to retry or restore to your list',
    'card.restore': 'Restore',
    'card.deleteForever': 'Delete Permanently',
    'card.deleteForeverConfirmMsg': 'Permanently remove this problem from Mastered too?',
    'card.deleteForeverConfirmTitle': 'Delete Permanently',

    'add.titleNew': '3-Sec Mistake Note',
    'add.titleEdit': 'Edit Mistake',
    'add.section1': '1. Problem',
    'add.section2': '2. Answer & Explanation',
    'add.section3': '3. Subject',
    'add.section3Hint': '(Auto-selected from last used)',
    'add.pickPhoto': 'Take / Choose Photo (Max 2)',
    'add.clearPhoto': 'Remove Selected',
    'add.problemPlaceholder': 'Type the question or add a quick memo (optional)',
    'add.answerPlaceholder': 'Type the answer, explanation, or a quick note (optional)',
    'add.save': 'Save',
    'add.saveEdit': 'Save Changes',
    'add.photoTab': 'Photo {num}',
    'add.maxPhotos': 'You can upload up to 2 photos.\nPlease remove an existing photo first.',
    'add.maxPhotosPartial': 'Max 2 photos allowed. Adding {remain} photo(s).',
    'add.invalidImage': 'Only valid image files (JPG, PNG, etc.) can be uploaded.',
    'add.imageTooLarge': 'This image is too large. Please choose a photo under 15MB.',
    'add.needProblem': 'Please upload a problem photo or write a short question!',
    'add.subjectFull': '\'{subject}\' can hold up to {max} problems.\nPlease master or clear some items first.',
    'add.toastSaved': 'Mistake saved!',
    'add.toastUpdated': 'Changes saved!',

    'editor.eraser': 'Eraser',
    'editor.crop': 'Crop',
    'editor.rotate': 'Rotate',
    'editor.undo': 'Undo',
    'editor.eraserSize': 'Eraser Size',
    'editor.modeSmart': 'Color Ink Only (Protect Text)',
    'editor.modeAll': 'Pencil · Erase All',
    'editor.hintIdle': 'Tap Eraser or Crop above whenever you want to edit.',
    'editor.hintEraser': 'Swipe over pen or highlighter marks to erase your old work.',
    'editor.hintEraserAnswer': 'Erase extra scribbles or crop out the margins.',
    'editor.hintCrop': 'Drag the corners or edges to frame, then save or switch to Eraser.',
    'editor.cropNeedArea': 'Please drag to select the area you want to keep.',

    'review.swipeCorrect': 'Got it!',
    'review.swipeWrong': 'Retry!',
    'review.revealAnswer': 'Tap to reveal answer',
    'review.doneTitle': 'Session Complete!',
    'review.reviewAgain': 'Retry Missed Items',
    'review.backHome': 'Back to Home',
    'review.btnWrong': 'Missed',
    'review.btnCorrect': 'Got It',
    'review.swipeHintLeft': '← Swipe left',
    'review.swipeHintRight': 'Swipe right →',
    'review.noProblems': 'No problems in this subject yet.\nTap [Add Mistake] at the bottom right to add one.',
    'review.remainingToast': '{count} left to crush!',
    'review.doneMasteredWithWrong': 'Got {correct} of {total} mastered items right. {wrong} missed item(s) moved back to your list.',
    'review.doneMasteredAll': 'Aced all {total} mastered problems again!',
    'review.doneLoop': 'Crushed all {total} problems and moved them to Mastered!',
    'review.doneNormalCleared': 'Mastered {cleared} of {total} problems and moved them to Mastered!',
    'review.doneNormal': 'Got {correct} of {total} right, {wrong} still to go.',
    'review.subjectFullKeepMastered': '\'{subject}\' is full ({max}), kept in Mastered.',
    'review.restoredToWrongToast': 'Moved back to your mistake list',
    'review.clearedToast': 'Crushed! Moved to Mastered',
    'review.problemImgAlt': 'Problem photo {num}',
    'review.answerImgAlt': 'Answer photo {num}',
    'review.noAnswerMemo': 'No answer note added.',

    'mastered.title': 'Mastered Vault',
    'mastered.summary': '{count} mastered',
    'mastered.emptyTitle': 'Your Mastered Vault is empty',
    'mastered.emptyDesc': 'Get a mistake right enough times in a row<br/>and it will be safely archived here.',
    'mastered.reviewAll': 'Practice Mastered Again',
    'mastered.noneToReview': 'No mastered problems to practice yet.',
    'mastered.restoreFull': '\'{subject}\' can hold up to {max} problems.\nPlease clear some space in that subject first.',
    'mastered.restoredToast': 'Restored to mistake list!',

    'subjectModal.title': 'Manage Subjects',
    'subjectModal.addTitle': 'Add Subject',
    'subjectModal.editTitle': 'Edit Subjects',
    'subjectModal.placeholder': 'e.g. Biology, SAT',
    'subjectModal.add': 'Add',
    'subjectModal.hint': 'You can create up to 13 subjects.<br />Problems stay safely under Uncategorized if deleted.',
    'subjectModal.hintPlain': 'You can create up to 13 subjects.\nProblems stay safely under Uncategorized if deleted.',
    'subjectModal.done': 'Done',
    'subjectModal.empty': 'No subjects yet. Add one above using the + button.',
    'subjectModal.rename': 'Save',
    'subjectModal.delete': 'Delete',
    'subjectModal.needName': 'Please enter a subject name.',
    'subjectModal.duplicate': 'That subject name already exists.',
    'subjectModal.deleteConfirmMsg': 'Delete \'{subject}\'?\n(Problems in it will safely move to Uncategorized.)',
    'subjectModal.deleteConfirmTitle': 'Delete Subject',
    'subjectModal.needAddName': 'Please enter a subject name to add.',
    'subjectModal.maxSubjects': 'You can create up to {max} subjects.',

    'criteriaModal.title': 'Mastery Goal',
    'criteriaModal.sec1Title': '1. Auto-Mastery Streak',
    'criteriaModal.sec1Desc': 'How many times in a row should you get a problem right to mark it mastered? (1–19)',
    'criteriaModal.streakPrefix': 'Get it right',
    'criteriaModal.streakSuffix': 'times in a row to master',
    'criteriaModal.apply': 'Apply',
    'criteriaModal.invalidNumber': 'Please enter a number between 1 and 19.',

    'dialog.alertTitle': 'Notice',
    'dialog.confirmTitle': 'Confirm',
    'dialog.ok': 'OK',
    'dialog.cancel': 'Cancel',

    'license.trialLabel': '{days} days left in free trial',
    'license.purchasedLabel': 'Lifetime Access Active',
    'license.expiredLabel': 'Free Trial Ended',
    'license.badgePurchased': 'Lifetime',
    'license.badgeExpired': 'Expired',
    'license.badgeTrial': 'Free Trial',
    'license.titleExpired': 'Your 7-day free trial has ended',
    'license.titlePurchased': 'Lifetime Access Active',
    'license.titleTrial': '7-Day Free Trial · Lifetime',
    'license.headline': 'Unlock MistakeCrush Forever<br />with a single payment',
    'license.sub': 'No recurring subscriptions. Pay once to unlock unlimited problem registrations, Magic Eraser, and Flashcard Review for life. (You can still review saved problems anytime.)',
    'license.perk1': 'One-time purchase, no monthly subscription',
    'license.perk2': '100% ad-free study experience',
    'license.perk3': 'Eraser · Flashcard Curtain · Unlimited Entries',
    'license.buyBtn': 'Buy Lifetime Access ($2.99)',
    'license.buyBtnWithPrice': 'Buy Lifetime Access ({price})',
    'license.restoreBtn': 'Already purchased? Restore Purchase',
    'license.buySuccessMsg': 'Thank you! Lifetime access is now unlocked on this device.',
    'license.buySuccessTitle': 'Purchase Complete',
    'license.restoreSuccessMsg': 'Previous purchase found! Your lifetime access has been restored.',
    'license.restoreNotFoundMsg': 'No previous lifetime purchase was found on this Google account.',
    'license.playOnlyMsg': 'Purchases and restores are available inside the Google Play Store app.',
    'license.storeUnavailableMsg': 'Could not load store item details yet. Please try again shortly.',
    'license.buyCancelledMsg': 'Purchase was cancelled.',
    'license.buyErrorMsg': 'Could not complete Google Play billing. Please try again shortly.',
    'license.productTitle': 'MistakeCrush Lifetime Access',

    'settings.title': 'Settings',
    'settings.subjects': 'Subjects',
    'settings.subjectsSub': 'Add, rename, or remove subjects',
    'settings.criteria': 'Mastery Goal',
    'settings.criteriaSub': 'Set your streak target to master problems',
    'settings.theme': 'Appearance',
    'settings.themeSub': 'Light / dark mode and 5 accent colors',
    'settings.language': 'Language',
    'settings.languageSub': 'Auto (Device) · 한국어 · English · 日本語',
    'settings.welcomeGuide': 'View Quick Guide',
    'welcome.title': 'Welcome to WrongNote',
    'welcome.ok': 'Get Started',
    'welcome.message':
      '1. Enjoy full access free for 1 week.\n\n2. You can freely customize subjects and questions.\n\n3. The current questions are examples.\n\n4. After checking the answer, swipe left for wrong and right for correct.\n\n5. Missed questions repeat until you get them right your chosen number of times in a row.',
    'settings.license': 'License · 7-Day Trial',
    'settings.licensePurchased': 'Lifetime Access',
    'settings.guide': 'How to Use',
    'settings.terms': 'Terms of Use',
    'settings.privacy': 'Privacy Policy',
    'settings.guideBody': '1. Add a wrong answer in 3 seconds using up to 2 photos or a quick note (up to 13 subjects, 50 problems per subject).\n2. Tap Crush Now, reveal the answer curtain, and tap Got It / Missed (or swipe left/right). Missed items keep coming back until you clear them.\n3. Get a problem right for your target streak and it automatically moves to Mastered.',
    'settings.termsBody': 'MistakeCrush is a lightweight mistake-note app supporting up to 13 subjects and 50 problems per subject.\nAll data is stored locally on your device without an account, so uninstalling the app removes saved data.',
    'settings.privacyBody': 'This app requires no sign-up and never sends or collects your photos or notes on external servers. Everything stays safely on your device.',

    'themeModal.title': 'Appearance',
    'themeModal.sec1Title': 'Theme Mode',
    'themeModal.sec1Desc': 'Choose light or dark mode for comfortable studying.',
    'themeModal.light': 'Light Mode',
    'themeModal.dark': 'Dark Mode',
    'themeModal.lightShort': 'Light',
    'themeModal.darkShort': 'Dark',
    'themeModal.sec2Title': 'Accent Color (5 choices)',
    'themeModal.sec2Desc': 'Pick the highlight color for buttons and badges.',
    'themeModal.done': 'Done',
    'theme.color.indigo': 'Indigo',
    'theme.color.blue': 'Blue',
    'theme.color.emerald': 'Emerald',
    'theme.color.amber': 'Amber',
    'theme.color.gold': 'Gold',

    'langModal.title': 'Language',
    'langModal.desc': 'Choose your preferred language.',
    'langModal.auto': 'Auto (Device)',
    'langModal.autoSub': 'Device language: {langName}',
    'langModal.ko': '한국어',
    'langModal.en': 'English',
    'langModal.ja': '日本語',
    'langModal.done': 'Done',
    'lang.name.ko': '한국어',
    'lang.name.en': 'English',
    'lang.name.ja': '日本語',

    'storage.fullMsg': 'Storage is full. Please delete a few old mistake cards first.',
    'storage.fullTitle': 'Storage Notice'
  },

  ja: {
    'app.name': 'ミス撃破',
    'app.titleFull': 'ミス撃破 — サクッと写真で間違いノート',

    'aria.openSettings': '設定メニューを開く',
    'aria.selectSubject': '教科を選択',
    'aria.back': '戻る',
    'aria.close': '閉じる',
    'aria.exitReview': '学習を終了',
    'aria.masteredSubjectSelect': '撃破済み問題の教科を選択',
    'aria.settingsMenu': '設定メニュー',
    'aria.cardMenu': '問題メニュー',
    'aria.deleteForever': '完全に削除',
    'aria.help': 'ヘルプ',

    'home.masteredBtn': '撃破済み',
    'home.totalSummary': '全{count}問',
    'home.startReview': '撃破する',
    'home.addWrong': 'ミス登録',
    'home.emptyTitle': 'まだ登録された問題がありません',
    'home.emptyDesc': '右下の<b>ミス登録</b>から<br/>3秒で最初の問題を登録してみましょう。',

    'subject.all': 'すべて',
    'subject.uncategorized': '未分類',
    'subject.manage': '教科設定',

    'card.wrongCount': '{count}回ミス',
    'card.beforeMastery': '未撃破',
    'card.streak': '連続 {streak}/{target}',
    'card.photoProblem': '写真の問題',
    'card.thumbAlt': '問題のサムネイル',
    'card.edit': '編集する',
    'card.delete': '削除する',
    'card.deleteConfirmMsg': 'この間違いカードを削除しますか？',
    'card.deleteConfirmTitle': '問題の削除',
    'card.mastered': '撃破完了',
    'card.masteredSub': 'タップして解き直し・リストへ復元できます',
    'card.restore': '戻す',
    'card.deleteForever': '完全削除',
    'card.deleteForeverConfirmMsg': '撃破済みリストからも完全に削除しますか？',
    'card.deleteForeverConfirmTitle': '完全削除',

    'add.titleNew': '3秒ミス登録',
    'add.titleEdit': '問題を編集',
    'add.section1': '1. 間違えた問題',
    'add.section2': '2. 答え・解説',
    'add.section3': '3. 教科',
    'add.section3Hint': '（前回の教科を自動選択）',
    'add.pickPhoto': '撮る / 選ぶ（最大2枚）',
    'add.clearPhoto': '選択中の写真を削除',
    'add.problemPlaceholder': '写真の代わりに問題文やメモをサッと入力（任意）',
    'add.answerPlaceholder': '答えや解説、ひとことメモを入力（任意）',
    'add.save': '保存する',
    'add.saveEdit': '修正完了',
    'add.photoTab': '写真 {num}',
    'add.maxPhotos': '写真は最大2枚まで登録できます。\n既存の写真を削除してから追加してください。',
    'add.maxPhotosPartial': '写真は最大2枚までです。残り{remain}枚のみ追加します。',
    'add.invalidImage': '有効な画像ファイル（JPG・PNGなど）のみアップロードできます。',
    'add.imageTooLarge': '画像サイズが大きすぎます。15MB以下の写真を選んでください。',
    'add.needProblem': '問題の写真を追加するか、問題文を少し入力してください。',
    'add.subjectFull': '「{subject}」には最大{max}問まで保存できます。\n問題を撃破するか整理してからお試しください。',
    'add.toastSaved': '問題を登録しました！',
    'add.toastUpdated': '修正を保存しました！',

    'editor.eraser': '消しゴム',
    'editor.crop': '切り抜き',
    'editor.rotate': '回転',
    'editor.undo': '元に戻す',
    'editor.eraserSize': 'ペンの太さ',
    'editor.modeSmart': 'カラーペンのみ（文字保護）',
    'editor.modeAll': '鉛筆・すべて消す',
    'editor.hintIdle': '必要なときに上の消しゴムや切り抜きをタップして編集してください。',
    'editor.hintEraser': '書き込んだペンやマーカーの上を指でなぞって消せます。',
    'editor.hintEraserAnswer': '不要な落書きや余白を消したり切り抜いたりできます。',
    'editor.hintCrop': '角や線をドラッグして範囲を合わせたら、そのまま保存か消しゴムへ進めます。',
    'editor.cropNeedArea': '残したい範囲を指やマウスで先に指定してください。',

    'review.swipeCorrect': '正解！',
    'review.swipeWrong': 'もう一回！',
    'review.revealAnswer': 'タップして答えを見る',
    'review.doneTitle': '今回の復習クリア！',
    'review.reviewAgain': '間違えた問題をやり直す',
    'review.backHome': 'ホームへ戻る',
    'review.btnWrong': '不正解',
    'review.btnCorrect': '正解',
    'review.swipeHintLeft': '← 左へスワイプ',
    'review.swipeHintRight': '右へスワイプ →',
    'review.noProblems': 'この教科にはまだ問題がありません。\n右下の［ミス登録］から問題を追加してください。',
    'review.remainingToast': '残り{count}問！',
    'review.doneMasteredWithWrong': '撃破済み{total}問のうち{correct}問正解し、間違えた{wrong}問をリストへ戻しました。',
    'review.doneMasteredAll': '撃破済み{total}問をすべて再クリアしました！',
    'review.doneLoop': '未撃破{total}問をすべて撃破して保管庫へ移しました！',
    'review.doneNormalCleared': '全{total}問のうち{cleared}問を撃破して保管庫へ移しました！',
    'review.doneNormal': '全{total}問のうち{correct}問正解、{wrong}問が未撃破です。',
    'review.subjectFullKeepMastered': '「{subject}」が{max}問でいっぱいのため撃破済みに残しました',
    'review.restoredToWrongToast': '間違えた問題をリストへ戻しました',
    'review.clearedToast': '完全撃破！撃破済みへ移動しました',
    'review.problemImgAlt': '問題の写真 {num}',
    'review.answerImgAlt': '解説の写真 {num}',
    'review.noAnswerMemo': '登録された答えのメモはありません。',

    'mastered.title': '撃破済みボックス',
    'mastered.summary': '撃破済み {count}問',
    'mastered.emptyTitle': '撃破済みボックスはまだ空です',
    'mastered.emptyDesc': '設定した回数連続で正解すると<br/>ここに自動で整理されます。',
    'mastered.reviewAll': '撃破済みの問題を解き直す',
    'mastered.noneToReview': '解き直せる撃破済み問題がまだありません。',
    'mastered.restoreFull': '「{subject}」は最大{max}問まで保存できます。\n先にその教科の問題を少し減らしてから戻してください。',
    'mastered.restoredToast': 'リストへ戻しました！',

    'subjectModal.title': '教科設定',
    'subjectModal.addTitle': '教科を追加',
    'subjectModal.editTitle': '教科を編集',
    'subjectModal.placeholder': '例：日本史、理科',
    'subjectModal.add': '追加',
    'subjectModal.hint': '最大13教科まで作成できます。<br />削除しても問題は「未分類」に安全に残ります。',
    'subjectModal.hintPlain': '最大13教科まで作成できます。\n削除しても問題は「未分類」に安全に残ります。',
    'subjectModal.done': '完了',
    'subjectModal.empty': '教科がまだありません。上の＋ボタンから追加してください。',
    'subjectModal.rename': '変更',
    'subjectModal.delete': '削除',
    'subjectModal.needName': '教科名を入力してください。',
    'subjectModal.duplicate': '同じ名前の教科がすでにあります。',
    'subjectModal.deleteConfirmMsg': '「{subject}」を削除しますか？\n（この教科の問題は「未分類」に安全に残ります。）',
    'subjectModal.deleteConfirmTitle': '教科の削除',
    'subjectModal.needAddName': '追加する教科名を入力してください。',
    'subjectModal.maxSubjects': '教科は最大{max}個まで作成できます。',

    'criteriaModal.title': '撃破基準の設定',
    'criteriaModal.sec1Title': '1. 自動クリアの基準',
    'criteriaModal.sec1Desc': '何回連続で正解したら撃破済みにしてリストから外しますか？（1〜19回）',
    'criteriaModal.streakPrefix': '連続',
    'criteriaModal.streakSuffix': '回正解でリストから自動移動',
    'criteriaModal.apply': '適用する',
    'criteriaModal.invalidNumber': '1〜19の数字を入力してください。',

    'dialog.alertTitle': 'お知らせ',
    'dialog.confirmTitle': '確認',
    'dialog.ok': 'OK',
    'dialog.cancel': 'キャンセル',

    'license.trialLabel': '無料体験 残り{days}日',
    'license.purchasedLabel': '買い切りプラン利用中',
    'license.expiredLabel': '無料体験終了',
    'license.badgePurchased': '買い切り済み',
    'license.badgeExpired': '体験終了',
    'license.badgeTrial': '無料体験中',
    'license.titleExpired': '7日間の無料体験が終了しました',
    'license.titlePurchased': '買い切りプラン利用中',
    'license.titleTrial': '7日間無料体験・買い切り案内',
    'license.headline': '1回限りの買い切りで<br />ずっと制限なく使えます',
    'license.sub': '月額料金なしで、一度購入すれば消しゴム機能・解答隠し復習・無制限の問題登録をずっとご利用いただけます。（登録済みの問題の復習は引き続き可能です。）',
    'license.perk1': '月額不要の1回限り買い切りプラン',
    'license.perk2': '広告なしの快適な学習環境',
    'license.perk3': '消しゴム・解答隠し・無制限登録',
    'license.buyBtn': '買い切りプランを購入',
    'license.buyBtnWithPrice': '買い切りプランを購入 ({price})',
    'license.restoreBtn': '購入済みの方はこちら（購入を復元）',
    'license.buySuccessMsg': 'ご購入ありがとうございます！すべての機能が制限なく使えるようになりました。',
    'license.buySuccessTitle': '購入完了',
    'license.restoreSuccessMsg': '購入履歴が確認されたため、買い切りプランを復元しました！',
    'license.restoreNotFoundMsg': 'このGoogleアカウントでの購入履歴が見つかりませんでした。',
    'license.playOnlyMsg': '購入および復元はGoogle Playストアからインストールしたアプリ内で行えます。',
    'license.storeUnavailableMsg': 'ストアの商品情報を取得できませんでした。しばらくしてからもう一度お試しください。',
    'license.buyCancelledMsg': '購入がキャンセルされました。',
    'license.buyErrorMsg': 'Google Play決済を完了できませんでした。しばらくしてからもう一度お試しください。',
    'license.productTitle': '間違い撃破 買い切りプラン',

    'settings.title': '設定',
    'settings.subjects': '教科設定',
    'settings.subjectsSub': '教科の追加・名前変更・削除',
    'settings.criteria': '撃破基準の設定',
    'settings.criteriaSub': '完全撃破になる連続正解回数を決める',
    'settings.theme': 'テーマ設定',
    'settings.themeSub': 'ライト・ダークモードと5色のテーマカラー',
    'settings.language': '言語設定',
    'settings.languageSub': '端末に自動対応 · 한국어 · English · 日本語',
    'settings.welcomeGuide': '使い方ガイドを見る',
    'welcome.title': 'オダプ征服へようこそ',
    'welcome.ok': 'はじめる',
    'welcome.message':
      '1. 1週間、自由にお試しいただけます。\n\n2. 科目や問題は自由に変更できます。\n\n3. 最初に入っている問題はサンプルです。\n\n4. 答えを確認した後、左にスワイプで不正解、右にスワイプで正解になります。\n\n5. 間違えた問題は、設定した回数だけ連続で正解するまで繰り返し復習できます。',
    'settings.license': 'ライセンス・7日間無料体験',
    'settings.licensePurchased': '買い切りプラン利用中',
    'settings.guide': '使い方',
    'settings.terms': '利用規約',
    'settings.privacy': 'プライバシーポリシー',
    'settings.guideBody': '1. 間違えた問題を写真（最大2枚）やメモで3秒登録します。（最大13教科・1教科あたり最大50問まで保存可能）\n2. 「撃破する」を押して解答隠しをタップし、正解/不正解を選ぶか左右にスワイプします。間違えた問題はクリアするまで繰り返し出題されます。\n3. 設定した回数連続で正解すると撃破完了となり、リストから自動で整理されます。',
    'settings.termsBody': '本アプリは間違えた問題だけをサクッと見直し、撃破した問題は自動で整理されるシンプルな間違いノートです。（最大13教科・1教科あたり最大50問対応）\n会員登録不要で端末内にのみ保存されるため、アプリを削除すると保存データも消去されます。',
    'settings.privacyBody': '本アプリは会員登録を行わず、登録された問題写真やメモを外部サーバーへ送信・収集することなく、お使いの端末内のみに安全に保存します。',

    'themeModal.title': 'テーマ設定',
    'themeModal.sec1Title': '画面モード',
    'themeModal.sec1Desc': '学習環境に合わせて明るい画面と暗い画面を選べます。',
    'themeModal.light': 'ライトモード',
    'themeModal.dark': 'ダークモード',
    'themeModal.lightShort': 'ライト',
    'themeModal.darkShort': 'ダーク',
    'themeModal.sec2Title': 'テーマカラー（5色）',
    'themeModal.sec2Desc': 'ボタンや強調表示に使うメインカラーを選べます。',
    'themeModal.done': '適用する',
    'theme.color.indigo': 'インディゴ',
    'theme.color.blue': 'ブルー',
    'theme.color.emerald': 'エメラルド',
    'theme.color.amber': 'アンバー',
    'theme.color.gold': 'ゴールド',

    'langModal.title': '言語設定',
    'langModal.desc': '使用する言語を選択してください。',
    'langModal.auto': '自動（端末の言語）',
    'langModal.autoSub': '現在の端末言語: {langName}',
    'langModal.ko': '한국어',
    'langModal.en': 'English',
    'langModal.ja': '日本語',
    'langModal.done': '適用する',
    'lang.name.ko': '한국어',
    'lang.name.en': 'English',
    'lang.name.ja': '日本語',

    'storage.fullMsg': '保存容量が不足しています。古い問題カードをいくつか整理してください。',
    'storage.fullTitle': '保存のお知らせ'
  }
};

export function t(key, params = {}) {
  const lang = getLang();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dict[key] ?? TRANSLATIONS.ko[key] ?? key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

export function formatSubjectLabel(name) {
  if (name === '전체') return t('subject.all');
  if (!name || name === '미분류') return t('subject.uncategorized');
  const lang = getLang();
  const builtinMap = {
    ko: { 국어: '국어', 영어: '영어', 수학: '수학' },
    en: { 국어: 'Reading', 영어: 'English', 수학: 'Math' },
    ja: { 국어: '国語', 영어: '英語', 수학: '数学' }
  };
  return builtinMap[lang]?.[name] || name;
}

export function applyStaticTranslations() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t('app.titleFull');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
}
