#!/usr/bin/env node
/**
 * Build the public Life Cosmos demo from a completely fictional 25-year life.
 *
 * Source of truth
 *   demo/memories/*.md     500 public Markdown memories
 *
 * Generated artifact
 *   demo/index.html        the existing viewer with the public corpus embedded
 *
 * 許思明、她的親友、店舖與所有事件都是虛構的。真實地名只用來讓恆春的
 * 季節、風與生活有可辨識的地理質感。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const MEMORY_DIR = path.join(ROOT, "demo", "memories");
const VIEWER_TEMPLATE = path.join(ROOT, "viewer", "template.html");
const DEMO = path.join(ROOT, "demo", "index.html");

const CATEGORIES = [
  { key: "coast", label: "海岸", color: "#69c9d0", arm: 0, kw: [] },
  { key: "home", label: "家與日常", color: "#ffbd71", arm: 0, kw: [] },
  { key: "love", label: "愛與親密", color: "#ff7f9d", arm: 0, kw: [] },
  { key: "kin", label: "家族", color: "#e8cf83", arm: 0, kw: [] },
  { key: "body", label: "身體", color: "#a6da8d", arm: 0, kw: [] },
  { key: "craft", label: "器物與手作", color: "#9aa7ff", arm: 1, kw: [] },
  { key: "work", label: "生計", color: "#aeb5c7", arm: 1, kw: [] },
  { key: "field", label: "田野", color: "#7fd8a2", arm: 1, kw: [] },
  { key: "travel", label: "遠行", color: "#71aef5", arm: 1, kw: [] },
  { key: "thought", label: "思索與怪事", color: "#c5a4f8", arm: 1, kw: [] },
];

const ARCS = [
  [2001, "帆布工具袋", "在虛構的南方海岸藝術學院念材料敘事系，白天學木工與植物辨識，晚上在租屋處替壞掉的電扇命名。", ["第一次離開恆春住進台南", "在材料課把漂流木做成一把太重的椅子", "認識念偶戲的季穗", "決定把每次失敗都寫進藍色簿子"], "好奇", ["季穗", "阿芒"]],
  [2002, "藍邊搪瓷碗", "大二開始往返恆春與台南，將海岸撿回的種子、鏽釘和市場叫賣聲做成一套沒有用途的餐具。", ["季穗第一次跟她回恆春", "父親嫌她做的碗不能盛湯", "兩人在西門外吵完又去吃綠豆蒜", "她在期末展寫下器物也會記仇"], "雀躍", ["季穗", "許望潮"]],
  [2003, "裂了一角的石膏月亮", "畢業製作《鹽分會留下形狀》把十二種海風封進石膏，展場卻因除濕機故障而整片龜裂。", ["通宵修補畢業製作", "母親搭早班車來看展", "收到一間城市設計公司的面試通知", "把裂掉的月亮帶回恆春"], "倔強", ["季穗", "黎秋瓦"]],
  [2004, "夜班識別證", "搬到高雄做水族館夜間維護，工作是擦壓克力、記錄鹽度，並在閉館後跟一尾總是躲著人的石斑說話。", ["第一次領到固定薪水", "發現自己不擅長沒有窗的工作", "季穗開始跟劇團巡演", "用離職信背面畫回恆春的路"], "疲憊", ["季穗", "鹽叔"]],
  [2005, "十九號紅色項圈", "辭職後騎舊機車繞島，在東岸雨棚下撿到一隻三腳黑狗，因為那天是十九日，便替牠取名十九。", ["機車在大武拋錨", "十九第一次願意靠近她", "用最後一筆存款買二手相機", "承認自己其實正在回家"], "漂泊", ["十九", "阿芒"]],
  [2006, "綠色鐵捲門", "回恆春接下父親閒置的電器行，把一半改成修理所，一半放植物標本，門口掛上歪斜木牌「鹹風標本室」。", ["刷掉店裡二十年的油煙", "父親把工具牆的鑰匙交給她", "第一位客人拿來壞掉的收音機", "季穗搬進店後的小房間"], "踏實", ["季穗", "許望潮", "十九"]],
  [2007, "颱風後的白色窗框", "一場颱風掀走後院屋頂，她開始替鄰居畫避風地圖，也學會每次修理前先問物件曾經陪誰度過什麼。", ["和鄰居一起釘回屋瓦", "第一次辦免費修理日", "十九在積水裡叼回一隻鞋", "季穗說這間店已經不像店"], "警醒", ["季穗", "十九", "鹽叔"]],
  [2008, "第一罐海茄苳蜜餞", "標本室多了一張發酵桌，她把市場賣不完的果實做成酸得皺眉的蜜餞，意外成了店裡最穩定的收入。", ["失敗的十二罐蜜餞一起冒泡", "季穗替瓶身畫了一隻暴躁海鳥", "父親第一次稱讚她的生意", "兩人開始為錢和遠方爭執"], "忙碌", ["季穗", "許望潮", "十九"]],
  [2009, "兩張不同方向的車票", "季穗想去北方加入長期巡演，思明不願離開剛站穩的標本室。她們把爭論寫在同一本帳簿的左右兩頁。", ["第一次談到分開", "母親勸她別把守住和愛混在一起", "標本室接到地方飲食採集案", "兩張車票最後都沒有使用"], "拉扯", ["季穗", "黎秋瓦"]],
  [2010, "灰藍色錄音筆", "開始替恆春半島的市場、潮間帶與老行業做口述採集。她不追求完整，只記下人說到一半停住的地方。", ["鹽叔教她看雲的底色", "在後灣錄到魚販的清晨", "季穗一年只回來四次", "她發現等待也是田野工作"], "專注", ["季穗", "鹽叔", "阿芒"]],
  [2011, "被風吹走的帳頁", "標本室成為旅人會特地繞來的怪地方，生意變好，關係卻像掛在門外的帳頁，一陣落山風就翻到誰都讀不懂的那面。", ["第一次雇阿芒幫忙看店", "季穗寄回一箱巡演道具", "她把兩人的房間改成乾燥室", "年末仍替對方留一盞燈"], "遲疑", ["季穗", "阿芒", "十九"]],
  [2012, "空著的木衣架", "季穗決定不再回來住。她們沒有大吵，只花一下午分完鍋子、書和工具，最後誰也不肯拿那只藍邊搪瓷碗。", ["把共同帳簿結清", "十九守在空衣架下睡了三天", "思明第一次獨自關店過年", "她把失戀寫成一張維修單"], "失落", ["季穗", "十九", "黎秋瓦"]],
  [2013, "沒有寄出的維修單", "她把生活縮得很小，清晨採集、午後修東西、晚上煮一人份的湯。沉默久了，反而聽見自己真正不願妥協的部分。", ["拒絕把標本室改成網美店", "開始一個人夜走西門", "收到季穗從北海道寄來的明信片", "學會不回覆也是一種回答"], "安靜", ["十九", "阿芒"]],
  [2014, "思明 FM 的紅燈", "和阿芒架起一台低功率網路電台，每週三深夜播市場訪談、修理聲與聽眾打來的怪夢，節目叫《風不負責回答》。", ["第一集只有七位聽眾", "父親在電話裡糾正她修馬達的方法", "陌生人寄來一卷海上錄音", "她第一次覺得孤單也能發射"], "興奮", ["阿芒", "許望潮", "十九"]],
  [2015, "鹽叔的雲圖", "鹽叔把四十年手畫的雲圖交給她保管。思明開始整理半島的民間氣象詞，發現知識常躲在一句看似迷信的提醒裡。", ["逐張攤開受潮的雲圖", "帶學生走讀港口溪", "父親開始忘記剛說過的話", "她把天氣和記憶放在同一套索引裡"], "鄭重", ["鹽叔", "許望潮", "阿芒"]],
  [2016, "十九嘴裡的藍絲帶", "十九在雷雨夜失蹤八天，回來時嘴裡咬著一截藍絲帶。思明沒有追查它去了哪裡，只在門邊放了第九天的水。", ["沿著舊城牆找狗", "第一次承認自己害怕失去", "把尋狗啟事全數撕下", "為十九做一張更低的睡台"], "後怕", ["十九", "阿芒", "黎秋瓦"]],
  [2017, "港口溪的透明樣方", "植物調查員阮青禾來借標本桌，兩人從海濱植物的名字吵到樣方應該擺在哪裡，吵完一起吃了兩碗鴨肉冬粉。", ["第一次和青禾做港口溪調查", "思明嫌她把植物講得太像公文", "青禾替十九修好輪椅", "兩人約定只合作不談感情"], "戒備", ["阮青禾", "十九", "阿芒"]],
  [2018, "兩把不同高度的牙刷", "所謂只合作維持了九個月。青禾沒有搬進來，卻在標本室放了一把牙刷和一件雨衣，她們保留各自的房間與關門的權利。", ["第一次一起過落山風季", "為是否公開關係爭執", "母親只問青禾吃不吃辣", "她們決定每週留一天各自消失"], "親密", ["阮青禾", "黎秋瓦", "十九"]],
  [2019, "貼滿便條的開發案地圖", "海岸開發說明會讓她從旁聽者變成提問者。她不擅長口號，便把潮溝、墓仔埔與居民記憶一一釘回地圖。", ["連續三夜整理會議資料", "青禾提醒她別把自己耗成證據", "標本室成為鄰里討論據點", "她第一次在台上把話講完"], "堅定", ["阮青禾", "阿芒", "鹽叔"]],
  [2020, "門口的無接觸菜籃", "疫情讓店門關了幾個月，她改送發酵物、修好的小家電和手寫風況。沒有旅人之後，標本室反而重新長回鄰里的尺寸。", ["第一次整月沒有觀光客", "和青禾隔著門吃生日面", "父親學會用視訊卻只拍到天花板", "她把廣播改成每天十分鐘"], "懸著", ["阮青禾", "許望潮", "阿芒"]],
  [2021, "四十歲的反向生日蠟燭", "四十歲生日，她規定每位來客帶走一樣店裡的東西，結果少掉二十七件雜物，多了二十七段物件後來去了哪裡的消息。", ["把生日辦成物件領養會", "十九老得走不動卻堅持看門", "青禾提出共同買一小塊地", "思明說先種樹再談房子"], "開闊", ["阮青禾", "十九", "阿芒"]],
  [2022, "父親口袋裡的螺絲", "父親的記憶越來越鬆。他常把螺絲收進口袋，說機器會自己來找。思明不再糾正，只陪他把同一台電扇拆開三次。", ["第一次陪父親做認知檢查", "母親把疲倦說成只是沒睡飽", "青禾接手店裡一半雜務", "她為家人建立不按日期的檔案"], "溫柔", ["許望潮", "黎秋瓦", "阮青禾"]],
  [2023, "沒有嬰兒房的平面圖", "她和青禾認真談過要不要成為母親，最後決定把那間預留的房間做成社區種子庫。決定並不悲壯，只是很清楚。", ["列出想要與不想要的人生", "母親沉默一週後送來舊櫃子", "種子庫收到第一批豆類", "她們去海邊慶祝一個沒有發生的未來"], "清明", ["阮青禾", "黎秋瓦", "阿芒"]],
  [2024, "四十種風的紙旗", "《風經過的四十種名字》在舊城裡展開。紙旗記錄居民對風的稱呼，風一吹就互相遮住，正好證明記憶從來不會整齊排隊。", ["向四十位居民收集風名", "季穗帶著劇團回來協作", "青禾和季穗第一次見面", "思明發現舊愛可以成為舊友"], "釋然", ["阮青禾", "季穗", "阿芒"]],
  [2025, "泡過水的索引卡", "一場暴雨淹進標本室，紙本索引濕成一團。她本來想全部丟掉，鄰居卻各自帶回家晾曬，字跡散開後像另一種海圖。", ["半夜搶救種子櫃", "連續一個月不敢聞到霉味", "社區輪班曬乾八千張卡片", "她決定讓檔案從此有多個保管人"], "震蕩", ["阮青禾", "阿芒", "黎秋瓦"]],
  [2026, "第五百張公開卡片", "四十五歲，她把標本室改名為「思明生活觀測所」，公開二十五年的五百段記錄，並保留一張永遠空白的卡片給明天。", ["逐篇重讀二十歲時的自己", "把私人傷口改寫成能分享的故事", "與青禾在門口種下一棵棋盤腳", "第五百篇寫完時沒有煙火，只有落山風"], "明亮", ["阮青禾", "阿芒", "黎秋瓦"]],
].map(([year, symbol, story, beats, mood, people]) => ({ year, age: year - 1981, symbol, story, beats, mood, people }));

const SCENES = [
  { key: "wind", title: "今天的風不肯直走", category: "coast", place: "龍磐", themes: ["風與季節", "觀察"], task: "把紙帶綁在三種高度，記錄風如何繞過矮灌木，再把最不可靠的那一筆用紅色圈起來" },
  { key: "market", title: "市場開門以前", category: "home", place: "恆春西門", themes: ["地方飲食", "日常"], task: "幫菜攤把被風吹散的價格牌壓好，買下賣相最差的一籃果實，答應回去試一種不會太甜的做法" },
  { key: "repair", title: "維修單上的壞脾氣", category: "craft", place: "鹹風標本室", themes: ["修理", "器物"], task: "拆開一件拒絕合作的舊家電，先清掉鹽霧結成的白粉，再尋找那顆總是躲在最深處的螺絲" },
  { key: "dog", title: "十九的巡邏路線", category: "home", place: "恆春舊城", themes: ["動物夥伴", "陪伴"], task: "跟著十九繞一條它自己決定的路，在每個它停下來的地方記一筆，最後發現狗比地圖更在意誰家門口有陰影" },
  { key: "letter", title: "給遠方的一封慢信", category: "love", place: "鹹風標本室", themes: ["親密關係", "書信"], task: "把真正想說的話寫在第三稿，前兩稿折成墊桌腳的紙片，讓搖晃先停下來再處理感情" },
  { key: "field", title: "樣方偏了七公分", category: "field", place: "港口溪", themes: ["海濱植物", "田野"], task: "重新擺正透明樣方，數完每一株貼地生長的植物，也把自己誤認的那一株寫進錯誤欄" },
  { key: "money", title: "零錢盒與月底", category: "work", place: "鹹風標本室", themes: ["生計", "選擇"], task: "結算修理、蜜餞和田野工作的收入，發現最費力的項目仍然賺得最少，卻也是最捨不得取消的那一項" },
  { key: "storm", title: "颱風來前的四小時", category: "coast", place: "恆春", themes: ["颱風", "準備"], task: "收進紙旗、封住種子櫃、替獨居鄰居檢查窗扣，最後才想起自己房間還有一扇窗沒關" },
  { key: "meal", title: "一鍋太酸的湯", category: "kin", place: "南門老家", themes: ["家族", "地方飲食"], task: "照母親只憑手感的做法煮湯，酸味失控以後沒有倒掉，而是多切一整盤瓜菜把它慢慢拉回來" },
  { key: "radio", title: "風不負責回答", category: "thought", place: "思明 FM", themes: ["廣播", "怪夢"], task: "打開深夜麥克風，讓來電者講完一個沒有結局的夢，只在必要時問一句當時風從哪邊來" },
  { key: "walk", title: "關店後的城牆", category: "body", place: "恆春東門", themes: ["身體", "獨處"], task: "沿舊城牆走到呼吸變慢，刻意不計算步數，只辨認哪一段路會讓肩膀自動放鬆" },
  { key: "visitor", title: "旅人帶來的破東西", category: "travel", place: "鹹風標本室", themes: ["相遇", "修理"], task: "聽陌生旅人解釋一件破物為何不能丟，再判斷自己修的是機關、回憶，還是對方不肯結束的旅程" },
  { key: "mother", title: "母親說只是順便", category: "kin", place: "南門老家", themes: ["母女", "照顧"], task: "接過母親聲稱順便帶來的三層食盒，假裝沒看見每一層都剛好是自己這周忘記吃的東西" },
  { key: "father", title: "父親的工具牆", category: "kin", place: "鹹風標本室", themes: ["父女", "手藝"], task: "把借走的鉗子掛回父親規定的位置，聽他解釋工具為什麼也需要鄰居，並把這句話寫在牆邊" },
  { key: "love", title: "兩個人各自沉默", category: "love", place: "萬里桐", themes: ["親密關係", "邊界"], task: "和身邊的人並排坐著，不急著把沉默解釋成生氣，等海面先把光從銀色換成深藍" },
  { key: "seed", title: "種子櫃的訪客", category: "field", place: "思明生活觀測所", themes: ["種子", "共享"], task: "替一包來歷不明的種子做發芽測試，在卡片上誠實寫下不知道，並邀請送來的人一起等待" },
  { key: "dream", title: "昨夜夢見店長出鰓", category: "thought", place: "夢裡的後灣", themes: ["夢", "自我探索"], task: "趁早餐還沒涼以前記下夢，禁止自己補邏輯，讓會說話的魚和倒著開的店門保持原樣" },
  { key: "trip", title: "離開半島的一天", category: "travel", place: "枋寮車站", themes: ["遠行", "回家"], task: "只帶一個小包搭上北行列車，沿途記錄身體在哪一站開始想念風，又在哪一站慶幸沒人認識自己" },
  { key: "odd", title: "無法分類的下午", category: "thought", place: "鹹風標本室", themes: ["偶然", "幽默"], task: "處理一連串不屬於任何表格的事，替螃蟹讓路、幫小孩找一顆不存在的綠色螺絲，並接受今天沒有主旨" },
  { key: "inventory", title: "年末不完整清單", category: "thought", place: "鹹風標本室", themes: ["時間", "記憶"], task: "盤點留下、送走、修好與仍然不明白的東西，故意保留空白，不把一年假裝成已經結案" },
];

const WEATHER = ["落山風把招牌吹得咯咯響", "南方的光白得像鹽", "午後雷雨把街面洗成深灰", "空氣黏得每張紙都捲邊", "雲壓得很低，海卻異常平", "風停了，連狗都顯得不習慣"];
const SENSES = ["鐵鏽和九層塔混在一起的氣味", "曬熱木板摸起來微微發黏", "遠處機車聲被風切成斷句", "鹽粒卡在手腕細小的傷口", "市場冰塊融水流過鞋底", "紙張受潮後像剛醒來的皮膚"];
const DIALOGUE = {
  "阿芒": "阿芒說：『妳每次說順便，通常都要忙到天黑。』",
  "黎秋瓦": "母親看了一眼，只說：『先吃飯，答案又不會跑。』",
  "許望潮": "父親說：『會搖的東西不一定壞了，也可能是地不平。』",
  "阮青禾": "青禾說：『不知道就寫不知道，田野不會扣妳分。』",
  "季穗": "季穗說：『妳不是固執，妳只是轉彎的半徑很大。』",
  "鹽叔": "鹽叔說：『雲沒答應妳什麼，是妳自己把它當預告。』",
};
const REFLECTIONS = [
  "她後來明白，記錄不是把事情釘死，而是替當時的自己留一條能回去的窄路。",
  "有些東西被修好後仍留著裂痕。她喜歡這樣，因為裂痕會提醒人別把復原誤認成回到從前。",
  "她不再急著替每個選擇找意義。能在晚飯前完成、能讓一個人少煩惱一點，已經是夠具體的價值。",
  "恆春教她的不是慢，而是看風向調整力氣。硬撐有時很勇敢，有時只是不肯承認方法已經失效。",
  "親密不是把門全部打開。對她而言，更像知道哪一扇門今天關著，也願意在門外放下一碗還熱的湯。",
  "檔案最誠實的地方是缺口。寫下沒看見、沒聽懂和記錯，比編出完整故事更接近她想守住的生活。",
  "她把這件小事記下來，因為人生真正改變方向時，很少會自己敲鑼打鼓。通常只是手先做了一個不同的動作。",
  "海邊的人知道，留下並不等於靜止。每天同一扇門外都是不同的風，守著一個地方也能走很遠。",
];
const CLOSINGS = [
  "關燈前，她在藍色簿子畫了一條歪線，旁邊寫：今天沒有解決世界，但把一個角落放回去了。",
  "她把最後一件工具擦乾，聽見屋外風勢又變，決定明天再重新判斷一次。",
  "這篇沒有結論。紙頁下方只壓著一粒鹽，隔天醒來，它已經吸水化開。",
  "十九在舊年代會把頭壓在她腳背上。如今她仍會替那個位置留一點空，像替過去保留座位。",
  "她沒有拍照，只記住當時每個人的手都在做事。那種畫面比合照更像一家人。",
  "回程時西門已經亮燈，她忽然很餓。能夠準時感覺到餓，是她判斷自己還在生活裡的方法。",
];

function mulberry32(seed) {
  return function rng() {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(0x4e414e4a);
const pick = values => values[Math.floor(rng() * values.length)];
const yamlList = values => `[${[...new Set(values)].join(", ")}]`;
const pad = value => String(value).padStart(2, "0");

function dateFor(year, index, total) {
  const days = new Date(Date.UTC(year + 1, 0, 1)) - new Date(Date.UTC(year, 0, 1));
  const day = Math.min(days / 86400000 - 1, Math.floor((index + 0.64) * days / 86400000 / total));
  const date = new Date(Date.UTC(year, 0, 1 + day));
  return `${year}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function sceneFor(arc, original) {
  const scene = { ...original, themes: [...original.themes] };
  const currentPlace = arc.year <= 2003 ? "南方海岸藝術學院工坊"
    : arc.year === 2004 ? "水族館維修間"
    : arc.year === 2005 ? "環島路上的雨棚"
    : arc.year === 2026 ? "思明生活觀測所" : "鹹風標本室";

  if (["repair", "letter", "money", "visitor", "odd", "inventory"].includes(scene.key)) scene.place = currentPlace;
  if (scene.key === "father") scene.place = arc.year < 2006 ? "父親的電器行" : currentPlace;
  if (scene.key === "dog" && arc.year < 2005) {
    scene.title = "街角黑狗的巡邏路線";
    scene.task = "跟著一隻沒有名字的黑狗繞過兩條街，在每個牠停下來的地方記一筆，最後把觀察交給市場口的餵狗阿姨";
    scene.themes = ["動物伙伴", "觀察"];
  }
  if (scene.key === "radio" && arc.year < 2014) {
    scene.title = "把夜聲收進錄音帶";
    scene.place = currentPlace;
    scene.task = "在深夜錄下風、冰箱與遠處車聲，把每次無法辨認的聲音標成問號，不急著替它編一個來源";
    scene.themes = ["夜間觀察", "聲音筆記"];
  }
  if (scene.key === "love" && arc.year >= 2013 && arc.year < 2017) {
    scene.title = "一個人也有兩份沉默";
    scene.task = "獨自在萬里桐坐到海面轉暗，不把安靜誤認成缺少誰，而是辨認自己終於願意承認的需要";
    scene.themes = ["獨處", "邊界"];
  }
  if (scene.key === "seed" && arc.year < 2023) {
    scene.title = "紙袋裡的種子";
    scene.place = currentPlace;
    scene.task = "替一包來歷不明的種子做發芽測試，在紙袋上誠實寫下不知道，並留出一格記錄失敗";
    scene.themes = ["種子", "等待"];
  }
  return scene;
}

function bodyFor(arc, scene, index, date) {
  const beat = arc.beats[Math.floor(index / 5) % arc.beats.length];
  const weather = pick(WEATHER);
  const sense = pick(SENSES);
  const speakers = arc.people.filter(person => DIALOGUE[person]);
  const dialogue = speakers.length ? DIALOGUE[pick(speakers)] : "隔壁的阿姨說：『先把手上的做完，風向等一下再看。』";
  const reflection = pick(REFLECTIONS);
  const closing = pick(arc.year >= 2005 ? CLOSINGS : CLOSINGS.filter(line => !line.includes("十九")));
  const lead = `${date}，${weather}。${arc.age} 歲的許思明正在經歷「${beat}」。她今天給自己的工作很簡單：${scene.task}。`;
  const sceneParagraph = `現場有${sense}。${arc.story}今天的細節沒有因為比較忙就退到背景，它仍在每個動作裡留下重量。${dialogue}`;

  if (index % 6 === 0) {
    return `${lead}\n\n## 今日觀察\n\n- 發生的事：${scene.task}。\n- 沒把握的事：她無法確認自己的判斷是不是被疲倦推著走。\n- 想留下的細節：${sense}，還有一句沒有及時回應的話。\n\n${sceneParagraph}\n\n${reflection}\n\n${closing}`;
  }
  if (index % 6 === 1) {
    return `${lead}\n\n> 給三年後的思明：如果妳已經忘了今天，請先記得${sense}。那不是象徵，只是我確實站在那裡。\n\n${sceneParagraph}\n\n她在信末沒有寫祝福，只列了一件明天能做的事：把今天留下的工具歸位，再問一次對方真正需要什麼。${reflection}\n\n${closing}`;
  }
  if (index % 6 === 2) {
    return `${lead}\n\n${sceneParagraph}\n\n## 暫時配方\n\n1. 先承認有一部分不知道怎麼處理。\n2. 把能拆開的事情拆到手掌大小。\n3. 留一點時間給風、發酵或另一個人。\n4. 明天再聞一次，不因心急多加解釋。\n\n${reflection}\n\n${closing}`;
  }
  if (index % 6 === 3) {
    return `${lead}\n\n${sceneParagraph}\n\n她問自己：『如果沒人看見，我還會做嗎？』\n\n答案不是立刻出現。她先把桌面清出一塊空位，喝掉已經冷的茶，再重新做了一遍最麻煩的步驟。${reflection}\n\n${closing}`;
  }
  if (index % 6 === 4) {
    return `${lead}\n\n### 留下\n\n${sceneParagraph}\n\n### 送走\n\n一項已經不適合現在的計畫、一句為了面子才說的答應，以及抽屜裡那顆尺寸永遠不對的螺絲。${reflection}\n\n${closing}`;
  }
    return `${lead}\n\n${sceneParagraph}\n\n她繞了一小段遠路才回到${scene.place}。路上沒有發生值得登上新聞的事，只有一戶人家在曬床單、兩個學生共撐一把傘，還有路邊一盆被風吹倒後又自己卡住的植物。${reflection}\n\n${closing}`;
}

function makeMemory(arc, scene, index, total) {
  scene = sceneFor(arc, scene);
  const date = dateFor(arc.year, index, total);
  const title = `${scene.title}｜${arc.symbol}`;
  const beat = arc.beats[Math.floor(index / 5) % arc.beats.length];
  const characters = ["許思明", ...arc.people.slice(0, 1 + index % Math.min(2, arc.people.length))];
  const places = [scene.place, index % 4 === 0 ? "屏東恆春" : "恆春半島"];
  const themes = [...scene.themes, index % 3 === 0 ? "時間與記憶" : arc.symbol];
  const summary = `${arc.age} 歲的許思明在${scene.place}經歷「${scene.title}」，也重新看見${beat}留下的影響。`;
  const mood = index % 5 === 0 ? arc.mood : ["清醒", "自嘲", "專注", "柔軟", "遲疑"][index % 5];
  const body = bodyFor(arc, scene, index, date);
  const slug = `${date}-${String(index + 1).padStart(2, "0")}-${scene.key}.md`;
  const frontmatter = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: ${date}`,
    `age: ${arc.age}`,
    `category: ${scene.category}`,
    `characters: ${yamlList(characters)}`,
    `places: ${yamlList(places)}`,
    `themes: ${yamlList(themes)}`,
    `summary: ${JSON.stringify(summary)}`,
    `mood: ${mood}`,
    "fictional: true",
    "---",
    "",
  ].join("\n");
  return { path: `memories/${slug}`, name: slug, text: `${frontmatter}${body}\n`, body, title, date, age: arc.age };
}

function makeCorpus() {
  const extraYears = new Set([2001, 2006, 2012, 2018, 2021, 2026]);
  const memories = [];
  for (const arc of ARCS) {
    const total = extraYears.has(arc.year) ? 20 : 19;
    for (let index = 0; index < total; index += 1) {
      memories.push(makeMemory(arc, SCENES[index], index, total));
    }
  }
  return memories;
}

function validateCorpus(memories) {
  if (memories.length !== 500) throw new Error(`expected 500 memories, got ${memories.length}`);
  const bodies = new Set();
  for (const memory of memories) {
    const chars = memory.body.replace(/\s/g, "").length;
    if (chars < 180) throw new Error(`${memory.path} is too short: ${chars}`);
    if (bodies.has(memory.body)) throw new Error(`duplicate body: ${memory.path}`);
    bodies.add(memory.body);
  }
}

function writeCorpus(memories) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  for (const name of fs.readdirSync(MEMORY_DIR)) {
    if (name.endsWith(".md")) fs.unlinkSync(path.join(MEMORY_DIR, name));
  }
  for (const memory of memories) {
    fs.writeFileSync(path.join(MEMORY_DIR, memory.name), memory.text, "utf8");
  }
}

async function buildDemo(memories) {
  globalThis.window = {};
  await import(path.join(ROOT, "builder", "pipeline.js"));
  const pipeline = globalThis.window.CosmosPipeline;
  const docs = pipeline.enrich(pipeline.readDocs(memories), CATEGORIES);
  docs.forEach(doc => { doc.lock = { characters: true, places: true, themes: true }; });
  const data = pipeline.build(docs, {
    cats: CATEGORIES,
    people: ["許思明", "季穗", "阮青禾", "阿芒", "十九", "許望潮", "黎秋瓦", "鹽叔"],
    places: ["屏東恆春", "恆春半島", "恆春舊城", "龍磐", "後灣", "萬里桐", "港口溪", "枋寮車站", "鹹風標本室", "思明生活觀測所"],
    extraThemes: ["風與季節", "修理", "地方飲食", "海濱植物", "親密關係", "時間與記憶", "共享", "田野"],
    author: "許思明（虛構角色）",
    secret: false,
  });

  data.meta = {
    title: "思明的鹹風宇宙",
    docTitle: "思明的鹹風宇宙｜500 段公開虛構記憶",
    subtitle: "許思明（虛構角色） · 屏東恆春 · 2001—2026 · 20—45 歲 · 500 段公開記憶",
    pathPrefix: "",
    durationYears: 25,
    galaxyDesc: "每顆星都是許思明的一段虛構記憶。中心靠近二十歲，越往外越接近四十五歲；內側旋臂是海岸、家與親密，外側旋臂是器物、田野與遠行。",
  };
  data.span = [2001, 2026.999];
  data.prologue = [
    "許思明是一名女同志。這是她完全虛構的二十五年。",
    "許思明住在屏東恆春，把海岸植物、壞掉的器物、地方食譜和人的遲疑收進一間店。",
    "從二十歲到四十五歲，五百顆星記錄她怎樣離開、回來、相愛、分開、照顧家人，也學習讓一個地方共同保管記憶。",
    "每一段記憶都能公開點開閱讀全文。角色、親友、店舖、學校與事件皆屬虛構。",
  ];
  data.prologueSig = "—— 《思明的鹹風宇宙》，一部虛構生命志";
  data.eras = [
    { y: 2001, label: "2001—2003 · 離岸", short: "離岸", text: "二十歲的思明離開恆春，在一所虛構的藝術學院學材料、器物與植物，也認識了季穗。" },
    { y: 2004, label: "2004—2005 · 城市夜班", short: "夜班", text: "她在城市的水族館值夜班，後來騎車繞島，並在雨棚下遇見三腳黑狗十九。" },
    { y: 2006, label: "2006—2008 · 鹹風標本室", short: "開店", text: "回到恆春後，她把父親的舊電器行改成鹹風標本室，修器物，也保存種子與食譜。" },
    { y: 2009, label: "2009—2012 · 兩張車票", short: "分岔", text: "季穗選擇巡演，思明選擇留下。她們的愛情沒有壞掉，只是兩條路不再朝同一個方向。" },
    { y: 2013, label: "2013—2016 · 風不負責回答", short: "發射", text: "獨居、深夜廣播、民間雲圖與一隻失蹤八天的狗，讓她學會和沒有答案的生活相處。" },
    { y: 2017, label: "2017—2018 · 透明樣方", short: "靠近", text: "植物調查員阮青禾來到標本室。兩個人保留各自的房間，也慢慢把生活放進彼此的視野。" },
    { y: 2019, label: "2019—2020 · 地圖與門檻", short: "公共", text: "開發案與疫情改變店的尺度。思明從保管自己的東西，走向和鄰里共同保管一個地方。" },
    { y: 2021, label: "2021—2023 · 四十歲以後", short: "清楚", text: "她送走店裡的雜物、陪父親面對鬆動的記憶，也和青禾決定把沒有嬰兒房的房間做成種子庫。" },
    { y: 2024, label: "2024 · 四十種風", short: "和解", text: "舊愛季穗回來協作。思明發現過去不必消失，它也可以換一種關係留在現在。" },
    { y: 2025, label: "2025 · 泡水的索引", short: "共管", text: "暴雨毀壞紙本檔案，鄰居卻把濕透的卡片分回家晾曬。記憶第一次真正離開她一個人的手。" },
    { y: 2026, label: "2026 · 第五百張卡片", short: "公開", text: "四十五歲的思明成立生活觀測所，公開五百段記憶，並給明天留下一張空白卡片。" },
  ];

  const template = fs.readFileSync(VIEWER_TEMPLATE, "utf8");
  if (!template.includes("/*__DATA__*/")) throw new Error("viewer template data marker is missing");
  const html = template.replace("/*__DATA__*/", JSON.stringify(data).replace(/<\//g, "<\\/"));
  fs.writeFileSync(DEMO, html, "utf8");
  return data;
}

const memories = makeCorpus();
validateCorpus(memories);
writeCorpus(memories);
const data = await buildDemo(memories);

const lengths = memories.map(memory => memory.body.replace(/\s/g, "").length);
const categories = Object.fromEntries(CATEGORIES.map(category => [category.key, data.docs.filter(doc => doc.c === category.key).length]));
console.log(JSON.stringify({
  memories: memories.length,
  span: data.span,
  ages: [Math.min(...memories.map(memory => memory.age)), Math.max(...memories.map(memory => memory.age))],
  bodyChars: { min: Math.min(...lengths), max: Math.max(...lengths), average: Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length) },
  fullTextDocs: data.docs.filter(doc => doc.b && !doc.secret).length,
  categories,
}, null, 2));
