# 使用状況の見方（Clarity と Google アナリティクス）

サイト（https://koshihara-pharm.github.io/boot_camp/ ）が、どれだけ、どう使われたかを見る方法。
サイトには Microsoft Clarity と Google アナリティクス（GA4）の両方が入っている（docs/17 の 6）。

- **Clarity**: どこを押したか、押しても反応しなかった場所、連打。録画で使われ方を見る
- **GA4**: 何人が開いたか、どこから来たか（X、GitHub など）、ブラウザ

心がまえ 6「意見より、利用と支払いを見る」のための数字。週報や Slack で話すときの元にする。

**見た結果と考察は [docs/shiyou_joukyou.html](shiyou_joukyou.html) にためる**（2026-11-05 ユーザーの指示。定期的に見るので、見やすい HTML にした）。いちばん新しい記録、前回からの増減、推移の表、前の記録が1ページで見られる。

Claude が記録を足す手順:
1. 下の「1. Claude に頼むとき」のとおり、Clarity と GA4 の数字を集める
2. docs/shiyou_joukyou.html の `RECORDS` のいちばん上に、1件足す（項目は HTML の中の説明のとおり）
3. 考察は、数が少ないうちは「仮説」と書く。前の記録の「次にやること」がどうなったかも見る
4. 市区町村など、住んでいる所が分かる数字は書かない

## すぐ開くための URL（ブックマークしておく）

Microsoft のアカウントでログインしていれば、下の URL をそのまま開ける（2026-11-05 に開けることを確かめた）。Clarity の中のプロジェクト名は「こどもおくすり」。

| 見たいもの | URL |
|---|---|
| Clarity ダッシュボード（回数・人数・反応しないクリック） | https://clarity.microsoft.com/projects/view/z5py1akpjj/dashboard |
| Clarity 録画（レコーディング） | https://clarity.microsoft.com/projects/view/z5py1akpjj/impressions |
| Clarity ヒートマップ | https://clarity.microsoft.com/projects/view/z5py1akpjj/heatmaps |
| GA4 ホーム | https://analytics.google.com/analytics/web/#/a414238281p561741887/reports/intelligenthome |

- ブックマークのしかた（PC の Chrome）: URL を開いて、アドレスバーの右の ☆ を押す。4つをブックマークバーの1つのフォルダ「使用状況」に入れておくと、1回押すだけで開ける
- スマホ: Chrome や Safari で URL を開き、「ホーム画面に追加」にする
- 最初は「過去3日間」で開く。期間は画面の上の「過去 3 日間」から変えられる
- 開けないとき: clarity.microsoft.com を開いて Microsoft のアカウントでログインし、プロジェクトの一覧から「こどもおくすり」を選ぶ

## 1. Claude に頼むとき

「使用状況を見て」と頼めばよい。Claude は次のように見る。

### Clarity: コネクタで見る（画面は使わない）

- Claude Code の「Microsoft Clarity」コネクタを使う。Clarity のデータを、画面を通さずに直接もらう
  - コネクタは「clarity」と「Microsoft Clarity」の2つが入っている。2026-11-05 は「clarity」がエラーになり、「Microsoft Clarity」で取れた
- **数字**: 「直近3日の回数と人数」「端末ごとの数」「日ごとの数」のように、1回に1つずつ聞く。**数字が取れるのは直近3日まで**
- **録画の一覧**: 日付をしぼって（例: 7日分）もらう。押されたボタンの文字、反応しなかったクリック（Dead click）、連打（Rage clicks）が入っている。量が多いので、Claude が小さなプログラムで数える
- 録画を動画として見るわけではない。「どこを押したか」の文字のデータを数える
- 検索欄に入れた文字は「•••••」と隠れていて、データに入らない

### GA4: Claude in Chrome で画面を見る

- GA4 はコネクタがないので、Claude in Chrome（ユーザーの Chrome）で GA4 の画面を開いて読む。ユーザーが Chrome で Google にログインしていることが前提
- ホーム: https://analytics.google.com/analytics/web/#/a414238281p561741887/reports/intelligenthome
  - 直近7日の、イベント数・表示回数・アクティブユーザー、国、どこから来たか（チャネル、参照元）、市区町村が1ページで見られる
- ブラウザ別: 同じ URL の末尾を `reports/explorer?r=user-technology-detail` にする（直近28日）

## 2. 自分で見るとき

### Clarity（上の URL から）

1. ダッシュボードの URL を開く（プロジェクト「こどもおくすり」が開く）
2. **ダッシュボード**: 回数、人数、反応しなかったクリック、連打の数
3. **ヒートマップ**: トップページのどこがよく押されたかを色で見る
4. **録画**: 1回ずつの使われ方を動画で見る。「連打あり」「反応しないクリックあり」でしぼると、困った場面が見つかる
- 録画は30日で消える

### GA4（上のホームの URL）

1. ホームで、左下の期間（「過去 7 日間」）を選ぶ
2. 「アクティブ ユーザー」が開いた人の数、「表示回数」が開かれた回数
3. 「セッションの参照元 / メディア」: `t.co` は X、`github.com` は GitHub（名簿・週報など）、`(direct)` は LINE やブックマークなど元が分からないもの

### 気をつけること

- **自分の分も入る**。PC での確認、localhost での確認（Clarity）、開いたままの長い録画は、自分の可能性が高い。数字は「自分を含む」と考える
- 配るリンクには、どこから来たかの印（`?from=…`）をつける。下の「印つきのリンク」を見る
- 市区町村は GA4 で見られるが、自分の住んでいる所が分かるので、リポジトリや Slack に書かない

### 印つきのリンク（どこから来たかを分ける）

GA4 の「参照元」では、LINE や QR から来た人は `(direct)` にまとまって分からない。配るときにリンクの後ろに印をつけて分ける（2026-11-05 ユーザーの指示）。サイトのコードは直さない。

| 配る場所 | 配るリンク |
|---|---|
| X に貼る | https://koshihara-pharm.github.io/boot_camp/?from=x |
| LINE で送る | https://koshihara-pharm.github.io/boot_camp/?from=line |
| 親に見せる QR コード（[card/qr_site.png](../card/qr_site.png)。紙でも、スマホの画面でも、サイトの QR の欄でも、この1枚を使う。2026-11-05 ユーザーの判断） | https://koshihara-pharm.github.io/boot_camp/?from=qr |

- 新しい配り方を始めるときは、`?from=` の後ろに短い英字の印を決めて、この表に1行足す。同じ配り方には、いつも同じ印を使う
- 印は、画面を切り替えても URL に残る（Clarity の録画で `?from=x#` のように残っているのを、2026-11-05 に確かめた）
- 印をつけたリンクを受け取った人が、さらにほかの人へ送ると、その人も同じ印で数えられる。数は「その配り方から広がった分」も含むと考える

見方:
- **Clarity**: 録画またはダッシュボードの「フィルター」→「入口の URL」（Entry URL）で「含む」を選び、`from=qr` のように入れる。Claude に頼むときは「QR から来た人の録画」と言えばよい（コネクタの entryUrls で `from=qr` を含むものにしぼる）
- **GA4**: 左の「レポート」→「エンゲージメント」→「ページとスクリーン」を開き、表の左上の項目を「ページパスとスクリーン クラス」から「ページパスとクエリ文字列」に変える。表の上の検索に `from=qr` と入れると、QR から開いた回数が出る

## 3. 記録（見た日ごと）

docs/shiyou_joukyou.html に移した（2026-11-05 の記録から）。
