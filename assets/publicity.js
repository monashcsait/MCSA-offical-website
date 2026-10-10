/* Publicity article: published backend content and static export share this renderer. */
(function (root) {
  'use strict';
  function render(d, language) {
    const lang = language === 'en' ? 'en' : 'zh';
    const t = v => typeof v === 'string' ? v : v?.[lang] || v?.zh || '';
    const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ui = (zh,en) => lang === 'en' ? en : zh;
    const p = v => `<p>${esc(t(v))}</p>`;
    const photo = (file,alt) => /^(?:(?:64[0-4]|wechat-source|xiaohongshu-source|events-source|application-source)\.png|ella-original\.jpg)$/.test(file || '') ? `<figure class="article-photo"><img class="article-original" src="images/departments/publicity/${file}" alt="${esc(t(alt))}" loading="lazy" decoding="async"></figure>` : '';
    // Frame only the supplied artwork; surrounding article text is rendered as HTML.
    const artwork = (file, size, box, alt, caption) => {
      const [w,h] = size, [x,y,cw,ch] = box;
      return `<figure class="publicity-work"><div class="publicity-artwork" style="aspect-ratio:${cw}/${ch}"><img src="images/departments/publicity/${file}" alt="${esc(alt)}" loading="lazy" style="width:${w/cw*100}%;height:${h/ch*100}%;left:${-x/cw*100}%;top:${-y/ch*100}%"></div><figcaption>${esc(caption)}</figcaption></figure>`;
    };
    const examples = g => {
      if (g.sourceImage === 'wechat-source.png') return `<div class="publicity-account"><p>${ui('微信公众号','WeChat official account')}</p><h4>${ui('蒙纳士大学中国学生会','Monash Chinese Student Association')}</h4><dl><div><dt>${ui('原创内容','Original posts')}</dt><dd>332</dd></div><div><dt>${ui('总用户数','Followers')}</dt><dd>23,116</dd></div></dl><p class="publicity-account-note">${esc(t(g.sourceNote))}</p></div>`;
      const isEvents = g.sourceImage === 'events-source.png';
      const file = isEvents ? 'events-source.png' : 'xiaohongshu-source.png';
      const size = isEvents ? [1228,1744] : [1228,1686];
      const boxes = isEvents ? [[170,150,419,558],[589,150,419,558],[170,708,419,559],[589,708,419,559]] : [[184,166,419,559],[603,166,419,559],[184,725,419,557],[603,725,419,557]];
      const labels = isEvents ? [ui('羽毛球活动海报','Badminton event poster'),ui('迎新派对海报','Welcome Party poster'),ui('假期摄影活动海报','Holiday photography event poster'),ui('2024 S1迎新会海报','2024 S1 welcome event poster')] : [ui('墨尔本 Myki 交通卡指南','Melbourne Myki guide'),ui('墨尔本租房攻略','Melbourne rental guide'),ui('留学生心理健康指南','Student wellbeing guide'),ui('Caulfield 校区指南','Caulfield campus guide')];
      return `<div class="publicity-gallery">${boxes.map((box,i)=>artwork(file,size,box,labels[i],labels[i])).join('')}</div>`;
    };
    const applicationCodes = () => `<div class="publicity-qr-grid">${artwork('application-source.png',[1344,1412],[171,466,416,417],ui('MCSA小助手4号微信二维码','WeChat QR code for MCSA Assistant 4'),ui('MCSA小助手4号','MCSA Assistant 4'))}${artwork('application-source.png',[1344,1412],[741,490,397,397],ui('MCSA新生助手1号微信二维码','WeChat QR code for MCSA New Student Assistant 1'),ui('MCSA新生助手1号（学习版）','MCSA New Student Assistant 1'))}</div>`;
    const story = values => `<div class="article-story">${values.map((v,i)=>`<div class="story-step"><span class="story-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${p(v)}</div>`).join('')}</div>`;
    const list = values => `<ul>${(values || []).map(v=>`<li>${esc(t(v))}</li>`).join('')}</ul>`;
    const section = (title,body,id) => `<section class="article-section" id="publicity-${id}"><h2 class="article-section-title">${esc(title)}</h2>${body}</section>`;
    let source = '';
    try {
      const url = new URL(d.sourceUrl);
      if (url.protocol === 'https:' && url.hostname === 'mp.weixin.qq.com' && !url.username && !url.password)
        source = `<a class="button primary" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${ui('查看微信招新原文','Read the original WeChat recruitment post')} ↗</a>`;
    } catch {}
    let body = `<article class="department-article publicity-article"><nav class="department-breadcrumb" aria-label="${ui('面包屑导航','Breadcrumb')}"><a href="recruitment.html">${ui('所有部门','All departments')}</a> / ${esc(t(d.name))}</nav><header class="article-heading"><span class="article-kicker">MCSA · PUBLICITY TEAM</span><h1>${esc(t(d.name))}</h1><p class="publicity-motto">${ui('用内容讲述故事 · 用创意打破边界','Tell stories. Create something new.')}</p><p class="recruitment-status">${esc(t(d.status))}</p></header>`;
    body += `<nav class="publicity-jumps" aria-label="${ui('本页目录','On this page')}">${[['about',ui('关于我们','About')],['leaders',ui('部长寄语','Leaders')],['teams',ui('核心小组','Teams')],['roles',ui('岗位要求','Roles')],['benefits',ui('福利待遇','Benefits')]].map(([id,label])=>`<a href="#publicity-${id}">${label}</a>`).join('')}</nav>`;
    body += section(ui('关于我们','About us'),photo('641.png',ui('宣传部团建合照','Publicity team gathering'))+story(d.about || []),'about');
    body += section(ui('部长寄语','Messages from our leaders'),(d.leaders || []).map(l=>`<section class="article-leader"><header><p class="leader-role">${esc(t(l.role))}</p><h3>${esc(t(l.name))}</h3></header>${photo(l.image,l.name)}<blockquote>${esc(t(l.quote))}</blockquote></section>`).join('')+`<p class="publicity-history-note">${esc(t(d.historyNote))}</p>`,'leaders');
    body += section(ui('部门核心小组','Our core teams'),(d.groups || []).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><p class="publicity-tagline">${esc(t(g.tagline))}</p>${story(t(g.text).split('\n\n'))}${examples(g)}</section>`).join(''),'teams');
    body += section(ui('岗位要求','Roles and requirements'),(d.groups || []).map(g=>`<section class="article-subsection"><h3>${esc(t(g.name))}</h3><h4>${ui('工作内容','Responsibilities')}</h4>${list(g.duties)}<h4>${ui('入组要求','Requirements')}</h4>${list(g.requirements)}</section>`).join(''),'roles');
    body += section(ui('福利待遇','What you can gain'),(d.benefits || []).map(b=>`<section class="article-subsection"><h3>${esc(t(b.name))}</h3>${p(b.text)}</section>`).join(''),'benefits');
    body += section(ui('往期报名方式','Past application instructions'),`<p class="recruitment-status">${esc(t(d.status))}</p>${p(d.application)}${applicationCodes()}${source}`,'apply');
    return body+'</article>';
  }
  root.MCSAPublicity = {render};
})(typeof window === 'undefined' ? globalThis : window);
