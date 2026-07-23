/**
 * @name 订单跟踪报表
 */
import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  Circle,
  FileText,
  FolderPlus,
  Grid2X2,
  Menu,
  PieChart,
  Printer,
  Settings,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import './style.css';

type Filters = {
  orderNo: string;
  isSample: string;
  isEmallOrdr: string;
  emallChannelCode: string;
  shopName: string;
  custname: string;
  prdLevel1Code: string;
  startDate: string;
  endDate: string;
  cusLevel1Code: string;
  orderPropertyCode: string;
  isActualDone: string;
  depotFilterQ: string;
  customerPhone: string;
  sapCode: string;
  cabinetStoreName: string;
  dealerShopCode: string;
};

type TableRow = Record<string, string>;

const initialFilters: Filters = {
  orderNo: '',
  isSample: '',
  isEmallOrdr: '',
  emallChannelCode: '',
  shopName: '',
  custname: '',
  prdLevel1Code: '',
  startDate: '20260601',
  endDate: '20260722',
  cusLevel1Code: '',
  orderPropertyCode: '',
  isActualDone: '',
  depotFilterQ: '',
  customerPhone: '',
  sapCode: '',
  cabinetStoreName: '',
  dealerShopCode: '',
};

const columns = [
  ['sequence', '序号'],
  ['regionCode', '区域编码'],
  ['regionName', '区域名称'],
  ['manager', '客户经理'],
  ['shopCode', '经销商门店编码'],
  ['dealerCode', '经销商编码'],
  ['shopName', '经销商门店名称'],
  ['cabinetStoreName', '店面'],
  ['orderNo', '订单号'],
  ['cabinetNo', '柜单号'],
  ['orderCount', '订单套数'],
  ['salesType', '销售类型'],
  ['productType', '产品类型'],
  ['isSample', '是否上样'],
  ['urgentLevel', '紧急级别'],
  ['custname', '客户姓名'],
  ['orderDesc', '订单描述'],
  ['isEmallOrdr', '是否电商'],
  ['emallChannel', '电商渠道'],
  ['receiveNo', '接单编号'],
  ['customerId', '客户ID'],
  ['customerPhone', '客户预留电话'],
  ['orderTime', '接单时间'],
  ['deliveryDate', '客户要货日期'],
  ['planDoneDate', '生产下线日期'],
  ['purchaseStatus', '是否有外购件'],
  ['currentStatus', '当前状态'],
  ['parallelState1', '并行状态1'],
  ['parallelState2', '并行状态2'],
  ['amount', '金额'],
  ['reviewDone', '审图完成时间'],
  ['drawingDone', '图纸确认完成时间'],
  ['materialDone', '计料审核完成时间'],
  ['quoteDone', '报价处理时间'],
  ['quoteConfirm', '确认报价时间'],
  ['packageDone', '分包完成时间'],
  ['quotaDone', '定额完成时间'],
  ['masterDataDone', '主数据维护完成时间'],
  ['purchaseCodeApply', '外购件编码申请时间'],
  ['purchaseCodeAudit', '外购件编码审核时间'],
  ['purchaseCodeConfirm', '外购件编码确认时间'],
  ['actualDoneDate', '实际生产下线时间'],
  ['vacuumPlan', '吸塑排程日期'],
  ['wardrobePlan', '柜体排程日期'],
  ['coverDoorPlan', '拼框门排程日期'],
  ['slidingDoorPlan', '移门排程日期'],
  ['woodPlan', '实木排程日期'],
  ['bakingPaintPlan', '烤漆排程日期'],
  ['hardwarePlan', '五金排程日期'],
  ['backboardPlan', '背板排程日期'],
  ['doorLeafPlan', '门扇排程日期'],
  ['doorFramePlan', '门套排程日期'],
  ['purchaseDeal', '外购件处理时间'],
  ['purchaseArrival', '外购件到货时间'],
  ['depotDate', '物流入库时间'],
  ['deliveryLogisticsDate', '物流发货时间'],
  ['endedDate', '终止时间'],
  ['suspendDate', '暂停时间'],
  ['recoveryDate', '恢复时间'],
  ['endSuspendReason', '终止/暂停原因'],
] as const;

const menuItems = [
  { label: '我的应用', icon: Grid2X2 },
  { label: '分析看板', icon: BarChart3 },
  { label: '报表中心', icon: FileText },
  { label: '电商运营', icon: PieChart },
  { label: '配置中心', icon: Settings },
  { label: '导入导出', icon: Printer },
  { label: '导入', icon: FolderPlus },
  { label: '自定义报表配置', icon: SlidersHorizontal },
];

