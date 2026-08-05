/**
 * @name 静态材料处理跟踪分析 */
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
  FolderPlus,
  FileSearch,
  FileText,
  Grid2X2,
  LayoutDashboard,
  Menu,
  PackageSearch,
  PieChart,
  Printer,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import './static-material-analysis.css';
import '../shared/ioc-navigation.css';

type ViewId = 'overview' | 'alerts' | 'after-sales' | 'details';
type DevType = '软体' | '板木' | '定制';
type FilterState = { dev: string; alert: string; plan: string; age: string; retention: string[]; month: string; keyword: string };
type MaterialRow = {
  code: string; name: string; dev: DevType; category: string; warehouse: string; reported: number; stock: number;
  plan: string; unit: string; ageMonths: number; age: string; retention: string; alert: number; reason: string;
  suggestion: string; staleDate: string; productionDate: string;
};

type Matrix = { rows: string[]; columns: string[]; values: number[][] };

const number = new Intl.NumberFormat('zh-CN');
const formatRetention = (stock: number, reported: number) => (reported ? (stock / reported) * 100 : 0).toFixed(2) + '%';
const blankFilters: FilterState = { dev: '', alert: '', plan: '', age: '', retention: [], month: '2026-06', keyword: '' };

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
const planAlertByDev = {
  '全部': { total: 2111, age24: 234, rows: [
    { name:'留用/售后', total:1553, alerts:[1441,32,28,52] },
    { name:'材料替换', total:253, alerts:[158,6,18,71] },
    { name:'采购处理', total:140, alerts:[122,6,5,7] },
    { name:'报废/变卖', total:104, alerts:[103,1,0,0] },
    { name:'开发新品', total:61, alerts:[60,0,0,1] },
  ]},
  '软体': { total: 445, age24: 103, rows: [
    { name:'留用/售后', total:316, alerts:[272,3,6,35] },
    { name:'材料替换', total:54, alerts:[44,4,1,5] },
    { name:'采购处理', total:4, alerts:[3,1,0,0] },
    { name:'报废/变卖', total:15, alerts:[15,0,0,0] },
    { name:'开发新品', total:56, alerts:[55,0,0,1] },
  ]},
  '板木': { total: 272, age24: 10, rows: [
    { name:'留用/售后', total:122, alerts:[112,3,1,6] },
    { name:'材料替换', total:121, alerts:[54,0,5,62] },
    { name:'采购处理', total:26, alerts:[15,4,1,6] },
    { name:'报废/变卖', total:2, alerts:[2,0,0,0] },
    { name:'开发新品', total:1, alerts:[1,0,0,0] },
  ]},
  '定制': { total: 1394, age24: 121, rows: [
    { name:'留用/售后', total:1115, alerts:[1057,26,21,11] },
    { name:'材料替换', total:78, alerts:[60,2,12,4] },
    { name:'采购处理', total:110, alerts:[104,1,4,1] },
    { name:'报废/变卖', total:87, alerts:[86,1,0,0] },
    { name:'开发新品', total:4, alerts:[4,0,0,0] },
  ]},
} as const;

const alertStats = [
  { level: 1, name: '高危', value: 1884, color: '#c84d49' },
  { level: 2, name: '警报', value: 45, color: '#e37a2f' },
  { level: 3, name: '预警', value: 51, color: '#d5a51f' },
  { level: 6, name: '正常', value: 131, color: '#21947a' },
] as const;

const ageColumns = ['<6个月', '7-9个月', '10-12个月', '13-24个月', '24个月以上'];
const retentionRows = ['<10%', '10-20%', '20-30%', '30-40%', '40-50%', '50-60%', '60-70%', '70-80%', '80-90%', '90-100%'];
const monthOptions = ['2026-06', '2026-02', '2025-11', '2023-11', '2023-09', '2023-03', '2021-12', '2021-01', '2020-12', '2020-11'];
const monthLabel = (month) => month;

const alertMatrices: Record<DevType, Matrix> = {
  '软体': { rows: retentionRows, columns: ageColumns, values: [[39,3,2,4,9],[0,0,1,6,2],[2,0,1,3,4],[0,3,1,4,3],[1,0,0,3,8],[0,1,2,4,7],[1,0,1,5,6],[3,2,1,4,7],[2,2,2,7,12],[114,31,41,46,45]] },
  '板木': { rows: retentionRows, columns: ageColumns, values: [[73,5,3,2,0],[1,0,0,1,1],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,1,0],[1,2,0,0,0],[2,0,0,1,0],[3,0,0,1,0],[1,2,1,2,1],[103,22,18,13,7]] },
  '定制': { rows: retentionRows, columns: ageColumns, values: [[10,16,7,15,6],[1,2,3,4,4],[5,8,0,6,5],[3,3,3,10,4],[3,2,4,5,5],[3,5,5,14,6],[9,9,4,16,11],[3,11,6,19,4],[7,20,8,42,15],[204,213,137,428,61]] },
};

const afterMatrices: Record<DevType, Matrix> = {
  '软体': { rows: retentionRows, columns: ageColumns, values: [[33,3,1,1,3],[0,0,0,3,0],[2,0,1,3,2],[0,3,0,3,1],[0,0,0,2,2],[0,0,1,3,3],[1,0,1,1,3],[3,2,0,4,1],[2,2,2,5,2],[91,29,36,37,24]] },
  '板木': { rows: retentionRows, columns: ageColumns, values: [[6,1,1,1,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,1,1],[0,0,0,0,0],[0,1,0,0,0],[1,0,0,0,0],[0,0,0,0,0],[1,2,0,2,1],[65,12,11,9,5]] },
  '定制': { rows: retentionRows, columns: ageColumns, values: [[5,7,6,12,5],[1,2,3,3,4],[5,3,0,4,4],[2,2,2,10,4],[3,2,2,5,5],[3,5,5,13,5],[8,8,3,13,8],[2,11,5,18,4],[7,16,7,38,10],[156,147,124,344,54]] },
};

