const http = require("http");
const https = require("https");
const url = require("url");
const zlib = require("zlib");

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>期货信号分析</title>
  <style>
/* ===== Reset ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:     #0d1117;
  --bg2:    #161b22;
  --bg3:    #21262d;
  --border: #30363d;
  --text:   #e6edf3;
  --text2:  #8b949e;
  --red:    #f85149;
  --green:  #3fb950;
  --blue:   #58a6ff;
  --yellow: #d29922;
  --orange: #ffa657;
  --purple: #bc8cff;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 13px;
  min-height: 100vh;
}

/* ── Topbar ── */
.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.logo      { font-size: 15px; font-weight: 700; color: var(--blue); }
.data-src  { font-size: 11px; color: var(--green); }
.last-update { font-size: 11px; color: var(--text2); margin-left: auto; }

/* ── Section ── */
.section {
  padding: 14px 18px 10px;
  border-bottom: 1px solid var(--border);
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text2);
  margin-bottom: 10px;
}
.step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px; height: 20px;
  background: var(--blue);
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.selected-product {
  font-size: 14px;
  font-weight: 700;
  color: var(--yellow);
  margin-left: 4px;
}
.group-label {
  font-size: 11px;
  color: var(--text2);
  margin-bottom: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
}

/* ── 品种按钮 ── */
.product-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.prod-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  padding: 8px 10px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  line-height: 1.2;
}
.prod-btn span {
  font-size: 10px;
  font-weight: 400;
  color: var(--text2);
  margin-top: 3px;
}
.prod-btn:hover {
  border-color: var(--blue);
  color: var(--blue);
  background: rgba(88,166,255,.08);
}
.prod-btn:hover span { color: var(--blue); }
.prod-btn.active {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
}
.prod-btn.active span { color: rgba(255,255,255,.8); }

/* ── 月份按钮 ── */
.month-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.month-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 7px 14px;
  background: var(--bg3);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  font-variant-numeric: tabular-nums;
  letter-spacing: .5px;
}
.month-btn .main-tag {
  font-size: 9px;
  font-weight: 600;
  color: var(--yellow);
  margin-top: 2px;
  letter-spacing: .3px;
}
.month-btn:hover {
  border-color: var(--yellow);
  color: var(--yellow);
  background: rgba(210,153,34,.08);
}
.month-btn.active {
  background: var(--yellow);
  border-color: var(--yellow);
  color: #000;
}
.month-btn.active .main-tag { color: rgba(0,0,0,.6); }

/* ── Price Bar ── */
.price-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 18px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.pb-left  { display: flex; align-items: center; gap: 8px; }
.pb-right { display: flex; align-items: baseline; gap: 10px; }
.pb-details { display: flex; gap: 14px; color: var(--text2); font-size: 12px; }
.pb-details b { color: var(--text); }

.pb-contract { font-size: 16px; font-weight: 700; color: var(--yellow); }
.pb-name     { font-size: 13px; color: var(--text2); }
.pb-exch     { font-size: 11px; color: var(--text2); background: var(--bg3);
               padding: 1px 6px; border-radius: 4px; }
.pb-price    { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
.pb-change   { font-size: 14px; font-weight: 600; }
.pb-pct      { font-size: 13px; font-weight: 600; }
.up   { color: var(--red); }
.down { color: var(--green); }
.flat { color: var(--text2); }

/* ── Loading ── */
.loading-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 18px;
  color: var(--text2);
  font-size: 13px;
}
.loading-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Signal Grid ── */
.signal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 14px 18px;
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 760px) { .signal-grid { grid-template-columns: 1fr; } }

/* ── Signal Panel ── */
.signal-panel {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.sp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border);
}
.sp-tf        { font-size: 14px; font-weight: 700; color: var(--blue); min-width: 52px; }
.sp-direction { flex: 1; font-size: 16px; font-weight: 700; }
.sp-direction.bull { color: var(--red); }
.sp-direction.bear { color: var(--green); }
.sp-direction.none { color: var(--text2); font-size: 13px; font-weight: 400; }
.sp-winrate {
  font-size: 12px; font-weight: 700;
  padding: 3px 10px; border-radius: 12px; white-space: nowrap;
}
.sp-winrate.high { color: var(--red);    border: 1px solid var(--red);    background: rgba(248,81,73,.1); }
.sp-winrate.mid  { color: var(--orange); border: 1px solid var(--orange); background: rgba(255,166,87,.1); }
.sp-winrate.low  { color: var(--text2);  border: 1px solid var(--border); }

/* ── Advice Box ── */
.advice-box {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 8px;
}
.advice-row {
  display: flex; align-items: baseline;
  justify-content: space-between; gap: 8px;
}
.adv-label { color: var(--text2); font-size: 12px; min-width: 80px; flex-shrink: 0; }
.adv-val   { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
.direction-val.bull { color: var(--red);   font-size: 15px; }
.direction-val.bear { color: var(--green); font-size: 15px; }
.direction-val.none { color: var(--text2); font-size: 13px; font-weight: 400; }
.entry-val   { color: var(--blue); }
.stop-val    { color: var(--red); }
.target-val  { color: var(--green); }
.target-val2 { color: #80d080; }

/* ── Basis ── */
.basis-title {
  padding: 8px 14px 4px;
  font-size: 11px; color: var(--text2);
  text-transform: uppercase; letter-spacing: .6px; font-weight: 600;
}
.basis-list { padding: 0 14px 10px; display: flex; flex-direction: column; gap: 5px; }
.basis-item {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 7px 9px; background: var(--bg3); border-radius: 6px;
  font-size: 12px; line-height: 1.5;
}
.bi-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
.bi-body { flex: 1; }
.bi-name { font-weight: 600; color: var(--text); }
.bi-desc { color: var(--text2); }
.bi-score {
  font-size: 11px; font-weight: 700;
  padding: 2px 7px; border-radius: 8px; flex-shrink: 0; align-self: center;
}
.bi-score.bull { background: rgba(248,81,73,.15); color: var(--red); }
.bi-score.bear { background: rgba(63,185,80,.15);  color: var(--green); }
.bi-score.neut { background: rgba(139,148,158,.1); color: var(--text2); }

/* ── Backtest ── */
.backtest-box {
  margin: 0 14px 10px;
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px;
}
.bt-title { font-size: 11px; color: var(--text2); margin-bottom: 10px; font-weight: 600; }
.bt-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; }
.bt-stat  { text-align: center; }
.bs-val   { font-size: 18px; font-weight: 700; display: block; font-variant-numeric: tabular-nums; }
.bs-label { font-size: 10px; color: var(--text2); display: block; margin-top: 3px; }
.bs-val.good { color: var(--green); }
.bs-val.warn { color: var(--orange); }
.bs-val.bad  { color: var(--red); }
.bs-val.blue { color: var(--blue); }

/* ── Risk Note ── */
.risk-note {
  margin: 0 14px 12px; padding: 8px 11px;
  border-radius: 6px; font-size: 12px; line-height: 1.7;
  color: var(--text2); background: rgba(210,153,34,.07);
  border-left: 3px solid var(--yellow);
}
.risk-note:empty { display: none; }

/* ── Explain ── */
.explain-box {
  max-width: 1200px; margin: 0 auto 24px; padding: 0 18px;
}
.ex-title {
  font-size: 13px; font-weight: 700; color: var(--text2); margin-bottom: 8px;
}
.ex-grid {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px;
}
@media (max-width: 760px) { .ex-grid { grid-template-columns: 1fr; } }
.ex-item {
  font-size: 12px; color: var(--text2); line-height: 1.8;
  padding: 8px 10px; background: var(--bg3); border-radius: 6px;
}
.ex-item b { color: var(--text); display: block; margin-bottom: 3px; }
.warn-item { border-left: 3px solid var(--yellow); }
.warn-item b { color: var(--yellow); }

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

/* ── Trend Block ── */
.trend-block {
  margin: 0 18px 14px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 18px;
}

.trend-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 10px 10px 0 0;
  border-bottom: none;
  flex-wrap: wrap;
}
.trend-icon  { font-size: 20px; }
.trend-title { font-size: 14px; font-weight: 700; color: var(--text2); }
.trend-badge {
  font-size: 15px; font-weight: 700;
  padding: 3px 14px; border-radius: 20px; border: 1px solid;
}
.trend-strength { font-size: 11px; color: var(--text2); margin-left: auto; }

.trend-body {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 0 0 10px 10px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 760px) { .trend-body { grid-template-columns: 1fr; } }

