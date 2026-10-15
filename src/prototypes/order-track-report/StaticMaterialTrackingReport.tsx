import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search, RotateCcw, X } from 'lucide-react';
import { createXlsxTemplate } from './xlsx-template';
import './static-material-tracking.css';

type FocusTab = 'current' | 'normal' | 'no-stock';
type MarkChange = { status: string; reason: string; changedAt: string };
type FocusRow = {
  material: string;
  materialDescription: string;
  productionType: string;
  category: string;
  staticDate: string;
  normalAt?: string;
  staticMonths?: number;
  verifiedTotalRequired?: number;
  availableStockAtNormal?: number;
  supplierUnreceivedAtNormal?: number;
  plannedDemandAtNormal?: number;
  totalRequiredAtNormal?: number;
  retention?: string;
  noStockDate?: string;
  firstPositiveAt?: string;
  markChanges: MarkChange[];
};
type Column = { key: keyof FocusRow; label: string; width?: number; formula?: string };
type Filters = { staticMonth: string; normalStart: string; normalEnd: string; noStockMonth: string; material: string; category: string };

const materialColumns: Column[] = [
  { key: 'material', label: '物料编码', width: 120 },
  { key: 'materialDescription', label: '物料描述', width: 290 },
  { key: 'productionType', label: '产生类型', width: 96 },
  { key: 'category', label: '材料类别', width: 96 },
];

const normalColumns: Column[] = [
  ...materialColumns,
  { key: 'staticDate', label: '形成静态时间', width: 116 },
  { key: 'normalAt', label: '转为正常时间', width: 128 },
  { key: 'staticMonths', label: '静态月数', width: 100, formula: '按形成静态时间计算已完成的完整自然月。' },
  { key: 'verifiedTotalRequired', label: '核定后总应消耗量', width: 145, formula: '形成时可用库存 + 核定供应商未交量；未导入核定值时使用形成供应商未交量。' },
  { key: 'availableStockAtNormal', label: '转为正常时可用库存', width: 160, formula: '转为正常时 IOC 汇总的全部工厂可用库存。' },
  { key: 'supplierUnreceivedAtNormal', label: '转为正常时供应商未交量', width: 178, formula: '转为正常时 IOC 汇总的全部工厂供应商未交量。' },
  { key: 'plannedDemandAtNormal', label: '转为正常时计划需求量', width: 170, formula: '转为正常时 IOC 汇总的全部工厂计划需求量。' },
  { key: 'totalRequiredAtNormal', label: '转为正常时应消耗总量', width: 172, formula: '转为正常时可用库存 + 供应商未交量 - 计划需求量。' },
  { key: 'retention', label: '留存率', width: 90 },
];

const noStockColumns: Column[] = [
  ...materialColumns,
  { key: 'staticDate', label: '形成静态时间', width: 116 },
  { key: 'verifiedTotalRequired', label: '核定后总应消耗量', width: 145, formula: '形成时可用库存 + 核定供应商未交量；未导入核定值时使用形成供应商未交量。' },
  { key: 'noStockDate', label: '无余量日期', width: 116 },
  { key: 'firstPositiveAt', label: '有余量时间', width: 132, formula: '当月内首次有余量时间。' },
];

