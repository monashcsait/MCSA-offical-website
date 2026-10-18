/* Marketing article: published backend content and static export share this renderer. */
(function (root) {
  'use strict';
  function render(d, language) {
    const lang = language === 'en' ? 'en' : 'zh';
    const t = v => typeof v === 'string' ? v : v?.[lang] || v?.zh || '';
    const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ui = (zh,en) => lang === 'en' ? en : zh;
    const p = v => `<p>${esc(t(v))}</p>`;
    const photo = (file,alt) => /^64[1-8]\.webp$/.test(file || '') ? `<figure class="article-photo"><img class="article-original" src="images/departments/marketing/${file}" alt="${esc(t(alt))}" loading="lazy" decoding="async"></figure>` : '';
    const story = values => `<div class="article-story">${values.map((v,i)=>`<div class="story-step"><span class="story-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${p(v)}</div>`).join('')}</div>`;
    const list = values => `<ul>${(values || []).map(v=>`<li>${esc(t(v))}</li>`).join('')}</ul>`;
    const section = (title,body,id) => `<section class="article-section" id="marketing-${id}"><h2 class="article-section-title">${esc(title)}</h2>${body}</section>`;
    let source = '';
    try {
      const url = new URL(d.sourceUrl);
      if (url.protocol === 'https:' && url.hostname === 'mp.weixin.qq.com' && !url.username && !url.password)
        source = `<a class="button primary" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${ui('查看微信招新原文','Read the original WeChat recruitment post')} ↗</a>`;
    } catch {}
    let body = `<article class="department-article marketing-article"><nav class="department-breadcrumb" aria-label="${ui('面包屑导航','Breadcrumb')}"><a href="recruitment.html">${ui('所有部门','All departments')}</a> / ${esc(t(d.name))}</nav><header class="article-heading"><span class="article-kicker">MCSA · SPONSORSHIP TEAM</span><h1>${esc(t(d.name))}</h1><p class="marketing-motto">${ui('连接品牌与校园 · 让合作创造价值','Connect brands and campus. Create value together.')}</p><p class="recruitment-status">${esc(t(d.status))}</p></header>`;
    body += `<nav class="marketing-jumps" aria-label="${ui('本页目录','On this page')}">${[['about',ui('关于我们','About')],['leaders',ui('部长寄语','Leaders')],['teams',ui('核心小组','Teams')],['roles',ui('岗位要求','Roles')],['benefits',ui('福利待遇','Benefits')]].map(([id,label])=>`<a href="#marketing-${id}">${label}</a>`).join('')}</nav>`;
    body += section(ui('关于我们','About us'),photo('641.webp',ui('市场部团队合照','Marketing team gathering'))+story(d.about || []),'about');
    body += section(ui('部长寄语','Messages from our leaders'),(d.leaders || []).map(l=>`<section class="article-leader"><header><p class="leader-role">${esc(t(l.role))}</p><h3>${esc(t(l.name))}</h3></header>${photo(l.image,l.name)}<blockquote>${esc(t(l.quote))}</blockquote></section>`).join('')+`<p class="marketing-history-note">${esc(t(d.historyNote))}</p>`,'leaders');
    body += section(ui('部门核心小组','Our core teams'),(d.groups || []).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><p class="marketing-tagline">${esc(t(g.tagline))}</p>${list(g.duties)}</section>`).join(''),'teams');
    body += section(ui('岗位要求','Roles and requirements'),story(d.welcome || [])+(d.groups || []).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><h4>${ui('入组要求','Requirements')}</h4>${list(g.requirements)}</section>`).join(''),'roles');
    body += section(ui('我们的日常','Team life'),`<div class="marketing-gallery">${[645,646,647,648].map((n,i)=>photo(n+'.webp',ui(['校园推广现场','团队聚餐','活动交流','团队合照'][i],['Campus promotion','Team dinner','Event conversations','Team gathering'][i]))).join('')}</div>`,'gallery');
    body += section(ui('福利待遇','What you can gain'),(d.benefits || []).map(b=>`<section class="article-subsection"><h3>${esc(t(b.name))}</h3>${p(b.text)}</section>`).join(''),'benefits');
    body += section(ui('加入市场部','Join the team'),`<p class="recruitment-status">${esc(t(d.status))}</p>${p(d.application)}${source}`,'apply');
    return body+'</article>';
  }
  root.MCSAMarketing = {render};
})(typeof window === 'undefined' ? globalThis : window);
