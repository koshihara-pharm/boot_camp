// 薬の一覧（名前と味）。何に混ぜていいかは、下の FACTS（自分の言葉のカード）にある。
// 病院の表そのもの（記号の並び）は、このリポジトリには置かない（docs/07「資料の使い方の方針」）。
const DRUGS = [
  { name: "アスベリンドライシロップ", taste: "甘い・オレンジ風味" },
  { name: "アスベリン散", taste: "無味・無香料" },
  { name: "アセトアミノフェン原末", taste: "苦い・無香料" },
  { name: "アレジオンドライシロップ", taste: "甘い＋苦い・ヨーグルト風味" },
  { name: "エリスロシンドライシロップ", taste: "甘い・バニラ風味" },
  { name: "オゼックス細粒", taste: "甘い・ストロベリー風味" },
  { name: "オノンドライシロップ", taste: "甘い・無香料" },
  { name: "オラペネム細粒", taste: "甘い＋やや苦い・ストロベリー風味" },
  { name: "カルボシステインDS", taste: "甘い・青りんご風味" },
  { name: "カロナール細粒", taste: "甘い、後に苦い・オレンジ風味" },
  { name: "キプレス細粒", taste: "わずかに甘い・無香料" },
  { name: "クラバモックスドライシロップ", taste: "甘い・ストロベリー風味" },
  { name: "クラリスドライシロップ", taste: "甘い＋やや苦い・ストロベリー風味" },
  { name: "ザジテンドライシロップ", taste: "甘い・ストロベリー風味" },
  { name: "ジスロマック細粒", taste: "甘い＋苦い・パイン・オレンジ風味" },
  { name: "シングレア細粒", taste: "わずかに甘い・無香料" },
  { name: "セファクロル細粒", taste: "甘い、やや苦い・オレンジ風味" },
  { name: "セフゾン細粒", taste: "甘い・ストロベリー風味" },
  { name: "タミフルドライシロップ", taste: "甘い・ミックスフルーツ風味" },
  { name: "テオドールドライシロップ", taste: "甘い・すもも風味" },
  { name: "トランサミン散", taste: "苦い・無香料" },
  { name: "ナウゼリンドライシロップ", taste: "甘い・無香料" },
  { name: "ビオフェルミンR散", taste: "甘い・無香料" },
  { name: "フロモックス細粒", taste: "甘い・ストロベリー風味" },
  { name: "ペリアクチン散", taste: "わずかに甘い・無香料" },
  { name: "ホスミシンドライシロップ", taste: "甘い・カルピス風味" },
  { name: "ミヤBM細粒", taste: "無味・無香料" },
  { name: "ムコダインドライシロップ", taste: "甘酸っぱい・ピーチ風味" },
  { name: "ムコサールドライシロップ", taste: "甘い・ヨーグルト風味" },
  { name: "メイアクトMS細粒", taste: "甘い＋わずかな苦味・バナナ風味" },
  { name: "メプチン顆粒", taste: "甘い・無香料" },
  { name: "ラックビー微粒N", taste: "わずかに甘い・無香料" },
  { name: "ワイドシリン細粒", taste: "甘い・ミックスフルーツ風味" },
];

// くすりの適正使用協議会「子どもにくすりをのませるコツ」（2022年4月21日。監修 石川洋一 明治薬科大学教授）
const RADAR_SOURCE = {
  name: "くすりの適正使用協議会「子どもにくすりをのませるコツ」2022年",
  url: "https://www.rad-ar.or.jp/knowledge/post?slug=how-to-get-your-child-to-take-medicine",
};

