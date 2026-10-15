import React, { useMemo, useState } from 'react';
import { BarChart3, ChevronDown, Circle, FileText, FolderPlus, Grid2X2, Menu, PieChart, Printer, Settings, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { staticReportMenu, type StaticReportId } from './StaticMaterialReports';

type Props = { onBack: () => void; onOpenCustom: () => void; onOpenStatic: () => void; onOpenStaticReport: (reportId: StaticReportId) => void };
type Mode = 'month' | 'year';
type Metric = { boards: number; boardArea: number; pieces: number; pieceArea: number };
type SizeKey = '2.4' | '2.8' | '2.745' | '3.05' | 'other';
type SizeValues = Record<SizeKey, Metric>;
type ReportRow = { factory: string; line: string; stock: string; sizes: SizeValues };

const sizeGroups: { key: SizeKey; label: string }[] = [
  { key: '2.4', label: '2.4m 板材' },
  { key: '2.8', label: '2.8m 板材' },
  { key: '2.745', label: '2.745m 板材' },
  { key: '3.05', label: '3.05m 板材' },
  { key: 'other', label: '其它尺寸' },
];

const makeMetric = (boards: number, boardArea: number, pieces: number, pieceArea: number): Metric => ({ boards, boardArea, pieces, pieceArea });
const emptyMetric = (): Metric => makeMetric(0, 0, 0, 0);
const addMetric = (a: Metric, b: Metric): Metric => ({ boards: a.boards + b.boards, boardArea: a.boardArea + b.boardArea, pieces: a.pieces + b.pieces, pieceArea: a.pieceArea + b.pieceArea });
const sumMetrics = (metrics: Metric[]): Metric => metrics.reduce(addMetric, emptyMetric());

const reportRows: ReportRow[] = [
  { factory: '定制六厂', line: '合计', stock: 'RC54、RC27', sizes: { '2.4': makeMetric(820, 2_439.34, 11_260, 2_276.10), '2.8': makeMetric(216, 741.31, 3_188, 696.83), '2.745': makeMetric(98, 328.52, 1_384, 306.95), '3.05': makeMetric(125, 465.98, 1_739, 438.57), other: makeMetric(16, 43.74, 179, 38.66) } },
  { factory: '定制八厂', line: '合计', stock: 'RC29', sizes: { '2.4': makeMetric(604, 1_796.71, 8_044, 1_679.25), '2.8': makeMetric(180, 618.05, 2_533, 574.39), '2.745': makeMetric(62, 207.90, 934, 191.16), '3.05': makeMetric(83, 309.35, 1_202, 288.81), other: makeMetric(12, 32.78, 132, 28.50) } },
  { factory: '定制九厂', line: '15号IMA一楼', stock: 'RC75', sizes: { '2.4': makeMetric(442, 1_315.25, 5_982, 1_232.78), '2.8': makeMetric(119, 408.59, 1_768, 381.82), '2.745': makeMetric(54, 181.01, 804, 167.14), '3.05': makeMetric(62, 230.99, 876, 215.31), other: makeMetric(9, 24.59, 101, 21.37) } },
  { factory: '定制门板一厂', line: '吸塑线', stock: 'RC33', sizes: { '2.4': makeMetric(274, 815.62, 4_288, 762.17), '2.8': makeMetric(64, 219.80, 986, 204.31), '2.745': makeMetric(27, 90.54, 415, 84.65), '3.05': makeMetric(36, 134.10, 528, 125.22), other: makeMetric(4, 10.93, 45, 9.35) } },
  { factory: '定制门板二厂', line: '墙变线', stock: 'RC98', sizes: { '2.4': makeMetric(315, 938.04, 5_014, 876.35), '2.8': makeMetric(87, 298.81, 1_364, 278.52), '2.745': makeMetric(33, 110.62, 518, 102.37), '3.05': makeMetric(41, 152.73, 618, 142.58), other: makeMetric(6, 16.39, 69, 14.18) } },
  { factory: '定制十厂', line: '定制十厂A线', stock: 'RC88', sizes: { '2.4': makeMetric(386, 1_149.40, 5_443, 1_074.21), '2.8': makeMetric(102, 350.35, 1_512, 326.78), '2.745': makeMetric(41, 137.44, 614, 127.16), '3.05': makeMetric(53, 197.52, 753, 184.42), other: makeMetric(7, 19.12, 77, 16.53) } },
  { factory: '定制五A厂', line: '9号A线', stock: 'RC48', sizes: { '2.4': makeMetric(251, 747.20, 3_561, 698.42), '2.8': makeMetric(71, 243.76, 1_050, 227.11), '2.745': makeMetric(24, 80.46, 365, 74.47), '3.05': makeMetric(29, 108.15, 412, 101.09), other: makeMetric(3, 8.20, 34, 7.09) } },
];

const menuItems = [
  { label: '我的应用', icon: Grid2X2 }, { label: '分析看板', icon: BarChart3 }, { label: '报表中心', icon: FileText },
  { label: '电商运营', icon: PieChart }, { label: '配置中心', icon: Settings }, { label: '导入导出', icon: Printer },
  { label: '导入', icon: FolderPlus }, { label: '自定义报表配置', icon: SlidersHorizontal },
];

function totalForRow(row: ReportRow): Metric {
  return sumMetrics(sizeGroups.map(({ key }) => row.sizes[key]));
}

function utilization(metric: Metric): string {
  return metric.boardArea === 0 ? '-' : `${(metric.pieceArea / metric.boardArea * 100).toFixed(2)}%`;
}

function formatArea(value: number): string {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function MetricCells({ metric }: { metric: Metric }) {
  return <><td>{metric.boards.toLocaleString('zh-CN')}</td><td>{formatArea(metric.boardArea)}</td><td>{metric.pieces.toLocaleString('zh-CN')}</td><td>{formatArea(metric.pieceArea)}</td><td className="rate">{utilization(metric)}</td></>;
}

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const currentYear = String(now.getFullYear());

export default function BoardUtilizationReport({ onBack, onOpenCustom, onOpenStatic, onOpenStaticReport }: Props) {
  const [mode, setMode] = useState<Mode>('month');
  const [period, setPeriod] = useState(currentMonth);
  const [appliedMode, setAppliedMode] = useState<Mode>('month');
  const [appliedPeriod, setAppliedPeriod] = useState(currentMonth);
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [analysisMenuOpen, setAnalysisMenuOpen] = useState(false);
  const [sidebarMenuTop, setSidebarMenuTop] = useState(0);
  const [toast, setToast] = useState('');

  const totalMetric = useMemo(() => sumMetrics(reportRows.map(totalForRow)), []);
  const pageCount = Math.max(1, Math.ceil(reportRows.length / pageSize));
  const visibleRows = reportRows.slice((page - 1) * pageSize, page * pageSize);
  const rangeLabel = appliedMode === 'month' ? appliedPeriod.replace('-', ' 年 ') + ' 月' : `${appliedPeriod} 年全年`;

  const action = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1800); };
  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setPeriod(nextMode === 'month' ? currentMonth : currentYear);
  };
  const query = () => { if (!period) { action('请选择统计时间'); return; } setAppliedMode(mode); setAppliedPeriod(period); setPage(1); action('查询完成'); };
  const reset = () => { setMode('month'); setPeriod(currentMonth); setAppliedMode('month'); setAppliedPeriod(currentMonth); setPage(1); action('已重置'); };

  return <div className="ioc-shell board-utilization">
    <header className="topbar"><div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div><div className="topbar-main"><Menu size={17}/><div className="breadcrumb"><span>首页</span><b>/</b><strong>板材利用率统计报表</strong></div><div className="user-area"><UserRound size={15}/><span>王俊励</span><ChevronDown size={14}/></div></div></header>
    <div className="workspace">
      <aside className="sidebar" onMouseLeave={() => { setAnalysisMenuOpen(false); setReportMenuOpen(false); }}><div className="platform-title">IOC运营平台</div><nav>
        {menuItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={`nav-item ${label === '报表中心' && reportMenuOpen ? 'menu-active' : ''}`} onMouseEnter={event => { const top = event.currentTarget.closest('.sidebar')?.getBoundingClientRect().top || 0; setSidebarMenuTop(event.currentTarget.getBoundingClientRect().top - top); if (label === '报表中心') { setReportMenuOpen(true); setAnalysisMenuOpen(false); } else if (label === '分析看板') { setAnalysisMenuOpen(true); setReportMenuOpen(false); } else { setAnalysisMenuOpen(false); setReportMenuOpen(false); } }}><Icon size={17}/><span>{label}</span></button>)}
      </nav>{analysisMenuOpen && <div className="ioc-sidebar-menu" style={{ top: sidebarMenuTop }}><h3>分析看板</h3><div className="ioc-sidebar-menu-list"><button type="button" onClick={onOpenStatic}>静态材料处理跟踪分析</button></div></div>}{reportMenuOpen && <div className="ioc-sidebar-menu ioc-report-center-menu" style={{ top: sidebarMenuTop }}><section><h4>定制</h4><div className="ioc-sidebar-menu-list"><button type="button" onClick={onBack}>订单跟踪报表</button><button type="button" onClick={onOpenCustom}>定制接单打款销售统计报表</button><button type="button" className="selected" onClick={() => setReportMenuOpen(false)}>板材利用率统计报表</button></div></section><section><h4>静态材料分析</h4><div className="ioc-sidebar-menu-list">{staticReportMenu.map(item => <button type="button" key={item.id} onClick={() => onOpenStaticReport(item.id)}>{item.title}</button>)}</div></section></div>}</aside>
      <main className="main-area"><div className="tabbar"><div className="tab-close"><X size={18}/></div><div className="active-tab"><Circle size={8} fill="currentColor"/>板材利用率统计报表<X size={13}/></div></div>
        <div className="board-body">
          <section className="board-filter">
            <div className="period-mode" role="group" aria-label="统计周期"><button type="button" className={mode === 'month' ? 'active' : ''} onClick={() => changeMode('month')}>按月</button><button type="button" className={mode === 'year' ? 'active' : ''} onClick={() => changeMode('year')}>全年</button></div>
            <label className="period-input"><span>统计时间</span><input required type={mode === 'month' ? 'month' : 'number'} min={mode === 'year' ? '2000' : undefined} max={mode === 'year' ? '2100' : undefined} value={period} onChange={event => setPeriod(event.target.value)}/></label>
            <div className="board-actions"><button type="button" onClick={query}>查询</button><button type="button" className="secondary" onClick={reset}>重置</button></div>
          </section>
          <section className="board-table-panel">
            <div className="board-toolbar"><p><strong>统计口径</strong>：按分厂、产线、收货库位及板材尺寸汇总；利用率 = 工件面积 ÷ 领用面积 × 100%</p><span>数据更新时间：<b>2026-10-15 08:30:00</b></span></div>
            <div className="board-table-scroll"><table><thead><tr><th rowSpan={2}>分厂</th><th rowSpan={2}>产线</th><th rowSpan={2}>收货库位</th><th colSpan={5}>合计</th>{sizeGroups.map(group => <th key={group.key} colSpan={5}>{group.label}</th>)}</tr><tr>{Array.from({ length: 6 }, (_, groupIndex) => <React.Fragment key={groupIndex}><th>发板数量<br/>(张)</th><th>领用面积<br/>(m²)</th><th>工件数量<br/>(个)</th><th>工件面积<br/>(m²)</th><th>利用率<br/>(%)</th></React.Fragment>)}</tr></thead>
              <tbody>{visibleRows.map(row => <ReportTableRow key={`${row.factory}-${row.line}-${row.stock}`} row={row}/>)}</tbody>
              <tfoot><tr className="total"><th colSpan={3}>总合计</th><MetricCells metric={totalMetric}/>{sizeGroups.map(group => <MetricCells key={group.key} metric={sumMetrics(reportRows.map(row => row.sizes[group.key]))}/>)}</tr></tfoot>
            </table></div>
            <footer className="board-pagination"><span>统计周期：{rangeLabel}</span><span>共 {reportRows.length} 条</span><label>每页<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={20}>20 条</option><option value={50}>50 条</option><option value={100}>100 条</option></select></label><button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>上一页</button><span>{page} / {pageCount}</span><button type="button" disabled={page >= pageCount} onClick={() => setPage(value => Math.min(pageCount, value + 1))}>下一页</button><button type="button" className="export-button" onClick={() => action('原型演示：当前不生成导出文件')}><Printer size={14}/>导出</button></footer>
          </section>
        </div>
      </main>
    </div>{toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}

function ReportTableRow({ row }: { row: ReportRow }) {
  return <tr><td>{row.factory}</td><td>{row.line}</td><td>{row.stock}</td><MetricCells metric={totalForRow(row)}/>{sizeGroups.map(group => <MetricCells key={group.key} metric={row.sizes[group.key]}/>)}</tr>;
}
