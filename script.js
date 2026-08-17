// ============================================================
// 全局 ScrollTrigger 注册（必须在任何 IIFE 使用之前完成）
window.__transitionTest = "v10-loaded"; console.log("[Transition] Test: script.js loaded, GSAP:", typeof gsap);
// ============================================================
var __animWhenVisible;

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  try { gsap.registerPlugin(ScrollTrigger); } catch(e) {}
  try { ScrollTrigger.register && ScrollTrigger.register(gsap); } catch(e) {}
}

__animWhenVisible = function (selector, callback, options) {
  options = options || {};
  var el = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!el) return;
  var threshold = options.threshold || 0.2;
  var delay = options.delay || 0;
  var played = false;

  function trigger() {
    if (played) return;
    var key = el.classList && el.classList[0] ? el.classList[0] : (el.id || '');
    if (key && typeof v5Played !== 'undefined' && v5Played[key]) return;
    played = true;
    setTimeout(function () {
      if (typeof v5Played !== 'undefined' && v5Played[key]) return;
      callback();
    }, delay);
  }

  // 优先用 ScrollTrigger.create
  if (typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.create === 'function') {
    try {
      ScrollTrigger.create({
        trigger: el,
        start: options.start || 'top 85%',
        once: true,
        onEnter: trigger
      });
      return;
    } catch(e) {}
  }

  // 兜底用 IntersectionObserver
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          trigger();
          io.disconnect();
        }
      });
    }, { threshold: threshold });
    io.observe(el);
  } else {
    // 最终兜底：直接触发
    trigger();
  }
};

// ============================================================
// 贴纸区：从 retouch 图裁剪各个板块并替换贴纸 + 头像抠图 + 手持充电线抠图
// ============================================================
(function () {
  var avatarImg = new Image();
  var chargerImg = new Image();
  var loaded = 0;

  function onAllLoaded() {
    removeAvatarBg();
    removeChargerBg();
  }

  function processBgRemoval(img, thresholdLow, thresholdHigh) {
    var canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var w = canvas.width;
    var h = canvas.height;

    function getPixel(px, py) {
      var i = (py * w + px) * 4;
      return { r: data[i], g: data[i + 1], b: data[i + 2] };
    }
    var corners = [
      getPixel(10, 10), getPixel(w - 10, 10),
      getPixel(10, h - 10), getPixel(w - 10, h - 10)
    ];
    var bgR = 0, bgG = 0, bgB = 0;
    corners.forEach(function (p) { bgR += p.r; bgG += p.g; bgB += p.b; });
    bgR = Math.round(bgR / 4);
    bgG = Math.round(bgG / 4);
    bgB = Math.round(bgB / 4);

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var r = data[i], g = data[i + 1], b = data[i + 2];
        var dist = Math.sqrt(
          (r - bgR) * (r - bgR) + (g - bgG) * (g - bgG) + (b - bgB) * (b - bgB)
        );
        if (dist < thresholdLow) {
          data[i + 3] = 0;
        } else if (dist < thresholdHigh) {
          data[i + 3] = Math.round((dist - thresholdLow) / (thresholdHigh - thresholdLow) * 255);
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  function removeChargerBg() {
    if (!chargerImg.complete || chargerImg.naturalWidth === 0) return;
    try {
      var dataUrl = processBgRemoval(chargerImg, 30, 55);
      var chargerEl = document.querySelector('.charger-hand img');
      if (chargerEl) {
        chargerEl.src = dataUrl;
      }
    } catch (e) {
      console.warn('Charger bg removal failed:', e);
    }
  }

  function removeAvatarBg() {
    if (!avatarImg.complete || avatarImg.naturalWidth === 0) return;
    try {
      var dataUrl = processBgRemoval(avatarImg, 40, 60);
      var avatarImgEl = document.querySelector('.pixel-avatar-hero img');
      if (avatarImgEl) {
        avatarImgEl.src = dataUrl;
      }
    } catch (e) {
      console.warn('Avatar bg removal failed:', e);
    }
  }

  avatarImg.onload = function () {
    loaded++;
    if (loaded >= 2) onAllLoaded();
  };
  avatarImg.onerror = function () {
    console.warn('Avatar image load failed');
    loaded++;
    if (loaded >= 2) onAllLoaded();
  };

  chargerImg.onload = function () {
    loaded++;
    if (loaded >= 2) onAllLoaded();
  };
  chargerImg.onerror = function () {
    console.warn('Charger image load failed');
    loaded++;
    if (loaded >= 2) onAllLoaded();
  };

  avatarImg.src = 'assets/avatar.jpg';
  chargerImg.src = 'assets/hand_charger_1.jpg';
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (!href || href === '#' || href === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      e.preventDefault();
      return;
    }
    var target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      var navH = document.querySelector('.main-nav') ? document.querySelector('.main-nav').offsetHeight : 96;
      var rect = target.getBoundingClientRect();
      var y = window.pageYOffset + rect.top - navH + 1;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});

// Navbar shadow on scroll
const navContainer = document.querySelector('.nav-container');
if (navContainer) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navContainer.style.boxShadow = '6px 6px 0px #1a1a1a';
    } else {
      navContainer.style.boxShadow = '4px 4px 0px #1a1a1a';
    }
  });
}

