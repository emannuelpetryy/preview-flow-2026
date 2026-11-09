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

    // 2. Captura de Screenshots Desktop (Hero Viewport e Full Page)
    const desktopScreenshotPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-desktop.png';
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log('Screenshot Hero Desktop gravado em:', desktopScreenshotPath);

    const desktopFullPath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-full-desktop.png';
    await page.screenshot({ path: desktopFullPath, fullPage: true });
    console.log('Screenshot Full Page Desktop gravado em:', desktopFullPath);

    // 3. Teste do Botão de Alternância de Tags Wix CMS
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

    // 4. Teste e Captura Viewport Mobile (iPhone 14/15 390x844)
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => window.scrollTo(0, 0));

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

    // 5. Auditoria de Existência das 8 Dobras
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

    // 6. Auditoria de CTAs: VETO ABSOLUTO AO VERMELHO E VALIDAÇÃO DO AZUL ROYAL
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

    // 7. Auditoria da Dobra 1: Fotografia Limpa e Redução de Texto
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

    // 8. Auditoria de Compliance e Copywriting (Zero Atributos Pessoais, Zero Promessas Absolutas)
    const domAudit = await page.evaluate(() => {
      const text = document.body.innerText;
      const violations = [];

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

    // 9. Teste de Borda com Parâmetros Dinâmicos e Nome de Unidade Longo
    console.log('9. Testando Parâmetros Dinâmicos e Nome Longo de Unidade...');
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

      return {
        headerTitle,
        headerHeight,
        dockTitle,
        footerTitle,
        addressText,
        heroHasPhone: heroHref.includes('5518999998888'),
        dockHasPhone: dockHref.includes('5518999998888'),
        heroHasUnitMsg: heroHref.includes('PRESIDENTE%20PRUDENTE'),
        dockHasUnitMsg: dockHref.includes('PRESIDENTE%20PRUDENTE')
      };
    });

    console.log('Resultado da Auditoria Dinâmica:', dynamicAudit);

    const longUnitMobilePath = 'C:/Users/Usuario/Downloads/Antigravity/Projetos/lp-hernia-de-disco/preview-long-unit-mobile.png';
    await page.screenshot({ path: longUnitMobilePath, fullPage: false });
    console.log('Screenshot Edge Case Mobile salvo em:', longUnitMobilePath);

    if (dynamicAudit.headerHeight > 62) {
      throw new Error(`Header expandiu verticalmente além do limite: ${dynamicAudit.headerHeight}px`);
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