const materials: MaterialRow[] = [
  { code:'105010942', name:'LS-003银色拉手孔距288mmTT', dev:'定制', category:'五金', warehouse:'定制区1号总库定制呆滞库', reported:991, stock:991, plan:'留用/售后', unit:'张', ageMonths:71, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'由销售部做进包件配套消化', staleDate:'2020/11/7', productionDate:'系统已无法查询' },
  { code:'126001424', name:'青古色LS-034拉手孔距128MM(TT)', dev:'定制', category:'五金', warehouse:'定制区1号总库定制呆滞库', reported:190, stock:178, plan:'留用/售后', unit:'个', ageMonths:70, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'由销售部做进包件配套消化', staleDate:'2020/12/3', productionDate:'系统已无法查询' },
  { code:'198008693', name:'M079-128咖啡红铜锌合金拉手', dev:'定制', category:'五金', warehouse:'定制区1号总库定制呆滞库', reported:3424, stock:3120, plan:'留用/售后', unit:'个', ageMonths:70, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'进包件配套消化', staleDate:'2020/12/3', productionDate:'2020/1/7' },
  { code:'205009815', name:'MX-203眉线立铣金刚石刀1/2*20*51.3', dev:'定制', category:'低值', warehouse:'潜江呆滞材料库', reported:8, stock:8, plan:'留用/售后', unit:'把', ageMonths:58, age:'24个月以上', retention:'90-100%', alert:1, reason:'业务取消呆滞', suggestion:'产品未退市，按分厂需求发放', staleDate:'2021/12/3', productionDate:'2020/11/9' },
  { code:'118000310', name:'冷凝胶垫1780*2160*20mm(异型)', dev:'软体', category:'主材', warehouse:'羊马床垫总厂原材料库', reported:40, stock:40, plan:'留用/售后', unit:'把', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'暂时留用', staleDate:'2026/6/2', productionDate:'2025/10/16' },
  { code:'122015966', name:'45#星海竹炭乳胶1780*2180*20MM', dev:'软体', category:'主材', warehouse:'羊马床垫总厂原材料库', reported:4, stock:4, plan:'留用/售后', unit:'把', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'暂时留用', staleDate:'2026/6/2', productionDate:'-' },
  { code:'105020804', name:'通用沙发玫瑰金色蝴蝶装饰五金把', dev:'软体', category:'辅料', warehouse:'软体材料总库呆滞库', reported:41, stock:41, plan:'留用/售后', unit:'个', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'售后使用', staleDate:'2026/6/2', productionDate:'2025/1/10' },
  { code:'116006173', name:'98032软床床边床尾中纤把40*70*61', dev:'软体', category:'内外架', warehouse:'软体材料总库内架区', reported:16, stock:16, plan:'材料替换', unit:'个', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'退板式分厂改用', staleDate:'2026/6/2', productionDate:'2025/11/28' },
  { code:'123022293', name:'600768-1-2储物单床体滑抽饰条A-15', dev:'板木', category:'辅料', warehouse:'五金总库呆滞库区', reported:1, stock:2, plan:'留用/售后', unit:'个', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'12分厂生产退回', suggestion:'售后再留用半年', staleDate:'2026/6/2', productionDate:'2026/2/5' },
  { code:'104004022', name:'867B#松巴樱桃木PVC封边带1.2*28mm', dev:'板木', category:'封边带', warehouse:'二分厂封边带库', reported:172.4, stock:200, plan:'材料替换', unit:'米', ageMonths:4, age:'<6个月', retention:'90-100%', alert:1, reason:'生产节约退库', suggestion:'替换相近颜色格板使用', staleDate:'2026/6/2', productionDate:'2026/2/5' },
  { code:'104006178', name:'0.5mm尤加利染色木把细直把YT', dev:'板木', category:'木皮', warehouse:'五金总库呆滞库区', reported:302.85, stock:302.85, plan:'留用/售后', unit:'骞虫柟米', ageMonths:37, age:'24个月以上', retention:'90-100%', alert:1, reason:'请购需求未使用把', suggestion:'替换餐桌面板打底使用', staleDate:'2023/9/3', productionDate:'系统已无法查询' },
  { code:'105024943', name:'可调节黑色五金脚把20*40*(105-125)H', dev:'板木', category:'五金', warehouse:'五金总库呆滞库区', reported:70, stock:70, plan:'材料替换', unit:'个', ageMonths:11, age:'10-12个月', retention:'90-100%', alert:2, reason:'供大于需', suggestion:'板木分厂替换使用', staleDate:'2025/11/3', productionDate:'系统已无法查询' },
  { code:'105022473', name:'喷砂灰铝横梁L6000*W34.65*D17', dev:'定制', category:'铝材', warehouse:'定制材料呆滞库', reported:20, stock:19, plan:'留用/售后', unit:'张', ageMonths:35, age:'24个月以上', retention:'90-100%', alert:1, reason:'供大于需', suggestion:'高定物料随订单消化', staleDate:'2023/11/3', productionDate:'2023/7/13' },
  { code:'105008320', name:'T4526-32拉手镀亮络(定制)YT', dev:'定制', category:'五金', warehouse:'1号总库定制呆滞把', reported:2806, stock:1882, plan:'采购处理', unit:'个', ageMonths:55, age:'24个月以上', retention:'60-70%', alert:2, reason:'供大于需', suggestion:'采购对接商家打折变卖', staleDate:'2021/12/3', productionDate:'2021/1/4' },
  { code:'105014235', name:'LS1910-160亮不锈钢深咖啡色皮质拉手', dev:'定制', category:'五金', warehouse:'1号总库定制呆滞把', reported:572, stock:32, plan:'报废/变卖', unit:'个', ageMonths:39, age:'24个月以上', retention:'<10%', alert:6, reason:'供大于需', suggestion:'申请二折促销处理', staleDate:'2023/3/3', productionDate:'2021/1/25' },
];

const columns = [
  ['code','物料编码'],['name','物料名称'],['dev','开发类型'],['category','材料类别'],['warehouse','库存地点'],['reported','提报呆滞时数据'],['stock','现库存数量'],['plan','处理方案'],['unit','单位'],['ageMonths','库龄（月）'],['retention','留存率'],['alert','警报级别'],['reason','静态原因'],['suggestion','处理意见'],['staleDate','呆滞提出时间'],
] as const;

const menuItems = [
  { label:'我的应用', icon:Grid2X2 }, { label:'分析看板', icon:BarChart3 }, { label:'报表中心', icon:FileText },
  { label:'电商运营', icon:PieChart }, { label:'配置中心', icon:Settings }, { label:'导入导出', icon:Printer },
  { label:'导入', icon:FolderPlus }, { label:'自定义报表配置', icon:SlidersHorizontal },
];

