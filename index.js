const http = require("http");
const https = require("https");

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
          <span class="adv-label">目标一 (1.5R)</span>
          <span class="adv-val target-val" id="advT1_5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">目标二 (2.5R)</span>
          <span class="adv-val target-val2" id="advT2_5m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">信号强度</span>
          <span class="adv-val" id="advStrength5m">--</span>
        </div>
      </div>
      <div class="basis-title">信号依据</div>
      <div class="basis-list" id="basis5m"></div>
      <div class="backtest-box">
        <div class="bt-title">历史回测（近200根K线 · 盈亏比1.5）</div>
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
          <span class="adv-label">目标一 (1.5R)</span>
          <span class="adv-val target-val" id="advT1_15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">目标二 (2.5R)</span>
          <span class="adv-val target-val2" id="advT2_15m">--</span>
        </div>
        <div class="advice-row">
          <span class="adv-label">信号强度</span>
          <span class="adv-val" id="advStrength15m">--</span>
        </div>
      </div>
      <div class="basis-title">信号依据</div>
      <div class="basis-list" id="basis15m"></div>
      <div class="backtest-box">
        <div class="bt-title">历史回测（近200根K线 · 盈亏比1.5）</div>
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
        <b>① MACD（权重50%）</b>
        DIF在0轴上方为多头区间，金叉为买入信号，死叉为卖出信号，MACD柱扩张代表动能增强。
      </div>
      <div class="ex-item">
        <b>② 均线排列（权重25%）</b>
        检查价格与MA5/10/20/60的位置及均线间排列，6项全多头=趋势强劲。
      </div>
      <div class="ex-item">
        <b>③ 量能确认（权重15%）</b>
        价涨量增=多头有效，价跌量增=空头有效，量价背离=信号减分。
      </div>
      <div class="ex-item">
        <b>④ 布林带（权重10%）</b>
        触及下轨=超卖反弹，触及上轨=超买回调，中轨上下判断偏多偏空。
      </div>
      <div class="ex-item">
        <b>胜率计算</b>
        对历史K线逐根回测：ATR×1.5止损、ATR×2.25目标，统计8根K线内先触止损还是先触目标。
      </div>
      <div class="ex-item warn-item">
        <b>⚠️ 数据说明</b>
        行情数据来自新浪财经公开接口（实时）。技术分析是概率游戏，短周期噪音大，
        信号仅供参考，严格止损，单笔风险≤2%。
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

// 带超时的 fetch
function fetchWithTimeout(url, ms) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal, cache: 'no-cache' })
    .finally(() => clearTimeout(timer));
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
 * indicators.js
 * 技术指标 + 信号检测 + 回测引擎 + 大方向趋势分析
 */

// ─── 基础指标 ────────────────────────────────────────────────

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
    return data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
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

function calcBoll(closes, period = 20, mult = 2) {
  const mid = calcSMA(closes, period);
  return closes.map((_, i) => {
    if (mid[i] === null) return { mid: null, upper: null, lower: null };
    const slice = closes.slice(Math.max(0, i - period + 1), i + 1);
    const mean  = slice.reduce((a, b) => a + b, 0) / slice.length;
    const std   = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length);
    return { mid: mid[i], upper: mid[i] + mult * std, lower: mid[i] - mult * std };
  });
}

// ─── 信号检测 ────────────────────────────────────────────────

