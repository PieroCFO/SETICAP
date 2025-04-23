const express = require('express');
const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');
const axios = require('axios');
const qs = require('querystring');

const app = express();
const PORT = 3000; // Puedes cambiarlo si necesitas otro puerto

app.get('/ejecutar', async (req, res) => {
  res.send("⏳ Ejecutando extracción del dólar...");
  await simularLogin();
});

const simularLogin = async () => {
  const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  const header = randomUseragent.getRandom(ua => ua.browserName === 'Chrome');
  await page.setUserAgent(header);
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await page.goto('https://dolar.set-icap.com/auth/login/');
    await page.type('input[name="username"]', 'risiglobal');
    await page.type('input[name="password"]', '**Data2024**');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    await page.waitForSelector('div.mar-no.text-semibold.Home__content__ebQk', { timeout: 900000 });

    let valorDolar = '';
    let intentos = 0;

    while (!valorDolar || valorDolar === '0' || valorDolar === '') {
      valorDolar = await page.$eval(
        'div.mar-no.text-semibold.Home__content__ebQk',
        el => el.textContent.trim()
      );

      if (!valorDolar || valorDolar === '0') {
        console.log('Esperando valor del dólar...');
        intentos++;
        await page.waitForTimeout(3000);
        if (intentos >= 10) break;
      }
    }

    if (valorDolar && valorDolar !== '0') {
      console.log("💵 Valor del dólar:", valorDolar);
      const response = await axios.post(
        'https://script.google.com/macros/s/AKfycbwlT18LiAIDTOdQ8_WBYAK-t2_3MzvN2BgOSTbyel24oZlmH6kiucl2AtsTbOVDXeSG/exec',
        qs.stringify({ valorDolar }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log('✅ Respuesta de Google Sheets:', response.data);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await browser.close();
  }
};

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