const demoNormalRows: FocusRow[] = [
  { material: '101013732', materialDescription: '3多层板单面贴水曲柳直纹木皮板2440*1220TT', productionType: '静态', category: '板材', staticDate: '2026-08-01', normalAt: '2026-10-12', staticMonths: 2, verifiedTotalRequired: 22, availableStockAtNormal: 18, supplierUnreceivedAtNormal: 0, plannedDemandAtNormal: 18, totalRequiredAtNormal: 0, retention: '81.82%', markChanges: [{ status: '正常', reason: 'SAP库房静态计算', changedAt: '2026-10-12 09:18:32' }, { status: '静态', reason: 'SAP库房静态计算', changedAt: '2026-08-01 08:05:11' }] },
  { material: '104009061', materialDescription: 'H214#墨韵细木纹PVC浮雕封边带哑光1.2*28mm', productionType: '静态', category: '封边带', staticDate: '2026-07-01', normalAt: '2026-10-09', staticMonths: 3, verifiedTotalRequired: 610, availableStockAtNormal: 570, supplierUnreceivedAtNormal: 20, plannedDemandAtNormal: 590, totalRequiredAtNormal: 0, retention: '93.44%', markChanges: [{ status: '正常', reason: '开发中心产品工艺变更文件发布流程202283', changedAt: '2026-10-09 15:26:08' }, { status: '静态', reason: 'SAP库房静态计算', changedAt: '2026-07-01 08:13:42' }] },
  { material: '104009061', materialDescription: 'H214#墨韵细木纹PVC浮雕封边带哑光1.2*28mm', productionType: '静态', category: '封边带', staticDate: '2026-07-01', normalAt: '2026-10-07', staticMonths: 3, verifiedTotalRequired: 610, availableStockAtNormal: 558, supplierUnreceivedAtNormal: 40, plannedDemandAtNormal: 598, totalRequiredAtNormal: 0, retention: '91.48%', markChanges: [{ status: '正常', reason: 'BOM回传正常', changedAt: '2026-10-07 10:16:24' }, { status: '静态', reason: 'SAP库房静态计算', changedAt: '2026-07-01 08:13:42' }] },
  { material: '105099901', materialDescription: '清丰分厂专用装饰件', productionType: '预静态', category: '五金', staticDate: '2026-09-01', normalAt: '2026-10-03', staticMonths: 1, verifiedTotalRequired: 36, availableStockAtNormal: 36, supplierUnreceivedAtNormal: 0, plannedDemandAtNormal: 36, totalRequiredAtNormal: 0, retention: '100.00%', markChanges: [{ status: '正常', reason: 'BOM回传正常', changedAt: '2026-10-03 11:04:51' }, { status: '预静态', reason: 'SAP库房静态计算', changedAt: '2026-09-01 08:00:04' }] },
];

const demoNoStockRows: FocusRow[] = [
  { material: '104009061', materialDescription: 'H214#墨韵细木纹PVC浮雕封边带哑光1.2*28mm', productionType: '静态', category: '封边带', staticDate: '2026-07-01', verifiedTotalRequired: 610, noStockDate: '2026-10-01', firstPositiveAt: '2026-10-07', markChanges: [{ status: '静态', reason: 'SAP库房静态计算', changedAt: '2026-07-01 08:13:42' }] },
  { material: '105099901', materialDescription: '清丰分厂专用装饰件', productionType: '预静态', category: '五金', staticDate: '2026-09-01', verifiedTotalRequired: 36, noStockDate: '2026-10-01', firstPositiveAt: '', markChanges: [{ status: '预静态', reason: 'SAP库房静态计算', changedAt: '2026-09-01 08:00:04' }] },
  { material: '107002418', materialDescription: '暖白柔光灯带连接线 2m', productionType: '静态', category: '电器', staticDate: '2026-08-01', verifiedTotalRequired: 128, noStockDate: '2026-10-01', firstPositiveAt: '', markChanges: [{ status: '静态', reason: 'SAP库房静态计算', changedAt: '2026-08-01 08:30:14' }] },
];

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const monthStart = (month: string) => month ? `${month}-01` : '';
const monthEnd = (month: string) => {
  if (!month) return '';
  const [year, value] = month.split('-').map(Number);
  const lastDay = new Date(year, value, 0).getDate();
  return `${year}-${String(value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
};
const defaultFilters = (): Filters => {
  const month = currentMonth();
  return { staticMonth: '', normalStart: monthStart(month), normalEnd: monthEnd(month), noStockMonth: '', material: '', category: '' };
};
const dash = (value: unknown) => value === '' || value === null || value === undefined ? '—' : String(value);

function StaticMarkHistory({ row, onClose }: { row: FocusRow; onClose: () => void }) {
  const ordered = [...row.markChanges].sort((a, b) => b.changedAt.localeCompare(a.changedAt));
  return <div className="static-focus-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="static-focus-history-dialog" role="dialog" aria-modal="true" aria-labelledby="static-focus-history-title">
      <header><div><strong id="static-focus-history-title">静态标识变更记录</strong><span>物料编码：{row.material}<i>物料描述：{row.materialDescription}</i></span></div><button type="button" aria-label="关闭变更记录" onClick={onClose}><X size={18}/></button></header>
      <div className="static-focus-history-table"><table><thead><tr><th>本次更改后状态</th><th>更改原因</th><th>更改时间</th></tr></thead><tbody>{ordered.map((change, index) => {
        const match = change.reason.match(/^(.*流程)(\d+)$/);
        const reason = match
          ? <a href={`http://ebpm.quanyou.com.cn:8090/Portal/Ultimus.UWF.Workflow/OpenForm.aspx?type=report&UserName=quanyou.com.cn%2Fultims&ProcessName=${encodeURIComponent(match[1])}&Incident=${encodeURIComponent(match[2])}`} target="_blank" rel="noreferrer">{change.reason}</a>
          : change.reason;
        return <tr key={`${change.changedAt}-${index}`}><td><span className={`static-focus-status status-${change.status}`}>{change.status}</span></td><td>{reason}</td><td>{change.changedAt}</td></tr>;
      })}</tbody></table></div>
      <footer><button type="button" onClick={onClose}>关闭</button></footer>
    </section>
  </div>;
}