// 飲ませ方のコツ（年齢と薬の形で分ける）。中身は薬剤師が出どころと照らして確認する
// ages: 年齢（baby 赤ちゃん / toddler 1〜3歳 / kid 4歳から / all どの年齢でも）
// forms: 薬の形（powder 粉 / syrup シロップ / tablet 錠剤 / any どの形でも）。振り分けは 2026-10-25 にユーザー（薬剤師）が確認
const HOWTO = [
  {
    title: "少しの水でねって、ほっぺの内側にぬる",
    ages: ["baby"],
    forms: ["powder"],
    body: "粉薬に水を少したらして練り、だんごのようにします。ほっぺの内側や上あごにつけて、すぐに水や白湯を飲ませます。舌の先は苦味を感じやすいので避けます。粉薬がまだ上手に飲めない赤ちゃんに。",
    sources: [
      { name: "PMDA くすりQ&A", url: "https://www.pmda.go.jp/safety/consultation-for-patients/on-drugs/qa/0008.html" },
      { name: "千葉県こども病院", url: "https://www.pref.chiba.lg.jp/kodomo/shokai/documents/karu-08.pdf" },
    ],
  },
  {
    title: "少しの水でとかして、スポイトやスプーンで",
    ages: ["baby", "toddler"],
    forms: ["powder"],
    body: "飲ませる直前に少しの水でとかし、スポイトやスプーンで、ほっぺの内側に沿わせて少しずつ流しこみます。むせないように、上体を起こして飲ませます。はじめに多めの水でとくと、飲み残しのもとになります。",
    sources: [
      { name: "熊本市", url: "https://www.city.kumamoto.jp/kiji00331285/5_31285_410254_up_23WIW8YZ.pdf" },
      { name: "千葉県こども病院", url: "https://www.pref.chiba.lg.jp/kodomo/shokai/documents/karu-08.pdf" },
    ],
  },
  {
    title: "味の濃いものに混ぜる",
    ages: ["toddler", "kid"],
    forms: ["powder"],
    body: "チョコアイスやココアなど、味の濃いものの少しだけに混ぜると苦味が隠れやすくなります。混ぜたらすぐに飲ませます。ミルクやおかゆなど毎日の主食には混ぜません（それ自体を嫌いになることがあります）。何に混ぜていいかは、上の表で薬ごとに確かめてください。",
    sources: [
      { name: "熊本 くすりの話", url: "https://kmh.or.jp/wp/wp-content/uploads/2023/04/okusuri_14.pdf" },
      { name: "PMDA くすりQ&A", url: "https://www.pmda.go.jp/safety/consultation-for-patients/on-drugs/qa/0008.html" },
    ],
  },
  {
    title: "すっぱい飲み物・食べ物に注意",
    ages: ["all"],
    forms: ["powder"],
    body: "オレンジジュース、スポーツ飲料、乳酸菌飲料、ヨーグルトなどのすっぱいものに混ぜると、薬の表面のコーティングがはがれて苦くなったり、薬の量が減って効き目が弱まることがあります。抗生物質のドライシロップや顆粒に多いです。混ぜた薬は、置いておかずにすぐ飲ませます。",
    sources: [
      { name: "国立成育医療研究センター 薬剤部", url: "https://www.ncchd.go.jp/hospital/about/section/medicine/nomiawase.pdf" },
      { name: "PMDA くすりQ&A", url: "https://www.pmda.go.jp/safety/consultation-for-patients/on-drugs/qa/0008.html" },
    ],
  },
  {
    title: "服薬ゼリーで包む",
    ages: ["toddler", "kid"],
    forms: ["powder"],
    body: "器にゼリーを入れて薬をのせ、ゼリーで包みこむようにスプーンですくって飲ませます。フルーツ味のゼリーは、薬と混ぜると苦味を感じやすくなることがあります。抗生物質や苦い薬には、チョコ味など向けのものがあります。",
    sources: [
      { name: "龍角散 おくすり飲めたね（販売店の商品説明）", url: "https://netshop.create-sd.co.jp/shop/g/g4987240601838/" },
    ],
  },
  {
    title: "赤ちゃんは、おなかがすいているときに",
    ages: ["baby"],
    forms: ["any"],
    body: "乳児は、おなかがすいているとき（授乳の前など）のほうが飲ませやすく、吐きにくいとされています。おなかがいっぱいだと飲めずに吐いてしまうことがあります。",
    sources: [
      { name: "診断と治療社", url: "https://shindan.co.jp/np/filedata/00265800_23.pdf" },
      { name: "札幌市立病院", url: "https://www.city.sapporo.jp/hospital/medicine/howtotake_child.html" },
    ],
  },
  {
    title: "飲んだあとは口直し",
    ages: ["all"],
    forms: ["any"],
    body: "飲ませたあとに水やぬるま湯を飲ませて、口の中に残った薬を流します。このとき、ちゃんと飲みこめたか、吐き出していないかも見ておきます。",
    sources: [RADAR_SOURCE],
  },
  {
    title: "好きなキャラクターの容器で",
    ages: ["toddler"],
    forms: ["any"],
    body: "お子さんの好きなキャラクターの容器や、ふだん使わないめずらしい容器に入れると、楽しく飲んでくれることがあります。",
    sources: [RADAR_SOURCE],
  },
  {
    title: "笑顔で、飲めたらほめる",
    ages: ["all"],
    forms: ["any"],
    body: "親が心配そうだったりイライラしていたりすると、子どもは薬を「しかられる、いやなもの」と思うようになります。笑顔で、飲めたらほめて「うれしいこと」にします。シールを貼るなど、できた！と感じられる工夫もよいとされています。うまくいく方法はその日の気分でも変わるので、いくつか知っておくと楽です。",
    sources: [RADAR_SOURCE],
  },
  {
    title: "薬のことを話してあげる",
    ages: ["kid"],
    forms: ["any"],
    body: "言葉がわかるようになったら、「薬は病気を治すために使うもの」「飲むとよくなる」ことを、その子にわかる言葉で話してあげます。小学校に入るまでは、子どもだけで飲ませず、親が見て確かめます。",
    sources: [RADAR_SOURCE],
  },
  {
    title: "水で飲む「大人飲み」に挑戦",
    ages: ["kid"],
    forms: ["powder"],
    body: "大人の話が十分わかるようになったら、大人と同じように水で飲むことをすすめてみます。お友だちやきょうだいが水で上手に飲めていることを伝えると、やる気になることがあります。",
    sources: [RADAR_SOURCE],
  },
];