const rowSeeds = [
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56663', '李爽刚'],
  ['1001', '四川区域', '刘博文', 'K101109701', '泸州市龙马潭区巨洋大楼华宇装饰轻居店', 'EF56664', '卢艳'],
  ['1011', '山东区域', '李文斌', 'K100565101', '临沂市兰山区柳青街道轻居店', 'EF56665', '郝凤昆'],
  ['1003', '河北区域', '李泽茜', 'K100566502', '沧州市河间市米各庄镇东大线轻居店', 'EF56666', '马亚青'],
  ['1011', '山东区域', '李文斌', 'K100626402', '济南市平阴县榆山街道文笔山路轻居店', 'EF56667', '张兵'],
  ['1011', '山东区域', '李文斌', 'K100626402', '济南市平阴县榆山街道文笔山路轻居店', 'EF56667', '张兵'],
  ['1011', '山东区域', '李文斌', 'K100626402', '济南市平阴县榆山街道文笔山路轻居店', 'EF56667', '张兵'],
  ['1020', '河南区域', '陈海东', 'K100623901', '开封市尉氏县城关镇友家装饰轻居店', 'EF56668', '李花芸'],
  ['1020', '河南区域', '陈海东', 'K100623901', '开封市尉氏县城关镇友家装饰轻居店', 'EF56668', '李花芸'],
  ['1020', '河南区域', '陈海东', 'K100623901', '开封市尉氏县城关镇友家装饰轻居店', 'EF56668', '李花芸'],
  ['1020', '河南区域', '陈海东', 'K100623901', '开封市尉氏县城关镇友家装饰轻居店', 'EF56668', '李花芸'],
  ['1011', '山东区域', '李文斌', 'K101057001', '德州市宁津县曼城街道河西四村轻居店', 'EF56669', '张璐'],
  ['1013', '安徽区域', '肖欢', 'K101085001', '阜阳市阜南县鹿城镇国邦建材城轻居店', 'EF56670', '王小林'],
  ['1020', '河南区域', '陈海东', 'K101097701', '驻马店市泌阳县花园街道中州国际未来装修轻居店', 'EF56671', '李爽刚'],
  ['1001', '四川区域', '刘博文', 'K101109701', '泸州市龙马潭区巨洋大楼华宇装饰轻居店', 'EF56672', '卢艳'],
  ['1011', '山东区域', '李文斌', 'K100626402', '济南市平阴县榆山街道文笔山路轻居店', 'EF56673', '张兵'],
  ['1003', '河北区域', '李泽茜', 'K100566502', '沧州市河间市米各庄镇东大线轻居店', 'EF56674', '马亚青'],
  ['1013', '安徽区域', '肖欢', 'K101085001', '阜阳市阜南县鹿城镇国邦建材城轻居店', 'EF56675', '王小林'],
] as const;

