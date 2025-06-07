// server.js (変更後)
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

// --- ミドルウェアの設定 ---
app.use(cors());
app.use(express.json());

// --- データベース接続 ---
// Mongooseの接続をグローバルでキャッシュし、再利用するようにする
let cachedDb = null; // キャッシュされたデータベース接続

async function connectToDatabase() {
    if (cachedDb) {
        console.log('既存のデータベース接続を再利用します');
        return cachedDb;
    }

    console.log('新しいデータベース接続を確立します');
    try {
        const db = await mongoose.connect(process.env.MONGODB_URI, {
            // useNewUrlParser: true, // Mongoose 6以降は不要
            // useUnifiedTopology: true, // Mongoose 6以降は不要
            bufferCommands: false, // 接続がないときにコマンドをバッファリングしない (サーバーレス推奨)
            serverSelectionTimeoutMS: 5000, // サーバー選択のタイムアウト
            socketTimeoutMS: 45000, // ソケットのタイムアウト
        });
        cachedDb = db;
        console.log('MongoDB に接続しました！');
        return cachedDb;
    } catch (err) {
        console.error('MongoDB 接続エラー:', err.message);
        throw err; // エラーをスローしてVercelが問題を知るようにする
    }
}

// データベース接続ミドルウェア (各リクエストで接続を試みる)
app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (err) {
        res.status(500).json({ message: 'データベース接続に失敗しました。' });
    }
});


// --- ルートの定義 ---
app.get('/', (req, res) => {
    res.send('掲示板APIサーバーが稼働中です！ (Vercel)');
});

const postsRouter = require('./routes/posts');
app.use('/api/posts', postsRouter);

// VercelのためにExpressアプリをエクスポート
module.exports = app;

// ローカル開発用に、listen()を呼び出すための条件分岐
// Vercelはこれを無視するため、デプロイには影響しない
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`ローカル開発サーバーはポート ${PORT} で稼働中です！`);
        console.log(`APIのベースURL: http://localhost:${PORT}/api/posts`);
    });
}
