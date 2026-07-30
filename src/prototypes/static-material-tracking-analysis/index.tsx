/**
 * @name 静态材料处理跟踪分析
 */
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Columns3,
  Download,
  FileSearch,
  FileText,
  Grid2X2,
  LayoutDashboard,
  Menu,
  PackageSearch,
  RefreshCcw,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import './style.css';

type ViewId = 'overview' | 'alerts' | 'after-sales' | 'details';
type DevType = '软体' | '板木' | '定制';
type FilterState = { dev: string; alert: string; plan: string; age: string; retention: string; keyword: string };
type MaterialRow = {
  code: string; name: string; dev: DevType; category: string; warehouse: string; reported: number; stock: number;
  plan: string; unit: string; ageMonths: number; age: string; retention: string; alert: number; reason: string;
  suggestion: string; staleDate: string; productionDate: string;
};

type Matrix = { rows: string[]; columns: string[]; values: number[][] };

const number = new Intl.NumberFormat('zh-CN');
const blankFilters: FilterState = { dev: '', alert: '', plan: '', age: '', retention: '', keyword: '' };

const devStats = [
  { name: '软体', value: 445, percent: 21.1, color: '#3b82c4' },
  { name: '板木', value: 272, percent: 12.9, color: '#d69a2d' },
  { name: '定制', value: 1394, percent: 66.0, color: '#1aa681' },
] as const;

const planStats = [
  { name: '留用/售后', value: 1553, percent: 73.6, color: '#168b72' },
  { name: '材料替换', value: 253, percent: 12.0, color: '#3b82c4' },
  { name: '采购处理', value: 140, percent: 6.6, color: '#d69a2d' },
  { name: '报废/变卖', value: 104, percent: 4.9, color: '#c85c54' },
  { name: '开发新品', value: 61, percent: 2.9, color: '#7767b4' },
] as const;

const alertStats = [
  { level: 1, name: '高危', value: 1884, color: '#c84d49' },
  { level: 2, name: '警报', value: 45, color: '#e37a2f' },
  { level: 3, name: '预警', value: 51, color: '#d5a51f' },
  { level: 6, name: '正常', value: 131, color: '#21947a' },
] as const;

const ageColumns = ['<6个月', '7-9个月', '10-12个月', '13-24个月', '24个月以上'];
const retentionRows = ['<10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'];

const alertMatrices: Record<DevType, Matrix> = {
  软体: { rows: retentionRows, columns: ageColumns, values: [[39,3,2,4,9],[0,0,1,6,2],[2,0,1,3,4],[0,3,1,4,3],[1,0,0,3,8],[0,1,2,4,7],[1,0,1,5,6],[3,2,1,4,7],[2,2,2,7,12],[114,31,41,46,45]] },
  板木: { rows: retentionRows, columns: ageColumns, values: [[73,5,3,2,0],[1,0,0,1,1],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,1,0],[1,2,0,0,0],[2,0,0,1,0],[3,0,0,1,0],[1,2,1,2,1],[103,22,18,13,7]] },
  定制: { rows: retentionRows, columns: ageColumns, values: [[10,16,7,15,6],[1,2,3,4,4],[5,8,0,6,5],[3,3,3,10,4],[3,2,4,5,5],[3,5,5,14,6],[9,9,4,16,11],[3,11,6,19,4],[7,20,8,42,15],[204,213,137,428,61]] },
};

const afterMatrices: Record<DevType, Matrix> = {
  软体: { rows: retentionRows, columns: ageColumns, values: [[33,3,1,1,3],[0,0,0,3,0],[2,0,1,3,2],[0,3,0,3,1],[0,0,0,2,2],[0,0,1,3,3],[1,0,1,1,3],[3,2,0,4,1],[2,2,2,5,2],[91,29,36,37,24]] },
  板木: { rows: retentionRows, columns: ageColumns, values: [[6,1,1,1,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,1,1],[0,0,0,0,0],[0,1,0,0,0],[1,0,0,0,0],[0,0,0,0,0],[1,2,0,2,1],[65,12,11,9,5]] },
  定制: { rows: retentionRows, columns: ageColumns, values: [[5,7,6,12,5],[1,2,3,3,4],[5,3,0,4,4],[2,2,2,10,4],[3,2,2,5,5],[3,5,5,13,5],[8,8,3,13,8],[2,11,5,18,4],[7,16,7,38,10],[156,147,124,344,54]] },
};