const tableRows: TableRow[] = rowSeeds.map((seed, index) => {
  const [regionCode, regionName, manager, shopCode, shopName, orderNo, custname] = seed;
  const day = String((index % 18) + 1).padStart(2, '0');
  return {
    sequence: String(index + 1),
    regionCode,
    regionName,
    manager,
    shopCode,
    dealerCode: `Z${269716 + index}`,
    shopName,
    cabinetStoreName: `（定橱）（${regionName}）${shopName}`,
    sapCode: String(1004710 + index),
    orderNo,
    cabinetNo: `${orderNo}01`,
    orderCount: '1',
    salesType: '轻居',
    productType: '衣柜',
    isSample: '否',
    urgentLevel: '紧急',
    custname,
    orderDesc: `${shopName}_${custname}_衣柜M9`,
    isEmallOrdr: '否',
    emallChannel: '-',
    receiveNo: `JD202607${day}${String(index + 1).padStart(3, '0')}`,
    customerId: `C26${regionCode}${String(index + 1).padStart(3, '0')}`,
    customerPhone: `13${index % 9}****${6090 + index}`,
    orderTime: `2026-07-${day} 09:30`,
    deliveryDate: `2026-08-${String((index % 20) + 1).padStart(2, '0')}`,
    planDoneDate: `2026-07-${String((index % 10) + 20).padStart(2, '0')}`,
    purchaseStatus: index % 4 === 0 ? '是' : '否',
    currentStatus: '生产中',
    parallelState1: '柜体生产',
    parallelState2: '门板待产',
    amount: `${18 + index},860.00`,
    reviewDone: `2026-07-${day} 11:20`,
    drawingDone: `2026-07-${day} 15:44`,
    materialDone: `2026-07-${day} 16:10`,
    quoteDone: `2026-07-${day} 16:35`,
    quoteConfirm: `2026-07-${day} 17:05`,
    packageDone: `2026-07-${day} 17:30`,
    quotaDone: `2026-07-${day} 18:00`,
    masterDataDone: `2026-07-${day} 18:20`,
    purchaseCodeApply: index % 4 === 0 ? `2026-07-${day} 10:10` : '-',
    purchaseCodeAudit: index % 4 === 0 ? `2026-07-${day} 14:08` : '-',
    purchaseCodeConfirm: index % 4 === 0 ? `2026-07-${day} 17:22` : '-',
    actualDoneDate: '-',
    vacuumPlan: index % 3 === 0 ? '2026-07-28' : '-',
    wardrobePlan: '2026-07-25',
    coverDoorPlan: index % 2 === 0 ? '2026-07-27' : '-',
    slidingDoorPlan: '-',
    woodPlan: '-',
    bakingPaintPlan: index % 4 === 0 ? '2026-07-29' : '-',
    hardwarePlan: '2026-07-26',
    backboardPlan: '2026-07-25',
    doorLeafPlan: index % 2 === 0 ? '2026-07-29' : '-',
    doorFramePlan: '-',
    purchaseDeal: index % 4 === 0 ? `2026-07-${day} 11:00` : '-',
    purchaseArrival: index % 4 === 0 ? '2026-07-30 09:30' : '-',
    depotDate: '-',
    deliveryLogisticsDate: '-',
    endedDate: '-',
    suspendDate: '-',
    recoveryDate: '-',
    endSuspendReason: '-',
  };
});

const yesNo = ['', '是', '否'];
const channels = [['', '全部'], ['1', '天猫'], ['2', '京东'], ['3', '苏宁'], ['4', '唯品会'], ['5', '其他']];