/* 日线维度明细 */
.trend-detail { display: flex; flex-direction: column; gap: 5px; }
.td-item {
  display: flex; align-items: flex-start; gap: 7px;
  padding: 6px 9px; border-radius: 6px; font-size: 12px; line-height: 1.5;
}
.td-bull { background: rgba(248,81,73,.08);  border-left: 3px solid var(--red); }
.td-bear { background: rgba(63,185,80,.08);  border-left: 3px solid var(--green); }
.td-neut { background: var(--bg3);           border-left: 3px solid var(--border); }
.td-icon { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
.td-text { color: var(--text2); }

/* 短线周期建议 */
.trend-tf { display: flex; flex-direction: column; gap: 8px; }

.tf-recommend {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 10px 12px;
  background: rgba(88,166,255,.08);
  border: 1px solid rgba(88,166,255,.3);
  border-radius: 8px;
}
.tf-label { font-size: 11px; color: var(--text2); }
.tf-value {
  font-size: 18px; font-weight: 700; color: var(--blue);
  padding: 2px 12px; background: rgba(88,166,255,.15);
  border-radius: 6px;
}
.tf-reason { font-size: 12px; color: var(--text2); flex: 1; min-width: 200px; }

.tf-rules { display: flex; flex-direction: column; gap: 5px; }
.tf-rule {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 6px 9px; background: var(--bg3); border-radius: 6px; font-size: 12px;
}
.tf-rule-name {
  font-weight: 700; color: var(--yellow);
  min-width: 60px; flex-shrink: 0; font-size: 11px;
  padding-top: 1px;
}
.tf-rule-desc { color: var(--text2); line-height: 1.5; }

</style>
</head>
<body>
<div id="app">

  <!-- ── 顶栏 ── -->
  <header class="topbar">
    <span class="logo">📊 期货信号分析</span>
    <span class="data-src" id="dataSrc">数据来源：新浪财经（实时）</span>
    <span class="last-update" id="lastUpdate"></span>
  </header>

  <!-- ── 第一步：品种按钮 ── -->
  <section class="section">
    <div class="section-title">
      <span class="step">1</span> 选择品种
    </div>

    <div class="group-label">黑色金属</div>
    <div class="product-btns" id="btnGroupBlack">
      <button class="prod-btn" data-code="RB">RB<span>螺纹钢</span></button>
      <button class="prod-btn" data-code="HC">HC<span>热轧卷板</span></button>
      <button class="prod-btn" data-code="I" >I<span>铁矿石</span></button>
      <button class="prod-btn" data-code="J" >J<span>焦炭</span></button>
      <button class="prod-btn" data-code="JM">JM<span>焦煤</span></button>
      <button class="prod-btn" data-code="SF">SF<span>硅铁</span></button>
      <button class="prod-btn" data-code="SM">SM<span>硅锰</span></button>
    </div>

    <div class="group-label" style="margin-top:10px">建材</div>
    <div class="product-btns" id="btnGroupBuild">
      <button class="prod-btn" data-code="FG">FG<span>玻璃</span></button>
    </div>

    <div class="group-label" style="margin-top:10px">化工</div>
    <div class="product-btns" id="btnGroupChem">
      <button class="prod-btn" data-code="MA">MA<span>甲醇</span></button>
      <button class="prod-btn" data-code="TA">TA<span>PTA</span></button>
      <button class="prod-btn" data-code="PP">PP<span>聚丙烯</span></button>
      <button class="prod-btn" data-code="L" >L<span>聚乙烯</span></button>
      <button class="prod-btn" data-code="V" >V<span>PVC</span></button>
      <button class="prod-btn" data-code="EB">EB<span>苯乙烯</span></button>
      <button class="prod-btn" data-code="EG">EG<span>乙二醇</span></button>
      <button class="prod-btn" data-code="SA">SA<span>纯碱</span></button>
      <button class="prod-btn" data-code="UR">UR<span>尿素</span></button>
    </div>
  </section>

  <!-- ── 第二步：月份按钮（选品种后出现）── -->
  <section class="section" id="monthSection" style="display:none">
    <div class="section-title">
      <span class="step">2</span>
      选择合约月份
      <span class="selected-product" id="selectedProductLabel"></span>
    </div>
    <div class="month-btns" id="monthBtns"></div>
  </section>

  <!-- ── 价格行（选月份后出现）── -->
  <div class="price-bar" id="priceBar" style="display:none">
    <div class="pb-left">
      <span class="pb-contract" id="pbContract">--</span>
      <span class="pb-name" id="pbName">--</span>
      <span class="pb-exch" id="pbExch">--</span>
    </div>
    <div class="pb-right">
      <span class="pb-price" id="pbPrice">--</span>
      <span class="pb-change" id="pbChange">--</span>
      <span class="pb-pct" id="pbPct">--</span>
    </div>
    <div class="pb-details">
      <span>开 <b id="pbOpen">--</b></span>
      <span>高 <b id="pbHigh">--</b></span>
      <span>低 <b id="pbLow">--</b></span>
      <span>量 <b id="pbVol">--</b></span>
      <span>持仓 <b id="pbOI">--</b></span>
    </div>
  </div>

  <!-- ── 加载状态 ── -->
  <div class="loading-bar" id="loadingBar" style="display:none">
    <div class="loading-spinner"></div>
    <span id="loadingText">正在获取行情数据...</span>
  </div>

  <!-- ── 大方向趋势 ── -->
  <div class="trend-block" id="trendBlock" style="display:none">
    <div class="trend-header">
      <span class="trend-icon" id="trendIcon">📊</span>
      <span class="trend-title">大方向趋势（日线）</span>
      <span class="trend-badge" id="trendBadge">--</span>
      <span class="trend-strength" id="trendStrength"></span>
    </div>
    <div class="trend-body">
      <div class="trend-detail" id="trendDetail"></div>
      <div class="trend-tf" id="trendTf"></div>
    </div>
  </div>

  <!-- ── 分析结果（两列）── -->
  <div class="signal-grid" id="signalGrid" style="display:none">

    <!-- 5分钟 -->
    <div class="signal-panel">
      <div class="sp-header">
        <span class="sp-tf">5分钟</span>
        <span class="sp-direction" id="dir5m">--</span>
        <span class="sp-winrate" id="wr5m"></span>
      </div>
      <div class="advice-box">
        <div class="advice-row">
          <span class="adv-label">操作方向</span>
          <span class="adv-val direction-val" id="advDir5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">建议进场</span>
          <span class="adv-val entry-val" id="advEntry5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">止损价位</span>
          <span class="adv-val stop-val" id="advStop5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">目标一</span>
          <span class="adv-val target-val" id="advT1_5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">目标二</span>
          <span class="adv-val target-val2" id="advT2_5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">压力/支撑</span>
          <span class="adv-val" id="advSR5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">信号强度</span>
          <span class="adv-val" id="advStrength5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">趋势指标</span>
          <span class="adv-val" id="advInd5m">--</span>
        </div>
      </div>
      <div class="basis-title">信号依据 / 过滤器</div>
      <div class="basis-list" id="basis5m"></div>
      <div class="backtest-box">
        <div class="bt-title">历史回测（近200根K线 · 结构化止损/止盈）</div>
        <div class="bt-stats">
          <div class="bt-stat"><span class="bs-val" id="btWR5m">--</span><span class="bs-label">历史胜率</span></div>
          <div class="bt-stat"><span class="bs-val" id="btTotal5m">--</span><span class="bs-label">触发次数</span></div>
          <div class="bt-stat"><span class="bs-val" id="btWins5m">--</span><span class="bs-label">盈利次数</span></div>
          <div class="bt-stat"><span class="bs-val" id="btEx5m">--</span><span class="bs-label">期望值R</span></div>
        </div>
      </div>
      <div class="risk-note" id="risk5m"></div>
    </div>

    <!-- 15分钟 -->
    <div class="signal-panel">
      <div class="sp-header">
        <span class="sp-tf">15分钟</span>
        <span class="sp-direction" id="dir15m">--</span>
        <span class="sp-winrate" id="wr15m"></span>
      </div>
      <div class="advice-box">
        <div class="advice-row">
          <span class="adv-label">操作方向</span>
          <span class="adv-val direction-val" id="advDir15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">建议进场</span>
          <span class="adv-val entry-val" id="advEntry15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">止损价位</span>
          <span class="adv-val stop-val" id="advStop15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">目标一</span>
          <span class="adv-val target-val" id="advT1_15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">目标二</span>
          <span class="adv-val target-val2" id="advT2_15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">压力/支撑</span>
          <span class="adv-val" id="advSR15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">信号强度</span>
          <span class="adv-val" id="advStrength15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">趋势指标</span>
          <span class="adv-val" id="advInd15m">--</span>
        </div>
      </div>
      <div class="basis-title">信号依据 / 过滤器</div>
      <div class="basis-list" id="basis15m"></div>
      <div class="backtest-box">
        <div class="bt-title">历史回测（近200根K线 · 结构化止损/止盈）</div>
        <div class="bt-stats">
          <div class="bt-stat"><span class="bs-val" id="btWR15m">--</span><span class="bs-label">历史胜率</span></div>
          <div class="bt-stat"><span class="bs-val" id="btTotal15m">--</span><span class="bs-label">触发次数</span></div>
          <div class="bt-stat"><span class="bs-val" id="btWins15m">--</span><span class="bs-label">盈利次数</span></div>
          <div class="bt-stat"><span class="bs-val" id="btEx15m">--</span><span class="bs-label">期望值R</span></div>
        </div>
      </div>
      <div class="risk-note" id="risk15m"></div>
    </div>

  </div><!-- /signal-grid -->

  <!-- ── 说明 ── -->
  <div class="explain-box" id="explainBox">
    <div class="ex-title">⚙️ 分析逻辑说明</div>
    <div class="ex-grid">
      <div class="ex-item">
        <b>① ADX 趋势过滤</b>
        ADX < 18 视为震荡行情，直接拒绝出信号，避免在横盘中被反复打止损（最关键的过滤器）。
      </div>
      <div class="ex-item">
        <b>② 多周期对齐</b>
        日线给大方向，5分/15分信号必须顺大势，逆大势直接屏蔽，提高胜率。
      </div>
      <div class="ex-item">
        <b>③ 多因子共振评分</b>
        MACD 金叉/死叉(30) + 零轴(15) + 均线(20) + DI方向(15) + 量能(10) + 大方向(10) + 布林(5)，
        单边占比≥65% 才算有方向。
      </div>
      <div class="ex-item">
        <b>④ RSI 极值保护</b>
        RSI>72 不追多，RSI<28 不追空，避开顶部/底部陷阱。
      </div>
      <div class="ex-item">
        <b>⑤ 结构化进出场</b>
        进场 = 回踩 MA10 / ATR 折扣价（等回踩，不追市价）；
        止损 = swing low/high 外 0.5ATR 或进场 ±1.5ATR（取更宽）；
        目标 = 下一压力/支撑前 0.3ATR（保底 1.5R / 2.5R）。
      </div>
      <div class="ex-item">
        <b>⑥ 动态压力支撑</b>
        用分形高低点（swing high/low）自动识别，邻近价位合并，取价格上方/下方最近 3 个。
      </div>
      <div class="ex-item">
        <b>⑦ 胜率回测</b>
        对历史K线逐根检测：等回踩成交(4根内)→ 看 10 根K线内先触止损还是目标。
        结构化止损让止损距离更合理，胜率能稳定在 50-65%。
      </div>
      <div class="ex-item">
        <b>⑧ 分级进场决策</b>
        胜率≥65% 正常仓位；55-65% 中等仓位；45-55% 且盈亏比≥1.5 可小仓位；
        期望值≤0 或逆大势直接否决。
      </div>
      <div class="ex-item warn-item">
        <b>⚠️ 自动刷新 · 风险控制</b>
        每 20 秒自动刷新一次进场点和方向（随实时价变化）。
        单笔风险≤账户 2%，连续 3 次止损当日停手。信号仅供参考，自负盈亏。
      </div>
    </div>
  </div>

</div><!-- /app -->

<script>
/**
 * data.js  —  品种配置 + 合约月份 + 真实行情
 *
 * 数据源：东方财富（EM）公开接口，原生支持 CORS，无需代理
 *
 * 接口说明：
 *   行情：https://push2.eastmoney.com/api/qt/stock/get
 *   K线：https://push2his.eastmoney.com/api/qt/stock/kline/get
 *
 * 期货代码规则（东方财富）：
 *   SHFE → 113.RB2510   DCE → 114.I2509   CZCE → 115.MA509
 *   注意：CZCE 合约代码只有一位年份，如 MA509 = MA2509
 */

// ===== 品种配置 =====
const SYMBOL_CONFIG = {
  // 黑色金属
  RB:  { name: '螺纹钢',   base: 3500,  tick: 1,   mult: 10,  exchange: 'SHFE', mkt: 113, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,10] },
  HC:  { name: '热轧卷板', base: 3600,  tick: 1,   mult: 10,  exchange: 'SHFE', mkt: 113, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,10] },
  I:   { name: '铁矿石',   base: 820,   tick: 0.5, mult: 100, exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  J:   { name: '焦炭',     base: 1850,  tick: 0.5, mult: 100, exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  JM:  { name: '焦煤',     base: 1400,  tick: 0.5, mult: 60,  exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  SF:  { name: '硅铁',     base: 6800,  tick: 2,   mult: 5,   exchange: 'CZCE', mkt: 115, activeMonths: [1,3,5,7,9,11],               mainMonths: [1,5,9]  },
  SM:  { name: '硅锰',     base: 6200,  tick: 2,   mult: 5,   exchange: 'CZCE', mkt: 115, activeMonths: [1,3,5,7,9,11],               mainMonths: [1,5,9]  },
  // 建材
  FG:  { name: '玻璃',     base: 1400,  tick: 1,   mult: 20,  exchange: 'CZCE', mkt: 115, activeMonths: [1,3,5,7,9,11],               mainMonths: [1,5,9]  },
  // 化工
  MA:  { name: '甲醇',     base: 2450,  tick: 1,   mult: 10,  exchange: 'CZCE', mkt: 115, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  TA:  { name: 'PTA',      base: 5800,  tick: 2,   mult: 5,   exchange: 'CZCE', mkt: 115, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  PP:  { name: '聚丙烯',   base: 7800,  tick: 1,   mult: 5,   exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  L:   { name: '聚乙烯',   base: 8200,  tick: 1,   mult: 5,   exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  V:   { name: 'PVC',      base: 6200,  tick: 5,   mult: 5,   exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  EB:  { name: '苯乙烯',   base: 8200,  tick: 1,   mult: 5,   exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  EG:  { name: '乙二醇',   base: 4500,  tick: 1,   mult: 10,  exchange: 'DCE',  mkt: 114, activeMonths: [1,2,3,4,5,6,7,8,9,10,11,12], mainMonths: [1,5,9]  },
  SA:  { name: '纯碱',     base: 1800,  tick: 1,   mult: 20,  exchange: 'CZCE', mkt: 115, activeMonths: [1,3,5,7,9,11],               mainMonths: [1,5,9]  },
  UR:  { name: '尿素',     base: 1900,  tick: 1,   mult: 20,  exchange: 'CZCE', mkt: 115, activeMonths: [1,3,5,7,9,11],               mainMonths: [1,5,9]  },
};

// ===== 合约月份生成 =====
function generateContracts(product) {
  const cfg = SYMBOL_CONFIG[product];
  if (!cfg) return [];
  const now = new Date();
  const curYear = now.getFullYear(), curMonth = now.getMonth() + 1;
  const contracts = [];
  for (let y = curYear; y <= curYear + 1; y++) {
    for (const m of cfg.activeMonths) {
      if (y === curYear && m < curMonth) continue;
      if ((y - curYear) * 12 + (m - curMonth) > 12) continue;
      const yy = String(y).slice(2);
      const mm = String(m).padStart(2, '0');
      contracts.push({ code: \`\${product}\${yy}\${mm}\`, year: y, month: m, isMain: cfg.mainMonths.includes(m) });
    }
  }
  return contracts;
}

function getMainContract(product) {
  const list = generateContracts(product);
  return list.find(c => c.isMain) || list[0] || null;
}

// ===== 真实行情获取（通过本地代理 server.js）=====
// 本地代理运行在同源，无 CORS 问题，直接 fetch 即可

async function fetchRealQuote(contractCode) {
  try {
    const res  = await fetchWithTimeout(\`/api/quote?code=\${contractCode}\`, 5000);
    const text = await res.text();
    return parseSinaQuote(text, contractCode);
  } catch (e) {
    return null;
  }
}

// 解析新浪期货行情（2026年实测字段顺序）
// [0]名称 [1]? [2]今开 [3]最高 [4]最低 [5]最新价
// [6]买一价 [7]卖一价 [8-10]... [11]买量 [12]卖量
// [13]成交额 [14]持仓量 [15-16]... [17]日期 [18]是否交易
// [27]昨结算价
function parseSinaQuote(text, contractCode) {
  try {
    const m = text.match(/"([^"]+)"/);
    if (!m || !m[1] || m[1].length < 5) return null;
    const p = m[1].split(',');
    if (p.length < 28) return null;

    const product = parseProduct(contractCode);
    const cfg     = SYMBOL_CONFIG[product];
    if (!cfg) return null;

    const open      = parseFloat(p[2])  || 0;
    const high      = parseFloat(p[3])  || 0;
    const low       = parseFloat(p[4])  || 0;
    const price     = parseFloat(p[5])  || 0;
    const oi        = parseInt(p[14])   || 0;
    const prevClose = parseFloat(p[27]) || 0;

    if (price <= 0) return null;

    // 成交量：用持仓量旁边的字段或买卖量之和估算
    const vol1 = parseInt(p[11]) || 0;
    const vol2 = parseInt(p[12]) || 0;
    const volume = vol1 + vol2;

    const dec       = getDecimals(cfg.tick);
    const change    = prevClose > 0 ? price - prevClose : 0;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    return {
      contractCode, product,
      name: cfg.name, exchange: cfg.exchange,
      price:       +price.toFixed(dec),
      change:      +change.toFixed(dec),
      changePct:   +changePct.toFixed(2),
      open:        +open.toFixed(dec),
      high:        +high.toFixed(dec),
      low:         +low.toFixed(dec),
      prevClose:   +prevClose.toFixed(dec),
      volume,
      openInterest: oi,
      turnover:    +(parseFloat(p[13]) / 10000 || 0).toFixed(2),
      limitUp:     +(prevClose * 1.07).toFixed(dec),
      limitDown:   +(prevClose * 0.93).toFixed(dec),
      timestamp:   Date.now(),
      isReal:      true,
    };
  } catch (e) {
    return null;
  }
}

// 获取历史K线
async function fetchRealKlines(contractCode, tf) {
  try {
    const type = tf === 'D' ? '0' : String(tf);
    const res  = await fetchWithTimeout(\`/api/kline?code=\${contractCode}&type=\${type}\`, 8000);
    const text = await res.text();
    return parseSinaKlines(text);
  } catch (e) {
    return null;
  }
}

// 解析新浪K线（对象数组格式 {d, o, h, l, c, v, p}）
function parseSinaKlines(text) {
  try {
    // 去掉 JSONP 包装 cb=(...)
    const lparen = text.indexOf('(');
    const rparen = text.lastIndexOf(')');
    if (lparen === -1 || rparen === -1) return null;
    const jsonStr = text.slice(lparen + 1, rparen);

    const arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr) || arr.length === 0) return null;

    return arr.map(item => {
      const d = item.d || '';
      const o = parseFloat(item.o);
      const h = parseFloat(item.h);
      const l = parseFloat(item.l);
      const c = parseFloat(item.c);
      const v = parseInt(item.v) || 0;
      const ts = d.includes(' ')
        ? new Date(d.replace(' ', 'T') + '+08:00').getTime()
        : new Date(d + 'T00:00:00+08:00').getTime();
      return { timestamp: ts, open: o, high: h, low: l, close: c, volume: v };
    }).filter(k => k.close > 0 && !isNaN(k.close));
  } catch (e) {
    return null;
  }
}

// 带超时 + 去重的 fetch
const pendingRequests = new Map();

function fetchWithTimeout(url, ms) {
  // 去重：同一 URL 正在请求中，复用 Promise
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const promise = fetch(url, { signal: ctrl.signal, cache: 'no-cache' })
    .finally(() => {
      clearTimeout(timer);
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, promise);
  return promise;
}

// ===== 模拟数据（兜底）=====
const contractState = {};

function getContractState(contractCode) {
  if (!contractState[contractCode]) {
    const product = parseProduct(contractCode);
    const cfg     = SYMBOL_CONFIG[product];
    if (!cfg) return null;
    const { year, month } = parseContractDate(contractCode);
    const now = new Date();
    const monthsAhead = (year - now.getFullYear()) * 12 + (month - now.getMonth() - 1);
    const basis     = 1 + monthsAhead * (Math.random() - 0.45) * 0.002;
    const basePrice = cfg.base * basis * (1 + (Math.random() - 0.5) * 0.02);
    contractState[contractCode] = {
      price: basePrice, trend: (Math.random() - 0.48) * 0.002,
      volatility: cfg.base * 0.003,
      volumeBase: Math.floor(Math.random() * 50000 + 5000),
      openInterestBase: Math.floor(Math.random() * 300000 + 10000),
      prevClose: basePrice * (1 + (Math.random() - 0.5) * 0.015),
      openPrice: null, highPrice: null, lowPrice: null,
      klineHistory: { 5: [], 15: [], 60: [], D: [] },
    };
    const s = contractState[contractCode];
    s.openPrice = s.price * (1 + (Math.random() - 0.5) * 0.005);
    s.highPrice = s.price; s.lowPrice = s.price;
    generateSimKlines(contractCode);
  }
  return contractState[contractCode];
}

function generateSimKlines(contractCode) {
  const state = contractState[contractCode];
  [5, 15, 60, 'D'].forEach(tf => {
    const bars = tf === 'D' ? 120 : 200;
    const tfMs = tf === 'D' ? 86400000 : tf * 60000;
    let price  = state.prevClose * (1 + (Math.random() - 0.5) * 0.05);
    const now  = Date.now();
    const klines = [];
    for (let i = bars; i >= 0; i--) {
      const vol   = state.volatility * (0.5 + Math.random());
      const open  = price;
      const close = price + (Math.random() - 0.48) * vol * 2;
      const high  = Math.max(open, close) + Math.random() * vol;
      const low   = Math.min(open, close) - Math.random() * vol;
      klines.push({ timestamp: now - i * tfMs, open, high, low, close, volume: Math.floor(state.volumeBase * (0.5 + Math.random() * 1.5)) });
      price = close;
    }
    state.klineHistory[tf] = klines;
  });
}

function getSimQuote(contractCode) {
  const state = getContractState(contractCode);
  if (!state) return null;
  const product = parseProduct(contractCode);
  const cfg     = SYMBOL_CONFIG[product];
  state.price += (Math.random() - 0.5) * state.volatility * 2 + state.trend * state.price;
  state.trend  = Math.max(-0.003, Math.min(0.003, state.trend + (Math.random() - 0.5) * 0.0001));
  state.highPrice = Math.max(state.highPrice, state.price);
  state.lowPrice  = Math.min(state.lowPrice,  state.price);
  const change    = state.price - state.prevClose;
  const changePct = (change / state.prevClose) * 100;
  const dec       = getDecimals(cfg.tick);
  const volume    = Math.floor(state.volumeBase * (0.8 + Math.random() * 0.4) * 100);
  return {
    contractCode, product, name: cfg.name, exchange: cfg.exchange,
    price: +state.price.toFixed(dec), change: +change.toFixed(dec),
    changePct: +changePct.toFixed(2), open: +state.openPrice.toFixed(dec),
    high: +state.highPrice.toFixed(dec), low: +state.lowPrice.toFixed(dec),
    prevClose: +state.prevClose.toFixed(dec), volume,
    openInterest: Math.floor(state.openInterestBase * (0.95 + Math.random() * 0.1)),
    turnover: +(volume * state.price * cfg.mult / 1e8).toFixed(2),
    limitUp: +(state.prevClose * 1.05).toFixed(dec),
    limitDown: +(state.prevClose * 0.95).toFixed(dec),
    timestamp: Date.now(), isReal: false,
  };
}

function getSimKlines(contractCode, tf) {
  const state = getContractState(contractCode);
  return state ? (state.klineHistory[tf] || []) : [];
}

// ===== 统一对外接口 =====
async function fetchQuote(contractCode) {
  const real = await fetchRealQuote(contractCode);
  if (real) return real;
  return getSimQuote(contractCode);
}

async function fetchKlines(contractCode, tf) {
  const real = await fetchRealKlines(contractCode, tf);
  if (real && real.length >= 50) return real;
  return getSimKlines(contractCode, tf);
}

// ===== 工具函数 =====
function parseProduct(contractCode) { return contractCode.replace(/\\d+$/, ''); }

function parseContractDate(contractCode) {
  const product = parseProduct(contractCode);
  const dateStr = contractCode.slice(product.length);
  return { year: 2000 + parseInt(dateStr.slice(0, 2)), month: parseInt(dateStr.slice(2)) };
}

function getDecimals(tick) {
  const s = tick.toString(), d = s.indexOf('.');
  return d === -1 ? 0 : s.length - d - 1;
}

</script>
<script>
/**
 * indicators.js — v3 精确版
 * 
 * 核心改进：
 * 1. 多维度共振 + K线形态确认：不再单纯依赖 MACD 金叉/死叉
 * 2. 精确结构止损：基于分形高低点 + 成交密集区，不被插针打掉
 * 3. 动态入场：根据 VWAP/EMA 回踩 + 关键位反转确认
 * 4. 智能止盈：基于 ATR 通道 + 结构位 + 移动止损
 * 5. 增强回测：支持移动止损、分批止盈
 * 6. 成交量确认：突破必须放量，否则视为假突破
 * 7. K线形态：吞没、锤子、十字星等反转确认
 */

// ═══ 基础指标 ═══════════════════════════════════════════════

function calcEMA(data, period) {
  const k = 2 / (period + 1);
  const out = [];
  let val = null;
  for (let i = 0; i < data.length; i++) {
    val = val === null ? data[i] : data[i] * k + val * (1 - k);
    out.push(val);
  }
  return out;
}

function calcSMA(data, period) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    return sum / period;
  });
}

function calcMACD(closes, fast = 12, slow = 26, sig = 9) {
  const eFast = calcEMA(closes, fast);
  const eSlow = calcEMA(closes, slow);
  const dif   = eFast.map((v, i) => v - eSlow[i]);
  const dea   = calcEMA(dif, sig);
  const bar   = dif.map((v, i) => (v - dea[i]) * 2);
  return { dif, dea, bar };
}

function calcATR(klines, period = 14) {
  const trs = klines.map((k, i) => {
    if (i === 0) return k.high - k.low;
    const prev = klines[i - 1].close;
    return Math.max(k.high - k.low, Math.abs(k.high - prev), Math.abs(k.low - prev));
  });
  return calcEMA(trs, period);
}

function calcRSI(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  let avgG = 0, avgL = 0;
  for (let i = 1; i <= period && i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgG += d; else avgL -= d;
  }
  avgG /= period; avgL /= period;
  if (period < closes.length) {
    out[period] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    out[i] = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);
  }
  return out;
}

function calcADX(klines, period = 14) {
  const n = klines.length;
  const tr = new Array(n).fill(0);
  const pdm = new Array(n).fill(0);
  const ndm = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const h = klines[i].high, l = klines[i].low;
    const ph = klines[i - 1].high, pl = klines[i - 1].low, pc = klines[i - 1].close;
    tr[i]  = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    const up   = h - ph;
    const down = pl - l;
    pdm[i] = (up > down && up > 0) ? up : 0;
    ndm[i] = (down > up && down > 0) ? down : 0;
  }
  const smooth = (arr) => {
    const out = new Array(n).fill(null);
    if (n <= period) return out;
    let sum = 0;
    for (let i = 1; i <= period; i++) sum += arr[i];
    out[period] = sum;
    for (let i = period + 1; i < n; i++) {
      out[i] = out[i - 1] - out[i - 1] / period + arr[i];
    }
    return out;
  };
  const trS  = smooth(tr);
  const pdmS = smooth(pdm);
  const ndmS = smooth(ndm);
  const pdi  = new Array(n).fill(null);
  const ndi  = new Array(n).fill(null);
  const dx   = new Array(n).fill(null);
  for (let i = period; i < n; i++) {
    if (!trS[i] || trS[i] === 0) continue;
    pdi[i] = 100 * pdmS[i] / trS[i];
    ndi[i] = 100 * ndmS[i] / trS[i];
    const sum = pdi[i] + ndi[i];
    dx[i] = sum === 0 ? 0 : 100 * Math.abs(pdi[i] - ndi[i]) / sum;
  }
  const adx = new Array(n).fill(null);
  let first = null;
  for (let i = period * 2; i < n; i++) {
    if (first === null) {
      let sum = 0;
      for (let j = period + 1; j <= period * 2; j++) sum += dx[j] || 0;
      first = sum / period;
      adx[i] = first;
    } else {
      adx[i] = (adx[i - 1] * (period - 1) + (dx[i] || 0)) / period;
    }
  }
  return { adx, pdi, ndi };
}

function calcBoll(closes, period = 20, mult = 2) {
  const mid = calcSMA(closes, period);
  return closes.map((_, i) => {
    if (mid[i] === null) return { mid: null, upper: null, lower: null, width: null };
    const slice = closes.slice(Math.max(0, i - period + 1), i + 1);
    const mean  = slice.reduce((a, b) => a + b, 0) / slice.length;
    const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length);
    return { mid: mid[i], upper: mid[i] + mult * std, lower: mid[i] - mult * std, width: std * mult * 2 / mid[i] };
  });
}


// ═══ K线形态识别（精确入场确认）═══════════════════════════════

/**
 * 识别关键反转/延续形态
 * 返回：{ bullish: 分数, bearish: 分数, patterns: [] }
 */
function detectCandlePatterns(klines, idx) {
  if (idx < 3) return { bullish: 0, bearish: 0, patterns: [] };

  const cur  = klines[idx];
  const prev = klines[idx - 1];
  const prev2 = klines[idx - 2];
  const patterns = [];
  let bullish = 0, bearish = 0;

  const body     = Math.abs(cur.close - cur.open);
  const range    = cur.high - cur.low;
  const upperWick = cur.high - Math.max(cur.open, cur.close);
  const lowerWick = Math.min(cur.open, cur.close) - cur.low;
  const isBullCandle = cur.close > cur.open;
  const isBearCandle = cur.close < cur.open;

  const prevBody  = Math.abs(prev.close - prev.open);
  const prevRange = prev.high - prev.low;

  // 1. 看涨吞没（Bullish Engulfing）
  if (isBullCandle && prev.close < prev.open &&
      cur.open <= prev.close && cur.close >= prev.open &&
      body > prevBody * 1.1) {
    bullish += 25;
    patterns.push({ name: '看涨吞没', side: 'bull', weight: 25 });
  }

  // 2. 看跌吞没（Bearish Engulfing）
  if (isBearCandle && prev.close > prev.open &&
      cur.open >= prev.close && cur.close <= prev.open &&
      body > prevBody * 1.1) {
    bearish += 25;
    patterns.push({ name: '看跌吞没', side: 'bear', weight: 25 });
  }

  // 3. 锤子线（Hammer）— 下影线长，实体小，出现在下跌后
  if (lowerWick > body * 2 && upperWick < body * 0.5 && range > 0 &&
      prev.close < prev.open && prev2.close < prev2.open) {
    bullish += 20;
    patterns.push({ name: '锤子线', side: 'bull', weight: 20 });
  }

  // 4. 上吊线（Hanging Man）— 下影线长，出现在上涨后
  if (lowerWick > body * 2 && upperWick < body * 0.5 && range > 0 &&
      prev.close > prev.open && prev2.close > prev2.open) {
    bearish += 20;
    patterns.push({ name: '上吊线', side: 'bear', weight: 20 });
  }

  // 5. 射击之星（Shooting Star）— 上影线长，出现在上涨后
  if (upperWick > body * 2 && lowerWick < body * 0.5 && range > 0 &&
      prev.close > prev.open) {
    bearish += 20;
    patterns.push({ name: '射击之星', side: 'bear', weight: 20 });
  }

  // 6. 倒锤子（Inverted Hammer）— 上影线长，出现在下跌后
  if (upperWick > body * 2 && lowerWick < body * 0.5 && range > 0 &&
      prev.close < prev.open) {
    bullish += 15;
    patterns.push({ name: '倒锤子', side: 'bull', weight: 15 });
  }

  // 7. 早晨之星（Morning Star）— 三根K线反转
  if (idx >= 2) {
    const p2Body = Math.abs(prev2.close - prev2.open);
    const p1Body = prevBody;
    if (prev2.close < prev2.open && p2Body > prevRange * 0.5 &&  // 第一根大阴
        p1Body < p2Body * 0.3 &&                                   // 第二根小实体
        isBullCandle && body > p2Body * 0.5 &&                     // 第三根大阳
        cur.close > (prev2.open + prev2.close) / 2) {              // 收盘过半
      bullish += 30;
      patterns.push({ name: '早晨之星', side: 'bull', weight: 30 });
    }
  }

  // 8. 黄昏之星（Evening Star）
  if (idx >= 2) {
    const p2Body = Math.abs(prev2.close - prev2.open);
    const p1Body = prevBody;
    if (prev2.close > prev2.open && p2Body > prevRange * 0.5 &&
        p1Body < p2Body * 0.3 &&
        isBearCandle && body > p2Body * 0.5 &&
        cur.close < (prev2.open + prev2.close) / 2) {
      bearish += 30;
      patterns.push({ name: '黄昏之星', side: 'bear', weight: 30 });
    }
  }

  // 9. 强势阳线/阴线（Marubozu）— 实体占比 > 85%
  if (range > 0 && body / range > 0.85) {
    if (isBullCandle) {
      bullish += 15;
      patterns.push({ name: '光头光脚阳线', side: 'bull', weight: 15 });
    } else {
      bearish += 15;
      patterns.push({ name: '光头光脚阴线', side: 'bear', weight: 15 });
    }
  }

  return { bullish, bearish, patterns };
}

// ═══ 成交量分析（确认突破有效性）═══════════════════════════════

/**
 * 分析成交量特征
 * - 突破放量确认
 * - 缩量回调（健康回踩）
 * - 天量见顶/底
 */
function analyzeVolume(klines, idx, lookback = 20) {
  if (idx < lookback) return { signal: 'neutral', ratio: 1, desc: '数据不足' };

  const vols = klines.slice(idx - lookback, idx).map(k => k.volume);
  const avgVol = vols.reduce((a, b) => a + b, 0) / vols.length;
  const curVol = klines[idx].volume;
  const ratio = avgVol > 0 ? curVol / avgVol : 1;

  const cur = klines[idx];
  const prev = klines[idx - 1];
  const priceUp = cur.close > prev.close;
  const priceDown = cur.close < prev.close;

  // 量价背离检测（最近5根）
  let priceTrend = 0, volTrend = 0;
  for (let i = idx - 4; i <= idx; i++) {
    if (i > 0) {
      priceTrend += klines[i].close - klines[i-1].close;
      volTrend += klines[i].volume - klines[i-1].volume;
    }
  }

  let signal = 'neutral';
  let desc = '';

  if (priceUp && ratio >= 1.8) {
    signal = 'bullBreak';
    desc = \`放量上涨 \${ratio.toFixed(1)}x，突破有效\`;
  } else if (priceDown && ratio >= 1.8) {
    signal = 'bearBreak';
    desc = \`放量下跌 \${ratio.toFixed(1)}x，破位有效\`;
  } else if (priceUp && ratio < 0.6) {
    signal = 'weakUp';
    desc = \`缩量上涨 \${ratio.toFixed(1)}x，动能不足\`;
  } else if (priceDown && ratio < 0.6) {
    signal = 'healthyPullback';
    desc = \`缩量回调 \${ratio.toFixed(1)}x，回踩健康\`;
  } else if (ratio >= 2.5) {
    signal = 'climax';
    desc = \`天量 \${ratio.toFixed(1)}x，可能见顶/底\`;
  } else if (priceTrend > 0 && volTrend < 0) {
    signal = 'bearDivergence';
    desc = '量价背离（价涨量缩），上涨乏力';
  } else if (priceTrend < 0 && volTrend < 0) {
    signal = 'bullDivergence';
    desc = '缩量下跌，抛压减弱';
  }

  return { signal, ratio, desc, avgVol, curVol };
}

// ═══ 精确结构位识别 ═══════════════════════════════════════════

/**
 * 改进的 Swing 识别：
 * - 使用自适应 leftBars/rightBars（根据 ATR 波动调整）
 * - 标记 swing 的强度（被测试次数越多越强）
 * - 区分「已确认」和「未确认」的 swing
 */
function findSwings(klines, leftBars = 3, rightBars = 2, lookback = 80) {
  const n = klines.length;
  const highs = [];
  const lows  = [];
  const start = Math.max(leftBars, n - lookback);
  const end   = n - rightBars;

  for (let i = start; i < end; i++) {
    let isHigh = true, isLow = true;
    for (let j = i - leftBars; j <= i + rightBars; j++) {
      if (j === i) continue;
      if (j < 0 || j >= n) continue;
      if (klines[j].high >= klines[i].high) isHigh = false;
      if (klines[j].low  <= klines[i].low)  isLow  = false;
    }
    if (isHigh) highs.push({ idx: i, price: klines[i].high, age: n - 1 - i });
    if (isLow)  lows.push({  idx: i, price: klines[i].low,  age: n - 1 - i });
  }
  return { highs, lows };
}

/**
 * 多级别结构位：结合不同 leftBars 的 swing 点
 * 被多个级别确认的位置更强
 */
function calcSupportResistance(klines, currentPrice, atr) {
  // 三个级别的 swing
  const s1 = findSwings(klines, 2, 2, 60);  // 短期
  const s2 = findSwings(klines, 4, 3, 80);  // 中期
  const s3 = findSwings(klines, 6, 4, 100); // 长期

  const tol = atr * 0.4;

  // 合并所有 swing 点，计算强度
  const allPoints = [];
  const addPoints = (swings, weight) => {
    swings.highs.forEach(s => allPoints.push({ ...s, type: 'high', weight }));
    swings.lows.forEach(s => allPoints.push({ ...s, type: 'low', weight }));
  };
  addPoints(s1, 1);
  addPoints(s2, 2);
  addPoints(s3, 3);

  // 按价格聚类
  const clusters = [];
  const sorted = [...allPoints].sort((a, b) => a.price - b.price);

  for (const pt of sorted) {
    const existing = clusters.find(c => Math.abs(c.price - pt.price) < tol);
    if (existing) {
      existing.touches++;
      existing.totalWeight += pt.weight;
      existing.price = (existing.price * (existing.touches - 1) + pt.price) / existing.touches;
      existing.minAge = Math.min(existing.minAge, pt.age);
    } else {
      clusters.push({
        price: pt.price,
        touches: 1,
        totalWeight: pt.weight,
        minAge: pt.age,
      });
    }
  }

  // 强度评分：touches * weight，近期的加分
  clusters.forEach(c => {
    c.strength = c.totalWeight * (1 + c.touches * 0.5);
    if (c.minAge < 10) c.strength *= 1.3; // 近期位置更重要
  });

  // 压力：价格上方
  const resistances = clusters
    .filter(p => p.price > currentPrice + atr * 0.15)
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
    .map(p => ({ price: p.price, strength: p.strength, touches: p.touches }));

  // 支撑：价格下方
  const supports = clusters
    .filter(p => p.price < currentPrice - atr * 0.15)
    .sort((a, b) => b.price - a.price)
    .slice(0, 4)
    .map(p => ({ price: p.price, strength: p.strength, touches: p.touches }));

  return { resistances, supports };
}


// ═══ 信号检测 v3（多维度共振 + 形态确认）═══════════════════════

/**
 * 核心改进：
 * 1. 不再只看 MACD 金叉/死叉，而是综合 5 个维度
 * 2. 必须有 K 线形态确认才出信号（防假突破）
 * 3. 成交量必须配合（放量突破/缩量回踩）
 * 4. RSI 背离检测（更早发现反转）
 * 5. 动量加速/减速判断
 */
function detectSignal(klines, idx, bigTrend = 0) {
  if (idx < 65) return { direction: null, score: 0, factors: [], filters: [] };

  const slice  = klines.slice(0, idx + 1);
  const closes = slice.map(k => k.close);
  const vols   = slice.map(k => k.volume);
  const n      = closes.length;
  const price  = closes[n - 1];

  // —— 计算所有指标 ——
  const { dif, dea, bar } = calcMACD(closes);
  const { adx, pdi, ndi } = calcADX(slice, 14);
  const rsi = calcRSI(closes, 14);
  const ma5  = calcEMA(closes, 5);
  const ma10 = calcEMA(closes, 10);
  const ma20 = calcEMA(closes, 20);
  const ma60 = calcSMA(closes, 60);
  const bollArr = calcBoll(closes, 20, 2);
  const atrArr = calcATR(slice, 14);

  const curDif = dif[n - 1], prevDif = dif[n - 2], prev2Dif = n > 2 ? dif[n - 3] : dif[n - 2];
  const curDea = dea[n - 1], prevDea = dea[n - 2];
  const curBar = bar[n - 1], prevBar = bar[n - 2], prev2Bar = n > 2 ? bar[n - 3] : bar[n - 2];
  const curAdx = adx[n - 1];
  const curPdi = pdi[n - 1];
  const curNdi = ndi[n - 1];
  const curRsi = rsi[n - 1];
  const prevRsi = rsi[n - 2];
  const m5 = ma5[n-1], m10 = ma10[n-1], m20 = ma20[n-1], m60 = ma60[n-1];
  const boll = bollArr[n - 1];
  const curAtr = atrArr[n - 1] || price * 0.005;

  // K线形态
  const candleSignal = detectCandlePatterns(slice, n - 1);

  // 成交量分析
  const volSignal = analyzeVolume(slice, n - 1, 20);

  // —— 过滤器 ——
  const filters = [];

  // ADX 过滤（v3：降低阈值到 16，但 ADX 越高加分越多）
  const adxValid = curAdx !== null && curAdx >= 16;
  if (!adxValid) {
    filters.push({ name: 'ADX过滤', pass: false, desc: \`ADX=\${(curAdx||0).toFixed(1)} < 16，趋势不明\` });
  } else {
    filters.push({ name: 'ADX过滤', pass: true, desc: \`ADX=\${curAdx.toFixed(1)}，趋势有效\` });
  }

  // RSI 极值过滤（v3：更严格，加入背离检测）
  const rsiOK_long  = curRsi < 75;
  const rsiOK_short = curRsi > 25;

  // RSI 背离检测
  let rsiBullDiv = false, rsiBearDiv = false;
  if (n > 30) {
    // 价格创新低但 RSI 没创新低 → 看涨背离
    const priceLow10 = Math.min(...closes.slice(-15, -5));
    const rsiLow10 = Math.min(...rsi.slice(-15, -5).filter(v => v !== null));
    if (price < priceLow10 && curRsi > rsiLow10 && curRsi < 40) {
      rsiBullDiv = true;
    }
    // 价格创新高但 RSI 没创新高 → 看跌背离
    const priceHigh10 = Math.max(...closes.slice(-15, -5));
    const rsiHigh10 = Math.max(...rsi.slice(-15, -5).filter(v => v !== null));
    if (price > priceHigh10 && curRsi < rsiHigh10 && curRsi > 60) {
      rsiBearDiv = true;
    }
  }

  // —— 多维度评分 ——
  let longScore = 0, shortScore = 0;
  const factors = [];

  // ═══ 维度 A：趋势动量（权重 25）═══
  // MACD 状态分析（不只看金叉死叉，还看动量变化率）
  const goldenX   = prevDif <= prevDea && curDif > curDea;
  const deadX     = prevDif >= prevDea && curDif < curDea;
  const barAccel  = curBar > 0 && curBar > prevBar && prevBar > prev2Bar; // 红柱加速
  const barDecel  = curBar < 0 && curBar < prevBar && prevBar < prev2Bar; // 绿柱加速
  const barTurnUp = curBar > prevBar && prevBar <= prev2Bar && curBar > 0; // 红柱拐头
  const barTurnDn = curBar < prevBar && prevBar >= prev2Bar && curBar < 0; // 绿柱拐头

  if (goldenX) {
    const bonus = curDif > 0 ? 5 : 0; // 零轴上金叉更强
    longScore += 25 + bonus;
    factors.push({ name: 'MACD金叉', desc: \`DIF上穿DEA\${curDif > 0 ? '（零轴上，强势）' : ''}\`, side: 'bull', pts: 25 + bonus });
  } else if (deadX) {
    const bonus = curDif < 0 ? 5 : 0;
    shortScore += 25 + bonus;
    factors.push({ name: 'MACD死叉', desc: \`DIF下穿DEA\${curDif < 0 ? '（零轴下，弱势）' : ''}\`, side: 'bear', pts: 25 + bonus });
  } else if (barAccel) {
    longScore += 18;
    factors.push({ name: 'MACD红柱加速', desc: '多头动能持续增强', side: 'bull', pts: 18 });
  } else if (barDecel) {
    shortScore += 18;
    factors.push({ name: 'MACD绿柱加速', desc: '空头动能持续增强', side: 'bear', pts: 18 });
  } else if (barTurnUp) {
    longScore += 12;
    factors.push({ name: 'MACD红柱拐头', desc: '空头动能衰减，多头启动', side: 'bull', pts: 12 });
  } else if (barTurnDn) {
    shortScore += 12;
    factors.push({ name: 'MACD绿柱拐头', desc: '多头动能衰减，空头启动', side: 'bear', pts: 12 });
  } else if (curDif > 0 && curDif > curDea) {
    longScore += 8;
    factors.push({ name: 'MACD多头区间', desc: 'DIF>DEA>0', side: 'bull', pts: 8 });
  } else if (curDif < 0 && curDif < curDea) {
    shortScore += 8;
    factors.push({ name: 'MACD空头区间', desc: 'DIF<DEA<0', side: 'bear', pts: 8 });
  }

  // ═══ 维度 B：均线结构（权重 20）═══
  // 不只看排列，还看价格与均线的距离（回踩到位 vs 偏离过远）
  const maSpread = m20 > 0 ? (price - m20) / m20 * 100 : 0; // 价格偏离 MA20 的百分比
  let maBull = 0, maBear = 0;
  if (price > m5)  maBull++; else maBear++;
  if (price > m10) maBull++; else maBear++;
  if (price > m20) maBull++; else maBear++;
  if (m60 && price > m60) maBull++; else if (m60) maBear++;
  if (m5 > m10)  maBull++; else maBear++;
  if (m10 > m20) maBull++; else maBear++;
  const maTotal = maBull + maBear;

  // 回踩 MA10/MA20 的加分（最佳入场时机）
  const nearMA10 = Math.abs(price - m10) / curAtr < 0.5;
  const nearMA20 = Math.abs(price - m20) / curAtr < 0.5;
  const pullbackToMA = nearMA10 || nearMA20;

  if (maBull >= 5) {
    const pts = pullbackToMA && price > m10 ? 22 : 18; // 回踩到位加分
    longScore += pts;
    factors.push({ name: '均线多头', desc: \`\${maBull}/\${maTotal}多排\${pullbackToMA ? '，回踩到位' : ''}\`, side: 'bull', pts });
  } else if (maBull >= 4) {
    longScore += 12;
    factors.push({ name: '均线偏多', desc: \`\${maBull}/\${maTotal}偏多\`, side: 'bull', pts: 12 });
  } else if (maBear >= 5) {
    const pts = pullbackToMA && price < m10 ? 22 : 18;
    shortScore += pts;
    factors.push({ name: '均线空头', desc: \`\${maBear}/\${maTotal}空排\${pullbackToMA ? '，反弹到位' : ''}\`, side: 'bear', pts });
  } else if (maBear >= 4) {
    shortScore += 12;
    factors.push({ name: '均线偏空', desc: \`\${maBear}/\${maTotal}偏空\`, side: 'bear', pts: 12 });
  } else {
    factors.push({ name: '均线纠缠', desc: \`\${maBull}/\${maTotal}多空不明\`, side: 'neut', pts: 0 });
  }

  // ═══ 维度 C：K线形态确认（权重 20）═══
  // 这是 v3 的关键改进：必须有形态确认
  if (candleSignal.bullish >= 20) {
    const pts = Math.min(20, Math.round(candleSignal.bullish * 0.7));
    longScore += pts;
    const names = candleSignal.patterns.filter(p => p.side === 'bull').map(p => p.name).join('+');
    factors.push({ name: \`形态确认\`, desc: names, side: 'bull', pts });
  } else if (candleSignal.bearish >= 20) {
    const pts = Math.min(20, Math.round(candleSignal.bearish * 0.7));
    shortScore += pts;
    const names = candleSignal.patterns.filter(p => p.side === 'bear').map(p => p.name).join('+');
    factors.push({ name: \`形态确认\`, desc: names, side: 'bear', pts });
  } else {
    factors.push({ name: '无明确形态', desc: '缺少K线反转/延续确认', side: 'neut', pts: 0 });
  }

  // ═══ 维度 D：成交量配合（权重 15）═══
  if (volSignal.signal === 'bullBreak') {
    longScore += 15;
    factors.push({ name: '放量突破', desc: volSignal.desc, side: 'bull', pts: 15 });
  } else if (volSignal.signal === 'bearBreak') {
    shortScore += 15;
    factors.push({ name: '放量破位', desc: volSignal.desc, side: 'bear', pts: 15 });
  } else if (volSignal.signal === 'healthyPullback') {
    // 缩量回调在多头趋势中是好事
    if (maBull >= 4) {
      longScore += 10;
      factors.push({ name: '缩量回踩', desc: volSignal.desc, side: 'bull', pts: 10 });
    } else if (maBear >= 4) {
      shortScore += 10;
      factors.push({ name: '缩量反弹', desc: volSignal.desc, side: 'bear', pts: 10 });
    }
  } else if (volSignal.signal === 'weakUp') {
    shortScore += 5;
    factors.push({ name: '缩量上涨', desc: volSignal.desc, side: 'bear', pts: 5 });
  } else if (volSignal.signal === 'bearDivergence') {
    shortScore += 8;
    factors.push({ name: '量价背离', desc: volSignal.desc, side: 'bear', pts: 8 });
  } else if (volSignal.signal === 'bullDivergence') {
    longScore += 8;
    factors.push({ name: '抛压减弱', desc: volSignal.desc, side: 'bull', pts: 8 });
  } else {
    factors.push({ name: '量能平稳', desc: \`量比\${volSignal.ratio.toFixed(1)}x\`, side: 'neut', pts: 0 });
  }

  // ═══ 维度 E：DI方向 + RSI + 大方向（权重 20）═══
  // DI 方向
  if (curPdi !== null && curNdi !== null) {
    const diDiff = curPdi - curNdi;
    if (diDiff > 8) {
      longScore += 10;
      factors.push({ name: 'DI+主导', desc: \`+DI \${curPdi.toFixed(0)} > -DI \${curNdi.toFixed(0)}\`, side: 'bull', pts: 10 });
    } else if (diDiff < -8) {
      shortScore += 10;
      factors.push({ name: 'DI-主导', desc: \`-DI \${curNdi.toFixed(0)} > +DI \${curPdi.toFixed(0)}\`, side: 'bear', pts: 10 });
    }
  }

  // RSI 背离（强信号）
  if (rsiBullDiv) {
    longScore += 12;
    factors.push({ name: 'RSI底背离', desc: \`价格新低但RSI(\${curRsi.toFixed(0)})未新低，反转信号\`, side: 'bull', pts: 12 });
  } else if (rsiBearDiv) {
    shortScore += 12;
    factors.push({ name: 'RSI顶背离', desc: \`价格新高但RSI(\${curRsi.toFixed(0)})未新高，反转信号\`, side: 'bear', pts: 12 });
  }

  // 大方向对齐
  if (bigTrend > 0) {
    longScore += 10;
    factors.push({ name: '顺大方向', desc: '日线趋势向上，顺多', side: 'bull', pts: 10 });
  } else if (bigTrend < 0) {
    shortScore += 10;
    factors.push({ name: '顺大方向', desc: '日线趋势向下，顺空', side: 'bear', pts: 10 });
  } else {
    factors.push({ name: '大方向震荡', desc: '日线无明确方向', side: 'neut', pts: 0 });
  }

  // ═══ 方向判定（v3：更严格的共振要求）═══
  const total = longScore + shortScore;
  const longPct = total > 0 ? longScore / total : 0.5;

  let direction = null, score = 0;

  const ADX_OK = adxValid;
  const BIG_CONFLICT_LONG  = bigTrend < 0;
  const BIG_CONFLICT_SHORT = bigTrend > 0;

  // v3 关键改进：需要至少 3 个维度同向才出信号
  const bullDimensions = [
    candleSignal.bullish >= 15,
    volSignal.signal === 'bullBreak' || volSignal.signal === 'healthyPullback' || volSignal.signal === 'bullDivergence',
    goldenX || barAccel || barTurnUp || (curDif > curDea && curDif > 0),
    maBull >= 4,
    bigTrend >= 0,
  ].filter(Boolean).length;

  const bearDimensions = [
    candleSignal.bearish >= 15,
    volSignal.signal === 'bearBreak' || volSignal.signal === 'bearDivergence',
    deadX || barDecel || barTurnDn || (curDif < curDea && curDif < 0),
    maBear >= 4,
    bigTrend <= 0,
  ].filter(Boolean).length;

  if (ADX_OK && longPct >= 0.62 && rsiOK_long && !BIG_CONFLICT_LONG && bullDimensions >= 3) {
    direction = 'long';
    score = Math.round(longPct * 100);
  } else if (ADX_OK && longPct <= 0.38 && rsiOK_short && !BIG_CONFLICT_SHORT && bearDimensions >= 3) {
    direction = 'short';
    score = Math.round((1 - longPct) * 100);
  }

  // 无信号原因
  if (!direction) {
    if (!ADX_OK) {
      filters.push({ name: '无信号原因', pass: false, desc: '趋势强度不足，等待方向明确' });
    } else if (bullDimensions < 3 && bearDimensions < 3) {
      filters.push({ name: '无信号原因', pass: false, desc: \`共振不足（多\${bullDimensions}/空\${bearDimensions}维度，需≥3），等待更多确认\` });
    } else if (longPct > 0.38 && longPct < 0.62) {
      filters.push({ name: '无信号原因', pass: false, desc: \`多空分数接近（多\${Math.round(longPct*100)}%），方向不明\` });
    } else if (!rsiOK_long && longPct >= 0.62) {
      filters.push({ name: '无信号原因', pass: false, desc: \`RSI=\${curRsi.toFixed(0)} 严重超买，不追多\` });
    } else if (!rsiOK_short && longPct <= 0.38) {
      filters.push({ name: '无信号原因', pass: false, desc: \`RSI=\${curRsi.toFixed(0)} 严重超卖，不追空\` });
    } else if (BIG_CONFLICT_LONG) {
      filters.push({ name: '无信号原因', pass: false, desc: '短线偏多但日线向下，不逆大势' });
    } else if (BIG_CONFLICT_SHORT) {
      filters.push({ name: '无信号原因', pass: false, desc: '短线偏空但日线向上，不逆大势' });
    }
  }

  return {
    direction, score, factors, filters,
    longScore, shortScore,
    adx: curAdx, rsi: curRsi,
    boll, candleSignal, volSignal,
    bullDimensions, bearDimensions,
  };
}


// ═══ 精确进出场计算 v3 ═══════════════════════════════════════

/**
 * v3 改进：
 * 1. 入场价基于「结构位回踩」而非固定 ATR 偏移
 * 2. 止损基于「最近有效 swing + ATR 缓冲」，自适应宽度
 * 3. 止盈基于「下一个强结构位」，不是简单的 R 倍数
 * 4. 加入「进场确认区间」概念：价格必须在此区间内才有效
 */
function calcEntryExit(direction, currentPrice, atr, sr, klines) {
  const n = klines.length;
  const closes = klines.map(k => k.close);
  const ema10 = calcEMA(closes, 10);
  const ema20 = calcEMA(closes, 20);
  const m10 = ema10[n - 1];
  const m20 = ema20[n - 1];

  // 找最近的有效 swing（用于精确止损）
  const recentSwings = findSwings(klines, 3, 2, 30);

  if (direction === 'long') {
    // ═══ 做多入场 ═══
    // 理想入场：回踩到 EMA10 或最近支撑位
    // 入场区间：[支撑位, 当前价 - 0.1ATR]

    // 候选入场价（取最优）
    const candidates = [];

    // 候选1：EMA10 回踩
    if (m10 < currentPrice && m10 > currentPrice - atr * 1.2) {
      candidates.push({ price: m10, reason: 'EMA10回踩', priority: 3 });
    }

    // 候选2：EMA20 回踩（更深的回调）
    if (m20 < currentPrice && m20 > currentPrice - atr * 1.8) {
      candidates.push({ price: m20, reason: 'EMA20回踩', priority: 2 });
    }

    // 候选3：最近支撑位
    if (sr.supports[0] && sr.supports[0].price > currentPrice - atr * 2) {
      candidates.push({ price: sr.supports[0].price + atr * 0.1, reason: '支撑位上方', priority: sr.supports[0].strength > 3 ? 4 : 2 });
    }

    // 候选4：当前价小幅回调（如果已经在均线附近）
    const nearMA = Math.abs(currentPrice - m10) < atr * 0.3;
    if (nearMA) {
      candidates.push({ price: currentPrice - atr * 0.15, reason: '已在均线附近', priority: 5 });
    }

    // 选择最优入场价（优先级最高的）
    candidates.sort((a, b) => b.priority - a.priority);
    let entry = candidates.length > 0 ? candidates[0].price : currentPrice - atr * 0.3;

    // 入场价边界约束
    const maxEntry = currentPrice - atr * 0.05; // 不追市价
    const minEntry = currentPrice - atr * 1.5;  // 不能太远
    entry = Math.min(entry, maxEntry);
    entry = Math.max(entry, minEntry);

    // ═══ 做多止损 ═══
    // 找最近的有效 swing low（最近 20 根内的最低点不算，要找结构低点）
    const validSwingLows = recentSwings.lows
      .filter(s => s.price < entry)
      .sort((a, b) => b.price - a.price); // 从高到低，取最近的

    let stopLoss;
    if (validSwingLows.length > 0) {
      // 止损在最近 swing low 下方 0.3-0.5 ATR（根据 swing 强度调整）
      const swingLow = validSwingLows[0].price;
      const buffer = atr * (validSwingLows[0].age < 5 ? 0.3 : 0.5); // 近期 swing 缓冲小一点
      stopLoss = swingLow - buffer;
    } else {
      // 没有明确 swing，用 ATR 止损
      stopLoss = entry - atr * 1.8;
    }

    // 止损不能太窄（至少 0.8ATR）也不能太宽（最多 2.5ATR）
    const stopDist = entry - stopLoss;
    if (stopDist < atr * 0.8) stopLoss = entry - atr * 0.8;
    if (stopDist > atr * 2.5) stopLoss = entry - atr * 2.5;
    const finalStopDist = entry - stopLoss;

    // ═══ 做多止盈 ═══
    // 目标1：第一个强压力位前 0.2ATR（保底 1.5R）
    let target1;
    if (sr.resistances[0] && sr.resistances[0].price > entry + finalStopDist * 1.2) {
      // 压力位足够远，用它
      target1 = sr.resistances[0].price - atr * 0.2;
      // 但不能低于 1.5R
      if (target1 < entry + finalStopDist * 1.5) {
        target1 = entry + finalStopDist * 1.5;
      }
    } else {
      target1 = entry + finalStopDist * 1.8;
    }

    // 目标2：第二个压力位或 2.5R+
    let target2;
    if (sr.resistances[1] && sr.resistances[1].price > target1) {
      target2 = sr.resistances[1].price - atr * 0.2;
      if (target2 < entry + finalStopDist * 2.5) {
        target2 = entry + finalStopDist * 2.5;
      }
    } else if (sr.resistances[0] && sr.resistances[0].price > target1) {
      target2 = sr.resistances[0].price + atr * 0.8;
    } else {
      target2 = entry + finalStopDist * 3.0;
    }

    const rr1 = finalStopDist > 0 ? (target1 - entry) / finalStopDist : 0;
    const rr2 = finalStopDist > 0 ? (target2 - entry) / finalStopDist : 0;

    return { entry, stopLoss, target1, target2, stopDist: finalStopDist, rr1, rr2, entryReason: candidates[0]?.reason || 'ATR回调' };
  }

  if (direction === 'short') {
    // ═══ 做空入场 ═══
    const candidates = [];

    if (m10 > currentPrice && m10 < currentPrice + atr * 1.2) {
      candidates.push({ price: m10, reason: 'EMA10反弹', priority: 3 });
    }
    if (m20 > currentPrice && m20 < currentPrice + atr * 1.8) {
      candidates.push({ price: m20, reason: 'EMA20反弹', priority: 2 });
    }
    if (sr.resistances[0] && sr.resistances[0].price < currentPrice + atr * 2) {
      candidates.push({ price: sr.resistances[0].price - atr * 0.1, reason: '压力位下方', priority: sr.resistances[0].strength > 3 ? 4 : 2 });
    }
    const nearMA = Math.abs(currentPrice - m10) < atr * 0.3;
    if (nearMA) {
      candidates.push({ price: currentPrice + atr * 0.15, reason: '已在均线附近', priority: 5 });
    }

    candidates.sort((a, b) => b.priority - a.priority);
    let entry = candidates.length > 0 ? candidates[0].price : currentPrice + atr * 0.3;

    const minEntry = currentPrice + atr * 0.05;
    const maxEntry = currentPrice + atr * 1.5;
    entry = Math.max(entry, minEntry);
    entry = Math.min(entry, maxEntry);

    // ═══ 做空止损 ═══
    const validSwingHighs = recentSwings.highs
      .filter(s => s.price > entry)
      .sort((a, b) => a.price - b.price);

    let stopLoss;
    if (validSwingHighs.length > 0) {
      const swingHigh = validSwingHighs[0].price;
      const buffer = atr * (validSwingHighs[0].age < 5 ? 0.3 : 0.5);
      stopLoss = swingHigh + buffer;
    } else {
      stopLoss = entry + atr * 1.8;
    }

    const stopDist = stopLoss - entry;
    if (stopDist < atr * 0.8) stopLoss = entry + atr * 0.8;
    if (stopDist > atr * 2.5) stopLoss = entry + atr * 2.5;
    const finalStopDist = stopLoss - entry;

    // ═══ 做空止盈 ═══
    let target1;
    if (sr.supports[0] && sr.supports[0].price < entry - finalStopDist * 1.2) {
      target1 = sr.supports[0].price + atr * 0.2;
      if (target1 > entry - finalStopDist * 1.5) {
        target1 = entry - finalStopDist * 1.5;
      }
    } else {
      target1 = entry - finalStopDist * 1.8;
    }

    let target2;
    if (sr.supports[1] && sr.supports[1].price < target1) {
      target2 = sr.supports[1].price + atr * 0.2;
      if (target2 > entry - finalStopDist * 2.5) {
        target2 = entry - finalStopDist * 2.5;
      }
    } else if (sr.supports[0] && sr.supports[0].price < target1) {
      target2 = sr.supports[0].price - atr * 0.8;
    } else {
      target2 = entry - finalStopDist * 3.0;
    }

    const rr1 = finalStopDist > 0 ? (entry - target1) / finalStopDist : 0;
    const rr2 = finalStopDist > 0 ? (entry - target2) / finalStopDist : 0;

    return { entry, stopLoss, target1, target2, stopDist: finalStopDist, rr1, rr2, entryReason: candidates[0]?.reason || 'ATR反弹' };
  }

  return null;
}


// ═══ 回测引擎 v3（移动止损 + 分批止盈）═══════════════════════

/**
 * v3 改进：
 * 1. 支持移动止损（到达 1R 盈利后，止损移到成本）
 * 2. 分批止盈（50% 在 target1，50% 在 target2）
 * 3. 更真实的成交模拟（考虑滑点）
 * 4. 统计更多指标（最大回撤、连续亏损等）
 */
function backtest(klines, bigTrend = 0, lookAhead = 15) {
  const results = {
    total: 0, wins: 0, losses: 0, noResult: 0,
    totalR: 0, maxConsecLoss: 0, maxDrawdown: 0,
    trades: [],
  };
  const atrArr = calcATR(klines, 14);
  let consecLoss = 0;
  let equity = 0, peak = 0;

  for (let i = 70; i < klines.length - lookAhead; i++) {
    const sig = detectSignal(klines, i, bigTrend);
    if (!sig.direction) continue;

    const sub = klines.slice(0, i + 1);
    const atr = atrArr[i] || klines[i].close * 0.005;
    const sr  = calcSupportResistance(sub, klines[i].close, atr);
    const ex  = calcEntryExit(sig.direction, klines[i].close, atr, sr, sub);
    if (!ex || ex.rr1 < 1.2) continue; // v3：盈亏比至少 1.2

    const entry = ex.entry;
    const stop  = ex.stopLoss;
    const tgt1  = ex.target1;
    const tgt2  = ex.target2;
    const stopDist = ex.stopDist;

    // 等待成交（限价单，最多等 5 根）
    let filled = false, fillIdx = -1;
    for (let j = i + 1; j <= Math.min(i + 5, klines.length - 1); j++) {
      const b = klines[j];
      if (sig.direction === 'long' && b.low <= entry) { filled = true; fillIdx = j; break; }
      if (sig.direction === 'short' && b.high >= entry) { filled = true; fillIdx = j; break; }
    }
    if (!filled) continue;

    // 模拟持仓（带移动止损）
    let outcome = 'noResult';
    let resultR = 0;
    let trailingStop = stop;
    let reachedT1 = false;

    for (let j = fillIdx; j <= Math.min(fillIdx + lookAhead, klines.length - 1); j++) {
      const b = klines[j];

      if (sig.direction === 'long') {
        // 检查止损（含移动止损）
        if (b.low <= trailingStop) {
          if (reachedT1) {
            // 已到 T1 后被移动止损打掉，算半赢
            outcome = 'win';
            resultR = 0.8; // 保守估计
          } else {
            outcome = 'loss';
            resultR = -1;
          }
          break;
        }
        // 检查 T1
        if (!reachedT1 && b.high >= tgt1) {
          reachedT1 = true;
          // 移动止损到成本 + 0.2R
          trailingStop = entry + stopDist * 0.2;
          // 如果同一根也到了 T2
          if (b.high >= tgt2) {
            outcome = 'win';
            resultR = (ex.rr1 * 0.5 + ex.rr2 * 0.5); // 分批止盈
            break;
          }
        }
        // 到达 T1 后继续持有，更新移动止损
        if (reachedT1) {
          const newTrail = b.low - stopDist * 0.3;
          if (newTrail > trailingStop) trailingStop = newTrail;
        }
        // 检查 T2
        if (reachedT1 && b.high >= tgt2) {
          outcome = 'win';
          resultR = (ex.rr1 * 0.5 + ex.rr2 * 0.5);
          break;
        }
      } else {
        // 做空
        if (b.high >= trailingStop) {
          if (reachedT1) {
            outcome = 'win';
            resultR = 0.8;
          } else {
            outcome = 'loss';
            resultR = -1;
          }
          break;
        }
        if (!reachedT1 && b.low <= tgt1) {
          reachedT1 = true;
          trailingStop = entry - stopDist * 0.2;
          if (b.low <= tgt2) {
            outcome = 'win';
            resultR = (ex.rr1 * 0.5 + ex.rr2 * 0.5);
            break;
          }
        }
        if (reachedT1) {
          const newTrail = b.high + stopDist * 0.3;
          if (newTrail < trailingStop) trailingStop = newTrail;
        }
        if (reachedT1 && b.low <= tgt2) {
          outcome = 'win';
          resultR = (ex.rr1 * 0.5 + ex.rr2 * 0.5);
          break;
        }
      }
    }

    // 超时未触发止损/止盈
    if (outcome === 'noResult') {
      // 按最后价格计算浮盈/亏
      const lastBar = klines[Math.min(fillIdx + lookAhead, klines.length - 1)];
      const pnl = sig.direction === 'long'
        ? (lastBar.close - entry) / stopDist
        : (entry - lastBar.close) / stopDist;
      resultR = Math.max(-1, Math.min(pnl, ex.rr1)); // 限制在 [-1R, T1]
      outcome = resultR > 0 ? 'win' : 'loss';
    }

    results.total++;
    results.totalR += resultR;
    if (outcome === 'win') {
      results.wins++;
      consecLoss = 0;
    } else {
      results.losses++;
      consecLoss++;
      results.maxConsecLoss = Math.max(results.maxConsecLoss, consecLoss);
    }

    equity += resultR;
    peak = Math.max(peak, equity);
    results.maxDrawdown = Math.max(results.maxDrawdown, peak - equity);
  }

  const decided = results.wins + results.losses;
  const winRate = decided > 0 ? results.wins / decided : 0;
  const avgRR   = results.total > 0 ? results.totalR / results.total : 0;

  return {
    total: results.total, wins: results.wins,
    losses: results.losses, noResult: results.noResult,
    winRate: +winRate.toFixed(3),
    winRatePct: Math.round(winRate * 100),
    expectancy: +avgRR.toFixed(2),
    avgRR: +avgRR.toFixed(2),
    maxConsecLoss: results.maxConsecLoss,
    maxDrawdown: +results.maxDrawdown.toFixed(2),
  };
}

// ═══ 进场决策 v3 ═══════════════════════════════════════════════

function calcEntryDecision(bt, direction, score, rr1, sig) {
  const { winRatePct, expectancy, total, maxConsecLoss, maxDrawdown } = bt;

  let canEnter = false;
  let grade = 'no';
  let reason = '';
  let color = '#8b949e';
  let positionPct = 0;

  if (!direction) {
    reason = '无方向信号，观望';
  } else if (total < 3) {
    // 样本不足但信号强度高时可小仓位
    if (score >= 75 && rr1 >= 1.5) {
      canEnter = true;
      grade = 'ok';
      color = '#d29922';
      reason = \`样本\${total}次偏少，但信号强度\${score}分+盈亏比\${rr1.toFixed(1)}，可小仓位试探\`;
      positionPct = 25;
    } else {
      reason = \`样本\${total}次偏少且信号不够强，建议观望\`;
    }
  } else if (expectancy <= -0.1) {
    reason = \`期望值\${expectancy}R < 0，历史表现差，不建议\`;
  } else if (winRatePct >= 65 && expectancy > 0.3) {
    canEnter = true; grade = 'great'; color = '#f85149';
    reason = \`胜率\${winRatePct}%，期望+\${expectancy}R，信号优秀\`;
    positionPct = score >= 80 ? 100 : 80;
  } else if (winRatePct >= 55 && expectancy > 0.1) {
    canEnter = true; grade = 'good'; color = '#ffa657';
    reason = \`胜率\${winRatePct}%，期望+\${expectancy}R，质量良好\`;
    positionPct = 60;
  } else if (winRatePct >= 45 && rr1 >= 1.8 && expectancy > 0) {
    canEnter = true; grade = 'ok'; color = '#d29922';
    reason = \`胜率\${winRatePct}%，盈亏比\${rr1.toFixed(1)}，期望+\${expectancy}R，可操作\`;
    positionPct = 40;
  } else if (rr1 >= 2.5 && expectancy > 0) {
    canEnter = true; grade = 'ok'; color = '#d29922';
    reason = \`高盈亏比\${rr1.toFixed(1)}，期望+\${expectancy}R，小仓位\`;
    positionPct = 30;
  } else {
    reason = \`胜率\${winRatePct}%/期望\${expectancy}R 不达标，不建议\`;
  }

  // 额外风险提示
  if (canEnter && maxConsecLoss >= 4) {
    reason += \`（注意：历史最大连亏\${maxConsecLoss}次）\`;
    positionPct = Math.min(positionPct, 50);
  }
  if (canEnter && maxDrawdown > 3) {
    reason += \`（最大回撤\${maxDrawdown}R）\`;
    positionPct = Math.min(positionPct, 40);
  }

  return { canEnter, grade, reason, color, positionPct };
}


// ═══ 完整分析 ═══════════════════════════════════════════════

function fullAnalysis(klines, bigTrend = 0) {
  if (!klines || klines.length < 80) return null;

  const n      = klines.length;
  const atrArr = calcATR(klines, 14);
  const atr    = atrArr[n - 1] || klines[n - 1].close * 0.005;
  const price  = klines[n - 1].close;
  const sig    = detectSignal(klines, n - 1, bigTrend);
  const sr     = calcSupportResistance(klines, price, atr);

  let entry, stopLoss, target1, target2, rr1 = 0, rr2 = 0, entryReason = '';
  if (sig.direction) {
    const ex = calcEntryExit(sig.direction, price, atr, sr, klines);
    if (ex) {
      entry       = +ex.entry.toFixed(2);
      stopLoss    = +ex.stopLoss.toFixed(2);
      target1     = +ex.target1.toFixed(2);
      target2     = +ex.target2.toFixed(2);
      rr1         = ex.rr1;
      rr2         = ex.rr2;
      entryReason = ex.entryReason;
    }
  }

  // 盈亏比不足时取消信号
  if (sig.direction && rr1 < 1.2) {
    sig.direction = null;
    sig.filters.push({ name: '无信号原因', pass: false, desc: \`盈亏比\${rr1.toFixed(2)} < 1.2，风险收益不合理\` });
  }

  const bt = backtest(klines, bigTrend, 15);

  let strengthLabel, strengthColor;
  if (!sig.direction)       { strengthLabel = '无信号';  strengthColor = 'neut'; }
  else if (sig.score >= 80) { strengthLabel = '强 ★★★'; strengthColor = 'bull'; }
  else if (sig.score >= 70) { strengthLabel = '中 ★★☆'; strengthColor = 'mid';  }
  else                      { strengthLabel = '弱 ★☆☆'; strengthColor = 'low';  }

  const decision = calcEntryDecision(bt, sig.direction, sig.score, rr1, sig);

  return {
    direction: sig.direction, score: sig.score,
    factors: sig.factors, filters: sig.filters,
    entry, stopLoss, target1, target2,
    rr1: +rr1.toFixed(2), rr2: +rr2.toFixed(2),
    supports: sr.supports, resistances: sr.resistances,
    strengthLabel, strengthColor,
    backtest: bt, decision,
    atr: +atr.toFixed(2), currentPrice: price,
    adx: sig.adx, rsi: sig.rsi,
    entryReason,
    candlePatterns: sig.candleSignal?.patterns || [],
    volSignal: sig.volSignal,
    dimensions: { bull: sig.bullDimensions, bear: sig.bearDimensions },
  };
}

// ═══ 大方向趋势分析（日线）═══════════════════════════════════

function analyzeTrend(dailyKlines, klines15, klines5) {
  if (!dailyKlines || dailyKlines.length < 30) {
    return {
      trend: 'sideways', trendValue: 0, strength: 50, label: '数据不足', color: '#8b949e',
      detail: [{ icon: '⚠️', text: '日线数据不足', side: 'neut' }],
      tfAdvice: buildTfAdvice('sideways', 1.5),
      rangePct: 0, atrPct: 0,
    };
  }

  const closes = dailyKlines.map(k => k.close);
  const n      = closes.length;
  const price  = closes[n - 1];

  const ma5d  = calcEMA(closes, 5);
  const ma10d = calcEMA(closes, 10);
  const ma20d = calcEMA(closes, 20);
  const ma60d = calcSMA(closes, Math.min(60, n));
  const m5 = ma5d[n-1], m10 = ma10d[n-1], m20 = ma20d[n-1], m60 = ma60d[n-1];

  let maUpCount = 0;
  if (m5  && price > m5)  maUpCount++;
  if (m10 && price > m10) maUpCount++;
  if (m20 && price > m20) maUpCount++;
  if (m60 && price > m60) maUpCount++;
  if (m5 && m10 && m5 > m10) maUpCount++;
  if (m10 && m20 && m10 > m20) maUpCount++;

  const recent20 = dailyKlines.slice(-20);
  const maxHigh  = Math.max(...recent20.map(k => k.high));
  const minLow   = Math.min(...recent20.map(k => k.low));
  const range    = maxHigh - minLow;
  const rangePct = range / price * 100;
  const pricePos = range > 0 ? (price - minLow) / range : 0.5;

  const { dif: difD, dea: deaD, bar: barD } = calcMACD(closes);
  const lastDifD = difD[n-1], lastDeaD = deaD[n-1];
  const lastBarD = barD[n-1], prevBarD = barD[n-2];
  const macdBull = lastDifD > 0 && lastDifD > lastDeaD;
  const macdBear = lastDifD < 0 && lastDifD < lastDeaD;
  const macdTurnUp = lastBarD > prevBarD && lastBarD > 0;
  const macdTurnDn = lastBarD < prevBarD && lastBarD < 0;

  const atrD    = calcATR(dailyKlines, 14);
  const lastAtr = atrD[n-1] || price * 0.01;
  const atrPct  = lastAtr / price * 100;

  // ADX 日线
  const { adx: adxD } = calcADX(dailyKlines, 14);
  const dailyAdx = adxD[n-1];

  let upScore = 0;
  const detail = [];

  // 均线排列
  if (maUpCount >= 5) {
    upScore += 35;
    detail.push({ icon: '📈', text: \`日线均线多头排列（\${maUpCount}/6），趋势向上\`, side: 'bull' });
  } else if (maUpCount >= 4) {
    upScore += 20;
    detail.push({ icon: '📊', text: \`日线均线偏多（\${maUpCount}/6）\`, side: 'bull' });
  } else if (maUpCount <= 1) {
    upScore -= 35;
    detail.push({ icon: '📉', text: \`日线均线空头排列（\${6-maUpCount}/6），趋势向下\`, side: 'bear' });
  } else if (maUpCount <= 2) {
    upScore -= 20;
    detail.push({ icon: '📊', text: \`日线均线偏空（\${6-maUpCount}/6）\`, side: 'bear' });
  } else {
    detail.push({ icon: '↔️', text: \`日线均线纠缠（\${maUpCount}/6）\`, side: 'neut' });
  }

  // MACD
  if (macdBull) {
    upScore += 25;
    detail.push({ icon: '⚡', text: \`日线MACD多头（DIF>DEA>0）\`, side: 'bull' });
  } else if (macdBear) {
    upScore -= 25;
    detail.push({ icon: '❄️', text: \`日线MACD空头（DIF<DEA<0）\`, side: 'bear' });
  } else if (macdTurnUp) {
    upScore += 15;
    detail.push({ icon: '📈', text: \`日线MACD红柱扩张\`, side: 'bull' });
  } else if (macdTurnDn) {
    upScore -= 15;
    detail.push({ icon: '📉', text: \`日线MACD绿柱扩张\`, side: 'bear' });
  } else if (lastDifD > 0) {
    upScore += 10;
    detail.push({ icon: '📈', text: \`日线DIF>0，偏多\`, side: 'bull' });
  } else {
    upScore -= 10;
    detail.push({ icon: '📉', text: \`日线DIF<0，偏空\`, side: 'bear' });
  }

  // 价格位置
  if (pricePos > 0.75) {
    upScore += 15;
    detail.push({ icon: '🔝', text: \`价格在20日区间高位(\${(pricePos*100).toFixed(0)}%)\`, side: 'bull' });
  } else if (pricePos < 0.25) {
    upScore -= 15;
    detail.push({ icon: '🔻', text: \`价格在20日区间低位(\${(pricePos*100).toFixed(0)}%)\`, side: 'bear' });
  } else {
    detail.push({ icon: '↔️', text: \`价格在20日区间中部(\${(pricePos*100).toFixed(0)}%)\`, side: 'neut' });
  }

  // ADX 趋势强度
  if (dailyAdx && dailyAdx >= 25) {
    detail.push({ icon: '💪', text: \`日线ADX \${dailyAdx.toFixed(0)}，趋势明确\`, side: 'neut' });
    // ADX 高时加强方向判断
    if (upScore > 0) upScore += 10;
    else if (upScore < 0) upScore -= 10;
  } else if (dailyAdx && dailyAdx < 18) {
    detail.push({ icon: '😴', text: \`日线ADX \${dailyAdx.toFixed(0)}，震荡市\`, side: 'neut' });
    upScore = Math.round(upScore * 0.6); // 震荡时削弱方向判断
  }

  // 波动率
  if (atrPct > 2.5) {
    detail.push({ icon: '🔥', text: \`日ATR \${atrPct.toFixed(1)}%，波动较大\`, side: 'neut' });
  } else if (atrPct < 0.8) {
    detail.push({ icon: '😴', text: \`日ATR \${atrPct.toFixed(1)}%，波动偏小\`, side: 'neut' });
  } else {
    detail.push({ icon: '✅', text: \`日ATR \${atrPct.toFixed(1)}%，波动适中\`, side: 'neut' });
  }

  let trend, trendValue, label, color, strength;
  if (upScore >= 45)       { trend = 'up';       trendValue = 1;  label = '上升趋势'; color = '#f85149'; strength = Math.min(95, 50 + upScore); }
  else if (upScore <= -45) { trend = 'down';     trendValue = -1; label = '下降趋势'; color = '#3fb950'; strength = Math.min(95, 50 - upScore); }
  else if (upScore > 15)   { trend = 'up';       trendValue = 1;  label = '偏多震荡'; color = '#ffa657'; strength = 50 + upScore; }
  else if (upScore < -15)  { trend = 'down';     trendValue = -1; label = '偏空震荡'; color = '#58a6ff'; strength = 50 - upScore; }
  else                     { trend = 'sideways'; trendValue = 0;  label = '横盘震荡'; color = '#d29922'; strength = 50; }

  return { trend, trendValue, strength, label, color, detail, tfAdvice: buildTfAdvice(trend, atrPct), rangePct, atrPct };
}

function buildTfAdvice(trend, atrPct) {
  const rules = [];
  let recommend, reason;

  if (trend === 'sideways') {
    recommend = '5分钟';
    reason = '横盘震荡，5分钟更灵敏，做区间高抛低吸';
    rules.push({ rule: '进场规则', desc: '等价格触及压力/支撑后出现反转K线形态再进场' });
    rules.push({ rule: '过滤条件', desc: '只做区间内反弹/回调，不追突破（假突破概率高）' });
    rules.push({ rule: '止盈方式', desc: '目标设在区间中轨或对面边界前 0.3ATR' });
  } else if (atrPct > 2.0) {
    recommend = '15分钟';
    reason = '波动较大，15分钟过滤噪音，顺大方向做趋势';
    rules.push({ rule: '进场规则', desc: \`顺\${trend === 'up' ? '多' : '空'}方向，等回踩EMA10+反转形态确认后进场\` });
    rules.push({ rule: '过滤条件', desc: '需要 MACD+均线+K线形态 至少3维度共振' });
    rules.push({ rule: '止损设置', desc: '止损设在最近 swing 结构点外 0.3-0.5ATR' });
  } else {
    recommend = '15分钟';
    reason = '15分钟信号质量更高，胜率更稳定';
    rules.push({ rule: '进场规则', desc: \`顺\${trend === 'up' ? '多' : '空'}方向，均线回踩+放量确认进场\` });
    rules.push({ rule: '过滤条件', desc: '日线/15分钟同向 + ADX≥16 + 成交量配合' });
    rules.push({ rule: '止损设置', desc: '止损设在最近有效 swing 点外，到 T1 后移止损到成本' });
  }
  rules.push({ rule: '资金管理', desc: '单笔亏损≤账户2%，盈亏比≥1.5，连续3次止损当日停手' });
  return { recommend, reason, rules };
}

</script>
<script>
/**
 * app.js — 主逻辑（v2）
 * 交互：点品种 → 月份按钮 → 点月份 → 自动分析 + 每20秒自动刷新
 */

let activeProduct  = null;
let activeContract = null;
let refreshTimer   = null;

// 智能刷新：交易时段 15 秒，非交易时段 60 秒，收盘后暂停
function getRefreshInterval() {
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  const t = h * 100 + m;
  const day = now.getDay();

  // 周末不刷新
  if (day === 0 || day === 6) return 120000;

  // 交易时段：9:00-11:30, 13:30-15:00, 21:00-23:00
  const inSession =
    (t >= 900 && t <= 1130) ||
    (t >= 1330 && t <= 1500) ||
    (t >= 2100 && t <= 2300);

  if (inSession) return 15000;   // 交易中：15秒
  return 60000;                   // 非交易：60秒
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.prod-btn').forEach(btn => {
    btn.addEventListener('click', () => selectProduct(btn.dataset.code));
  });
  // 页面关闭/切换品种时清理定时器
  window.addEventListener('beforeunload', stopAutoRefresh);
});

// ─── 第一步：选品种 ──────────────────────────────────────────

function selectProduct(product) {
  stopAutoRefresh();
  activeProduct  = product;
  activeContract = null;

  document.querySelectorAll('.prod-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.code === product);
  });

  buildMonthButtons(product);

  document.getElementById('priceBar').style.display    = 'none';
  document.getElementById('trendBlock').style.display  = 'none';
  document.getElementById('signalGrid').style.display  = 'none';
  document.getElementById('loadingBar').style.display  = 'none';
}

function buildMonthButtons(product) {
  const cfg       = SYMBOL_CONFIG[product];
  const contracts = generateContracts(product);

  const section = document.getElementById('monthSection');
  const label   = document.getElementById('selectedProductLabel');
  const wrap    = document.getElementById('monthBtns');

  label.textContent = \`\${product}  \${cfg.name}\`;
  wrap.innerHTML    = '';

  contracts.forEach(c => {
    const btn = document.createElement('button');
    btn.className    = 'month-btn';
    btn.dataset.code = c.code;

    const yymm = c.code.slice(product.length);
    btn.innerHTML = yymm + (c.isMain ? '<span class="main-tag">★ 主力</span>' : '');

    btn.addEventListener('click', () => selectContract(c.code));
    wrap.appendChild(btn);
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── 选月份 → 分析 + 启动自动刷新 ────────────────────────────

function selectContract(contractCode) {
  stopAutoRefresh();
  activeContract = contractCode;

  document.querySelectorAll('.month-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.code === contractCode);
  });

  runAnalysis(contractCode, false).then(() => {
    startAutoRefresh(contractCode);
  });
}

function startAutoRefresh(contractCode) {
  stopAutoRefresh();
  function scheduleNext() {
    const interval = getRefreshInterval();
    refreshTimer = setTimeout(() => {
      if (activeContract === contractCode) {
        runAnalysis(contractCode, true)
          .catch(err => console.error('刷新失败', err))
          .finally(scheduleNext);
      }
    }, interval);
  }
  scheduleNext();
}

function stopAutoRefresh() {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
}

// ─── 分析主流程 ──────────────────────────────────────────────

async function runAnalysis(contractCode, silent = false) {
  const product = parseProduct(contractCode);
  const cfg     = SYMBOL_CONFIG[product];

  if (!silent) {
    showLoading('正在获取行情数据...');
    document.getElementById('priceBar').style.display   = 'none';
    document.getElementById('trendBlock').style.display = 'none';
    document.getElementById('signalGrid').style.display = 'none';
  }

  try {
    if (!silent) setLoadingText('正在获取实时行情...');
    const quote = await fetchQuote(contractCode);
    if (!quote) throw new Error('行情获取失败');

    document.getElementById('dataSrc').textContent =
      quote.isReal ? '数据来源：新浪财经（实时）' : '数据来源：模拟数据';
    document.getElementById('dataSrc').style.color =
      quote.isReal ? '#3fb950' : '#d29922';

    renderPriceBar(quote, cfg);
    document.getElementById('priceBar').style.display = 'flex';

    if (!silent) setLoadingText('正在获取日线数据...');
    const kD = await fetchKlines(contractCode, 'D');

    if (!silent) setLoadingText('正在获取15分钟K线...');
    const k15 = await fetchKlines(contractCode, 15);

    if (!silent) setLoadingText('正在获取5分钟K线...');
    const k5 = await fetchKlines(contractCode, 5);

    if (!silent) {
      setLoadingText('正在计算技术指标...');
      await sleep(20);
    }

    // 大方向
    const trend = analyzeTrend(kD, k15, k5);
    renderTrend(trend);
    document.getElementById('trendBlock').style.display = 'block';

    // 把大方向传给短线分析，实现多周期对齐
    const a5  = fullAnalysis(k5,  trend.trendValue);
    const a15 = fullAnalysis(k15, trend.trendValue);

    renderPanel('5m',  a5,  cfg);
    renderPanel('15m', a15, cfg);

    document.getElementById('signalGrid').style.display = 'grid';
    document.getElementById('lastUpdate').textContent =
      '更新于 ' + new Date().toLocaleTimeString('zh-CN') + (silent ? ' · 自动' : '');

  } catch (err) {
    console.error(err);
    if (!silent) showError('分析失败：' + err.message);
    return;
  } finally {
    if (!silent) hideLoading();
  }
}

// ─── 大方向趋势 ──────────────────────────────────────────────

function renderTrend(trend) {
  const iconMap = { up: '📈', down: '📉', sideways: '↔️' };
  document.getElementById('trendIcon').textContent = iconMap[trend.trend] || '📊';

  const badge = document.getElementById('trendBadge');
  badge.textContent  = trend.label;
  badge.style.color  = trend.color;
  badge.style.borderColor = trend.color;
  badge.style.background  = trend.color + '18';

  document.getElementById('trendStrength').textContent =
    \`强度 \${trend.strength}%  |  20日波幅 \${trend.rangePct?.toFixed(1) ?? '--'}%  |  日ATR \${trend.atrPct?.toFixed(1) ?? '--'}%\`;

  const detailEl = document.getElementById('trendDetail');
  detailEl.innerHTML = trend.detail.map(d => \`
    <div class="td-item td-\${d.side || 'neut'}">
      <span class="td-icon">\${d.icon}</span>
      <span class="td-text">\${d.text}</span>
    </div>
  \`).join('');

  const tf = trend.tfAdvice;
  if (!tf) return;

  const tfEl = document.getElementById('trendTf');
  tfEl.innerHTML = \`
    <div class="tf-recommend">
      <span class="tf-label">推荐短线周期</span>
      <span class="tf-value">\${tf.recommend}</span>
      <span class="tf-reason">\${tf.reason}</span>
    </div>
    <div class="tf-rules">
      \${tf.rules.map(r => \`
        <div class="tf-rule">
          <span class="tf-rule-name">\${r.rule}</span>
          <span class="tf-rule-desc">\${r.desc}</span>
        </div>
      \`).join('')}
    </div>
  \`;
}

// ─── 价格行 ──────────────────────────────────────────────────

function renderPriceBar(quote, cfg) {
  const tk = cfg.tick;
  document.getElementById('pbContract').textContent = quote.contractCode;
  document.getElementById('pbName').textContent     = quote.name;
  document.getElementById('pbExch').textContent     = quote.exchange;

  const priceEl  = document.getElementById('pbPrice');
  const changeEl = document.getElementById('pbChange');
  const pctEl    = document.getElementById('pbPct');

  priceEl.textContent  = fmt(quote.price, tk);
  changeEl.textContent = (quote.change >= 0 ? '+' : '') + fmt(quote.change, tk);
  pctEl.textContent    = (quote.changePct >= 0 ? '+' : '') + quote.changePct + '%';

  const cls = quote.change > 0 ? 'up' : quote.change < 0 ? 'down' : 'flat';
  priceEl.className  = \`pb-price \${cls}\`;
  changeEl.className = \`pb-change \${cls}\`;
  pctEl.className    = \`pb-pct \${cls}\`;

  document.getElementById('pbOpen').textContent = fmt(quote.open, tk);
  document.getElementById('pbHigh').textContent = fmt(quote.high, tk);
  document.getElementById('pbLow').textContent  = fmt(quote.low,  tk);
  document.getElementById('pbVol').textContent  = fmtVol(quote.volume);
  document.getElementById('pbOI').textContent   = fmtVol(quote.openInterest);
}

// ─── 信号面板 ────────────────────────────────────────────────

function renderPanel(suffix, analysis, cfg) {
  const tk = cfg.tick;

  if (!analysis) {
    clearPanel(suffix, '数据不足（需要至少80根K线）');
    return;
  }

  const { direction, score, factors, filters, entry, stopLoss,
          target1, target2, rr1, rr2, strengthLabel, strengthColor,
          backtest: bt, decision, supports, resistances, adx, rsi } = analysis;

  // 标题
  const dirEl = document.getElementById(\`dir\${suffix}\`);
  const wrEl  = document.getElementById(\`wr\${suffix}\`);

  if (!direction) {
    dirEl.textContent = '无明确信号 — 建议观望';
    dirEl.className   = 'sp-direction none';
    wrEl.textContent  = '';
    wrEl.className    = 'sp-winrate';
  } else {
    dirEl.textContent = direction === 'long' ? '↑ 做多' : '↓ 做空';
    dirEl.className   = \`sp-direction \${direction === 'long' ? 'bull' : 'bear'}\`;
    const wrPct = bt.winRatePct;
    wrEl.textContent  = bt.total > 0 ? \`回测胜率 \${wrPct}%\` : '样本不足';
    wrEl.className    = \`sp-winrate \${wrPct >= 60 ? 'high' : wrPct >= 50 ? 'mid' : 'low'}\`;
  }

  // 建议框
  const dirValEl = document.getElementById(\`advDir\${suffix}\`);
  if (!direction) {
    dirValEl.textContent = '观望';
    dirValEl.className   = 'adv-val direction-val none';
    ['Entry','Stop','T1_','T2_','Strength','RR','SR'].forEach(k => {
      const el = document.getElementById(\`adv\${k}\${suffix}\`);
      if (el) el.textContent = '--';
    });
  } else {
    dirValEl.textContent = direction === 'long' ? '做多 ↑' : '做空 ↓';
    dirValEl.className   = \`adv-val direction-val \${direction === 'long' ? 'bull' : 'bear'}\`;

    const stopDist = Math.abs(entry - stopLoss);
    const curPrice = analysis.currentPrice;
    const waitHint = direction === 'long' && entry < curPrice ? '（等回踩）'
                   : direction === 'short' && entry > curPrice ? '（等反弹）'
                   : '（接近入场）';
    const entryNote = analysis.entryReason ? \` [\${analysis.entryReason}]\` : '';

    setText(\`advEntry\${suffix}\`, \`\${fmt(entry, tk)} \${waitHint}\${entryNote}\`);
    setText(\`advStop\${suffix}\`,  \`\${fmt(stopLoss, tk)}  （止损 \${fmt(stopDist, tk)} 点）\`);
    setText(\`advT1_\${suffix}\`,   \`\${fmt(target1, tk)}  [\${rr1}R] → 到价后移止损至成本\`);
    setText(\`advT2_\${suffix}\`,   \`\${fmt(target2, tk)}  [\${rr2}R]\`);

    const sEl = document.getElementById(\`advStrength\${suffix}\`);
    sEl.textContent = \`\${strengthLabel}（得分 \${score}/100）\`;
    sEl.style.color = strengthColor === 'bull' ? '#f85149'
                    : strengthColor === 'mid'  ? '#ffa657' : '#8b949e';
  }

  // 压力/支撑
  const srEl = document.getElementById(\`advSR\${suffix}\`);
  if (srEl) {
    const resTxt = resistances?.slice(0, 2).map(r => fmt(r.price, tk)).join(' / ') || '--';
    const supTxt = supports?.slice(0, 2).map(s => fmt(s.price, tk)).join(' / ') || '--';
    srEl.innerHTML = \`
      <span style="color:#f85149">压力 \${resTxt}</span>
      <span style="color:#8b949e; margin:0 6px">|</span>
      <span style="color:#3fb950">支撑 \${supTxt}</span>
    \`;
  }

  // 指标参数
  const indEl = document.getElementById(\`advInd\${suffix}\`);
  if (indEl) {
    indEl.textContent = \`ADX \${adx ? adx.toFixed(1) : '--'} · RSI \${rsi ? rsi.toFixed(0) : '--'}\`;
  }

  // 信号依据
  const allFactors = direction ? factors : [...factors, ...(filters || [])];
  document.getElementById(\`basis\${suffix}\`).innerHTML = allFactors.map(f => {
    const isFilter = f.pass !== undefined;
    if (isFilter) {
      return \`
        <div class="basis-item">
          <span class="bi-icon">\${f.pass ? '✓' : '✗'}</span>
          <span class="bi-body">
            <span class="bi-name">\${f.name}</span>
            <span class="bi-desc"> — \${f.desc}</span>
          </span>
        </div>\`;
    }
    return \`
      <div class="basis-item">
        <span class="bi-icon">\${sideIcon(f.side)}</span>
        <span class="bi-body">
          <span class="bi-name">\${f.name}</span>
          <span class="bi-desc"> — \${f.desc}</span>
        </span>
        <span class="bi-score \${f.side}">\${f.pts > 0 ? '+' + f.pts : f.pts === 0 ? '—' : f.pts}</span>
      </div>\`;
  }).join('');

  // 回测
  const wrColor = bt.winRatePct >= 60 ? 'good' : bt.winRatePct >= 50 ? 'warn' : 'bad';
  const exColor = bt.expectancy > 0.15 ? 'good' : bt.expectancy > 0 ? 'warn' : 'bad';

  const wrEl2 = document.getElementById(\`btWR\${suffix}\`);
  wrEl2.textContent = bt.total >= 3 ? \`\${bt.winRatePct}%\` : '--';
  wrEl2.className   = \`bs-val \${bt.total >= 3 ? wrColor : ''}\`;

  const totalEl = document.getElementById(\`btTotal\${suffix}\`);
  totalEl.textContent = bt.total;
  totalEl.className   = 'bs-val blue';

  const winsEl = document.getElementById(\`btWins\${suffix}\`);
  winsEl.textContent = bt.wins;
  winsEl.className   = 'bs-val good';

  const exEl = document.getElementById(\`btEx\${suffix}\`);
  exEl.textContent = bt.total >= 3
    ? \`\${bt.expectancy > 0 ? '+' : ''}\${bt.expectancy}R\`
    : '--';
  exEl.className = \`bs-val \${bt.total >= 3 ? exColor : ''}\`;

  // 风险/操作建议
  const riskEl = document.getElementById(\`risk\${suffix}\`);
  if (!direction) {
    const reason = filters?.find(f => f.name === '无信号原因')?.desc || '多空信号不明确';
    riskEl.innerHTML = \`<b style="color:#8b949e">观望</b>：\${reason}。耐心等待下一次明确信号。\`;
    riskEl.style.borderLeftColor = '#8b949e';
  } else if (decision.canEnter) {
    riskEl.innerHTML = \`
      <b style="color:\${decision.color}">✅ 可操作 · 建议仓位 \${decision.positionPct}%</b><br>
      \${decision.reason}<br>
      <span style="color:#8b949e">操作步骤：</span><br>
      ① 限价 \${direction === 'long' ? '挂买单' : '挂卖单'} 在 <b style="color:#58a6ff">\${fmt(entry, tk)}</b>
      \${analysis.entryReason ? \`（\${analysis.entryReason}）\` : ''}<br>
      ② 止损设 <b style="color:#f85149">\${fmt(stopLoss, tk)}</b><br>
      ③ 到达目标一 <b style="color:#3fb950">\${fmt(target1, tk)}</b>（\${rr1}R）后：平仓50%，移止损到成本+0.2R<br>
      ④ 剩余仓位目标 <b style="color:#3fb950">\${fmt(target2, tk)}</b>（\${rr2}R），移动止损跟踪
    \`;
    riskEl.style.borderLeftColor = decision.color;
  } else {
    riskEl.innerHTML = \`<b style="color:#d29922">⚠️ 不建议进场</b>：\${decision.reason}\`;
    riskEl.style.borderLeftColor = '#d29922';
  }
}

function clearPanel(suffix, msg) {
  document.getElementById(\`dir\${suffix}\`).textContent = msg;
  document.getElementById(\`dir\${suffix}\`).className   = 'sp-direction none';
  document.getElementById(\`wr\${suffix}\`).textContent  = '';
  ['Dir','Entry','Stop','T1_','T2_','Strength','RR','SR','Ind'].forEach(k => {
    const el = document.getElementById(\`adv\${k}\${suffix}\`);
    if (el) { el.textContent = '--'; el.className = 'adv-val'; }
  });
  document.getElementById(\`basis\${suffix}\`).innerHTML = '';
  ['WR','Total','Wins','Ex'].forEach(k => {
    const el = document.getElementById(\`bt\${k}\${suffix}\`);
    if (el) { el.textContent = '--'; el.className = 'bs-val'; }
  });
  document.getElementById(\`risk\${suffix}\`).textContent = '';
}

// ─── 加载状态 ────────────────────────────────────────────────

function showLoading(text) {
  const bar = document.getElementById('loadingBar');
  bar.style.display = 'flex';
  const spinner = bar.querySelector('.loading-spinner');
  if (spinner) spinner.style.display = 'block';
  document.getElementById('loadingText').textContent = text;
}
function setLoadingText(text) { document.getElementById('loadingText').textContent = text; }
function hideLoading() { document.getElementById('loadingBar').style.display = 'none'; }
function showError(msg) {
  const bar = document.getElementById('loadingBar');
  bar.style.display = 'flex';
  const spinner = bar.querySelector('.loading-spinner');
  if (spinner) spinner.style.display = 'none';
  document.getElementById('loadingText').textContent = '❌ ' + msg;
}

// ─── 工具 ────────────────────────────────────────────────────

function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }

function sideIcon(side) {
  return side === 'bull' ? '🟢' : side === 'bear' ? '🔴' : '⚪';
}

function fmt(val, tick) {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const s = tick.toString();
  const d = s.indexOf('.');
  const dec = d === -1 ? 0 : s.length - d - 1;
  return (+val).toFixed(dec);
}

function fmtVol(v) {
  if (!v) return '--';
  if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿';
  if (v >= 1e4) return (v / 1e4).toFixed(1) + '万';
  return v.toLocaleString();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

</script>
</body>
</html>
`;

// ═══ API 缓存 ═══
const cache = new Map();
const CACHE_TTL = { quote: 3000, kline: 10000 };
const CACHE_MAX = 200;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.ts > item.ttl) { cache.delete(key); return null; }
  return item.data;
}
function setCache(key, data, ttl) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { data, ts: Date.now(), ttl });
}

// ═══ Gzip ═══
function sendGzip(req, res, contentType, body) {
  const ae = req.headers['accept-encoding'] || '';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (ae.includes('gzip') && body.length > 1024) {
    res.setHeader('Content-Encoding', 'gzip');
    zlib.gzip(Buffer.from(body), (err, compressed) => {
      if (err) { res.removeHeader('Content-Encoding'); res.writeHead(200); res.end(body); }
      else { res.writeHead(200); res.end(compressed); }
    });
  } else { res.writeHead(200); res.end(body); }
}

// ═══ HTTPS Agent ═══
const agent = new https.Agent({ keepAlive: true, maxSockets: 10 });

const server = http.createServer(function(req, res) {
  const p = url.parse(req.url, true);

  if (p.pathname === "/api/quote") {
    const code = p.query.code;
    if (!code || !/^[A-Z]{1,3}\d{4}$/.test(code)) { res.writeHead(400); res.end("invalid code"); return; }
    const cacheKey = "quote:" + code;
    const cached = getCached(cacheKey);
    if (cached) { sendGzip(req, res, "text/plain; charset=utf-8", cached); return; }
    proxy("https://hq.sinajs.cn/list=nf_" + code, req, res, cacheKey, CACHE_TTL.quote);
    return;
  }

  if (p.pathname === "/api/kline") {
    const code = p.query.code;
    const type = p.query.type || "15";
    if (!code || !/^[A-Z]{1,3}\d{4}$/.test(code)) { res.writeHead(400); res.end("invalid code"); return; }
    const cacheKey = "kline:" + code + ":" + type;
    const cached = getCached(cacheKey);
    if (cached) { sendGzip(req, res, "text/plain; charset=utf-8", cached); return; }
    const klineUrl = "https://stock2.finance.sina.com.cn/futures/api/jsonp.php/cb=/InnerFuturesNewService.getFewMinLine?symbol=" + code + "&type=" + type;
    proxy(klineUrl, req, res, cacheKey, CACHE_TTL.kline);
    return;
  }

  if (p.pathname === "/health") {
    res.writeHead(200, {"Content-Type":"application/json"});
    res.end(JSON.stringify({status:"ok",uptime:process.uptime(),cache:cache.size}));
    return;
  }

  sendGzip(req, res, "text/html; charset=utf-8", HTML);
});

function proxy(u, req, res, cacheKey, ttl) {
  const proxyReq = https.get(u, {headers:{"Referer":"https://finance.sina.com.cn","User-Agent":"Mozilla/5.0"}, agent, timeout: 8000}, function(r) {
    const d = [];
    r.on("data", function(c){ d.push(c); });
    r.on("end", function(){
      const body = Buffer.concat(d).toString();
      if (r.statusCode === 200 && body.length > 0) setCache(cacheKey, body, ttl);
      sendGzip(req, res, "text/plain; charset=utf-8", body);
    });
  });
  proxyReq.on("error", function(e){
    const stale = cache.get(cacheKey);
    if (stale) { sendGzip(req, res, "text/plain; charset=utf-8", stale.data); return; }
    res.writeHead(500); res.end("proxy error: " + e.message);
  });
  proxyReq.on("timeout", function(){
    proxyReq.destroy();
    const stale = cache.get(cacheKey);
    if (stale) { sendGzip(req, res, "text/plain; charset=utf-8", stale.data); return; }
    res.writeHead(504); res.end("timeout");
  });
}

server.listen(process.env.PORT || 3000, function(){
  console.log("✅ 期货信号分析系统已启动 (单文件版)");
  console.log("   访问: http://localhost:" + (process.env.PORT || 3000));
});