// Fade-in animation for sections
const observerOptions = { threshold: 0.15 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.ccard').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// 兜底：延迟 8 秒强制显示（给 GSAP 动画足够的触发时间）
setTimeout(() => {
  document.querySelectorAll('.cap-card, .wall-card, .ccard, .sticker, .wall-grid *').forEach(el => {
    if (el.style.opacity === '0' || el.style.opacity === '') {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }
  });
}, 8000);

// Gashapon turn button (static demo)
const turnBtn = document.querySelector('.turn-btn');
if (turnBtn) {
  turnBtn.addEventListener('click', () => {
    const capsules = document.querySelectorAll('.capsule');
    capsules.forEach((c, i) => {
      c.style.transition = 'transform 0.4s ease';
      c.style.transform = `translateY(${Math.random() * 20 - 10}px) rotate(${Math.random() * 30 - 15}deg)`;
      setTimeout(() => {
        c.style.transform = '';
      }, 400 + i * 100);
    });
  });
}

// Mobile menu toggle
const menuBtn = document.querySelector('.nav-menu-btn');
const navMenu = document.querySelector('.nav-menu');
if (menuBtn && navMenu) {
  menuBtn.addEventListener('click', () => {
    if (navMenu.style.display === 'flex') {
      navMenu.style.display = 'none';
    } else {
      navMenu.style.display = 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = '60px';
      navMenu.style.right = '24px';
      navMenu.style.background = '#fff';
      navMenu.style.border = '3px solid #1a1a1a';
      navMenu.style.borderRadius = '20px';
      navMenu.style.padding = '10px';
      navMenu.style.boxShadow = '4px 4px 0px #1a1a1a';
    }
  });
}

// ============================================================
// 能力画布 · 「场景映射器 (Scenario Mapper)」
// 点击场景 → 能力聚焦（非随机）：高亮用到的标签、变灰未用到的标签、
// 并动态更新三列卡片标题与场景决策文案
// ============================================================
(function () {
  const sceneNames = {
    all: '全部能力',
    edu: '幼儿教育',
    accessibility: '无障碍公益',
    fashion: '穿搭工具',
    legal: '劳动权益'
  };

  // 每个场景对应的三列标题 + 一条产品决策
  const sceneInfo = {
    all: {
      tech: '⚙️ 全部技术选型',
      ai: '🧠 全部 AI 能力',
      scene: '🌟 全部差异化场景',
      decision: '我的能力因场景而变 · 点击上方场景按钮，画布会做「能力聚焦」，不再随机洗牌。'
    },
    edu: {
      tech: '⚙️ 该场景的技术选型（React + TypeScript + TailwindCSS）',
      ai: '🧠 该场景的 AI 能力（多模态VL + Agent + Prompt工程）',
      scene: '🌟 该场景的决策逻辑：幼儿「玩即学」',
      decision: '产品决策：以「玩即学」替代「先教后玩」，通关即生成 AI 专属绘本，让家长看到教育成果。'
    },
    accessibility: {
      tech: '⚙️ 该场景的技术选型（React + TypeScript + 多模态VL + MCP）',
      ai: '🧠 该场景的 AI 能力（Agent + 多模态识别）',
      scene: '🌟 该场景的决策逻辑：零摄像头隐私方案',
      decision: '产品决策：隐私优先——零摄像头方案，以语音中枢「小触感」自然对话替代复杂操作，让系统从工具变为陪伴者。'
    },
    fashion: {
      tech: '⚙️ 该场景的技术选型（React + TypeScript + TailwindCSS + Python）',
      ai: '🧠 该场景的 AI 能力（Agent + 多模态VL + Prompt工程）',
      scene: '🌟 该场景的决策逻辑：数据飞轮闭环',
      decision: '产品决策：以 C 端行为数据反哺 B 端 VOC 洞察，形成「用户使用 → 数据沉淀 → 运营优化 → 更好内容 → 更多用户」闭环。'
    },
    legal: {
      tech: '⚙️ 该场景的技术选型（Python + React）',
      ai: '🧠 该场景的 AI 能力（RAG + Agent + Prompt工程）',
      scene: '🌟 该场景的决策逻辑：拒绝幻觉',
      decision: '产品决策：混合检索 + 重排精准召回，输出「规则依据 → 现实风险 → 行动指南」三段式回答，杜绝大模型幻觉。'
    }
  };

  function applyScene(scene) {
    const tabs = document.querySelectorAll('.canvas-tab');
    const tags = document.querySelectorAll('.canvas-tag');
    const subLeft = document.querySelector('.canvas-sub-left');
    const titles = document.querySelectorAll('.canvas-col-title');
    const decision = document.querySelector('.canvas-decision');

    tabs.forEach(t => t.classList.toggle('active', t.dataset.scene === scene));

    if (subLeft) {
      subLeft.textContent = scene === 'all'
        ? '📊 当前场景：全部能力 · 以下为我的完整能力组合（点击场景做聚焦）'
        : `📊 当前场景：${sceneNames[scene]} · 以下为聚焦的能力组合`;
    }

    // 标签：用到的高亮，没用到的变灰保留
    tags.forEach(tag => {
      const scenes = (tag.dataset.scenes || 'all').split(',');
      const isUsed = scene === 'all' || scenes.includes(scene) || scenes.includes('all');
      // 穿搭工具场景不点亮 AI 核心能力
      const inAiCol = tag.closest('.canvas-col-ai') !== null;
      const effectiveUsed = isUsed && !(scene === 'fashion' && inAiCol);
      tag.classList.toggle('canvas-hot', scene !== 'all' && effectiveUsed);
      tag.classList.toggle('canvas-dim', scene !== 'all' && !effectiveUsed);
    });

    // 动态更新三列标题 + 决策文案
    const info = sceneInfo[scene] || sceneInfo.all;
    titles.forEach(t => {
      const col = t.dataset.col;
      if (info[col]) t.textContent = info[col];
    });
    if (decision) {
      decision.textContent = info.decision;
      decision.classList.toggle('show', scene !== 'all');
    }
  }

  document.addEventListener('click', function (e) {
    const tab = e.target.closest('.canvas-tab');
    if (tab) {
      applyScene(tab.dataset.scene);
      return;
    }
    const clearBtn = e.target.closest('.canvas-clear');
    if (clearBtn) {
      applyScene('all');
    }
  });

  // 初始聚焦当前默认场景（无障碍公益）
  const activeTab = document.querySelector('.canvas-tab.active');
  if (activeTab) applyScene(activeTab.dataset.scene);
})();

// ============================================================
// 扭蛋机交互 · 「投币 → 旋钮 → 掉落 → 开壳 → 纸条撕拉 → 过渡」
// Phase 1 进入 | Phase 2 投币/旋钮/掉落 | Phase 3 落地
// Phase 4 开壳 | Phase 5-6 纸条撕拉 | Phase 7 过渡到下一板块
// ============================================================
(function () {
  var section = document.getElementById('eggs');
  if (!section) return;

  var knob = document.getElementById('turnKnobGroup');
  var ball = document.getElementById('gachaBall');
  var shell = document.getElementById('gachaShell');
  var ticket = document.getElementById('gachaTicket');
  var tTitle = document.getElementById('gachaTicketTitle');
  var tDesc = document.getElementById('gachaTicketDesc');
  var machineWrap = section.querySelector('.machine-wrap');
  var bottomArea = section.querySelector('.bottom-area');

  // 15 款「真实的付婉茹」文案
  var COPY = [
    { t: '12人团队统筹', d: '现场问题处理 50+' },
    { t: '跨部门沟通桥梁', d: '家长沟通 20+ / 日' },
    { t: '从 0 → 1 全栈闭环', d: '5 个独立项目' },
    { t: '产品思维 + 独立开发', d: '把想法变成产品' },
    { t: '对 AI 落地的执念与审美', d: '不炫技，只做有人用的东西' },
    { t: '学前教育 × AI 跨界', d: '最懂用户的同理心' },
    { t: '零摄像头隐私方案', d: '隐私优先设计' },
    { t: '数据飞轮闭环', d: '用户真实反馈驱动' },
    { t: '拒绝幻觉', d: '混合检索 + 重排精准召回' },
    { t: '幼儿园实习教师出身', d: '共情是教不了的' },
    { t: '单手机贯穿式交互', d: '打磨到毫秒级' },
    { t: '场景映射器', d: '能力随场景聚焦' },
    { t: '跑通 Demo 全链路', d: '从前端到上线' },
    { t: '对无障碍公益的坚持', d: '让科技温暖每个人' },
    { t: '把 AI 做成真正有人用的东西', d: '这是我的答案' }
  ];

  var hasDropped = false;
  var hasOpened = false;

  // ---- Phase 1：进入视口 → 机器升起 + 旋钮发光 ----
  section.classList.add('gacha-waiting');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        section.classList.add('gacha-enter');
        section.classList.remove('gacha-waiting');
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });
  io.observe(section);

  // ---- Phase 2：点击 TURN → 旋钮旋转 + 扭蛋掉落 ----
  function onTurn() {
    if (hasDropped) return;
    hasDropped = true;

    // 旋钮旋转一圈（弹性回弹）
    knob.classList.add('gacha-knob-spin');
    knob.style.transform = 'rotate(400deg)';
    setTimeout(function () {
      knob.classList.remove('gacha-knob-spin');
      knob.style.transform = '';
    }, 760);

    // 机器咔哒抖动
    if (machineWrap) {
      machineWrap.classList.remove('gashapon-shake');
      void machineWrap.offsetWidth;
      machineWrap.classList.add('gashapon-shake');
    }
    // 投币音效般闪烁
    if (bottomArea) bottomArea.style.opacity = '0';

    // 扭蛋掉落
    setTimeout(function () {
      ball.classList.add('gacha-dropped');
      // Phase 3：落地 → 晃动
      setTimeout(function () {
        ball.classList.add('gacha-landed');
        setTimeout(function () {
          ball.classList.remove('gacha-landed');
          ball.classList.add('gacha-wait-open');
        }, 650);
      }, 900);
    }, 380);
  }

  if (knob) knob.addEventListener('click', onTurn);

  // ---- Phase 4-6：点击扭蛋 → 开壳 + 纸条抽出 + 文字逐行显示 ----
  function onOpen() {
    if (hasOpened || !hasDropped) return;
    hasOpened = true;

    ball.classList.add('gacha-hidden');

    // 随机抽取一条文案（打散顺序）
    var item = COPY[Math.floor(Math.random() * COPY.length)];
    if (tTitle) tTitle.textContent = item.t;
    if (tDesc) tDesc.textContent = item.d;

    // 无 GSAP 时兜底：直接显示纸条
    if (typeof gsap === 'undefined') {
      if (shell) shell.style.opacity = '1';
      if (ticket) { ticket.style.clipPath = 'inset(0 0 0 0)'; ticket.style.opacity = '1'; }
      return;
    }

    var parts = shell ? shell.querySelectorAll('.gacha-shell-part') : [];
    var textEls = ticket ? ticket.querySelectorAll('.gacha-ticket-label, .gacha-ticket-title, .gacha-ticket-desc, .gacha-ticket-footer') : [];

    var tl = gsap.timeline();

    // 蛋壳显现
    if (shell) tl.set(shell, { autoAlpha: 1 }, 0);

    // 0-0.4s：两半蛋壳向左右滑开 ≥80px
    if (parts.length >= 2) {
      tl.to(parts[0], { x: -90, rotation: -8, duration: 0.4, ease: 'power3.out' }, 0)
        .to(parts[1], { x: 90, rotation: 8, duration: 0.4, ease: 'power3.out' }, 0);
    }

    // 0.4-1.0s：纸条从蛋壳中间向上生长（clip-path 由 CSS 变量驱动）+ 上滑浮现
    if (ticket) {
      tl.fromTo(ticket,
        { '--cn': '50%', opacity: 0, y: 46 },
        { '--cn': '0%', opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
        0.35
      );
    }

    // 1.0-1.6s：文字从隐藏 → 逐行浮现
    if (textEls.length) {
      tl.fromTo(textEls,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.12, ease: 'power2.out' },
        0.95
      );
    }

    // 打开完成约 5s 后自动撕裂进入下一板块（保证过渡必现，留足阅读时间）
    clearTimeout(tearTimer);
    tearTimer = setTimeout(startTear, 5000);
  }
  if (ball) ball.addEventListener('click', onOpen);
  if (ball) ball.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); }
  });

  // ---- Phase 7：纸条撕裂 → 进入下一板块 ----
  // 纸条铺满全屏后，从中间撕开，露出下一板块（不做浮层弹出）
  var letScroll = false;

  // 撕裂瞬间的闪光（一闪即过）
  var flash = document.createElement('div');
  flash.className = 'gacha-flash';
  document.body.appendChild(flash);

  function startTear() {
    if (letScroll) return;
    if (!hasOpened) return;   // 只有扭蛋打开过才允许撕开
    letScroll = true;

    var nextSection = document.querySelector('.intro-section');

    // 纸条铺满全屏（纸条本身成为屏幕表面，而非新浮层）
    gsap.set(ticket, { clearProps: 'transform' });
    ticket.classList.add('gacha-tear');

    var tl = gsap.timeline();

    // 0-0.4s：纸条放大铺满（同时滚到下一板块，让它滑到纸条下方）
    tl.fromTo(ticket, { scale: 1, opacity: 1 }, { scale: 1.6, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
    if (nextSection) nextSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 0.35-1.05s：纸条从中缝撕开（上下两半向中线聚拢 → 消失），下一板块淡入

    // 撕裂瞬间闪光
    tl.call(function () {
      flash.classList.add('active');
      gsap.fromTo(flash, { opacity: 0 }, { opacity: 1, duration: 0.16, yoyo: true, repeat: 1, ease: 'power1.inOut' });
    }, [], 0.35);

    // 纸条撕开
    tl.to(ticket, {
      clipPath: 'inset(50% 0% 50% 0%)',
      opacity: 0,
      duration: 0.7,
      ease: 'power3.inOut'
    }, 0.35);

    // 收尾清理
    tl.call(function () {
      flash.classList.remove('active');
      gsap.set(flash, { clearProps: 'opacity' });
      flash.style.visibility = 'hidden';
      if (ticket) { ticket.classList.remove('gacha-tear'); ticket.style.cssText = ''; }
      if (shell) shell.style.cssText = '';
      if (ball) { ball.className = 'gacha-ball'; ball.style.cssText = ''; }
      if (bottomArea) bottomArea.style.opacity = '';
    }, [], 1.1);
  }

  // 打开完成约 3s 后自动撕开（保证过渡必现；仅在打开后启动）
  var tearTimer = null;
  function armTransition() {
    if (letScroll) return;
    var onScroll = function () {
      if (!hasOpened) return;
      clearTimeout(tearTimer);
      startTear();
      window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll);
  }
  armTransition();
})();