const materials: MaterialRow[] = [
  { code:'105010942', name:'LS-003铬色拉手孔距288mmTT', dev:'定制', category:'五金', warehouse:'定制区-1号总库定制呆滞库', reported:991, stock:991, plan:'留用/售后', unit:'支', ageMonths:71, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'由销售部做进包件配套消耗', staleDate:'2020/11/7', productionDate:'系统已无法查询' },
  { code:'126001424', name:'青古色LS-034拉手孔距128MM(TT)', dev:'定制', category:'五金', warehouse:'定制区-1号总库定制呆滞库', reported:190, stock:178, plan:'留用/售后', unit:'个', ageMonths:70, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'由销售部做进包件配套消耗', staleDate:'2020/12/3', productionDate:'系统已无法查询' },
  { code:'198008693', name:'M079-128咖啡红铜锌合金拉手', dev:'定制', category:'五金', warehouse:'定制区-1号总库定制呆滞库', reported:3424, stock:3120, plan:'留用/售后', unit:'个', ageMonths:70, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'进包件配套消耗', staleDate:'2020/12/3', productionDate:'2020/1/7' },
  { code:'205009815', name:'MX-203眉线立铣金刚石刀1/2*20*51.3', dev:'定制', category:'低耗', warehouse:'潜江呆滞材料库', reported:8, stock:8, plan:'留用/售后', unit:'把', ageMonths:58, age:'24个月以上', retention:'90-100%', alert:1, reason:'业务取消呆滞', suggestion:'产品未退市，按分厂需求发放', staleDate:'2021/12/3', productionDate:'2020/11/9' },
  { code:'118000310', name:'冷凝胶垫1780*2160*20mm(异型)', dev:'软体', category:'主材', warehouse:'羊马床垫总厂原材料库', reported:40, stock:40, plan:'留用/售后', unit:'张', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'暂时留用', staleDate:'2026/6/2', productionDate:'2025/10/16' },
  { code:'122015966', name:'45#星海竹炭乳胶1780*2180*20MM', dev:'软体', category:'主材', warehouse:'羊马床垫总厂原材料库', reported:4, stock:4, plan:'留用/售后', unit:'张', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'暂时留用', staleDate:'2026/6/2', productionDate:'-' },
  { code:'105020804', name:'通用沙发玫瑰金色蝴蝶装饰五金扣', dev:'软体', category:'辅料', warehouse:'软体材料总库呆滞区', reported:41, stock:41, plan:'留用/售后', unit:'个', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'售后使用', staleDate:'2026/6/2', productionDate:'2025/1/10' },
  { code:'116006173', name:'98032软床床边床尾中纤板240*70*61', dev:'软体', category:'内外架', warehouse:'软体材料总库内架区', reported:16, stock:16, plan:'材料替换', unit:'个', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'退板式分厂改用', staleDate:'2026/6/2', productionDate:'2025/11/28' },
  { code:'123022293', name:'600768-1-2储物单床体滑抽饰条A-15', dev:'板木', category:'辅料', warehouse:'五金总库呆滞库区', reported:1, stock:2, plan:'留用/售后', unit:'个', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'12分厂生产退回', suggestion:'售后再留用半年', staleDate:'2026/6/2', productionDate:'2026/2/5' },
  { code:'104004022', name:'867B#松巴樱桃木PVC封边带1.2*28mm', dev:'板木', category:'封边带', warehouse:'二分厂封边带库', reported:172.4, stock:200, plan:'材料替换', unit:'米', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'生产节约退库', suggestion:'替换相近颜色格板使用', staleDate:'2026/6/2', productionDate:'2026/2/5' },
  { code:'104006178', name:'0.5mm尤加利染色木皮(细直纹)YT', dev:'板木', category:'木皮', warehouse:'五金总库呆滞库区', reported:302.85, stock:302.85, plan:'留用/售后', unit:'平方米', ageMonths:37, age:'24个月以上', retention:'90-100%', alert:1, reason:'请购需求未使用完', suggestion:'替换餐桌面板打底使用', staleDate:'2023/9/3', productionDate:'系统已无法查询' },
  { code:'105024943', name:'可调节黑色五金脚柱120*40*(105-125)H', dev:'板木', category:'五金', warehouse:'五金总库呆滞库区', reported:70, stock:70, plan:'材料替换', unit:'个', ageMonths:11, age:'10-12个月', retention:'90-100%', alert:2, reason:'供大于需', suggestion:'板木分厂替换使用', staleDate:'2025/11/3', productionDate:'系统已无法查询' },
  { code:'105022473', name:'喷砂灰铝横梁L6000*W34.65*D17', dev:'定制', category:'铝材', warehouse:'定制材料呆滞库', reported:20, stock:19, plan:'留用/售后', unit:'支', ageMonths:35, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'高定物料随订单消耗', staleDate:'2023/11/3', productionDate:'2023/7/13' },
  { code:'105008320', name:'T4526-32拉手镀亮络(定制)YT', dev:'定制', category:'五金', warehouse:'1号总库定制呆滞库', reported:2806, stock:1882, plan:'采购处理', unit:'个', ageMonths:55, age:'24个月以上', retention:'60-70%', alert:2, reason:'供大于需', suggestion:'采购对接商家打折变卖', staleDate:'2021/12/3', productionDate:'2021/1/4' },
  { code:'105014235', name:'LS1910-160亮不锈钢深咖啡色皮质拉手', dev:'定制', category:'五金', warehouse:'1号总库定制呆滞库', reported:572, stock:32, plan:'报废/变卖', unit:'个', ageMonths:39, age:'24个月以上', retention:'<10%', alert:6, reason:'供大于需', suggestion:'申请二折促销处理', staleDate:'2023/3/3', productionDate:'2021/1/25' },
];

