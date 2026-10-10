/* Shared, escaped Secretariat renderer. Content comes from the published snapshot. */
(function (root) {
  'use strict';
  function render(d, language) {
    const lang = language === 'en' ? 'en' : 'zh';
    const t = v => typeof v === 'string' ? v : v?.[lang] || v?.zh || '';
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ui = (zh,en) => lang === 'en' ? en : zh;
    const p = v => `<p>${esc(t(v))}</p>`;
    const photo = (n,alt) => Number.isInteger(n) && n >= 640 && n <= 649 ? `<figure class="article-photo"><img class="article-original" src="images/departments/secretariat/${n}.${n === 640 ? 'png' : 'jpeg'}" alt="${esc(alt)}" loading="lazy" decoding="async"></figure>` : '';
    const story = values => `<div class="article-story">${values.map((v,i)=>`<div class="story-step"><span class="story-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${p(v)}</div>`).join('')}</div>`;
    const list = values => `<ul>${(values || []).map(v=>`<li>${esc(t(v))}</li>`).join('')}</ul>`;
    const section = (title,body,id) => `<section class="article-section" id="${id}"><h2 class="article-section-title">${esc(title)}</h2>${body}</section>`;
    const groups = d.groups || [];
    let body = `<article class="department-article secretariat-article"><nav class="department-breadcrumb" aria-label="${ui('面包屑导航','Breadcrumb')}"><a href="recruitment.html">${ui('所有部门','All departments')}</a> / ${esc(t(d.name))}</nav><header class="article-heading"><span class="article-kicker">MCSA · SECRETARY TEAM</span><h1>${esc(t(d.name))}</h1><p class="recruitment-status">${esc(t(d.status))}</p></header>`;
    body += photo(640,ui('秘书部往期招新海报','Secretariat recruitment poster from a past round'));
    body += `<nav class="secretariat-jumps" aria-label="${ui('本页目录','On this page')}">${[['about',ui('关于我们','About')],['leaders',ui('部长寄语','Leaders')],['teams',ui('核心小组','Teams')],['roles',ui('岗位要求','Roles')],['benefits',ui('福利待遇','Benefits')]].map(([id,label])=>`<a href="#secretariat-${id}">${label}</a>`).join('')}</nav>`;
    body += section(ui('关于我们','About us'),`<div class="about-manifesto">${story(t(d.opening).split('\n\n'))}${p(d.invitation)}</div>${photo(641,ui('秘书部成员合照','Secretariat group photo'))}${p(d.about)}${story(d.highlights || [])}`,'secretariat-about');
    body += section(ui('部长寄语','Messages from our leaders'),(d.leaders || []).map(l=>`<figure class="article-leader"><figcaption><p class="leader-role">${esc(t(l.role))}</p><h3>${esc(t(l.name))}</h3></figcaption>${photo(l.image,t(l.name))}<blockquote>${esc(t(l.quote))}</blockquote></figure>`).join(''),'secretariat-leaders');
    body += section(ui('部门核心小组','Our core teams'),groups.map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><p class="secretariat-tagline">${esc(t(g.tagline))}</p>${story(t(g.text).split('\n\n'))}<p class="secretariat-keywords">${esc(t(g.keywords))}</p>${photo(g.image,t(g.name))}</section>`).join(''),'secretariat-teams');
    let roles = groups.slice(0,2).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><h4>${ui('工作内容','Responsibilities')}</h4>${list(g.duties)}<h4>${ui('工作要求','Requirements')}</h4>${list(g.requirements)}</section>`).join('');
    roles += `<section class="article-subsection"><h3>${ui('信息组','Information Technology team')}</h3><p class="recruitment-status">${ui('原文招募10名新成员（往期名额）。','The original round advertised 10 places (past recruitment).')}</p>${(d.itRoles || []).map(r=>`<h4>${esc(t(r.name))}</h4>${p(r.description)}${list(r.requirements)}`).join('')}</section><blockquote class="secretariat-learning">${esc(t(d.learning))}</blockquote>${photo(648,ui('体育馆活动合照','Group photo at a sports event'))}<p class="article-divider">Daily life</p>${photo(649,ui('教室活动合照','Group photo at a campus gathering'))}${p(d.closing)}`;
    body += section(ui('岗位要求','Roles and requirements'),roles,'secretariat-roles');
    body += section(ui('福利待遇','What you can gain'),story(d.benefits || []),'secretariat-benefits');
    let source = '';
    try { const url = new URL(d.sourceUrl); if (url.protocol === 'https:' && url.hostname === 'mp.weixin.qq.com' && !url.username && !url.password) source = `<a class="button primary" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${ui('查看微信招新原文','Read the original WeChat recruitment post')} ↗</a>`; } catch {}
    body += section(ui('往期报名方式','Past application instructions'),`<p class="recruitment-status">${esc(t(d.status))}</p>${p(d.application)}<div class="secretariat-qr-grid"><figure><div class="secretariat-qr"><img src="images/departments/secretariat/application-source.png" alt="${ui('MCSA小助手4号微信二维码','WeChat QR code: MCSA Assistant 4')}" loading="lazy" style="width:315.72700296735906%;height:596.4391691394659%;left:-45.6973293768546%;top:-390.50445103857567%"></div><figcaption>${ui('MCSA小助手4号','MCSA Assistant 4')}</figcaption></figure><figure><div class="secretariat-qr"><img src="images/departments/secretariat/application-source.png" alt="${ui('MCSA新生助手1号（学习版）微信二维码','WeChat QR code: MCSA New Student Assistant 1')}" loading="lazy" style="width:330.4347826086956%;height:624.223602484472%;left:-189.44099378881987%;top:-414.5962732919255%"></div><figcaption>${ui('MCSA新生助手1号（学习版）','MCSA New Student Assistant 1')}</figcaption></figure></div>${source}`,'secretariat-apply');
    return body + '</article>';
  }
  root.MCSASecretariat = {render};
})(typeof window === 'undefined' ? globalThis : window);
