const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  let browser;
  try {
    console.log('=== INICIANDO VERIFICAÇÃO AUTOMATIZADA COMPLETA DA LANDING PAGE (8 DOBRAS) ===');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.toString()));

    const filePath = path.resolve('C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/index.html');
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    console.log('1. Carregando Landing Page oficial:', fileUrl);

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    // 1. Verificação de Título e Metas
    const title = await page.title();
    console.log('Título da página:', title);

    // 2. Aguarda e valida a animação do Hero Gauge e NumberTicker
    console.log('2. Validando Hero Gauge & NumberTicker 95,7%...');
    await page.waitForFunction(() => {
      const ticker = document.getElementById('heroNumberTicker');
      return ticker && ticker.textContent.includes('95,7%');
    }, { timeout: 3000 });

    const heroGaugeAudit = await page.evaluate(() => {
      const gaugeCard = document.getElementById('heroTelemetryGauge');
      const ticker = document.getElementById('heroNumberTicker');
      const progressCircle = document.getElementById('heroGaugeProgress');
      const progressOffset = progressCircle ? parseFloat(progressCircle.style.strokeDashoffset) : null;
      return {
        hasGaugeCard: !!gaugeCard,
        tickerText: ticker ? ticker.textContent.trim() : null,
        hasProgressCircle: !!progressCircle,
        progressOffset
      };
    });
    console.log('Resultado da Auditoria do Hero Gauge:', heroGaugeAudit);

    if (!heroGaugeAudit.hasGaugeCard || heroGaugeAudit.tickerText !== '95,7%') {
      throw new Error(`Falha no Hero Gauge/Ticker: ${JSON.stringify(heroGaugeAudit)}`);
    }

    // 2.1 Multi-resolution Hero Column Alignment & H1 Solid Tinta Audit
    const heroLayoutAudit = await page.evaluate(() => {
      const copyCol = document.querySelector('.hero-copy-column');
      const visualCard = document.querySelector('.visual-canvas-card');
      const h1Spans = Array.from(document.querySelectorAll('.hero-title span'));
      const blueSpans = h1Spans.filter(s => {
        const c = window.getComputedStyle(s).color;
        return c.includes('22, 99, 222') || c.includes('1663de');
      });
      const copyRect = copyCol ? copyCol.getBoundingClientRect() : null;
      const visualRect = visualCard ? visualCard.getBoundingClientRect() : null;
      const diff = (copyRect && visualRect) ? Math.abs(copyRect.bottom - visualRect.bottom) : null;
      return {
        copyBottom: copyRect ? copyRect.bottom : null,
        visualBottom: visualRect ? visualRect.bottom : null,
        diff,
        blueSpansCount: blueSpans.length
      };
    });
    console.log('Auditoria de Alinhamento e H1 do Hero Desktop (1440px):', heroLayoutAudit);
    if (heroLayoutAudit.blueSpansCount > 0) {
      throw new Error('H1 contém spans com texto colorido de azul (violação frontend-design)');
    }
    if (heroLayoutAudit.diff !== null && heroLayoutAudit.diff > 15) {
      throw new Error(`Desalinhamento vertical excessivo no Hero desktop: ${heroLayoutAudit.diff}px`);
    }

    // Auditoria de alinhamento em larguras intermediárias (1200px, 1024px, 960px, 910px)
    for (const testW of [1200, 1024, 960, 910]) {
      await page.setViewport({ width: testW, height: 900 });
      const resDiff = await page.evaluate(() => {
        const copyCol = document.querySelector('.hero-copy-column');
        const visualCard = document.querySelector('.visual-canvas-card');
        const c = copyCol.getBoundingClientRect();
        const v = visualCard.getBoundingClientRect();
        return Math.abs(c.bottom - v.bottom);
      });
      console.log(`Hero diff em ${testW}px: ${resDiff}px`);
      if (resDiff > 15) {
        throw new Error(`Desalinhamento vertical excessivo no Hero em ${testW}px: ${resDiff}px`);
      }
    }
    // Retorna para 1440px para os testes seguintes
    await page.setViewport({ width: 1440, height: 900 });

    // 3. Captura de Screenshots Desktop (Hero Viewport e Full Page)
    const desktopScreenshotPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-desktop.png';
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log('Screenshot Hero Desktop gravado em:', desktopScreenshotPath);

    const desktopFullPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-full-desktop.png';
    await page.screenshot({ path: desktopFullPath, fullPage: true });
    console.log('Screenshot Full Page Desktop gravado em:', desktopFullPath);

    // 4. Teste do Botão de Alternância de Tags Wix CMS
    await page.click('#cmsToggleBtn');
    const tagsVisible = await page.evaluate(() => document.body.classList.contains('show-wix-tags'));
    console.log('Alternância para exibição de tags Wix CMS ativada:', tagsVisible);
    
    await page.screenshot({
      path: 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-banner-desktop.png',
      fullPage: false
    });
    console.log('Screenshot com tags Wix CMS salvo em preview-banner-desktop.png');

    // Desativa modo tags para os próximos testes
    await page.click('#cmsToggleBtn');

    // 5. Teste e Captura Viewport Mobile (iPhone 14/15 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));

    // Valida que o ticker no mobile exibe 95,7% cravado
    await page.waitForFunction(() => {
      const ticker = document.getElementById('heroNumberTicker');
      return ticker && ticker.textContent.includes('95,7%');
    }, { timeout: 2000 });

    const mobileTickerVal = await page.evaluate(() => {
      const ticker = document.getElementById('heroNumberTicker');
      return ticker ? ticker.textContent.trim() : null;
    });
    console.log('Hero Ticker Mobile:', mobileTickerVal);
    if (mobileTickerVal !== '95,7%') {
      throw new Error(`Hero Ticker no mobile não exibiu 95,7%: exibiu "${mobileTickerVal}"`);
    }

    const mobileScreenPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-mobile-screen.png';
    await page.screenshot({ path: mobileScreenPath, fullPage: false });
    console.log('Screenshot Mobile Viewport salvo em:', mobileScreenPath);

    const mobileFullPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-mobile.png';
    await page.evaluate(() => {
      const dock = document.querySelector('.mobile-sticky-dock');
      if (dock) dock.style.display = 'none';
    });
    await page.screenshot({ path: mobileFullPath, fullPage: true });
    await page.evaluate(() => {
      const dock = document.querySelector('.mobile-sticky-dock');
      if (dock) dock.style.display = '';
    });
    console.log('Screenshot Mobile Full Page salvo em:', mobileFullPath);

    // 6. Teste de Overflow Horizontal em 360px (mobile estreito)
    console.log('6. Testando Ausência de Overflow Horizontal em 360px...');
    await page.setViewport({ width: 360, height: 740, isMobile: true });
    const overflowCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      return {
        viewportWidth: 360,
        docWidth,
        bodyWidth,
        hasOverflow: docWidth > 360 || bodyWidth > 360
      };
    });
    console.log('Auditoria de Overflow 360px (Normal):', overflowCheck);
    if (overflowCheck.hasOverflow) {
      throw new Error(`Overflow horizontal detectado em 360px: docWidth=${overflowCheck.docWidth}`);
    }

    // Teste de Overflow em 360px com tags Wix CMS
    await page.evaluate(() => document.body.classList.add('show-wix-tags'));
    const overflowWixCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;
      return {
        viewportWidth: 360,
        docWidth,
        bodyWidth,
        hasOverflow: docWidth > 360 || bodyWidth > 360
      };
    });
    console.log('Auditoria de Overflow 360px (com Tags Wix):', overflowWixCheck);
    await page.evaluate(() => document.body.classList.remove('show-wix-tags'));
    if (overflowWixCheck.hasOverflow) {
      throw new Error(`Overflow horizontal com tags Wix em 360px: docWidth=${overflowWixCheck.docWidth}, bodyWidth=${overflowWixCheck.bodyWidth}`);
    }

    // Volta para desktop para testes de interação
    await page.setViewport({ width: 1440, height: 900 });

    // 7. Teste de Interatividade: Tracing Stepper / Timeline das 3 Fases
    console.log('7. Testando Interatividade do Stepper do Método em 3 Fases...');
    await page.click('#stepBtn2');
    const step2Active = await page.evaluate(() => {
      const btn2 = document.getElementById('stepBtn2');
      const panel2 = document.getElementById('phasePanel2');
      const line1 = document.getElementById('stepperLine1');
      return btn2.classList.contains('active') && 
             panel2.classList.contains('active') && 
             line1 && line1.style.width === '100%';
    });
    if (!step2Active) throw new Error('Falha ao ativar Fase 2 via Stepper ou preencher linha 1');

    await page.click('#stepBtn3');
    const step3Active = await page.evaluate(() => {
      const btn3 = document.getElementById('stepBtn3');
      const panel3 = document.getElementById('phasePanel3');
      const line1 = document.getElementById('stepperLine1');
      const line2 = document.getElementById('stepperLine2');
      return btn3.classList.contains('active') && 
             panel3.classList.contains('active') && 
             line1 && line1.style.width === '100%' && 
             line2 && line2.style.width === '100%';
    });
    if (!step3Active) throw new Error('Falha ao ativar Fase 3 via Stepper ou preencher linhas 1 e 2');

    // Teste de navegação por teclado no Stepper (ArrowLeft e ArrowRight)
    await page.evaluate(() => {
      const b3 = document.getElementById('stepBtn3');
      b3.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    const stepKeyNavActive = await page.evaluate(() => {
      const b2 = document.getElementById('stepBtn2');
      const p2 = document.getElementById('phasePanel2');
      return b2.classList.contains('active') && p2.classList.contains('active');
    });
    if (!stepKeyNavActive) throw new Error('Falha na navegação por teclado no Stepper (ArrowLeft)');

    await page.click('#stepBtn1');
    console.log('Interatividade do Stepper das 3 Fases: 100% OK');

    // 8. Teste de Interatividade: Fluid Tabs de Patologias
    console.log('8. Testando Interatividade das Abas Fluidas de Patologias...');
    await page.click('#tabPatho2'); // Hérnia Cervical
    const tab2Active = await page.evaluate(() => {
      const tab = document.getElementById('tabPatho2');
      const panel = document.getElementById('panelPatho2');
      const panel1 = document.getElementById('panelPatho1');
      return tab.classList.contains('active') && panel.classList.contains('active') && !panel.hasAttribute('hidden') && panel1.hasAttribute('hidden');
    });
    if (!tab2Active) throw new Error('Falha ao trocar para Aba de Hérnia Cervical');

    await page.click('#tabPatho3'); // Nervo Ciático
    const tab3Active = await page.evaluate(() => {
      const tab = document.getElementById('tabPatho3');
      const panel = document.getElementById('panelPatho3');
      return tab.classList.contains('active') && panel.classList.contains('active');
    });
    if (!tab3Active) throw new Error('Falha ao trocar para Aba de Nervo Ciático');

    // Teste de navegação por teclado nas Abas (ArrowRight, End, Home)
    await page.evaluate(() => {
      const t3 = document.getElementById('tabPatho3');
      t3.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    const tabKeyNavRight = await page.evaluate(() => {
      const t4 = document.getElementById('tabPatho4');
      const p4 = document.getElementById('panelPatho4');
      return t4.classList.contains('active') && p4.classList.contains('active');
    });
    if (!tabKeyNavRight) throw new Error('Falha na navegação por teclado nas Abas (ArrowRight para Protrusão)');

    await page.evaluate(() => {
      const t4 = document.getElementById('tabPatho4');
      t4.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    const tabKeyNavHome = await page.evaluate(() => {
      const t1 = document.getElementById('tabPatho1');
      const p1 = document.getElementById('panelPatho1');
      return t1.classList.contains('active') && p1.classList.contains('active');
    });
    if (!tabKeyNavHome) throw new Error('Falha na navegação por teclado nas Abas (Home para Lombar)');

    console.log('Interatividade das Abas de Patologias: 100% OK');

    // 9. Teste de Interatividade: Vídeo Player (loadVideo via clique, Enter e Space)
    console.log('9. Testando Reprodução de Vídeos (loadVideo clique e teclado)...');
    const videoContainers = await page.$$('.video-container');
    if (videoContainers.length < 3) throw new Error('Menos de 3 containers de vídeo encontrados');

    // Teste de clique no primeiro vídeo
    await videoContainers[0].click();
    const video1Loaded = await page.evaluate(() => {
      const iframe = document.querySelector('.video-container iframe');
      return iframe && iframe.src.includes('autoplay=1');
    });
    if (!video1Loaded) throw new Error('Falha ao carregar autoplay no clique do vídeo 1');

    // Teste de teclado Enter no segundo vídeo
    await page.evaluate(() => {
      const v2 = document.querySelectorAll('.video-container')[1];
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      v2.dispatchEvent(event);
    });
    const video2Loaded = await page.evaluate(() => {
      const iframe = document.querySelectorAll('.video-container iframe')[1];
      return iframe && iframe.src.includes('autoplay=1');
    });
    if (!video2Loaded) throw new Error('Falha ao carregar autoplay no teclado do vídeo 2');

    // Teste de teclado Space no terceiro vídeo
    await page.evaluate(() => {
      const v3 = document.querySelectorAll('.video-container')[2];
      const event = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true });
      v3.dispatchEvent(event);
    });
    const video3Loaded = await page.evaluate(() => {
      const iframe = document.querySelectorAll('.video-container iframe')[2];
      return iframe && iframe.src.includes('autoplay=1');
    });
    if (!video3Loaded) throw new Error('Falha ao carregar autoplay com tecla Space no vídeo 3');
    console.log('Interatividade dos Vídeos: 100% OK');

    // 10. Auditoria de Existência das 8 Dobras
    const dobrasAudit = await page.evaluate(() => {
      return {
        dobra1_hero: !!document.querySelector('.hero-block'),
        dobra2_metodo: !!document.querySelector('.method-section'),
        dobra3_patologias: !!document.querySelector('.pathologies-section'),
        dobra4_porQueEscolher: !!document.querySelector('.why-section'),
        dobra5_depoimentos: !!document.querySelector('.testimonials-section'),
        dobra6_unidadeEquipe: !!document.querySelector('.unit-details-section'),
        dobra7_faq: !!document.querySelector('.faq-section'),
        dobra8_ctaFinal: !!document.querySelector('.final-cta-section'),
        footer_institucional: !!document.querySelector('.site-footer')
      };
    });
    console.log('Auditoria das 8 Dobras da Landing Page:', dobrasAudit);

    const missingDobras = Object.keys(dobrasAudit).filter(k => !dobrasAudit[k]);
    if (missingDobras.length > 0) {
      throw new Error('Dobras ausentes na Landing Page: ' + missingDobras.join(', '));
    }

    // 11. Auditoria de CTAs: VETO ABSOLUTO AO VERMELHO E VALIDAÇÃO DE CORES
    const ctaAudit = await page.evaluate(() => {
      const rootComputed = window.getComputedStyle(document.documentElement);
      const colorPrimaryCta = rootComputed.getPropertyValue('--color-primary-cta').trim().toLowerCase();
      const colorPrimaryCtaHover = rootComputed.getPropertyValue('--color-primary-cta-hover').trim().toLowerCase();

      // Busca todos os botões e links de CTA na página
      const buttons = Array.from(document.querySelectorAll('a[class*="btn"], button[class*="btn"]'));
      const redViolations = [];

      buttons.forEach(btn => {
        const style = window.getComputedStyle(btn);
        const bg = (style.backgroundColor || '') + ' ' + (style.backgroundImage || '');
        const color = style.color || '';

        // Detecção de vermelho proibido (#B10F0B, #8C0B08, rgb(177, 15, 11), etc.)
        if (/b10f0b|8c0b08|9e0d09|760907|177,\s*15,\s*11|140,\s*11,\s*8/i.test(bg + ' ' + color)) {
          redViolations.push(`Botão com vermelho proibido: ${btn.className} [${bg}]`);
        }
      });

      return {
        colorPrimaryCta,
        colorPrimaryCtaHover,
        totalCtaButtons: buttons.length,
        redViolations
      };
    });
    console.log('Auditoria de Cores dos CTAs:', ctaAudit);

    if (ctaAudit.colorPrimaryCta.includes('#b10f0b') || ctaAudit.colorPrimaryCta.includes('rgb(177, 15, 11)')) {
      throw new Error(`VIOLAÇÃO CRÍTICA: --color-primary-cta ainda está em vermelho: ${ctaAudit.colorPrimaryCta}`);
    }

    if (ctaAudit.redViolations.length > 0) {
      throw new Error(`VIOLAÇÃO CRÍTICA: Encontrados botões em vermelho:\n${ctaAudit.redViolations.join('\n')}`);
    }

    // 12. Auditoria da Dobra 1: Fotografia Limpa e Redução de Texto
    const heroRefinementAudit = await page.evaluate(() => {
      const h1 = document.querySelector('.hero-title');
      const lead = document.querySelector('.hero-lead-text');
      const photo = document.querySelector('.visual-clinical-photo');
      const discretePill = document.querySelector('.photo-discrete-pill');
      const bulkyCaption = document.querySelector('.visual-tech-caption');

      return {
        h1Text: h1 ? h1.innerText.trim() : null,
        h1WordCount: h1 ? h1.innerText.trim().split(/\s+/).length : 0,
        leadLength: lead ? lead.innerText.trim().length : 0,
        leadText: lead ? lead.innerText.trim() : null,
        hasDiscretePill: !!discretePill,
        hasBulkyCaption: !!bulkyCaption,
        hasPhoto: !!photo
      };
    });
    console.log('Auditoria de Refinamento do Hero (Dobra 1):', heroRefinementAudit);

    if (heroRefinementAudit.hasBulkyCaption) {
      throw new Error('A fotografia do Hero ainda contém a legenda volumosa com 4 blocos empilhados.');
    }

    if (!heroRefinementAudit.hasDiscretePill) {
      throw new Error('A pill discreta da fotografia não foi encontrada.');
    }

    if (heroRefinementAudit.leadLength > 200) {
      throw new Error(`O subtítulo do Hero ainda está longo demais (${heroRefinementAudit.leadLength} caracteres).`);
    }

    // 13. Auditoria de Compliance, Emojis e Placeholders Wix CMS
    const domAudit = await page.evaluate(() => {
      const text = document.body.innerText;
      const violations = [];

      // Veto a emojis na interface (Unslop)
      const emojiMatch = text.match(/[📍⏰📞💬★★★★★]/);
      if (emojiMatch) {
        violations.push(`VIOLAÇÃO UNSLOP: Emoji ou caractere de template encontrado: "${emojiMatch[0]}"`);
      }

      // Veto a atributos pessoais em 2ª pessoa
      if (/\bsua dor\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "sua dor"');
      if (/\bseu corpo\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "seu corpo"');
      if (/\bsua rotina\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "sua rotina"');
      if (/\bseu quadro\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "seu quadro"');
      if (/\bsua coluna\b/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "sua coluna"');

      // Veto a promessas absolutas
      if (/viver sem dor/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "viver sem dor"');
      if (/cura definitiva/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "cura definitiva"');
      if (/garantido/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "garantido"');
      if (/a única solução/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "a única solução"');

      // Veto a links de fuga
      if (/link na bio/i.test(text)) violations.push('VIOLAÇÃO: Encontrado "link na bio"');

      // Veto a exclamações na interface (Unslop)
      const exclamations = text.match(/[!¡]/);
      if (exclamations) {
        violations.push(`VIOLAÇÃO UNSLOP: Exclamação encontrada na interface: "${exclamations[0]}"`);
      }

      // Veto a travessões de IA
      if (/—|--/.test(text)) violations.push('VIOLAÇÃO: Encontrado travessão de IA');

      // Verificação dos Placeholders Oficiais do Wix CMS nas 8 dobras
      const rawHtml = document.documentElement.outerHTML;
      const placeholdersFound = {
        title: rawHtml.includes('{title}'),
        horario: rawHtml.includes('{horario}'),
        diasSemana: rawHtml.includes('{diasSemana}'),
        linkWpp: rawHtml.includes('{linkWpp}'),
        endereoTexto: rawHtml.includes('{endereoTexto}'),
        telefone: rawHtml.includes('{telefone}'),
        whatsapp: rawHtml.includes('{whatsapp}'),
        linkVerNoMapa: rawHtml.includes('{linkVerNoMapa}'),
        slidesFotosUnidades: rawHtml.includes('{slidesFotosUnidades}'),
        imagemFisio: rawHtml.includes('{imagemFisio}'),
        fisioterapeutasResponsveis: rawHtml.includes('{fisioterapeutasResponsveis}'),
        imagemFisio1: rawHtml.includes('{imagemFisio1}'),
        fisioterapeutasResponsveis1: rawHtml.includes('{fisioterapeutasResponsveis1}'),
        video_youtube_depoimento_1: rawHtml.includes('{video_youtube_depoimento_1}'),
        video_youtube_depoimento_2: rawHtml.includes('{video_youtube_depoimento_2}'),
        video_youtube_depoimento_3: rawHtml.includes('{video_youtube_depoimento_3}'),
        redessociais: rawHtml.includes('{redessociais}'),
        redessociais1: rawHtml.includes('{redessociais1}')
      };

      const fontLoaded = document.fonts.check('16px Lufga');

      return {
        violations,
        placeholdersFound,
        fontLoaded,
        hasImages: document.querySelectorAll('img').length,
        hasVideos: document.querySelectorAll('iframe').length
      };
    });

    console.log('Auditoria de Compliance e Placeholders Wix CMS:', domAudit);
    console.log('Erros no console do navegador:', consoleErrors);

    if (domAudit.violations.length > 0) {
      throw new Error('Falha de compliance detectada:\n' + domAudit.violations.join('\n'));
    }

    if (consoleErrors.length > 0) {
      throw new Error('Erros de console detectados:\n' + consoleErrors.join('\n'));
    }

    const missingPlaceholders = Object.keys(domAudit.placeholdersFound).filter(k => !domAudit.placeholdersFound[k]);
    if (missingPlaceholders.length > 0) {
      throw new Error('Placeholders Wix CMS ausentes:\n' + missingPlaceholders.join('\n'));
    }

    // 13.1 Auditoria Sênior Redline (/unslop & /frontend-design):
    // Veto a Itálico em Depoimentos, Estrelas Amarelas, Pílulas Repetitivas e Validação do Bento Grid e Tracing Timeline
    const seniorRedlineAudit = await page.evaluate(() => {
      // 1. Depoimentos sem itálico
      const quotes = Array.from(document.querySelectorAll('.testimonial-quote'));
      const italicQuotes = quotes.filter(q => window.getComputedStyle(q).fontStyle === 'italic');
      
      // 2. Ausência de estrelas amarelas
      const starElements = Array.from(document.querySelectorAll('.testimonial-card svg.star, .testimonial-card .star-rating, .testimonial-card .stars-row'));
      
      // 3. Section badges sem fundo de pílula slop
      const badges = Array.from(document.querySelectorAll('.section-badge-pill, .final-badge-pill'));
      const pillBgBadges = badges.filter(b => {
        const bg = window.getComputedStyle(b).backgroundColor;
        return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
      });

      // 4. Dobra 4 Bento Grid
      const bentoGrid = document.querySelector('.why-bento-grid');
      const foundersCard = document.querySelector('.founders-bento-card');
      const metricsConsole = document.querySelector('.why-metrics-console');

      // 5. Dobra 2 Tracing Timeline
      const tracingExp = document.querySelector('.method-tracing-experience');
      const tracingBeam = document.getElementById('tracingBeamIndicator');

      // 6. Tokens de cor esmeralda e kicker-dot verde clínico
      const rootStyle = window.getComputedStyle(document.documentElement);
      const emeraldToken = rootStyle.getPropertyValue('--color-emerald').trim();
      const kickerDots = Array.from(document.querySelectorAll('.kicker-dot'));
      const greenDots = kickerDots.filter(d => {
        const c = window.getComputedStyle(d).color;
        return c.includes('16, 185, 129') || c.includes('10b981');
      });

      return {
        totalQuotes: quotes.length,
        italicQuotesCount: italicQuotes.length,
        starElementsCount: starElements.length,
        badgesCount: badges.length,
        pillBgBadgesCount: pillBgBadges.length,
        hasBentoGrid: !!bentoGrid,
        hasFoundersCard: !!foundersCard,
        hasMetricsConsole: !!metricsConsole,
        hasTracingExp: !!tracingExp,
        hasTracingBeam: !!tracingBeam,
        hasEmeraldToken: emeraldToken.length > 0,
        totalKickerDots: kickerDots.length,
        greenKickerDotsCount: greenDots.length
      };
    });
    console.log('Auditoria Sênior Redline (/unslop & /frontend-design):', seniorRedlineAudit);
    if (seniorRedlineAudit.italicQuotesCount > 0) {
      throw new Error(`VIOLAÇÃO UNSLOP: Encontrados depoimentos com font-style: italic: ${seniorRedlineAudit.italicQuotesCount}`);
    }
    if (seniorRedlineAudit.starElementsCount > 0) {
      throw new Error(`VIOLAÇÃO UNSLOP: Encontradas estrelas de template nos depoimentos: ${seniorRedlineAudit.starElementsCount}`);
    }
    if (seniorRedlineAudit.pillBgBadgesCount > 0) {
      throw new Error(`VIOLAÇÃO FRONTEND-DESIGN: Encontrados badges com fundo de pílula repetitiva: ${seniorRedlineAudit.pillBgBadgesCount}`);
    }
    if (!seniorRedlineAudit.hasBentoGrid || !seniorRedlineAudit.hasFoundersCard || !seniorRedlineAudit.hasMetricsConsole) {
      throw new Error('Dobra 4 Bento Grid não estruturado conforme diretriz');
    }
    if (!seniorRedlineAudit.hasTracingExp || !seniorRedlineAudit.hasTracingBeam) {
      throw new Error('Dobra 2 Tracing Timeline não estruturada conforme diretriz');
    }
    if (!seniorRedlineAudit.hasEmeraldToken) {
      throw new Error('Token CSS --color-emerald não definido no :root');
    }
    if (seniorRedlineAudit.greenKickerDotsCount !== seniorRedlineAudit.totalKickerDots) {
      throw new Error(`Kicker dots sem cor verde clínica: ${seniorRedlineAudit.greenKickerDotsCount}/${seniorRedlineAudit.totalKickerDots}`);
    }

    // 13.2 Auditoria de Sticky Scroll no Trilho da Dobra 2
    const stickyCheck = await page.evaluate(() => {
      const p2 = document.getElementById('phasePanel2');
      if (!p2) return null;
      p2.scrollIntoView({ behavior: 'instant', block: 'center' });
      const track = document.querySelector('.method-timeline-track-column');
      const rect = track.getBoundingClientRect();
      return {
        top: rect.top,
        isStickyActive: rect.top >= 50 && rect.top <= 140
      };
    });
    console.log('Auditoria de Sticky Scroll Dobra 2:', stickyCheck);
    if (stickyCheck && !stickyCheck.isStickyActive) {
      throw new Error(`Falha no sticky scroll da Dobra 2: track.top = ${stickyCheck.top}px`);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

    // 14. Teste de Borda com Parâmetros Dinâmicos e Nome de Unidade Longo no Mobile
    console.log('14. Testando Parâmetros Dinâmicos e Nome Longo de Unidade no Mobile...');
    await page.setViewport({ width: 360, height: 740, isMobile: true });
    const edgeUrl = fileUrl + '?unidade=' + encodeURIComponent('UNIDADE PRESIDENTE PRUDENTE E SÃO JOSÉ DO RIO PRETO - SP') +
      '&whatsapp=18999998888&telefone=(18)%203222-1111&endereco=Avenida%20Coronel%20Jos%C3%A9%20Soares%20Marcondes%2C%201200&horario=07:30%20-%2019:00&diasSemana=Seg-Sab';
    
    await page.goto(edgeUrl, { waitUntil: 'networkidle0' });

    const dynamicAudit = await page.evaluate(() => {
      const headerTitle = document.querySelector('.site-header .unit-dynamic-pill .wix-field-marker').textContent;
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const dockTitle = document.querySelector('.mobile-unit-title').textContent;
      const footerTitle = document.querySelector('.footer-unit-title').textContent;
      const addressText = document.querySelector('[data-wix-tag="{endereoTexto}"]').textContent;
      const heroHref = document.getElementById('heroCtaButton').href;
      const dockHref = document.querySelector('.mobile-dock-btn').href;
      const docWidth = document.documentElement.scrollWidth;
      const bodyWidth = document.body.scrollWidth;

      return {
        headerTitle,
        headerHeight,
        dockTitle,
        footerTitle,
        addressText,
        heroHasPhone: heroHref.includes('5518999998888'),
        dockHasPhone: dockHref.includes('5518999998888'),
        heroHasUnitMsg: heroHref.includes('PRESIDENTE%20PRUDENTE'),
        dockHasUnitMsg: dockHref.includes('PRESIDENTE%20PRUDENTE'),
        docWidth,
        bodyWidth,
        hasOverflow: docWidth > 360 || bodyWidth > 360
      };
    });

    console.log('Resultado da Auditoria Dinâmica:', dynamicAudit);

    const longUnitMobilePath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-long-unit-mobile.png';
    await page.screenshot({ path: longUnitMobilePath, fullPage: false });
    console.log('Screenshot Edge Case Mobile salvo em:', longUnitMobilePath);

    if (dynamicAudit.headerHeight > 62) {
      throw new Error(`Header expandiu verticalmente além do limite: ${dynamicAudit.headerHeight}px`);
    }

    if (dynamicAudit.hasOverflow) {
      throw new Error(`Overflow horizontal com unidade longa em 360px: docWidth=${dynamicAudit.docWidth}, bodyWidth=${dynamicAudit.bodyWidth}`);
    }

    if (!dynamicAudit.dockTitle.includes('PRESIDENTE PRUDENTE')) {
      throw new Error(`Mobile dock title não sincronizou: ${dynamicAudit.dockTitle}`);
    }

    if (!dynamicAudit.heroHasPhone || !dynamicAudit.dockHasPhone) {
      throw new Error('Links de WhatsApp não sincronizaram o número dinâmico corretamente');
    }

    console.log('=== TODAS AS 8 DOBRAS E TESTES FORAM VERIFICADOS COM 100% DE SUCESSO! ===');
    await browser.close();
  } catch (err) {
    console.error('ERRO NA EXECUÇÃO DO TESTE:', err);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