const columns = [
  ['code','物料编码'],['name','物料名称'],['dev','开发类型'],['category','材料类别'],['warehouse','库存地点'],['reported','提报呆滞时数据'],['stock','现库存数量'],['plan','处理方案'],['unit','单位'],['ageMonths','库龄（月）'],['retention','留存率'],['alert','警报级别'],['reason','静态原因'],['suggestion','处理意见'],['staleDate','呆滞提出时间'],
] as const;

const menuItems = [
  { label:'我的应用', icon:Grid2X2 }, { label:'分析看板', icon:BarChart3 }, { label:'报表中心', icon:FileText },
  { label:'材料管理', icon:Boxes }, { label:'配置中心', icon:Settings }, { label:'自定义报表', icon:SlidersHorizontal },
];

function AlertBadge({ level }: { level: number }) {
  const stat = alertStats.find((item) => item.level === level) || alertStats[3];
  return <span className={`alert-badge alert-${level}`}><i />{level}级 · {stat.name}</span>;
}

function MatrixView({ matrix, onSelect }: { matrix: Matrix; onSelect: (retention: string, age: string) => void }) {
  const max = Math.max(...matrix.values.flat());
  return <div className="matrix-scroll"><table className="risk-matrix">
    <thead><tr><th>留存率 \ 库龄</th>{matrix.columns.map((column) => <th key={column}>{column}</th>)}<th>合计</th></tr></thead>
    <tbody>{matrix.rows.map((row, rowIndex) => {
      const total = matrix.values[rowIndex].reduce((sum, value) => sum + value, 0);
      return <tr key={row}><th>{row}</th>{matrix.values[rowIndex].map((value, columnIndex) => {
        const intensity = max ? value / max : 0;
        return <td key={matrix.columns[columnIndex]}><button type="button" style={{ '--heat': intensity } as React.CSSProperties} onClick={() => onSelect(row, matrix.columns[columnIndex])} aria-label={`${row}、${matrix.columns[columnIndex]}：${value}项`}><strong>{value || '-'}</strong>{value > 0 && <span>{((value / 2111) * 100).toFixed(1)}%</span>}</button></td>;
      })}<td className="matrix-total">{total}</td></tr>;
    })}</tbody>
  </table></div>;
}

