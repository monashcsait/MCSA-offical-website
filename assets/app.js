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

  // Department navigation opens internal pages; recruitment URLs belong inside them.
  const departmentRoute = department => 'department-' + encodeURIComponent(department.id) + '.html';

  const departmentDirectoryRoute = () => 'recruitment.html';

  function nav() {
    const primaryLinks = ['about', 'latest-events', 'campus-info', 'past-review']
      .map(key => a(route(key), esc(navLabel(key)), page === key ? 'active' : ''))
      .join('');
    const secondaryLinks = ['presidents', 'discounts', 'sponsors']
      .map(key => a(route(key), esc(navLabel(key)), page === key ? 'active' : ''))
      .join('');
    const languageOptions = [
        ['zh', '简体中文'],
        ['en', 'English'],
        ['hant', '繁體中文']
      ]
      .map(([value, name]) => `<option value="${value}" ${value === lang ? 'selected' : ''}>${name}</option>`).join('');
    const brand = image(data.settings.logo, 'MCSA') + `
      <span>
        <b>Monash Chinese Student Association</b>
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
            ${a(departmentDirectoryRoute(), ui('部门招新', 'Recruitment', '部門招新'), page === 'recruitment' || page.startsWith('department-') ? 'active' : '')}
            ${secondaryLinks}
          </nav>
          <label class="language-control">
            <span class="language-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false">
                <path d="M2 5h12M7 2h1m4 3c-1.5 4-4 7-8 9M5 8l6 6m1 8 5-11 5 11m-8-4h6"/>
              </svg>
            </span>
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
      departments: () => `<section class="section" id="departments">${linkedHeading(ui('部门介绍','Departments','部門介紹'),departmentDirectoryRoute(),paragraphs([data.settings.departmentHint]))}${departments()}</section>`
    };
    return data.homeSections.filter(section => section.visible)
      .map(section => sections[section.id]?.() || '').join('') + postGridOptional('home');
  }

  function postGridOptional(key) {
    return visiblePosts(key).length ? postGrid(key) : '';
  }

  function recruitment() {
    return `<section class="section" id="departments"><header class="page-heading"><h1>${esc(label('recruitment'))}</h1><div class="prose">${paragraphs(data.pages.recruitment.paragraphs)}</div></header>${departments()}</section>${postGridOptional('recruitment')}`;
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
    return `<section id="merchant-experience" aria-label="${esc(ui('折扣商家地图与列表', 'Partner map and list', '折扣商家地圖與列表'))}"></section>`;
  }

  function sponsorGrid() {
    return `<div class="post-grid sponsors">${data.sponsors.map(sponsor=>{
 const body=`${image(sponsor.image,t(sponsor.name))}<h3>${esc(t(sponsor.name))}</h3>`;
 return sponsor.url?a(sponsor.url,body,'sponsor-card'):`<article class="sponsor-card">${body}</article>`;
 }).join('')}</div>`;
  }

  function departmentPage() {
    const department = data.departments.find(d => 'department-' + d.id === page && d.published !== false);
    if (!department) return `<header class="page-heading"><h1>${ui('此部门暂未发布','Department unavailable','此部門暫未發佈')}</h1></header>${a('recruitment.html',ui('查看其他部门','Browse departments','查看其他部門'),'button')}`;
    const pending = ui('内容即将更新。','Details will be added soon.','內容即將更新。');
    const copy = value => `<p>${esc(t(value) || pending)}</p>`;
    const section = (title, value) => `<section class="department-panel"><h2>${title}</h2>${copy(value)}</section>`;
    let recruitmentUrl = '';
    try {
      const candidate = new URL(department.recruitmentUrl || department.url || '');
      if (candidate.protocol === 'https:' && candidate.hostname === 'mp.weixin.qq.com' && !candidate.username && !candidate.password) recruitmentUrl = candidate.href;
    } catch {}
    if (department.articleLayout === 'publicity') return window.MCSAPublicity.render(department, lang);
    if (department.articleLayout === 'secretariat') return window.MCSASecretariat.render(department, lang);
    if (department.articleLayout) {
      const photo = (src, alt) => `<figure class="article-photo">${image(src,alt,null,'article-original')}</figure>`;
      const story = value => `<div class="article-story">${t(value).split(/\n\n+/).filter(Boolean).map((block,i)=>`<div class="story-step"><span class="story-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><p>${esc(block)}</p></div>`).join('')}</div>`;
      const title = text => `<h2 class="article-section-title">${text}</h2>`;
      const gallery = department.gallery || [];
      const introLines = t(department.intro).split('\n');
      const aboutIntro = lang === 'zh' ? `<div class="about-manifesto"><p class="about-eyebrow">${esc(introLines[0])}</p><div class="about-traits"><span>最会玩</span><span>最能造</span><span>最有战斗力</span></div><p class="about-punchline">${esc(introLines.slice(2).join(' '))}</p></div>` : `<div class="about-manifesto"><p class="about-punchline">${esc(t(department.intro))}</p></div>`;
      const responsibilityBlocks = t(department.responsibilities).split(/\n\n+/).filter(Boolean);
      const aboutResponsibilities = `<div class="about-narrative">${responsibilityBlocks.map((text,index) => `<div class="about-beat about-beat-${index}"><span class="about-beat-symbol" aria-hidden="true">${['✦','↗','⚡'][index % 3]}</span><p>${esc(text)}</p></div>`).join('')}</div>`;

      const leaders = (department.leadership || []).map(leader => `<figure class="article-leader"><figcaption><p class="leader-role">${esc(t(leader.role))}</p><h3>${esc(t(leader.name))}</h3></figcaption>${leader.image ? (leader.crop ? image(leader.image,t(leader.name),leader.crop,'department-portrait') : photo(leader.image,t(leader.name))) : `<div class="department-photo-pending">${ui('照片即将更新','Photo coming soon','照片即將更新')}</div>`}${t(leader.quote) ? `<blockquote>${esc(t(leader.quote))}</blockquote>` : ''}</figure>`).join('');
      const groups = (department.groups || []).map(group => `<section class="article-subsection"><h3>${esc(t(group.name))}</h3>${story(group.text)}</section>`).join('');
      const requirements = (department.groups || []).map(group => `<section class="article-subsection"><h3>${esc(t(group.name))}</h3><ul>${(group.requirements || []).map(item => `<li>${esc(t(item))}</li>`).join('')}</ul></section>`).join('');
      return `<article class="department-article">
        <nav class="department-breadcrumb" aria-label="${ui('面包屑导航','Breadcrumb','麵包屑導航')}">${a('recruitment.html',ui('所有部门','All departments','所有部門'))} / ${esc(t(department.name))}</nav>
        <header class="article-heading"><span class="article-kicker">MCSA · EVENT TEAM</span><h1>${esc(t(department.name))}</h1><p class="recruitment-status">${esc(t(department.recruitmentStatus))}</p></header>
        ${photo(department.poster,ui('组织部招新海报（往期）','Organisation Department recruitment poster (past round)','組織部招新海報（往期）'))}
        <section class="article-section article-about" id="department-about">${title(ui('关于我们','About us','關於我們'))}${aboutIntro}${aboutResponsibilities}${photo(gallery[0],ui('篮球活动合照','Basketball event group photo','籃球活動合照'))}${copy(t(department.recruitment).split('\n\n')[0])}${copy(department.dailyWork)}${copy(t(department.recruitment).split('\n\n').slice(1).join('\n\n'))}${photo(gallery[1],ui('室内活动合照','Indoor group photo','室內活動合照'))}<p class="article-divider">Daily life</p>${photo(gallery[2],ui('户外合照','Outdoor group photo','戶外合照'))}</section>
        <section class="article-section">${title(ui('部长寄语','Messages from the Department Leaders','部長寄語'))}${leaders}</section>
        <section class="article-section">${title(ui('部门核心小组','Our core teams','部門核心小組'))}${groups}</section>
        <section class="article-section">${title(ui('岗位要求','Role requirements','崗位要求'))}${requirements}${title(ui('面试准备','Interview preparation','面試準備'))}${copy(department.interview)}</section>
        <section class="article-section">${title(ui('福利待遇','What you can gain','福利待遇'))}${story(department.benefits)}</section>
        <section class="article-section">${title(ui('往期报名方式','Past application instructions','往期報名方式'))}<p class="recruitment-status">${esc(t(department.recruitmentStatus))}</p>${copy(department.applicationNote)}${photo(department.applicationImage,ui('往期招新二维码及报名说明','Past recruitment QR codes and application instructions','往期招新二維碼及報名說明'))}${recruitmentUrl ? a(recruitmentUrl,ui('查看微信招新推文','Read the WeChat recruitment post','查看微信招新推文')+' ↗','button primary') : ''}</section>
        </article>`;
    }
    const groups = (department.groups || []).map(group => `<article class="department-panel"><h3>${esc(t(group.name))}</h3>${copy(group.text)}${group.requirements?.length ? `<h4>${ui('岗位要求','Role requirements','崗位要求')}</h4><ul>${group.requirements.map(item => `<li>${esc(t(item))}</li>`).join('')}</ul>` : ''}</article>`).join('');
    const leaders = (department.leadership || []).map(leader => `<figure class="department-leader">${image(leader.image,t(leader.name),leader.crop,'department-portrait')}<figcaption><p class="leader-role">${esc(t(leader.role))}</p><h3>${esc(t(leader.name))}</h3><blockquote>${esc(t(leader.quote))}</blockquote></figcaption></figure>`).join('');
    const heads = (Array.isArray(department.heads) ? department.heads : []).slice().sort((a,b) => String(b.termStart || '').localeCompare(String(a.termStart || '')));
    return `<nav class="department-breadcrumb" aria-label="${ui('面包屑导航','Breadcrumb','麵包屑導航')}">${a('recruitment.html',ui('所有部门','All departments','所有部門'))} / ${esc(t(department.name))}</nav>
      <header class="department-hero"><span class="eyebrow">MCSA · ${ui('我们的团队','OUR TEAMS','我們的團隊')}</span><h1>${esc(t(department.name))}</h1>${copy(department.intro)}${image(department.image,t(department.name),null,'department-photo')}</header>
      <div class="department-content-grid">${section(ui('部门职责','Responsibilities','部門職責'),department.responsibilities || department.intro)}${section(ui('日常工作','What we do','日常工作'),department.dailyWork)}</div>
      ${groups ? `<section aria-labelledby="department-groups"><h2 id="department-groups">${ui('部门核心小组','Our core teams','部門核心小組')}</h2><div class="department-content-grid department-groups">${groups}</div></section>` : ''}
      ${leaders ? `<section aria-labelledby="department-leaders"><h2 id="department-leaders">${ui('部长寄语','Messages from the Department Leaders','部長寄語')}</h2><div class="department-leaders">${leaders}</div></section>` : ''}
      <section class="department-panel department-recruitment"><h2>${ui('加入我们','Join the team','加入我們')}</h2>${department.recruitmentStatus ? `<p class="recruitment-status">${esc(t(department.recruitmentStatus))}</p>` : ''}${copy(department.recruitment)}${recruitmentUrl ? a(recruitmentUrl,ui('查看微信招新推文','Read the WeChat recruitment post','查看微信招新推文')+' ↗','button primary') : `<p class="department-note">${ui('招新推文链接待公布。','The recruitment article link will be announced here.','招新推文連結待公佈。')}</p>`}</section>
      ${department.interview ? section(ui('面试准备','Interview preparation','面試準備'),department.interview) : ''}
      ${department.benefits ? section(ui('福利待遇','What you can gain','福利待遇'),department.benefits) : ''}
      ${department.applicationNote ? `<details class="department-panel"><summary>${ui('查看往期报名方式','View past application instructions','查看往期報名方式')}</summary>${copy(department.applicationNote)}${image(department.applicationImage,ui('往期招新二维码及报名说明','Past recruitment QR codes and application instructions','往期招新二維碼及報名說明'),null,'department-application-image')}</details>` : ''}
      ${section(ui('部门历史','Our history','部門歷史'),department.history)}
      <section class="department-panel"><h2>${ui('历任部长','Department heads through the years','歷任部長')}</h2>${heads.length ? `<ol class="department-heads">${heads.map(head => `<li><span>${esc(t(head.term) || head.termStart)}</span><strong>${esc(t(head.name))}</strong></li>`).join('')}</ol>` : `<p>${pending}</p>`}</section>`;
  }

  function content() {
    if (page === 'home') return home();
    if (page === 'admin') return '<div id="admin-root"></div>';
    if (page === 'recruitment') return recruitment();
    if (page.startsWith('department-')) return departmentPage();
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
    document.title = (page === 'admin' ? ui('内容管理', 'Content management', '內容管理') : page.startsWith('department-') ? t(data.departments.find(d => 'department-' + d.id === page && d.published !== false)?.name) || ui('部门','Department','部門') : label(page)).replace(/\n/g, ' ') + ' | MCSA';
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

  let articleObserver;
  function animateArticle() {
    articleObserver?.disconnect();
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    articleObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!reducedMotion()) entry.target.animate?.([
          {opacity: .65, transform: 'translateY(16px)'},
          {opacity: 1, transform: 'translateY(0)'}
        ], {duration: 500, easing: 'cubic-bezier(.2,.7,.2,1)'});
        articleObserver.unobserve(entry.target);
      });
    }, {threshold: .08});
    document.querySelectorAll('.department-article .article-section-title, .department-article .story-step, .department-article .article-leader, .department-article .about-beat, .department-article .about-manifesto').forEach(el => articleObserver.observe(el));
  }

  function bind() {
    animateArticle();
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
