/* Alumni article: published backend content and static export share this renderer. */
(function (root) {
  'use strict';
  function render(d, language) {
    const lang = language === 'en' ? 'en' : 'zh';
    const t = v => typeof v === 'string' ? v : v?.[lang] || v?.zh || '';
    const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ui = (zh,en) => lang === 'en' ? en : zh;
    const p = v => `<p>${esc(t(v))}</p>`;
    const photo = (file,alt) => /^(?:chloe|keith|team-dinner|networking|conversation|planning|filming|interview|team-flag|alumni-stories|recruitment-poster)\.(?:png|webp)$/.test(file || '') ? `<figure class="article-photo"><img class="article-original" src="images/departments/alumni/${file}" alt="${esc(t(alt))}" loading="lazy" decoding="async"></figure>` : '';
    const story = values => `<div class="article-story">${values.map((v,i)=>`<div class="story-step"><span class="story-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${p(v)}</div>`).join('')}</div>`;
    const list = values => `<ul>${(values || []).map(v=>`<li>${esc(t(v))}</li>`).join('')}</ul>`;
    const section = (title,body,id) => `<section class="article-section" id="alumni-${id}"><h2 class="article-section-title">${esc(title)}</h2>${body}</section>`;
    let source = '';
    try {
      const url = new URL(d.sourceUrl);
      if (url.protocol === 'https:' && url.hostname === 'mp.weixin.qq.com' && !url.username && !url.password)
        source = `<a class="button primary" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${ui('查看微信招新原文','Read the original WeChat recruitment post')} ↗</a>`;
    } catch {}
    let body = `<article class="department-article alumni-article"><figure class="alumni-top-poster"><img class="article-original" src="images/departments/alumni/recruitment-poster.png" alt="${ui('校友会招新海报','Alumni recruitment poster')}" decoding="async" fetchpriority="high"></figure><nav class="department-breadcrumb" aria-label="${ui('面包屑导航','Breadcrumb')}"><a href="recruitment.html">${ui('所有部门','All departments')}</a> / ${esc(t(d.name))}</nav><header class="article-heading"><span class="article-kicker">MCSA · ALUMNI TEAM</span><h1>${esc(t(d.name))}</h1><p class="alumni-motto">${ui('连接校园与校友 · 一起遇见更多可能','Connections that grow beyond campus.')}</p><p class="recruitment-status">${esc(t(d.status))}</p></header>`;
    body += `<nav class="alumni-jumps" aria-label="${ui('本页目录','On this page')}">${[['about',ui('关于我们','About')],['leaders',ui('部长寄语','Leaders')],['teams',ui('核心小组','Teams')],['roles',ui('岗位要求','Roles')],['benefits',ui('福利待遇','Benefits')]].map(([id,label])=>`<a href="#alumni-${id}">${label}</a>`).join('')}</nav>`;
    body += section(ui('关于我们','About us'),photo('team-dinner.png',ui('校友会团队聚餐','Alumni team dinner'))+story(d.about || []),'about');
    body += section(ui('部长寄语','Messages from our leaders'),(d.leaders || []).map(l=>`<section class="article-leader"><header><p class="leader-role">${esc(t(l.role))}</p><h3>${esc(t(l.name))}</h3></header>${photo(l.image,l.name)}<blockquote>${esc(t(l.quote))}</blockquote></section>`).join('')+`<p class="alumni-history-note">${esc(t(d.historyNote))}</p>`,'leaders');
    body += section(ui('部门核心小组','Our core teams'),(d.groups || []).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><p class="alumni-tagline">${esc(t(g.tagline))}</p>${list(g.duties)}</section>`).join(''),'teams');
    body += section(ui('参与方向与加分项','Ways to contribute'),`<p class="alumni-history-note">${ui('招新资料所载：超过20个校友社群，连接3000+校友。','Figures from the recruitment material: over 20 alumni communities connecting 3,000+ alumni.')}</p>`+(d.groups || []).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><h4>${ui('这些经验有助于上手','Helpful experience and qualities')}</h4>${list(g.requirements)}</section>`).join('')+photo('team-flag.webp',ui('校友活动团队合照','Alumni event team'))+photo('alumni-stories.webp',ui('校友分享与友说远川栏目作品','Alumni interview and storytelling artwork')),'roles');
    body += section(ui('在校友会的一学期','A semester with us'),story(d.daily || [])+`<div class="alumni-gallery">${[['planning.png','团队策划讨论','Planning together'],['conversation.png','校友交流','Alumni conversations'],['interview.webp','校友访谈','Alumni interview'],['filming.webp','采访拍摄','Filming an interview']].map(([file,zh,en])=>photo(file,ui(zh,en))).join('')}</div>`,'gallery');
    body += section(ui('福利待遇','What you can gain'),(d.benefits || []).map(b=>`<section class="article-subsection"><h3>${esc(t(b.name))}</h3>${p(b.text)}</section>`).join(''),'benefits');
    body += section(ui('加入校友会','Join the team'),`<p class="recruitment-status">${esc(t(d.status))}</p>${p(d.application)}${source}<p><a href="images/departments/alumni/recruitment-poster.png" target="_blank" rel="noopener">${ui("查看原招新海报","View the original recruitment poster")} ↗</a></p>`,'apply');
    return body+'</article>';
  }
  root.MCSAAlumni = {render};
})(typeof window === 'undefined' ? globalThis : window);