// ============================================================
// ONE PHONE · 全局单手机交互（滚动驱动）
// 阶段：滚动→手机升起→手插充电器→火花+亮屏→profile页面→推镜头融化
// ============================================================
(function () {
  var hero = document.getElementById('hero');
  var stage = document.getElementById('phoneStage');
  if (!hero || !stage) return;

  var phone = document.getElementById('mainPhone');
  var hand = document.getElementById('chargerHand');
  var spark = document.getElementById('chargeSpark');
  var pop = document.getElementById('chargePop');
  var hint = document.getElementById('heroScrollHint');
  var boot = document.getElementById('screenBoot');
  var profile = document.getElementById('screenProfile');

  var START_Y = 600;       // 手机初始偏移（在下方）
  var handInserted = false;
  var screenLit = false;
  var profileShown = false;

  // 初始化：屏幕全黑，boot 和 profile 都隐藏
  phone.style.transform = 'translateY(' + START_Y + 'px)';

  requestAnimationFrame(function () {
    stage.classList.add('ready');
    // 注意：不主动添加 boot.show — 屏幕初始是黑的
    // boot screen 只在充电后亮屏时才出现
  });

  function update() {
    var vh = window.innerHeight;
    var heroRect = hero.getBoundingClientRect();
    var scrolled = Math.max(0, -heroRect.top);
    var total = hero.offsetHeight - vh;
    var p = total > 0 ? Math.min(1, scrolled / total) : 0;

    // 1. 手机升起：p=0时在下方，p=0.4时完全升起（屏幕全黑）
    var riseP = Math.min(1, p / 0.4);
    var eased = 1 - Math.pow(1 - riseP, 3);
    phone.style.transform = 'translateY(' + (START_Y * (1 - eased)) + 'px)';

    // 2. 充电器插入：p >= 0.5 时手从下方滑入
    if (!handInserted && p >= 0.5) {
      handInserted = true;
      if (hand) hand.classList.add('insert');
    }

    // 3. 充电完成 → 火花 + 亮屏 + 显示头像 boot screen
    if (!screenLit && p >= 0.55) {
      screenLit = true;
      if (spark) spark.classList.add('on');
      if (boot) boot.classList.add('show');
      if (pop) pop.classList.add('show');
    }

    // 4. 继续滚动 → boot 淡出，profile（图3）淡入
    if (!profileShown && p >= 0.8) {
      profileShown = true;
      if (boot) boot.classList.add('hide');
      if (profile) profile.classList.add('show');
      setTimeout(function () {
        if (pop) pop.classList.remove('show');
        if (hint) hint.classList.add('show');
      }, 500);
    }

    // 5. 手和火花在离开 hero 时淡出
    if (p > 0.9) {
      var fade = (p - 0.9) / 0.1;
      if (hand) hand.style.opacity = String(Math.max(0, 1 - fade * 2));
      if (spark) spark.style.opacity = String(Math.max(0, 1 - fade * 2));
    } else {
      if (hand && hand.style.opacity !== '') hand.style.opacity = '';
      if (spark && spark.style.opacity !== '') spark.style.opacity = '';
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ============================================================
// PUSH-IN 推镜头：同一台手机在滚动中放大 + 边框融化
// ============================================================
(function () {
  var section = document.getElementById('pushin');
  if (!section) return;
  var stage = document.getElementById('phoneStage');
  var melt = section.querySelector('.pushin-melt');
  if (!stage || !melt) return;

  var baseW = 320;

  function maxScale() {
    return Math.max(window.innerWidth, window.innerHeight) / baseW + 1.4;
  }

  function update() {
    var vh = window.innerHeight;
    var rect = section.getBoundingClientRect();
    var total = section.offsetHeight - vh;
    var scrolled = Math.max(0, Math.min(total, vh - rect.top));
    var p = total > 0 ? scrolled / total : 0;

    // 手机放大
    var scale = 1 + Math.pow(p, 1.4) * (maxScale() - 1);
    stage.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
    // 手机边框/整体淡出
    stage.style.opacity = String(Math.max(0, 1 - Math.pow(p, 2.2)));
    // 屏内 boot + profile“融化”淡出 —— 只在各自已显示后才淡出，
    // 避免初始阶段覆盖 CSS 的 opacity:0 导致内容泄漏可见
    var boot = stage.querySelector('.screen-boot');
    var profile = stage.querySelector('.screen-profile');
    if (boot && boot.classList.contains('show')) {
      boot.style.opacity = String(Math.pow(Math.max(0, 1 - p), 2));
    }
    if (profile && profile.classList.contains('show')) {
      profile.style.opacity = String(Math.pow(Math.max(0, 1 - p), 2));
    }

    // 文字背景（Hello World）淡入
    melt.style.opacity = String(Math.pow(p, 1.5));
    melt.style.transform = 'scale(' + (1 + p * 0.12) + ')';

    // 手与火花在推镜头阶段随手机消失
    if (p > 0.3) {
      var hand = stage.querySelector('.charger-hand');
      var spark = stage.querySelector('.charge-spark');
      if (hand) hand.style.opacity = String(Math.max(0, 1 - (p - 0.3) * 3));
      if (spark) spark.style.opacity = String(Math.max(0, 1 - (p - 0.3) * 3));
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ============================================================
   项目文件夹：点击「看详情」展开/收起第二层「深度解析」
   ============================================================ */
(function () {
  document.addEventListener('click', function (e) {
    var more = e.target.closest('.folder-more');
    if (!more) return;
    var folder = more.closest('.project-folder');
    if (!folder) return;
    var deep = folder.querySelector('.folder-deep');
    if (!deep) return;
    var isOpen = deep.classList.toggle('open');
    more.textContent = isOpen ? '收起 ↑' : '👀 查看产品决策 ▸';
  });
})();

/* ============================================================
   简历弹窗：点击按钮打开/关闭模态框
   ============================================================ */
(function () {
  var modal = document.getElementById('resumeModal');
  var btn = document.getElementById('resumeBtn');
  var closeBtn = document.getElementById('resumeClose');

  if (!modal || !btn || !closeBtn) return;

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  closeBtn.addEventListener('click', function () {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
})();

/* ============================================================
   项目文件夹交互：平铺布局 + Intersection Observer 淡入 + 点击展开
   ============================================================ */
(function () {
  var folders = document.querySelectorAll('.project-folder');
  if (!folders.length) return;

  // 进入视口时触发一次：淡入上移动画（CSS transition 驱动）
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target); // 只触发一次，不随滚动反向
        }
      });
    }, { threshold: 0.15 });
    folders.forEach(function (f) { io.observe(f); });
  } else {
    // 浏览器不支持 IO：直接全部显示，保证内容可见
    folders.forEach(function (f) { f.classList.add('revealed'); });
  }

  // 初始已在视口内的立即显示（避免首屏闪烁），其余交给 IO 滚动触发
  var vh = window.innerHeight || document.documentElement.clientHeight;
  folders.forEach(function (f) {
    var rect = f.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) {
      f.classList.add('revealed');
    }
  });

  // 描述展开/收起：仅点击卡片触发，滚动不触发展开
  folders.forEach(function (folder) {
    folder.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('.folder-more')) return;
      folder.classList.toggle('active');
    });
  });
})();

