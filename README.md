# Life Cosmos · 一個生命體的宇宙

把多年的日記，變成一座可以走進去的宇宙。

每段記憶是一顆星；生命裡反覆出現的人、地方和主題成了恆星；相隔多年卻說著同一件事的兩段記憶，會被一道「回聲」連起來。

這個專案有兩個部分：

- **示範宇宙** `demo/`：陳嘉暐「數位分身」記憶庫的公開版。217 段記憶、2002–2026，**全文秘密**，只看得到標題與一句摘要。
- **宇宙產生器** `builder/`：用你自己的日記建一座。全部在瀏覽器裡完成，日記不會上傳到任何地方。

> 線上版：[Life Cosmos · 一個生命體的宇宙](https://weisfx0705.github.io/life-cosmos/)

---

## 用你的日記建一座宇宙

### 線上（最簡單）

打開網站，點「用你的日記建造宇宙」，然後：

1. **放入日記**：拖進一個資料夾，或選 `.md`、`.txt`、`.docx`、`.zip`。
   在 Google Drive 對資料夾按「下載」，會得到一個 zip（Google 文件會變成 `.docx`），直接拖進來即可。
2. **認出人和地方**：工具列出在多篇日記裡反覆出現的詞，點「人」「地」「題」告訴它是什麼。
3. **補 YAML**：每篇開頭需要標題、日期、分類、一句摘要與心情。缺的用規則先補（金色標籤標出來源）。點每一列的「全文」會打開那篇文章：上方可以改所有欄位，中間即時顯示下載後檔案開頭的 YAML，下方是全文；按「確認並看下一篇」可以一路往下確認，鍵盤 ← → 切換、Esc 關閉。格式見 [docs/yaml.md](docs/yaml.md)。
4. **生成宇宙**：預覽、全螢幕打開，或下載成一個單一的 HTML 檔（雙擊就能開）。勾選「公開版」會拿掉全文，適合分享。

### 存檔：下載的 zip 才是存檔

這個頁面不會替你保存任何東西。表格裡的修改、第 2 步的標記，都只存在這個分頁的記憶體裡；重新整理或關掉分頁就會消失（還有沒下載的修改時，頁面右下角會提醒，關頁前也會跳出確認）。

| 東西 | 存在哪裡 | 會保留多久 |
| --- | --- | --- |
| 你原本的日記檔 | 你的電腦 | 永遠不會被改動（頁面只讀不寫） |
| 表格裡的編輯、人與地方的標記 | 這個分頁的記憶體 | 暫時：關掉就沒了 |
| 下載的 `diaries-with-yaml.zip` | 你的下載資料夾 | 永久，可以帶到任何電腦 |
| 下載的宇宙 HTML | 你的下載資料夾 | 永久的快照，不會隨日記更新 |

zip 裡每篇日記都帶著完整的 YAML，另外附一個 `cosmos-settings.json`，記下宇宙主人、公開版與否、關掉的主題、你標記的人／地方／主題、略過的詞、你在全文視窗裡親手改過的清單，以及哪些欄位還沒確認。下次把整個 zip 拖回來（換一台電腦也可以），會接著上次的進度。記得用下載的版本取代原本的日記檔。

### 離線（Mac / Windows）

下載這個專案（GitHub 上的 Code → Download ZIP），解壓縮後雙擊 `builder/index.html`。
讀 `.docx` 與 `.zip` 需要網路載入兩個函式庫（JSZip、mammoth），`.md` 與 `.txt` 完全離線也能用。

### 你的日記去了哪裡？

哪裡都沒去。這是一份靜態網頁，沒有伺服器、沒有帳號、不需要任何 API 金鑰。所有讀取、整理和計算都在你的瀏覽器裡發生，關掉分頁就消失。產生的宇宙檔案只存在你下載的地方。

---

## 它怎麼運作

```
你的日記（.md / .txt / .docx / zip）
  │ 1. 找出反覆出現的詞 → 你確認誰是人、哪裡是地方
  │ 2. 讀取 YAML；沒有的欄位用規則補上（檔名日期、第一句、子資料夾、關鍵字），你逐篇對照全文確認
  │ 3. 內建主題字典比對（家庭、旅行、工作、身體與健康……）
  │ 4. 算出回聲（相隔三年以上、共享兩個以上引力的記憶）、星座、恆星
  ▼
一個單一 HTML：資料和畫面都在裡面
```

三種視角：

| 視角 | 看到什麼 |
| --- | --- |
| 時間銀河 | 中心是你，越往外越接近現在；內側旋臂是生活與感情，外側旋臂是工作與創作。可以從第一篇日記開始播放。 |
| 主題星座 | 依生命篇章分群，時間先放一邊。左側軌道面板可以獨奏（S）或靜音（M）某一類記憶。 |
| 恆星系 | 最常出現的人、地方、主題成了恆星，記憶繞著最牽動它的那顆公轉；被兩顆恆星牽住的，停在中間的引力橋上。 |

聲音全部由瀏覽器即時合成；R 還原宇宙、F 全螢幕。

### 和原版的差別

示範宇宙來自陳嘉暐的數位分身：二十多年的日記先用 [graphify](https://github.com/safishamsi/graphify) 建成知識圖譜，由 Claude 逐篇讀過、抽出人物與主題，再人工調整生命篇章。這個公開的產生器刻意**不用 AI**，改用關鍵字規則和你的確認，換來完全離線、零成本、零上傳。結果會比原版粗糙一些，你補得越完整的 YAML，宇宙就越準。

---

## 專案結構

```
index.html             首頁
demo/index.html        示範宇宙（公開版，全文秘密）
builder/               宇宙產生器
  index.html             介面
  pipeline.js            讀取、補 YAML、找人名、建宇宙（純函式）
  app.js                 介面邏輯
  viewer-template.js     由 viewer/template.html 產生
  samples.js             由 samples/ 產生
viewer/template.html   宇宙的畫面（資料放在 /*__DATA__*/）
samples/               虛構的範例日記（小安，2010–2026）
docs/yaml.md           YAML 格式說明
tools/                 重新產生 viewer-template.js 與範例
```

改了 `viewer/template.html` 之後執行 `python3 tools/embed_viewer.py`；改了範例之後執行 `python3 tools/make_samples.py`。

更新 `builder/` 裡的程式後，把 `builder/index.html` 引用各個 `.js` 的 `?v=` 版本號改成新的日期，使用者的瀏覽器才不會繼續用快取的舊版。

### 放上 GitHub Pages

Repository → Settings → Pages → Source 選 `Deploy from a branch`，branch 選 `main`、資料夾 `/ (root)`。

## 接下來

- 直接連 Google Drive（Google Picker，免下載 zip）
- 選用的 AI 模式：填自己的金鑰，讓摘要、人物與主題更準
- 英文介面

---

**English.** Life Cosmos turns a folder of diaries into a universe you can walk through: every memory a star, the people, places and themes that keep returning become suns, and memories years apart that say the same thing are joined by an echo. `demo/` is the public edition of Chia-wei Chen's digital-twin archive (titles and one-line summaries only, never the full text). `builder/` lets anyone build their own from `.md`, `.txt`, `.docx` or a zip, entirely in the browser — no server, no account, no API key, nothing uploaded.

MIT License · 示範宇宙中的日記內容不在授權範圍內。
