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
      { sigungu: '강릉시', code: '51150' },
      { sigungu: '고성군', code: '51820' },
      { sigungu: '동해시', code: '51170' },
      { sigungu: '삼척시', code: '51230' },
      { sigungu: '속초시', code: '51210' },
      { sigungu: '양구군', code: '51800' },
      { sigungu: '양양군', code: '51830' },
      { sigungu: '영월군', code: '51750' },
      { sigungu: '원주시', code: '51130' },
      { sigungu: '인제군', code: '51810' },
      { sigungu: '정선군', code: '51770' },
      { sigungu: '철원군', code: '51780' },
      { sigungu: '춘천시', code: '51110' },
      { sigungu: '태백시', code: '51190' },
      { sigungu: '평창군', code: '51760' },
      { sigungu: '홍천군', code: '51720' },
      { sigungu: '화천군', code: '51790' },
      { sigungu: '횡성군', code: '51730' }
    ]
  },
  {
    sido: '경기도',
    items: [
      { sigungu: '가평군', code: '41820' },
      { sigungu: '고양시', code: '41280' },
      { sigungu: '과천시', code: '41290' },
      { sigungu: '광명시', code: '41210' },
      { sigungu: '광주시', code: '41610' },
      { sigungu: '구리시', code: '41310' },
      { sigungu: '군포시', code: '41410' },
      { sigungu: '김포시', code: '41570' },
      { sigungu: '남양주시', code: '41360' },
      { sigungu: '동두천시', code: '41250' },
      { sigungu: '부천시', code: '41190' },
      { sigungu: '성남시', code: '41130' },
      { sigungu: '수원시', code: '41110' },
      { sigungu: '시흥시', code: '41390' },
      { sigungu: '안산시', code: '41270' },
      { sigungu: '안성시', code: '41550' },
      { sigungu: '안양시', code: '41170' },
      { sigungu: '양주시', code: '41630' },
      { sigungu: '양평군', code: '41830' },
      { sigungu: '여주시', code: '41670' },
      { sigungu: '연천군', code: '41800' },
      { sigungu: '오산시', code: '41370' },
      { sigungu: '용인시', code: '41460' },
      { sigungu: '의왕시', code: '41430' },
      { sigungu: '의정부시', code: '41150' },
      { sigungu: '이천시', code: '41500' },
      { sigungu: '파주시', code: '41480' },
      { sigungu: '평택시', code: '41220' },
      { sigungu: '포천시', code: '41650' },
      { sigungu: '하남시', code: '41450' },
      { sigungu: '화성시', code: '41590' }
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
      { sigungu: '금천구', code: '11545' },
      { sigungu: '노원구', code: '11350' },
      { sigungu: '도봉구', code: '11320' },
      { sigungu: '동대문구', code: '11230' },
      { sigungu: '동작구', code: '11590' },
      { sigungu: '마포구', code: '11440' },
      { sigungu: '서대문구', code: '11410' },
      { sigungu: '서초구', code: '11650' },
      { sigungu: '성동구', code: '11200' },
      { sigungu: '성북구', code: '11290' },
      { sigungu: '송파구', code: '11710' },
      { sigungu: '양천구', code: '11470' },
      { sigungu: '영등포구', code: '11560' },
      { sigungu: '용산구', code: '11170' },
      { sigungu: '은평구', code: '11380' },
      { sigungu: '종로구', code: '11110' },
      { sigungu: '중구', code: '11140' },
      { sigungu: '중랑구', code: '11260' }
    ]
  },
  {
    sido: '인천광역시',
    items: [
      { sigungu: '강화군', code: '28710' },
      { sigungu: '계양구', code: '28245' },
      { sigungu: '남동구', code: '28200' },
      { sigungu: '동구', code: '28140' },
      { sigungu: '미추홀구', code: '28177' },
      { sigungu: '부평구', code: '28237' },
      { sigungu: '서구', code: '28260' },
      { sigungu: '연수구', code: '28185' },
      { sigungu: '옹진군', code: '28720' },
      { sigungu: '중구', code: '28110' }
    ]
  },
  {
    sido: '부산광역시',
    items: [
      { sigungu: '강서구', code: '26440' },
      { sigungu: '금정구', code: '26410' },
      { sigungu: '기장군', code: '26710' },
      { sigungu: '남구', code: '26290' },
      { sigungu: '동구', code: '26170' },
      { sigungu: '동래구', code: '26260' },
      { sigungu: '부산진구', code: '26230' },
      { sigungu: '북구', code: '26320' },
      { sigungu: '사상구', code: '26530' },
      { sigungu: '사하구', code: '26380' },
      { sigungu: '서구', code: '26140' },
      { sigungu: '수영구', code: '26500' },
      { sigungu: '연제구', code: '26470' },
      { sigungu: '영도구', code: '26200' },
      { sigungu: '중구', code: '26110' },
      { sigungu: '해운대구', code: '26350' }
    ]
  },
  {
    sido: '대구광역시',
    items: [
      { sigungu: '군위군', code: '27720' },
      { sigungu: '남구', code: '27200' },
      { sigungu: '달서구', code: '27290' },
      { sigungu: '달성군', code: '27710' },
      { sigungu: '동구', code: '27140' },
      { sigungu: '북구', code: '27230' },
      { sigungu: '서구', code: '27170' },
      { sigungu: '수성구', code: '27260' },
      { sigungu: '중구', code: '27110' }
    ]
  },
  {
    sido: '대전광역시',
    items: [
      { sigungu: '대덕구', code: '30230' },
      { sigungu: '동구', code: '30110' },
      { sigungu: '서구', code: '30170' },
      { sigungu: '유성구', code: '30200' },
      { sigungu: '중구', code: '30140' }
    ]
  },
  {
    sido: '광주광역시',
    items: [
      { sigungu: '광산구', code: '29200' },
      { sigungu: '남구', code: '29155' },
      { sigungu: '동구', code: '29110' },
      { sigungu: '북구', code: '29170' },
      { sigungu: '서구', code: '29140' }
    ]
  },
  {
    sido: '울산광역시',
    items: [
      { sigungu: '남구', code: '31140' },
      { sigungu: '동구', code: '31170' },
      { sigungu: '북구', code: '31200' },
      { sigungu: '울주군', code: '31710' },
      { sigungu: '중구', code: '31110' }
    ]
  },
  {
    sido: '세종특별자치시',
    items: [{ sigungu: '세종시', code: '36110' }]
  },
  {
    sido: '충청북도',
    items: [
      { sigungu: '괴산군', code: '43760' },
      { sigungu: '단양군', code: '43800' },
      { sigungu: '보은군', code: '43720' },
      { sigungu: '영동군', code: '43740' },
      { sigungu: '옥천군', code: '43730' },
      { sigungu: '음성군', code: '43770' },
      { sigungu: '제천시', code: '43150' },
      { sigungu: '증평군', code: '43745' },
      { sigungu: '진천군', code: '43750' },
      { sigungu: '청주시', code: '43110' },
      { sigungu: '충주시', code: '43130' }
    ]
  },
  {
    sido: '충청남도',
    items: [
      { sigungu: '계룡시', code: '44250' },
      { sigungu: '공주시', code: '44150' },
      { sigungu: '금산군', code: '44710' },
      { sigungu: '논산시', code: '44230' },
      { sigungu: '당진시', code: '44270' },
      { sigungu: '보령시', code: '44180' },
      { sigungu: '부여군', code: '44760' },
      { sigungu: '서산시', code: '44210' },
      { sigungu: '서천군', code: '44770' },
      { sigungu: '아산시', code: '44200' },
      { sigungu: '예산군', code: '44810' },
      { sigungu: '천안시', code: '44130' },
      { sigungu: '청양군', code: '44790' },
      { sigungu: '태안군', code: '44825' },
      { sigungu: '홍성군', code: '44800' }
    ]
  },
  {
    sido: '전북특별자치도',
    items: [
      { sigungu: '고창군', code: '52790' },
      { sigungu: '군산시', code: '52130' },
      { sigungu: '김제시', code: '52210' },
      { sigungu: '남원시', code: '52190' },
      { sigungu: '무주군', code: '52730' },
      { sigungu: '부안군', code: '52800' },
      { sigungu: '순창군', code: '52770' },
      { sigungu: '완주군', code: '52710' },
      { sigungu: '익산시', code: '52140' },
      { sigungu: '임실군', code: '52750' },
      { sigungu: '장수군', code: '52740' },
      { sigungu: '전주시', code: '52110' },
      { sigungu: '정읍시', code: '52180' },
      { sigungu: '진안군', code: '52720' }
    ]
  },
  {
    sido: '전라남도',
    items: [
      { sigungu: '강진군', code: '46810' },
      { sigungu: '고흥군', code: '46770' },
      { sigungu: '곡성군', code: '46720' },
      { sigungu: '광양시', code: '46230' },
      { sigungu: '구례군', code: '46730' },
      { sigungu: '나주시', code: '46170' },
      { sigungu: '담양군', code: '46710' },
      { sigungu: '목포시', code: '46110' },
      { sigungu: '무안군', code: '46840' },
      { sigungu: '보성군', code: '46780' },
      { sigungu: '순천시', code: '46150' },
      { sigungu: '신안군', code: '46910' },
      { sigungu: '여수시', code: '46130' },
      { sigungu: '영광군', code: '46870' },
      { sigungu: '영암군', code: '46830' },
      { sigungu: '완도군', code: '46890' },
      { sigungu: '장성군', code: '46880' },
      { sigungu: '장흥군', code: '46800' },
      { sigungu: '진도군', code: '46900' },
      { sigungu: '함평군', code: '46860' },
      { sigungu: '해남군', code: '46820' },
      { sigungu: '화순군', code: '46790' }
    ]
  },
  {
    sido: '경상북도',
    items: [
      { sigungu: '경산시', code: '47290' },
      { sigungu: '경주시', code: '47130' },
      { sigungu: '고령군', code: '47830' },
      { sigungu: '구미시', code: '47190' },
      { sigungu: '김천시', code: '47150' },
      { sigungu: '문경시', code: '47280' },
      { sigungu: '봉화군', code: '47920' },
      { sigungu: '상주시', code: '47250' },
      { sigungu: '성주군', code: '47840' },
      { sigungu: '안동시', code: '47170' },
      { sigungu: '영덕군', code: '47770' },
      { sigungu: '영양군', code: '47760' },
      { sigungu: '영주시', code: '47210' },
      { sigungu: '영천시', code: '47230' },
      { sigungu: '예천군', code: '47900' },
      { sigungu: '울릉군', code: '47940' },
      { sigungu: '울진군', code: '47930' },
      { sigungu: '의성군', code: '47730' },
      { sigungu: '청도군', code: '47820' },
      { sigungu: '청송군', code: '47750' },
      { sigungu: '칠곡군', code: '47850' },
      { sigungu: '포항시', code: '47110' }
    ]
  },
  {
    sido: '경상남도',
    items: [
      { sigungu: '거제시', code: '48310' },
      { sigungu: '거창군', code: '48880' },
      { sigungu: '고성군', code: '48820' },
      { sigungu: '김해시', code: '48250' },
      { sigungu: '남해군', code: '48840' },
      { sigungu: '밀양시', code: '48270' },
      { sigungu: '사천시', code: '48240' },
      { sigungu: '산청군', code: '48860' },
      { sigungu: '양산시', code: '48330' },
      { sigungu: '의령군', code: '48720' },
      { sigungu: '진주시', code: '48170' },
      { sigungu: '창녕군', code: '48740' },
      { sigungu: '창원시', code: '48120' },
      { sigungu: '통영시', code: '48220' },
      { sigungu: '하동군', code: '48850' },
      { sigungu: '함안군', code: '48730' },
      { sigungu: '함양군', code: '48870' },
      { sigungu: '합천군', code: '48890' }
    ]
  },
  {
    sido: '제주특별자치도',
    items: [
      { sigungu: '서귀포시', code: '50130' },
      { sigungu: '제주시', code: '50110' }
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
