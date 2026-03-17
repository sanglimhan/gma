const bgColors = ["#ffd9b3", //orange
                  "#e0ffe8", // green
                  "#ccf5ff", // blue
                  "#ffcce0", // pink
                  "#f5ffe0"]; // lemon  

// Word Sets
const textData = [
  ["weave", "generate", "reframe", "manifest"],
  ["perception", "digital ecologies", "corporeality", "identity"],
  ["mediated systems.", "algorithmic space.", "networked experiences.", "posthuman contexts."],
  ["매개된 시스템", "알고리즘적 공간", "네트워크화된 경험", "포스트휴먼적 맥락"],
  ["지각을", "디지털 생태계를", "신체성을", "정체성을"],
  ["엮어냅니다.", "생성합니다.", "재구성합니다.", "구현합니다."],

  ["translate", "render", "navigate", "modulate"],
  ["emotion", "sensation", "feeling", "memory"],
  ["recursive simulation.", "synthetic interfaces.", "virtual bodies.", "coded matter."],
  ["반복되는 시뮬레이션을", "합성의 인터페이스를", "가상의 신체를", "코드화된 물질을"],
  ["감정을", "감각을", "느낌을", "기억을"],
  ["번역합니다.", "그려냅니다.", "탐색합니다.", "조율합니다."],

  ["instantiate", "activate", "unfold", "pursue"],
  ["visual syntax", "embodied protocols", "new ontologies", "interdisciplinary methodologies"],
  ["image overrides structure.", "logic collapses into affect.", "human and machine intersect.", "technology shapes culture."],
  ["이미지가 구조를 덮어쓰는", "논리가 감응으로 붕괴되는", "인간과 기계가 교차하는", "기술이 문화를 형성하는"],
  ["시각적 구문을", "신체화된 프로토콜을", "새로운 존재론을", "다학제적 방법론을"],
  ["구현합니다.", "작동시킵니다.", "전개합니다.", "추구합니다."]
];
// Element Mapping
const elementIds = [
  "eng.v1", "eng.o1", "eng.pp1",
  "kr.pp1", "kr.o1", "kr.v1",
  "eng.v2", "eng.o2", "eng.pp2",
  "kr.pp2", "kr.o2", "kr.v2",
  "eng.v3", "eng.o3", "eng.adv",
  "kr.adv", "kr.o3", "kr.v3"
];

const elements = elementIds.map(id => document.getElementById(id));
let index = 0;

function updateWords() {
  if (elements.some(el => !el)) return;

  elements.forEach(el => el.classList.remove("visible"));

  setTimeout(() => {
    elements.forEach((el, i) => {
      const words = textData[i];
      el.textContent = words[index % words.length];
      el.style.backgroundColor = bgColors[(index + i) % bgColors.length] + "99";
    });

    elements.forEach(el => el.classList.add("visible"));
    index++;
  }, 600);
}

updateWords();
setInterval(updateWords, 4000);

