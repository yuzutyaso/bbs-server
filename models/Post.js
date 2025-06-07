// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'タイトルは必須です。'], // バリデーションメッセージ
        trim: true // 前後の空白を削除
    },
    content: {
        type: String,
        required: [true, '本文は必須です。'],
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', PostSchema);