function AlertBadge({ level }: { level: number }) {
  const stat = alertStats.find((item) => item.level === level) || alertStats[3];
  return <span className={`alert-badge alert-${level}`}><i />{level}级 · {stat.name}</span>;
}

function MatrixView({ matrix, onSelect, total = 2111 }: { matrix: Matrix; onSelect: (retention: string, age: string) => void; total?: number }) {
  const max = Math.max(...matrix.values.flat());
  const columnTotals = matrix.columns.map((_, columnIndex) => matrix.values.reduce((sum, row) => sum + row[columnIndex], 0));
  const grandTotal = columnTotals.reduce((sum, value) => sum + value, 0);
  return <div className="matrix-scroll"><table className="risk-matrix">
    <thead><tr><th className="matrix-axis-heading"><span>留存率</span><i>/</i><span>库龄</span></th>{matrix.columns.map((column) => <th key={column}>{column}</th>)}<th>合计</th></tr></thead>
    <tbody>{matrix.rows.map((row, rowIndex) => {
      const total = matrix.values[rowIndex].reduce((sum, value) => sum + value, 0);
      return <tr key={row}><th>{row}</th>{matrix.values[rowIndex].map((value, columnIndex) => {
        const intensity = max ? value / max : 0;
        return <td key={matrix.columns[columnIndex]}><button type="button" style={{ '--heat': intensity } as React.CSSProperties} onClick={() => onSelect(row, matrix.columns[columnIndex])} aria-label={row + " " + matrix.columns[columnIndex] + " " + value}><strong>{value || '-'}</strong>{value > 0 && <span>{((value / Math.max(total, 1)) * 100).toFixed(1)}%</span>}</button></td>;
      })}<td className="matrix-total">{total}</td></tr>;
    })}</tbody>
    <tfoot><tr><th>合计</th>{columnTotals.map((value, index) => <td key={matrix.columns[index]}>{number.format(value)}</td>)}<td>{number.format(grandTotal)}</td></tr></tfoot>
  </table></div>;
}

type StaticMaterialProps = { embedded?: boolean };

