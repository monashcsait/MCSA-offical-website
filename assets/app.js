(() => {
  'use strict';
  let preferences = {
    remember: true,
    intro: true,
    motion: true
  };
  try {
    preferences = {
      ...preferences,
      ...JSON.parse(localStorage.getItem('mcsa-preferences') || '{}')
    };
  } catch {}
  const reducedMotion = () => !preferences.motion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const langs = ['zh', 'en', 'hant'];
  let lang = 'zh';
  try {
    lang = localStorage.getItem('mcsa-language') || 'zh'
  } catch {}
  if (lang === 'yue') lang = 'hant';
  if (!langs.includes(lang)) lang = 'zh';
  if (document.body.dataset.page === 'admin') lang = 'zh';
  let data = null;
  let slide = 0,
    timer = null,
    paused = false;
  const page = document.body.dataset.page;
  let startX = 0;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));
  const t = o => typeof o === 'string' ? o : (o?.[lang] || '');
  const ui = (zh, en, hant) => t(data.interfaceText?.[zh] || {
    zh,
    en,
    hant
  });

  function safe(v) {
    if (typeof v !== 'string' || /[\u0000-\u0020\\]/.test(v)) return '';
    if (/^https?:\/\//i.test(v)) {
      try {
        const u = new URL(v);
        return u.username || u.password ? '' : v
      } catch {
        return ''
      }
    }
    return /^(?:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)*\.(?:html|png|jpe?g|webp|gif)(?:[?#][a-zA-Z0-9_=&%-]+)?|#[a-zA-Z0-9_-]+)$/.test(v) && !v.includes('..') ? v : ''
  }

  function image(src, alt, crop, extra = '') {
    src = safe(src);
    if (!src) return '';
    if (crop) {
      const [x, y, w, h, iw] = crop;
      return `<div class="sprite ${extra}" style="aspect-ratio:${w}/${h}"><img src="${esc(src)}" alt="${esc(alt)}" style="width:${iw/w*100}%;max-width:none;left:${-x/w*100}%;top:${-y/h*100}%" loading="lazy"></div>`
    }
    return `<img class="${extra}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy">`
  }
  const route = k => k === 'home' ? 'index.html' : k === 'about' ? 'index.html#about' : k + '.html';
  const label = k => k === 'home' ? ui('首页', 'Home', '首頁') : t(data.pages[k]?.title);
  const a = (url, text, cls = '') => `<a class="${cls}" href="${esc(safe(url)||'#')}" ${/^https?:/.test(url)?'target="_blank" rel="noopener noreferrer"':''}>${text}</a>`;

  function navLabel(k) {
    return lang === 'en' ? ({
      about: 'About us',
      'latest-events': 'Events',
      'campus-info': 'Campus info',
      'past-review': 'Highlights',
      presidents: 'Presidium',
      discounts: 'Discounts',
      sponsors: 'Sponsors'
    } [k] || label(k)) : label(k)
  }

  // Navigation and department cards deliberately share the same department URL.
  function nav() {
    const primaryLinks = ['about', 'latest-events', 'campus-info', 'past-review']
      .map(key => a(route(key), esc(navLabel(key)), page === key ? 'active' : ''))
      .join('');
    const secondaryLinks = ['presidents', 'discounts', 'sponsors']
      .map(key => a(route(key), esc(navLabel(key)), page === key ? 'active' : ''))
      .join('');
    const departmentLinks = data.departments.map(department => {
      const name = esc(t(department.name));
      return department.url ?
        a(department.url, name) :
        `<span class="nav-disabled">${name}</span>`;
    }).join('');
    const languageOptions = [
        ['zh', '简体中文'],
        ['en', 'English'],
        ['hant', '繁體中文']
      ]
      .map(([value, name]) => `<option value="${value}" ${value === lang ? 'selected' : ''}>${name}</option>`).join('');
    const brand = image(data.settings.logo, 'MCSA') + `
      <span>
        <b>Monash Chinese Student Association</n>
        <small>${ui('蒙纳士中国学生会', 'Monash Chinese Students Association', '蒙納士中國學生會')}</small>
      </span>`;

    return `
      <div class="site-header">
        <div class="header-inner">
          ${a('index.html', brand, 'brand')}
          <button class="menu-button" aria-expanded="false" aria-controls="navigation">
            ${ui('菜单', 'Menu', '菜單')}
          </button>
          <nav id="navigation" aria-label="${ui('主导航', 'Main navigation', '主導航')}">
            ${primaryLinks}
            <details class="nav-dropdown">
              <summary>${ui('部门招新', 'Recruitment', '部門招新')}</summary>
              <div><div class="department-nav">${departmentLinks}</div></div>
            </details>
            ${secondaryLinks}
          </nav>
          <label class="language-control">
            <span aria-hidden="true">◎</span>
            <select id="language" aria-label="${ui('切换语言', 'Change language', '切換語言')}">
              ${languageOptions}
            </select>
          </label>
        </div>
      </div>`;
  }

  function paragraphs(list) {
    return (list || []).map(x => `<p>${esc(t(x)).replace(/\n/g,'<br>')}</p>`).join('')
  }

  function heading(title, sub = '') {
    return `<div class="section-heading"><h2>${esc(title)}</h2>${sub?`<div>${sub}</div>`:''}</div>`
  }

  function visiblePosts(key) {
    return data.posts.filter(post => post.page === key && post.published)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || data.posts.indexOf(b) - data.posts.indexOf(a));
  }

  function postCard(post) {
    const link = post.url || `article.html?id=${encodeURIComponent(post.id)}`;
    const body = `${image(post.image,t(post.title),post.crop,'post-image') || '<div class="post-placeholder" aria-hidden="true">MCSA</div>'}
  <div class="post-body">${post.date ? `<time>${esc(post.date)}</time>` : ''}<h3>${esc(t(post.title)) || ui('翻译处理中', 'Translation pending', '翻譯處理中')}</h3><p>${esc(t(post.text))}</p><span class="text-link">${ui('阅读详情', 'Read more', '閱讀詳情')} ↗</span></div>`;
    return a(link, body, 'post-card');
  }

  function postGrid(key, limit) {
    const posts = visiblePosts(key).slice(0, limit);
    return posts.length ? `<div class="post-grid ${limit===3?'home-posts':''}">${posts.map(postCard).join('')}</div>` : `<p class="empty-state">${ui('内容将陆续更新，敬请期待。', 'Updates will appear here soon.', '內容將陸續更新，敬請期待。')}</p>`;
  }

  function departments() {
    return window.MCSAHome.departments(viewContext());
  }

  function carousel() {
    return window.MCSAHome.carousel(viewContext());
  }

  function contacts() {
    return window.MCSAHome.contacts(viewContext());
  }

  function linkedHeading(title, url, description = '') {
    return `<div class="section-heading"><h2>${a(url,esc(title)+' <span class="heading-arrow">↗</span>')}</h2><div>${description}</div></div>`;
  }

  function viewContext() {
    return {
      data,
      t,
      ui,
      esc,
      image,
      a,
      heading,
      linkedHeading,
      paragraphs,
      postGridOptional
    };
  }

  function home() {
    const sections = {
      hero: () => window.MCSAHome.hero(viewContext()),
      about: () => `<section class="section" id="about">${heading(label('about'))}<div class="prose">${paragraphs(data.pages.about.paragraphs)}</div>${postGridOptional('about')}</section>`,
      events: () => `<section class="section" id="events">${linkedHeading(label('latest-events'),'latest-events.html')}${postGrid('latest-events',3)}</section>`,
      presidents: carousel,
      departments: () => `<section class="section" id="departments">${linkedHeading(ui('部门介绍','Departments','部門介紹'),'recruitment.html',paragraphs([data.settings.departmentHint]))}${departments()}</section>`
    };
    return data.homeSections.filter(section => section.visible)
      .map(section => sections[section.id]?.() || '').join('') + postGridOptional('home');
  }

  function postGridOptional(key) {
    return visiblePosts(key).length ? postGrid(key) : '';
  }

  function recruitment() {
    return `<section class="section" id="departments">${heading(label('recruitment'),paragraphs(data.pages.recruitment.paragraphs))}${departments()}</section>${postGridOptional('recruitment')}`;
  }

  function eventCarousel() {
    const posts = visiblePosts('latest-events').slice(0, 3);
    if (!posts.length) return '';
    return `<section class="event-carousel" aria-label="${ui('最新三个活动', 'Three latest events', '最新三個活動')}"><div class="event-strip">${posts.map(post=>`<div class="event-slide">${postCard(post)}</div>`).join('')}</div><div class="strip-controls"><button data-scroll="-1" aria-label="${ui('上一个活动', 'Previous event', '上一個活動')}">‹</button><button data-pause>${ui('暂停', 'Pause', '暫停')}</button><button data-scroll="1" aria-label="${ui('下一个活动', 'Next event', '下一個活動')}">›</button></div></section>`;
  }

  function archives() {
    const terms = [{
      name: ui('现任主席团', 'Current presidium', '現任主席團'),
      members: data.team
    }, ...(data.terms || []).slice().sort((a, b) => Number(b.year) - Number(a.year)).map(term => ({
      ...term,
      name: t(term.name)
    }))];
    return terms.map(term => `<section class="term"><h2>${esc(term.name)}</h2><div class="member-strip" tabindex="0">${term.members.map(member=>{
 const body=`${image(member.image,t(member.name))}<h3>${esc(t(member.name))}</h3><p>${esc(t(member.role))}</p>`;
 return member.url?a(member.url,body,'member-card'):`<article class="member-card">${body}</article>`;
 }).join('')}</div><div class="strip-controls"><button data-term-pause>${ui('暂停', 'Pause', '暫停')}</button><button data-member="-1" aria-label="${ui('上一位', 'Previous member', '上一位')}">‹</button><button data-member="1" aria-label="${ui('下一位', 'Next member', '下一位')}">›</button></div></section>`).join('');
  }

  function merchantGrid() {
    return `<div class="filters"><label>${ui('地区', 'Area', '地區')}<select id="region-filter"><option value="">${ui('全部地区', 'All areas', '全部地區')}</option>${data.regions.map(x=>`<option value="${esc(x.id)}">${esc(t(x.name))}</option>`).join('')}</select></label><label>${ui('种类', 'Category', '種類')}<select id="category-filter"><option value="">${ui('全部种类', 'All categories', '全部種類')}</option>${data.categories.map(x=>`<option value="${esc(x.id)}">${esc(t(x.name))}</option>`).join('')}</select></label></div><div class="post-grid merchants">${data.merchants.map(m=>`<article class="post-card" data-region="${esc(m.region)}" data-category="${esc(m.category)}">${m.url?a(m.url,`${image(m.image,t(m.name),null,'post-image')}<div class="post-body"><h3>${esc(t(m.name))}</h3><p>${esc(t(m.text))}</p></div>`):`${image(m.image,t(m.name),null,'post-image')}<div class="post-body"><h3>${esc(t(m.name))}</h3><p>${esc(t(m.text))}</p></div>`}</article>`).join('')}</div><p id="filter-empty" class="empty-state" ${data.merchants.length?'hidden':''}>${ui('暂无符合条件的商家。', 'No matching partners yet.', '暫無符合條件的商家。')}</p>`;
  }

  function sponsorGrid() {
    return `<div class="post-grid sponsors">${data.sponsors.map(sponsor=>{
 const body=`${image(sponsor.image,t(sponsor.name))}<h3>${esc(t(sponsor.name))}</h3>`;
 return sponsor.url?a(sponsor.url,body,'sponsor-card'):`<article class="sponsor-card">${body}</article>`;
 }).join('')}</div>`;
  }

  function content() {
    if (page === 'home') return home();
    if (page === 'admin') return '<div id="admin-root"></div>';
    if (page === 'recruitment') return recruitment();
    if (page === 'article') {
      const post = data.posts.find(p => p.id === new URLSearchParams(location.search).get('id') && p.published);
      return post ? `<header class="page-heading"><h1>${esc(t(post.title))}</h1></header><article class="article-detail">${image(post.image,t(post.title),post.crop)}<div class="prose">${paragraphs([post.text])}</div>${post.url?a(post.url,ui('阅读原文', 'Read original', '閱讀原文'),'button'):''}</article>` : `<p class="empty-state">${ui('这篇内容暂未发布。', 'This article is not available.', '這篇內容暫未發佈。')}</p>`;
    }
    const pageInfo = data.pages[page];
    if (['disclaimer', 'privacy', 'accessibility', 'feedback', 'privacy-settings'].includes(page)) return policyPage(pageInfo);
    let result = `<header class="page-heading"><span class="eyebrow">MCSA</span><h1>${esc(label(page))}</h1><div class="prose">${paragraphs(pageInfo?.paragraphs)}</div></header>`;
    if (page === 'latest-events') result += eventCarousel() + heading(ui('所有活动', 'All events', '所有活動'));
    if (page === 'presidents') result += archives();
    else if (page === 'discounts') result += merchantGrid();
    else if (page === 'sponsors') result += sponsorGrid();
    else if (page === 'privacy-settings') result += `<button class="button" id="clear-preferences">${ui('清除本机偏好', 'Clear local preferences', '清除本機偏好')}</button><p id="preferences-status" role="status"></p>`;
    if (page !== 'contact') result += postGridOptional(page);
    return result;
  }

  function policyPage(pageInfo) {
    let result = `<header class="page-heading"><span class="eyebrow">MCSA</span><h1>${esc(t(pageInfo.title))}</h1></header><article class="policy-copy">`;
    result += pageInfo.paragraphs.map((text, index) => index % 2 === 0 ? `<h2>${esc(t(text))}</h2>` : `<p>${esc(t(text))}</p>`).join('') + '</article>';
    if (page === 'feedback') result += `<a class="button primary feedback-action" href="mailto:${esc(data.settings.email)}?subject=${encodeURIComponent(ui('网站反馈','Website feedback','網站反饋'))}">${ui('发送网站反馈','Send website feedback','發送網站反饋')} ↗</a>`;
    if (page === 'privacy-settings') result += `<div class="privacy-options">
      <label><input id="remember-preferences" type="checkbox" ${preferences.remember?'checked':''}>${ui('允许保存本机偏好','Remember preferences on this device','允許保存本機偏好')}</label>
      <label><input id="show-intro" type="checkbox" ${preferences.intro?'checked':''}>${ui('显示开场动画','Show opening animation','顯示開場動畫')}</label>
      <label><input id="allow-motion" type="checkbox" ${preferences.motion?'checked':''}>${ui('允许自动轮播和滚动','Allow automatic carousels and scrolling','允許自動輪播和滾動')}</label>
      <button class="button" id="save-preferences">${ui('保存偏好','Save preferences','保存偏好')}</button>
      <button class="button" id="clear-preferences">${ui('清除本机偏好','Clear local preferences','清除本機偏好')}</button>
      <p id="preferences-status" role="status"></p></div>`;
    return result + postGridOptional(page);
  }

  function render() {
    window.MCSAHome.cleanup();
    window.MCSAHome.applyLayout(data.layout);
    clearInterval(timer);
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(el => el.href = safe(data.settings.logo) || 'images/logo.png');
    document.documentElement.lang = {
      zh: 'zh-CN',
      en: 'en',
      hant: 'zh-Hant'
    } [lang];
    document.title = (page === 'admin' ? ui('内容管理', 'Content management', '內容管理') : page.startsWith('department-') ? t(data.departments.find(d => 'department-' + d.id === page).name) : label(page)).replace(/\n/g, ' ') + ' | MCSA';
    document.querySelector('#app').innerHTML = nav() + `<main id="main" class="container">${content()}</main>${page==='admin'?'':`<div class="container">${contacts()}</div>`}<footer class="footer"><div class="container"><nav class="footer-links">${data.footerLinks.map(link=>a(link.url,esc(t(link.name)))).join('')}</nav><p>${esc(t(data.settings.footer))}</p></div></footer><button id="back-top" class="round" aria-label="${ui('返回顶部', 'Back to top', '返回頂部')}" title="${ui('返回顶部', 'Back to top', '返回頂部')}">↑</button>`;
    bind();
    bindCollections();
    window.MCSAHome.bindDepartments(viewContext(), reducedMotion());
    document.querySelector('.skip').textContent = ui('跳到正文', 'Skip to content', '跳到正文');
    window.dispatchEvent(new CustomEvent('mcsa-render'));
  }

  function updateSlide() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;
    slide = (slide + data.team.length) % data.team.length;
    track.style.transform = `translateX(-${slide*100}%)`;
    document.querySelectorAll('.president-slide').forEach((s, i) => {
      s.setAttribute('aria-hidden', String(i !== slide));
      s.inert = i !== slide
    });
    document.querySelectorAll('[data-slide]').forEach((s, i) => s.setAttribute('aria-current', String(i === slide)))
  }

  function carouselVisible() {
    const bounds = document.querySelector('.carousel')?.getBoundingClientRect();
    return bounds && bounds.top < innerHeight && bounds.bottom > 0;
  }

  function restart() {
    clearInterval(timer);
    if (!paused && !reducedMotion()) timer = setInterval(() => {
      if (!document.hidden && !document.querySelector('.opening') && !document.querySelector('.carousel')?.matches(':hover, :focus-within') && carouselVisible()) {
        slide++;
        updateSlide()
      }
    }, data.layout.carouselSeconds * 1000)
  }

  function bind() {
    document.querySelector('#language').onchange = e => {
      if (page === 'admin' && window.CMS?.dirty && !confirm(ui('切换语言会丢弃未保存修改，继续吗？', 'Discard unsaved edits to change language?', '切換語言會丟棄未保存修改，繼續嗎？'))) {
        e.target.value = lang;
        return
      }
      lang = e.target.value;
      try {
        if (preferences.remember) localStorage.setItem('mcsa-language', lang)
      } catch {}
      render()
    };
    document.querySelector('.menu-button').onclick = e => {
      const n = document.querySelector('#navigation');
      n.classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', n.classList.contains('open'))
    };
    document.querySelector('#back-top').onclick = () => scrollTo({
      top: 0,
      behavior: reducedMotion() ? 'auto' : 'smooth'
    });
    document.querySelectorAll('.carousel .prev,.carousel .next').forEach(b => b.onclick = () => {
      slide += b.classList.contains('next') ? 1 : -1;
      updateSlide();
      restart()
    });
    document.querySelectorAll('[data-slide]').forEach(b => b.onclick = () => {
      slide = Number(b.dataset.slide);
      updateSlide();
      restart()
    });
    const box = document.querySelector('.carousel-window');
    if (box) {
      box.onkeydown = e => {
        if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          slide += e.key === 'ArrowRight' ? 1 : -1;
          updateSlide();
          restart()
        }
      };
      box.addEventListener('touchstart', e => startX = e.changedTouches[0].clientX, {
        passive: true
      });
      box.addEventListener('touchend', e => {
        const delta = e.changedTouches[0].clientX - startX;
        if (Math.abs(delta) > 45) {
          slide += delta < 0 ? 1 : -1;
          updateSlide();
          restart()
        }
      }, {
        passive: true
      });
      document.querySelector('.pause').onclick = e => {
        paused = !paused;
        e.currentTarget.textContent = paused ? ui('播放', 'Play', '播放') : ui('暂停', 'Pause', '暫停');
        e.currentTarget.setAttribute('aria-pressed', paused);
        restart()
      };
      updateSlide();
      restart()
    }
  }

  function bindCollections() {
    document.querySelectorAll('.filters select').forEach(select => select.onchange = () => {
      const region = document.querySelector('#region-filter').value;
      const category = document.querySelector('#category-filter').value;
      let count = 0;
      document.querySelectorAll('.merchants .post-card').forEach(card => {
        card.hidden = !!((region && card.dataset.region !== region) || (category && card.dataset.category !== category));
        if (!card.hidden) count++;
      });
      document.querySelector('#filter-empty').hidden = count > 0;
    });
    document.querySelectorAll('[data-member]').forEach(button => button.onclick = () => {
      const strip = button.closest('.term').querySelector('.member-strip');
      strip.scrollBy({
        left: Number(button.dataset.member) * (strip.firstElementChild?.offsetWidth + 20 || 200),
        behavior: 'smooth'
      });
    });
    (window.termTimers || []).forEach(clearInterval);
    window.termTimers = [];
    document.querySelectorAll('.term').forEach(term => {
      const members = term.querySelector('.member-strip');
      const pause = term.querySelector('[data-term-pause]');
      let stopped = reducedMotion();
      const update = () => {
        pause.textContent = stopped ? ui('播放', 'Play', '播放') : ui('暂停', 'Pause', '暫停');
        pause.setAttribute('aria-pressed', String(stopped));
      };
      update();
      pause.onclick = () => {
        stopped = !stopped;
        update();
      };
      window.termTimers.push(setInterval(() => {
        if (stopped || document.hidden || term.matches(':hover,:focus-within')) return;
        const card = members.firstElementChild;
        if (!card) return;
        if (members.scrollWidth <= members.clientWidth + 2) {
          members.append(card);
        } else {
          const end = members.scrollLeft + members.clientWidth >= members.scrollWidth - 5;
          members.scrollTo({
            left: end ? 0 : members.scrollLeft + card.offsetWidth + 20,
            behavior: 'smooth'
          });
        }
      }, 6500));
    });
    const strip = document.querySelector('.event-strip');
    if (strip) {
      let position = 0,
        stopped = reducedMotion();
      const move = direction => {
        position = (position + direction + strip.children.length) % strip.children.length;
        strip.scrollTo({
          left: position * strip.clientWidth,
          behavior: reducedMotion() ? 'auto' : 'smooth'
        });
      };
      document.querySelectorAll('[data-scroll]').forEach(button => button.onclick = () => move(Number(button.dataset.scroll)));
      const pause = document.querySelector('[data-pause]');
      const update = () => {
        pause.textContent = stopped ? ui('播放', 'Play', '播放') : ui('暂停', 'Pause', '暫停');
        pause.setAttribute('aria-pressed', String(stopped));
      };
      update();
      pause.onclick = () => {
        stopped = !stopped;
        update();
      };
      clearInterval(window.eventTimer);
      window.eventTimer = setInterval(() => {
        if (!stopped && !document.hidden && !strip.parentElement.matches(':hover,:focus-within')) move(1);
      }, data.layout.carouselSeconds * 1000);
    }
    const savePreferences = document.querySelector('#save-preferences');
    if (savePreferences) savePreferences.onclick = () => {
      preferences = {
        remember: document.querySelector('#remember-preferences').checked,
        intro: document.querySelector('#show-intro').checked,
        motion: document.querySelector('#allow-motion').checked
      };
      try {
        if (preferences.remember) localStorage.setItem('mcsa-preferences', JSON.stringify(preferences));
        else {
          localStorage.removeItem('mcsa-preferences');
          localStorage.removeItem('mcsa-language');
          sessionStorage.removeItem('mcsa-intro-seen');
        }
      } catch {}
      document.querySelector('#preferences-status').textContent = preferences.remember ? ui('偏好已保存。', 'Preferences saved.', '偏好已保存。') : ui('已停止保存，当前选择仅在本页生效。', 'Storage disabled. These choices apply to this page only.', '已停止保存，當前選擇僅在本頁生效。');
    };
    const clear = document.querySelector('#clear-preferences');
    if (clear) clear.onclick = () => {
      try {
        localStorage.removeItem('mcsa-language');
        localStorage.removeItem('mcsa-preferences');
        sessionStorage.removeItem('mcsa-intro-seen');
      } catch {}
      document.querySelector('#preferences-status').textContent = ui('已清除。', 'Preferences cleared.', '已清除。');
    };
  }

  function intro() {
    if (new URLSearchParams(location.search).has('preview')) return;
    if (page !== 'home' || !preferences.intro || reducedMotion()) return;
    try {
      if (sessionStorage.getItem('mcsa-intro-seen')) return;
      if (preferences.remember) sessionStorage.setItem('mcsa-intro-seen', '1')
    } catch {}
    const src = safe(data.settings.opening);
    if (!src) return;
    const overlay = document.createElement('div');
    overlay.className = 'opening';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', ui('MCSA 开场动画', 'MCSA opening animation', 'MCSA 開場動畫'));
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `<img alt="MCSA" src="${esc(src)}"><button>${ui('跳过动画', 'Skip intro', '跳過動畫')} →</button>`;
    document.body.append(overlay);
    document.querySelector('#app').inert = true;
    document.body.style.overflow = 'hidden';
    let ended = false;

    function close() {
      if (ended) return;
      ended = true;
      overlay.remove();
      document.querySelector('#app').inert = false;
      document.body.style.overflow = '';
      document.querySelector('.brand')?.focus()
    }
    overlay.querySelector('button').onclick = close;
    overlay.querySelector('button').focus();
    overlay.onkeydown = e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        e.preventDefault();
        overlay.querySelector('button').focus()
      }
    };
    const img = overlay.querySelector('img');
    img.onload = () => setTimeout(close, data.settings.openingDuration || 5600);
    img.onerror = close;
    if (img.complete && img.naturalWidth) setTimeout(close, data.settings.openingDuration || 5600);
    setTimeout(close, 30000)
  }
  window.MCSA = {
    esc,
    t,
    ui,
    safe,
    image,
    get data() {
      return data
    },
    get lang() {
      return lang
    },
    render,
    setData(d) {
      data = d;
      render()
    }
  };
  document.addEventListener('click', e => document.querySelectorAll('.nav-dropdown[open]').forEach(d => {
    if (!d.contains(e.target)) d.open = false
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.nav-dropdown[open]').forEach(d => d.open = false)
  });
  function connectionState(failed = false) {
    const copy = {
      zh: ['正在加载官网', '正在获取最新内容，请稍候。', '暂时无法加载官网', '请检查网络连接，稍后重试。', '重新加载'],
      en: ['Loading MCSA', 'Getting the latest content. Please wait.', 'Unable to load the website', 'Please check your connection and try again.', 'Try again'],
      hant: ['正在載入官網', '正在取得最新內容，請稍候。', '暫時無法載入官網', '請檢查網路連線，稍後重試。', '重新載入']
    }[lang];
    document.documentElement.lang = {zh: 'zh-CN', en: 'en', hant: 'zh-Hant'}[lang];
    document.querySelector('#app').innerHTML = `<main id="main" class="connection-state" role="status"><img src="images/logo.png" alt="MCSA"><h1>${copy[failed ? 2 : 0]}</h1><p>${copy[failed ? 3 : 1]}</p>${failed ? `<button class="button primary" id="retry-content">${copy[4]}</button>` : ''}</main>`;
    document.querySelector('#retry-content')?.addEventListener('click', () => location.reload());
  }

  let loading = false;
  async function loadWebsite() {
    if (loading) return;
    loading = true;
    clearInterval(timer);
    window.MCSAHome.cleanup();
    connectionState();
    try {
      const preview = window.MCSAContent.previewRequested();
      const result = await (preview ? window.MCSAContent.previewData() : window.MCSAContent.load());
      data = result.data;
      if (preview) lang = 'zh';
      document.documentElement.dataset.contentRevision = String(result.revision);
      render();
      if (!preview) intro();
      if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
    } catch (error) {
      console.error('MCSA content loading failed:', error);
      connectionState(true);
    } finally {
      loading = false;
    }
  }
  // A browser Back navigation can restore the previous DOM without requesting HTML.
  window.addEventListener('pageshow', event => {
    if (event.persisted && !window.MCSAContent.previewRequested()) loadWebsite();
  });
  loadWebsite();
})();
