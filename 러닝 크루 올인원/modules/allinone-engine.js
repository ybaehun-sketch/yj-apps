(function() {
    'use strict';

    const SHARED_CREW_KEY = 'yj_running_crew_manager_v1';
    const MATE_EXTRA_KEY = 'yj_running_crew_mate_extra_v1';

    function getUpcomingDate(offsetDays) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().slice(0, 10);
    }

    function getDefaultSharedState() {
        return {
            crewName: '한강 페이스 러너스',
            leaderName: '김준호 크루장',
            weather: {
                loaded: false,
                city: '서울 반포',
                temp: 14,
                label: '러닝하기 좋은 맑은 날씨',
                icon: '☀️'
            },
            members: [
                { id: 'm1', name: '김준호', role: '크루장', pace: "4'45\"", paceGroup: 'A조', attendanceCount: 28, totalDistance: 214, feeStatus: '면제', feePaidDate: '', phoneLast4: '4821', memo: '정기런 리드 및 A조 페이서 담당' },
                { id: 'm2', name: '박서연', role: '운영진', pace: "5'15\"", paceGroup: 'B조', attendanceCount: 24, totalDistance: 176, feeStatus: '완납', feePaidDate: '2026-11-05', phoneLast4: '9104', memo: '회비 총무 및 B조 스트레칭 진행' },
                { id: 'm3', name: '이도현', role: '정회원', pace: "4'30\"", paceGroup: 'A조', attendanceCount: 19, totalDistance: 162, feeStatus: '완납', feePaidDate: '2026-11-05', phoneLast4: '3372', memo: '하프 마라톤 준비 중' },
                { id: 'm4', name: '최민지', role: '정회원', pace: "5'30\"", paceGroup: 'B조', attendanceCount: 15, totalDistance: 108, feeStatus: '미납', feePaidDate: '', phoneLast4: '7750', memo: '11월 회비 안내 필요, 야간 반사밴드 대여' },
                { id: 'm5', name: '정우성', role: '신입', pace: "6'10\"", paceGroup: 'C조', attendanceCount: 4, totalDistance: 22, feeStatus: '완납', feePaidDate: '2026-11-10', phoneLast4: '6219', memo: '입문 러너, 5km 완주 목표' },
                { id: 'm6', name: '한지우', role: '정회원', pace: "6'00\"", paceGroup: 'C조', attendanceCount: 11, totalDistance: 74, feeStatus: '미납', feePaidDate: '', phoneLast4: '1583', memo: '금요일 번개런 선호' }
            ],
            schedules: [
                {
                    id: 's1',
                    title: '목요 한강 반포 정기런',
                    type: '정기런',
                    date: getUpcomingDate(2),
                    time: '20:00',
                    location: '반포한강공원 달빛광장 편의점 앞',
                    distance: 8,
                    maxCount: 20,
                    courseNote: '반포 → 잠수교 → 이촌 반환 평지 코스 (짐 보관 차량 대기)',
                    attendees: ['m1', 'm2', 'm3', 'm4', 'm5'],
                    checkedIn: ['m1', 'm2'],
                    completed: false
                },
                {
                    id: 's2',
                    title: '주말 아침 남산 업힐 트레이닝',
                    type: '번개런',
                    date: getUpcomingDate(5),
                    time: '07:30',
                    location: '동국대 입구역 6번 출구 앞',
                    distance: 6,
                    maxCount: 15,
                    courseNote: '남산 북측 순환로 왕복 (초보자 도보 병행 가능)',
                    attendees: ['m1', 'm3', 'm6'],
                    checkedIn: [],
                    completed: false
                }
            ],
            notices: [
                {
                    id: 'n1',
                    category: '필독',
                    pinned: true,
                    title: '11월 야간 러닝 안전 수칙 및 반사밴드 착용 안내',
                    content: '일몰이 빨라졌습니다. 목요 정기런 참여 시 밝은 상의 또는 야광 반사밴드를 꼭 착용해 주세요. 미소지 크루원은 출발 전 운영진에게 대여 요청 바랍니다!',
                    author: '김준호 크루장',
                    createdAt: '오늘 09:30',
                    readBy: ['m1', 'm2', 'm3', 'm5']
                },
                {
                    id: 'n2',
                    category: '회비',
                    pinned: false,
                    title: '11월 정기 회비(1만 원) 납부 및 게토레이 지원 안내',
                    content: '이번 달 회비는 물품 보관, 생수·이온음료 구매 및 연말 쫑파티 적립에 사용됩니다.',
                    author: '박서연 운영진',
                    createdAt: '어제 18:20',
                    readBy: ['m1', 'm2', 'm3']
                }
            ],
            chats: [
                {
                    id: 'c1',
                    room: 'all',
                    senderId: 'm1',
                    senderName: '김준호',
                    senderRole: '크루장',
                    text: '여러분 안녕하세요! 이번 주 목요일 밤 반포 정기런 일정 등록해 두었습니다. 초급 C조도 운영진이 함께 뛰니 부담 없이 참석 눌러주세요!',
                    time: '19:10',
                    cardType: 'schedule',
                    cardRefId: 's1'
                },
                {
                    id: 'c2',
                    room: 'all',
                    senderId: 'm2',
                    senderName: '박서연',
                    senderRole: '운영진',
                    text: 'B조(5분 15초 페이스) 스트레칭과 물품 보관 차량 제가 맡겠습니다. 물도 넉넉히 챙겨갈게요!',
                    time: '19:14'
                },
                {
                    id: 'c3',
                    room: 'all',
                    senderId: 'm5',
                    senderName: '정우성',
                    senderRole: '신입',
                    text: '신입인데 C조 6분 페이스 따라가도 괜찮을까요? 이번 목요일 참석 눌렀습니다!',
                    time: '19:18'
                },
                {
                    id: 'c5',
                    room: 'staff',
                    senderId: 'm2',
                    senderName: '박서연',
                    senderRole: '운영진',
                    text: '크루장님, 현재 11월 회비 미납자 2명(최민지, 한지우님) 확인됩니다. 목요 정기런 때 가볍게 안내드릴게요.',
                    time: '20:30'
                }
            ]
        };
    }

    function getDefaultExtraState() {
        return {
            currentMemberId: 'm1', // 기본 시작은 크루장(김준호) - 상단 전환 버튼으로 크루원 시점 즉시 체험 가능
            activeTab: 'home',
            feedSubTab: 'feed', // 'feed' | 'notices'
            activeChatRoom: 'all',
            rankMode: 'distance',
            monthlyGoalKm: 50,
            monthlyFeeAmount: 20000,
            feeDueDate: '2026-11-05',
            inviteCode: 'HGP-2026',
            spm: 175,
            feeds: [
                {
                    id: 'f1',
                    memberId: 'm3',
                    memberName: '이도현',
                    paceGroup: 'A조',
                    mood: '🔥 페이스 최고',
                    distance: 10.2,
                    pace: "4'32\"",
                    text: '퇴근 후 반포에서 10km 질주 완료! 목요 정기런 때 다 같이 신나게 달려봐요.',
                    time: '1시간 전',
                    claps: 5,
                    clappedBy: ['m1', 'm2', 'm4'],
                    comments: [
                        { author: '박서연', text: '우와 4분 30초대 실화인가요? 목요일에 뵈어요!' }
                    ]
                },
                {
                    id: 'f2',
                    memberId: 'm2',
                    memberName: '박서연',
                    paceGroup: 'B조',
                    mood: '💦 땀범벅 오운완',
                    distance: 6.5,
                    pace: "5'18\"",
                    text: '오늘은 발걸음 박자 175 맞춰서 가볍게 6.5km 조깅했습니다. 러닝 후 스트레칭 필수!',
                    time: '3시간 전',
                    claps: 4,
                    clappedBy: ['m1', 'm5'],
                    comments: []
                },
                {
                    id: 'f3',
                    memberId: 'm5',
                    memberName: '정우성',
                    paceGroup: 'C조',
                    mood: '🌱 첫 5km 도전',
                    distance: 5.0,
                    pace: "6'12\"",
                    text: '크루 들어와서 처음으로 안 쉬고 5km 완주했어요! 선배님들 응원 덕분입니다 🙌',
                    time: '어제',
                    claps: 7,
                    clappedBy: ['m1', 'm2', 'm3', 'm4', 'm6'],
                    comments: [
                        { author: '김준호', text: '대단합니다 우성님! 이번 목요일 C조에서도 화이팅!' }
                    ]
                }
            ]
        };
    }

    const CrewAllInOneEngine = {
        shared: getDefaultSharedState(),
        extra: getDefaultExtraState(),
        audioCtx: null,
        metronomeTimer: null,
        isMetronomeOn: false,
        runTimer: null,
        isRunningNow: false,
        runElapsedSec: 0,

        load() {
            try {
                const rawShared = localStorage.getItem(SHARED_CREW_KEY);
                if (rawShared) {
                    const p = JSON.parse(rawShared);
                    const def = getDefaultSharedState();
                    this.shared = {
                        ...def,
                        ...p,
                        weather: p.weather || def.weather,
                        members: Array.isArray(p.members) && p.members.length ? p.members : def.members,
                        schedules: Array.isArray(p.schedules) ? p.schedules : def.schedules,
                        notices: Array.isArray(p.notices) ? p.notices : def.notices,
                        chats: Array.isArray(p.chats) ? p.chats : def.chats
                    };
                }
            } catch (e) {}

            try {
                const rawExtra = localStorage.getItem(MATE_EXTRA_KEY);
                if (rawExtra) {
                    const p2 = JSON.parse(rawExtra);
                    const def2 = getDefaultExtraState();
                    this.extra = {
                        ...def2,
                        ...p2,
                        feeds: Array.isArray(p2.feeds) ? p2.feeds : def2.feeds
                    };
                }
            } catch (e) {}

            if (this.extra.monthlyFeeAmount == null) this.extra.monthlyFeeAmount = 20000;
            if (!this.extra.feeDueDate) this.extra.feeDueDate = '2026-11-05';
            if (!this.extra.inviteCode) this.extra.inviteCode = 'HGP-2026';
            const defDates = { m2: '2026-11-05', m3: '2026-11-05', m5: '2026-11-10' };
            this.shared.members.forEach(m => {
                if (m.feeStatus === '완납' && !m.feePaidDate) {
                    m.feePaidDate = defDates[m.id] || this.extra.feeDueDate;
                }
            });

            if (!this.shared.members.some(m => m.id === this.extra.currentMemberId)) {
                this.extra.currentMemberId = this.shared.members[0]?.id || 'm1';
            }
        },

        saveShared() {
            try {
                localStorage.setItem(SHARED_CREW_KEY, JSON.stringify(this.shared));
            } catch (e) {}
        },

        saveExtra() {
            try {
                localStorage.setItem(MATE_EXTRA_KEY, JSON.stringify(this.extra));
            } catch (e) {}
        },

        resetAll() {
            this.shared = getDefaultSharedState();
            this.extra = getDefaultExtraState();
            this.saveShared();
            this.saveExtra();
        },

        getCurrentMember() {
            return this.shared.members.find(m => m.id === this.extra.currentMemberId) || this.shared.members[0];
        },

        isStaff() {
            const me = this.getCurrentMember();
            return Boolean(me && (me.role === '크루장' || me.role === '운영진'));
        },

        parsePaceSeconds(paceStr) {
            const nums = String(paceStr || '').match(/\d+/g);
            if (!nums || nums.length === 0) return 360;
            const min = parseInt(nums[0], 10) || 5;
            const sec = parseInt(nums[1], 10) || 0;
            return min * 60 + sec;
        },

        autoPaceGroup(paceStr) {
            const sec = this.parsePaceSeconds(paceStr);
            if (sec <= 300) return 'A조';
            if (sec <= 345) return 'B조';
            return 'C조';
        },

        groupAttendeesByPace(schedule) {
            const groups = { 'A조': [], 'B조': [], 'C조': [] };
            (schedule.attendees || []).forEach(mid => {
                const member = this.shared.members.find(m => m.id === mid);
                if (!member) return;
                const grp = groups[member.paceGroup] ? member.paceGroup : this.autoPaceGroup(member.pace);
                groups[grp].push(member);
            });
            return groups;
        },

        getAudioContext() {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            if (!this.audioCtx) this.audioCtx = new AC();
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            return this.audioCtx;
        },

        playMetronomeBeat(onBeatVisual) {
            try {
                const ctx = this.getAudioContext();
                if (ctx) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1000, ctx.currentTime);
                    gain.gain.setValueAtTime(0.22, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.05);
                }
                if (typeof onBeatVisual === 'function') onBeatVisual();
            } catch (e) {}
        },

        playSound(type) {
            try {
                if (this.extra && this.extra.soundMuted) return;
                const ctx = this.getAudioContext();
                if (!ctx) return;
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                if (type === 'success') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(523.25, now);
                    osc.frequency.setValueAtTime(659.25, now + 0.08);
                    osc.frequency.setValueAtTime(783.99, now + 0.16);
                    gain.gain.setValueAtTime(0.14, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
                    osc.start(now);
                    osc.stop(now + 0.32);
                } else {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(640, now);
                    osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                }
            } catch (e) {}
        },

        formatKoreanDate(dateStr) {
            if (!dateStr) return '';
            const d = new Date(dateStr + 'T00:00:00');
            if (isNaN(d.getTime())) return dateStr;
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
        },

        getDaysLeftLabel(dateStr) {
            if (!dateStr) return '일정';
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(dateStr + 'T00:00:00');
            if (isNaN(target.getTime())) return dateStr;
            const diff = Math.round((target - today) / 86400000);
            if (diff === 0) return 'D-DAY';
            if (diff > 0) return `D-${diff}`;
            return `D+${Math.abs(diff)}`;
        },

        getCurrentTimeLabel() {
            const now = new Date();
            return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        },

        formatDuration(sec) {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        },

        async fetchSeoulWeather(onUpdated) {
            try {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 5000);
                const url = 'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code&timezone=Asia%2FSeoul';
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timer);
                if (!res.ok) return;
                const data = await res.json();
                if (data && data.current) {
                    const temp = Math.round(data.current.temperature_2m);
                    const code = Number(data.current.weather_code);
                    let icon = '☀️';
                    let label = '러닝하기 좋은 맑은 날씨';
                    if (code >= 61 && code <= 82) {
                        icon = '☔';
                        label = '비 소식 · 우천 대비 필요';
                    } else if (code >= 1 && code <= 3) {
                        icon = '⛅';
                        label = '선선한 구름 날씨 · 러닝 최적';
                    }
                    this.shared.weather = { loaded: true, city: '서울 한강', temp, label, icon };
                    this.saveShared();
                    if (typeof onUpdated === 'function') onUpdated();
                }
            } catch (e) {}
        }
    };

    window.YJAllInOneEngine = CrewAllInOneEngine;
})();