export default function StaticMaterialTrackingAnalysis({ embedded = false }: StaticMaterialProps) {
  const [view, setView] = useState<ViewId>('overview');
  const [draft, setDraft] = useState<FilterState>(blankFilters);
  const [applied, setApplied] = useState<FilterState>(blankFilters);
  const [matrixDev, setMatrixDev] = useState<DevType | '全部'>('全部');
  const [drawerRow, setDrawerRow] = useState<MaterialRow | null>(null);
  const [columnMenu, setColumnMenu] = useState(false);
  const [retentionMenu, setRetentionMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => new Set(columns.map(([key]) => key)));
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [hoveredSegment, setHoveredSegment] = useState<{ name: string; level: number; value: number; total: number } | null>(null);
  const [chartAlertLevel, setChartAlertLevel] = useState<number | ''>('');
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const [trendMode, setTrendMode] = useState<'unprocessed' | 'submitted' | 'completed'>('unprocessed');
  const [analysisMode, setAnalysisMode] = useState<'alert' | 'plan'>('alert');
  const [analysisMenuOpen, setAnalysisMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  const updateDraft = (key: keyof FilterState, value: string) => setDraft((current) => ({ ...current, [key]: value } as FilterState));
  const toggleRetention = (value: string) => setDraft((current) => ({ ...current, retention: current.retention.includes(value) ? current.retention.filter((item) => item !== value) : [...current.retention, value] }));
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };

  const filteredRows = useMemo(() => materials.filter((row) => {
    const keyword = applied.keyword.trim().toLowerCase();
    return (!applied.dev || row.dev === applied.dev)
      && (!applied.alert || String(row.alert) === applied.alert)
      && (!applied.plan || row.plan === applied.plan)
      && (!applied.age || row.age === applied.age)
      && (!applied.retention.length || applied.retention.includes(row.retention))       && (!keyword || (row.code + row.name + row.warehouse + row.reason).toLowerCase().includes(keyword));
  }), [applied]);

  const estimatedTotal = useMemo(() => {
    let value = 2111;
    if (applied.dev) value *= (devStats.find((item) => item.name === applied.dev)?.value || 0) / 2111;
    if (applied.alert) value *= (alertStats.find((item) => String(item.level) === applied.alert)?.value || 0) / 2111;
    if (applied.plan) value *= (planStats.find((item) => item.name === applied.plan)?.value || 0) / 2111;
    if (applied.age || applied.retention.length || applied.month || applied.keyword) value = filteredRows.length ? Math.max(filteredRows.length, Math.round(value * 0.08)) : 0;
    return Math.round(value);
  }, [applied, filteredRows.length]);

  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const overviewKey = (applied.dev || '全部') as keyof typeof planAlertByDev;
  const overviewData = planAlertByDev[overviewKey];
  const retentionSelectionIndices = applied.retention.length ? applied.retention.map((item) => retentionRows.indexOf(item)).filter((index) => index >= 0) : [6, 7, 8, 9];
  const retentionRangeStart = Math.min(...retentionSelectionIndices);
  const retentionRangeEnd = Math.max(...retentionSelectionIndices);
  const retentionStartNumbers = retentionRows[retentionRangeStart].match(/\d+/g)?.map(Number) || [0];
  const retentionEndNumbers = retentionRows[retentionRangeEnd].match(/\d+/g)?.map(Number) || [100];  const retentionRangeText = String(retentionRangeStart === 0 ? 0 : retentionStartNumbers[0]) + "%~" + String(retentionEndNumbers[retentionEndNumbers.length - 1]) + "%";
  const retentionRangeValues = retentionRows.slice(retentionRangeStart, retentionRangeEnd + 1);
  const retentionRangeMatrices = applied.dev ? [alertMatrices[applied.dev as DevType]] : Object.values(alertMatrices);
  const retentionRangeTotal = retentionRangeMatrices.reduce((matrixSum, matrix) => matrixSum + matrix.values.slice(retentionRangeStart, retentionRangeEnd + 1).reduce((rowSum, row) => rowSum + row.reduce((sum, value) => sum + value, 0), 0), 0);
  const matrixScope = applied.dev ? [alertMatrices[applied.dev as DevType]] : Object.values(alertMatrices);
  const matrixTotal = matrixScope.reduce((sum, matrix) => sum + matrix.values.flat().reduce((rowSum, value) => rowSum + value, 0), 0);
  const ageIndex = applied.age ? ageColumns.indexOf(applied.age) : -1;
  const ageRatio = ageIndex >= 0 ? matrixScope.reduce((sum, matrix) => sum + matrix.values.reduce((rowSum, row) => rowSum + row[ageIndex], 0), 0) / matrixTotal : 1;
  const retentionRatio = applied.retention.length ? retentionRangeTotal / matrixTotal : 1;
  const monthRatio = applied.month !== '2026-06' ? .86 : 1;
  const keywordRatio = applied.keyword.trim() ? .58 : 1;
  const secondaryRatio = ageRatio * retentionRatio * monthRatio * keywordRatio;
  const visibleAlertDescriptors = alertStats.filter((item) => (!applied.alert || String(item.level) === applied.alert) && (chartAlertLevel === '' || item.level === chartAlertLevel));
  const chartRows = overviewData.rows.filter((row) => !applied.plan || row.name === applied.plan).map((row) => {
    const alerts = row.alerts.map((value, index) => visibleAlertDescriptors.some((item) => item.level === alertStats[index].level) ? Math.round(value * secondaryRatio) : 0);
    return { name: row.name, alerts, total: alerts.reduce((sum, value) => sum + value, 0) };
  });
  const filteredTotal = chartRows.reduce((sum, row) => sum + row.total, 0);
  const chartMax = Math.max(...chartRows.map((row) => row.total), 1);
  const activeAlert = alertStats.find((item) => String(item.level) === applied.alert) || alertStats[0];
  const activeAlertIndex = alertStats.findIndex((item) => item.level === activeAlert.level);
  const alertMetricTotal = chartRows.reduce((sum, row) => sum + row.alerts[activeAlertIndex], 0);
  const age24Index = ageColumns.indexOf('24个月以上');
  const age24Ratio = matrixScope.reduce((sum, matrix) => sum + matrix.values.reduce((rowSum, row) => rowSum + row[age24Index], 0), 0) / matrixTotal;
  const ageMetricTotal = applied.age ? filteredTotal : Math.round(filteredTotal * age24Ratio);
  const retentionMetricTotal = applied.retention.length ? filteredTotal : Math.round(filteredTotal * (retentionRangeTotal / matrixTotal));
  const activePlan = applied.plan || '留用/售后';
  const overviewContext = applied.dev || '全部开发类型' ;
  const planMetricTotal = chartRows.find((row) => row.name === activePlan)?.total || 0;
  const zeroStockTotal = Math.round(filteredTotal * 141 / 2111);
  const unprocessedTotal = Math.max(0, filteredTotal - zeroStockTotal);
  const trendData = useMemo(() => {
    const factors = [0.970, 0.976, 0.982, 0.988, 0.994, 1];
    const submittedCurrentMonth = filteredRows.filter((row) => row.staleDate.startsWith('2026/6/')).length;
    const submitted = [Math.max(0, submittedCurrentMonth - 2), Math.max(0, submittedCurrentMonth - 2), Math.max(0, submittedCurrentMonth - 1), Math.max(0, submittedCurrentMonth - 1), submittedCurrentMonth, submittedCurrentMonth];
    const completed = [96, 102, 108, 115, 121, 128].map((value) => Math.round(value * filteredTotal / 2111));
    return ['2026/01', '2026/02', '2026/03', '2026/04', '2026/05', '2026/06'].map((month, index) => ({ month, unprocessed: Math.round(unprocessedTotal * factors[index]), submitted: submitted[index], completed: completed[index] }));
  }, [filteredRows, filteredTotal, unprocessedTotal]);
  const activeTrendData = trendData.map((item) => ({ month: item.month, value: trendMode === 'unprocessed' ? item.unprocessed : trendMode === 'submitted' ? item.submitted : item.completed }));
  const trendMax = Math.max(...activeTrendData.map((item) => item.value), 1);
  const trendMeta = trendMode === 'unprocessed'
    ? { title: '每月待处理数量趋势', description: '总量扣除库存为 0 的材料项数，前 5 个月为小幅模拟趋势', legend: '未处理完材料项数' }
    : trendMode === 'submitted'
      ? { title: '每月新提出数量趋势', description: '按材料呆滞提出时间统计，6 月按当前筛选结果计把', legend: '当月新提出数量' }
      : { title: '每月处理完成数量趋势', description: '当月将现库存数量处理为 0 的材料项数，当前为模拟数据', legend: '当月处理完成数量（模拟）' };
  const aggregateMatrix = (matrices: Record<DevType, Matrix>): Matrix => ({ rows: retentionRows, columns: ageColumns, values: retentionRows.map((_, rowIndex) => ageColumns.map((_, columnIndex) => devStats.reduce((sum, item) => sum + matrices[item.name].values[rowIndex][columnIndex], 0))) });
  const matrixDevScope = ((applied.dev as DevType) || matrixDev) as DevType | '全部';
  const projectMatrix = (matrix: Matrix, dev: DevType | '全部', afterSales = false, alertFilter = applied.alert, planFilter = applied.plan): Matrix => {
    const planData = planAlertByDev[dev];
    const planRow = planFilter ? planData.rows.find((row) => row.name === planFilter) : null;
    const planRatio = afterSales ? (planFilter && planFilter !== '留用/售后' ? 0 : 1) : (planRow ? planRow.total / planData.total : planFilter ? 0 : 1);
    const alertIndex = alertStats.findIndex((item) => String(item.level) === alertFilter);
    const alertRatio = alertIndex >= 0 ? planData.rows.reduce((sum, row) => sum + row.alerts[alertIndex], 0) / planData.total : 1;
    const scale = planRatio * alertRatio * (applied.month !== '2026-06' ? .86 : 1) * (applied.keyword.trim() ? .58 : 1);
    return { ...matrix, values: matrix.values.map((row, rowIndex) => row.map((value, columnIndex) => {
      if (applied.retention.length && !applied.retention.includes(retentionRows[rowIndex])) return 0;
      if (applied.age && ageColumns[columnIndex] !== applied.age) return 0;
      return Math.round(value * scale);
    })) };
  };
  const linkedAlertMatrix = projectMatrix(matrixDevScope === '全部' ? aggregateMatrix(alertMatrices) : alertMatrices[matrixDevScope], matrixDevScope);
  const linkedAfterMatrix = projectMatrix(matrixDevScope === '全部' ? aggregateMatrix(afterMatrices) : afterMatrices[matrixDevScope], matrixDevScope, true);
  const matrixDevOptions: Array<{ name: DevType | '全部'; value: number }> = [
    { name: '全部', value: projectMatrix(aggregateMatrix(alertMatrices), '全部').values.flat().reduce((sum, value) => sum + value, 0) },
    ...devStats.map((item) => ({ name: item.name, value: projectMatrix(alertMatrices[item.name], item.name).values.flat().reduce((sum, value) => sum + value, 0) })),
  ];
  const linkedAlertMatrixTotal = linkedAlertMatrix.values.flat().reduce((sum, value) => sum + value, 0);
  const linkedAfterMatrixTotal = linkedAfterMatrix.values.flat().reduce((sum, value) => sum + value, 0);
  const linkedAlertTotals = alertStats.map((_, index) => chartRows.reduce((sum, row) => sum + row.alerts[index], 0));
  const linkedAfterSalesTotal = chartRows.find((row) => row.name === '留用/售后')?.total || 0;
  const linkedAfterSalesByDev = devStats.map((item) => ({ name: item.name, value: projectMatrix(afterMatrices[item.name], item.name, true).values.flat().reduce((sum, value) => sum + value, 0) }));
  const analysisAlertOptions = alertStats.map((item) => {
    const value = applied.alert && applied.alert !== String(item.level) ? 0 : projectMatrix(matrixDevScope === '全部' ? aggregateMatrix(alertMatrices) : alertMatrices[matrixDevScope], matrixDevScope, false, String(item.level)).values.flat().reduce((sum, matrixValue) => sum + matrixValue, 0);
    return { ...item, value };
  });
  const analysisPlanOptions = overviewData.rows.map((row) => {
    const value = applied.plan && applied.plan !== row.name ? 0 : projectMatrix(matrixDevScope === '全部' ? aggregateMatrix(alertMatrices) : alertMatrices[matrixDevScope], matrixDevScope, false, applied.alert, row.name).values.flat().reduce((sum, matrixValue) => sum + matrixValue, 0);
    return { name: row.name, value, color: planStats.find((item) => item.name === row.name)?.color || '#168b72' };
  });
  const applyAnalysisFilter = (key: 'alert' | 'plan', value: string) => {
    const filters = { ...applied, [key]: value };
    setDraft(filters);
    setApplied(filters);
    setPage(1);
  };
  const selectMatrixDev = (name: DevType | '全部') => { const dev = name === '全部' ? '' : name; const filters = { ...applied, dev }; setMatrixDev(name); setDraft(filters); setApplied(filters); setPage(1); };
  const runSearch = () => { setApplied({ ...draft }); setMatrixDev((draft.dev as DevType) || '全部'); setRetentionMenu(false); setPage(1); showToast('查询完成，分析口径已更新'); };
  const reset = () => { setDraft(blankFilters); setApplied(blankFilters); setMatrixDev('全部'); setPage(1); showToast('复制物料编码'); };
  const drillDown = (next: Partial<FilterState>) => { const filters = { ...blankFilters, ...next }; setDraft(filters); setApplied(filters); setPage(1); setView('details'); };
  const matrixDrill = (retention: string, age: string, plan = '') => { const filters: FilterState = { ...applied, dev: matrixDevScope === '全部' ? '' : matrixDevScope, retention: [retention], age, plan: plan || applied.plan }; setDraft(filters); setApplied(filters); setPage(1); setView('details'); };
  const toggleColumn = (key: string) => setVisibleColumns((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; });

  return <div className={'ioc-shell material-analysis ' + (embedded ? 'material-analysis-embedded' : '')}>
    <header className="topbar">
      <div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div>
      <div className="topbar-main"><div className="breadcrumb"><Menu size={16}/><b>IOC运营平台</b><span>·</span><strong>报表中心</strong><span>·</span><b>静态材料处理跟踪分析</b></div><div className="user-area"><UserRound size={15}/><span>王俊励</span><ChevronDown size={14}/></div></div>
    </header>
    <div className="workspace">
    <aside className="sidebar" aria-label="IOC 导航"><div className="platform-title">IOC运营平台</div><nav>{menuItems.map(({ label, icon: Icon }) => <button type='button' key={label} className="nav-item" onClick={() => { if (label === '分析看板') { setAnalysisMenuOpen((value) => !value); setReportMenuOpen(false); } if (label === '报表中心') { setReportMenuOpen((value) => !value); setAnalysisMenuOpen(false); } }}><Icon size={17}/><span>{label}</span></button>)}</nav>{analysisMenuOpen && <div className='ioc-sidebar-menu'><h3>分析看板</h3><div className='ioc-sidebar-menu-list'><button type='button' className='selected'>静态材料处理跟踪分析</button></div></div>}{reportMenuOpen && <div className='ioc-sidebar-menu'><h3>定制</h3><div className='ioc-sidebar-menu-list'><button type='button' onClick={() => window.location.assign('/prototypes/order-track-report')}>订单跟踪报表</button><button type='button' onClick={() => window.location.assign('/prototypes/order-track-report?report=custom-sales')}>定制接单打款销售统计报表</button></div></div>}</aside>
      <main className="main-area">
        <div className="tabbar"><span className="tab-close"><X size={14}/></span><span className="active-tab">静态材料处理跟踪分析<X size={12} /></span></div>
        <div className="analysis-content">

          <section className={`filter-strip ${view === 'details' ? 'details-filter-strip' : ''}`} aria-label="全局筛选">
            <label><span>时间</span><select value={draft.month} onChange={(event) => updateDraft('month', event.target.value)}>{monthOptions.map((item) => <option value={item} key={item}>{monthLabel(item)}</option>)}</select></label>
            
            <label><span>开发类型</span><select value={draft.dev} onChange={(event) => updateDraft('dev', event.target.value)}><option value="">全部</option>{devStats.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <label><span>警报级别</span><select value={draft.alert} onChange={(event) => updateDraft('alert', event.target.value)}><option value="">全部</option>{alertStats.map((item) => <option value={item.level} key={item.level}>{item.level}级 · {item.name}</option>)}</select></label>
            <label><span>处理方案</span><select value={draft.plan} onChange={(event) => updateDraft('plan', event.target.value)}><option value="">全部</option>{planStats.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
            <label><span>库龄</span><select value={draft.age} onChange={(event) => updateDraft('age', event.target.value)}><option value="">全部</option>{ageColumns.map((item) => <option key={item}>{item}</option>)}</select></label>
            <div className="filter-field retention-filter"><span>留存率</span><div className="multi-select"><button type="button" className="multi-select-trigger" onClick={() => setRetentionMenu((value) => !value)}>{draft.retention.length ? "已选" + draft.retention.length + "项" : "全部"}<ChevronDown size={13} /></button>{retentionMenu && <div className="multi-select-menu">{retentionRows.map((item) => <label key={item}><input type="checkbox" checked={draft.retention.includes(item)} onChange={() => toggleRetention(item)} /><span>{item}</span></label>)}<button type="button" className="multi-select-clear" onClick={() => setDraft((current) => ({ ...current, retention: [] }))}>清空选择</button></div>}</div></div>

              {view === 'details' && <label className="keyword-field"><span>物料</span><div><Search size={14}/><input value={draft.keyword} onChange={(event) => updateDraft('keyword', event.target.value)} placeholder="编码 / 名称 / 原因" /></div></label>}
            <div className="filter-buttons"><button type="button" className="text-button" onClick={reset}>重置</button><button type="button" className="primary-button" onClick={runSearch}><Search size={14}/>查询</button></div>
          </section>

          <div className='view-tabs'><nav>{[["overview", "总览", LayoutDashboard], ["alerts", "警报与处理分析", ShieldAlert], ["details", "材料明细", FileSearch]].map(([id, label, Icon]) => <button type='button' key={id as string} className={view === id ? "active" : ""} onClick={() => setView(id as ViewId)}><Icon size={15} />{label as string}</button>)}<span className='view-tabs-meta'>数据截止 2026 年 6 月 · 按物料编码计数</span></nav></div>

          <div className="view-content">
            {view === 'overview' && <div className="overview-view">
              <section className="metric-grid">
                <button type="button" className="metric-card" onClick={() => setView('details')}><span className="metric-icon total"><Boxes size={19}/></span><span><small>静态材料总项</small><strong>{number.format(filteredTotal)}</strong><em>项</em></span><p>占比：{((filteredTotal / 2111) * 100).toFixed(1)} %</p></button>
                <button type="button" className="metric-card" onClick={() => { setAnalysisMode('alert'); setView('alerts'); }}><span className="metric-icon"><ShieldAlert size={19}/></span><span><small>{activeAlert.level}级{activeAlert.name}</small><strong>{number.format(alertMetricTotal)}</strong><em>项</em></span><p>占比：{(filteredTotal ? (alertMetricTotal / filteredTotal) * 100 : 0).toFixed(1)} %</p></button>
                <button type="button" className="metric-card warning" onClick={() => { setAnalysisMode('alert'); setView('alerts'); }}><span className="metric-icon"><AlertTriangle size={19}/></span><span><small>{applied.age || '24个月以上'}</small><strong>{number.format(ageMetricTotal)}</strong><em>项</em></span><p>占比：{(filteredTotal ? (ageMetricTotal / filteredTotal) * 100 : 0).toFixed(1)} %</p></button>
                <button type="button" className="metric-card retention" onClick={() => { setAnalysisMode('alert'); setView('alerts'); }}><span className="metric-icon"><SlidersHorizontal size={19}/></span><span><small>留存率（{retentionRangeText}）</small><strong>{number.format(retentionMetricTotal)}</strong><em>项</em></span><p>占比：{(filteredTotal ? (retentionMetricTotal / filteredTotal) * 100 : 0).toFixed(1)} %</p></button>
                <button type="button" className="metric-card service" onClick={() => { setAnalysisMode('plan'); setView('alerts'); }}><span className="metric-icon"><CircleGauge size={19}/></span><span><small>{activePlan}</small><strong>{number.format(planMetricTotal)}</strong><em>项</em></span><p>占比：{(filteredTotal ? (planMetricTotal / filteredTotal) * 100 : 0).toFixed(1)} %</p></button>
              </section>
              <div className="overview-panels">
                <section className="panel plan-alert-panel">
                  <header><div><h2>处理方案与警报等级结构</h2><p>柱高表示对应处理方案材料项数，颜色表示警报等级构成</p></div><div className="alert-legend"><button type="button" className="alert-legend-all" onClick={() => { const filters = { ...applied, alert: "" }; setDraft(filters); setApplied(filters); setPage(1); }}>全部</button>{visibleAlertDescriptors.map((item) => { const index = alertStats.findIndex((stat) => stat.level === item.level); const total = chartRows.reduce((sum, row) => sum + row.alerts[index], 0); return <button type="button" key={item.level} onClick={() => drillDown({ dev:applied.dev, alert:String(item.level) })}><i style={{background:item.color}}/><span>{item.level}级{item.name}</span><strong>{number.format(total)}</strong></button>; })}</div></header>
                  <div className="plan-column-chart">
                    <div className="chart-guide-lines" aria-hidden="true"><i/><i/><i/><i/></div>
                    <div className="plan-columns">{chartRows.map((row) => {
                      const share = filteredTotal ? (row.total / filteredTotal) * 100 : 0;
                      const height = (row.total / chartMax) * 100;
                      return <div className="plan-column" key={row.name}>
                        <div className="plan-column-stage" style={{ zIndex: hoveredSegment?.name === row.name ? 100 : 1 }}>
                          <div className="plan-column-topline" style={{ bottom: `min(${height}%, calc(100% - 20px))` }}><button type="button" className="plan-column-total" onClick={() => drillDown({ dev:applied.dev, plan:row.name })}>{number.format(row.total)}</button><span className="plan-column-share">{share.toFixed(1)}%</span></div>
                          <div className="plan-column-bar" style={{ height: `${height}%` }} onMouseLeave={() => setHoveredSegment(null)}>{visibleAlertDescriptors.map((item) => { const index = alertStats.findIndex((stat) => stat.level === item.level); const value = row.alerts[index]; return value > 0 && <button type="button" key={item.level} style={{ height: `${row.total ? (value / row.total) * 100 : 0}%`, background: item.color }} onClick={() => drillDown({dev:applied.dev,plan:row.name,alert:String(item.level)})} onMouseEnter={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setHoveredSegment({ name: row.name, level: item.level, value, total: row.total }); setTooltipPosition({ left: Math.min(rect.right + 10, window.innerWidth - 190), top: Math.max(8, rect.top + rect.height / 2 - 44) }); }}><span className="plan-segment-tooltip" role="tooltip" style={{ display: "none" }}><strong>{row.name} · {item.level}级</strong><span>数量：{number.format(value)} 项</span><span>占方案：{((value / row.total) * 100).toFixed(1)}%</span><span>占全部：{(filteredTotal ? (value / filteredTotal) * 100 : 0).toFixed(1)}%</span></span></button>; })}</div>
                        </div>
                        <button type="button" className="plan-column-label" onClick={() => drillDown({ dev:applied.dev, plan:row.name })}><strong>{row.name}</strong></button>
                      </div>;
                    })}</div>
                    {hoveredSegment && <div className="plan-hover-tooltip" style={{ left: tooltipPosition.left, top: tooltipPosition.top }}><strong>{hoveredSegment.name} · {hoveredSegment.level}级</strong><span>数量：{number.format(hoveredSegment.value)} 项</span><span>占方案：{((hoveredSegment.value / hoveredSegment.total) * 100).toFixed(1)}%</span><span>占全部：{(filteredTotal ? (hoveredSegment.value / filteredTotal) * 100 : 0).toFixed(1)}%</span></div>}
                  </div>                  <footer><span>合计 {number.format(filteredTotal)} 项</span><em>点击柱体、方案名称或警报图例可查看对应材料明细</em></footer>
                </section>
                <section className="panel trend-panel">
                  <header><div><h2>{trendMeta.title}</h2><p>{trendMeta.description}</p></div><div className="trend-tabs" role="tablist" aria-label="趋势指标切换">{[{ id: 'unprocessed', label: '每月待处理数量趋势' }, { id: 'submitted', label: '每月新提出数量趋势' }, { id: 'completed', label: '每月处理完成数量趋势' }].map((tab) => <button type="button" key={tab.id} role="tab" aria-selected={trendMode === tab.id} className={trendMode === tab.id ? 'active' : ''} onClick={() => setTrendMode(tab.id as 'unprocessed' | 'submitted' | 'completed')}>{tab.label}</button>)}</div></header>
                  <div className="trend-chart">
                    <div className="trend-y-labels" aria-hidden="true"><span>{number.format(trendMax)}</span><span>{number.format(Math.round(trendMax * .75))}</span><span>{number.format(Math.round(trendMax * .5))}</span><span>{number.format(Math.round(trendMax * .25))}</span><span>0</span></div>
                    <svg viewBox="0 0 620 240" role="img" aria-label={trendMeta.title} preserveAspectRatio="none">
                      {[24,72,120,168,216].map((y) => <line key={y} x1="12" x2="608" y1={y} y2={y} className="trend-grid-line"/>)}
                      <polyline points={activeTrendData.map((item,index) => `${12 + index * 119.2},${216 - (item.value / trendMax) * 192}`).join(' ')} className={`trend-line trend-line-${trendMode}`}/>
                      {activeTrendData.map((item,index) => <g key={item.month}><circle cx={12 + index * 119.2} cy={216 - (item.value / trendMax) * 192} r="4" className={`trend-point trend-point-${trendMode}`}><title>{item.month}）{number.format(item.value)} 项</title></circle><text x={12 + index * 119.2} y={Math.max(15, 216 - (item.value / trendMax) * 192 - 12)} className={`trend-value trend-value-${trendMode}`} textAnchor="middle">{number.format(item.value)}</text></g>)}
                    </svg>
                    <div className="trend-x-labels">{activeTrendData.map((item) => <span key={item.month}>{item.month}</span>)}</div>
                  </div>
                  <footer><span><i className={`trend-dot trend-dot-${trendMode}`}/>{trendMeta.legend}</span><em>单位：项 · 截止 2026 年 6 月</em></footer>
                </section>              </div>
            </div>}
            {view === 'alerts' && <div className="matrix-view combined-analysis-view">
              <div className="matrix-header combined-analysis-header">
                <div className="analysis-header-actions"><div className="analysis-mode-switch" role="tablist" aria-label="分析维度"><button type="button" className={analysisMode === 'alert' ? 'active' : ''} onClick={() => setAnalysisMode('alert')}>警报级别</button><button type="button" className={analysisMode === 'plan' ? 'active' : ''} onClick={() => setAnalysisMode('plan')}>处理方案</button></div><div className="segmented-control">{matrixDevOptions.map((item) => <button type="button" className={matrixDevScope === item.name ? 'active' : ''} key={item.name} onClick={() => selectMatrixDev(item.name)}>{item.name}<span>{number.format(item.value)}</span></button>)}</div></div>
                <p className="combined-analysis-description">按留存率与库龄交叉分析，切换警报级别或处理方案查看材料分布</p>
              </div>
              <div className="matrix-layout combined-analysis-layout">
                <section className="panel matrix-panel combined-matrix-panel"><MatrixView matrix={linkedAlertMatrix} total={linkedAlertMatrixTotal} onSelect={(retention,age) => matrixDrill(retention,age)} /><footer><span><i className="heat-low"/>低</span><span><i className="heat-mid"/>中</span><span><i className="heat-high"/>高</span><em>颜色表示当前筛选口径中的相对集中度</em></footer></section>
                <aside className="analysis-selector-panel">
                  <header><div><h3>{analysisMode === 'alert' ? '警报级别' : '处理方案'}</h3><p>点击切换矩阵数据</p></div><strong>{number.format(linkedAlertMatrixTotal)} 项</strong></header>
                  <div className="analysis-option-list">
                    <button type="button" className={analysisMode === 'alert' ? (!applied.alert ? 'active' : '') : (!applied.plan ? 'active' : '')} onClick={() => applyAnalysisFilter(analysisMode, '')}><i className="option-all"/><span>全部</span><strong>{number.format(linkedAlertMatrixTotal)}</strong></button>
                    {analysisMode === 'alert' ? analysisAlertOptions.map((item) => <button type="button" className={applied.alert === String(item.level) ? 'active' : ''} key={item.level} onClick={() => applyAnalysisFilter('alert', String(item.level))}><i style={{background:item.color}}/><span>{item.level}级{item.name}</span><strong>{number.format(item.value)}</strong></button>) : analysisPlanOptions.map((item) => <button type="button" className={applied.plan === item.name ? 'active' : ''} key={item.name} onClick={() => applyAnalysisFilter('plan', item.name)}><i style={{background:item.color}}/><span>{item.name}</span><strong>{number.format(item.value)}</strong></button>)}
                  </div>
                  {analysisMode === 'alert' && <section className="alert-standard-compact"><h4>警报标准</h4><div><table><thead><tr><th>留存率</th><th>级别</th></tr></thead><tbody>{retentionRows.map((item,index) => { const level = index < 3 ? 6 : index < 5 ? 3 : index === 5 ? 2 : 1; return <tr key={item}><td>{item}</td><td><AlertBadge level={level}/></td></tr>; })}</tbody></table><table><thead><tr><th>库龄</th><th>级别</th></tr></thead><tbody>{ageColumns.map((item,index) => <tr key={item}><td>{item}</td><td><AlertBadge level={[6,3,2,1,1][index]}/></td></tr>)}</tbody></table></div><p>最终警报等级取留存率与库龄判定中的较高风险等级。</p></section>}
                  {analysisMode === 'plan' && <p className="analysis-panel-note">处理方案数量按当前开发类型、警报级别、库龄、留存率和时间筛选结果计算。</p>}
                </aside>
              </div>
            </div>}

            {view === 'details' && <div className="details-view"><section className="detail-toolbar"><div><strong>材料明细</strong><span>共 {number.format(estimatedTotal)} 项</span><em>当前表格展示 Excel 代表性脱敏数据</em></div><div className="toolbar-actions"><div className="column-control"><button type="button" className="ghost-button" onClick={() => setColumnMenu(!columnMenu)}><Columns3 size={14}/>列设置</button>{columnMenu && <div className="column-popover"><header><strong>显示字段</strong><button type="button" onClick={() => setColumnMenu(false)}><X size={14}/></button></header>{columns.map(([key,label]) => <label key={key}><input type="checkbox" checked={visibleColumns.has(key)} onChange={() => toggleColumn(key)}/><span>{label}</span></label>)}</div>}</div><button type="button" className="primary-button" onClick={() => showToast('已生成当前筛选条件的导出任务')}><Download size={14}/>导出</button></div></section><section className="detail-table-panel"><div className="detail-table-scroll"><table><thead><tr><th className="sticky-action">操作</th>{columns.filter(([key]) => visibleColumns.has(key)).map(([key,label]) => <th key={key}>{label}</th>)}</tr></thead><tbody>{pageRows.length ? pageRows.map((row) => <tr key={row.code}><td className="sticky-action"><button type="button" onClick={() => setDrawerRow(row)}>查看</button></td>{columns.filter(([key]) => visibleColumns.has(key)).map(([key]) => { const raw = row[key as keyof MaterialRow]; const value = key === 'retention' ? formatRetention(row.stock, row.reported) : typeof raw === 'number' && !['alert','ageMonths'].includes(key) ? number.format(raw) : raw; return <td key={key} title={String(value)}>{key === 'alert' ? <AlertBadge level={Number(raw)}/> : value}</td>; })}</tr>) : <tr><td colSpan={visibleColumns.size + 1} className="empty-state"><FileSearch size={32}/><strong>未找到匹配材料</strong><p>请调整筛选条件后重新查询</p><button type="button" onClick={reset}>重置筛选</button></td></tr>}</tbody></table></div><footer className="pagination"><span>第 {page} / {pageCount} 项</span><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1,value-1))}><ChevronLeft size={15}/></button>{Array.from({length:pageCount},(_,index) => index+1).map((item) => <button type="button" className={page === item ? 'current' : ''} key={item} onClick={() => setPage(item)}>{item}</button>)}<button type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount,value+1))}><ChevronRight size={15}/></button></footer></section></div>}
          </div>
        </div>
      </main>
    </div>

    <div className="watermark-layer" aria-hidden="true">{Array.from({length:90},(_,index) => <span key={index}>QY-00260959　王俊励　2026-07-30</span>)}</div>
    {drawerRow && <div className="drawer-backdrop" onMouseDown={(event) => {if(event.target === event.currentTarget) setDrawerRow(null);}}><aside className="detail-drawer" aria-label="材料详情"><header><div><span>材料详情</span><strong>{drawerRow.code}</strong></div><button type="button" onClick={() => setDrawerRow(null)} aria-label="关闭"><X size={18}/></button></header><section className="drawer-identity"><div><Boxes size={22}/></div><span><strong>{drawerRow.name}</strong><p>{drawerRow.dev} · {drawerRow.category} · {drawerRow.plan}</p></span><AlertBadge level={drawerRow.alert}/></section><section><h3>库存与风险</h3><dl><div><dt>提报呆滞时数据</dt><dd>{number.format(drawerRow.reported)} {drawerRow.unit}</dd></div><div><dt>现库存数量</dt><dd>{number.format(drawerRow.stock)} {drawerRow.unit}</dd></div><div><dt>库龄</dt><dd>{drawerRow.ageMonths} 个月{drawerRow.age}）</dd></div><div><dt>留存率</dt><dd>{drawerRow.retention}</dd></div><div className="wide"><dt>库存地点</dt><dd>{drawerRow.warehouse}</dd></div></dl></section><section><h3>处置事实</h3><dl><div><dt>静态原因</dt><dd>{drawerRow.reason}</dd></div><div><dt>呆滞提出时间</dt><dd>{drawerRow.staleDate}</dd></div><div className="wide"><dt>处理意见</dt><dd>{drawerRow.suggestion}</dd></div><div className="wide"><dt>材料生产日期</dt><dd>{drawerRow.productionDate}</dd></div></dl></section><footer><button type="button" className="ghost-button" onClick={() => setDrawerRow(null)}>关闭</button><button type="button" className="primary-button" onClick={() => showToast('复制物料编码')}>复制物料编码</button></footer></aside></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}