export default function StaticMaterialTrackingAnalysis() {
  const [view, setView] = useState<ViewId>('overview');
  const [draft, setDraft] = useState<FilterState>(blankFilters);
  const [applied, setApplied] = useState<FilterState>(blankFilters);
  const [matrixDev, setMatrixDev] = useState<DevType>('定制');
  const [drawerRow, setDrawerRow] = useState<MaterialRow | null>(null);
  const [columnMenu, setColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => new Set(columns.map(([key]) => key)));
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');

  const updateDraft = (key: keyof FilterState, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };

  const filteredRows = useMemo(() => materials.filter((row) => {
    const keyword = applied.keyword.trim().toLowerCase();
    return (!applied.dev || row.dev === applied.dev)
      && (!applied.alert || String(row.alert) === applied.alert)
      && (!applied.plan || row.plan === applied.plan)
      && (!applied.age || row.age === applied.age)
      && (!applied.retention || row.retention === applied.retention)
      && (!keyword || `${row.code}${row.name}${row.warehouse}${row.reason}`.toLowerCase().includes(keyword));
  }), [applied]);

  const estimatedTotal = useMemo(() => {
    let value = 2111;
    if (applied.dev) value *= (devStats.find((item) => item.name === applied.dev)?.value || 0) / 2111;
    if (applied.alert) value *= (alertStats.find((item) => String(item.level) === applied.alert)?.value || 0) / 2111;
    if (applied.plan) value *= (planStats.find((item) => item.name === applied.plan)?.value || 0) / 2111;
    if (applied.age || applied.retention || applied.keyword) value = filteredRows.length ? Math.max(filteredRows.length, Math.round(value * 0.08)) : 0;
    return Math.round(value);
  }, [applied, filteredRows.length]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  const runSearch = () => { setApplied({ ...draft }); setPage(1); showToast('查询完成，分析口径已更新'); };
  const reset = () => { setDraft(blankFilters); setApplied(blankFilters); setPage(1); setView('overview'); showToast('已恢复全部材料口径'); };
  const drillDown = (next: Partial<FilterState>) => { const filters = { ...blankFilters, ...next }; setDraft(filters); setApplied(filters); setPage(1); setView('details'); };
  const matrixDrill = (retention: string, age: string, plan = '') => drillDown({ dev: matrixDev, retention, age, plan });
  const toggleColumn = (key: string) => setVisibleColumns((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; });

  return <div className="ioc-shell material-analysis">
    <header className="topbar">
      <div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div>
      <div className="topbar-main"><div className="breadcrumb"><Menu size={16}/><b>IOC运营平台</b><span>›</span><strong>报表中心</strong><span>›</span><b>静态材料处理跟踪分析</b></div><div className="user-area"><UserRound size={15}/><span>王俊励</span><ChevronDown size={14}/></div></div>
    </header>
    <div className="workspace">
      <aside className="sidebar"><div className="platform-title">IOC运营平台</div><nav>{menuItems.map(({ label, icon: Icon }) => <button type="button" key={label} className={`nav-item ${label === '报表中心' ? 'menu-active' : ''}`}><Icon size={17}/><span>{label}</span></button>)}</nav></aside>
      <main className="main-area">
        <div className="tabbar"><span className="tab-close"><X size={14}/></span><span className="active-tab">静态材料处理跟踪分析<X size={12}/></span></div>
        <div className="analysis-content">
          <section className="analysis-heading"><div><h1>静态材料处理跟踪分析</h1><p>数据截止 2026 年 6 月 · 按物料编码计数</p></div><div className="heading-actions"><button type="button" className="ghost-button" onClick={() => showToast('数据口径已是最新版本')}><RefreshCcw size={14}/>刷新</button><button type="button" className="primary-button" onClick={() => showToast('已生成当前筛选条件的导出任务')}><Download size={14}/>导出</button></div></section>

          <section className="filter-strip" aria-label="全局筛选">
            <label><span>开发类型</span><select value={draft.dev} onChange={(event) => updateDraft('dev', event.target.value)}><option value="">全部</option>{devStats.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <label><span>警报级别</span><select value={draft.alert} onChange={(event) => updateDraft('alert', event.target.value)}><option value="">全部</option>{alertStats.map((item) => <option value={item.level} key={item.level}>{item.level}级 · {item.name}</option>)}</select></label>
            <label><span>处理方案</span><select value={draft.plan} onChange={(event) => updateDraft('plan', event.target.value)}><option value="">全部</option>{planStats.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <label><span>库龄</span><select value={draft.age} onChange={(event) => updateDraft('age', event.target.value)}><option value="">全部</option>{ageColumns.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="keyword-field"><span>物料</span><div><Search size={14}/><input value={draft.keyword} onChange={(event) => updateDraft('keyword', event.target.value)} placeholder="编码 / 名称 / 原因" /></div></label>
            <div className="filter-buttons"><button type="button" className="text-button" onClick={reset}>重置</button><button type="button" className="primary-button" onClick={runSearch}><Search size={14}/>查询</button></div>
          </section>

          <nav className="view-tabs" aria-label="分析视图">{[
            ['overview','总览',LayoutDashboard],['alerts','警报分析',ShieldAlert],['after-sales','留用售后',PackageSearch],['details','材料明细',FileSearch],
          ].map(([id,label,Icon]) => <button type="button" key={id as string} className={view === id ? 'active' : ''} onClick={() => setView(id as ViewId)}><Icon size={15}/>{label as string}</button>)}</nav>

          <div className="view-content">
            {view === 'overview' && <div className="overview-view">
              <section className="metric-grid">
                <button type="button" className="metric-card" onClick={() => drillDown({})}><span className="metric-icon total"><Boxes size={19}/></span><span><small>静态材料总项</small><strong>2,111</strong><em>项</em></span><p>软体、板木、定制</p></button>
                <button type="button" className="metric-card danger" onClick={() => drillDown({ alert:'1' })}><span className="metric-icon"><ShieldAlert size={19}/></span><span><small>1级高危</small><strong>1,884</strong><em>项</em></span><p>占全部材料 89.2%</p></button>
                <button type="button" className="metric-card warning" onClick={() => drillDown({ age:'24个月以上' })}><span className="metric-icon"><AlertTriangle size={19}/></span><span><small>24个月以上</small><strong>234</strong><em>项</em></span><p>定制类占比最高</p></button>
                <button type="button" className="metric-card service" onClick={() => drillDown({ plan:'留用/售后' })}><span className="metric-icon"><CircleGauge size={19}/></span><span><small>留用/售后</small><strong>1,553</strong><em>项</em></span><p>整体占比 73.6%</p></button>
              </section>

              <div className="overview-grid">
                <section className="panel dev-panel"><header><div><h2>开发类型分布</h2><p>按物料编码计数</p></div><span>合计 2,111</span></header><div className="stacked-bar" aria-label="开发类型占比">{devStats.map((item) => <button type="button" key={item.name} style={{ width:`${item.percent}%`, background:item.color }} onClick={() => drillDown({ dev:item.name })} title={`${item.name} ${item.value}项`} />)}</div><div className="distribution-list">{devStats.map((item) => <button type="button" key={item.name} onClick={() => drillDown({ dev:item.name })}><i style={{ background:item.color }}/><span>{item.name}</span><strong>{number.format(item.value)}</strong><em>{item.percent.toFixed(1)}%</em><ChevronRight size={14}/></button>)}</div></section>
                <section className="panel plan-panel"><header><div><h2>处理方案结构</h2><p>留用/售后为主要处置方向</p></div></header><div className="plan-bars">{planStats.map((item) => <button type="button" key={item.name} onClick={() => drillDown({ plan:item.name })}><span>{item.name}</span><div><i style={{ width:`${item.percent}%`, background:item.color }}/></div><strong>{number.format(item.value)}</strong><em>{item.percent.toFixed(1)}%</em></button>)}</div></section>
                <section className="panel focus-panel"><header><div><h2>风险关注</h2><p>优先跟进高留存、长库龄材料</p></div><button type="button" onClick={() => setView('alerts')}>查看矩阵<ChevronRight size={14}/></button></header><div className="focus-list"><button type="button" onClick={() => drillDown({ dev:'定制', alert:'1' })}><span className="focus-rank red">1</span><div><strong>定制 · 1级高危</strong><p>24个月以上且留存率 90-100% 集中</p></div><em>61 项</em></button><button type="button" onClick={() => drillDown({ dev:'软体', plan:'留用/售后' })}><span className="focus-rank orange">2</span><div><strong>软体 · 留用/售后</strong><p>专项材料占软体总项 71.0%</p></div><em>316 项</em></button><button type="button" onClick={() => drillDown({ dev:'板木', plan:'材料替换' })}><span className="focus-rank yellow">3</span><div><strong>板木 · 材料替换</strong><p>替换方案占板木总项 44.5%</p></div><em>121 项</em></button></div></section>
              </div>
            </div>}

            {view === 'alerts' && <div className="matrix-view"><div className="matrix-header"><div><h2>警报二维分析</h2><p>留存率与库龄交叉分布，点击单元格查看对应材料</p></div><div className="segmented-control">{devStats.map((item) => <button type="button" className={matrixDev === item.name ? 'active' : ''} key={item.name} onClick={() => setMatrixDev(item.name)}>{item.name}<span>{number.format(item.value)}</span></button>)}</div></div><div className="matrix-layout"><section className="panel matrix-panel"><MatrixView matrix={alertMatrices[matrixDev]} onSelect={(retention,age) => matrixDrill(retention,age)} /><footer><span><i className="heat-low"/>低</span><span><i className="heat-mid"/>中</span><span><i className="heat-high"/>高</span><em>颜色表示该开发类型中的相对集中度</em></footer></section><aside className="rule-panel"><h3>警报规则</h3>{alertStats.map((item) => <div key={item.level}><AlertBadge level={item.level}/><strong>{number.format(item.value)} 项</strong></div>)}<p>最终等级由库龄级别与留存率级别共同计算。1级优先跟进，6级为正常。</p></aside></div></div>}

            {view === 'after-sales' && <div className="after-view"><section className="after-summary"><div><span className="metric-icon service"><PackageSearch size={20}/></span><p>留用/售后材料</p><strong>1,553</strong><em>项 · 占全部材料 73.6%</em></div>{[{name:'软体',value:316,p:'71.0%'},{name:'板木',value:122,p:'44.9%'},{name:'定制',value:1115,p:'80.0%'}].map((item) => <button type="button" key={item.name} onClick={() => {setMatrixDev(item.name as DevType); drillDown({dev:item.name,plan:'留用/售后'});}}><span>{item.name}</span><strong>{number.format(item.value)}</strong><em>{item.p}</em><ChevronRight size={14}/></button>)}</section><div className="matrix-header compact"><div><h2>留用/售后风险矩阵</h2><p>按开发类型查看专项材料的库龄与留存率分布</p></div><div className="segmented-control">{devStats.map((item) => <button type="button" className={matrixDev === item.name ? 'active' : ''} key={item.name} onClick={() => setMatrixDev(item.name)}>{item.name}</button>)}</div></div><section className="panel matrix-panel"><MatrixView matrix={afterMatrices[matrixDev]} onSelect={(retention,age) => matrixDrill(retention,age,'留用/售后')} /></section></div>}

            {view === 'details' && <div className="details-view"><section className="detail-toolbar"><div><strong>材料明细</strong><span>共 {number.format(estimatedTotal)} 项</span><em>当前表格展示 Excel 代表性脱敏数据</em></div><div className="toolbar-actions"><div className="column-control"><button type="button" className="ghost-button" onClick={() => setColumnMenu(!columnMenu)}><Columns3 size={14}/>列设置</button>{columnMenu && <div className="column-popover"><header><strong>显示字段</strong><button type="button" onClick={() => setColumnMenu(false)}><X size={14}/></button></header>{columns.map(([key,label]) => <label key={key}><input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleColumn(key)}/><span>{label}</span></label>)}</div>}</div><button type="button" className="primary-button" onClick={() => showToast('已生成当前筛选条件的导出任务')}><Download size={14}/>导出</button></div></section><section className="detail-table-panel"><div className="detail-table-scroll"><table><thead><tr><th className="sticky-action">操作</th>{columns.filter(([key]) => visibleColumns.has(key)).map(([key,label]) => <th key={key} className={`col-${key}`}>{label}</th>)}</tr></thead><tbody>{pageRows.length ? pageRows.map((row) => <tr key={row.code}><td className="sticky-action"><button type="button" onClick={() => setDrawerRow(row)}>查看</button></td>{columns.filter(([key]) => visibleColumns.has(key)).map(([key]) => { const raw = row[key as keyof MaterialRow]; const value = typeof raw === 'number' && !['alert','ageMonths'].includes(key) ? number.format(raw) : raw; return <td key={key} title={String(value)} className={`col-${key}`}>{key === 'alert' ? <AlertBadge level={Number(raw)}/> : value}</td>; })}</tr>) : <tr><td colSpan={visibleColumns.size + 1} className="empty-state"><FileSearch size={32}/><strong>未找到匹配材料</strong><p>请调整筛选条件后重新查询</p><button type="button" onClick={reset}>重置筛选</button></td></tr>}</tbody></table></div><footer className="pagination"><span>第 {page} / {pageCount} 页</span><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1,value-1))}><ChevronLeft size={15}/></button>{Array.from({length:pageCount},(_,index) => index+1).map((item) => <button type="button" className={page === item ? 'current' : ''} key={item} onClick={() => setPage(item)}>{item}</button>)}<button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount,value+1))}><ChevronRight size={15}/></button></footer></section></div>}
          </div>
        </div>
      </main>
    </div>

    <div className="watermark-layer" aria-hidden="true">{Array.from({length:90},(_,index) => <span key={index}>QY-00260959　王俊励　2026-07-30</span>)}</div>
    {drawerRow && <div className="drawer-backdrop" onMouseDown={(event) => {if(event.target === event.currentTarget) setDrawerRow(null);}}><aside className="detail-drawer" aria-label="材料详情"><header><div><span>材料详情</span><strong>{drawerRow.code}</strong></div><button type="button" onClick={() => setDrawerRow(null)} aria-label="关闭"><X size={18}/></button></header><section className="drawer-identity"><div><Boxes size={22}/></div><span><strong>{drawerRow.name}</strong><p>{drawerRow.dev} · {drawerRow.category} · {drawerRow.plan}</p></span><AlertBadge level={drawerRow.alert}/></section><section><h3>库存与风险</h3><dl><div><dt>提报呆滞时数据</dt><dd>{number.format(drawerRow.reported)} {drawerRow.unit}</dd></div><div><dt>现库存数量</dt><dd>{number.format(drawerRow.stock)} {drawerRow.unit}</dd></div><div><dt>库龄</dt><dd>{drawerRow.ageMonths} 个月（{drawerRow.age}）</dd></div><div><dt>留存率</dt><dd>{drawerRow.retention}</dd></div><div className="wide"><dt>库存地点</dt><dd>{drawerRow.warehouse}</dd></div></dl></section><section><h3>处置事实</h3><dl><div><dt>静态原因</dt><dd>{drawerRow.reason}</dd></div><div><dt>呆滞提出时间</dt><dd>{drawerRow.staleDate}</dd></div><div className="wide"><dt>处理意见</dt><dd>{drawerRow.suggestion}</dd></div><div className="wide"><dt>材料生产日期</dt><dd>{drawerRow.productionDate}</dd></div></dl></section><footer><button type="button" className="ghost-button" onClick={() => setDrawerRow(null)}>关闭</button><button type="button" className="primary-button" onClick={() => showToast('已复制物料编码')}>复制物料编码</button></footer></aside></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}