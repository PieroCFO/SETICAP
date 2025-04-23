const puppeteer = require('puppeteer');
const randomUseragent = require('random-useragent');
const axios = require('axios');
const qs = require('querystring'); // Para convertir a formato x-www-form-urlencoded

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

    console.log("Página actual luego del login:", page.url());

    await page.waitForSelector('div.mar-no.text-semibold.Home__content__ebQk', { timeout: 900000 });

    let valorDolar = '';
    let intentos = 0;

    while (!valorDolar || valorDolar === '0' || valorDolar === '') {
      valorDolar = await page.$eval(
        'div.mar-no.text-semibold.Home__content__ebQk',
        el => el.textContent.trim()
      );

      if (!valorDolar || valorDolar === '0') {
        console.log('Esperando que el valor del dólar esté disponible o sea mayor que 0...');
        intentos++;

        await page.waitForFunction(
          'document.querySelector("div.mar-no.text-semibold.Home__content__ebQk").textContent.trim() !== "" && document.querySelector("div.mar-no.text-semibold.Home__content__ebQk").textContent.trim() !== "0"',
          { timeout: 3000 }
        );

        if (intentos >= 10) {
          console.log("❌ No se pudo obtener el valor del dólar después de 10 intentos.");
          break;
        }
      }
    }

    if (valorDolar && valorDolar !== '0') {
      console.log("💵 Valor del dólar:", valorDolar);
      try {
        console.log('🔎 Enviando el valor del dólar como texto plano:', valorDolar);

        const response = await axios.post(
          'https://script.google.com/macros/s/AKfycbwlT18LiAIDTOdQ8_WBYAK-t2_3MzvN2BgOSTbyel24oZlmH6kiucl2AtsTbOVDXeSG/exec',
          qs.stringify({ valorDolar }), // 🔥 Aquí lo convertimos a texto plano
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        console.log('✅ Respuesta del servidor:', response.data);
      } catch (error) {
        console.error('❌ Error al enviar el valor a Google Apps Script:', error.message);
      }
    }

  } catch (err) {
    console.error("❌ Error durante el scraping:", err.message);
  } finally {
    // await browser.close(); // Puedes activar esto cuando esté listo
  }
};

simularLogin();
