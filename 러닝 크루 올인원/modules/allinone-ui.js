(function() {
    'use strict';

    const E = window.YJAllInOneEngine;
    let activeFeedCommentId = null;
    let pendingFeedPhotoDataUrl = '';
    let hasStartedDistAccum = false;
    let memberFilter = 'all';
    let memberQuery = '';
    let editingScheduleId = null;
    let editingMemberId = null;
    let editingNoticeId = null;
    let activeAttendanceScheduleId = null;
    let pendingConfirmAction = null;

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showToast(msg, tone) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'crew-toast' + (tone ? ' toast-' + tone : '');
        el.textContent = msg;
        container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 240);
        }, 2500);
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('open');
        el.setAttribute('aria-hidden', 'false');
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('open');
        el.setAttribute('aria-hidden', 'true');
    }

    function closeAllModals() {
        document.querySelectorAll('.crew-modal-backdrop.open').forEach(m => {
            m.classList.remove('open');
            m.setAttribute('aria-hidden', 'true');
        });
    }

    function askConfirm(title, desc, onConfirm) {
        document.getElementById('confirm-modal-title').textContent = title;
        document.getElementById('confirm-modal-desc').textContent = desc;
        pendingConfirmAction = onConfirm;
        openModal('confirm-modal');
    }

    function updateHeader() {
        const me = E.getCurrentMember();
        const isStaff = E.isStaff();
        const nameEl = document.getElementById('header-crew-name');
        const subEl = document.getElementById('header-crew-sub');
        const weatherEl = document.getElementById('header-weather-pill');
        const switchBtn = document.getElementById('header-member-pill');
        const adminBtn = document.getElementById('header-admin-btn');

        if (nameEl) nameEl.textContent = E.shared.crewName;
        if (subEl) subEl.textContent = `${isStaff ? '운영 모드' : '크루원 모드'} · 함께 뛰는 ${E.shared.members.length}명`;
        if (weatherEl) {
            const w = E.shared.weather;
            weatherEl.textContent = `${w.icon} ${w.city} ${w.temp}°C`;
        }
        if (switchBtn && me) {
            switchBtn.textContent = `${isStaff ? '👑' : '🏃'} ${me.name}`;
        }
        if (adminBtn) {
            adminBtn.style.display = isStaff ? 'inline-flex' : 'none';
        }
    }

    function switchTab(tab) {
        E.extra.activeTab = tab;
        E.saveExtra();
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        renderAll();
        if (tab === 'chat') scrollChatToBottom();
    }

    function scrollChatToBottom() {
        const stream = document.getElementById('chat-message-stream');
        if (stream) requestAnimationFrame(() => { stream.scrollTop = stream.scrollHeight; });
    }

    // ==================== 1. 홈 · 일정 ====================
    function renderHome() {
        const me = E.getCurrentMember();
        const isStaff = E.isStaff();
        const myCard = document.getElementById('home-my-card');
        const noticeBox = document.getElementById('home-pinned-notice');
        const addSchBtn = document.getElementById('home-add-schedule-btn');
        const schBox = document.getElementById('home-schedule-list');
        if (!myCard || !noticeBox || !schBox || !me) return;

        if (addSchBtn) addSchBtn.style.display = isStaff ? 'inline-flex' : 'none';

        const byDist = E.shared.members.slice().sort((a, b) => (b.totalDistance || 0) - (a.totalDistance || 0));
        const myRank = byDist.findIndex(m => m.id === me.id) + 1;
        const goal = Math.max(10, Number(E.extra.monthlyGoalKm) || 50);
        const pct = Math.min(100, Math.round(((me.totalDistance || 0) / goal) * 100));
        const feeClass = me.feeStatus === '완납' ? 'pill-mint' : (me.feeStatus === '미납' ? 'pill-red' : 'pill-slate');

        myCard.innerHTML = `
            <div class="my-hero-top">
                <div>
                    <span class="my-hero-badge">${esc(me.role)} · ${esc(me.paceGroup)} (${esc(me.pace)})</span>
                    <h2>반가워요, ${esc(me.name)}님!</h2>
                </div>
                <span class="pill ${feeClass}">회비 ${esc(me.feeStatus)}</span>
            </div>
            <div class="my-stats-grid">
                <div class="my-stat-item"><span>크루 순위</span><strong>${myRank}위</strong></div>
                <div class="my-stat-item"><span>출석 도장</span><strong>${me.attendanceCount || 0}회</strong></div>
                <div class="my-stat-item"><span>누적 거리</span><strong>${Number(me.totalDistance || 0).toFixed(1).replace(/\.0$/, '')}km</strong></div>
            </div>
            <div class="goal-wrap">
                <div class="goal-label-row"><span>이달 목표 (${me.totalDistance || 0} / ${goal}km)</span><strong>${pct}%</strong></div>
                <div class="goal-track"><div class="goal-fill" style="width:${pct}%"></div></div>
            </div>
        `;

        const notices = E.shared.notices.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned));
        if (notices.length > 0) {
            const topNotice = notices[0];
            const isRead = (topNotice.readBy || []).includes(me.id);
            noticeBox.innerHTML = `
                <div class="crew-card notice-highlight">
                    <div class="card-head">
                        <span class="pill pill-orange">${topNotice.pinned ? '📌 필독 공지' : '📢 최신 공지'}</span>
                        <span class="muted-xs">${esc(topNotice.author)} · ${esc(topNotice.createdAt)}</span>
                    </div>
                    <h3 class="card-title">${esc(topNotice.title)}</h3>
                    <p class="notice-text">${esc(topNotice.content).replace(/\n/g, '<br>')}</p>
                    <div class="card-action-row">
                        <button type="button" class="${isRead ? 'btn-soft-mint' : 'btn-soft-primary'}" onclick="window.YJAllInOneUI.toggleReadNotice('${esc(topNotice.id)}')">
                            ${isRead ? '✔ 공지 확인 완료' : '👀 공지 읽음 확인'}
                        </button>
                        <button type="button" class="btn-soft" onclick="window.YJAllInOneUI.openNoticesSubTab()">전체 공지 (${notices.length})</button>
                    </div>
                </div>
            `;
        } else {
            noticeBox.innerHTML = '';
        }

        const schedules = E.shared.schedules.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        if (schedules.length === 0) {
            schBox.innerHTML = '<div class="empty-card">등록된 러닝 일정이 없습니다.</div>';
            return;
        }

        schBox.innerHTML = schedules.map(s => {
            const isJoined = (s.attendees || []).includes(me.id);
            const isChecked = (s.checkedIn || []).includes(me.id);
            const dday = E.getDaysLeftLabel(s.date);
            const groups = E.groupAttendeesByPace(s);
            const sameGroupMates = (groups[me.paceGroup] || []).filter(m => m.id !== me.id).map(m => m.name);

            return `
                <article class="crew-card ${s.completed ? 'is-completed' : ''}">
                    <div class="card-head">
                        <div class="pill-group">
                            <span class="pill pill-orange">${esc(s.type)}</span>
                            <span class="pill ${s.completed ? 'pill-mint' : 'pill-slate'}">${s.completed ? '완료됨' : esc(dday)}</span>
                            ${isChecked ? '<span class="pill pill-mint">✔ 출석 완료</span>' : ''}
                        </div>
                        <div class="card-head-right">
                            <span class="muted-xs">참여 ${s.attendees.length}/${s.maxCount}명</span>
                            ${isStaff ? `
                                <button type="button" class="icon-btn" title="수정" onclick="window.YJAllInOneUI.openScheduleModal('${esc(s.id)}')">✏️</button>
                                <button type="button" class="icon-btn" title="삭제" onclick="window.YJAllInOneUI.deleteSchedule('${esc(s.id)}')">🗑️</button>
                            ` : ''}
                        </div>
                    </div>
                    <h3 class="card-title">${esc(s.title)}</h3>
                    <div class="card-info-grid">
                        <div>🕒 ${esc(E.formatKoreanDate(s.date))} ${esc(s.time)}</div>
                        <div>📏 ${s.distance}km · 내 배정 ${esc(me.paceGroup)}</div>
                        <div class="full-span">📍 ${esc(s.location)}</div>
                    </div>
                    ${s.courseNote ? `<p class="card-note">${esc(s.courseNote)}</p>` : ''}
                    <div class="mate-group-hint">
                        ${sameGroupMates.length ? `🤝 같은 ${esc(me.paceGroup)} 러너: <strong>${esc(sameGroupMates.join(', '))}</strong>` : `🤝 ${esc(me.paceGroup)} 첫 번째 주자로 참여해 보세요!`}
                    </div>
                    ${isStaff ? `
                        <div class="pace-preview-row">
                            <span class="pace-chip pace-a">A조 ${groups['A조'].length}명</span>
                            <span class="pace-chip pace-b">B조 ${groups['B조'].length}명</span>
                            <span class="pace-chip pace-c">C조 ${groups['C조'].length}명</span>
                            <span class="pace-chip pace-check">출석 ${(s.checkedIn || []).length}명</span>
                        </div>
                    ` : ''}
                    <div class="card-action-row">
                        <button type="button" class="${isJoined ? 'btn-soft-mint' : 'btn-primary-full'}" onclick="window.YJAllInOneUI.toggleJoinSchedule('${esc(s.id)}')">
                            ${isJoined ? '✔ 참석 신청 완료' : '🙋 나도 참석하기'}
                        </button>
                        ${isStaff ? `
                            <button type="button" class="btn-soft-primary" onclick="window.YJAllInOneUI.openAttendanceModal('${esc(s.id)}')">👥 출석·조편성</button>
                            <button type="button" class="btn-soft" onclick="window.YJAllInOneUI.shareScheduleToChat('${esc(s.id)}')">💬 공유</button>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    function toggleJoinSchedule(scheduleId) {
        const me = E.getCurrentMember();
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        if (!me || !s) return;
        if (!s.attendees) s.attendees = [];
        const idx = s.attendees.indexOf(me.id);
        if (idx >= 0) {
            s.attendees.splice(idx, 1);
            E.playSound('tap');
            showToast(`'${s.title}' 참석을 취소했습니다.`);
        } else {
            s.attendees.push(me.id);
            E.playSound('success');
            if (typeof window.confetti === 'function') window.confetti({ particleCount: 40, spread: 55, origin: { y: 0.75 } });
            showToast(`'${s.title}' 참석 신청 완료!`, 'ok');
        }
        E.saveShared();
        renderAll();
    }

    function toggleReadNotice(noticeId) {
        const me = E.getCurrentMember();
        const n = E.shared.notices.find(x => x.id === noticeId);
        if (!me || !n) return;
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(me.id)) {
            n.readBy.push(me.id);
            E.playSound('tap');
            E.saveShared();
            renderAll();
            showToast('공지 확인 완료!', 'ok');
        }
    }

    // ==================== 2. 기록 · 랭킹 ====================
    function renderRankAndRun() {
        const me = E.getCurrentMember();
        const podiumEl = document.getElementById('rank-podium-box');
        const listEl = document.getElementById('rank-list-box');

        document.querySelectorAll('.rank-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === E.extra.rankMode));
        if (!podiumEl || !listEl || !me) return;

        const mode = E.extra.rankMode;
        const sorted = E.shared.members.slice().sort((a, b) => {
            if (mode === 'attendance') return (b.attendanceCount || 0) - (a.attendanceCount || 0);
            return (b.totalDistance || 0) - (a.totalDistance || 0);
        });

        const medals = ['🥇', '🥈', '🥉'];
        podiumEl.innerHTML = sorted.slice(0, 3).map((m, idx) => {
            const metric = mode === 'attendance' ? `${m.attendanceCount || 0}회 출석` : `${m.totalDistance || 0}km`;
            return `
                <div class="podium-card rank-${idx + 1} ${m.id === me.id ? 'is-me' : ''}">
                    <div class="podium-medal">${medals[idx]}</div>
                    <div class="podium-name">${esc(m.name)}</div>
                    <div class="podium-group">${esc(m.paceGroup)}</div>
                    <div class="podium-metric">${esc(metric)}</div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = sorted.map((m, idx) => {
            const metric = mode === 'attendance' ? `${m.attendanceCount || 0}회 · ${m.totalDistance || 0}km` : `${m.totalDistance || 0}km · ${m.attendanceCount || 0}회`;
            const isMe = m.id === me.id;
            return `
                <div class="rank-row ${isMe ? 'is-me' : ''}">
                    <div class="rank-num">${idx + 1}</div>
                    <div class="rank-info">
                        <strong>${esc(m.name)} ${isMe ? '<span class="me-tag">나</span>' : ''}</strong>
                        <span>${esc(m.paceGroup)} · ${esc(m.pace)}</span>
                    </div>
                    <div class="rank-right">
                        <span class="rank-score">${esc(metric)}</span>
                        ${!isMe ? `<button type="button" class="cheer-mini-btn" onclick="window.YJAllInOneUI.cheerTeammate('${esc(m.name)}')">👏 응원</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    function toggleLiveRun() {
        if (E.isRunningNow) {
            clearInterval(E.runTimer);
            E.isRunningNow = false;
        } else {
            E.isRunningNow = true;
            E.playSound('tap');
            E.runTimer = setInterval(() => {
                E.runElapsedSec += 1;
                const el = document.getElementById('live-run-timer');
                if (el) el.textContent = E.formatDuration(E.runElapsedSec);
            }, 1000);
        }
        renderRankAndRun();
    }

    function toggleMetronome() {
        if (E.isMetronomeOn) {
            clearInterval(E.metronomeTimer);
            E.isMetronomeOn = false;
        } else {
            E.isMetronomeOn = true;
            const pulseFn = () => {
                const dot = document.getElementById('metro-beat-dot');
                if (!dot) return;
                dot.classList.add('beat');
                setTimeout(() => dot.classList.remove('beat'), 90);
            };
            E.playMetronomeBeat(pulseFn);
            const ms = (60 / (E.extra.spm || 175)) * 1000;
            E.metronomeTimer = setInterval(() => E.playMetronomeBeat(pulseFn), ms);
        }
        renderRankAndRun();
    }

    function setSpm(val) {
        E.extra.spm = Math.max(140, Math.min(210, Number(val) || 175));
        E.saveExtra();
        if (E.isMetronomeOn) {
            clearInterval(E.metronomeTimer);
            E.isMetronomeOn = false;
            toggleMetronome();
        } else {
            renderRankAndRun();
        }
    }

    function saveMyRunRecord() {
        const me = E.getCurrentMember();
        const distInput = document.getElementById('run-dist-input');
        const dist = Math.max(0.5, Number(distInput ? distInput.value : 5) || 5);
        if (!me) return;

        if (E.isRunningNow) {
            clearInterval(E.runTimer);
            E.isRunningNow = false;
        }

        me.totalDistance = Math.round(((me.totalDistance || 0) + dist) * 10) / 10;
        me.attendanceCount = (me.attendanceCount || 0) + 1;

        const durationTxt = E.runElapsedSec > 0 ? ` (${E.formatDuration(E.runElapsedSec)})` : '';
        E.extra.feeds.unshift({
            id: 'f_' + Date.now(),
            memberId: me.id,
            memberName: me.name,
            paceGroup: me.paceGroup,
            mood: '🏅 오늘 러닝 완주',
            distance: dist,
            pace: me.pace,
            text: `방금 ${dist}km 달리기 완주했습니다${durationTxt}! 모두 오늘도 화이팅!`,
            time: '방금 전',
            claps: 1,
            clappedBy: [me.id],
            comments: []
        });

        E.runElapsedSec = 0;
        E.saveShared();
        E.saveExtra();
        E.playSound('success');
        if (typeof window.confetti === 'function') window.confetti({ particleCount: 65, spread: 70, origin: { y: 0.7 } });
        renderAll();
        showToast(`${dist}km 완주 기록 저장 & 오운완 자동 인증!`, 'ok');
    }

    function cheerTeammate(name) {
        const me = E.getCurrentMember();
        if (!me) return;
        E.shared.chats.push({
            id: 'c_' + Date.now(),
            room: 'all',
            senderId: me.id,
            senderName: me.name,
            senderRole: me.role,
            text: `👏 ${name}님 랭킹 페이스 정말 멋져요! 다음 러닝도 화이팅입니다!`,
            time: E.getCurrentTimeLabel()
        });
        E.saveShared();
        E.playSound('tap');
        showToast(`${name}님에게 채팅방으로 응원을 보냈습니다!`, 'ok');
    }

    // ==================== 3. 오운완 · 공지 ====================
    const NOTICE_TEMPLATES = {
        regular: {
            category: '일정',
            pinned: true,
            title: '이번 주 정기런 집결 및 페이스별 조 안내',
            content: '• 일시/장소: 이번 주 목요일 20:00 (출발 10분 전 집결)\n• 코스: 왕복 평지 8km (A/B/C 페이스 그룹 운영)\n• 준비물: 러닝화, 개인 물통, 야간 안전 반사밴드\n* 홈·일정 탭에서 꼭 참석 버튼을 눌러주세요!'
        },
        rain: {
            category: '필독',
            pinned: true,
            title: '[기상 안내] 우천 예보에 따른 러닝 진행 여부 공지',
            content: '금일 비 예보로 인해 출발 2시간 전 강수량을 보고 최종 진행 여부를 확정합니다.\n• 이슬비: 우비/모자 착용 후 단축 코스(5km) 진행\n• 폭우 시: 안전을 위해 휴식 전환 및 실내 보강운동 공유'
        },
        fee: {
            category: '회비',
            pinned: false,
            title: '이번 달 크루 정기 회비 납부 및 사용 내역 안내',
            content: '매월 정기 회비(1만 원)는 생수·이온음료 지원, 짐 보관 및 크루 행사 적립에 투명하게 사용됩니다.\n아직 납부 전이신 크루원분들은 이번 주까지 입금 후 운영진에게 말씀 부탁드립니다.'
        },
        after: {
            category: '일반',
            pinned: false,
            title: '러닝 후 가벼운 티타임 & 뒷풀이 수요 조사',
            content: '이번 주 러닝 종료 후 근처에서 가볍게 수분 보충 및 뒷풀이 자리를 가지려 합니다.\n참석 희망하시는 분은 채팅방에 댓글로 알려주세요!'
        }
    };

    function renderFeedAndNotices() {
        const sub = E.extra.feedSubTab || 'feed';
        const isStaff = E.isStaff();
        const me = E.getCurrentMember();
        document.querySelectorAll('.sub-pill-btn').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));

        const feedSec = document.getElementById('subview-feed');
        const noticeSec = document.getElementById('subview-notices');
        if (feedSec) feedSec.style.display = sub === 'feed' ? 'flex' : 'none';
        if (noticeSec) noticeSec.style.display = sub === 'notices' ? 'flex' : 'none';

        const staffNoticeTools = document.getElementById('staff-notice-tools');
        if (staffNoticeTools) staffNoticeTools.style.display = isStaff ? 'flex' : 'none';

        const feedList = document.getElementById('feed-list-container');
        if (feedList && me) {
            if (E.extra.feeds.length === 0) {
                feedList.innerHTML = '<div class="empty-card">첫 번째 오운완 인증을 올려보세요!</div>';
            } else {
                feedList.innerHTML = E.extra.feeds.map(f => {
                    const clapped = (f.clappedBy || []).includes(me.id);
                    const commentsHtml = (f.comments || []).map(c =>
                        `<div class="feed-comment-item"><strong>${esc(c.author)}</strong> ${esc(c.text)}</div>`
                    ).join('');
                    return `
                        <article class="crew-card">
                            <div class="feed-top-row">
                                <div class="feed-avatar">${esc(f.memberName.slice(0, 1))}</div>
                                <div class="feed-author-meta">
                                    <div><strong>${esc(f.memberName)}</strong> <span class="pill pill-slate">${esc(f.paceGroup)}</span></div>
                                    <span class="muted-xs">${esc(f.time)}</span>
                                </div>
                                <span class="pill pill-orange">${esc(f.mood)}</span>
                            </div>
                            <div class="feed-metrics-strip">
                                <span>📏 <strong>${esc(f.distance)}km</strong> 완주</span>
                                <span>⏱ 평균 페이스 <strong>${esc(f.pace)}</strong></span>
                            </div>
                            ${f.text ? `<p class="feed-text">${esc(f.text)}</p>` : ''}
                            ${f.photoDataUrl && String(f.photoDataUrl).startsWith('data:image/') ? `<div class="feed-photo-wrap"><img class="feed-photo-img" src="${esc(f.photoDataUrl)}" alt="오운완 인증샷"></div>` : ''}
                            <div class="feed-actions">
                                <button type="button" class="clap-btn ${clapped ? 'on' : ''}" onclick="window.YJAllInOneUI.toggleClap('${esc(f.id)}')">👏 응원 박수 ${f.claps || 0}</button>
                                <button type="button" class="btn-soft" onclick="window.YJAllInOneUI.toggleCommentBox('${esc(f.id)}')">💬 댓글 ${(f.comments || []).length}</button>
                            </div>
                            ${commentsHtml ? `<div class="feed-comments-box">${commentsHtml}</div>` : ''}
                            ${activeFeedCommentId === f.id ? `
                                <form class="feed-comment-form" onsubmit="window.YJAllInOneUI.submitFeedComment(event, '${esc(f.id)}')">
                                    <input id="comment-input-${esc(f.id)}" type="text" class="comment-input" placeholder="따뜻한 응원을 남겨주세요..." required>
                                    <button type="submit" class="comment-send-btn">등록</button>
                                </form>
                            ` : ''}
                        </article>
                    `;
                }).join('');
            }
        }

        const noticeList = document.getElementById('notice-list-container');
        if (noticeList && me) {
            const sorted = E.shared.notices.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned));
            if (sorted.length === 0) {
                noticeList.innerHTML = '<div class="empty-card">등록된 공지가 없습니다.</div>';
            } else {
                const totalMembers = Math.max(1, E.shared.members.length);
                noticeList.innerHTML = sorted.map(n => {
                    const readCount = (n.readBy || []).length;
                    const iRead = (n.readBy || []).includes(me.id);
                    return `
                        <article class="crew-card ${n.pinned ? 'is-pinned' : ''}">
                            <div class="card-head">
                                <div class="pill-group">
                                    ${n.pinned ? '<span class="pill pill-orange">📌 필독 고정</span>' : ''}
                                    <span class="pill pill-slate">${esc(n.category)}</span>
                                </div>
                                ${isStaff ? `
                                    <div class="card-head-right">
                                        <button type="button" class="icon-btn" title="상단 고정" onclick="window.YJAllInOneUI.togglePinNotice('${esc(n.id)}')">${n.pinned ? '📍' : '📌'}</button>
                                        <button type="button" class="icon-btn" title="수정" onclick="window.YJAllInOneUI.openNoticeModal('${esc(n.id)}')">✏️</button>
                                        <button type="button" class="icon-btn" title="삭제" onclick="window.YJAllInOneUI.deleteNotice('${esc(n.id)}')">🗑️</button>
                                    </div>
                                ` : ''}
                            </div>
                            <h3 class="card-title">${esc(n.title)}</h3>
                            <p class="notice-text">${esc(n.content).replace(/\n/g, '<br>')}</p>
                            <div class="notice-meta-row">
                                <span>${esc(n.author)} · ${esc(n.createdAt)}</span>
                                <span class="read-counter">👀 ${readCount}/${totalMembers}명 확인</span>
                            </div>
                            <div class="card-action-row">
                                <button type="button" class="${iRead ? 'btn-soft-mint' : 'btn-soft'}" onclick="window.YJAllInOneUI.toggleReadNotice('${esc(n.id)}')">
                                    ${iRead ? '✔ 확인됨' : '👀 공지 읽음 확인'}
                                </button>
                                ${isStaff ? `<button type="button" class="btn-soft-primary" onclick="window.YJAllInOneUI.shareNoticeToChat('${esc(n.id)}')">💬 채팅방 띄우기</button>` : ''}
                            </div>
                        </article>
                    `;
                }).join('');
            }
        }
    }

    function toggleClap(feedId) {
        const me = E.getCurrentMember();
        const f = E.extra.feeds.find(x => x.id === feedId);
        if (!me || !f) return;
        if (!f.clappedBy) f.clappedBy = [];
        const idx = f.clappedBy.indexOf(me.id);
        if (idx >= 0) {
            f.clappedBy.splice(idx, 1);
            f.claps = Math.max(0, (f.claps || 1) - 1);
        } else {
            f.clappedBy.push(me.id);
            f.claps = (f.claps || 0) + 1;
            E.playSound('success');
        }
        E.saveExtra();
        renderFeedAndNotices();
    }

    function toggleCommentBox(feedId) {
        activeFeedCommentId = activeFeedCommentId === feedId ? null : feedId;
        renderFeedAndNotices();
        if (activeFeedCommentId) {
            const inp = document.getElementById(`comment-input-${feedId}`);
            if (inp) inp.focus();
        }
    }

    function submitFeedComment(ev, feedId) {
        ev.preventDefault();
        const me = E.getCurrentMember();
        const f = E.extra.feeds.find(x => x.id === feedId);
        const inp = document.getElementById(`comment-input-${feedId}`);
        if (!me || !f || !inp) return;
        const text = inp.value.trim();
        if (!text) return;
        if (!f.comments) f.comments = [];
        f.comments.push({ author: me.name, text });
        activeFeedCommentId = null;
        E.playSound('tap');
        E.saveExtra();
        renderFeedAndNotices();
        showToast('응원 댓글을 남겼습니다.', 'ok');
    }

    function clearFeedPhoto() {
        pendingFeedPhotoDataUrl = '';
        const cam = document.getElementById('feed-photo-camera');
        const gal = document.getElementById('feed-photo-gallery');
        const wrap = document.getElementById('feed-photo-preview-wrap');
        const img = document.getElementById('feed-photo-preview');
        if (cam) cam.value = '';
        if (gal) gal.value = '';
        if (img) img.src = '';
        if (wrap) wrap.classList.remove('show');
    }

    function handleFeedPhotoFile(file) {
        if (!file || !file.type || !file.type.startsWith('image/')) {
            showToast('이미지 파일만 첨부할 수 있습니다.', 'warn');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const maxSide = 720;
                let w = img.width;
                let h = img.height;
                if (w > maxSide || h > maxSide) {
                    if (w >= h) { h = Math.round((h * maxSide) / w); w = maxSide; }
                    else { w = Math.round((w * maxSide) / h); h = maxSide; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                pendingFeedPhotoDataUrl = canvas.toDataURL('image/jpeg', 0.78);
                const prevImg = document.getElementById('feed-photo-preview');
                const prevWrap = document.getElementById('feed-photo-preview-wrap');
                if (prevImg) prevImg.src = pendingFeedPhotoDataUrl;
                if (prevWrap) prevWrap.classList.add('show');
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    function normalizePaceInput(raw, fallback) {
        const s = String(raw || '').trim();
        if (!s) return fallback || "5'30\"";
        const sepMatch = s.match(/^(\d{1,2})\D+(\d{1,2})/);
        let min = 5;
        let sec = 30;
        if (sepMatch) {
            min = parseInt(sepMatch[1], 10);
            sec = parseInt(sepMatch[2], 10);
        } else {
            const digits = s.replace(/\D/g, '');
            if (!digits) return fallback || "5'30\"";
            if (digits.length <= 2) {
                min = parseInt(digits, 10);
                sec = 0;
            } else if (digits.length === 3) {
                min = parseInt(digits.slice(0, 1), 10);
                sec = parseInt(digits.slice(1), 10);
            } else {
                min = parseInt(digits.slice(0, 2), 10);
                sec = parseInt(digits.slice(2, 4), 10);
            }
        }
        if (sec >= 60) {
            min += Math.floor(sec / 60);
            sec = sec % 60;
        }
        min = Math.max(2, Math.min(20, min));
        return `${min}'${String(sec).padStart(2, '0')}"`;
    }

    function setFeedDist(val) {
        const el = document.getElementById('feed-dist');
        if (!el) return;
        const unit = Number(val) || 1;
        let next;
        if (hasStartedDistAccum) {
            const cur = Number(el.value) || 0;
            next = Math.max(0.1, Math.round((cur + unit) * 10) / 10);
        } else {
            next = Math.max(0.1, Math.round(unit * 10) / 10);
            hasStartedDistAccum = true;
        }
        el.value = next.toFixed(1);
    }

    function nudgeFeedDist(delta) {
        const el = document.getElementById('feed-dist');
        if (!el) return;
        hasStartedDistAccum = true;
        const cur = Number(el.value) || 0;
        const next = Math.max(0.1, Math.round((cur + delta) * 10) / 10);
        el.value = next.toFixed(1);
    }

    function setFeedPace(val) {
        const el = document.getElementById('feed-pace');
        if (el) el.value = val;
    }

    function saveFeedPost(ev) {
        ev.preventDefault();
        const me = E.getCurrentMember();
        if (!me) return;
        const rawDist = Number(document.getElementById('feed-dist').value);
        const dist = Math.max(0.1, Math.round((isNaN(rawDist) ? 5 : rawDist) * 10) / 10);
        const pace = normalizePaceInput(document.getElementById('feed-pace').value, me.pace);
        const mood = document.getElementById('feed-mood').value;
        const text = document.getElementById('feed-text').value.trim();

        me.totalDistance = Math.round(((me.totalDistance || 0) + dist) * 10) / 10;
        E.extra.feeds.unshift({
            id: 'f_' + Date.now(),
            memberId: me.id,
            memberName: me.name,
            paceGroup: me.paceGroup,
            mood,
            distance: dist,
            pace,
            text,
            photoDataUrl: pendingFeedPhotoDataUrl || '',
            time: '방금 전',
            claps: 1,
            clappedBy: [me.id],
            comments: []
        });
        E.saveShared();
        E.saveExtra();
        closeModal('feed-modal');
        E.playSound('success');
        if (typeof window.confetti === 'function') window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.75 } });
        document.getElementById('feed-form').reset();
        clearFeedPhoto();
        renderAll();
        showToast('오운완 인증 완료! 누적 거리에도 반영됐습니다.', 'ok');
    }

    // ==================== 4. 크루 채팅 ====================
    function renderChat() {
        const pinBanner = document.getElementById('chat-pinned-banner');
        const stream = document.getElementById('chat-message-stream');
        const staffRoomBtn = document.getElementById('chat-staff-room-btn');
        const staffQuickBtns = document.getElementById('chat-staff-quick-chips');
        const me = E.getCurrentMember();
        const isStaff = E.isStaff();
        if (!pinBanner || !stream || !me) return;

        if (staffRoomBtn) staffRoomBtn.style.display = isStaff ? 'inline-flex' : 'none';
        if (staffQuickBtns) staffQuickBtns.style.display = isStaff ? 'contents' : 'none';

        if (!isStaff && E.extra.activeChatRoom === 'staff') {
            E.extra.activeChatRoom = 'all';
            E.saveExtra();
        }

        document.querySelectorAll('.room-chip').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.room === E.extra.activeChatRoom);
        });

        const pinned = E.shared.notices.find(n => n.pinned) || E.shared.notices[0];
        if (pinned) {
            pinBanner.innerHTML = `
                <button type="button" class="pinned-strip-btn" onclick="window.YJAllInOneUI.openNoticesSubTab()">
                    <span class="pill pill-orange">공지</span>
                    <span class="pinned-strip-text">${esc(pinned.title)}</span>
                    <span class="pinned-strip-arrow">보기 ›</span>
                </button>
            `;
        } else {
            pinBanner.innerHTML = '';
        }

        const roomMsgs = E.shared.chats.filter(c => c.room === E.extra.activeChatRoom);
        if (roomMsgs.length === 0) {
            stream.innerHTML = '<div class="empty-card">첫 인사를 남겨보세요!</div>';
            return;
        }

        stream.innerHTML = roomMsgs.map(msg => {
            const isMine = msg.senderId === me.id;
            let cardHtml = '';
            if (msg.cardType === 'schedule' && msg.cardRefId) {
                const s = E.shared.schedules.find(x => x.id === msg.cardRefId);
                if (s) {
                    const isJoined = (s.attendees || []).includes(me.id);
                    cardHtml = `
                        <div class="chat-embed-card">
                            <div class="embed-label">📅 러닝 일정 카드</div>
                            <div class="embed-title">${esc(s.title)}</div>
                            <div class="embed-meta">${esc(E.formatKoreanDate(s.date))} ${esc(s.time)} · ${esc(s.location)} (${s.distance}km)</div>
                            <button type="button" class="embed-btn" onclick="window.YJAllInOneUI.toggleJoinSchedule('${esc(s.id)}')">
                                ${isJoined ? '✔ 참석 완료' : '🙋 바로 참석 신청'} (${s.attendees.length}명)
                            </button>
                        </div>
                    `;
                }
            } else if (msg.cardType === 'notice' && msg.cardRefId) {
                const n = E.shared.notices.find(x => x.id === msg.cardRefId);
                if (n) {
                    cardHtml = `
                        <div class="chat-embed-card notice">
                            <div class="embed-label">📢 크루 공지 카드</div>
                            <div class="embed-title">${esc(n.title)}</div>
                            <button type="button" class="embed-btn" onclick="window.YJAllInOneUI.openNoticesSubTab()">공지 전문 보기</button>
                        </div>
                    `;
                }
            }

            if (isMine) {
                return `
                    <div class="chat-row mine">
                        <div class="chat-bubble-wrap">
                            <div class="chat-bubble">
                                <div class="chat-text">${esc(msg.text).replace(/\n/g, '<br>')}</div>
                                ${cardHtml}
                            </div>
                            <span class="chat-time">${esc(msg.time)}</span>
                        </div>
                    </div>
                `;
            }

            const avatarInitial = esc((msg.senderName || '?').slice(0, 1));
            const isStaffSender = msg.senderRole === '크루장' || msg.senderRole === '운영진';
            return `
                <div class="chat-row theirs">
                    <div class="chat-avatar ${isStaffSender ? 'staff' : ''}">${avatarInitial}</div>
                    <div class="chat-theirs-col">
                        <div class="chat-sender-meta"><strong>${esc(msg.senderName)}</strong> <span>${esc(msg.senderRole)}</span></div>
                        <div class="chat-bubble-wrap">
                            <div class="chat-bubble">
                                <div class="chat-text">${esc(msg.text).replace(/\n/g, '<br>')}</div>
                                ${cardHtml}
                            </div>
                            <span class="chat-time">${esc(msg.time)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function sendChatMessage(textOverride, cardType, cardRefId) {
        const me = E.getCurrentMember();
        const input = document.getElementById('chat-message-input');
        const text = typeof textOverride === 'string' ? textOverride : (input ? input.value.trim() : '');
        if (!me || (!text && !cardType)) return;

        E.shared.chats.push({
            id: 'c_' + Date.now(),
            room: E.extra.activeChatRoom,
            senderId: me.id,
            senderName: me.name,
            senderRole: me.role,
            text,
            time: E.getCurrentTimeLabel(),
            cardType: cardType || null,
            cardRefId: cardRefId || null
        });
        if (input && typeof textOverride !== 'string') input.value = '';
        E.playSound('tap');
        E.saveShared();
        renderChat();
        scrollChatToBottom();
    }

    // ==================== 크루장/운영진 운영 도구 (일정·출석·공지·회원·설정) ====================
    function openScheduleModal(id) {
        editingScheduleId = id || null;
        const titleEl = document.getElementById('schedule-modal-title');
        if (editingScheduleId) {
            const s = E.shared.schedules.find(x => x.id === editingScheduleId);
            if (!s) return;
            titleEl.textContent = '러닝 스케줄 수정';
            document.getElementById('sch-title').value = s.title;
            document.getElementById('sch-type').value = s.type;
            document.getElementById('sch-date').value = s.date;
            document.getElementById('sch-time').value = s.time;
            document.getElementById('sch-location').value = s.location;
            document.getElementById('sch-distance').value = s.distance;
            document.getElementById('sch-max').value = s.maxCount;
            document.getElementById('sch-note').value = s.courseNote || '';
        } else {
            titleEl.textContent = '새 러닝 스케줄 작성';
            const d = new Date();
            d.setDate(d.getDate() + 3);
            document.getElementById('sch-title').value = '';
            document.getElementById('sch-type').value = '정기런';
            document.getElementById('sch-date').value = d.toISOString().slice(0, 10);
            document.getElementById('sch-time').value = '20:00';
            document.getElementById('sch-location').value = '';
            document.getElementById('sch-distance').value = '8';
            document.getElementById('sch-max').value = '20';
            document.getElementById('sch-note').value = '';
        }
        openModal('schedule-modal');
    }

    function saveScheduleForm(ev) {
        ev.preventDefault();
        const title = document.getElementById('sch-title').value.trim();
        const type = document.getElementById('sch-type').value;
        const date = document.getElementById('sch-date').value;
        const time = document.getElementById('sch-time').value;
        const location = document.getElementById('sch-location').value.trim();
        const distance = Math.max(1, Number(document.getElementById('sch-distance').value) || 5);
        const maxCount = Math.max(2, Number(document.getElementById('sch-max').value) || 20);
        const courseNote = document.getElementById('sch-note').value.trim();

        if (!title || !date || !location) {
            showToast('제목, 날짜, 집결지를 입력해 주세요.', 'warn');
            return;
        }
        if (editingScheduleId) {
            const s = E.shared.schedules.find(x => x.id === editingScheduleId);
            if (s) {
                s.title = title; s.type = type; s.date = date; s.time = time;
                s.location = location; s.distance = distance; s.maxCount = maxCount; s.courseNote = courseNote;
            }
            showToast('스케줄을 수정했습니다.', 'ok');
        } else {
            const me = E.getCurrentMember();
            E.shared.schedules.unshift({
                id: 's_' + Date.now(),
                title, type, date, time, location, distance, maxCount, courseNote,
                attendees: me ? [me.id] : [],
                checkedIn: [],
                completed: false
            });
            E.playSound('success');
            showToast('새 러닝 일정을 등록했습니다!', 'ok');
        }
        E.saveShared();
        closeModal('schedule-modal');
        renderAll();
    }

    function deleteSchedule(id) {
        const s = E.shared.schedules.find(x => x.id === id);
        if (!s) return;
        askConfirm('스케줄 삭제', `'${s.title}' 일정을 삭제할까요?`, () => {
            E.shared.schedules = E.shared.schedules.filter(x => x.id !== id);
            E.saveShared();
            renderAll();
            showToast('일정이 삭제되었습니다.');
        });
    }

    function openAttendanceModal(scheduleId) {
        activeAttendanceScheduleId = scheduleId;
        renderAttendanceModalContent();
        openModal('attendance-modal');
    }

    function renderAttendanceModalContent() {
        const s = E.shared.schedules.find(x => x.id === activeAttendanceScheduleId);
        if (!s) return;
        document.getElementById('att-modal-subtitle').textContent = `${s.title} · ${E.formatKoreanDate(s.date)} ${s.time} (${s.distance}km)`;

        const groups = E.groupAttendeesByPace(s);
        document.getElementById('att-pace-groups-box').innerHTML = ['A조', 'B조', 'C조'].map(g => {
            const mems = groups[g] || [];
            const names = mems.length ? mems.map(m => m.name).join(', ') : '배정 인원 없음';
            return `<div class="att-group-row"><span class="pace-chip pace-${g[0].toLowerCase()}">${g}</span><span class="att-group-names">${esc(names)}</span></div>`;
        }).join('');

        document.getElementById('att-member-checklist').innerHTML = E.shared.members.map(m => {
            const isAtt = s.attendees.includes(m.id);
            const isChk = (s.checkedIn || []).includes(m.id);
            return `
                <div class="att-member-row">
                    <div class="att-member-info">
                        <strong>${esc(m.name)}</strong>
                        <span class="att-member-sub">${esc(m.paceGroup)} (${esc(m.pace)}) · ${esc(m.role)}</span>
                    </div>
                    <div class="att-toggle-pair">
                        <button type="button" class="toggle-chip ${isAtt ? 'on' : ''}" onclick="window.YJAllInOneUI.toggleAttendee('${esc(s.id)}','${esc(m.id)}')">${isAtt ? '참석됨' : '참석'}</button>
                        <button type="button" class="toggle-chip mint ${isChk ? 'on' : ''}" onclick="window.YJAllInOneUI.toggleCheckIn('${esc(s.id)}','${esc(m.id)}')">${isChk ? '✔ 출석' : '출석체크'}</button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('att-complete-btn').textContent = s.completed ? '완료됨 (다시 열기)' : '🏁 이번 러닝 완료 처리';
    }

    function toggleAttendee(scheduleId, memberId) {
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        if (!s) return;
        const idx = s.attendees.indexOf(memberId);
        if (idx >= 0) {
            s.attendees.splice(idx, 1);
            s.checkedIn = (s.checkedIn || []).filter(x => x !== memberId);
        } else {
            s.attendees.push(memberId);
        }
        E.playSound('tap');
        E.saveShared();
        renderAttendanceModalContent();
        renderAll();
    }

    function toggleCheckIn(scheduleId, memberId) {
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        const m = E.shared.members.find(x => x.id === memberId);
        if (!s || !m) return;
        if (!s.checkedIn) s.checkedIn = [];
        const idx = s.checkedIn.indexOf(memberId);
        if (idx >= 0) {
            s.checkedIn.splice(idx, 1);
            m.attendanceCount = Math.max(0, (m.attendanceCount || 0) - 1);
            m.totalDistance = Math.max(0, (m.totalDistance || 0) - Number(s.distance || 0));
        } else {
            if (!s.attendees.includes(memberId)) s.attendees.push(memberId);
            s.checkedIn.push(memberId);
            m.attendanceCount = (m.attendanceCount || 0) + 1;
            m.totalDistance = (m.totalDistance || 0) + Number(s.distance || 0);
            E.playSound('success');
        }
        E.saveShared();
        renderAttendanceModalContent();
        renderAll();
    }

    function completeScheduleRun() {
        const s = E.shared.schedules.find(x => x.id === activeAttendanceScheduleId);
        if (!s) return;
        s.completed = !s.completed;
        E.saveShared();
        if (s.completed) {
            E.playSound('success');
            if (typeof window.confetti === 'function') window.confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
            showToast(`'${s.title}' 러닝 완료 처리되었습니다!`, 'ok');
        }
        renderAttendanceModalContent();
        renderAll();
    }

    function shareScheduleToChat(scheduleId) {
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        if (!s) return;
        E.extra.activeChatRoom = 'all';
        switchTab('chat');
        sendChatMessage(`이번 러닝 일정을 공유합니다! 아래 카드에서 바로 참석 신청해 주세요.`, 'schedule', s.id);
        showToast('채팅방에 일정을 공유했습니다.', 'ok');
    }

    function openNoticeModal(id, templateKey) {
        editingNoticeId = id || null;
        const titleEl = document.getElementById('notice-modal-title');
        if (editingNoticeId) {
            const n = E.shared.notices.find(x => x.id === editingNoticeId);
            if (!n) return;
            titleEl.textContent = '공지사항 수정';
            document.getElementById('not-category').value = n.category;
            document.getElementById('not-title').value = n.title;
            document.getElementById('not-content').value = n.content;
            document.getElementById('not-pinned').checked = Boolean(n.pinned);
        } else if (templateKey && NOTICE_TEMPLATES[templateKey]) {
            const tpl = NOTICE_TEMPLATES[templateKey];
            titleEl.textContent = '빠른 양식으로 공지 작성';
            document.getElementById('not-category').value = tpl.category;
            document.getElementById('not-title').value = tpl.title;
            document.getElementById('not-content').value = tpl.content;
            document.getElementById('not-pinned').checked = tpl.pinned;
        } else {
            titleEl.textContent = '새 공지사항 작성';
            document.getElementById('not-category').value = '필독';
            document.getElementById('not-title').value = '';
            document.getElementById('not-content').value = '';
            document.getElementById('not-pinned').checked = true;
        }
        openModal('notice-modal');
    }

    function saveNoticeForm(ev) {
        ev.preventDefault();
        const me = E.getCurrentMember();
        const category = document.getElementById('not-category').value;
        const title = document.getElementById('not-title').value.trim();
        const content = document.getElementById('not-content').value.trim();
        const pinned = document.getElementById('not-pinned').checked;
        if (!title || !content) {
            showToast('공지 제목과 내용을 입력해 주세요.', 'warn');
            return;
        }
        if (editingNoticeId) {
            const n = E.shared.notices.find(x => x.id === editingNoticeId);
            if (n) { n.category = category; n.title = title; n.content = content; n.pinned = pinned; }
            showToast('공지를 수정했습니다.', 'ok');
        } else {
            E.shared.notices.unshift({
                id: 'n_' + Date.now(),
                category, pinned, title, content,
                author: `${me ? me.name : '크루장'} ${me ? me.role : ''}`.trim(),
                createdAt: '방금 전',
                readBy: me ? [me.id] : []
            });
            E.playSound('success');
            showToast('공지사항을 발행했습니다!', 'ok');
        }
        E.saveShared();
        closeModal('notice-modal');
        renderAll();
    }

    function togglePinNotice(id) {
        const n = E.shared.notices.find(x => x.id === id);
        if (!n) return;
        n.pinned = !n.pinned;
        E.saveShared();
        renderAll();
    }

    function deleteNotice(id) {
        const n = E.shared.notices.find(x => x.id === id);
        if (!n) return;
        askConfirm('공지 삭제', `'${n.title}' 공지를 삭제할까요?`, () => {
            E.shared.notices = E.shared.notices.filter(x => x.id !== id);
            E.saveShared();
            renderAll();
            showToast('공지를 삭제했습니다.');
        });
    }

    function shareNoticeToChat(noticeId) {
        const n = E.shared.notices.find(x => x.id === noticeId);
        if (!n) return;
        E.extra.activeChatRoom = 'all';
        switchTab('chat');
        sendChatMessage(`새 공지사항이 올라왔습니다. 확인 부탁드립니다!`, 'notice', n.id);
        showToast('채팅방에 공지를 공유했습니다.', 'ok');
    }

    // ==================== 5. 운영실(회원 관리 & 크루 설정 모달) ====================
    function renderAdminMembers() {
        const statsEl = document.getElementById('admin-member-stats');
        const listEl = document.getElementById('admin-member-list');
        if (!statsEl || !listEl) return;

        const members = E.shared.members;
        const paidTargets = members.filter(m => m.feeStatus !== '면제');
        const paidCount = paidTargets.filter(m => m.feeStatus === '완납').length;
        const feeRate = paidTargets.length ? Math.round((paidCount / paidTargets.length) * 100) : 100;
        const unpaidCount = paidTargets.filter(m => m.feeStatus === '미납').length;

        statsEl.innerHTML = `
            <div class="stat-box"><span class="stat-label">총 크루원</span><strong class="stat-value">${members.length}명</strong></div>
            <div class="stat-box"><span class="stat-label">회비 완납률</span><strong class="stat-value">${feeRate}%</strong></div>
            <div class="stat-box"><span class="stat-label">회비 미납</span><strong class="stat-value" style="color:#ef4444;">${unpaidCount}명</strong></div>
        `;

        const q = memberQuery.trim().toLowerCase();
        const filtered = members.filter(m => {
            if (memberFilter === 'unpaid' && m.feeStatus !== '미납') return false;
            if (['A조', 'B조', 'C조'].includes(memberFilter) && m.paceGroup !== memberFilter) return false;
            if (q && !`${m.name} ${m.role} ${m.memo || ''} ${m.pace}`.toLowerCase().includes(q)) return false;
            return true;
        });

        listEl.innerHTML = filtered.length ? filtered.map(m => {
            const feeBadgeClass = m.feeStatus === '완납' ? 'pill-mint' : (m.feeStatus === '미납' ? 'pill-red' : 'pill-slate');
            return `
                <div class="crew-card">
                    <div class="member-top-row">
                        <div class="member-main">
                            <div class="member-name-row">
                                <strong>${esc(m.name)}</strong>
                                <span class="pill pill-slate">${esc(m.role)}</span>
                                <span class="pill pill-orange">${esc(m.paceGroup)} · ${esc(m.pace)}</span>
                            </div>
                            <div class="muted-xs" style="margin-top:3px;">출석 ${m.attendanceCount}회 · 누적 ${m.totalDistance}km ${m.memo ? `· ${esc(m.memo)}` : ''}</div>
                        </div>
                        <button type="button" class="pill-btn ${feeBadgeClass}" onclick="window.YJAllInOneUI.cycleFeeStatus('${esc(m.id)}')">회비 ${esc(m.feeStatus)}</button>
                    </div>
                    <div class="card-action-row">
                        <button type="button" class="btn-soft" onclick="window.YJAllInOneUI.openMemberModal('${esc(m.id)}')">✏️ 수정</button>
                        <button type="button" class="btn-soft-danger" onclick="window.YJAllInOneUI.deleteMember('${esc(m.id)}')">삭제</button>
                    </div>
                </div>
            `;
        }).join('') : '<div class="empty-card">조건에 맞는 크루원이 없습니다.</div>';
    }

    function openAdminModal() {
        document.getElementById('admin-crew-name').value = E.shared.crewName;
        document.getElementById('admin-goal-km').value = E.extra.monthlyGoalKm || 50;
        renderAdminMembers();
        openModal('admin-modal');
    }

    function openMemberModal(id) {
        editingMemberId = id || null;
        const titleEl = document.getElementById('member-modal-title');
        if (editingMemberId) {
            const m = E.shared.members.find(x => x.id === editingMemberId);
            if (!m) return;
            titleEl.textContent = '크루원 정보 수정';
            document.getElementById('mem-name').value = m.name;
            document.getElementById('mem-role').value = m.role;
            document.getElementById('mem-pace').value = m.pace;
            document.getElementById('mem-fee').value = m.feeStatus;
            document.getElementById('mem-memo').value = m.memo || '';
        } else {
            titleEl.textContent = '신규 크루원 등록';
            document.getElementById('mem-name').value = '';
            document.getElementById('mem-role').value = '신입';
            document.getElementById('mem-pace').value = "5'30\"";
            document.getElementById('mem-fee').value = '완납';
            document.getElementById('mem-memo').value = '';
        }
        openModal('member-modal');
    }

    function saveMemberForm(ev) {
        ev.preventDefault();
        const name = document.getElementById('mem-name').value.trim();
        const role = document.getElementById('mem-role').value;
        const pace = document.getElementById('mem-pace').value.trim() || "5'30\"";
        const feeStatus = document.getElementById('mem-fee').value;
        const memo = document.getElementById('mem-memo').value.trim();
        if (!name) return showToast('이름을 입력해 주세요.', 'warn');
        const paceGroup = E.autoPaceGroup(pace);

        if (editingMemberId) {
            const m = E.shared.members.find(x => x.id === editingMemberId);
            if (m) { m.name = name; m.role = role; m.pace = pace; m.paceGroup = paceGroup; m.feeStatus = feeStatus; m.memo = memo; }
            showToast(`${name}님 정보를 수정했습니다.`, 'ok');
        } else {
            E.shared.members.push({
                id: 'm_' + Date.now(),
                name, role, pace, paceGroup,
                attendanceCount: 0, totalDistance: 0,
                feeStatus, phoneLast4: '', memo
            });
            E.playSound('success');
            showToast(`${name}님이 ${paceGroup} 크루원으로 등록되었습니다!`, 'ok');
        }
        E.saveShared();
        closeModal('member-modal');
        renderAdminMembers();
        renderAll();
    }

    function cycleFeeStatus(id) {
        const m = E.shared.members.find(x => x.id === id);
        if (!m) return;
        const order = ['완납', '미납', '면제'];
        m.feeStatus = order[(order.indexOf(m.feeStatus) + 1) % order.length];
        E.playSound('tap');
        E.saveShared();
        renderAdminMembers();
        renderAll();
        showToast(`${m.name}님 회비 → ${m.feeStatus}`);
    }

    function deleteMember(id) {
        const m = E.shared.members.find(x => x.id === id);
        if (!m) return;
        if (E.shared.members.length <= 1) return showToast('최소 1명의 회원이 필요합니다.', 'warn');
        askConfirm('크루원 삭제', `${m.name}님을 명부에서 제외할까요?`, () => {
            E.shared.members = E.shared.members.filter(x => x.id !== id);
            E.shared.schedules.forEach(s => {
                s.attendees = (s.attendees || []).filter(x => x !== id);
                s.checkedIn = (s.checkedIn || []).filter(x => x !== id);
            });
            if (E.extra.currentMemberId === id) E.extra.currentMemberId = E.shared.members[0].id;
            E.saveShared();
            E.saveExtra();
            renderAdminMembers();
            renderAll();
            showToast(`${m.name}님이 제외되었습니다.`);
        });
    }

    function saveCrewSettings(ev) {
        ev.preventDefault();
        const cName = document.getElementById('admin-crew-name').value.trim();
        const gKm = Math.max(10, Number(document.getElementById('admin-goal-km').value) || 50);
        if (cName) E.shared.crewName = cName;
        E.extra.monthlyGoalKm = gKm;
        E.saveShared();
        E.saveExtra();
        renderAll();
        showToast('크루 기본 설정을 저장했습니다.', 'ok');
    }

    function resetAllData() {
        askConfirm('초기 예시로 되돌리기', '현재 입력한 모든 기록을 초기 상태로 되돌릴까요?', () => {
            E.resetAll();
            closeAllModals();
            renderAll();
            showToast('초기 상태로 되돌렸습니다.');
        });
    }

    // ==================== 프로필 전환 ====================
    function openMemberSwitchModal() {
        const list = document.getElementById('switch-member-list');
        if (!list) return;
        list.innerHTML = E.shared.members.map(m => {
            const active = m.id === E.extra.currentMemberId;
            const roleTag = (m.role === '크루장' || m.role === '운영진') ? '👑 운영 권한' : '🏃 크루원';
            return `
                <button type="button" class="switch-member-btn ${active ? 'active' : ''}" onclick="window.YJAllInOneUI.selectMember('${esc(m.id)}')">
                    <div>
                        <strong>${esc(m.name)}</strong>
                        <span class="pill pill-slate">${esc(m.role)} · ${esc(m.paceGroup)}</span>
                    </div>
                    <span>${active ? '✔ 현재' : roleTag}</span>
                </button>
            `;
        }).join('');
        openModal('switch-member-modal');
    }

    function selectMember(memberId) {
        E.extra.currentMemberId = memberId;
        E.saveExtra();
        closeModal('switch-member-modal');
        renderAll();
        const me = E.getCurrentMember();
        if (me) {
            const modeTxt = E.isStaff() ? '운영 기능이 함께 열렸습니다' : '가벼운 크루원 화면으로 전환되었습니다';
            showToast(`${me.name} (${me.role}) · ${modeTxt}`);
        }
    }

    function renderAll() {
        updateHeader();
        renderHome();
        renderRankAndRun();
        renderFeedAndNotices();
        renderChat();
    }

    function wireEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

        document.querySelectorAll('.sub-pill-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                E.extra.feedSubTab = btn.dataset.sub;
                E.saveExtra();
                renderFeedAndNotices();
            });
        });

        document.querySelectorAll('.room-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                E.extra.activeChatRoom = btn.dataset.room;
                E.saveExtra();
                renderChat();
                scrollChatToBottom();
            });
        });

        document.querySelectorAll('.rank-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                E.extra.rankMode = btn.dataset.mode;
                E.saveExtra();
                renderRankAndRun();
            });
        });

        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                memberFilter = btn.dataset.filter;
                document.querySelectorAll('.filter-chip').forEach(b => b.classList.toggle('active', b === btn));
                renderAdminMembers();
            });
        });

        const searchEl = document.getElementById('admin-member-search');
        if (searchEl) searchEl.addEventListener('input', e => { memberQuery = e.target.value; renderAdminMembers(); });

        const spmSlider = document.getElementById('mate-spm-slider');
        if (spmSlider) spmSlider.addEventListener('input', e => setSpm(e.target.value));

        document.getElementById('feed-photo-camera')?.addEventListener('change', e => {
            if (e.target.files && e.target.files[0]) handleFeedPhotoFile(e.target.files[0]);
        });
        document.getElementById('feed-photo-gallery')?.addEventListener('change', e => {
            if (e.target.files && e.target.files[0]) handleFeedPhotoFile(e.target.files[0]);
        });

        document.getElementById('feed-dist')?.addEventListener('input', () => {
            hasStartedDistAccum = true;
        });
        document.getElementById('feed-pace')?.addEventListener('blur', e => {
            e.target.value = normalizePaceInput(e.target.value, "5'30\"");
        });

        document.getElementById('schedule-form')?.addEventListener('submit', saveScheduleForm);
        document.getElementById('notice-form')?.addEventListener('submit', saveNoticeForm);
        document.getElementById('member-form')?.addEventListener('submit', saveMemberForm);
        document.getElementById('feed-form')?.addEventListener('submit', saveFeedPost);
        document.getElementById('admin-settings-form')?.addEventListener('submit', saveCrewSettings);
        document.getElementById('chat-input-form')?.addEventListener('submit', ev => { ev.preventDefault(); sendChatMessage(); });

        document.getElementById('confirm-modal-ok')?.addEventListener('click', () => {
            const fn = pendingConfirmAction;
            pendingConfirmAction = null;
            closeModal('confirm-modal');
            if (typeof fn === 'function') fn();
        });

        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
        });

        document.querySelectorAll('.crew-modal-backdrop').forEach(bg => {
            bg.addEventListener('click', ev => { if (ev.target === bg) closeModal(bg.id); });
        });
    }

    window.YJAllInOneUI = {
        switchTab,
        openNoticesSubTab: () => { E.extra.feedSubTab = 'notices'; switchTab('feed'); },
        toggleJoinSchedule,
        toggleReadNotice,
        toggleLiveRun,
        toggleMetronome,
        setSpm,
        saveMyRunRecord,
        cheerTeammate,
        toggleClap,
        toggleCommentBox,
        submitFeedComment,
        openFeedModal: () => { hasStartedDistAccum = false; clearFeedPhoto(); openModal('feed-modal'); },
        clearFeedPhoto,
        setFeedDist,
        nudgeFeedDist,
        setFeedPace,
        sendQuickChat: txt => sendChatMessage(txt),
        quickShareNextSchedule: () => {
            const s = E.shared.schedules.find(x => !x.completed) || E.shared.schedules[0];
            if (!s) return showToast('공유할 일정이 없습니다.', 'warn');
            sendChatMessage(`다가오는 '${s.title}' 일정 안내드립니다!`, 'schedule', s.id);
        },
        quickShareLatestNotice: () => {
            const n = E.shared.notices.find(x => x.pinned) || E.shared.notices[0];
            if (!n) return showToast('공유할 공지가 없습니다.', 'warn');
            sendChatMessage(`필독 공지 공유드립니다!`, 'notice', n.id);
        },
        openScheduleModal,
        deleteSchedule,
        openAttendanceModal,
        toggleAttendee,
        toggleCheckIn,
        completeScheduleRun,
        shareScheduleToChat,
        openNoticeModal,
        togglePinNotice,
        deleteNotice,
        shareNoticeToChat,
        openAdminModal,
        openMemberModal,
        cycleFeeStatus,
        deleteMember,
        resetAllData,
        openMemberSwitchModal,
        selectMember
    };

    document.addEventListener('DOMContentLoaded', () => {
        E.load();
        wireEvents();
        switchTab(E.extra.activeTab || 'home');
        E.fetchSeoulWeather(() => updateHeader());
    });
})();
