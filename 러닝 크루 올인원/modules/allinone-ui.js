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
    let isFeeCalendarMode = false;
    let feeCalYear = 2026;
    let feeCalMonth = 10;
    let selectedFeeCalDate = '';
    const expandedScheduleIds = new Set();
    const expandedNoticeIds = new Set();
    let openScheduleMoreId = null;
    let isPinnedNoticeExpanded = false;
    let activeCommentEmojiFeedId = null;
    let isChatAttachOpen = false;
    let isChatEmojiOpen = false;
    let pendingChatPhotoDataUrl = '';
    const CREW_EMOJIS = ['👏', '👍', '🔥', '🏃', '🏆', '💦', '❤️', '😄', '💪', '🙌', '👟', '⚡', '🎉', '🥤', '🌟', '😎'];

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function msIcon(name, fill) {
        return `<span class="material-symbols-rounded ms-ico${fill ? ' ms-fill' : ''}" aria-hidden="true">${name}</span>`;
    }

    function getWeatherIconName(rawIcon) {
        const s = String(rawIcon || '');
        if (s.includes('⛅') || s.includes('🌤')) return 'partly_cloudy_day';
        if (s.includes('☁')) return 'cloud';
        if (s.includes('🌧') || s.includes('☔') || s.includes('🌦')) return 'rainy';
        if (s.includes('⛈')) return 'thunderstorm';
        if (s.includes('❄')) return 'ac_unit';
        return 'wb_sunny';
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
        const nameEl = document.getElementById('header-crew-name');
        const weatherEl = document.getElementById('header-weather-pill');

        if (nameEl) nameEl.textContent = E.shared.crewName;
        if (weatherEl) {
            const w = E.shared.weather;
            weatherEl.textContent = `${w.city} ${w.temp}°C`;
        }
        renderDrawer();
    }

    function openDrawer() {
        renderDrawer();
        const backdrop = document.getElementById('app-drawer-backdrop');
        const drawer = document.getElementById('app-drawer');
        if (backdrop) backdrop.classList.add('open');
        if (drawer) {
            drawer.classList.add('open');
            drawer.setAttribute('aria-hidden', 'false');
        }
    }

    function closeDrawer() {
        const backdrop = document.getElementById('app-drawer-backdrop');
        const drawer = document.getElementById('app-drawer');
        if (backdrop) backdrop.classList.remove('open');
        if (drawer) {
            drawer.classList.remove('open');
            drawer.setAttribute('aria-hidden', 'true');
        }
    }

    function renderDrawer() {
        const me = E.getCurrentMember();
        const isStaff = E.isStaff();
        const subEl = document.getElementById('drawer-crew-sub');
        const menuList = document.getElementById('drawer-menu-list');
        if (!me || !menuList) return;

        if (subEl) subEl.textContent = `${isStaff ? '운영진 모드' : '크루원 모드'} · 함께 뛰는 ${E.shared.members.length}명`;

        menuList.innerHTML = `
            <div class="drawer-section-label">공통 메뉴</div>
            <button type="button" class="drawer-menu-item" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.openMemberSwitchModal();">
                ${msIcon('manage_accounts')} <span>프로필 관리</span>
            </button>
            <button type="button" class="drawer-menu-item" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.openMyInfoModal();">
                ${msIcon('badge')} <span>내 정보 관리</span>
            </button>
            <button type="button" class="drawer-menu-item" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.openAppSettingsModal();">
                ${msIcon('settings')} <span>앱 설정</span>
            </button>
            ${isStaff ? `
                <div class="drawer-divider"></div>
                <div class="drawer-section-label">운영진 전용</div>
                <button type="button" class="drawer-menu-item accent" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.openAdminSection('all');">
                    ${msIcon('group')} <span>회원 관리</span>
                </button>
                <button type="button" class="drawer-menu-item accent" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.openFeeModal();">
                    ${msIcon('payments')} <span>회비 관리</span>
                </button>
                <button type="button" class="drawer-menu-item accent" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.switchTab('home'); window.YJAllInOneUI.openScheduleModal();">
                    ${msIcon('calendar_month')} <span>스케줄 관리</span>
                </button>
                <button type="button" class="drawer-menu-item accent" onclick="window.YJAllInOneUI.closeDrawer(); window.YJAllInOneUI.openNoticeModal();">
                    ${msIcon('campaign')} <span>공지 관리</span>
                </button>
            ` : ''}
        `;
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
        const homeProfileBox = document.getElementById('home-profile-box');
        const noticeBox = document.getElementById('home-pinned-notice');
        const schBox = document.getElementById('home-schedule-list');
        if (!noticeBox || !schBox || !me) return;

        if (homeProfileBox) {
            const byDist = getSortedMembersByRankMode();
            const myRank = byDist.findIndex(m => m.id === me.id) + 1;
            const goal = Math.max(10, Number(E.extra.monthlyGoalKm) || 50);
            const pct = Math.min(100, Math.round(((me.totalDistance || 0) / goal) * 100));
            const feeClass = me.feeStatus === '완납' ? 'pill-mint' : (me.feeStatus === '미납' ? 'pill-red' : 'pill-slate');
            homeProfileBox.innerHTML = `
                <div class="drawer-profile-head">
                    <div>
                        <span class="my-hero-badge">${esc(me.role)} · ${esc(me.paceGroup)} (${esc(me.pace)})</span>
                        <div class="drawer-profile-name">${esc(me.name)}님</div>
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
        }

        const pinnedNotices = E.shared.notices.filter(n => n.pinned);
        const totalMembers = Math.max(1, E.shared.members.length);
        if (pinnedNotices.length > 0) {
            noticeBox.innerHTML = pinnedNotices.map(n => {
                const isExpanded = expandedNoticeIds.has(n.id);
                const readCount = (n.readBy || []).length;
                const iRead = (n.readBy || []).includes(me.id);
                return `
                    <article class="crew-card schedule-card ${isExpanded ? 'is-expanded' : ''}">
                        <button type="button" class="schedule-summary-trigger" aria-expanded="${isExpanded ? 'true' : 'false'}" onclick="window.YJAllInOneUI.toggleHomeNoticeCard('${esc(n.id)}')">
                            <div class="card-head" style="width:100%;">
                                <div class="pill-group">
                                    <span class="pill pill-orange">${msIcon('push_pin', true)} 필독</span>
                                    <span class="pill pill-slate">${esc(n.category)}</span>
                                    ${iRead ? `<span class="pill pill-mint">${msIcon('check_circle', true)} 확인됨</span>` : ''}
                                </div>
                                <div class="card-head-right">
                                    <span class="muted-xs">확인 ${readCount}/${totalMembers}명</span>
                                    <span class="material-symbols-rounded schedule-chevron" aria-hidden="true">expand_more</span>
                                </div>
                            </div>
                            <div class="schedule-summary-row2" style="width:100%;">
                                <h3 class="card-title">${esc(n.title)}</h3>
                                <span class="schedule-summary-sub">${esc(n.author)} · ${esc(n.createdAt)}</span>
                            </div>
                        </button>
                        <div class="schedule-details">
                            <p class="notice-text">${esc(n.content).replace(/\n/g, '<br>')}</p>
                            <div class="card-action-row">
                                <button type="button" class="${iRead ? 'btn-soft-mint' : 'btn-soft'}" onclick="window.YJAllInOneUI.toggleReadNotice('${esc(n.id)}')">
                                    ${iRead ? `${msIcon('check_circle', true)} 확인됨` : `${msIcon('visibility')} 공지 읽음 확인`}
                                </button>
                                ${isStaff ? `
                                    <button type="button" class="btn-soft-primary" onclick="window.YJAllInOneUI.shareNoticeToChat('${esc(n.id)}')">${msIcon('chat_bubble')} 채팅방 띄우기</button>
                                    <button type="button" class="icon-btn" title="수정" aria-label="공지 수정" onclick="window.YJAllInOneUI.openNoticeModal('${esc(n.id)}')">${msIcon('edit')}</button>
                                    <button type="button" class="icon-btn" title="삭제" aria-label="공지 삭제" onclick="window.YJAllInOneUI.deleteNotice('${esc(n.id)}')">${msIcon('delete')}</button>
                                ` : ''}
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        } else {
            noticeBox.innerHTML = '<div class="empty-card">등록된 필독 공지가 없습니다.</div>';
        }

        const schedules = E.shared.schedules.slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
        if (schedules.length === 0) {
            schBox.innerHTML = '<div class="empty-card">등록된 러닝 일정이 없습니다.</div>';
            return;
        }

        schBox.innerHTML = schedules.map(s => {
            const isJoined = (s.attendees || []).includes(me.id);
            const isChecked = (s.checkedIn || []).includes(me.id);
            const isExpanded = expandedScheduleIds.has(s.id);
            const dday = E.getDaysLeftLabel(s.date);
            const groups = E.groupAttendeesByPace(s);
            const sameGroupMates = (groups[me.paceGroup] || []).filter(m => m.id !== me.id).map(m => m.name);

            return `
                <article class="crew-card schedule-card ${s.completed ? 'is-completed' : ''} ${isExpanded ? 'is-expanded' : ''}">
                    <button type="button" class="schedule-summary-trigger" aria-expanded="${isExpanded ? 'true' : 'false'}" onclick="window.YJAllInOneUI.toggleScheduleCard('${esc(s.id)}')">
                        <div class="card-head" style="width:100%;">
                            <div class="pill-group">
                                <span class="pill pill-orange">${esc(s.type)}</span>
                                <span class="pill ${s.completed ? 'pill-mint' : 'pill-slate'}">${s.completed ? '완료됨' : esc(dday)}</span>
                                ${isChecked ? `<span class="pill pill-mint">${msIcon('check_circle', true)} 출석 완료</span>` : (isJoined ? `<span class="pill pill-mint">참석 신청</span>` : '')}
                            </div>
                            <div class="card-head-right">
                                <span class="muted-xs">참여 ${s.attendees.length}/${s.maxCount}명</span>
                                <span class="material-symbols-rounded schedule-chevron" aria-hidden="true">expand_more</span>
                            </div>
                        </div>
                        <div class="schedule-summary-row2" style="width:100%;">
                            <h3 class="card-title">${esc(s.title)}</h3>
                            <span class="schedule-summary-sub">${esc(E.formatKoreanDate(s.date))} ${esc(s.time)} · ${s.distance}km</span>
                        </div>
                    </button>
                    <div class="schedule-details">
                        <div class="card-info-grid">
                            <div>${msIcon('schedule')} <span>${esc(E.formatKoreanDate(s.date))} ${esc(s.time)}</span></div>
                            <div>${msIcon('straighten')} <span>${s.distance}km · 내 배정 ${esc(me.paceGroup)}</span></div>
                            <div class="full-span">${msIcon('location_on')} <span>${esc(s.location)}</span></div>
                        </div>
                        ${s.courseNote ? `<p class="card-note">${esc(s.courseNote)}</p>` : ''}
                        <div class="mate-group-hint">
                            ${msIcon('group')} <span>${sameGroupMates.length ? `같은 ${esc(me.paceGroup)} 러너: <strong>${esc(sameGroupMates.join(', '))}</strong>` : `${esc(me.paceGroup)} 첫 번째 주자로 참여해 보세요!`}</span>
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
                                ${isJoined ? `${msIcon('check_circle', true)} 참석 신청 완료` : `${msIcon('how_to_reg')} 참석하기`}
                            </button>
                            ${!s.completed && !isChecked ? `
                                <button type="button" class="btn-soft-primary" onclick="window.YJAllInOneUI.openQrCheckinModal('${esc(s.id)}')">${msIcon('qr_code_scanner')} QR 출석하기</button>
                            ` : ''}
                            ${isStaff ? `
                                <button type="button" class="btn-soft-primary" onclick="window.YJAllInOneUI.openAttendanceModal('${esc(s.id)}')">${msIcon('groups')} 출석·조편성</button>
                            ` : ''}
                            <div class="schedule-more-wrap">
                                <button type="button" class="icon-btn" title="더보기" aria-label="일정 더보기 메뉴" aria-expanded="${openScheduleMoreId === s.id ? 'true' : 'false'}" onclick="window.YJAllInOneUI.toggleScheduleMoreMenu('${esc(s.id)}', event)">${msIcon('more_vert')}</button>
                                ${openScheduleMoreId === s.id ? `
                                    <div class="schedule-more-menu" role="menu">
                                        <button type="button" class="schedule-more-item" role="menuitem" onclick="window.YJAllInOneUI.closeScheduleMoreMenu(); window.YJAllInOneUI.copyScheduleText('${esc(s.id)}')">${msIcon('content_copy')} 일정 복사하기</button>
                                        ${isStaff ? `
                                            <button type="button" class="schedule-more-item" role="menuitem" onclick="window.YJAllInOneUI.closeScheduleMoreMenu(); window.YJAllInOneUI.shareScheduleToChat('${esc(s.id)}')">${msIcon('share')} 채팅방에 공유</button>
                                            <button type="button" class="schedule-more-item" role="menuitem" onclick="window.YJAllInOneUI.closeScheduleMoreMenu(); window.YJAllInOneUI.openScheduleModal('${esc(s.id)}')">${msIcon('edit')} 일정 수정</button>
                                            <button type="button" class="schedule-more-item danger" role="menuitem" onclick="window.YJAllInOneUI.closeScheduleMoreMenu(); window.YJAllInOneUI.deleteSchedule('${esc(s.id)}')">${msIcon('delete')} 일정 삭제</button>
                                        ` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function toggleScheduleCard(scheduleId) {
        if (expandedScheduleIds.has(scheduleId)) {
            expandedScheduleIds.delete(scheduleId);
            if (openScheduleMoreId === scheduleId) openScheduleMoreId = null;
        } else {
            expandedScheduleIds.add(scheduleId);
        }
        renderHome();
    }

    function toggleHomeNoticeCard(noticeId) {
        if (expandedNoticeIds.has(noticeId)) {
            expandedNoticeIds.delete(noticeId);
        } else {
            expandedNoticeIds.add(noticeId);
        }
        renderHome();
    }

    function toggleScheduleMoreMenu(scheduleId, ev) {
        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
        openScheduleMoreId = openScheduleMoreId === scheduleId ? null : scheduleId;
        renderHome();
    }

    function closeScheduleMoreMenu() {
        if (openScheduleMoreId !== null) {
            openScheduleMoreId = null;
            renderHome();
        }
    }

    function copyScheduleText(scheduleId) {
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        if (!s) return;
        const lines = [
            `[${E.shared.crewName}] ${s.title} (${s.type})`,
            `일시: ${E.formatKoreanDate(s.date)} ${s.time}`,
            `장소: ${s.location}`,
            `거리: ${s.distance}km (참여 ${(s.attendees || []).length}/${s.maxCount}명)`
        ];
        if (s.courseNote) lines.push(`안내: ${s.courseNote}`);
        const text = lines.join('\n');

        const done = () => {
            E.playSound('success');
            showToast('일정 안내가 복사되었습니다! 원하는 곳에 붙여넣기 하세요.', 'ok');
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(done).catch(() => {
                fallbackCopyText(text);
                done();
            });
        } else {
            fallbackCopyText(text);
            done();
        }
    }

    function fallbackCopyText(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (_) {}
        document.body.removeChild(ta);
    }

    function togglePinnedNoticeCard() {
        isPinnedNoticeExpanded = !isPinnedNoticeExpanded;
        renderHome();
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

    function openPinnedNoticeModal(noticeId) {
        const me = E.getCurrentMember();
        const n = E.shared.notices.find(x => x.id === noticeId) || E.shared.notices[0];
        const titleEl = document.getElementById('notice-detail-modal-title');
        const bodyEl = document.getElementById('notice-detail-modal-body');
        if (!n || !bodyEl || !me) return;

        const isRead = (n.readBy || []).includes(me.id);
        if (titleEl) titleEl.textContent = n.pinned ? '필독 공지' : '크루 공지';
        bodyEl.innerHTML = `
            <div class="notice-meta-row">
                <span class="pill pill-orange">${esc(n.category || (n.pinned ? '필독' : '공지'))}</span>
                <span>${esc(n.author)} · ${esc(n.createdAt)}</span>
            </div>
            <h3 class="card-title">${esc(n.title)}</h3>
            <p class="notice-text">${esc(n.content).replace(/\n/g, '<br>')}</p>
            <div class="modal-footer">
                <button type="button" class="${isRead ? 'btn-soft-mint' : 'btn-soft-primary'}" onclick="window.YJAllInOneUI.toggleReadNotice('${esc(n.id)}')">
                    ${isRead ? `${msIcon('check_circle', true)} 공지 확인 완료` : `${msIcon('visibility')} 공지 읽음 확인`}
                </button>
                <button type="button" class="btn-soft" onclick="document.getElementById('notice-detail-modal').classList.remove('open'); window.YJAllInOneUI.openNoticesSubTab();">전체 공지 (${E.shared.notices.length})</button>
            </div>
        `;
        openModal('notice-detail-modal');
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
            const modalEl = document.getElementById('notice-detail-modal');
            if (modalEl && modalEl.classList.contains('open')) openPinnedNoticeModal(noticeId);
            showToast('공지 확인 완료!', 'ok');
        }
    }

    function getSortedMembersByRankMode() {
        const mode = E.extra.rankMode || 'distance';
        return E.shared.members.slice().sort((a, b) => {
            if (mode === 'attendance') {
                const attDiff = (b.attendanceCount || 0) - (a.attendanceCount || 0);
                if (attDiff !== 0) return attDiff;
                return (b.totalDistance || 0) - (a.totalDistance || 0);
            }
            const distDiff = (b.totalDistance || 0) - (a.totalDistance || 0);
            if (distDiff !== 0) return distDiff;
            return (b.attendanceCount || 0) - (a.attendanceCount || 0);
        });
    }

    // ==================== 2. 기록 · 랭킹 ====================
    function renderRankAndRun() {
        const me = E.getCurrentMember();
        const podiumEl = document.getElementById('rank-podium-box');
        const listEl = document.getElementById('rank-list-box');
        if (!podiumEl || !listEl || !me) return;

        const mode = E.extra.rankMode || 'distance';
        document.querySelectorAll('.rank-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const sorted = getSortedMembersByRankMode();
        const formatMetric = m => mode === 'attendance'
            ? `${m.attendanceCount || 0}회 · ${m.totalDistance || 0}km`
            : `${m.totalDistance || 0}km · ${m.attendanceCount || 0}회`;

        podiumEl.innerHTML = sorted.slice(0, 3).map((m, idx) => {
            const metric = formatMetric(m);
            return `
                <div class="podium-card rank-${idx + 1} ${m.id === me.id ? 'is-me' : ''}">
                    <div class="podium-medal medal-${idx + 1}">${msIcon('military_tech', true)}</div>
                    <div class="podium-name">${esc(m.name)}</div>
                    <div class="podium-group">${esc(m.paceGroup)}</div>
                    <div class="podium-metric">${esc(metric)}</div>
                </div>
            `;
        }).join('');

        listEl.innerHTML = sorted.map((m, idx) => {
            const metric = formatMetric(m);
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
        const isStaff = E.isStaff();
        const me = E.getCurrentMember();
        const feedSec = document.getElementById('subview-feed');
        const noticeSec = document.getElementById('subview-notices');
        if (feedSec) feedSec.style.display = 'flex';
        if (noticeSec) noticeSec.style.display = 'flex';

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
                                <span>${msIcon('straighten')} <span><strong>${esc(f.distance)}km</strong> 완주</span></span>
                                <span>${msIcon('timer')} <span>평균 페이스 <strong>${esc(f.pace)}</strong></span></span>
                            </div>
                            ${f.text ? `<p class="feed-text">${esc(f.text)}</p>` : ''}
                            ${f.photoDataUrl && String(f.photoDataUrl).startsWith('data:image/') ? `<div class="feed-photo-wrap"><img class="feed-photo-img" src="${esc(f.photoDataUrl)}" alt="오운완 인증샷"></div>` : ''}
                            <div class="feed-actions">
                                <button type="button" class="clap-btn ${clapped ? 'on' : ''}" onclick="window.YJAllInOneUI.toggleClap('${esc(f.id)}')">${msIcon('thumb_up', clapped)} 응원 박수 ${f.claps || 0}</button>
                                <button type="button" class="${activeFeedCommentId === f.id ? 'btn-soft-mint' : 'btn-soft'}" style="flex:0 0 auto;" aria-expanded="${activeFeedCommentId === f.id ? 'true' : 'false'}" onclick="window.YJAllInOneUI.toggleCommentBox('${esc(f.id)}')">${msIcon('chat_bubble', activeFeedCommentId === f.id)} 댓글 ${(f.comments || []).length}</button>
                            </div>
                            ${activeFeedCommentId === f.id ? `
                                ${commentsHtml ? `<div class="feed-comments-box">${commentsHtml}</div>` : ''}
                                ${activeCommentEmojiFeedId === f.id ? `
                                    <div class="emoji-picker-tray">
                                        ${CREW_EMOJIS.map(em => `<button type="button" class="emoji-pick-btn" onclick="window.YJAllInOneUI.insertCommentEmoji('${esc(f.id)}', '${em}')">${em}</button>`).join('')}
                                    </div>
                                ` : ''}
                                <form class="feed-comment-form" onsubmit="window.YJAllInOneUI.submitFeedComment(event, '${esc(f.id)}')">
                                    <button type="button" class="emoji-toggle-btn ${activeCommentEmojiFeedId === f.id ? 'active' : ''}" aria-label="이모티콘 모음" onclick="window.YJAllInOneUI.toggleCommentEmojiTray('${esc(f.id)}')">${msIcon('mood')}</button>
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
                                    ${n.pinned ? `<span class="pill pill-orange">${msIcon('push_pin', true)} 필독 고정</span>` : ''}
                                    <span class="pill pill-slate">${esc(n.category)}</span>
                                </div>
                                ${isStaff ? `
                                    <div class="card-head-right">
                                        <button type="button" class="icon-btn" title="상단 고정" aria-label="상단 고정" onclick="window.YJAllInOneUI.togglePinNotice('${esc(n.id)}')">${msIcon('push_pin', n.pinned)}</button>
                                        <button type="button" class="icon-btn" title="수정" aria-label="공지 수정" onclick="window.YJAllInOneUI.openNoticeModal('${esc(n.id)}')">${msIcon('edit')}</button>
                                        <button type="button" class="icon-btn" title="삭제" aria-label="공지 삭제" onclick="window.YJAllInOneUI.deleteNotice('${esc(n.id)}')">${msIcon('delete')}</button>
                                    </div>
                                ` : ''}
                            </div>
                            <h3 class="card-title">${esc(n.title)}</h3>
                            <p class="notice-text">${esc(n.content).replace(/\n/g, '<br>')}</p>
                            <div class="notice-meta-row">
                                <span>${esc(n.author)} · ${esc(n.createdAt)}</span>
                                <span class="read-counter">${msIcon('visibility')} ${readCount}/${totalMembers}명 확인</span>
                            </div>
                            <div class="card-action-row">
                                <button type="button" class="${iRead ? 'btn-soft-mint' : 'btn-soft'}" onclick="window.YJAllInOneUI.toggleReadNotice('${esc(n.id)}')">
                                    ${iRead ? `${msIcon('check_circle', true)} 확인됨` : `${msIcon('visibility')} 공지 읽음 확인`}
                                </button>
                                ${isStaff ? `<button type="button" class="btn-soft-primary" onclick="window.YJAllInOneUI.shareNoticeToChat('${esc(n.id)}')">${msIcon('chat_bubble')} 채팅방 띄우기</button>` : ''}
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
        const nextId = activeFeedCommentId === feedId ? null : feedId;
        activeFeedCommentId = nextId;
        if (!nextId) activeCommentEmojiFeedId = null;
        renderFeedAndNotices();
        if (activeFeedCommentId) {
            const inp = document.getElementById(`comment-input-${feedId}`);
            if (inp) inp.focus();
        }
    }

    function toggleCommentEmojiTray(feedId) {
        activeCommentEmojiFeedId = activeCommentEmojiFeedId === feedId ? null : feedId;
        renderFeedAndNotices();
        const inp = document.getElementById(`comment-input-${feedId}`);
        if (inp) inp.focus();
    }

    function insertCommentEmoji(feedId, emoji) {
        const inp = document.getElementById(`comment-input-${feedId}`);
        if (!inp) return;
        inp.value += emoji;
        inp.focus();
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

    function compressImageFile(file, onDone) {
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
                onDone(canvas.toDataURL('image/jpeg', 0.78));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    function handleFeedPhotoFile(file) {
        compressImageFile(file, dataUrl => {
            pendingFeedPhotoDataUrl = dataUrl;
            const prevImg = document.getElementById('feed-photo-preview');
            const prevWrap = document.getElementById('feed-photo-preview-wrap');
            if (prevImg) prevImg.src = pendingFeedPhotoDataUrl;
            if (prevWrap) prevWrap.classList.add('show');
        });
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
        const me = E.getCurrentMember();
        const isStaff = E.isStaff();
        if (!pinBanner || !stream || !me) return;

        if (staffRoomBtn) staffRoomBtn.style.display = isStaff ? 'inline-flex' : 'none';

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
                    <span class="pinned-strip-arrow">보기 ${msIcon('chevron_right')}</span>
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
                            <div class="embed-label">${msIcon('calendar_month')} 러닝 일정 카드</div>
                            <div class="embed-title">${esc(s.title)}</div>
                            <div class="embed-meta">${esc(E.formatKoreanDate(s.date))} ${esc(s.time)} · ${esc(s.location)} (${s.distance}km)</div>
                            <button type="button" class="embed-btn" onclick="window.YJAllInOneUI.toggleJoinSchedule('${esc(s.id)}')">
                                ${isJoined ? `${msIcon('check_circle', true)} 참석 완료` : `${msIcon('how_to_reg')} 바로 참석 신청`} (${s.attendees.length}명)
                            </button>
                        </div>
                    `;
                }
            } else if (msg.cardType === 'notice' && msg.cardRefId) {
                const n = E.shared.notices.find(x => x.id === msg.cardRefId);
                if (n) {
                    cardHtml = `
                        <div class="chat-embed-card notice">
                            <div class="embed-label">${msIcon('campaign')} 크루 공지 카드</div>
                            <div class="embed-title">${esc(n.title)}</div>
                            <button type="button" class="embed-btn" onclick="window.YJAllInOneUI.openNoticesSubTab()">공지 전문 보기</button>
                        </div>
                    `;
                }
            }

            const photoHtml = msg.photoDataUrl && String(msg.photoDataUrl).startsWith('data:image/')
                ? `<img class="chat-photo-img" src="${esc(msg.photoDataUrl)}" alt="채팅 첨부 이미지">`
                : '';

            if (isMine) {
                return `
                    <div class="chat-row mine">
                        <div class="chat-bubble-wrap">
                            <div class="chat-bubble">
                                ${msg.text ? `<div class="chat-text">${esc(msg.text).replace(/\n/g, '<br>')}</div>` : ''}
                                ${photoHtml}
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
                                ${msg.text ? `<div class="chat-text">${esc(msg.text).replace(/\n/g, '<br>')}</div>` : ''}
                                ${photoHtml}
                                ${cardHtml}
                            </div>
                            <span class="chat-time">${esc(msg.time)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function toggleChatAttachTray(forceState) {
        isChatAttachOpen = typeof forceState === 'boolean' ? forceState : !isChatAttachOpen;
        if (isChatAttachOpen) isChatEmojiOpen = false;
        syncChatTrays();
    }

    function toggleChatEmojiTray(forceState) {
        isChatEmojiOpen = typeof forceState === 'boolean' ? forceState : !isChatEmojiOpen;
        if (isChatEmojiOpen) isChatAttachOpen = false;
        syncChatTrays();
    }

    function syncChatTrays() {
        document.getElementById('chat-attach-tray')?.classList.toggle('open', isChatAttachOpen);
        document.getElementById('chat-plus-btn')?.classList.toggle('active', isChatAttachOpen);
        document.getElementById('chat-emoji-tray')?.classList.toggle('open', isChatEmojiOpen);
        document.getElementById('chat-emoji-btn')?.classList.toggle('active', isChatEmojiOpen);
    }

    function insertChatEmoji(emoji) {
        const input = document.getElementById('chat-message-input');
        if (!input) return;
        input.value += emoji;
        input.focus();
    }

    function clearChatPhoto() {
        pendingChatPhotoDataUrl = '';
        const cam = document.getElementById('chat-photo-camera');
        const gal = document.getElementById('chat-photo-gallery');
        const bar = document.getElementById('chat-photo-preview-bar');
        const img = document.getElementById('chat-photo-preview');
        if (cam) cam.value = '';
        if (gal) gal.value = '';
        if (img) img.src = '';
        if (bar) bar.classList.remove('show');
    }

    function handleChatPhotoFile(file) {
        compressImageFile(file, dataUrl => {
            pendingChatPhotoDataUrl = dataUrl;
            const img = document.getElementById('chat-photo-preview');
            const bar = document.getElementById('chat-photo-preview-bar');
            if (img) img.src = pendingChatPhotoDataUrl;
            if (bar) bar.classList.add('show');
            toggleChatAttachTray(false);
        });
    }

    function sendChatMessage(textOverride, cardType, cardRefId) {
        const me = E.getCurrentMember();
        const input = document.getElementById('chat-message-input');
        const text = typeof textOverride === 'string' ? textOverride : (input ? input.value.trim() : '');
        const hasPhoto = typeof textOverride !== 'string' && Boolean(pendingChatPhotoDataUrl);
        if (!me || (!text && !cardType && !hasPhoto)) return;

        E.shared.chats.push({
            id: 'c_' + Date.now(),
            room: E.extra.activeChatRoom,
            senderId: me.id,
            senderName: me.name,
            senderRole: me.role,
            text,
            photoDataUrl: hasPhoto ? pendingChatPhotoDataUrl : null,
            time: E.getCurrentTimeLabel(),
            cardType: cardType || null,
            cardRefId: cardRefId || null
        });
        if (input && typeof textOverride !== 'string') input.value = '';
        if (hasPhoto) clearChatPhoto();
        isChatAttachOpen = false;
        isChatEmojiOpen = false;
        syncChatTrays();
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
                        <button type="button" class="toggle-chip mint ${isChk ? 'on' : ''}" onclick="window.YJAllInOneUI.toggleCheckIn('${esc(s.id)}','${esc(m.id)}')">${isChk ? `${msIcon('check', true)} 출석` : '출석체크'}</button>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('att-complete-btn').innerHTML = s.completed ? `${msIcon('check_circle', true)} 완료됨 (다시 열기)` : `${msIcon('flag')} 이번 러닝 완료 처리`;
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

    function getScheduleQrPin(s) {
        const str = `${s.id || ''}_${s.date || ''}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash * 31) + str.charCodeAt(i)) | 0;
        }
        return String(Math.abs(hash) % 9000 + 1000);
    }

    function buildQrSvg(seedText) {
        const size = 21;
        const cells = Array.from({ length: size }, () => Array(size).fill(false));
        const markFinder = (r0, c0) => {
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    const border = r === 0 || r === 6 || c === 0 || c === 6;
                    const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    cells[r0 + r][c0 + c] = border || inner;
                }
            }
        };
        markFinder(0, 0);
        markFinder(0, size - 7);
        markFinder(size - 7, 0);

        let seed = 2166136261;
        for (let i = 0; i < seedText.length; i++) {
            seed ^= seedText.charCodeAt(i);
            seed = Math.imul(seed, 16777619);
        }
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const inTopLeft = r < 8 && c < 8;
                const inTopRight = r < 8 && c >= size - 8;
                const inBotLeft = r >= size - 8 && c < 8;
                if (inTopLeft || inTopRight || inBotLeft) continue;
                seed ^= (r * 37 + c * 17);
                seed = Math.imul(seed, 16777619);
                cells[r][c] = (seed >>> 0) % 2 === 0;
            }
        }
        let rects = '';
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (cells[r][c]) {
                    rects += `<rect x="${c * 8}" y="${r * 8}" width="8" height="8" rx="1"/>`;
                }
            }
        }
        return `<svg width="168" height="168" viewBox="0 0 ${size * 8} ${size * 8}" fill="#202124" aria-label="현장 출석 QR 코드">${rects}</svg>`;
    }

    function openQrShowModal(scheduleId) {
        const sid = scheduleId || activeAttendanceScheduleId;
        const s = E.shared.schedules.find(x => x.id === sid);
        const body = document.getElementById('qr-show-modal-body');
        if (!s || !body) return;
        const pin = getScheduleQrPin(s);
        const svg = buildQrSvg(`${s.id}_${pin}`);
        body.innerHTML = `
            <div class="qr-box-card">
                <strong style="font-size:15px;">${esc(s.title)}</strong>
                <span class="muted-xs">${esc(E.formatKoreanDate(s.date))} ${esc(s.time)} · ${esc(s.location)}</span>
                <div class="qr-svg-wrap">${svg}</div>
                <span class="muted-xs">카메라 스캔이 어려울 때 아래 4자리 번호 안내</span>
                <div class="qr-pin-badge">${pin}</div>
                <span class="muted-xs">현재 현장 출석 완료: <strong>${(s.checkedIn || []).length}명</strong></span>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-modal-submit" data-close-modal="qr-show-modal" onclick="document.getElementById('qr-show-modal').classList.remove('open')">닫기</button>
            </div>
        `;
        openModal('qr-show-modal');
    }

    function openQrCheckinModal(scheduleId) {
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        const body = document.getElementById('qr-checkin-modal-body');
        if (!s || !body) return;
        body.innerHTML = `
            <div class="qr-box-card">
                <strong style="font-size:15px;">${esc(s.title)}</strong>
                <span class="muted-xs">${esc(s.location)} 현장에서 QR을 찍거나 4자리 번호를 입력하세요</span>
                <button type="button" class="btn-soft-primary" style="width:100%;" onclick="window.YJAllInOneUI.startQrCameraScan('${esc(s.id)}')">
                    ${msIcon('photo_camera')} 카메라로 QR 스캔하기
                </button>
                <button type="button" class="btn-soft" style="width:100%;" onclick="window.YJAllInOneUI.completeQrCheckinNow('${esc(s.id)}')">
                    ${msIcon('qr_code_scanner')} 현장 QR 스캔 즉시 체험하기
                </button>
            </div>
            <form onsubmit="window.YJAllInOneUI.submitQrPinCheckin(event, '${esc(s.id)}')" style="display:flex; flex-direction:column; gap:8px;">
                <div class="form-field">
                    <label for="qr-checkin-pin-input">현장 4자리 확인 번호 입력</label>
                    <input id="qr-checkin-pin-input" type="text" inputmode="numeric" maxlength="4" class="qr-pin-input" placeholder="0000" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modal-cancel" onclick="document.getElementById('qr-checkin-modal').classList.remove('open')">취소</button>
                    <button type="submit" class="btn-modal-submit">출석 확인</button>
                </div>
            </form>
        `;
        openModal('qr-checkin-modal');
    }

    function completeQrCheckinNow(scheduleId) {
        const me = E.getCurrentMember();
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        if (!me || !s) return;
        if (!(s.checkedIn || []).includes(me.id)) {
            toggleCheckIn(scheduleId, me.id);
        }
        closeModal('qr-checkin-modal');
        if (typeof window.confetti === 'function') window.confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
        showToast(`'${s.title}' 현장 QR 출석 완료!`, 'ok');
    }

    function submitQrPinCheckin(ev, scheduleId) {
        ev.preventDefault();
        const s = E.shared.schedules.find(x => x.id === scheduleId);
        const inp = document.getElementById('qr-checkin-pin-input');
        if (!s || !inp) return;
        const entered = inp.value.trim();
        const expected = getScheduleQrPin(s);
        if (entered !== expected) {
            showToast('현장 번호가 일치하지 않습니다. 크루장에게 번호를 확인해 주세요.', 'warn');
            inp.focus();
            return;
        }
        completeQrCheckinNow(scheduleId);
    }

    function startQrCameraScan(scheduleId) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('현재 화면에서는 카메라를 연결할 수 없어 아래 체험 버튼이나 4자리 번호를 이용해 주세요.', 'warn');
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                stream.getTracks().forEach(t => t.stop());
                showToast('카메라 연결 확인! 아래 4자리 번호 또는 스캔 체험으로 출석하세요.', 'ok');
            })
            .catch(() => {
                showToast('카메라 권한이 없어 4자리 번호 입력 또는 스캔 체험을 이용해 주세요.', 'warn');
            });
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
        const staffCount = members.filter(m => m.role === '크루장' || m.role === '운영진').length;
        const totalDist = Math.round(members.reduce((sum, m) => sum + (Number(m.totalDistance) || 0), 0));

        statsEl.innerHTML = `
            <div class="stat-box"><span class="stat-label">총 크루원</span><strong class="stat-value">${members.length}명</strong></div>
            <div class="stat-box"><span class="stat-label">운영진</span><strong class="stat-value">${staffCount}명</strong></div>
            <div class="stat-box"><span class="stat-label">총 누적 거리</span><strong class="stat-value">${totalDist}km</strong></div>
        `;

        const q = memberQuery.trim().toLowerCase();
        const filtered = members.filter(m => {
            if (['A조', 'B조', 'C조'].includes(memberFilter) && m.paceGroup !== memberFilter) return false;
            if (q && !`${m.name} ${m.role} ${m.memo || ''} ${m.pace}`.toLowerCase().includes(q)) return false;
            return true;
        });

        listEl.innerHTML = filtered.length ? filtered.map(m => {
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
                    </div>
                    <div class="card-action-row">
                        <button type="button" class="btn-soft" onclick="window.YJAllInOneUI.openMemberModal('${esc(m.id)}')">${msIcon('edit')} 수정</button>
                        <button type="button" class="btn-soft-danger" onclick="window.YJAllInOneUI.deleteMember('${esc(m.id)}')">${msIcon('delete')} 삭제</button>
                    </div>
                </div>
            `;
        }).join('') : '<div class="empty-card">조건에 맞는 크루원이 없습니다.</div>';
    }

    function openAdminSection(filterKey) {
        memberFilter = filterKey || 'all';
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.toggle('active', b.dataset.filter === memberFilter));
        openAdminModal();
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
            document.getElementById('mem-memo').value = m.memo || '';
        } else {
            titleEl.textContent = '신규 크루원 등록';
            document.getElementById('mem-name').value = '';
            document.getElementById('mem-role').value = '신입';
            document.getElementById('mem-pace').value = "5'30\"";
            document.getElementById('mem-memo').value = '';
        }
        openModal('member-modal');
    }

    function saveMemberForm(ev) {
        ev.preventDefault();
        const name = document.getElementById('mem-name').value.trim();
        const role = document.getElementById('mem-role').value;
        const pace = document.getElementById('mem-pace').value.trim() || "5'30\"";
        const memo = document.getElementById('mem-memo').value.trim();
        if (!name) return showToast('이름을 입력해 주세요.', 'warn');
        const paceGroup = E.autoPaceGroup(pace);

        if (editingMemberId) {
            const m = E.shared.members.find(x => x.id === editingMemberId);
            if (m) { m.name = name; m.role = role; m.pace = pace; m.paceGroup = paceGroup; m.memo = memo; }
            showToast(`${name}님 정보를 수정했습니다.`, 'ok');
        } else {
            E.shared.members.push({
                id: 'm_' + Date.now(),
                name, role, pace, paceGroup,
                attendanceCount: 0, totalDistance: 0,
                feeStatus: '미납', feePaidDate: '', phoneLast4: '', memo
            });
            E.playSound('success');
            showToast(`${name}님이 ${paceGroup} 크루원으로 등록되었습니다!`, 'ok');
        }
        E.saveShared();
        closeModal('member-modal');
        renderAdminMembers();
        renderAll();
    }

    function getInviteUrl() {
        const code = E.extra.inviteCode || 'HGP-2026';
        const base = window.location.origin + window.location.pathname;
        return `${base}?invite=${encodeURIComponent(code)}`;
    }

    function openInviteModal() {
        const labelEl = document.getElementById('invite-crew-label');
        const codeEl = document.getElementById('invite-code-badge');
        const inputEl = document.getElementById('invite-link-input');
        const sheetEl = document.getElementById('invite-share-sheet');
        if (labelEl) labelEl.textContent = `${E.shared.crewName} 초대`;
        if (codeEl) codeEl.textContent = `코드 ${E.extra.inviteCode || 'HGP-2026'}`;
        if (inputEl) inputEl.value = getInviteUrl();
        if (sheetEl) sheetEl.style.display = 'none';
        openModal('invite-modal');
    }

    function copyInviteLink() {
        const url = getInviteUrl();
        const msg = `[${E.shared.crewName}] 함께 달려요! 아래 초대 링크로 간편하게 크루에 합류하세요.\n${url}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(msg).then(() => {
                E.playSound('success');
                showToast('초대 문구와 링크가 복사되었습니다!', 'ok');
            }).catch(() => {
                const inputEl = document.getElementById('invite-link-input');
                if (inputEl) { inputEl.select(); document.execCommand('copy'); }
                showToast('초대 링크가 복사되었습니다!', 'ok');
            });
        } else {
            const inputEl = document.getElementById('invite-link-input');
            if (inputEl) { inputEl.select(); document.execCommand('copy'); }
            showToast('초대 링크가 복사되었습니다!', 'ok');
        }
    }

    function shareInviteLink() {
        const url = getInviteUrl();
        const text = `[${E.shared.crewName}] 러닝 크루 초대 링크입니다. 함께 달려요!`;
        if (navigator.share) {
            navigator.share({ title: `${E.shared.crewName} 초대`, text, url }).catch(() => {
                const sheetEl = document.getElementById('invite-share-sheet');
                if (sheetEl) sheetEl.style.display = 'flex';
            });
            return;
        }
        const sheetEl = document.getElementById('invite-share-sheet');
        if (sheetEl) {
            sheetEl.style.display = sheetEl.style.display === 'flex' ? 'none' : 'flex';
        }
    }

    function shareInviteVia(channel) {
        const url = getInviteUrl();
        const msg = `[${E.shared.crewName}] 함께 달려요! 아래 초대 링크로 간편하게 크루에 합류하세요.\n${url}`;
        if (channel === 'kakao') {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(msg).catch(() => {});
            }
            window.open(`kakaotalk://`, '_blank');
            showToast('초대 문구를 복사했습니다. 카카오톡 대화방에 바로 붙여넣어 주세요!', 'ok');
            return;
        }
        if (channel === 'sms') {
            window.location.href = `sms:?body=${encodeURIComponent(msg)}`;
            showToast('문자 메시지 앱을 엽니다.', 'ok');
            return;
        }
        if (channel === 'email') {
            const subject = `[${E.shared.crewName}] 러닝 크루 초대장`;
            window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msg)}`;
            showToast('이메일 작성 창을 엽니다.', 'ok');
            return;
        }
        if (channel === 'chat') {
            closeModal('invite-modal');
            closeModal('admin-modal');
            switchTab('chat');
            sendChatMessage(msg);
            showToast('크루 채팅방에 초대 링크를 올렸습니다!', 'ok');
        }
    }

    function regenerateInviteCode() {
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        E.extra.inviteCode = `HGP-${rand}`;
        E.saveExtra();
        openInviteModal();
        showToast(`새 초대 코드(${E.extra.inviteCode})가 발급되었습니다.`, 'ok');
    }

    function openJoinInviteModal() {
        closeModal('invite-modal');
        const titleEl = document.getElementById('join-invite-title');
        const descEl = document.getElementById('join-invite-desc');
        if (titleEl) titleEl.textContent = `${E.shared.crewName} 합류하기`;
        if (descEl) descEl.textContent = `초대 링크로 오셨습니다! 이름과 주력 페이스를 입력하면 바로 크루원으로 합류합니다.`;
        const nameEl = document.getElementById('join-name');
        const paceEl = document.getElementById('join-pace');
        const memoEl = document.getElementById('join-memo');
        if (nameEl) nameEl.value = '';
        if (paceEl) paceEl.value = "5'30\"";
        if (memoEl) memoEl.value = '';
        openModal('join-invite-modal');
    }

    function submitJoinInviteForm(ev) {
        ev.preventDefault();
        const name = document.getElementById('join-name')?.value.trim();
        const pace = document.getElementById('join-pace')?.value.trim() || "5'30\"";
        const memo = document.getElementById('join-memo')?.value.trim() || '';
        if (!name) return showToast('이름을 입력해 주세요.', 'warn');
        const paceGroup = E.autoPaceGroup(pace);
        const newMember = {
            id: 'm_' + Date.now(),
            name, role: '신입', pace, paceGroup,
            attendanceCount: 0, totalDistance: 0,
            feeStatus: '미납', feePaidDate: '', phoneLast4: '', memo
        };
        E.shared.members.push(newMember);
        E.saveShared();
        E.playSound('success');
        closeModal('join-invite-modal');
        renderAdminMembers();
        renderAll();
        showToast(`${name}님, ${E.shared.crewName} 합류를 환영합니다!`, 'ok');
    }

    function cycleFeeStatus(id) {
        const m = E.shared.members.find(x => x.id === id);
        if (!m) return;
        const order = ['완납', '미납', '면제'];
        m.feeStatus = order[(order.indexOf(m.feeStatus) + 1) % order.length];
        if (m.feeStatus === '완납' && !m.feePaidDate) {
            m.feePaidDate = E.extra.feeDueDate || new Date().toISOString().slice(0, 10);
        } else if (m.feeStatus !== '완납') {
            m.feePaidDate = '';
        }
        E.playSound('tap');
        E.saveShared();
        renderFeeModal();
        renderAll();
        showToast(`${m.name}님 회비 → ${m.feeStatus}`);
    }

    function openFeeModal() {
        isFeeCalendarMode = false;
        const due = E.extra.feeDueDate || new Date().toISOString().slice(0, 10);
        const parts = due.split('-');
        if (parts.length === 3) {
            feeCalYear = Number(parts[0]) || 2026;
            feeCalMonth = Math.max(0, Math.min(11, (Number(parts[1]) || 11) - 1));
        }
        selectedFeeCalDate = '';
        const amtEl = document.getElementById('fee-amount-input');
        const dateEl = document.getElementById('fee-due-date-input');
        if (amtEl) amtEl.value = E.extra.monthlyFeeAmount ?? 20000;
        if (dateEl) dateEl.value = due;
        renderFeeModal();
        openModal('fee-modal');
    }

    function toggleFeeCalendarView(forceCal) {
        isFeeCalendarMode = typeof forceCal === 'boolean' ? forceCal : !isFeeCalendarMode;
        renderFeeModal();
    }

    function shiftFeeCalendarMonth(delta) {
        feeCalMonth += delta;
        if (feeCalMonth < 0) { feeCalMonth = 11; feeCalYear -= 1; }
        if (feeCalMonth > 11) { feeCalMonth = 0; feeCalYear += 1; }
        selectedFeeCalDate = '';
        renderFeeCalendar();
    }

    function selectFeeCalendarDay(dateStr) {
        selectedFeeCalDate = dateStr;
        renderFeeCalendar();
    }

    function updateMemberFeeDate(memberId, dateStr) {
        const m = E.shared.members.find(x => x.id === memberId);
        if (!m) return;
        m.feePaidDate = dateStr || '';
        if (dateStr) m.feeStatus = '완납';
        E.saveShared();
        renderFeeModal();
        renderAll();
        showToast(`${m.name}님 납부일 ${dateStr ? dateStr + ' 저장' : '초기화'}`);
    }

    function saveFeeSettings(ev) {
        ev.preventDefault();
        const amtEl = document.getElementById('fee-amount-input');
        const dateEl = document.getElementById('fee-due-date-input');
        E.extra.monthlyFeeAmount = Math.max(0, Number(amtEl?.value) || 0);
        E.extra.feeDueDate = dateEl?.value || '2026-11-05';
        const parts = E.extra.feeDueDate.split('-');
        if (parts.length === 3) {
            feeCalYear = Number(parts[0]) || feeCalYear;
            feeCalMonth = Math.max(0, Math.min(11, (Number(parts[1]) || 11) - 1));
        }
        E.saveExtra();
        E.playSound('success');
        renderFeeModal();
        showToast(`회비 설정(${E.extra.monthlyFeeAmount.toLocaleString()}원 · ${E.extra.feeDueDate})이 저장되었습니다.`, 'ok');
    }

    function renderFeeModal() {
        const settingsView = document.getElementById('fee-settings-view');
        const calView = document.getElementById('fee-calendar-view');
        const toggleBtn = document.getElementById('fee-calendar-toggle-btn');
        if (!settingsView || !calView) return;

        settingsView.style.display = isFeeCalendarMode ? 'none' : 'flex';
        calView.style.display = isFeeCalendarMode ? 'flex' : 'none';
        if (toggleBtn) {
            toggleBtn.innerHTML = isFeeCalendarMode
                ? `${msIcon('tune')} 회비 설정`
                : `${msIcon('calendar_month')} 달력 보기`;
        }

        if (isFeeCalendarMode) {
            renderFeeCalendar();
            return;
        }

        const members = E.shared.members;
        const paidTargets = members.filter(m => m.feeStatus !== '면제');
        const paidCount = paidTargets.filter(m => m.feeStatus === '완납').length;
        const feeRate = paidTargets.length ? Math.round((paidCount / paidTargets.length) * 100) : 100;
        const unpaidCount = paidTargets.filter(m => m.feeStatus === '미납').length;
        const statsBar = document.getElementById('fee-stats-bar');
        if (statsBar) {
            statsBar.innerHTML = `
                <div class="stat-box"><span class="stat-label">월 회비</span><strong class="stat-value">${Number(E.extra.monthlyFeeAmount || 0).toLocaleString()}원</strong></div>
                <div class="stat-box"><span class="stat-label">완납률</span><strong class="stat-value">${feeRate}%</strong></div>
                <div class="stat-box"><span class="stat-label">미납 인원</span><strong class="stat-value" style="color:#ef4444;">${unpaidCount}명</strong></div>
            `;
        }

        const listEl = document.getElementById('fee-member-list');
        if (listEl) {
            listEl.innerHTML = members.map(m => {
                const feeBadgeClass = m.feeStatus === '완납' ? 'pill-mint' : (m.feeStatus === '미납' ? 'pill-red' : 'pill-slate');
                return `
                    <div class="crew-card">
                        <div class="member-top-row">
                            <div class="member-main">
                                <div class="member-name-row">
                                    <strong>${esc(m.name)}</strong>
                                    <span class="pill pill-slate">${esc(m.role)}</span>
                                </div>
                            </div>
                            <button type="button" class="pill-btn ${feeBadgeClass}" onclick="window.YJAllInOneUI.cycleFeeStatus('${esc(m.id)}')">회비 ${esc(m.feeStatus)}</button>
                        </div>
                        <div class="fee-date-row">
                            <span class="muted-xs">납부 날짜</span>
                            <input type="date" class="fee-date-input" value="${esc(m.feePaidDate || '')}" onchange="window.YJAllInOneUI.updateMemberFeeDate('${esc(m.id)}', this.value)">
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function renderFeeCalendar() {
        const calEl = document.getElementById('fee-calendar-container');
        const detailEl = document.getElementById('fee-calendar-day-detail');
        if (!calEl || !detailEl) return;

        const firstDay = new Date(feeCalYear, feeCalMonth, 1).getDay();
        const daysInMonth = new Date(feeCalYear, feeCalMonth + 1, 0).getDate();
        const monthStr = `${feeCalYear}-${String(feeCalMonth + 1).padStart(2, '0')}`;
        const dueDate = E.extra.feeDueDate || '';

        const paidByDate = {};
        E.shared.members.forEach(m => {
            if (m.feeStatus === '완납' && m.feePaidDate && m.feePaidDate.startsWith(monthStr)) {
                if (!paidByDate[m.feePaidDate]) paidByDate[m.feePaidDate] = [];
                paidByDate[m.feePaidDate].push(m);
            }
        });

        let cellsHtml = '';
        for (let i = 0; i < firstDay; i++) {
            cellsHtml += '<div class="fee-cal-cell is-empty"></div>';
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${monthStr}-${String(d).padStart(2, '0')}`;
            const paidMembers = paidByDate[dateStr] || [];
            const isDue = dueDate === dateStr;
            const isSelected = selectedFeeCalDate === dateStr;
            const chips = paidMembers.slice(0, 2).map(m => `<span class="fee-cal-chip">${esc(m.name)}</span>`).join('');
            const more = paidMembers.length > 2 ? `<span class="fee-cal-chip">+${paidMembers.length - 2}명</span>` : '';
            cellsHtml += `
                <button type="button" class="fee-cal-cell ${isDue ? 'is-due' : ''} ${isSelected ? 'is-selected' : ''}" onclick="window.YJAllInOneUI.selectFeeCalendarDay('${dateStr}')">
                    <div class="fee-cal-day-num"><span>${d}</span>${isDue ? '<span class="fee-cal-due-dot" title="정기 납부일"></span>' : ''}</div>
                    ${chips}${more}
                </button>
            `;
        }

        calEl.innerHTML = `
            <div class="crew-card">
                <div class="fee-cal-header">
                    <button type="button" class="icon-btn" aria-label="이전 달" onclick="window.YJAllInOneUI.shiftFeeCalendarMonth(-1)">${msIcon('chevron_left')}</button>
                    <span class="fee-cal-month">${feeCalYear}년 ${feeCalMonth + 1}월</span>
                    <button type="button" class="icon-btn" aria-label="다음 달" onclick="window.YJAllInOneUI.shiftFeeCalendarMonth(1)">${msIcon('chevron_right')}</button>
                </div>
                <div class="fee-cal-weekdays"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>
                <div class="fee-cal-grid">${cellsHtml}</div>
                <div class="muted-xs" style="margin-top:6px;">파란 점은 정기 납부일(${esc(dueDate || '미지정')}) · 날짜를 누르면 상세 납부 내역을 확인합니다.</div>
            </div>
        `;

        if (selectedFeeCalDate) {
            const list = paidByDate[selectedFeeCalDate] || [];
            detailEl.innerHTML = `
                <div class="crew-card">
                    <strong style="font-size:13.5px;">${esc(selectedFeeCalDate)} 납부 회원 (${list.length}명)</strong>
                    ${list.length
                        ? `<div class="pill-group">${list.map(m => `<span class="pill pill-mint">${esc(m.name)} · ${Number(E.extra.monthlyFeeAmount || 0).toLocaleString()}원</span>`).join('')}</div>`
                        : '<span class="muted-xs">이 날짜에 납부 기록된 회원이 없습니다.</span>'}
                </div>
            `;
        } else {
            const monthPaidTotal = Object.values(paidByDate).reduce((s, arr) => s + arr.length, 0);
            detailEl.innerHTML = `
                <div class="crew-card">
                    <span class="muted-xs">${feeCalYear}년 ${feeCalMonth + 1}월 달력 내 납부 완료: <strong>${monthPaidTotal}명</strong> (날짜를 누르면 해당일 납부 회원을 볼 수 있습니다.)</span>
                </div>
            `;
        }
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
    function openMyInfoModal() {
        const me = E.getCurrentMember();
        const body = document.getElementById('my-info-modal-body');
        if (!me || !body) return;
        const feeClass = me.feeStatus === '완납' ? 'pill-mint' : (me.feeStatus === '미납' ? 'pill-red' : 'pill-slate');
        body.innerHTML = `
            <div class="stats-bar">
                <div class="stat-box"><span class="stat-label">소속 조</span><strong class="stat-value">${esc(me.paceGroup)}</strong></div>
                <div class="stat-box"><span class="stat-label">출석 도장</span><strong class="stat-value">${me.attendanceCount || 0}회</strong></div>
                <div class="stat-box"><span class="stat-label">누적 거리</span><strong class="stat-value">${me.totalDistance || 0}km</strong></div>
            </div>
            <div class="notice-meta-row" style="padding:2px 2px;">
                <span>현재 역할: <strong>${esc(me.role)}</strong></span>
                <span class="pill ${feeClass}">회비 ${esc(me.feeStatus)}</span>
            </div>
            <form onsubmit="window.YJAllInOneUI.saveMyInfoForm(event)" style="display:flex; flex-direction:column; gap:10px;">
                <div class="form-row-2">
                    <div class="form-field">
                        <label for="myinfo-name">이름</label>
                        <input id="myinfo-name" type="text" value="${esc(me.name)}" required>
                    </div>
                    <div class="form-field">
                        <label for="myinfo-pace">주력 페이스</label>
                        <input id="myinfo-pace" type="text" value="${esc(me.pace)}">
                    </div>
                </div>
                <div class="form-field">
                    <label for="myinfo-memo">내 러닝 메모</label>
                    <textarea id="myinfo-memo" rows="2" placeholder="목표나 특이사항을 적어두세요">${esc(me.memo || '')}</textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modal-cancel" onclick="document.getElementById('my-info-modal').classList.remove('open')">닫기</button>
                    <button type="submit" class="btn-modal-submit">내 정보 저장</button>
                </div>
            </form>
        `;
        openModal('my-info-modal');
    }

    function saveMyInfoForm(ev) {
        ev.preventDefault();
        const me = E.getCurrentMember();
        if (!me) return;
        const name = document.getElementById('myinfo-name')?.value.trim();
        const pace = normalizePaceInput(document.getElementById('myinfo-pace')?.value, me.pace);
        const memo = document.getElementById('myinfo-memo')?.value.trim() || '';
        if (!name) return;
        me.name = name;
        me.pace = pace;
        me.paceGroup = E.computePaceGroup(pace);
        me.memo = memo;
        E.playSound('success');
        E.saveShared();
        closeModal('my-info-modal');
        renderAll();
        showToast('내 정보가 저장되었습니다!', 'ok');
    }

    function openAppSettingsModal() {
        const body = document.getElementById('app-settings-modal-body');
        if (!body) return;
        const isMuted = Boolean(E.extra.soundMuted);
        const goal = Math.max(10, Number(E.extra.monthlyGoalKm) || 50);
        body.innerHTML = `
            <form onsubmit="window.YJAllInOneUI.saveAppSettingsForm(event)" style="display:flex; flex-direction:column; gap:12px;">
                <div class="form-field">
                    <label for="appset-goal-km">내 이달 목표 거리 (km)</label>
                    <input id="appset-goal-km" type="number" min="10" max="500" value="${goal}" required>
                </div>
                <label class="checkbox-row" style="padding:6px 2px;">
                    <input id="appset-sound-on" type="checkbox" ${!isMuted ? 'checked' : ''}>
                    <span>버튼 및 알림 효과음 켜기</span>
                </label>
                <div class="modal-footer">
                    <button type="button" class="btn-modal-cancel" onclick="document.getElementById('app-settings-modal').classList.remove('open')">취소</button>
                    <button type="submit" class="btn-modal-submit">설정 저장</button>
                </div>
            </form>
            <div class="settings-legal-footer" aria-label="서비스 안내 및 약관">
                <button type="button" class="settings-legal-btn" onclick="window.YJAllInOneUI.openInfoDocModal('terms')">이용약관</button>
                <span class="settings-legal-sep" aria-hidden="true">|</span>
                <button type="button" class="settings-legal-btn" onclick="window.YJAllInOneUI.openInfoDocModal('privacy')">개인정보처리방침</button>
                <span class="settings-legal-sep" aria-hidden="true">|</span>
                <button type="button" class="settings-legal-btn" onclick="window.YJAllInOneUI.openInfoDocModal('guide')">이용방법</button>
            </div>
        `;
        openModal('app-settings-modal');
    }

    const INFO_DOC_MOCKUPS = {
        terms: {
            title: '이용약관',
            icon: 'gavel',
            updated: '2026.11.23 (목업)',
            sections: [
                {
                    heading: '제1조 (목적)',
                    body: '본 약관은 러닝 크루 올인원(이하 "서비스")이 제공하는 크루 일정 관리, 현장 출석, 기록 공유 및 크루 소통 기능의 이용 조건과 절차를 안내합니다.'
                },
                {
                    heading: '제2조 (크루 활동 및 안전 수칙)',
                    body: '모든 회원은 정기런 및 번개런 참여 시 현장 운영진의 안전 안내를 준수하며, 야간 러닝 시 반사밴드 등 안전 장비를 권장합니다.'
                },
                {
                    heading: '제3조 (서비스 운영 안내)',
                    body: '본 문서는 정식 출시 전 확인용 목업 화면이며, 실제 크루 운영 정책에 맞춰 추후 정식 약관으로 업데이트됩니다.'
                }
            ]
        },
        privacy: {
            title: '개인정보처리방침',
            icon: 'verified_user',
            updated: '2026.11.23 (목업)',
            sections: [
                {
                    heading: '1. 수집 및 이용 항목',
                    body: '크루 활동 관리를 위해 이름, 연락처(선택), 페이스 그룹, 출석 횟수 및 누적 러닝 거리 정보를 활용합니다.'
                },
                {
                    heading: '2. 보관 및 보호',
                    body: '현재 미리보기 버전에서는 모든 정보가 외부 서버로 전송되지 않고 사용 중인 브라우저 기기 내부에만 안전하게 저장됩니다.'
                },
                {
                    heading: '3. 문의 및 변경',
                    body: '내 정보 수정 및 데이터 초기화는 좌측 메뉴의 "내 정보 관리" 또는 운영진 문의를 통해 언제든 요청하실 수 있습니다.'
                }
            ]
        },
        guide: {
            title: '이용방법',
            icon: 'menu_book',
            updated: '가이드 (목업)',
            listMode: true,
            sections: [
                {
                    heading: '홈 · 일정',
                    items: [
                        '상단 필독 공지를 눌러 크루 중요 안내를 확인할 수 있습니다.',
                        '일정 카드를 누르면 상세 내용, 참석하기, QR 출석하기 버튼이 펼쳐집니다.'
                    ]
                },
                {
                    heading: '현장 QR 출석',
                    items: [
                        '모임 현장에서 "QR 출석하기"를 누른 뒤 운영진이 띄운 QR 코드를 찍거나 4자리 번호를 입력하면 즉시 출석 처리됩니다.'
                    ]
                },
                {
                    heading: '기록 · 랭킹 & 오운완 · 공지 · 크루채팅',
                    items: [
                        '기록·랭킹에서 누적 거리 기준 크루 순위와 출석 횟수를 한눈에 볼 수 있습니다.',
                        '오운완에서 오늘 달린 인증샷과 댓글을 남기고, 공지 탭에서 크루 소식을 확인할 수 있습니다.'
                    ]
                }
            ]
        }
    };

    function openInfoDocModal(docKey) {
        const doc = INFO_DOC_MOCKUPS[docKey] || INFO_DOC_MOCKUPS.guide;
        const titleEl = document.getElementById('info-doc-modal-title');
        const bodyEl = document.getElementById('info-doc-modal-body');
        if (!titleEl || !bodyEl) return;

        titleEl.innerHTML = `${msIcon(doc.icon)} ${esc(doc.title)}`;
        const sectionsHtml = doc.sections.map(sec => {
            if (doc.listMode && Array.isArray(sec.items)) {
                return `
                    <div class="info-doc-section">
                        <h4>${esc(sec.heading)}</h4>
                        <ul>${sec.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
                    </div>
                `;
            }
            return `
                <div class="info-doc-section">
                    <h4>${esc(sec.heading)}</h4>
                    <p>${esc(sec.body)}</p>
                </div>
            `;
        }).join('');

        bodyEl.innerHTML = `
            <div class="info-doc-meta">
                <span class="info-doc-badge">${msIcon('info')} 미리보기 목업</span>
                <span>최종 안내: ${esc(doc.updated)}</span>
            </div>
            <div class="info-doc-content">${sectionsHtml}</div>
            <div class="modal-footer">
                <button type="button" class="btn-modal-submit" onclick="document.getElementById('info-doc-modal').classList.remove('open')">확인</button>
            </div>
        `;
        openModal('info-doc-modal');
    }

    function saveAppSettingsForm(ev) {
        ev.preventDefault();
        const goal = Math.max(10, Number(document.getElementById('appset-goal-km')?.value) || 50);
        const soundOn = Boolean(document.getElementById('appset-sound-on')?.checked);
        E.extra.monthlyGoalKm = goal;
        E.extra.soundMuted = !soundOn;
        E.saveExtra();
        if (soundOn) E.playSound('success');
        closeModal('app-settings-modal');
        renderAll();
        showToast('앱 설정이 저장되었습니다!', 'ok');
    }

    function openMemberSwitchModal() {
        const list = document.getElementById('switch-member-list');
        if (!list) return;
        list.innerHTML = E.shared.members.map(m => {
            const active = m.id === E.extra.currentMemberId;
            const roleTag = (m.role === '크루장' || m.role === '운영진') ? `${msIcon('workspace_premium')} 운영 권한` : `${msIcon('directions_run')} 크루원`;
            return `
                <button type="button" class="switch-member-btn ${active ? 'active' : ''}" onclick="window.YJAllInOneUI.selectMember('${esc(m.id)}')">
                    <div>
                        <strong>${esc(m.name)}</strong>
                        <span class="pill pill-slate">${esc(m.role)} · ${esc(m.paceGroup)}</span>
                    </div>
                    <span>${active ? `${msIcon('check_circle', true)} 현재` : roleTag}</span>
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
                renderAll();
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
        document.getElementById('chat-photo-camera')?.addEventListener('change', e => {
            if (e.target.files && e.target.files[0]) handleChatPhotoFile(e.target.files[0]);
        });
        document.getElementById('chat-photo-gallery')?.addEventListener('change', e => {
            if (e.target.files && e.target.files[0]) handleChatPhotoFile(e.target.files[0]);
        });
        const chatEmojiTray = document.getElementById('chat-emoji-tray');
        if (chatEmojiTray) {
            chatEmojiTray.innerHTML = CREW_EMOJIS.map(em => `<button type="button" class="emoji-pick-btn" onclick="window.YJAllInOneUI.insertChatEmoji('${em}')">${em}</button>`).join('');
        }

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
        document.getElementById('fee-settings-form')?.addEventListener('submit', saveFeeSettings);
        document.getElementById('join-invite-form')?.addEventListener('submit', submitJoinInviteForm);
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

        document.addEventListener('click', ev => {
            if (openScheduleMoreId && !ev.target.closest('.schedule-more-wrap')) {
                closeScheduleMoreMenu();
            }
        });

        const inviteParam = new URLSearchParams(window.location.search).get('invite');
        if (inviteParam) {
            setTimeout(() => openJoinInviteModal(), 150);
        }
    }

    window.YJAllInOneUI = {
        switchTab,
        openDrawer,
        closeDrawer,
        openPinnedNoticeModal,
        openNoticesSubTab: () => { switchTab('notices'); },
        toggleScheduleCard,
        toggleHomeNoticeCard,
        toggleScheduleMoreMenu,
        closeScheduleMoreMenu,
        copyScheduleText,
        togglePinnedNoticeCard,
        toggleJoinSchedule,
        toggleReadNotice,
        toggleLiveRun,
        toggleMetronome,
        setSpm,
        saveMyRunRecord,
        cheerTeammate,
        toggleClap,
        toggleCommentBox,
        toggleCommentEmojiTray,
        insertCommentEmoji,
        submitFeedComment,
        toggleChatAttachTray,
        toggleChatEmojiTray,
        insertChatEmoji,
        clearChatPhoto,
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
        openQrShowModal,
        openQrCheckinModal,
        submitQrPinCheckin,
        completeQrCheckinNow,
        startQrCameraScan,
        toggleAttendee,
        toggleCheckIn,
        completeScheduleRun,
        shareScheduleToChat,
        openNoticeModal,
        togglePinNotice,
        deleteNotice,
        shareNoticeToChat,
        openAdminModal,
        openAdminSection,
        openFeeModal,
        toggleFeeCalendarView,
        shiftFeeCalendarMonth,
        selectFeeCalendarDay,
        updateMemberFeeDate,
        openMemberModal,
        openInviteModal,
        copyInviteLink,
        shareInviteLink,
        shareInviteVia,
        regenerateInviteCode,
        openJoinInviteModal,
        cycleFeeStatus,
        deleteMember,
        resetAllData,
        openMemberSwitchModal,
        openMyInfoModal,
        saveMyInfoForm,
        openAppSettingsModal,
        saveAppSettingsForm,
        openInfoDocModal,
        selectMember
    };

    document.addEventListener('DOMContentLoaded', () => {
        E.load();
        wireEvents();
        switchTab(E.extra.activeTab || 'home');
        E.fetchSeoulWeather(() => updateHeader());
    });
})();