/* ============================================================
   产品文档卡片：简单视差 + hover 信息浮现 + 描述展开 + 箭头
   ============================================================ */
(function () {
  var cards = document.querySelectorAll('.doc-card');
  if (!cards.length) return;

  // 1) 进入视口淡入
  var vh = window.innerHeight || document.documentElement.clientHeight;
  cards.forEach(function (c) {
    var rect = c.getBoundingClientRect();
    if (rect.top > vh || rect.bottom < 0) {
      c.classList.add('doc-hidden');
    }
  });
  function revealCard(c) {
    if (c.classList.contains('revealed')) return;
    c.classList.add('revealed');
    c.classList.remove('doc-hidden');
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { revealCard(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  } else { cards.forEach(revealCard); }
  var docScroll = function () {
    var vh2 = window.innerHeight || document.documentElement.clientHeight;
    cards.forEach(function (c) { var r = c.getBoundingClientRect(); if (r.top < vh2 && r.bottom > 0) revealCard(c); });
  };
  window.addEventListener('scroll', docScroll, { passive: true });
  setTimeout(function () { cards.forEach(revealCard); }, 1500);

  // 2) 简单视差：每张卡片滚动时不同速度
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    cards.forEach(function (card, i) {
      var offset = (i % 3) * 12;
      gsap.fromTo(card, { y: offset }, {
        y: -offset,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  // 3) 描述展开/收起
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.doc-arrow')) return;
      card.classList.toggle('expanded');
    });
  });
  if ('IntersectionObserver' in window) {
    var ioEx = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('expanded'); ioEx.unobserve(entry.target); } });
    }, { threshold: 0.6 });
    cards.forEach(function (c) { ioEx.observe(c); });
  }

  // 4) 箭头点击
  cards.forEach(function (card) {
    var arrow = card.querySelector('.doc-arrow');
    if (!arrow) return;
    arrow.addEventListener('click', function (e) {
      e.stopPropagation();
      var url = card.getAttribute('data-doc');
      if (url) { window.open(url, '_blank'); }
      else { if (typeof gsap !== 'undefined') gsap.fromTo(arrow, { opacity: 1 }, { opacity: 0.4, duration: 0.15, yoyo: true, repeat: 1 }); }
    });
  });
})();

/* ============================================================
   个人介绍区：侧边栏元素依次浮现
   ============================================================ */
