# BlythraLoop

## 全球彩票随机号码实验版

本仓库新增 `lottery.html` 与 `lottery-generator.js`，用于「买字 / 彩票号码随机」的娱乐和学习场景。

**仅供娱乐，不构成投注建议。**

该页面不会提供投注技巧，不预测中奖，不鼓励赌博，也不包含任何真实投注平台链接或购买入口。请遵守所在地法律、年龄限制和负责任娱乐原则。

## 已覆盖的初版玩法

- 马来西亚：4D、5D、6D、Toto 6/50、Power Toto 6/55、Supreme Toto 6/58
- 新加坡：4D、TOTO 6/49、Singapore Sweep（简化七位票号）
- 美国：Powerball、Mega Millions、Pick 3、Pick 4、Pick 5
- 欧洲：EuroMillions、UK Lotto、Irish Lotto
- 加拿大：Lotto 6/49、Lotto Max
- 菲律宾：3D Lotto、4D Lotto、6/42、6/45、6/49、6/55、6/58
- 台湾：大乐透 6/49、今彩 539、威力彩（简化随机版本）
- 香港：Mark Six / 搅珠（简化随机版本）
- 日本：Numbers 3、Numbers 4、Mini Loto、Loto 6、Loto 7
- 韩国：Lotto 6/45（简化随机版本）
- 泰国：Government Lottery / L6（简化六位票号）

## 资料来源与校对说明

资料优先依据官方彩票 / 官方运营商网页或规则页整理；若官方资料难以一次性确认，则参考可靠的公开资料进行初版建模。当前实现是「实验版」资料表，后续仍需人工逐项校对官方规则、开奖矩阵和任何地区性的规则变更。

参考来源摘要：

- Malaysia Sports Toto FAQ：列出 Toto 4D、5D、6D、Star Toto 6/50、Power Toto 6/55、Supreme Toto 6/58 等产品。
- Singapore Pools / GRA rules：TOTO 普通投注为 1–49 选 6；Singapore Sweep 为指定范围内七位号码；4D 规则来自新加坡官方规则资料。
- Powerball 官方玩法：5 个 1–69 白球号码 + 1 个 1–26 Powerball。
- Mega Millions 官方/州彩票玩法说明：5 个 1–70 主号码 + 1 个 1–24 Mega Ball。
- EuroMillions / UK National Lottery / Irish National Lottery：分别整理 5/50 + 2/12、6/59、6/47。
- 加拿大 OLG / ILC 资料：Lotto 6/49 为 6/49；Lotto Max 自 2026-04-14 起为 7/52，每 play 包含多组号码，页面中简化为单组随机实验。
- 菲律宾 PCSO：Lotto 6/42、Mega Lotto 6/45、Super Lotto 6/49、Grand Lotto 6/55、Ultra Lotto 6/58，以及 3D/4D 数字玩法。
- 台湾、香港、日本、韩国、泰国：以官方或可靠公开资料整理常见号码型玩法；复杂玩法先做简化随机版本。

## 本地检查

无需安装依赖即可打开 `lottery.html`。若要检查 JavaScript 语法：

```bash
node --check lottery-generator.js
```