// 自分の言葉でまとめたカード（2026-10-18 から。すべての薬）
// 資料の事実だけを、自分の言葉と自分の分け方で書く。表や文章は写さない（docs/07「資料の使い方の方針」）。
// 食べ物は、2つの病院の資料の両方にある 8 つ（アイスクリーム、プリン、牛乳、お茶、ヨーグルト、りんごジュース、オレンジジュース、スポーツ飲料）だけを使う。
// 2つの資料にある薬の分け方:
//   good  = 飯塚が ○、成育が ● か ▲（混ぜても味は変わらない）
//   avoid = 飯塚が × で、成育も ×
//   split = それ以外（飯塚が ○/×、または2つの資料で評価がちがう）
// 1つの資料にしかない薬（basis: "iizuka" か "ncchd"）は、その資料の ○・●・▲ を good、× を avoid、○/× を split にする。
// 飯塚の ○/▼（味は問題ないが効き目に影響）は avoid にして、コツに理由を書く。
// good / split / avoid の text を省いたときは、index.html の決まった文が出る
const FACT_REFS = {
  pmdaQ8: { name: "PMDA くすりQ&A「Q8 赤ちゃんに医師から処方された粉薬を飲ませるよい方法を教えてください。」", url: "https://www.pmda.go.jp/safety/consultation-for-patients/on-drugs/qa/0008.html" },
  clarisLabel: { name: "クラリスドライシロップ10%小児用 添付文書（大正製薬、2026年3月改訂 第6版）", url: "https://www.pmda.go.jp/PmdaSearch/iyakuDetail/400059_6149003F1031_1_39" },
  iizuka: { name: "飯塚病院 薬剤部「散剤と飲食物の飲み合わせ（味）一覧」（2016年7月改訂）", url: "https://aih-net.com/yakuzaibu/kusurinomame/pdf/tekihihtou.pdf" },
  ncchd: { name: "国立成育医療研究センター 薬剤部「粉薬と服薬補助食品の飲み合わせ」（2018年）", url: "https://www.ncchd.go.jp/hospital/about/section/medicine/nomiawase.pdf" },
};

// どの薬にも出すコツ（PMDA Q8、成育の表の注意書き）
const TIP_JUST_BEFORE = "混ぜるのは、飲ませる直前に。混ぜたまま置いておくと、苦くなったり、効き目が落ちたりすることがあります。";
const TWO_TABLES = ["pmdaQ8", "iizuka", "ncchd"];
const CHECK_WAITING = "2026-10-18 に2つの病院の資料を見比べてまとめました（薬剤師の確認待ち）";
const ONE_TABLE_IIZUKA = ["pmdaQ8", "iizuka"];
const ONE_TABLE_NCCHD = ["pmdaQ8", "ncchd"];
const CHECK_ONE_TABLE = "2026-10-18 に1つの病院の資料をもとにまとめました（資料は1つだけ。薬剤師の確認待ち）";