(function () {
  var section = document.querySelector('.about-section');
  if (!section) return;
  if (typeof gsap === 'undefined') return;

  var avatar = section.querySelector('.sidebar-avatar');
  var name = section.querySelector('.sidebar-name');
  var chips = gsap.utils.toArray('.about-section .chip');
  var contacts = gsap.utils.toArray('.about-section .contact-item');
  var pitch = section.querySelector('.elevator-pitch');
  var main = section.querySelector('.about-main');

  gsap.set([avatar, name], { opacity: 0, y: 30 });
  gsap.set(chips, { opacity: 0, x: 0, scale: 0.8 });
  gsap.set(contacts, { opacity: 0, y: 15 });
  gsap.set(pitch, { opacity: 0, y: 40 });
  gsap.set(main, { opacity: 0, y: 20 });

  var played = false;
  function playAnim() {
    if (played) return;
    played = true;

    var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.to(avatar, { opacity: 1, y: 0, duration: 0.4 })
      .to(name, { opacity: 1, y: 0, duration: 0.35 }, '-=0.25')
      .to(chips, { opacity: 1, scale: 1, duration: 0.3, stagger: 0.08, ease: 'back.out(1.7)' }, '-=0.2')
      .to(contacts, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, '-=0.15')
      .to(pitch, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')
      .to(main, { opacity: 1, y: 0, duration: 0.4 }, '-=0.25');
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playAnim();
          io.disconnect();
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    io.observe(section);
  } else {
    setTimeout(playAnim, 500);
  }
})();


/* ============================================================
   学习路径区：时间线展开 + 关键词弹出
   ============================================================ */
(function () {
  var section = document.querySelector('.path-section');
  if (!section) return;

  if (typeof gsap === 'undefined') {
    section.querySelectorAll('.t-card, .t-card h3, .t-card p, .t-tags span, .t-number, .path-header').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // 初始隐藏
  gsap.set('.path-section .t-card', { opacity: 0, y: 50 });
  gsap.set('.path-section .t-card h3, .path-section .t-card p', { opacity: 0, y: 15 });
  gsap.set('.path-section .t-tags span', { opacity: 0, y: 8, scale: 0.85 });
  gsap.set('.path-section .timeline-line', { scaleY: 0, transformOrigin: 'top center' });
  gsap.set('.path-section .t-number', { opacity: 0, scale: 0.8 });
  gsap.set('.path-section .path-header', { opacity: 0, y: 20 });

  __animWhenVisible('.path-section', function () {
    gsap.to('.path-section .timeline-line', { scaleY: 1, duration: 0.8, ease: 'power2.out' });
    gsap.to('.path-section .path-header', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

    var items = gsap.utils.toArray('.path-section .t-item');
    items.forEach(function (item, i) {
      var card = item.querySelector('.t-card');
      var h3 = item.querySelector('.t-card h3');
      var p = item.querySelector('.t-card p');
      var tags = gsap.utils.toArray(item.querySelectorAll('.t-tags span'));
      var num = item.querySelector('.t-number');

      var tlItem = gsap.timeline({ paused: true });
      tlItem
        .to(card, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' })
        .to(h3, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.35')
        .to(p, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25');

      if (num) {
        tlItem.to(num, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.4');
      }

      tags.forEach(function (tag, j) {
        tlItem.fromTo(tag,
          { opacity: 0, y: 8, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.5)' },
          '-=0.15'
        );
      });

      __animWhenVisible(item, function () {
        tlItem.play();
      }, { start: 'top 88%' });
    });
  }, { start: 'top 65%' });
})();

/* ============================================================
   贴纸板块：依次淡入
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  var section = document.querySelector('.sticker-section');
  if (!section) return;

  var stickers = gsap.utils.toArray('.sticker-section .sticker');
  var textBlock = section.querySelector('.sticker-text-block');
  var avatar = section.querySelector('.center-avatar');

  stickers.forEach(function (sticker) {
    gsap.set(sticker, { opacity: 0, scale: 0.85 });
  });
  gsap.set(textBlock, { opacity: 0, y: 30 });
  gsap.set(avatar, { opacity: 0, scale: 0.8 });

  __animWhenVisible('.sticker-section', function () {
    gsap.to(textBlock, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .to(avatar, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.3')
      .to(stickers, {
        opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(1.5)'
      }, '-=0.2');
  }, { start: 'top 65%' });
})();

/* ============================================================
   贴纸 + 半身像：自由拖拽 + 惯性滑动 + 边界限制 + 置顶 + localStorage 记忆
   ============================================================ */
(function () {
  var stage = document.querySelector('.sticker-section .sticker-bg');
  if (!stage) return;

  var items = Array.prototype.slice.call(
    document.querySelectorAll('.sticker-section .sticker, .sticker-section .center-avatar')
  );
  if (!items.length) return;

  var KEY = 'sticker_drag_pos_v1';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }

  var maxZ = 100;

  function getId(el) {
    if (el.classList.contains('center-avatar')) return 'avatar';
    var m = el.className.match(/sticker-(\d+)/);
    return m ? 'sticker-' + m[1] : null;
  }

  // 初始化：把元素转成 left/top 像素定位
  items.forEach(function (el) {
    var id = getId(el);
    if (!id) return;

    var rect = el.getBoundingClientRect();
    var sRect = stage.getBoundingClientRect();
    var left = rect.left - sRect.left;
    var top = rect.top - sRect.top;

    if (el.classList.contains('center-avatar')) {
      // 头像：去掉 translate 居中偏移，改为像素定位
      el.style.transform = 'none';
      if (saved[id]) { left = saved[id].x; top = saved[id].y; }
      else { left = (stage.clientWidth - el.offsetWidth) / 2; top = (stage.clientHeight - el.offsetHeight) / 2; }
    } else if (saved[id]) {
      left = saved[id].x;
      top = saved[id].y;
    }

    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    el.style.position = 'absolute';
    el.style.cursor = 'grab';
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';
    el.style.touchAction = 'none';

    el.dataset.id = id;
    el.dataset.x = left;
    el.dataset.y = top;
  });

  function clamp(el, x, y) {
    var maxX = Math.max(0, stage.clientWidth - el.offsetWidth);
    var maxY = Math.max(0, stage.clientHeight - el.offsetHeight);
    return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) };
  }

  function savePos(el) {
    saved[el.dataset.id] = { x: parseFloat(el.dataset.x), y: parseFloat(el.dataset.y) };
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
  }

  var dragging = null;
  var inertiaFrame = null;

  function startDrag(el, e) {
    var point = e.touches ? e.touches[0] : e;
    if (inertiaFrame) { cancelAnimationFrame(inertiaFrame); inertiaFrame = null; }
    dragging = {
      el: el,
      startX: point.clientX,
      startY: point.clientY,
      baseX: parseFloat(el.dataset.x),
      baseY: parseFloat(el.dataset.y),
      lastTime: Date.now(),
      lastX: point.clientX,
      lastY: point.clientY,
      vx: 0,
      vy: 0
    };
    maxZ += 1;
    el.style.zIndex = maxZ;
    el.style.cursor = 'grabbing';
    el.style.boxShadow = '6px 6px 0 rgba(0,0,0,0.35)';
  }

  function moveDrag(e) {
    if (!dragging) return;
    var point = e.touches ? e.touches[0] : e;
    var dx = point.clientX - dragging.startX;
    var dy = point.clientY - dragging.startY;
    var now = Date.now();
    var dt = now - dragging.lastTime;
    if (dt > 0) {
      dragging.vx = (point.clientX - dragging.lastX) / dt;
      dragging.vy = (point.clientY - dragging.lastY) / dt;
    }
    dragging.lastTime = now;
    dragging.lastX = point.clientX;
    dragging.lastY = point.clientY;

    var pos = clamp(dragging.el, dragging.baseX + dx, dragging.baseY + dy);
    dragging.el.dataset.x = pos.x;
    dragging.el.dataset.y = pos.y;
    dragging.el.style.left = pos.x + 'px';
    dragging.el.style.top = pos.y + 'px';
  }

  function endDrag() {
    if (!dragging) return;
    var el = dragging.el;
    var vx = dragging.vx;
    var vy = dragging.vy;
    savePos(el);
    el.style.cursor = 'grab';
    el.style.boxShadow = '';
    dragging = null;

    var speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.05) return;

    var x = parseFloat(el.dataset.x);
    var y = parseFloat(el.dataset.y);
    var last = performance.now();

    function step(now) {
      var dt = Math.min(now - last, 50);
      last = now;
      var k = Math.pow(0.995, dt);
      x += vx * dt;
      y += vy * dt;
      vx *= k;
      vy *= k;
      var pos = clamp(el, x, y);
      el.dataset.x = pos.x;
      el.dataset.y = pos.y;
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';
      if (Math.sqrt(vx * vx + vy * vy) < 0.01) {
        savePos(el);
        return;
      }
      inertiaFrame = requestAnimationFrame(step);
    }
    inertiaFrame = requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    var el = e.target.closest('.sticker, .center-avatar');
    if (!el || !stage.contains(el)) return;
    if (e.cancelable) e.preventDefault();
    startDrag(el, e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }
  function onMove(e) {
    if (e.cancelable) e.preventDefault();
    moveDrag(e);
  }
  function onUp() {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onUp);
    endDrag();
  }

  stage.addEventListener('mousedown', onPointerDown);
  stage.addEventListener('touchstart', onPointerDown, { passive: false });
})();

/* ============================================================
   Parker 风格板块过渡：滚动入场淡入
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  var sections = document.querySelectorAll('section:not(.hero-section):not(.site-footer):not(.about-section):not(.path-section):not(.skills-section):not(.canvas-section):not(.docs-section):not(.projects-section):not(.gashapon-section):not(.contact-section):not(.intro-section)');

  sections.forEach(function (section, i) {
    gsap.set(section, { opacity: 0, y: 50 });
    __animWhenVisible(section, function () {
      gsap.to(section, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    }, { start: 'top 90%' });
  });
})();

/* ============================================================
   四大核心板块：飞入 + 漂移 + hover
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  var section = document.querySelector('.about-section .capability-grid');
  if (!section) return;

  var cards = gsap.utils.toArray('.about-section .cap-card');
  var titles = gsap.utils.toArray('.about-section .cap-title');
  var descs = gsap.utils.toArray('.about-section .cap-desc');

  cards.forEach(function (card, i) {
    var dirs = [
      { x: -200, y: 80 },
      { x: 200, y: -60 },
      { x: -150, y: -100 },
      { x: 180, y: 80 }
    ];
    var d = dirs[i % 4];
    gsap.set(card, { opacity: 0, x: d.x, y: d.y, rotation: (i % 2 === 0 ? -8 : 8) });
  });

  gsap.set(titles, { opacity: 0, x: 0 });
  gsap.set(descs, { opacity: 0, y: 20 });

  __animWhenVisible('.about-section', function () {
    gsap.to(cards, {
      opacity: 1, x: 0, y: 0, rotation: 0,
      duration: 0.7, stagger: 0.15, ease: 'back.out(1.2)'
    });

    titles.forEach(function (title, i) {
      gsap.fromTo(title,
        { opacity: 0, x: i % 2 === 0 ? -30 : 30 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', delay: 0.3 + i * 0.1 }
      );
    });
    descs.forEach(function (desc, i) {
      gsap.fromTo(desc,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.5 + i * 0.1 }
      );
    });

    cards.forEach(function (card, i) {
      var driftDir = i % 2 === 0 ? 1 : -1;
      gsap.to(card, {
        x: driftDir * gsap.utils.random(15, 30),
        y: gsap.utils.random(-10, 10),
        rotation: driftDir * gsap.utils.random(1, 3),
        duration: 3 + Math.random() * 2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1
      });
    });
  }, { start: 'top 65%' });

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      gsap.to(card, { boxShadow: '0 12px 32px rgba(194, 24, 91, 0.25), 4px 6px 0 #1a1a1a', duration: 0.35, ease: 'power2.out' });
      gsap.to(card.querySelector('.cap-icon'), { scale: 1.35, rotation: -10, duration: 0.4, ease: 'back.out(1.5)', yoyo: true, repeat: 1 });
      gsap.to(card.querySelector('.cap-title'), { color: '#c2185b', x: 6, duration: 0.3, ease: 'power2.out' });
      gsap.to(card.querySelector('.cap-desc'), { color: '#c2185b', duration: 0.3, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', function () {
      gsap.to(card, { boxShadow: '', duration: 0.35, ease: 'power2.out' });
      gsap.to(card.querySelector('.cap-icon'), { scale: 1, rotation: 0, duration: 0.35, ease: 'power2.out' });
      gsap.to(card.querySelector('.cap-title'), { color: '', x: 0, duration: 0.3, ease: 'power2.out' });
      gsap.to(card.querySelector('.cap-desc'), { color: '', duration: 0.3, ease: 'power2.out' });
    });
  });
})();

/* ============================================================
   能力雷达：进度条填充 + 数字弹出
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  var section = document.querySelector('.skills-section');
  if (!section) return;

  var cards = gsap.utils.toArray('.skills-section .skill-card');
  var header = document.querySelector('.skills-section .skills-header');

  gsap.set(cards, { opacity: 0, y: 30 });
  gsap.set(header, { opacity: 0, y: 20 });

  __animWhenVisible('.skills-section', function () {
    gsap.to(header, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });

    cards.forEach(function (card, i) {
      gsap.fromTo(card,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.1 + i * 0.1 }
      );

      var fill = card.querySelector('.skill-fill');
      var pct = card.querySelector('.skill-pct');
      if (fill) {
        var w = fill.getAttribute('data-width') || '80';
        gsap.fromTo(fill, { width: '0%' }, { width: w + '%', duration: 0.8, ease: 'power2.out', delay: 0.3 + i * 0.1 });
      }
      if (pct) {
        var target = parseInt(pct.textContent) || 80;
        var obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1,
          ease: 'power2.out',
          delay: 0.3 + i * 0.1,
          onUpdate: function () {
            pct.textContent = Math.round(obj.val) + '%';
          }
        });
      }
    });
  }, { start: 'top 65%' });
})();

/* ============================================================
   能力画布：标签依次浮现 + 场景切换
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  var section = document.querySelector('.canvas-section');
  if (!section) return;

  var tags = gsap.utils.toArray('.canvas-section .canvas-tag');
  var tabs = gsap.utils.toArray('.canvas-section .canvas-tab');

  gsap.set(tags, { opacity: 0, scale: 0.85, y: 15 });

  var played = false;
  function playAnim() {
    if (played) return;
    played = true;
    gsap.to(tags, {
      opacity: 1, scale: 1, y: 0,
      duration: 0.45,
      stagger: 0.08,
      ease: 'back.out(1.5)'
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { playAnim(); io.disconnect(); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30% 0px' });
    io.observe(section);
  } else {
    setTimeout(playAnim, 200);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var scene = tab.getAttribute('data-scene');
      tags.forEach(function (tag) {
        var scenes = (tag.getAttribute('data-scenes') || '').split(',');
        if (scene === 'all' || scenes.indexOf(scene) >= 0) {
          gsap.to(tag, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
        } else {
          gsap.to(tag, { opacity: 0.25, scale: 0.9, duration: 0.3 });
        }
      });
    });
  });
})();


/* ============================================================
   项目文件夹：卡片依次翻开 + 装饰闪烁
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;

  var section = document.querySelector('.projects-section');
  if (!section) return;

  var folders = gsap.utils.toArray('.projects-section .project-folder');
  var stars = gsap.utils.toArray('.projects-section .deco-star, .projects-section .deco-sparkle, .projects-section .deco-dot');
  var header = section.querySelector('.projects-header');

  // 清除 CSS transition 避免与 GSAP 冲突
  folders.forEach(function (f) { f.style.transition = 'none'; });

  gsap.set(folders, { opacity: 0, y: 40, rotation: -2 });
  if (header) gsap.set(header, { opacity: 0, y: 20 });

  var played = false;
  function playAnim() {
    if (played) return;
    played = true;

    var tl = gsap.timeline({ defaults: { ease: 'back.out(1.2)' } });

    if (header) {
      tl.to(header, { opacity: 1, y: 0, duration: 0.5 });
    }

    folders.forEach(function (folder, i) {
      tl.fromTo(folder,
        { opacity: 0, y: 40, rotation: -2 },
        { opacity: 1, y: 0, rotation: 0, duration: 0.55 },
        '-=0.3'
      );
    });

    stars.forEach(function (star, i) {
      gsap.to(star, {
        opacity: 0.6 + Math.random() * 0.4,
        scale: 1 + Math.random() * 0.3,
        duration: 1.5 + Math.random(),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1 + Math.random() * 2
      });
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { playAnim(); io.disconnect(); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30% 0px' });
    io.observe(section);
  } else {
    setTimeout(playAnim, 200);
  }
})();


/* ============================================================
   玻璃卡片过渡系统 v5 - 先藏后显版
   核心：板块切换时立即隐藏新板块内容，滚动稳定后再揭示动画
   ============================================================ */
(function() {
  if (typeof gsap === 'undefined') return;

  var isTransitioning = false;
  var currentSectionIdx = 0;
  var lastTriggerTime = 0;
  var navScrolling = false;
  var navScrollTimer = null;
  var scrollRaf = null;
  var v5Played = {};
  var revealPending = false;
  var revealTimer = null;

  // 创建过渡元素
  var overlay = document.createElement('div');
  overlay.className = 'section-transition-overlay';
  document.body.appendChild(overlay);

  var trailContainer = document.createElement('div');
  trailContainer.className = 'peel-trail';
  document.body.appendChild(trailContainer);

  var glow = document.createElement('div');
  glow.className = 'terminal-glow';
  document.body.appendChild(glow);

  var rule = document.createElement('div');
  rule.className = 'transition-rule';
  document.body.appendChild(rule);

  var sections = document.querySelectorAll(
    '.pushin-section, .wall-section, .about-section, .path-section, .skills-section, ' +
    '.canvas-section, .docs-section, .projects-section, .gashapon-section, ' +
    '.intro-section, .contact-section'
  );

  if (sections.length < 2) return;

  sections.forEach(function (section) {
    // 首屏板块（pushin / wall）保持可见，由自身 IIFE 管理
    if (section.classList.contains('pushin-section') || section.classList.contains('wall-section')) {
      gsap.set(section, { opacity: 1, y: 0 });
    } else {
      // 其余板块初始隐藏 — 由 peel 遮罩在过渡期间揭示内容
      gsap.set(section, { opacity: 0, y: 10 });
    }
  });

  function getSectionIndex(sec) {
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] === sec) return i;
    }
    return -1;
  }

  function getSectionAt(scrollY) {
    var vh = window.innerHeight;
    var y = scrollY + vh * 0.4;
    for (var i = 0; i < sections.length; i++) {
      var top = sections[i].offsetTop;
      if (y >= top && y <= top + sections[i].offsetHeight) return i;
    }
    return -1;
  }

  // 立即隐藏板块内容
  function hideSectionContent(section) {
    if (!section) return;

    // 同时淡化整个板块（让空白状态更明显）
    gsap.set(section, { opacity: 0.3, y: 8 });

    if (section.classList.contains('about-section')) {
      var el = section.querySelector('.sidebar-avatar');
      if (el) gsap.set(el, { opacity: 0, y: 30 });
      el = section.querySelector('.sidebar-name');
      if (el) gsap.set(el, { opacity: 0, y: 30 });
      gsap.utils.toArray('.about-section .chip').forEach(function(c){ gsap.set(c, { opacity: 0, scale: 0.8 }); });
      gsap.utils.toArray('.about-section .contact-item').forEach(function(c){ gsap.set(c, { opacity: 0, y: 15 }); });
      el = section.querySelector('.elevator-pitch');
      if (el) gsap.set(el, { opacity: 0, y: 40 });
      el = section.querySelector('.about-main');
      if (el) gsap.set(el, { opacity: 0, y: 20 });
    }

    if (section.classList.contains('skills-section')) {
      gsap.utils.toArray('.skills-section .skill-card').forEach(function(c){ gsap.set(c, { opacity: 0, y: 30 }); });
      el = section.querySelector('.skills-header');
      if (el) gsap.set(el, { opacity: 0, y: 20 });
    }

    if (section.classList.contains('canvas-section')) {
      gsap.utils.toArray('.canvas-section .canvas-tag').forEach(function(c){ gsap.set(c, { opacity: 0, scale: 0.85, y: 15 }); });
    }

    if (section.classList.contains('projects-section')) {
      gsap.utils.toArray('.projects-section .project-folder').forEach(function(c){ gsap.set(c, { opacity: 0, y: 40, rotation: -2 }); });
      el = section.querySelector('.projects-header');
      if (el) gsap.set(el, { opacity: 0, y: 20 });
    }

    if (section.classList.contains('path-section')) {
      gsap.set('.path-section .t-card', { opacity: 0, y: 50 });
      gsap.set('.path-section .t-card h3, .path-section .t-card p', { opacity: 0, y: 15 });
      gsap.set('.path-section .t-tags span', { opacity: 0, y: 8, scale: 0.85 });
      gsap.set('.path-section .timeline-line', { scaleY: 0, transformOrigin: 'top center' });
      gsap.set('.path-section .t-number', { opacity: 0, scale: 0.8 });
      el = section.querySelector('.path-header');
      if (el) gsap.set(el, { opacity: 0, y: 20 });
    }

    if (section.classList.contains('docs-section')) {
      gsap.set('.docs-section .doc-card', { opacity: 0, y: 30, scale: 0.95 });
      el = section.querySelector('.docs-header');
      if (el) gsap.set(el, { opacity: 0, y: 20 });
    }

    if (section.classList.contains('gashapon-section')) {
      gsap.set('.gashapon-section .gacha-shell-left, .gacha-shell-right', { opacity: 0 });
      gsap.set('.gashapon-section .gacha-ball', { opacity: 0, scale: 0.5 });
      gsap.set('.gashapon-section .top-pill', { opacity: 0, y: 20 });
      gsap.set('.gashapon-section .gacha-title', { opacity: 0, y: 20 });
    }

    if (section.classList.contains('contact-section')) {
      gsap.set('.contact-section .contact-card', { opacity: 0, y: 30 });
      gsap.set('.contact-section .contact-heading, .contact-section .contact-sub', { opacity: 0, y: 20 });
      gsap.set('.contact-section .cta-button', { opacity: 0, y: 20 });
      gsap.set('.contact-section .contact-form', { opacity: 0, y: 20 });
    }
  }

  // 揭示板块内容（带入场动画）
  function revealSectionContent(section) {
    if (!section) return;
    var key = section.classList[0] || section.id;

    gsap.to(section, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });

    if (v5Played[key] === true) {
      // 已播放过入场动画，快速恢复子元素可见性
      var children = section.querySelectorAll('.t-card, .skill-card, .canvas-tag, .doc-card, .project-folder, .contact-card, .chip, .t-number, .path-header, .docs-header, .projects-header, .sidebar-avatar, .sidebar-name, .elevator-pitch, .about-main, .contact-item, .fill-bar-fill, .gacha-ball, .gacha-shell-left, .gacha-shell-right, .top-pill, .gacha-title, .cta-button, .contact-form, .contact-heading, .contact-sub, .skills-header, .cap-card, .cap-desc, .cap-title, .contact-points .point-card, .contact-callout');
      children.forEach(function(c) {
        gsap.to(c, { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' });
      });
      var pathCards = section.querySelectorAll('.t-card h3, .t-card p, .t-tags span');
      pathCards.forEach(function(c) { gsap.to(c, { opacity: 1, y: 0, duration: 0.2 }); });
      var timeline = section.querySelector('.timeline-line');
      if (timeline) gsap.to(timeline, { scaleY: 1, duration: 0.25, transformOrigin: 'top center' });
      return;
    }
    v5Played[key] = true;

    // 注意：不再使用 gsap.set() 重置子元素，避免同步重置导致的闪烁。
    // 子元素初始状态已由各 IIFE 设为 opacity:0，这里的 fromTo 将直接从该状态动画到目标状态。

    if (section.classList.contains('about-section')) {
      var avatar = section.querySelector('.sidebar-avatar');
      var name = section.querySelector('.sidebar-name');
      var chips = gsap.utils.toArray('.about-section .chip');
      var contacts = gsap.utils.toArray('.about-section .contact-item');
      var pitch = section.querySelector('.elevator-pitch');
      var main = section.querySelector('.about-main');
      var capCards = gsap.utils.toArray('.about-section .cap-card');
      var capTitles = gsap.utils.toArray('.about-section .cap-title');
      var capDescs = gsap.utils.toArray('.about-section .cap-desc');

      var tl = gsap.timeline({ defaults: { ease: 'back.out(1.4)' } });
      if (avatar) tl.fromTo(avatar, { opacity: 0, y: 40, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 });
      if (name) tl.fromTo(name, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.3');
      if (chips.length) tl.fromTo(chips, { opacity: 0, scale: 0.5, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'back.out(2)' }, '-=0.2');
      if (contacts.length) tl.fromTo(contacts, { opacity: 0, y: 25, x: -10 }, { opacity: 1, y: 0, x: 0, duration: 0.4, stagger: 0.09 }, '-=0.15');
      if (pitch) tl.fromTo(pitch, { opacity: 0, y: 35, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, '-=0.1');
      if (main) tl.fromTo(main, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2');
      // 四大核心板块飞入
      capCards.forEach(function (card, i) {
        var dirs = [{ x: -200, y: 80 }, { x: 200, y: -60 }, { x: -150, y: -100 }, { x: 180, y: 80 }];
        var d = dirs[i % 4];
        tl.fromTo(card,
          { opacity: 0, x: d.x, y: d.y, rotation: (i % 2 === 0 ? -8 : 8), scale: 0.9 },
          { opacity: 1, x: 0, y: 0, rotation: 0, scale: 1, duration: 0.7, stagger: 0.15, ease: 'back.out(1.2)' },
          '-=0.3'
        );
      });
      capTitles.forEach(function (title, i) {
        tl.fromTo(title,
          { opacity: 0, x: i % 2 === 0 ? -30 : 30 },
          { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' },
          '-=0.2'
        );
      });
      capDescs.forEach(function (desc, i) {
        tl.fromTo(desc,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.15'
        );
      });
      // 入场完成后启动漂浮动画（替代被 __animWhenVisible 阻断的 drift）
      tl.eventCallback('onComplete', function () {
        capCards.forEach(function (card, i) {
          var driftDir = i % 2 === 0 ? 1 : -1;
          gsap.to(card, {
            x: driftDir * gsap.utils.random(15, 30),
            y: gsap.utils.random(-10, 10),
            rotation: driftDir * gsap.utils.random(1, 3),
            duration: 3 + Math.random() * 2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: 0.5
          });
        });
      });
    }

    if (section.classList.contains('skills-section')) {
      var cards = gsap.utils.toArray('.skills-section .skill-card');
      var sHeader = section.querySelector('.skills-header');
      var tl3 = gsap.timeline({ defaults: { ease: 'power2.out' } });
      if (sHeader) tl3.to(sHeader, { opacity: 1, y: 0, duration: 0.3 });
      cards.forEach(function (card, i) {
        tl3.fromTo(card, { opacity: 0, y: 35, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.3)' }, '-=0.2');
        var fill = card.querySelector('.skill-fill');
        var pct = card.querySelector('.skill-pct');
        if (fill) {
          var w = fill.getAttribute('data-width') || '80';
          gsap.fromTo(fill, { width: '0%' }, { width: w + '%', duration: 0.8, ease: 'power2.out', delay: 0.2 + i * 0.1 });
        }
        if (pct) {
          var target = parseInt(pct.textContent) || 80;
          var obj = { val: 0 };
          gsap.to(obj, { val: target, duration: 0.9, ease: 'power2.out', delay: 0.2 + i * 0.1,
            onUpdate: function () { pct.textContent = Math.round(obj.val) + '%'; }
          });
        }
      });
    }

    if (section.classList.contains('canvas-section')) {
      var tags = gsap.utils.toArray('.canvas-section .canvas-tag');
      gsap.fromTo(tags, { opacity: 0, scale: 0.4, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'back.out(2)' });
    }

    if (section.classList.contains('projects-section')) {
      var folders = gsap.utils.toArray('.projects-section .project-folder');
      var pHeader = section.querySelector('.projects-header');
      var tl2 = gsap.timeline({ defaults: { ease: 'back.out(1.2)' } });
      if (pHeader) tl2.to(pHeader, { opacity: 1, y: 0, duration: 0.35 });
      folders.forEach(function (folder, i) {
        tl2.fromTo(folder, { opacity: 0, y: 50, rotation: -3, scale: 0.95 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)' }, '-=0.4');
      });
    }

    if (section.classList.contains('path-section')) {
      var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      
      tl.fromTo('.path-section .timeline-line', { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: 'power2.out' });
      tl.to('.path-section .path-header', { opacity: 1, y: 0, duration: 0.4 }, '-=0.3');
      
      var items = gsap.utils.toArray('.path-section .t-item');
      items.forEach(function (item, i) {
        var card = item.querySelector('.t-card');
        var h3 = item.querySelector('.t-card h3');
        var p = item.querySelector('.t-card p');
        var tags = gsap.utils.toArray(item.querySelectorAll('.t-tags span'));
        var num = item.querySelector('.t-number');

        tl.fromTo(card, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.3)' }, '-=0.3');
        if (h3) tl.fromTo(h3, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.4');
        if (p) tl.fromTo(p, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.35 }, '-=0.3');
        if (num) tl.fromTo(num, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }, '-=0.4');
        tags.forEach(function (tag, j) {
          tl.fromTo(tag, { opacity: 0, y: 8, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.5)' }, '-=0.2');
        });
      });
    }

    if (section.classList.contains('docs-section')) {
      var dHeader = section.querySelector('.docs-header');
      var dCards = gsap.utils.toArray('.docs-section .doc-card');
      var tl4 = gsap.timeline({ defaults: { ease: 'back.out(1.3)' } });
      if (dHeader) tl4.fromTo(dHeader, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
      dCards.forEach(function (card, i) {
        tl4.fromTo(card, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.45 }, '-=0.3');
      });
    }

    if (section.classList.contains('gashapon-section')) {
      var tl5 = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl5.to('.gashapon-section .top-pill', { opacity: 1, y: 0, duration: 0.4 });
      tl5.to('.gashapon-section .gacha-title', { opacity: 1, y: 0, duration: 0.4 }, '-=0.25');
      tl5.to('.gashapon-section .gacha-shell-left, .gashapon-section .gacha-shell-right', { opacity: 1, duration: 0.3 }, '-=0.2');
      tl5.to('.gashapon-section .gacha-ball', { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.3');
    }

    if (section.classList.contains('contact-section')) {
      var tl6 = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl6.fromTo('.contact-section .contact-heading', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
      tl6.fromTo('.contact-section .contact-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.25');
      tl6.fromTo('.contact-section .contact-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.12, ease: 'back.out(1.3)' }, '-=0.2');
      tl6.fromTo('.contact-section .cta-button', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, '-=0.15');
      tl6.fromTo('.contact-section .contact-form', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, '-=0.15');
    }
  }

  // 安排揭示时机（滚动稳定后）
  var pendingReveals = {};

  function scheduleReveal(section, delay) {
    var key = section.classList[0] || section.id;
    if (pendingReveals[key]) clearTimeout(pendingReveals[key]);
    pendingReveals[key] = setTimeout(function () {
      delete pendingReveals[key];
      revealSectionContent(section);
    }, delay);
  }

  // 核心过渡 — peel 遮罩 + 内容揭示
  function triggerTransition(fromSec, toSec) {
    if (isTransitioning) return;
    isTransitioning = true;

    var vh = window.innerHeight;
    var vw = window.innerWidth;
    var colors = ['#c4b5e8', '#f8bbd0', '#b2dfdb'];
    var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    var toKey = toSec.classList[0] || toSec.id;
    var alreadyPlayed = (v5Played[toKey] === true);

    if (reduceMotion) {
      gsap.killTweensOf(overlay);
      revealSectionContent(toSec);
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 0.5, duration: 0.15, onComplete: function () {
        gsap.to(overlay, { opacity: 0, duration: 0.15 });
      }});
      isTransitioning = false;
      return;
    }

    // Step 1: 残影
    if (fromSec) {
      var fromRect = fromSec.getBoundingClientRect();
      var trailH = Math.min(140, Math.max(40, fromRect.height * 0.25));
      var baseTop = Math.max(0, fromRect.top);
      for (var i = 0; i < 3; i++) {
        makeTrail(baseTop + i * 14, trailH, colors[i], colors[(i + 1) % 3], i * 20);
      }
    }

    // Steps 2-5: peel 遮罩 + 发光条 + 装饰线
    glow.style.top = (vh * 0.5) + 'px';
    glow.style.width = vw + 'px';
    rule.style.top = (vh * 0.85) + 'px';
    rule.style.left = '50%';
    rule.style.width = Math.min(vw - 60, 500) + 'px';

    gsap.killTweensOf([overlay, glow, rule]);

    // 关键：在 peel 遮罩播放期间同步揭示内容，遮罩掩盖入场动画的初始帧
    if (!alreadyPlayed) {
      revealSectionContent(toSec);
    } else {
      // 已播放过 — 仅确保可见
      gsap.to(toSec, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
    }

    var tl = gsap.timeline();
    tl.fromTo(overlay, { opacity: 0 }, { opacity: 0.92, duration: 0.08, ease: 'power2.out' })
      .to(overlay, { opacity: 0, duration: 0.22, ease: 'power2.inOut' }, 0.08)
      .fromTo(glow, { opacity: 0.9, scaleX: 0.01 }, { opacity: 0, scaleX: 1, duration: 0.35, ease: 'power2.inOut', transformOrigin: 'left center' }, 0)
      .fromTo(rule, { opacity: 0, scaleX: 0 }, { opacity: 0.6, scaleX: 1, duration: 0.12, transformOrigin: 'center' }, 0)
      .to(rule, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.1);

    isTransitioning = false;
  }

  // 滚动监听 - 触发过渡 + 安排揭示
  window.addEventListener('scroll', function () {
    if (isTransitioning) return;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = null;
      handleScroll();
    });
  }, { passive: true });

  function handleScroll() {
    if (navScrolling) return;
    var now = Date.now();
    if (now - lastTriggerTime < 200) return;

    var idx = getSectionAt(window.scrollY);
    if (idx < 0) return;
    if (idx === currentSectionIdx) return;

    var fromSec = sections[currentSectionIdx];
    var toSec = sections[idx];

    triggerTransition(fromSec, toSec);
    currentSectionIdx = idx;
    lastTriggerTime = now;
    // 揭示已由 triggerTransition 内的 timeline.onComplete 处理，不再需要 scheduleReveal
  }

  function makeTrail(top, height, c1, c2, delay) {
    var t = document.createElement('div');
    t.className = 'peel-trail-item';
    t.style.top = top + 'px';
    t.style.width = '100%';
    t.style.height = height + 'px';
    t.style.background = 'linear-gradient(180deg, ' + hex(c1, 0.35) + ', ' + hex(c2, 0.26) + ')';
    t.style.opacity = '0';
    trailContainer.appendChild(t);

    gsap.fromTo(t, { opacity: 0.85, y: 0 }, { opacity: 0, y: -50, duration: 0.5, delay: delay / 1000, ease: 'power3.in' });

    setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 650 + delay);
  }

  function hex(h, a) {
    return 'rgba(' + parseInt(h.slice(1,3),16) + ',' + parseInt(h.slice(3,5),16) + ',' + parseInt(h.slice(5,7),16) + ',' + a + ')';
  }

  // 导航点击 - 隐藏 → 过渡 → 滚动 → 揭示
  var navs = document.querySelectorAll('.nav-link');
  for (var i = 0; i < navs.length; i++) {
    navs[i].addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      e.preventDefault();
      var el = document.getElementById(href.substring(1));
      if (!el) return;

      var idx = getSectionIndex(el);
      if (idx >= 0) {
        // 导航点击：先触发过渡（含 hide + peel + reveal），再平滑滚动
        if (!isTransitioning && idx !== currentSectionIdx) {
          triggerTransition(sections[currentSectionIdx], el);
          currentSectionIdx = idx;
        }

        navScrolling = true;
        if (navScrollTimer) clearTimeout(navScrollTimer);
        navScrollTimer = setTimeout(function () { navScrolling = false; }, 700);

        window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
        // 揭示由 triggerTransition timeline.onComplete 自动处理
      } else {
        window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
      }
    });
  }
})();

/* ============================================================
   联系区：大卡片浮现
   ============================================================ */
(function () {
  if (typeof gsap === 'undefined') return;
  var section = document.querySelector('.contact-section');
  if (!section) return;

  var heading = section.querySelector('.contact-heading');
  var sub = section.querySelector('.contact-sub');
  var cards = gsap.utils.toArray('.contact-section .contact-card');
  var ctaButtons = gsap.utils.toArray('.contact-section .cta-button');
  var form = section.querySelector('.contact-form');
  var labelRow = section.querySelector('.contact-label-row');

  gsap.set([heading, sub, cards, ctaButtons, form, labelRow], { opacity: 0 });

  __animWhenVisible('.contact-section', function () {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (heading) tl.to(heading, { opacity: 1, y: 0, duration: 0.4 });
    if (sub) tl.to(sub, { opacity: 1, y: 0, duration: 0.4 }, '-=0.25');
    if (labelRow) tl.to(labelRow, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2');
    if (cards.length) tl.to(cards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'back.out(1.4)' }, '-=0.25');
    if (ctaButtons.length) tl.to(ctaButtons, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, '-=0.2');
    if (form) tl.to(form, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2');
  }, { start: 'top 80%' });
})();


/* ============================================================
   彩蛋：点击 Logo 彩虹光环
   ============================================================ */
(function () {
  var logo = document.querySelector('.nav-logo');
  if (!logo) return;
  var clicks = 0;
  logo.addEventListener('click', function () {
    clicks++;
    if (clicks >= 5) {
      var colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];
      document.querySelectorAll('.glass-card, .skill-card, .contact-card, .chip, .canvas-tag').forEach(function (el, i) {
        gsap.to(el, { boxShadow: '0 0 20px ' + colors[i % colors.length] + '80', duration: 0.3, yoyo: true, repeat: 3 });
      });
      clicks = 0;
    }
  });
})();


/* ============================================================
   页面加载完成 - 启动所有动画
   ============================================================ */
window.addEventListener('load', function () {
  setTimeout(function () {
    document.querySelectorAll('.glass-card, .skill-card, .contact-card').forEach(function (el) {
      gsap.to(el, { y: 0, rotation: 0, duration: 0.4, ease: 'back.out(1.2)' });
    });
  }, 100);
});