function detectSignal(klines, idx) {
  if (idx < 65) return { direction: null, score: 0, factors: [] };

  const slice  = klines.slice(0, idx + 1);
  const closes = slice.map(k => k.close);
  const vols   = slice.map(k => k.volume);
  const n      = closes.length;
  const price  = closes[n - 1];

  const { dif, dea, bar } = calcMACD(closes);
  const curDif    = dif[n - 1], prevDif = dif[n - 2];
  const curDea    = dea[n - 1], prevDea = dea[n - 2];
  const curBar    = bar[n - 1], prevBar = bar[n - 2];
  const aboveZero = curDif > 0;
  const goldenX   = prevDif <= prevDea && curDif > curDea;
  const deadX     = prevDif >= prevDea && curDif < curDea;
  const barExpand = Math.abs(curBar) > Math.abs(prevBar);

  const ma5  = calcSMA(closes, 5);
  const ma10 = calcSMA(closes, 10);
  const ma20 = calcSMA(closes, 20);
  const ma60 = calcSMA(closes, 60);
  const m5 = ma5[n-1], m10 = ma10[n-1], m20 = ma20[n-1], m60 = ma60[n-1];

  const avgVol20  = vols.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
  const curVol    = vols[n - 1];
  const volRatio  = avgVol20 > 0 ? curVol / avgVol20 : 1;
  const volExpand = volRatio > 1.3;

  const bollArr = calcBoll(closes, 20, 2);
  const boll    = bollArr[n - 1];

  let longScore = 0, shortScore = 0;
  const factors = [];

  // 1. MACD 0轴 (20分)
  if (aboveZero) {
    longScore += 20;
    factors.push({ name: 'MACD 0轴', desc: 'DIF在0轴上方，多头区间', side: 'bull', pts: 20 });
  } else {
    shortScore += 20;
    factors.push({ name: 'MACD 0轴', desc: 'DIF在0轴下方，空头区间', side: 'bear', pts: 20 });
  }

  // 2. MACD 金叉/死叉 (30分)
  if (goldenX) {
    longScore += 30;
    factors.push({ name: 'MACD 金叉', desc: 'DIF上穿DEA，买入触发', side: 'bull', pts: 30 });
  } else if (deadX) {
    shortScore += 30;
    factors.push({ name: 'MACD 死叉', desc: 'DIF下穿DEA，卖出触发', side: 'bear', pts: 30 });
  } else if (curDif > curDea && barExpand && curBar > 0) {
    longScore += 15;
    factors.push({ name: 'MACD 红柱扩张', desc: '多头动能持续放大', side: 'bull', pts: 15 });
  } else if (curDif < curDea && barExpand && curBar < 0) {
    shortScore += 15;
    factors.push({ name: 'MACD 绿柱扩张', desc: '空头动能持续放大', side: 'bear', pts: 15 });
  }

  // 3. 均线排列 (25分)
  let maLong = 0, maShort = 0;
  if (price > m5)  maLong++; else maShort++;
  if (price > m10) maLong++; else maShort++;
  if (price > m20) maLong++; else maShort++;
  if (m60 && price > m60) maLong++; else if (m60) maShort++;
  if (m5 > m10)  maLong++; else maShort++;
  if (m10 > m20) maLong++; else maShort++;
  const maTotal = maLong + maShort;
  const maScore = Math.round((maLong / maTotal) * 25);
  if (maLong >= 4) {
    longScore += maScore;
    factors.push({ name: '均线排列', desc: \`多头排列 \${maLong}/\${maTotal} 项\`, side: 'bull', pts: maScore });
  } else if (maShort >= 4) {
    shortScore += (25 - maScore);
    factors.push({ name: '均线排列', desc: \`空头排列 \${maShort}/\${maTotal} 项\`, side: 'bear', pts: 25 - maScore });
  } else {
    factors.push({ name: '均线排列', desc: \`多空均衡 \${maLong}/\${maTotal}，无明确趋势\`, side: 'neut', pts: 0 });
  }

  // 4. 量能确认 (15分)
  const priceUp = price > closes[n - 2];
  if (priceUp && volExpand) {
    longScore += 15;
    factors.push({ name: '量能放大', desc: \`价涨量增 量比\${volRatio.toFixed(1)}x，多头确认\`, side: 'bull', pts: 15 });
  } else if (!priceUp && volExpand) {
    shortScore += 15;
    factors.push({ name: '量能放大', desc: \`价跌量增 量比\${volRatio.toFixed(1)}x，空头确认\`, side: 'bear', pts: 15 });
  } else if (volRatio < 0.6) {
    factors.push({ name: '量能萎缩', desc: \`量比\${volRatio.toFixed(1)}x，动能不足，信号偏弱\`, side: 'neut', pts: 0 });
  } else {
    factors.push({ name: '量能中性', desc: \`量比\${volRatio.toFixed(1)}x，无明显放量\`, side: 'neut', pts: 0 });
  }

  // 5. 布林带 (10分)
  if (boll.mid !== null) {
    if (price > boll.upper * 0.998) {
      shortScore += 8;
      factors.push({ name: '布林上轨', desc: '价格触及上轨，注意回调压力', side: 'bear', pts: 8 });
    } else if (price < boll.lower * 1.002) {
      longScore += 8;
      factors.push({ name: '布林下轨', desc: '价格触及下轨，关注反弹机会', side: 'bull', pts: 8 });
    } else if (price > boll.mid) {
      longScore += 5;
      factors.push({ name: '布林中轨上', desc: '价格在中轨上方，偏多', side: 'bull', pts: 5 });
    } else {
      shortScore += 5;
      factors.push({ name: '布林中轨下', desc: '价格在中轨下方，偏空', side: 'bear', pts: 5 });
    }
  }

  const total   = longScore + shortScore;
  const longPct = total > 0 ? longScore / total : 0.5;

  let direction = null, score = 0;
  if (longPct >= 0.62)      { direction = 'long';  score = Math.round(longPct * 100); }
  else if (longPct <= 0.38) { direction = 'short'; score = Math.round((1 - longPct) * 100); }

  return { direction, score, factors, longScore, shortScore, boll };
}

// ─── 回测引擎 ────────────────────────────────────────────────

function backtest(klines, lookAhead = 8, rrRatio = 1.5) {
  const results  = { total: 0, wins: 0, losses: 0, noResult: 0 };
  const atrArr   = calcATR(klines, 14);

  for (let i = 65; i < klines.length - lookAhead; i++) {
    const sig = detectSignal(klines, i);
    if (!sig.direction) continue;

    const entry      = klines[i].close;
    const atr        = atrArr[i] || entry * 0.005;
    const stopDist   = atr * 1.5;
    const targetDist = stopDist * rrRatio;
    const stopLoss   = sig.direction === 'long' ? entry - stopDist : entry + stopDist;
    const target     = sig.direction === 'long' ? entry + targetDist : entry - targetDist;

    let outcome = 'noResult';
    for (let j = i + 1; j <= i + lookAhead; j++) {
      const b = klines[j];
      if (sig.direction === 'long') {
        if (b.low  <= stopLoss) { outcome = 'loss'; break; }
        if (b.high >= target)   { outcome = 'win';  break; }
      } else {
        if (b.high >= stopLoss) { outcome = 'loss'; break; }
        if (b.low  <= target)   { outcome = 'win';  break; }
      }
    }
    results.total++;
    results[outcome === 'win' ? 'wins' : outcome === 'loss' ? 'losses' : 'noResult']++;
  }

  const decided    = results.wins + results.losses;
  const winRate    = decided > 0 ? results.wins / decided : 0;
  const expectancy = decided > 0 ? +(winRate * rrRatio - (1 - winRate)).toFixed(2) : 0;

  return {
    total: results.total, wins: results.wins,
    losses: results.losses, noResult: results.noResult,
    winRate: +winRate.toFixed(3),
    winRatePct: Math.round(winRate * 100),
    expectancy, rrRatio,
  };
}

// ─── 进场决策 ────────────────────────────────────────────────
// 核心逻辑：期望值 = 胜率 × 盈亏比 - 败率 × 1
// 期望值 > 0 才值得进场，越高越好
// 盈亏比1.5时：胜率需 > 40% 才保本，> 55% 才有明显优势
// 盈亏比2.0时：胜率需 > 33% 才保本，> 50% 才有明显优势

function calcEntryDecision(bt, direction, score) {
  const { winRatePct, expectancy, total, rrRatio } = bt;

  // 最低进场门槛
  const MIN_SIGNALS   = 5;    // 至少5次历史信号
  const MIN_WINRATE   = 45;   // 胜率至少45%（盈亏比1.5时期望值>0需要40%）
  const MIN_EXPECT    = 0;    // 期望值必须为正
  const GOOD_WINRATE  = 58;   // 胜率58%以上为良好
  const GREAT_WINRATE = 65;   // 胜率65%以上为优秀

  let canEnter = false;
  let grade    = 'no';   // no / weak / ok / good / great
  let reason   = '';
  let color    = '#8b949e';

  if (!direction) {
    reason = '无方向信号，不满足进场条件';
  } else if (total < MIN_SIGNALS) {
    reason = \`历史样本不足（\${total}次），无法评估胜率，建议观望\`;
  } else if (winRatePct < MIN_WINRATE) {
    reason = \`胜率\${winRatePct}% 低于最低门槛\${MIN_WINRATE}%，期望值为负，不建议进场\`;
  } else if (expectancy <= MIN_EXPECT) {
    reason = \`期望值\${expectancy}R ≤ 0，长期交易必亏，不建议进场\`;
  } else {
    canEnter = true;
    if (winRatePct >= GREAT_WINRATE) {
      grade = 'great'; color = '#f85149';
      reason = \`胜率\${winRatePct}%，期望值+\${expectancy}R，信号质量优秀，可正常仓位进场\`;
    } else if (winRatePct >= GOOD_WINRATE) {
      grade = 'good'; color = '#ffa657';
      reason = \`胜率\${winRatePct}%，期望值+\${expectancy}R，信号质量良好，可进场\`;
    } else {
      grade = 'ok'; color = '#d29922';
      reason = \`胜率\${winRatePct}%，期望值+\${expectancy}R，信号勉强达标，建议轻仓\`;
    }
  }

  // 信号强度加成
  if (canEnter && score < 65) {
    reason += '（信号强度偏弱，建议减半仓位）';
  }

  // 计算建议仓位
  let positionPct = 0;
  if (canEnter) {
    if (grade === 'great' && score >= 75) positionPct = 100;
    else if (grade === 'great')           positionPct = 80;
    else if (grade === 'good')            positionPct = 60;
    else                                  positionPct = 40;
  }

  // 盈亏平衡胜率
  const breakEvenWR = Math.round((1 / (1 + rrRatio)) * 100);

  return { canEnter, grade, reason, color, positionPct, breakEvenWR };
}

// ─── 完整分析 ────────────────────────────────────────────────

function fullAnalysis(klines) {
  if (!klines || klines.length < 80) return null;

  const n      = klines.length;
  const atrArr = calcATR(klines, 14);
  const atr    = atrArr[n - 1] || klines[n - 1].close * 0.005;
  const sig    = detectSignal(klines, n - 1);
  const bt     = backtest(klines, 8, 1.5);
  const price  = klines[n - 1].close;

  let entry, stopLoss, target1, target2;
  if (sig.direction === 'long') {
    entry    = +(price - atr * 0.2).toFixed(2);
    stopLoss = +(entry - atr * 1.5).toFixed(2);
    target1  = +(entry + atr * 2.25).toFixed(2);
    target2  = +(entry + atr * 3.75).toFixed(2);
  } else if (sig.direction === 'short') {
    entry    = +(price + atr * 0.2).toFixed(2);
    stopLoss = +(entry + atr * 1.5).toFixed(2);
    target1  = +(entry - atr * 2.25).toFixed(2);
    target2  = +(entry - atr * 3.75).toFixed(2);
  } else {
    entry = stopLoss = target1 = target2 = null;
  }

  let strengthLabel, strengthColor;
  if (!sig.direction)       { strengthLabel = '无信号';  strengthColor = 'neut'; }
  else if (sig.score >= 75) { strengthLabel = '强 ★★★'; strengthColor = 'bull'; }
  else if (sig.score >= 65) { strengthLabel = '中 ★★☆'; strengthColor = 'mid';  }
  else                      { strengthLabel = '弱 ★☆☆'; strengthColor = 'low';  }

  const decision = calcEntryDecision(bt, sig.direction, sig.score);

  return {
    direction: sig.direction, score: sig.score,
    factors: sig.factors,
    entry, stopLoss, target1, target2,
    rrRatio: 1.5, strengthLabel, strengthColor,
    backtest: bt, decision,
    atr: +atr.toFixed(2), currentPrice: price,
  };
}

// ─── 大方向趋势分析（日线）────────────────────────────────────

function analyzeTrend(dailyKlines, klines15, klines5) {
  if (!dailyKlines || dailyKlines.length < 30) {
    return {
      trend: 'sideways', strength: 50, label: '数据不足', color: '#8b949e',
      detail: [{ icon: '⚠️', text: '日线数据不足，无法判断大方向', side: 'neut' }],
      tfAdvice: buildTfAdvice('sideways', 1.5, klines5, klines15),
      rangePct: 0, atrPct: 0,
    };
  }

  const closes = dailyKlines.map(k => k.close);
  const n      = closes.length;
  const price  = closes[n - 1];

  const ma5d  = calcSMA(closes, 5);
  const ma10d = calcSMA(closes, 10);
  const ma20d = calcSMA(closes, 20);
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

  const { dif: difD, dea: deaD } = calcMACD(closes);
  const lastDifD = difD[n-1], lastDeaD = deaD[n-1];
  const macdBull = lastDifD > 0 && lastDifD > lastDeaD;
  const macdBear = lastDifD < 0 && lastDifD < lastDeaD;

  const atrD   = calcATR(dailyKlines, 14);
  const lastAtr = atrD[n-1] || price * 0.01;
  const atrPct  = lastAtr / price * 100;

  let upScore = 0;
  const detail = [];

  if (maUpCount >= 5) {
    upScore += 40;
    detail.push({ icon: '📈', text: \`日线均线多头排列（\${maUpCount}/6项），趋势向上明确\`, side: 'bull' });
  } else if (maUpCount >= 3) {
    upScore += 20;
    detail.push({ icon: '📊', text: \`日线均线偏多（\${maUpCount}/6项），趋势偏强\`, side: 'bull' });
  } else if (maUpCount <= 1) {
    upScore -= 40;
    detail.push({ icon: '📉', text: \`日线均线空头排列（\${6-maUpCount}/6项），趋势向下明确\`, side: 'bear' });
  } else {
    upScore -= 20;
    detail.push({ icon: '📊', text: \`日线均线偏空（\${6-maUpCount}/6项），趋势偏弱\`, side: 'bear' });
  }

  if (macdBull) {
    upScore += 30;
    detail.push({ icon: '⚡', text: \`日线MACD在0轴上方且DIF>DEA，多头动能\`, side: 'bull' });
  } else if (macdBear) {
    upScore -= 30;
    detail.push({ icon: '❄️', text: \`日线MACD在0轴下方且DIF<DEA，空头动能\`, side: 'bear' });
  } else if (lastDifD > 0) {
    upScore += 15;
    detail.push({ icon: '📈', text: \`日线MACD DIF在0轴上方，多头区间\`, side: 'bull' });
  } else {
    upScore -= 15;
    detail.push({ icon: '📉', text: \`日线MACD DIF在0轴下方，空头区间\`, side: 'bear' });
  }

  if (pricePos > 0.7) {
    upScore += 15;
    detail.push({ icon: '🔝', text: \`价格处于20日区间高位（\${(pricePos*100).toFixed(0)}%），强势\`, side: 'bull' });
  } else if (pricePos < 0.3) {
    upScore -= 15;
    detail.push({ icon: '🔻', text: \`价格处于20日区间低位（\${(pricePos*100).toFixed(0)}%），弱势\`, side: 'bear' });
  } else {
    detail.push({ icon: '↔️', text: \`价格处于20日区间中部（\${(pricePos*100).toFixed(0)}%），震荡\`, side: 'neut' });
  }

  if (atrPct > 2.5) {
    detail.push({ icon: '🔥', text: \`日线ATR波动率\${atrPct.toFixed(1)}%，波动较大，短线机会多\`, side: 'neut' });
  } else if (atrPct < 0.8) {
    detail.push({ icon: '😴', text: \`日线ATR波动率\${atrPct.toFixed(1)}%，波动偏小，短线空间有限\`, side: 'neut' });
  } else {
    detail.push({ icon: '✅', text: \`日线ATR波动率\${atrPct.toFixed(1)}%，波动适中，适合短线\`, side: 'neut' });
  }

  let trend, label, color, strength;
  if (upScore >= 50)       { trend = 'up';       label = '上升趋势'; color = '#f85149'; strength = Math.min(95, 50 + upScore); }
  else if (upScore <= -50) { trend = 'down';     label = '下降趋势'; color = '#3fb950'; strength = Math.min(95, 50 - upScore); }
  else if (upScore > 15)   { trend = 'up';       label = '偏多震荡'; color = '#ffa657'; strength = 50 + upScore; }
  else if (upScore < -15)  { trend = 'down';     label = '偏空震荡'; color = '#58a6ff'; strength = 50 - upScore; }
  else                     { trend = 'sideways'; label = '横盘震荡'; color = '#d29922'; strength = 50; }

  return { trend, strength, label, color, detail, tfAdvice: buildTfAdvice(trend, atrPct, klines5, klines15), rangePct, atrPct };
}

function buildTfAdvice(trend, atrPct, klines5, klines15) {
  const rules = [];
  let recommend, reason;

  if (trend === 'sideways') {
    recommend = '5分钟';
    reason = '横盘震荡行情，5分钟周期信号更灵敏，做区间高抛低吸';
    rules.push({ rule: '进场规则', desc: '等待价格触及布林带上下轨后反向进场，止损设在轨道外1×ATR' });
    rules.push({ rule: '过滤条件', desc: '日线MACD无明确方向时，只做区间内反弹/回调，不追趋势' });
    rules.push({ rule: '止盈方式', desc: '目标设在区间中轨，快进快出，不贪' });
  } else if (atrPct > 2.0) {
    recommend = '15分钟';
    reason = '波动较大，15分钟可过滤噪音，减少假信号，顺大方向做趋势';
    rules.push({ rule: '进场规则', desc: \`顺\${trend === 'up' ? '多' : '空'}方向，等待15分钟MACD金叉/死叉后进场，不逆势\` });
    rules.push({ rule: '过滤条件', desc: '进场前确认日线方向一致，5分钟出现同向信号时可加仓' });
    rules.push({ rule: '止损设置', desc: '止损设在进场K线低点（做多）或高点（做空）外1×ATR' });
  } else {
    recommend = '15分钟';
    reason = '趋势行情中，15分钟信号质量更高，胜率通常比5分钟高10-15%';
    rules.push({ rule: '进场规则', desc: \`顺\${trend === 'up' ? '多' : '空'}方向，15分钟均线回踩MA10/MA20时进场，不追高\` });
    rules.push({ rule: '过滤条件', desc: '日线和15分钟方向一致才进场，5分钟出现背离时减仓' });
    rules.push({ rule: '止损设置', desc: '止损设在最近结构低点（做多）或高点（做空）' });
  }

  rules.push({ rule: '通用原则', desc: '单笔亏损≤账户2%，盈亏比≥1.5，连续3次止损后当日停止交易' });
  return { recommend, reason, rules };
}

</script>
<script>
/**
 * app.js — 主逻辑
 * 交互流程：点品种按钮 → 显示月份按钮 → 点月份按钮 → 自动分析
 */

let activeProduct  = null;
let activeContract = null;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.prod-btn').forEach(btn => {
    btn.addEventListener('click', () => selectProduct(btn.dataset.code));
  });
});

// ─── 第一步：选品种 ───────────────────────────────────────────

function selectProduct(product) {
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

// ─── 第二步：构建月份按钮 ─────────────────────────────────────

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
    btn.innerHTML = yymm + (c.isMain
      ? '<span class="main-tag">★ 主力</span>'
      : '');

    btn.addEventListener('click', () => selectContract(c.code));
    wrap.appendChild(btn);
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── 第三步：选月份 → 自动分析 ───────────────────────────────

function selectContract(contractCode) {
  activeContract = contractCode;

  document.querySelectorAll('.month-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.code === contractCode);
  });

  runAnalysis(contractCode);
}

// ─── 分析主流程 ───────────────────────────────────────────────

async function runAnalysis(contractCode) {
  const product = parseProduct(contractCode);
  const cfg     = SYMBOL_CONFIG[product];

  showLoading('正在获取行情数据...');
  document.getElementById('priceBar').style.display   = 'none';
  document.getElementById('trendBlock').style.display = 'none';
  document.getElementById('signalGrid').style.display = 'none';

  try {
    // 1. 实时行情
    setLoadingText('正在获取实时行情...');
    const quote = await fetchQuote(contractCode);
    if (!quote) throw new Error('行情获取失败，请检查网络');

    document.getElementById('dataSrc').textContent =
      quote.isReal ? '数据来源：新浪财经（实时）' : '数据来源：模拟数据（接口不可用）';
    document.getElementById('dataSrc').style.color =
      quote.isReal ? '#3fb950' : '#d29922';

    renderPriceBar(quote, cfg);
    document.getElementById('priceBar').style.display = 'flex';

    // 2. 日线K线（大方向）
    setLoadingText('正在获取日线数据...');
    const kD = await fetchKlines(contractCode, 'D');

    // 3. 15分钟K线
    setLoadingText('正在获取15分钟K线...');
    const k15 = await fetchKlines(contractCode, 15);

    // 4. 5分钟K线
    setLoadingText('正在获取5分钟K线...');
    const k5 = await fetchKlines(contractCode, 5);

    // 5. 计算
    setLoadingText('正在计算技术指标...');
    await sleep(20);

    // 大方向趋势
    const trend = analyzeTrend(kD, k15, k5);
    renderTrend(trend);
    document.getElementById('trendBlock').style.display = 'block';

    // 短线信号
    const a5  = fullAnalysis(k5);
    const a15 = fullAnalysis(k15);

    renderPanel('5m',  a5,  cfg);
    renderPanel('15m', a15, cfg);

    document.getElementById('signalGrid').style.display = 'grid';
    document.getElementById('lastUpdate').textContent =
      '更新于 ' + new Date().toLocaleTimeString('zh-CN');

  } catch (err) {
    console.error(err);
    showError('分析失败：' + err.message);
    return;
  } finally {
    hideLoading();
  }
}

// ─── 大方向趋势渲染 ───────────────────────────────────────────

function renderTrend(trend) {
  const iconMap = { up: '📈', down: '📉', sideways: '↔️' };
  document.getElementById('trendIcon').textContent = iconMap[trend.trend] || '📊';

  const badge = document.getElementById('trendBadge');
  badge.textContent  = trend.label;
  badge.style.color  = trend.color;
  badge.style.borderColor = trend.color;
  badge.style.background  = trend.color + '18';

  document.getElementById('trendStrength').textContent =
    \`强度 \${trend.strength}%  |  20日波幅 \${(trend.rangePct != null ? trend.rangePct.toFixed(1) : '--')}%  |  日ATR \${(trend.atrPct != null ? trend.atrPct.toFixed(1) : '--')}%\`;

  // 日线维度明细
  const detailEl = document.getElementById('trendDetail');
  detailEl.innerHTML = trend.detail.map(d => \`
    <div class="td-item td-\${d.side || 'neut'}">
      <span class="td-icon">\${d.icon}</span>
      <span class="td-text">\${d.text}</span>
    </div>
  \`).join('');

  // 短线周期建议
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

// ─── 价格行渲染 ───────────────────────────────────────────────

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

// ─── 信号面板渲染 ─────────────────────────────────────────────

function renderPanel(suffix, analysis, cfg) {
  const tk = cfg.tick;

  if (!analysis) {
    clearPanel(suffix, '数据不足（需要至少80根K线）');
    return;
  }

  const { direction, score, factors, entry, stopLoss,
          target1, target2, strengthLabel,
          strengthColor, backtest: bt } = analysis;

  // 面板标题
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
    wrEl.textContent  = \`历史胜率 \${wrPct}%\`;
    wrEl.className    = \`sp-winrate \${wrPct >= 65 ? 'high' : wrPct >= 55 ? 'mid' : 'low'}\`;
  }

  // 建议框
  const dirValEl = document.getElementById(\`advDir\${suffix}\`);
  if (!direction) {
    dirValEl.textContent = '观望，等待信号';
    dirValEl.className   = 'adv-val direction-val none';
    ['Entry','Stop','T1_','T2_','Strength'].forEach(k => {
      const el = document.getElementById(\`adv\${k}\${suffix}\`);
      if (el) el.textContent = '--';
    });
  } else {
    dirValEl.textContent = direction === 'long' ? '做多 ↑' : '做空 ↓';
    dirValEl.className   = \`adv-val direction-val \${direction === 'long' ? 'bull' : 'bear'}\`;

    const stopDist = Math.abs(entry - stopLoss);
    document.getElementById(\`advEntry\${suffix}\`).textContent  = fmt(entry, tk);
    document.getElementById(\`advStop\${suffix}\`).textContent   =
      \`\${fmt(stopLoss, tk)}  （距进场 \${fmt(stopDist, tk)} 点 · ATR=\${analysis.atr}）\`;
    document.getElementById(\`advT1_\${suffix}\`).textContent    = fmt(target1, tk);
    document.getElementById(\`advT2_\${suffix}\`).textContent    = fmt(target2, tk);

    const sEl = document.getElementById(\`advStrength\${suffix}\`);
    sEl.textContent = \`\${strengthLabel}（得分 \${score}/100）\`;
    sEl.style.color = strengthColor === 'bull' ? '#f85149'
                    : strengthColor === 'mid'  ? '#ffa657' : '#8b949e';
  }

  // 信号依据
  document.getElementById(\`basis\${suffix}\`).innerHTML = factors.map(f => \`
    <div class="basis-item">
      <span class="bi-icon">\${sideIcon(f.side)}</span>
      <span class="bi-body">
        <span class="bi-name">\${f.name}</span>
        <span class="bi-desc"> — \${f.desc}</span>
      </span>
      <span class="bi-score \${f.side}">\${f.pts > 0 ? '+' + f.pts : f.pts === 0 ? '—' : f.pts}</span>
    </div>
  \`).join('');

  // 回测数据
  const wrColor = bt.winRatePct >= 65 ? 'good' : bt.winRatePct >= 55 ? 'warn' : 'bad';
  const exColor = bt.expectancy > 0 ? 'good' : 'bad';

  const wrEl2 = document.getElementById(\`btWR\${suffix}\`);
  wrEl2.textContent = bt.total >= 5 ? \`\${bt.winRatePct}%\` : '--';
  wrEl2.className   = \`bs-val \${bt.total >= 5 ? wrColor : ''}\`;

  const totalEl = document.getElementById(\`btTotal\${suffix}\`);
  totalEl.textContent = bt.total;
  totalEl.className   = 'bs-val blue';

  const winsEl = document.getElementById(\`btWins\${suffix}\`);
  winsEl.textContent = bt.wins;
  winsEl.className   = 'bs-val good';

  const exEl = document.getElementById(\`btEx\${suffix}\`);
  exEl.textContent = bt.total >= 5
    ? \`\${bt.expectancy > 0 ? '+' : ''}\${bt.expectancy}R\`
    : '--';
  exEl.className = \`bs-val \${bt.total >= 5 ? exColor : ''}\`;

  // 风险提示
  const riskEl = document.getElementById(\`risk\${suffix}\`);
  if (!direction) {
    riskEl.textContent = '多空信号不明确，建议等待更清晰的方向再入场，避免在震荡区间频繁交易。';
  } else if (bt.total < 5) {
    riskEl.textContent = '⚠️ 历史触发次数过少，回测胜率统计意义有限，请谨慎参考。';
  } else if (bt.winRatePct < 55) {
    riskEl.textContent = \`⚠️ 历史胜率偏低（\${bt.winRatePct}%），信号可靠性不足，建议观望或大幅降低仓位。\`;
  } else if (bt.expectancy <= 0) {
    riskEl.textContent = \`⚠️ 期望值为负（\${bt.expectancy}R），即使胜率\${bt.winRatePct}%，长期交易仍可能亏损，请谨慎。\`;
  } else {
    riskEl.textContent =
      \`进场 \${fmt(entry, tk)}，止损 \${fmt(stopLoss, tk)}，\` +
      \`目标一 \${fmt(target1, tk)} / 目标二 \${fmt(target2, tk)}。\` +
      \`历史胜率 \${bt.winRatePct}%（\${bt.total} 次信号，\${bt.wins} 次盈利），\` +
      \`期望值 \${bt.expectancy > 0 ? '+' : ''}\${bt.expectancy}R。\` +
      \`建议单笔风险不超过总资金 2%。\`;
  }
}

function clearPanel(suffix, msg) {
  document.getElementById(\`dir\${suffix}\`).textContent = msg;
  document.getElementById(\`dir\${suffix}\`).className   = 'sp-direction none';
  document.getElementById(\`wr\${suffix}\`).textContent  = '';
  ['Dir','Entry','Stop','T1_','T2_','Strength'].forEach(k => {
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

// ─── 加载状态 ─────────────────────────────────────────────────

function showLoading(text) {
  const bar = document.getElementById('loadingBar');
  bar.style.display = 'flex';
  const spinner = bar.querySelector('.loading-spinner');
  if (spinner) spinner.style.display = 'block';
  document.getElementById('loadingText').textContent = text;
}
function setLoadingText(text) {
  document.getElementById('loadingText').textContent = text;
}
function hideLoading() {
  document.getElementById('loadingBar').style.display = 'none';
}
function showError(msg) {
  const bar = document.getElementById('loadingBar');
  bar.style.display = 'flex';
  const spinner = bar.querySelector('.loading-spinner');
  if (spinner) spinner.style.display = 'none';
  document.getElementById('loadingText').textContent = '❌ ' + msg;
}

// ─── 工具函数 ─────────────────────────────────────────────────

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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

</script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  const u = require("url").parse(req.url, true);

  if (u.pathname === "/api/quote") {
    const code = u.query.code;
    if (!code) { res.writeHead(400); res.end("no code"); return; }
    proxy("https://hq.sinajs.cn/list=nf_" + code, res);
    return;
  }
  if (u.pathname === "/api/kline") {
    const code = u.query.code;
    const type = u.query.type || "15";
    if (!code) { res.writeHead(400); res.end("no code"); return; }
    proxy("https://stock2.finance.sina.com.cn/futures/api/jsonp.php/cb=/InnerFuturesNewService.getFewMinLine?symbol=" + code + "&type=" + type, res);
    return;
  }

  res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
  res.end(HTML);
});

function proxy(targetUrl, res) {
  https.get(targetUrl, {headers: {"Referer": "https://finance.sina.com.cn", "User-Agent": "Mozilla/5.0"}}, function(r) {
    var d = [];
    r.on("data", function(c){ d.push(c); });
    r.on("end", function(){
      res.writeHead(200, {"Content-Type": "text/plain; charset=utf-8", "Access-Control-Allow-Origin": "*"});
      res.end(Buffer.concat(d).toString());
    });
  }).on("error", function(){ res.writeHead(500); res.end("err"); });
}

server.listen(process.env.PORT || 3000, function(){ console.log("Server running"); });