export default function StaticMaterialTrackingReport({ currentView }: { currentView: React.ReactNode }) {
  const [tab, setTab] = useState<FocusTab>('current');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [historyRow, setHistoryRow] = useState<FocusRow | null>(null);
  const [toast, setToast] = useState('');
  const allRows = tab === 'normal' ? demoNormalRows : demoNoStockRows;
  const filteredRows = useMemo(() => allRows.filter(row => {
    if (applied.staticMonth && !row.staticDate.startsWith(applied.staticMonth)) return false;
    if (applied.category && row.category !== applied.category) return false;
    if (applied.material && row.material !== applied.material.trim() && !row.materialDescription.toLowerCase().includes(applied.material.trim().toLowerCase())) return false;
    if (tab === 'normal') return Boolean(row.normalAt && row.normalAt >= applied.normalStart && row.normalAt <= applied.normalEnd);
    return !applied.noStockMonth || Boolean(row.noStockDate?.startsWith(applied.noStockMonth));
  }), [allRows, applied, tab]);
  const columns = tab === 'normal' ? normalColumns : noStockColumns;
  const total = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil((filteredRows.length ? total : 0) / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const switchTab = (next: FocusTab) => { setTab(next); setFilters(defaultFilters()); setApplied(defaultFilters()); setPage(1); setHistoryRow(null); };
  const resetFilters = () => { const next = defaultFilters(); setFilters(next); setApplied(next); setPage(1); };
  const exportRows = () => {
    if (tab === 'current') return;
    const fields = columns.map(column => column.label);
    const dataRows = filteredRows.map(row => Object.fromEntries(columns.map(column => [column.label, row[column.key] ?? ''])));
    const url = URL.createObjectURL(createXlsxTemplate(fields, dataRows[0] ?? {}, [], dataRows, []));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tab === 'normal' ? '转为正常统计' : '月初无余量统计'}查询结果.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    flash(`已导出 ${filteredRows.length} 条查询结果`);
  };

  return <section className="static-report-page static-tracking-shell" aria-label="静态材料跟踪消耗报表">
    <nav className="static-report-tabs static-tracking-tabs" role="tablist" aria-label="静态材料重点跟踪分页">
      {([{ id: 'current', label: '当前跟踪', count: 126 }, { id: 'normal', label: '转为正常统计', count: demoNormalRows.length }, { id: 'no-stock', label: '月初无余量统计', count: demoNoStockRows.length }] as const).map(item => <button type="button" role="tab" aria-selected={tab === item.id} key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => switchTab(item.id)}>{item.label}<small>{item.count}</small></button>)}
    </nav>
    {tab === 'current' ? <div className="static-tracking-content">{currentView}</div> : <>
      <section className="static-report-filters static-focus-filters" aria-label="查询条件">
        <label><span>形成静态时间</span><div className="static-report-month-control"><input type="month" value={filters.staticMonth} disabled={!filters.staticMonth} onChange={event => setFilters(current => ({ ...current, staticMonth: event.target.value }))}/><div className="static-report-all-time"><input aria-label="形成静态时间全部时间" type="checkbox" checked={!filters.staticMonth} onChange={event => setFilters(current => ({ ...current, staticMonth: event.target.checked ? '' : currentMonth() }))}/><span>全部时间</span></div></div></label>
        {tab === 'normal' ? <label className="static-focus-range"><span>转为正常时间</span><div><input aria-label="转为正常开始日期" type="date" value={filters.normalStart} onChange={event => setFilters(current => ({ ...current, normalStart: event.target.value }))}/><b>至</b><input aria-label="转为正常结束日期" type="date" value={filters.normalEnd} onChange={event => setFilters(current => ({ ...current, normalEnd: event.target.value }))}/></div></label> : <label><span>无余量日期</span><div className="static-report-month-control"><input type="month" value={filters.noStockMonth} disabled={!filters.noStockMonth} onChange={event => setFilters(current => ({ ...current, noStockMonth: event.target.value }))}/><div className="static-report-all-time"><input aria-label="无余量日期全部时间" type="checkbox" checked={!filters.noStockMonth} onChange={event => setFilters(current => ({ ...current, noStockMonth: event.target.checked ? '' : currentMonth() }))}/><span>全部时间</span></div></div></label>}
        <label><span>物料</span><input value={filters.material} placeholder="编码精确匹配 / 描述关键字" onChange={event => setFilters(current => ({ ...current, material: event.target.value }))}/></label>
        <label><span>材料类别</span><select value={filters.category} onChange={event => setFilters(current => ({ ...current, category: event.target.value }))}><option value="">全部</option>{['板材', '封边带', '五金', '电器'].map(category => <option key={category}>{category}</option>)}</select></label>
        <div className="static-report-actions"><button type="button" className="query" onClick={() => { setApplied(filters); setPage(1); flash('查询完成'); }}><Search size={14}/>查询</button><button type="button" className="reset" onClick={resetFilters}><RotateCcw size={14}/>重置</button></div>
      </section>
      <section className="static-report-table-panel" key={tab}>
        <div className="static-report-toolbar"><div className="static-report-toolbar-context"><span>数据更新时间：</span><b>2026-10-14 08:30:00</b></div><div className="static-report-toolbar-actions"><button type="button" onClick={exportRows}><Download size={14}/>导出</button></div></div>
        <div className="static-report-table-scroll"><table><thead><tr><th className="row-number">序号</th>{columns.map(column => <th key={column.key} style={{ width: column.width, minWidth: column.width }}><span className="static-report-formula-header"><span className="static-report-formula-label">{column.label}</span>{column.formula && <span className="static-report-formula-help" tabIndex={0} aria-label={`${column.label}口径说明`}>?<span className="static-report-formula-tooltip" role="tooltip">{column.formula}</span></span>}</span></th>)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={`${row.material}-${row.normalAt ?? row.noStockDate}-${index}`}><td className="row-number">{(page - 1) * pageSize + index + 1}</td>{columns.map(column => <td key={column.key} className={column.key === 'productionType' ? 'static-focus-type-cell' : ''}>{column.key === 'productionType' ? <button type="button" onClick={() => setHistoryRow(row)}>{dash(row[column.key])}</button> : dash(row[column.key])}</td>)}</tr>)}{!visibleRows.length && <tr><td className="static-report-empty" colSpan={columns.length + 1}>暂无匹配记录</td></tr>}</tbody></table></div>
        <footer className="static-report-pagination"><span>共 {total} 条记录</span><div><select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}><option value="20">20 条/页</option><option value="50">50 条/页</option><option value="100">100 条/页</option></select><button type="button" aria-label="上一页" disabled={page === 1} onClick={() => setPage(value => Math.max(1, value - 1))}><ChevronLeft size={14}/></button>{Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map(value => <button type="button" key={value} className={page === value ? 'current' : ''} onClick={() => setPage(value)}>{value}</button>)}{pageCount > 5 && <><span>...</span><button type="button" className={page === pageCount ? 'current' : ''} onClick={() => setPage(pageCount)}>{pageCount}</button></>}<button type="button" aria-label="下一页" disabled={page === pageCount} onClick={() => setPage(value => Math.min(pageCount, value + 1))}><ChevronRight size={14}/></button><span>第 {page} / {pageCount} 页</span></div></footer>
      </section>
      {historyRow && <StaticMarkHistory row={historyRow} onClose={() => setHistoryRow(null)}/>}
      {toast && <div className="static-report-toast" role="status">{toast}</div>}
    </>}
  </section>;
}
