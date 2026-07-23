(function () {
  'use strict';

  // ─── DOM ───────────────────────────────────────────
  var canvas   = document.getElementById('game-canvas');
  var ctx      = canvas.getContext('2d');
  var overlay  = document.getElementById('overlay');
  var oTitle   = document.getElementById('overlay-title');
  var oMsg     = document.getElementById('overlay-msg');
  var actionBtn = document.getElementById('action-btn');
  var pauseBtn  = document.getElementById('pause-btn');
  var restartBtn = document.getElementById('restart-btn');
  var scoreEl   = document.getElementById('score-display');
  var livesEl   = document.getElementById('lives-display');
  var levelEl   = document.getElementById('level-display');

  // ─── 游戏状态常量 ──────────────────────────────────
  var STATE_IDLE    = 'idle';
  var STATE_PLAYING = 'playing';
  var STATE_PAUSED  = 'paused';
  var STATE_OVER    = 'gameover';
  var STATE_WIN     = 'win';

  // ─── 游戏状态 ──────────────────────────────────────
  var state = STATE_IDLE;
  var score = 0;
  var lives = 3;
  var level = 1;
  var rafId = null;

  // ─── 画布内部尺寸（逻辑分辨率）────────────────────
  var W = 800;
  var H = 600;

  // ─── 挡板 ──────────────────────────────────────────
  var paddle = { w: 100, h: 14, x: 0, y: 0, speed: 8, color: '#e94560' };

  // ─── 球 ────────────────────────────────────────────
  var ball = { x: 0, y: 0, r: 8, dx: 0, dy: 0, speed: 5, color: '#fff' };

  // ─── 砖块配置 ──────────────────────────────────────
  var BRICK_ROWS = 6;
  var BRICK_COLS = 10;
  var BRICK_W = 0;
  var BRICK_H = 22;
  var BRICK_PAD = 4;
  var BRICK_TOP = 60;
  var BRICK_LEFT = 0;
  var bricks = [];

  var BRICK_COLORS = ['#e94560', '#f5a623', '#f8e71c', '#7ed321', '#4a90d9', '#9b59b6'];
  var BRICK_SCORES = [6, 5, 4, 3, 2, 1];

  // ─── 输入状态 ──────────────────────────────────────
  var keys = {};
  var mouseX = W / 2;

  // ─── 工具函数 ──────────────────────────────────────
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function initBrickLayout() {
    BRICK_W = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
    BRICK_LEFT = BRICK_PAD;
    bricks = [];
    for (var r = 0; r < BRICK_ROWS; r++) {
      for (var c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_LEFT + c * (BRICK_W + BRICK_PAD),
          y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
          w: BRICK_W,
          h: BRICK_H,
          alive: true,
          row: r
        });
      }
    }
  }

  function resetBall() {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 2;
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    ball.dx = ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
  }

  function resetPaddle() {
    paddle.x = (W - paddle.w) / 2;
    paddle.y = H - 40;
  }

  function resetGame(full) {
    score = 0;
    lives = 3;
    if (full) level = 1;
    paddle.speed = 8 + (level - 1) * 0.5;
    ball.speed = 5 + (level - 1) * 0.5;
    resetPaddle();
    initBrickLayout();
    resetBall();
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = '分数: ' + score;
    livesEl.textContent = '生命: ' + lives;
    levelEl.textContent = '关卡: ' + level;
  }

  // ─── 画布自适应 ────────────────────────────────────
  function resizeCanvas() {
    var wrapper = document.getElementById('game-wrapper');
    var rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    W = rect.width;
    H = rect.height;
    paddle.y = H - 40;
    BRICK_H = Math.max(16, H * 0.03);
    BRICK_TOP = H * 0.08;
    initBrickLayout();
    if (ball.x > W) ball.x = W / 2;
    if (ball.y > H) ball.y = H / 2;
    resetPaddle();
  }

  // ─── 碰撞检测 ──────────────────────────────────────
  function ballBrickCollision(b) {
    var bx = clamp(ball.x, b.x, b.x + b.w);
    var by = clamp(ball.y, b.y, b.y + b.h);
    var dx = ball.x - bx;
    var dy = ball.y - by;
    if (dx * dx + dy * dy < ball.r * ball.r) {
      var overlapX = ball.r - Math.abs(dx);
      var overlapY = ball.r - Math.abs(dy);
      if (overlapX < overlapY) {
        ball.dx = -ball.dx;
        ball.x += dx > 0 ? overlapX : -overlapX;
      } else {
        ball.dy = -ball.dy;
        ball.y += dy > 0 ? overlapY : -overlapY;
      }
      return true;
    }
    return false;
  }

  // ─── 游戏主循环 ────────────────────────────────────
  function update() {
    // 挡板移动
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      paddle.x += paddle.speed;
    }
    paddle.x = clamp(paddle.x, 0, W - paddle.w);

    // 球移动
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 墙壁碰撞
    if (ball.x - ball.r <= 0) {
      ball.x = ball.r;
      ball.dx = Math.abs(ball.dx);
    }
    if (ball.x + ball.r >= W) {
      ball.x = W - ball.r;
      ball.dx = -Math.abs(ball.dx);
    }
    if (ball.y - ball.r <= 0) {
      ball.y = ball.r;
      ball.dy = Math.abs(ball.dy);
    }

    // 底部：失去一条命
    if (ball.y + ball.r > H + 20) {
      lives--;
      updateHUD();
      if (lives <= 0) {
        endGame(STATE_OVER);
        return;
      }
      resetBall();
      return;
    }

    // 挡板碰撞
    if (
      ball.dy > 0 &&
      ball.y + ball.r >= paddle.y &&
      ball.y + ball.r <= paddle.y + paddle.h + 4 &&
      ball.x >= paddle.x - ball.r &&
      ball.x <= paddle.x + paddle.w + ball.r
    ) {
      var hitPos = (ball.x - paddle.x) / paddle.w;
      var angle = -Math.PI * 0.15 - hitPos * Math.PI * 0.7;
      var speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = speed * Math.cos(angle);
      ball.dy = speed * Math.sin(angle);
      ball.y = paddle.y - ball.r - 1;
    }

    // 砖块碰撞
    var allDead = true;
    for (var i = 0; i < bricks.length; i++) {
      var brick = bricks[i];
      if (!brick.alive) continue;
      allDead = false;
      if (ballBrickCollision(brick)) {
        brick.alive = false;
        score += BRICK_SCORES[brick.row] || 1;
        updateHUD();
        break;
      }
    }

    // 本关全灭
    if (allDead) {
      level++;
      paddle.speed += 0.3;
      ball.speed += 0.3;
      resetPaddle();
      initBrickLayout();
      resetBall();
      updateHUD();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 砖块
    for (var i = 0; i < bricks.length; i++) {
      var b = bricks[i];
      if (!b.alive) continue;
      ctx.fillStyle = BRICK_COLORS[b.row % BRICK_COLORS.length];
      roundRect(ctx, b.x, b.y, b.w, b.h, 4);
      ctx.fill();
    }

    // 挡板
    ctx.fillStyle = paddle.color;
    roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
    ctx.fill();

    // 球
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();

    // 球发光
    ctx.shadowBlur = 0;
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function gameLoop() {
    if (state !== STATE_PLAYING) return;
    update();
    if (state === STATE_PLAYING) draw();
    rafId = requestAnimationFrame(gameLoop);
  }

  // ─── 游戏流程控制 ──────────────────────────────────
  function showOverlay(title, msg, btnText) {
    oTitle.textContent = title;
    oMsg.textContent = msg;
    actionBtn.textContent = btnText;
    overlay.classList.add('show');
  }

  function hideOverlay() {
    overlay.classList.remove('show');
  }

  function startGame() {
    state = STATE_PLAYING;
    hideOverlay();
    pauseBtn.disabled = false;
    gameLoop();
  }

  function pauseGame() {
    if (state !== STATE_PLAYING) return;
    state = STATE_PAUSED;
    if (rafId) cancelAnimationFrame(rafId);
    pauseBtn.textContent = '继续';
    showOverlay('暂停', '点击「继续」或按空格键恢复', '继续');
  }

  function resumeGame() {
    state = STATE_PLAYING;
    pauseBtn.textContent = '暂停';
    hideOverlay();
    gameLoop();
  }

  function endGame(s) {
    state = s;
    if (rafId) cancelAnimationFrame(rafId);
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    if (s === STATE_OVER) {
      showOverlay('游戏结束', '最终得分: ' + score, '重新开始');
    } else {
      showOverlay('恭喜通关!', '最终得分: ' + score, '再来一局');
    }
  }

  function restartGame() {
    if (rafId) cancelAnimationFrame(rafId);
    resetGame(true);
    draw();
    state = STATE_IDLE;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    showOverlay('打砖块', '点击「开始游戏」或按空格键开始', '开始游戏');
  }

  // ─── 事件绑定 ──────────────────────────────────────
  actionBtn.addEventListener('click', function () {
    try {
      if (state === STATE_IDLE || state === STATE_OVER || state === STATE_WIN) {
        resetGame(true);
        startGame();
      } else if (state === STATE_PAUSED) {
        resumeGame();
      }
    } catch (e) {
      console.error('游戏启动错误:', e);
      showOverlay('错误', '游戏发生错误，请刷新重试', '刷新');
      actionBtn.onclick = function () { location.reload(); };
    }
  });

  pauseBtn.addEventListener('click', function () {
    if (state === STATE_PLAYING) {
      pauseGame();
    } else if (state === STATE_PAUSED) {
      resumeGame();
    }
  });

  restartBtn.addEventListener('click', function () {
    try {
      restartGame();
    } catch (e) {
      console.error('重启错误:', e);
    }
  });

  document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (e.key === ' ' || e.key === 'Space') {
      e.preventDefault();
      if (state === STATE_IDLE || state === STATE_OVER || state === STATE_WIN) {
        resetGame(true);
        startGame();
      } else if (state === STATE_PLAYING) {
        pauseGame();
      } else if (state === STATE_PAUSED) {
        resumeGame();
      }
    }
    if (e.key === 'Escape' && state === STATE_PLAYING) {
      pauseGame();
    }
  });

  document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
  });

  // 鼠标/触控控制挡板
  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width * W;
    if (state === STATE_PLAYING) {
      paddle.x = clamp(mouseX - paddle.w / 2, 0, W - paddle.w);
    }
  });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var touch = e.touches[0];
    mouseX = (touch.clientX - rect.left) / rect.width * W;
    if (state === STATE_PLAYING) {
      paddle.x = clamp(mouseX - paddle.w / 2, 0, W - paddle.w);
    }
  }, { passive: false });

  canvas.addEventListener('touchstart', function (e) {
    if (state === STATE_IDLE || state === STATE_OVER || state === STATE_WIN) {
      e.preventDefault();
      resetGame(true);
      startGame();
    }
  }, { passive: false });

  window.addEventListener('resize', function () {
    try {
      resizeCanvas();
      if (state === STATE_PLAYING || state === STATE_PAUSED) {
        draw();
      }
    } catch (e) {
      console.error('窗口调整错误:', e);
    }
  });

  // ─── 初始化 ────────────────────────────────────────
  try {
    resizeCanvas();
    resetGame(true);
    draw();
    showOverlay('打砖块', '点击「开始游戏」或按空格键开始', '开始游戏');
  } catch (e) {
    console.error('初始化失败:', e);
    showOverlay('初始化错误', '无法启动游戏: ' + e.message, '刷新');
    actionBtn.onclick = function () { location.reload(); };
  }
})();
