import React, { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import './supplier-development-report.css';

type Order = { number: string; materialCode: string; material: string; unit: string; quantity: number; date: string };
type Supplier = { code: string; name: string; introducedAt: string; officialAt: string; orders: Order[] };
type ReportFilters = { supplier: string; introducedFrom: string; introducedTo: string; orderFrom: string; orderTo: string };
type ReportRow = { supplier: Supplier; materialCode: string; material: string; unit: string; orderCount: number; quantity: number };

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getRecentThreeMonths() {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(end.getFullYear(), end.getMonth() - 3, 1);
  monthStart.setDate(Math.min(end.getDate(), new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()));
  return { from: toDateInputValue(monthStart), to: toDateInputValue(end) };
}

function createInitialFilters(): ReportFilters {
  const recentRange = getRecentThreeMonths();
  return { supplier: '', introducedFrom: recentRange.from, introducedTo: recentRange.to, orderFrom: '', orderTo: '' };
}

const sampleSuppliers: Supplier[] = [
  { code: 'V208641', name: '苏州精工五金有限公司', introducedAt: '2026-09-08', officialAt: '2026-09-18', orders: [
    { number: 'PO-261018-042', materialCode: 'M-100284', material: '缓冲铰链 110°', unit: '只', quantity: 1200, date: '2026-10-18' },
    { number: 'PO-261025-019', materialCode: 'M-100284', material: '缓冲铰链 110°', unit: '只', quantity: 800, date: '2026-10-25' },
    { number: 'PO-261106-033', materialCode: 'M-100284', material: '缓冲铰链 110°', unit: '只', quantity: 1600, date: '2026-11-06' },
    { number: 'PO-261029-011', materialCode: 'M-100517', material: '三节静音导轨 450mm', unit: '副', quantity: 480, date: '2026-10-29' },
    { number: 'PO-261113-007', materialCode: 'M-100517', material: '三节静音导轨 450mm', unit: '副', quantity: 720, date: '2026-11-13' },
  ] },
  { code: 'V208655', name: '广东新锐装饰材料有限公司', introducedAt: '2026-09-26', officialAt: '2026-10-02', orders: [
    { number: 'PO-261011-016', materialCode: 'M-304026', material: 'PVC封边带 22mm', unit: '米', quantity: 3000, date: '2026-10-11' },
    { number: 'PO-261024-052', materialCode: 'M-304026', material: 'PVC封边带 22mm', unit: '米', quantity: 4500, date: '2026-10-24' },
    { number: 'PO-261108-021', materialCode: 'M-304026', material: 'PVC封边带 22mm', unit: '米', quantity: 3800, date: '2026-11-08' },
    { number: 'PO-261117-031', materialCode: 'M-304082', material: 'PVC封边带 35mm', unit: '米', quantity: 1600, date: '2026-11-17' },
  ] },
  { code: 'V208672', name: '青岛恒木新材料有限公司', introducedAt: '2026-10-14', officialAt: '2026-10-21', orders: [
    { number: 'PO-261030-008', materialCode: 'M-502109', material: '桦木多层板 18mm', unit: '张', quantity: 360, date: '2026-10-30' },
    { number: 'PO-261112-014', materialCode: 'M-502109', material: '桦木多层板 18mm', unit: '张', quantity: 480, date: '2026-11-12' },
  ] },
  { code: 'V208691', name: '宁波力拓照明科技有限公司', introducedAt: '2026-10-28', officialAt: '2026-11-04', orders: [
    { number: 'PO-261110-027', materialCode: 'M-710055', material: '柜内感应灯 400mm', unit: '套', quantity: 240, date: '2026-11-10' },
    { number: 'PO-261119-005', materialCode: 'M-710055', material: '柜内感应灯 400mm', unit: '套', quantity: 360, date: '2026-11-19' },
  ] },
  { code: 'V208704', name: '佛山森屿五金制品厂', introducedAt: '2026-11-06', officialAt: '2026-11-12', orders: [
    { number: 'PO-261116-012', materialCode: 'M-120430', material: '偏心连接件', unit: '套', quantity: 1800, date: '2026-11-16' },
    { number: 'PO-261121-018', materialCode: 'M-120430', material: '偏心连接件', unit: '套', quantity: 2200, date: '2026-11-21' },
  ] },
];

const initialFilters = createInitialFilters();
const milestones = ['业务需求', '采购开发', '核价完成', '正式供应商'];
const within = (value: string, from: string, to: string) => value >= from && value <= to;

function getRows(filters: ReportFilters): ReportRow[] {
  return sampleSuppliers.flatMap(supplier => {
    if (!supplier.name.includes(filters.supplier) && !supplier.code.includes(filters.supplier)) return [];
    if (!within(supplier.introducedAt, filters.introducedFrom, filters.introducedTo)) return [];
    const byMaterial = new Map<string, ReportRow>();
    supplier.orders.filter(order => order.date >= supplier.officialAt && (!filters.orderFrom || order.date >= filters.orderFrom) && (!filters.orderTo || order.date <= filters.orderTo)).forEach(order => {
      const key = `${order.materialCode}-${order.unit}`;
      const row = byMaterial.get(key) || { supplier, materialCode: order.materialCode, material: order.material, unit: order.unit, orderCount: 0, quantity: 0 };
      row.orderCount += 1;
      row.quantity += order.quantity;
      byMaterial.set(key, row);
    });
    return [...byMaterial.values()];
  });
}

function MilestoneTrack() {
  return <div className="supplier-track" aria-label="开发进度时间节点">
    {milestones.map((milestone, index) => <div className={`supplier-track-step ${index === 3 ? 'pending' : 'missing'}`} key={milestone}>
      <span className="supplier-track-dot" />
      <span className="supplier-track-name">{milestone}</span>
      <small>{index < 3 ? '数据待补' : '日期待确认'}</small>
    </div>)}
  </div>;
}

export default function SupplierDevelopmentReport({ onBack }: { onBack?: () => void }) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [applied, setApplied] = useState<ReportFilters>(initialFilters);
  const rows = useMemo(() => getRows(applied), [applied]);
  const suppliers = new Set(rows.map(row => row.supplier.code)).size;
  const orderCount = rows.reduce((sum, row) => sum + row.orderCount, 0);
  const update = (key: keyof ReportFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));

  return <div className="supplier-report">
    {onBack && <button className="supplier-back" type="button" onClick={onBack}>返回报表</button>}
    <header className="supplier-report-heading">
      <div><div className="supplier-eyebrow">供应商开发</div><h1>新供应商开发进度跟踪</h1><p>查看近期引进供应商的订单表现与开发节点</p></div>
      <div className="supplier-source"><span className="source-dot" />SRM 数据 · 示例</div>
    </header>

    <section className="supplier-filter-panel" aria-label="筛选条件">
      <div className="supplier-filter-grid">
        <label className="supplier-keyword"><span>供应商</span><input value={filters.supplier} placeholder="名称或编码" onChange={event => update('supplier', event.target.value)} /></label>
        <label><span>引进时间</span><div className="supplier-date-range"><input type="date" value={filters.introducedFrom} onChange={event => update('introducedFrom', event.target.value)} /><b>至</b><input type="date" value={filters.introducedTo} onChange={event => update('introducedTo', event.target.value)} /></div></label>
        <label><span>下单时间</span><div className="supplier-date-range"><input type="date" value={filters.orderFrom} onChange={event => update('orderFrom', event.target.value)} /><b>至</b><input type="date" value={filters.orderTo} onChange={event => update('orderTo', event.target.value)} /></div></label>
        <div className="supplier-actions"><button type="button" className="supplier-query" onClick={() => setApplied(filters)}><Search size={15} />查询</button><button type="button" className="supplier-reset" onClick={() => { setFilters(initialFilters); setApplied(initialFilters); }}><RotateCcw size={14} />重置</button></div>
      </div>
      <div className="supplier-filter-hint"><span>引进时间默认近三个月</span><span>仅统计正式下单，且下单日期不早于正式供应商日期</span></div>
    </section>

    <section className="supplier-summary" aria-label="查询汇总">
      <div><span>引进供应商</span><strong>{suppliers}</strong><small>家</small></div>
      <div><span>采购订单</span><strong>{orderCount}</strong><small>次</small></div>
      <div className="supplier-summary-note"><b>开发节点数据待补齐</b><span>业务需求、采购开发、核价日期暂缺，正式供应商日期节点待业务确认</span></div>
    </section>

    <section className="supplier-table-section">
      <div className="supplier-table-heading"><div><h2>供应商下单情况</h2><span>按供应商与物料汇总 · {rows.length} 条</span></div><div className="supplier-updated">数据更新时间 <b>2026-11-24 09:20</b></div></div>
      <div className="supplier-table-wrap"><table><thead><tr>
        <th>供应商</th><th>引进日期</th><th>物料编码 / 名称</th><th>单位</th><th>下单次数</th><th>下单数量</th><th>开发节点</th>
      </tr></thead><tbody>{rows.map(row => <tr key={`${row.supplier.code}-${row.materialCode}`}>
        <td><strong>{row.supplier.name}</strong><small>{row.supplier.code}</small></td>
        <td>{row.supplier.introducedAt}<small className="supplier-demo-label">示例日期</small></td>
        <td><strong>{row.materialCode}</strong><small>{row.material}</small></td>
        <td>{row.unit}</td><td><b className="supplier-order-count">{row.orderCount}</b></td><td><b className="supplier-quantity">{row.quantity.toLocaleString()}</b></td>
        <td><MilestoneTrack /></td>
      </tr>)}</tbody></table>{rows.length === 0 && <div className="supplier-empty">没有符合条件的记录</div>}</div>
      <div className="supplier-data-note">当前为交互示例数据。供应商引进日期为模拟值，正式日期节点及“正式下单”状态范围待业务确认。</div>
    </section>
  </div>;
}
