# N2 道場 每日教材（定时任务按这个做）

目标：每天晚上给**明天**写一套 JLPT N2 教材，配好 VOICEVOX 音、发布到 https://claude.ai/artifact/EKQaCRWDmbdHj3n8uuTWLA 。

学生：准备 2027-07-04 的 N2。N3 语法扎实，N2 语法刚起步，**汉字读音是最大短板**。要的是“教会”，不是只给答案。

## 步骤

1. 定日期：`D=$(date -v+1d +%Y-%m-%d)`。**如果 `packs/$D.json` 已经存在（这一天已经做好发布过，或是用 tools/enrich 手工写的），什么都不要改**，在 daily.log 记「$D 已有，跳过」就结束。否则，如果 `packs/base/$D.json` 已经存在且 `node tools/check.js packs/base/$D.json` 通过，直接跳到第 4 步（只补配音和发布）。
1.5 先同步公开仓库：`node tools/public.js pull`。它会把别人（比如 ChatGPT）在 GitHub 仓库 GabrielTeufelchen/n2-dojo 里改过的 index.html / songs / packs 拿回本地（教材放进 packs/override/），输出里会列出来；有的话在 daily.log 记一笔。
2. 看上下文：`node tools/context.js $D`。里面有周主题、当天轮换的题型（rotation）、最近用过的单词（不能重复）、用过的文化题目、上一集大人の会話的最后几句。再打开前一天的 `packs/<日期>.json` 看一眼风格和难度。
3. 写 `packs/base/$D.json`（完整一套，不另写 enrich 文件）。结构和现有的 `packs/2026-10-24.json` 完全一样，按下面的“内容要求”。写完跑 `node tools/check.js packs/base/$D.json`，有问题就改到通过。
4. 跑 `bash tools/daily.sh $D`：检查 → 合并 → 配音（引擎没开会自己开、用完关掉）→ 生成 `audio/publish.json`。
   - 输出里有「读音需要核对」时逐条看：英文、数字、长音写法不同可以忽略；真读错的（比如 言って 读成 げんって）就在 `tools/voice.js` 的 `NAME_KANA`（强制用假名读）或 `TEXT_FIX` 里加规则，再跑一次 `bash tools/daily.sh $D`。
5. 发布：
   - 先 `Artifact action=read url=https://claude.ai/artifact/EKQaCRWDmbdHj3n8uuTWLA`（定时任务是新会话，不读一次发布会被拒）。如果线上的 index.html 和本地 `index.html` 不一样，以本地为准、但要在日志里记一笔。
   - 再 `Artifact publish`：`url` 同上，`file_path` = 本地 `index.html`，`files` = `audio/publish.json` 的内容（里面的 null 表示删除旧文件），`label` = "每日教材 $D"。不要传 capabilities、icon。
5.5 推送公开网页：`node tools/public.js push "每日教材 $D"`（推到 https://gabrielteufelchen.github.io/n2-dojo/ ）。失败就记进 daily.log，不影响 artifact。
6. 在 `tools/daily.log` 末尾追加一行：日期、是否成功、题型轮换、有没有手动修过读音、发布的版本号。

失败时（引擎起不来、发布被拒等）：不要硬来，把原因写进 daily.log，`packs/base/$D.json` 留着，下次运行会从第 4 步接着做。

## 内容要求

全部原创，不用真实作品台词、角色名、真实人名。题目难度贴近 N2 真题。每道选择题都有：
- `explain`：中文，指出原文/题干里的依据（引用关键句，日语部分带 `{漢字|かな}`）。
- `why`：数组，长度 = 选项数，逐个说明对或错的原因（对的那个以「✓」开头）。常见陷阱要点名：长音促音浊音、送假名、自他动词、授受方向、被动使役、近音近形词。
- `point`：一句能背下来的规律或技巧。
- 正确答案的位置要分散（每关里 0～3 都要出现）。