const FACTS = {
  "クラリスドライシロップ": {
    taste: "ストロベリー風味・薬そのものは苦い",
    // 添付文書: 薬（原薬）は苦い。粉は苦味を防ぐように作られているが、酸性の飲み物で苦味が出ることがある
    point: "粉のまわりに、苦さを閉じこめる工夫がしてあります。酸っぱいものに混ぜると、その工夫がはがれて、苦さが出てきます。",
    good: {
      // アイスクリーム: 飯塚（○・メーカー推奨）、成育（●）。ココア: 飯塚（備考で○）、成育（●）
      foods: ["アイスクリーム", "ココア"],
    },
    split: {
      // プリン・牛乳: 飯塚（○/×）、成育（●）。お茶: 飯塚（○/×）、成育（▲）
      foods: ["プリン", "牛乳", "お茶"],
    },
    avoid: {
      // 添付文書（オレンジジュース、スポーツ飲料）、PMDA Q8（酸性の飲食物全般）、飯塚・成育（ヨーグルト、りんご、オレンジ、スポーツ飲料。乳酸菌飲料は成育）
      foods: ["ヨーグルト", "オレンジジュース", "りんごジュース", "スポーツ飲料", "乳酸菌飲料"],
      text: "酸っぱいものは苦くなります。メーカーの説明書でも、オレンジジュースやスポーツ飲料で飲むのは避けるように書かれています。",
    },
    tips: [
      // PMDA Q8（直前に混ぜる）、飯塚の備考（酸性のものは混ぜた直後から苦くなる）
      "混ぜるのは、飲ませる直前に。混ぜたまま置いておくと、苦くなることがあります。",
      // 飯塚の備考（オレンジジュースで力価が下がる）。1つの資料だけなので、出どころを書く
      "オレンジジュースでは、苦くなるだけでなく、効き目が下がるという報告もあります（飯塚病院の資料）。",
      // 添付文書 14.1.2（用時調製。保存は避け、やむを得ないときは冷蔵庫）
      "水でといたものは作りおきしないで、そのつど用意します。",
    ],
    refs: ["clarisLabel", "pmdaQ8", "iizuka", "ncchd"],
    checked: "薬剤師が確認しました（2026-10-18）",
  },
  "オノンドライシロップ": {
    taste: "甘い・味つけなし",
    point: "甘くてくせがないので、たいていのものに混ぜられます。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース"] },
    // スポーツ飲料: 飯塚（○/×）、成育（●）
    split: { foods: ["スポーツ飲料"] },
    tips: [
      TIP_JUST_BEFORE,
      // 飯塚の備考
      "メーカーは、できれば水で飲むことをすすめています（飯塚病院の資料）。",
    ],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "クラバモックスドライシロップ": {
    taste: "甘い・ストロベリー風味",
    point: "酸っぱいもの（ヨーグルトやオレンジジュース）でも飲みやすいとされています。牛乳とりんごジュースは苦手です。",
    good: { foods: ["アイスクリーム", "プリン", "ヨーグルト", "オレンジジュース"] },
    avoid: { foods: ["牛乳", "りんごジュース"] },
    tips: [TIP_JUST_BEFORE],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "ジスロマック細粒": {
    taste: "パイン・オレンジ風味・苦味がある",
    point: "酸っぱい飲み物は、2つの資料のどちらでも飲みにくくなるとされています。2つの資料がそろって「飲みやすい」としているのは、アイスクリームです。",
    good: { foods: ["アイスクリーム"] },
    // プリン・牛乳: 飯塚（○/×）、成育（●）。お茶・ヨーグルト: 飯塚（○/×）、成育（×）
    split: { foods: ["プリン", "牛乳", "お茶", "ヨーグルト"] },
    avoid: { foods: ["オレンジジュース", "りんごジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "セフゾン細粒": {
    taste: "甘い・ストロベリー風味",
    point: "そのままでもおいしく、どれに混ぜても飲みやすいとされています。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [
      TIP_JUST_BEFORE,
      // 飯塚の備考
      "鉄が入った粉ミルクなどと一緒だと、うんちが赤っぽくなることがあります（飯塚病院の資料）。",
    ],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "タミフルドライシロップ": {
    // 飯塚は「甘い」、成育は「苦い」
    taste: "フルーツ風味・苦く感じることがある",
    point: "混ぜて飲みやすくなるものが少ない薬です。2つの資料がそろって「飲みやすい」としているのは、ココアです。",
    // ココア: 飯塚（備考で○）、成育（●）
    good: { foods: ["ココア"] },
    // アイス: 飯塚（○/×）、成育（×）。ヨーグルト・オレンジ・スポーツ飲料: 飯塚（○/×）、成育（●）
    split: { foods: ["アイスクリーム", "ヨーグルト", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["プリン", "牛乳", "お茶", "りんごジュース"] },
    tips: [TIP_JUST_BEFORE],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "ペリアクチン散": {
    // 飯塚は「わずかに甘い」、成育は「苦い」
    taste: "味つけなし・苦く感じることがある",
    point: "甘いもの（アイス、プリン、牛乳）は飲みやすく、酸っぱいものとお茶は苦手です。",
    // アイス・牛乳: 飯塚（○）、成育（▲）。プリン: どちらも ○ / ●
    good: { foods: ["アイスクリーム", "プリン", "牛乳"] },
    avoid: { foods: ["お茶", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "ムコサールドライシロップ": {
    taste: "甘い・ヨーグルト風味",
    good: { foods: ["アイスクリーム", "牛乳", "お茶", "ヨーグルト"] },
    // プリン・スポーツ飲料: 飯塚（○/×）、成育（×）
    split: { foods: ["プリン", "スポーツ飲料"] },
    avoid: { foods: ["りんごジュース", "オレンジジュース"] },
    tips: [
      TIP_JUST_BEFORE,
      // 飯塚の備考
      "牛乳に混ぜると、全体が甘くなります（飯塚病院の資料）。",
    ],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "メイアクトMS細粒": {
    taste: "バナナ風味・わずかに苦い",
    point: "2つの資料で評価が分かれることが多い薬です。とくにオレンジジュースは、片方は「飲みにくい」、もう片方は「飲みやすい」と、正反対です。迷ったら薬剤師に聞いてください。",
    // 飯塚は ○/× が多く、成育と合わない。どちらも ○ / ● か、どちらも × の食べ物はない
    split: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "ワイドシリン細粒": {
    taste: "甘い・フルーツ風味",
    point: "甘くて、たいていのものに混ぜられます。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "りんごジュース", "オレンジジュース"] },
    // お茶: 飯塚（○/×）、成育（●）。ヨーグルト・スポーツ飲料: 成育の資料の中で、1ページ目（●）と2ページ目（飲みにくくなる）が合わない
    split: { foods: ["お茶", "ヨーグルト", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: TWO_TABLES,
    checked: CHECK_WAITING,
  },
  "アスベリンドライシロップ": {
    basis: "ncchd",
    point: "そのままでも飲みやすい薬です（成育医療センターの資料）。",
    good: { foods: ["アイスクリーム", "プリン", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    split: { foods: ["お茶"] },
    avoid: { foods: ["牛乳"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "アスベリン散": {
    basis: "iizuka",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "オレンジジュース"] },
    split: { foods: ["スポーツ飲料"] },
    avoid: { foods: ["りんごジュース"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "アセトアミノフェン原末": {
    basis: "iizuka",
    point: "苦い粉です。",
    good: { foods: ["アイスクリーム", "ヨーグルト"] },
    avoid: { foods: ["プリン", "牛乳", "お茶", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "アレジオンドライシロップ": {
    basis: "iizuka",
    good: { foods: ["アイスクリーム", "牛乳", "ヨーグルト"] },
    tips: [TIP_JUST_BEFORE, "チョコレートシロップやミルクココアでも飲みやすいとされています（飯塚病院の資料）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "エリスロシンドライシロップ": {
    basis: "ncchd",
    good: { foods: ["アイスクリーム", "プリン", "牛乳"] },
    avoid: { foods: ["お茶", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "オゼックス細粒": {
    basis: "iizuka",
    good: { foods: ["アイスクリーム", "プリン", "りんごジュース"] },
    avoid: { foods: ["牛乳", "ヨーグルト", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE, "牛乳は、味は問題ありませんが、効き目に影響することがあります。混ぜる前に薬剤師に聞いてください（飯塚病院の資料）。", "イチゴジャム、ココア、ピーナッツクリームでも飲みやすいとされています（飯塚病院の資料）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "オラペネム細粒": {
    basis: "iizuka",
    point: "酸っぱいものに混ぜると、苦くなります（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶"] },
    split: { foods: ["りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["ヨーグルト"] },
    tips: [TIP_JUST_BEFORE, "ココアやはちみつでも飲みやすいとされています（飯塚病院の資料）。1歳未満の赤ちゃんには、はちみつを使わないでください（PMDA）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "カルボシステインDS": {
    basis: "iizuka",
    good: { foods: ["アイスクリーム", "牛乳", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["お茶"] },
    tips: [TIP_JUST_BEFORE, "ピーチジュースや乳酸菌飲料でも飲みやすいとされています（飯塚病院の資料）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "カロナール細粒": {
    basis: "ncchd",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶"] },
    avoid: { foods: ["ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "キプレス細粒": {
    basis: "iizuka",
    point: "食べ物との相性は、参考にした資料には載っていません。",
    tips: ["光に弱く、とかしてから時間がたつと薬が分解されます。開けたら15分以内に飲みきります（飯塚病院の資料）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "ザジテンドライシロップ": {
    basis: "iizuka",
    point: "薬そのものが甘いので、そのままでも飲みやすい薬です（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "プリン", "スポーツ飲料"] },
    split: { foods: ["牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "シングレア細粒": {
    basis: "ncchd",
    point: "そのままでも飲みやすい薬です（成育医療センターの資料）。",
    good: { foods: ["牛乳", "ヨーグルト"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "セファクロル細粒": {
    basis: "ncchd",
    good: { foods: ["プリン", "牛乳", "ヨーグルト"] },
    avoid: { foods: ["アイスクリーム", "お茶", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "テオドールドライシロップ": {
    basis: "ncchd",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["お茶"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "トランサミン散": {
    basis: "iizuka",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース"] },
    avoid: { foods: ["スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "ナウゼリンドライシロップ": {
    basis: "iizuka",
    point: "ほとんどが砂糖でできていて甘いので、そのまま飲むのがおすすめです。酸っぱい飲み物にとかすと苦くなります（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳"] },
    split: { foods: ["お茶", "ヨーグルト"] },
    avoid: { foods: ["りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "ビオフェルミンR散": {
    basis: "iizuka",
    point: "薬そのものが甘いので、そのままでも飲みやすい薬です（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["お茶"] },
    tips: [TIP_JUST_BEFORE, "熱いものに混ぜないでください。約40℃をこえると乳酸菌が死んでしまいます（飯塚病院の資料）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "フロモックス細粒": {
    basis: "iizuka",
    point: "一番のおすすめは、粉をそのまま口に入れて、好きな飲み物で流しこむ飲み方です。飲み物の中にしばらく置くと、苦く・しぶくなります（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "牛乳", "お茶", "ヨーグルト"] },
    split: { foods: ["りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["プリン"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "ホスミシンドライシロップ": {
    basis: "iizuka",
    point: "薬そのものの味がよく、たいていのものに混ぜられます（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "オレンジジュース", "スポーツ飲料"] },
    split: { foods: ["りんごジュース"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "ミヤBM細粒": {
    basis: "iizuka",
    point: "薬そのものに味がないので、食べ物の味をこわしません（飯塚病院の資料）。",
    good: { foods: ["アイスクリーム", "牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
  "ムコダインドライシロップ": {
    basis: "ncchd",
    good: { foods: ["アイスクリーム", "牛乳", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    avoid: { foods: ["プリン", "お茶"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "メプチン顆粒": {
    basis: "ncchd",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "お茶", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    tips: [TIP_JUST_BEFORE],
    refs: ONE_TABLE_NCCHD,
    checked: CHECK_ONE_TABLE,
  },
  "ラックビー微粒N": {
    basis: "iizuka",
    good: { foods: ["アイスクリーム", "プリン", "牛乳", "ヨーグルト", "りんごジュース", "オレンジジュース", "スポーツ飲料"] },
    split: { foods: ["お茶"] },
    tips: [TIP_JUST_BEFORE, "水や熱に長くさらすと、菌が減ってしまいます。熱いものには混ぜないでください（飯塚病院の資料）。"],
    refs: ONE_TABLE_IIZUKA,
    checked: CHECK_ONE_TABLE,
  },
};
