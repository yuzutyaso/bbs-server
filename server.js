// server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // CORS対策のため

// 環境変数を読み込む（.envファイルがある場合）
// .envファイルはGit管理から除外されます
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; // 環境変数PORTが設定されていなければ5000を使用

// --- ミドルウェアの設定 ---
app.use(cors()); // 他のオリジンからのリクエストを許可
app.use(express.json()); // JSON形式のリクエストボディをパースするためのミドルウェア

// --- データベース接続 ---
mongoose.connect(process.env.MONGODB_URI, {
    // useNewUrlParser と useUnifiedTopology はMongoose 6以降ではデフォルトでtrueのため不要ですが、
    // 互換性のため記載しても問題ありません。
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
})
.then(() => console.log('MongoDB に接続しました！'))
.catch(err => {
    console.error('MongoDB 接続エラー:', err.message);
    process.exit(1); // 接続に失敗したらプロセスを終了
});

// --- ルートの定義 ---
// ルートURLへのアクセス
app.get('/', (req, res) => {
    res.send('掲示板APIサーバーが稼働中です！');
});

// 投稿関連のAPIルート
const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter); // /api/posts へのリクエストを postsRouter で処理

// --- サーバー起動 ---
app.listen(PORT, () => {
    console.log(`サーバーはポート ${PORT} で稼働中です！`);
    console.log(`APIのベースURL: http://localhost:${PORT}/api/posts`);
});