日语正文（听力台词、例句、跟读、读解、大人の会話、explain 里引用的日语）里**每个含汉字的词**写成 `{漢字|ひらがな}`，读音必须准确。题目的 q 和 options 不加标记（考试原样）。

各部分（数量照写）：
- `listening`：4 段。
  - 前三段 `kind` = news / anime / drama，`label` = ニュース / アニメ風 / ドラマ風，`task` 写 N2 题型名（ポイント理解 等），每段 5～8 句，3 题，每段一条 `tip`（听力技巧）。尽量用对话、贴近考试。
  - 第四段 `kind: "exam"`, `label: "試験形式"`, `task` = rotation.listeningExam。按真题格式：第一句 `ナレーター` 说场景（問題1 課題理解 还要先读问题），中间是对话，最后 `ナレーター` 再读一遍问题；1～2 题。说话人用 `男` `女` `男の学生` `女の学生` `店長` `男の店員` `女の店員` `ナレーター` 这些（已经配好声线）。**新角色名一定要在 tools/voice.js 的 CAST 里指定声线**（男女、年龄要对；同一段对话里两个人不能同一个声线），否则会随机分配，可能男角色配成女声。
- `reading`：`type` = rotation.reading，`title`、`tip`、`text`（段落数组，合计 250～450 字；統合理解写成 A、B 两段，情報検索写成通知/表格式条目）、`zh`（全文中文意思）、`questions` 2 题。
- `vocab`：10 个 N2 词（不能和 avoidVocab 重复），字段 w r pos zh ex exzh note；note 写读音陷阱、搭配或易混词。
- `grammar`：2 个，贴合本周主题，字段 pt zh form teach examples quiz；teach ≥4 条 `{h,t}`（一句话／接续／和相似语法的区别／考试怎么考）；examples 2 句；quiz 2 题。
- `shadow`：6 句；`roleplay`：scene goal partner（以「角色：」开头）model modelzh。
- `arena`：按题号排序，每关 5 题：問題1 漢字読み、問題2 表記、rotation.arena 里的两关、問題4 文脈規定、問題7 文法形式、問題8 文の組み立て、最后 `聴解 問題4 即時応答`（`reply: true`，3 个选项）。
  - 問題1 题干把考查词放在【】里；問題5 也用【】。
  - 問題3 語形成：前缀/后缀（不・非・無・未、〜化・〜感・〜者・〜がち 等）。
  - 問題6 用法：q 只写那个词，options 是 4 个用它的句子；干扰句写成“近音近形词该出现的地方”。
  - 問題8：q 用 ＿＿ 表示空、★ 表示问的那个；explain 写出完整句子、中文意思和排序理由（不需要 why）。
  - 問題9 文章の文法：这一关多一个 `passage`（段落数组，200～350 字，含（ 1 ）～（ 5 ）），items 的 q 就写「（ 1 ）」等，考接续词、授受、文末表达、指示词。
- `culture`：title body（中文 3 段）words fact；贴合季节、节日、动漫圣地巡礼或冷知识，不要和 usedCulture 重复。
- `adult`：レン×ユウト 恋爱连载，接着 lastAdult 写下一集。成年男性之间，有情感深度和性张力，可以写身体接触、接吻、过夜和事后的对话，不写露骨的器官和动作描写。16～20 句，notes 8～10 条（口语、男性用语、能用在考试里的语法）。
- `theme` = context 里的 theme；周末（weekend）可以写成本周复习「まとめ」。

## 追加进阶路线（用户于2026-10-27要求）

现有教材保持不动。在独立的 `grammar-path.json` 追加“每日进阶”，每周6个不同的新重点＋1次混合复习，间隔复习为D+1、D+3、D+7。始终保有未来至少7天完整课程，按文件中的roadmap阶段选内容。每课2个注音例句＋2题，简短说明意义、接续与易混点。不得改写已发布的lesson ID或题序；原配音不变。详见README“每日进阶”。原周主题课与进阶路线并存，不把旧周主题当作进阶路线的唯一选题依据。
