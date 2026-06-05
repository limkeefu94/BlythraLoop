/*
 * 全球彩票随机号码实验版。
 * 资料来源为 README.md 中列出的官方彩票 / 官方运营商资料与少量可靠参考；
 * 当前规则是初版整理，复杂玩法采用简化随机版本，后续需人工校对。
 * 仅供娱乐，不构成投注建议。
 */
(function () {
  const DISCLAIMER = '仅供娱乐，不构成投注建议。';

  const LOTTERY_GAMES = [
    { region: '马来西亚', name: '4D', type: 'digits', digits: 4, description: '四位数娱乐号码，按 0000–9999 生成。' },
    { region: '马来西亚', name: '5D', type: 'digits', digits: 5, description: '五位数娱乐号码，按 00000–99999 生成。' },
    { region: '马来西亚', name: '6D', type: 'digits', digits: 6, description: '六位数娱乐号码，按 000000–999999 生成。' },
    { region: '马来西亚', name: 'Toto 6/50', type: 'pick', count: 6, max: 50, description: '从 1–50 随机取 6 个不重复号码。' },
    { region: '马来西亚', name: 'Power Toto 6/55', type: 'pick', count: 6, max: 55, description: '从 1–55 随机取 6 个不重复号码。' },
    { region: '马来西亚', name: 'Supreme Toto 6/58', type: 'pick', count: 6, max: 58, description: '从 1–58 随机取 6 个不重复号码。' },

    { region: '新加坡', name: '4D', type: 'digits', digits: 4, description: '四位数娱乐号码，按 0000–9999 生成。' },
    { region: '新加坡', name: 'TOTO 6/49', type: 'pick', count: 6, max: 49, description: '普通 TOTO 简化为从 1–49 随机取 6 个不重复号码。' },
    { region: '新加坡', name: 'Singapore Sweep', type: 'rangeNumber', min: 1000000, max: 4499999, width: 7, description: '简化为随机生成 1000000–4499999 的七位票号。' },

    { region: '美国', name: 'Powerball', type: 'pickBonus', count: 5, max: 69, bonusName: 'Powerball', bonusMax: 26, description: '5 个白球号码 + 1 个独立 Powerball。' },
    { region: '美国', name: 'Mega Millions', type: 'pickBonus', count: 5, max: 70, bonusName: 'Mega Ball', bonusMax: 24, description: '5 个白球号码 + 1 个独立 Mega Ball。' },
    { region: '美国', name: 'Pick 3', type: 'digits', digits: 3, description: '三位数娱乐号码，按 000–999 生成。' },
    { region: '美国', name: 'Pick 4', type: 'digits', digits: 4, description: '四位数娱乐号码，按 0000–9999 生成。' },
    { region: '美国', name: 'Pick 5', type: 'digits', digits: 5, description: '五位数娱乐号码，按 00000–99999 生成。' },

    { region: '欧洲', name: 'EuroMillions', type: 'pickBonus', count: 5, max: 50, bonusName: 'Lucky Stars', bonusCount: 2, bonusMax: 12, description: '5 个主号码 + 2 个 Lucky Star，均为不重复随机。' },
    { region: '欧洲', name: 'UK Lotto', type: 'pick', count: 6, max: 59, description: '从 1–59 随机取 6 个不重复号码。' },
    { region: '欧洲', name: 'Irish Lotto', type: 'pick', count: 6, max: 47, description: '从 1–47 随机取 6 个不重复号码。' },

    { region: '加拿大', name: 'Lotto 6/49', type: 'pick', count: 6, max: 49, description: 'Classic Draw 简化为从 1–49 随机取 6 个不重复号码。' },
    { region: '加拿大', name: 'Lotto Max', type: 'pick', count: 7, max: 52, description: '按 2026 起生效规则，简化为从 1–52 随机取 7 个不重复号码。' },

    { region: '菲律宾', name: '3D Lotto', type: 'digits', digits: 3, description: '三位数娱乐号码，按 000–999 生成。' },
    { region: '菲律宾', name: '4D Lotto', type: 'digits', digits: 4, description: '四位数娱乐号码，按 0000–9999 生成。' },
    { region: '菲律宾', name: 'Lotto 6/42', type: 'pick', count: 6, max: 42, description: '从 1–42 随机取 6 个不重复号码。' },
    { region: '菲律宾', name: 'Mega Lotto 6/45', type: 'pick', count: 6, max: 45, description: '从 1–45 随机取 6 个不重复号码。' },
    { region: '菲律宾', name: 'Super Lotto 6/49', type: 'pick', count: 6, max: 49, description: '从 1–49 随机取 6 个不重复号码。' },
    { region: '菲律宾', name: 'Grand Lotto 6/55', type: 'pick', count: 6, max: 55, description: '从 1–55 随机取 6 个不重复号码。' },
    { region: '菲律宾', name: 'Ultra Lotto 6/58', type: 'pick', count: 6, max: 58, description: '从 1–58 随机取 6 个不重复号码。' },

    { region: '台湾', name: '大乐透 6/49', type: 'pickBonus', count: 6, max: 49, bonusName: '特别号', bonusMax: 49, bonusFromRemaining: true, description: '简化为 6 个主号 + 1 个剩余池特别号。' },
    { region: '台湾', name: '今彩 539', type: 'pick', count: 5, max: 39, description: '从 1–39 随机取 5 个不重复号码。' },
    { region: '台湾', name: '威力彩', type: 'pickBonus', count: 6, max: 38, bonusName: '第二区', bonusMax: 8, description: '简化为第一 区 1–38 取 6 个 + 第二 区 1–8 取 1 个。' },

    { region: '香港', name: 'Mark Six / 搅珠', type: 'pickBonus', count: 6, max: 49, bonusName: '特别号', bonusMax: 49, bonusFromRemaining: true, description: '简化为 6 个主号 + 1 个剩余池特别号。' },

    { region: '日本', name: 'Numbers 3', type: 'digits', digits: 3, description: '三位数娱乐号码，按 000–999 生成。' },
    { region: '日本', name: 'Numbers 4', type: 'digits', digits: 4, description: '四位数娱乐号码，按 0000–9999 生成。' },
    { region: '日本', name: 'Mini Loto', type: 'pick', count: 5, max: 31, description: '从 1–31 随机取 5 个不重复号码。' },
    { region: '日本', name: 'Loto 6', type: 'pick', count: 6, max: 43, description: '从 1–43 随机取 6 个不重复号码。' },
    { region: '日本', name: 'Loto 7', type: 'pick', count: 7, max: 37, description: '从 1–37 随机取 7 个不重复号码。' },

    { region: '韩国', name: 'Lotto 6/45', type: 'pickBonus', count: 6, max: 45, bonusName: 'Bonus', bonusMax: 45, bonusFromRemaining: true, description: '简化为 6 个主号 + 1 个剩余池 Bonus。' },

    { region: '泰国', name: 'Government Lottery / L6', type: 'digits', digits: 6, description: '简化为泰国政府彩票常见六位票号。' }
  ];

  function randomInt(min, max) {
    const cryptoObject = window.crypto || window.msCrypto;
    if (cryptoObject && cryptoObject.getRandomValues) {
      const range = max - min + 1;
      const maxUnbiased = Math.floor(0xffffffff / range) * range;
      const buffer = new Uint32Array(1);
      let value;
      do {
        cryptoObject.getRandomValues(buffer);
        value = buffer[0];
      } while (value >= maxUnbiased);
      return min + (value % range);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickUnique(count, max, excluded = []) {
    const excludedSet = new Set(excluded);
    const pool = [];
    for (let value = 1; value <= max; value += 1) {
      if (!excludedSet.has(value)) pool.push(value);
    }
    const result = [];
    while (result.length < count && pool.length) {
      const index = randomInt(0, pool.length - 1);
      result.push(pool.splice(index, 1)[0]);
    }
    return result.sort((a, b) => a - b);
  }

  function formatNumber(value, width = 2) {
    return String(value).padStart(width, '0');
  }

  function formatBalls(numbers, label) {
    return `<div class="lottery-ball-row"${label ? ` aria-label="${label}"` : ''}>${numbers.map((number) => `<span class="lottery-ball">${formatNumber(number)}</span>`).join('')}</div>`;
  }

  function generateLine(game) {
    if (game.type === 'digits') {
      const max = 10 ** game.digits - 1;
      return { primary: [formatNumber(randomInt(0, max), game.digits)], note: `${game.digits} 位数` };
    }

    if (game.type === 'rangeNumber') {
      return { primary: [formatNumber(randomInt(game.min, game.max), game.width)], note: `${game.min}–${game.max}` };
    }

    if (game.type === 'pick') {
      return { primary: pickUnique(game.count, game.max), note: `${game.count}/${game.max}` };
    }

    const primary = pickUnique(game.count, game.max);
    let bonus;
    if (game.bonusFromRemaining) {
      bonus = pickUnique(game.bonusCount || 1, game.bonusMax, primary);
    } else {
      bonus = pickUnique(game.bonusCount || 1, game.bonusMax);
    }
    return { primary, bonus, note: `${game.count}/${game.max} + ${game.bonusName}` };
  }

  function renderLine(game, line, index) {
    const primaryMarkup = typeof line.primary[0] === 'string'
      ? `<strong class="lottery-ticket-number">${line.primary[0]}</strong>`
      : formatBalls(line.primary, `${game.name} 主号码`);
    const bonusMarkup = line.bonus
      ? `<div class="lottery-bonus"><span>${game.bonusName}</span>${formatBalls(line.bonus, game.bonusName)}</div>`
      : '';

    return `
      <article class="lottery-result-card">
        <div class="lottery-result-meta">
          <span>第 ${index + 1} 组</span>
          <small>${line.note}</small>
        </div>
        ${primaryMarkup}
        ${bonusMarkup}
        <p>${DISCLAIMER}</p>
      </article>
    `;
  }

  function uniqueRegions() {
    return ['全部地区', ...Array.from(new Set(LOTTERY_GAMES.map((game) => game.region)))];
  }

  function currentGames() {
    const selectedRegion = document.getElementById('regionFilter').value;
    if (selectedRegion === '全部地区') return LOTTERY_GAMES;
    return LOTTERY_GAMES.filter((game) => game.region === selectedRegion);
  }

  function renderGameOptions() {
    const gameSelect = document.getElementById('gameSelect');
    const games = currentGames();
    gameSelect.innerHTML = games.map((game, index) => `<option value="${index}">${game.region}｜${game.name}</option>`).join('');
    renderGameInfo();
  }

  function selectedGame() {
    return currentGames()[Number(document.getElementById('gameSelect').value)] || currentGames()[0];
  }

  function renderGameInfo() {
    const game = selectedGame();
    const gameInfo = document.getElementById('gameInfo');
    if (!game) return;
    gameInfo.innerHTML = `
      <div>
        <span class="lottery-region-pill">${game.region}</span>
        <h2>${game.name}</h2>
        <p>${game.description}</p>
      </div>
      <p class="lottery-disclaimer compact">${DISCLAIMER}</p>
    `;
  }

  function generateResults() {
    const game = selectedGame();
    const count = Math.min(Math.max(Number(document.getElementById('lineCount').value) || 1, 1), 10);
    document.getElementById('lineCount').value = count;
    const lines = Array.from({ length: count }, () => generateLine(game));
    document.getElementById('lotteryResults').innerHTML = lines.map((line, index) => renderLine(game, line, index)).join('');
  }

  function renderDirectory() {
    const byRegion = LOTTERY_GAMES.reduce((accumulator, game) => {
      accumulator[game.region] = accumulator[game.region] || [];
      accumulator[game.region].push(game.name);
      return accumulator;
    }, {});

    document.getElementById('gameDirectory').innerHTML = Object.entries(byRegion).map(([region, games]) => `
      <article class="lottery-directory-card">
        <h3>${region}</h3>
        <ul>${games.map((game) => `<li>${game}</li>`).join('')}</ul>
        <p>${DISCLAIMER}</p>
      </article>
    `).join('');
  }

  function init() {
    const regionFilter = document.getElementById('regionFilter');
    regionFilter.innerHTML = uniqueRegions().map((region) => `<option value="${region}">${region}</option>`).join('');
    regionFilter.addEventListener('change', () => {
      renderGameOptions();
      generateResults();
    });
    document.getElementById('gameSelect').addEventListener('change', () => {
      renderGameInfo();
      generateResults();
    });
    document.getElementById('generateLottery').addEventListener('click', generateResults);
    document.getElementById('lineCount').addEventListener('change', generateResults);
    renderGameOptions();
    renderDirectory();
    generateResults();
  }

  document.addEventListener('DOMContentLoaded', init);
}());