function SelectField({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

function DateValue({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const displayValue = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`;
  return <input type="date" value={displayValue} onChange={(event) => onChange(event.target.value.replaceAll('-', ''))} />;
}

export default function OrderTrackReport() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [submitted, setSubmitted] = useState<Filters>(initialFilters);
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState('');

  const update = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const data = useMemo(() => tableRows.filter((row) => {
    const includes = (value: string, expected: string) => !expected || value.includes(expected);
    return includes(row.orderNo, submitted.orderNo)
      && includes(row.shopName, submitted.shopName)
      && includes(row.custname, submitted.custname)
      && includes(row.customerPhone, submitted.customerPhone)
      && includes(row.sapCode, submitted.sapCode)
      && includes(row.cabinetStoreName, submitted.cabinetStoreName)
      && includes(row.shopCode, submitted.dealerShopCode)
      && (!submitted.isSample || row.isSample === submitted.isSample)
      && (!submitted.isEmallOrdr || row.isEmallOrdr === submitted.isEmallOrdr);
  }), [submitted]);

  const search = () => {
    setSubmitted(filters);
    setToast('');
  };

  const exportData = () => {
    setToast('导出成功，请在导出列表中查看');
    window.setTimeout(() => setToast(''), 3000);
  };

  return <div className="ioc-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-latin">QUANU</span><span>全友</span></div>
      <div className="topbar-main">
        <Menu size={17} strokeWidth={2.2} aria-hidden="true" />
        <div className="breadcrumb"><span>首页</span><b>/</b><strong>订单跟踪报表</strong></div>
        <div className="user-area"><UserRound size={15} fill="currentColor" /><span>王俊励</span><ChevronDown size={14} /></div>
      </div>
    </header>

    <div className="workspace">
      <aside className="sidebar" aria-label="IOC 导航">
        <div className="platform-title">IOC运营平台</div>
        <nav>
          {menuItems.map(({ label, icon: Icon }) => <div className="nav-item" key={label} aria-label={label}>
            <Icon size={17} strokeWidth={2} />
            <span>{label}</span>
          </div>)}
        </nav>
      </aside>

      <main className="main-area">
        <div className="tabbar">
          <div className="tab-close"><X size={18} /></div>
          <div className="active-tab"><Circle size={8} fill="currentColor" /><span>订单跟踪报表</span><X size={13} /></div>
        </div>

        <div className="report-content">
          <section className={`filter-panel ${collapsed ? 'is-collapsed' : ''}`} aria-label="订单筛选条件">
            {!collapsed && <div className="filter-grid">
              <label><span>订单号</span><input value={filters.orderNo} placeholder="请输入" onChange={(event) => update('orderNo', event.target.value)} /></label>
              <label><span>是否上样</span><SelectField value={filters.isSample} onChange={(value) => update('isSample', value)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
              <label><span>是否电商</span><SelectField value={filters.isEmallOrdr} onChange={(value) => update('isEmallOrdr', value)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
              <label><span>电商渠道</span><SelectField value={filters.emallChannelCode} onChange={(value) => update('emallChannelCode', value)}>{channels.map(([value, label]) => <option value={value} key={value || 'all'}>{label}</option>)}</SelectField></label>
              <label><span>门店</span><input value={filters.shopName} placeholder="请输入" onChange={(event) => update('shopName', event.target.value)} /></label>

              <label><span>客户姓名</span><input value={filters.custname} placeholder="请输入" onChange={(event) => update('custname', event.target.value)} /></label>
              <label><span>产品类型</span><SelectField value={filters.prdLevel1Code} onChange={(value) => update('prdLevel1Code', value)}><option value="">全部</option><option value="wardrobe">衣柜</option><option value="cabinet">橱柜</option></SelectField></label>
              <label className="date-range"><span>接单时间</span><div className="date-controls"><DateValue value={filters.startDate} onChange={(value) => update('startDate', value)} /><em>----至----</em><DateValue value={filters.endDate} onChange={(value) => update('endDate', value)} /></div></label>
              <label><span>销售类型</span><SelectField value={filters.cusLevel1Code} onChange={(value) => update('cusLevel1Code', value)}><option value="">全部</option><option value="light">轻居</option><option value="retail">零售</option></SelectField></label>

              <label><span>订单属性</span><SelectField value={filters.orderPropertyCode} onChange={(value) => update('orderPropertyCode', value)}><option value="">全部</option><option value="1">常规单</option><option value="2">补件单</option></SelectField></label>
              <label><span>是否生产下线</span><SelectField value={filters.isActualDone} onChange={(value) => update('isActualDone', value)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
              <label><span>是否物流入库</span><SelectField value={filters.depotFilterQ} onChange={(value) => update('depotFilterQ', value)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
              <label><span>客户电话号码</span><input value={filters.customerPhone} placeholder="请输入" onChange={(event) => update('customerPhone', event.target.value)} /></label>
              <label><span>SAP编码</span><input value={filters.sapCode} placeholder="请输入" onChange={(event) => update('sapCode', event.target.value)} /></label>
              <label><span>定橱店面名称</span><input value={filters.cabinetStoreName} placeholder="请输入" onChange={(event) => update('cabinetStoreName', event.target.value)} /></label>
              <label><span>经销商门店编码</span><input value={filters.dealerShopCode} placeholder="请输入" onChange={(event) => update('dealerShopCode', event.target.value)} /></label>
            </div>}
            <div className="filter-actions">
              <button type="button" className="collapse-button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? '展开' : '收起'}</button>
              <button type="button" className="primary" onClick={search}>查询</button>
              <button type="button" className="primary" onClick={exportData}>导出</button>
            </div>
          </section>

          <section className="table-panel" aria-label="订单跟踪列表">
            <div className="table-scroll">
              <table>
                <thead><tr>{columns.map(([key, label]) => <th key={key} className={`column-${key}`}>{label}</th>)}</tr></thead>
                <tbody>{data.length ? data.map((row) => <tr key={`${row.orderNo}-${row.sequence}`}>{columns.map(([key]) => <td key={key} className={`column-${key}`} title={row[key]}>{row[key]}</td>)}</tr>) : <tr><td className="empty" colSpan={columns.length}>暂无数据</td></tr>}</tbody>
              </table>
            </div>
            <footer className="pagination">
              <span>共 240862 条</span>
              <select defaultValue="50" aria-label="每页条数"><option value="50">50条/页</option></select>
              <button type="button" disabled>‹</button>
              {[1, 2, 3, 4, 5, 6].map((page) => <button type="button" className={page === 1 ? 'current' : ''} key={page}>{page}</button>)}
              <span className="ellipsis">•••</span>
              <button type="button">4818</button>
              <button type="button">›</button>
              <span>前往</span><input aria-label="前往页码" defaultValue="1" /><span>页</span>
            </footer>
          </section>
        </div>
      </main>
    </div>

    <div className="watermark-layer" aria-hidden="true">
      {Array.from({ length: 96 }, (_, index) => <span key={index}>QY-00260959　王俊励　2026-07-22</span>)}
    </div>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
