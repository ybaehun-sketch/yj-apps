export interface RegionOption {
  sido: string;
  sigungu: string;
  code: string;
}

export interface SidoGroup {
  sido: string;
  items: Array<{ sigungu: string; code: string }>;
}

export const SIDO_GROUPS: SidoGroup[] = [
  {
    sido: '전국',
    items: [{ sigungu: '전체', code: '00000' }]
  },
  {
    sido: '강원특별자치도',
    items: [
      { sigungu: '홍천군', code: '51720' },
      { sigungu: '춘천시', code: '51110' },
      { sigungu: '원주시', code: '51130' },
      { sigungu: '강릉시', code: '51150' },
      { sigungu: '동해시', code: '51170' },
      { sigungu: '태백시', code: '51190' },
      { sigungu: '속초시', code: '51210' },
      { sigungu: '삼척시', code: '51230' },
      { sigungu: '횡성군', code: '51730' },
      { sigungu: '영월군', code: '51750' },
      { sigungu: '평창군', code: '51760' },
      { sigungu: '정선군', code: '51770' },
      { sigungu: '철원군', code: '51780' },
      { sigungu: '화천군', code: '51790' },
      { sigungu: '양구군', code: '51800' },
      { sigungu: '인제군', code: '51810' },
      { sigungu: '고성군', code: '51820' },
      { sigungu: '양양군', code: '51830' }
    ]
  },
  {
    sido: '서울특별시',
    items: [
      { sigungu: '강남구', code: '11680' },
      { sigungu: '강동구', code: '11740' },
      { sigungu: '강북구', code: '11305' },
      { sigungu: '강서구', code: '11500' },
      { sigungu: '관악구', code: '11620' },
      { sigungu: '광진구', code: '11215' },
      { sigungu: '구로구', code: '11530' },
      { sigungu: '노원구', code: '11350' },
      { sigungu: '마포구', code: '11440' },
      { sigungu: '서초구', code: '11650' },
      { sigungu: '성동구', code: '11200' },
      { sigungu: '송파구', code: '11710' },
      { sigungu: '영등포구', code: '11560' },
      { sigungu: '용산구', code: '11170' },
      { sigungu: '종로구', code: '11110' }
    ]
  },
  {
    sido: '경기도',
    items: [
      { sigungu: '수원시', code: '41110' },
      { sigungu: '성남시', code: '41130' },
      { sigungu: '용인시', code: '41460' },
      { sigungu: '고양시', code: '41280' },
      { sigungu: '화성시', code: '41590' },
      { sigungu: '부천시', code: '41190' },
      { sigungu: '남양주시', code: '41360' },
      { sigungu: '안양시', code: '41170' },
      { sigungu: '평택시', code: '41220' },
      { sigungu: '파주시', code: '41480' },
      { sigungu: '김포시', code: '41570' },
      { sigungu: '가평군', code: '41820' },
      { sigungu: '양평군', code: '41830' }
    ]
  },
  {
    sido: '인천광역시',
    items: [
      { sigungu: '남동구', code: '28200' },
      { sigungu: '부평구', code: '28237' },
      { sigungu: '서구', code: '28260' },
      { sigungu: '연수구', code: '28185' },
      { sigungu: '중구', code: '28110' }
    ]
  },
  {
    sido: '부산광역시',
    items: [
      { sigungu: '해운대구', code: '26350' },
      { sigungu: '부산진구', code: '26230' },
      { sigungu: '수영구', code: '26500' },
      { sigungu: '동래구', code: '26260' },
      { sigungu: '사하구', code: '26380' }
    ]
  },
  {
    sido: '대구광역시',
    items: [
      { sigungu: '수성구', code: '27260' },
      { sigungu: '달서구', code: '27290' },
      { sigungu: '중구', code: '27110' },
      { sigungu: '동구', code: '27140' }
    ]
  },
  {
    sido: '대전광역시',
    items: [
      { sigungu: '유성구', code: '30200' },
      { sigungu: '서구', code: '30170' },
      { sigungu: '중구', code: '30140' },
      { sigungu: '동구', code: '30110' }
    ]
  },
  {
    sido: '광주광역시',
    items: [
      { sigungu: '북구', code: '29170' },
      { sigungu: '서구', code: '29140' },
      { sigungu: '광산구', code: '29200' },
      { sigungu: '남구', code: '29155' }
    ]
  },
  {
    sido: '울산광역시',
    items: [
      { sigungu: '남구', code: '31140' },
      { sigungu: '중구', code: '31110' },
      { sigungu: '북구', code: '31200' },
      { sigungu: '울주군', code: '31710' }
    ]
  },
  {
    sido: '세종특별자치시',
    items: [{ sigungu: '세종시', code: '36110' }]
  },
  {
    sido: '충청북도',
    items: [
      { sigungu: '청주시', code: '43110' },
      { sigungu: '충주시', code: '43130' },
      { sigungu: '제천시', code: '43150' },
      { sigungu: '음성군', code: '43770' }
    ]
  },
  {
    sido: '충청남도',
    items: [
      { sigungu: '천안시', code: '44130' },
      { sigungu: '아산시', code: '44200' },
      { sigungu: '서산시', code: '44210' },
      { sigungu: '당진시', code: '44270' }
    ]
  },
  {
    sido: '전북특별자치도',
    items: [
      { sigungu: '전주시', code: '52110' },
      { sigungu: '익산시', code: '52140' },
      { sigungu: '군산시', code: '52130' },
      { sigungu: '완주군', code: '52710' }
    ]
  },
  {
    sido: '전라남도',
    items: [
      { sigungu: '순천시', code: '46150' },
      { sigungu: '여수시', code: '46130' },
      { sigungu: '목포시', code: '46110' },
      { sigungu: '나주시', code: '46170' }
    ]
  },
  {
    sido: '경상북도',
    items: [
      { sigungu: '포항시', code: '47110' },
      { sigungu: '구미시', code: '47190' },
      { sigungu: '경주시', code: '47130' },
      { sigungu: '안동시', code: '47170' }
    ]
  },
  {
    sido: '경상남도',
    items: [
      { sigungu: '창원시', code: '48120' },
      { sigungu: '김해시', code: '48250' },
      { sigungu: '진주시', code: '48170' },
      { sigungu: '양산시', code: '48330' }
    ]
  },
  {
    sido: '제주특별자치도',
    items: [
      { sigungu: '제주시', code: '50110' },
      { sigungu: '서귀포시', code: '50130' }
    ]
  }
];

export const REGION_OPTIONS: RegionOption[] = SIDO_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    sido: group.sido,
    sigungu: item.sigungu,
    code: item.code
  }))
);
