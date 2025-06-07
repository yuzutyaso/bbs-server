from flask import Flask, render_template, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from config import Config
from forms import RegistrationForm, LoginForm, PostForm

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login' # 未ログイン時にリダイレクトされるビュー

# models.py で定義されたモデルをインポート
# circular importを防ぐため、ここではfrom models import User, Post のように直接インポートせず
# アプリケーションの初期化後にインポートする、または__init__.pyで管理する方法もありますが、
# 今回はシンプルさのために直接インポートします。
# 実際には、models.pyでdbを初期化し、app.pyでdbを初期化する前にインポートするのが一般的です。

# UserとPostモデルはmodels.pyに記述します。

@login_manager.user_loader
def load_user(user_id):
    from models import User # circular import を避けるためここにインポート
    return User.query.get(int(user_id))

@app.before_request
def create_tables():
    db.create_all()

@app.route('/')
def index():
    from models import Post # circular import を避けるためここにインポート
    posts = Post.query.order_by(Post.date_posted.desc()).all()
    return render_template('index.html', posts=posts)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        from models import User # circular import を避けるためここにインポート
        hashed_password = generate_password_hash(form.password.data, method='pbkdf2:sha256')
        user = User(username=form.username.data, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        flash('アカウントが作成されました！ログインしてください。', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='新規登録', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        from models import User # circular import を避けるためここにインポート
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash('ログインに成功しました！', 'success')
            return redirect(next_page or url_for('index'))
        else:
            flash('ログインに失敗しました。ユーザー名またはパスワードを確認してください。', 'danger')
    return render_template('login.html', title='ログイン', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('ログアウトしました。', 'info')
    return redirect(url_for('index'))

@app.route('/post/new', methods=['GET', 'POST'])
@login_required
def new_post():
    form = PostForm()
    if form.validate_on_submit():
        from models import Post # circular import を避けるためここにインポート
        post = Post(content=form.content.data, author=current_user)
        db.session.add(post)
        db.session.commit()
        flash('投稿が作成されました！', 'success')
        return redirect(url_for('index'))
    return render_template('post.html', title='新しい投稿', form=form)

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # アプリケーションコンテキスト内でテーブルを作成
    app.run(debug=True)
