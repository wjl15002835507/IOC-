/**
 * @name 订单跟踪报表
 */
import { useMemo, useState } from 'react';
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
};

const initialFilters: Filters = {
  orderNo: '', isSample: '', isEmallOrdr: '', emallChannelCode: '', shopName: '', custname: '',
  prdLevel1Code: '', startDate: '20260621', endDate: '20260721', cusLevel1Code: '', orderPropertyCode: '', isActualDone: '', depotFilterQ: '',
};

const columns = [
  ['agencyCode', '办事处'], ['shopCode', '经销商门店编码'], ['shopName', '经销商门店名称'], ['receiveNo', '接单编号'], ['orderNo', '订单号'], ['prdLevel1Name', '销售类型'], ['cusLevel1Name', '产品类型'], ['custname', '客户姓名'], ['isSample', '是否上样'], ['isEmallOrdr', '是否电商'], ['onlineRetailerScanalto', '电商渠道'], ['orderDesc', '订单描述'], ['urgentLevel', '紧急级别'], ['customerId', '客户ID'], ['customerReservedTelephone', '客户预留电话'], ['orderTime', '接单时间'], ['deliveryDate', '客户要货日期'], ['planOrderDoneDate', '生产下线日期'], ['purchaseStatus', '是否有外购件'], ['curStatus', '当前状态'], ['parallelState1', '并行状态1'], ['parallelState2', '并行状态2'], ['drawAmt', '金额'], ['endedDateReview', '审图完成时间'], ['endedDateConfirm', '图纸确认完成时间'], ['endedDateSplitOrder', '计料审核完成时间'], ['endedDateCost', '报价处理时间'], ['ordrPayTm', '确认报价时间'], ['packageFinishDate', '分包完成时间'], ['finishDateFixedPrice', '定额完成时间'], ['finishDateMainData', '主数据维护完成时间'], ['finishDateApply', '外购件编码申请时间'], ['finishDateAuditing', '外购件编码审核时间'], ['finishDateConfirm', '外购件编码确认时间'], ['actualEndedDate', '实际生产下线时间'], ['planDateVacuumMolding', '吸塑排程日期'], ['planDateWardrobe', '柜体排程日期'], ['planDateCoverDoor', '拼框门排程日期'], ['planDateSlidingDoor', '移门排程日期'], ['planDateWood', '实木排程日期'], ['planDateBakingPaint', '烤漆排程日期'], ['planDateHardware', '五金排程日期'], ['planDateBackboard', '背板排程日期'], ['planDateDoorLeaf', '门扇排程日期'], ['planDateDoorFrame', '门套排程日期'], ['finishDateDeal', '外购件处理时间'], ['finishDateArrival', '外购件到货时间'], ['partDepotIntoDate', '物流入库时间'], ['partDeliverDate', '物流发货时间'], ['endedDate', '终止时间'], ['suspendDate', '暂停时间'], ['recoveryDate', '恢复时间'], ['endSuspendReason', '终止/暂停原因'],
] as const;

const rows = [
  { agencyCode: '华南办', shopCode: 'GD00186', shopName: '全友家居广州天河店', receiveNo: 'JD20260721001', orderNo: 'SO202607210001', prdLevel1Name: '零售', cusLevel1Name: '全屋定制', custname: '张先生', isSample: '否', isEmallOrdr: '否', onlineRetailerScanalto: '-', orderDesc: '现代简约全屋柜体', urgentLevel: '普通', customerId: 'C24000186', customerReservedTelephone: '138****6218', orderTime: '2026-07-18 10:23', deliveryDate: '2026-08-12', planOrderDoneDate: '2026-08-05', purchaseStatus: '否', curStatus: '生产中', parallelState1: '柜体生产', parallelState2: '门板待产', drawAmt: '35,680.00', endedDateReview: '2026-07-19 11:20', endedDateConfirm: '2026-07-19 15:44', endedDateSplitOrder: '2026-07-20 09:15', endedDateCost: '2026-07-18 14:35', ordrPayTm: '2026-07-18 16:06', packageFinishDate: '2026-07-21 09:40', finishDateFixedPrice: '2026-07-20 13:20', finishDateMainData: '2026-07-20 16:50', finishDateApply: '-', finishDateAuditing: '-', finishDateConfirm: '-', actualEndedDate: '-', planDateVacuumMolding: '2026-07-28', planDateWardrobe: '2026-07-25', planDateCoverDoor: '-', planDateSlidingDoor: '-', planDateWood: '-', planDateBakingPaint: '-', planDateHardware: '2026-07-26', planDateBackboard: '2026-07-25', planDateDoorLeaf: '2026-07-29', planDateDoorFrame: '-', finishDateDeal: '-', finishDateArrival: '-', partDepotIntoDate: '-', partDeliverDate: '-', endedDate: '-', suspendDate: '-', recoveryDate: '-', endSuspendReason: '-' },
  { agencyCode: '华东办', shopCode: 'JS00521', shopName: '全友家居南京江宁店', receiveNo: 'JD20260720018', orderNo: 'SO202607200018', prdLevel1Name: '零售', cusLevel1Name: '整家套餐', custname: '陈女士', isSample: '是', isEmallOrdr: '是', onlineRetailerScanalto: '天猫', orderDesc: '轻奢卧室套餐', urgentLevel: '加急', customerId: 'C24000521', customerReservedTelephone: '139****0366', orderTime: '2026-07-16 14:08', deliveryDate: '2026-08-03', planOrderDoneDate: '2026-07-29', purchaseStatus: '是', curStatus: '待外购件', parallelState1: '柜体完成', parallelState2: '外购件到货中', drawAmt: '22,860.00', endedDateReview: '2026-07-17 10:18', endedDateConfirm: '2026-07-17 17:08', endedDateSplitOrder: '2026-07-18 09:42', endedDateCost: '2026-07-16 16:12', ordrPayTm: '2026-07-16 16:38', packageFinishDate: '2026-07-18 15:30', finishDateFixedPrice: '2026-07-18 11:05', finishDateMainData: '2026-07-18 16:35', finishDateApply: '2026-07-19 10:10', finishDateAuditing: '2026-07-19 14:08', finishDateConfirm: '2026-07-19 17:22', actualEndedDate: '-', planDateVacuumMolding: '-', planDateWardrobe: '2026-07-23', planDateCoverDoor: '2026-07-24', planDateSlidingDoor: '-', planDateWood: '-', planDateBakingPaint: '2026-07-27', planDateHardware: '2026-07-23', planDateBackboard: '2026-07-23', planDateDoorLeaf: '2026-07-27', planDateDoorFrame: '-', finishDateDeal: '2026-07-20 11:00', finishDateArrival: '2026-07-22 09:30', partDepotIntoDate: '-', partDeliverDate: '-', endedDate: '-', suspendDate: '-', recoveryDate: '-', endSuspendReason: '-' },
  { agencyCode: '西南办', shopCode: 'SC00307', shopName: '全友家居成都武侯店', receiveNo: 'JD20260719033', orderNo: 'SO202607190033', prdLevel1Name: '工程', cusLevel1Name: '橱柜', custname: '李先生', isSample: '否', isEmallOrdr: '否', onlineRetailerScanalto: '-', orderDesc: '厨房橱柜及五金', urgentLevel: '普通', customerId: 'C24000307', customerReservedTelephone: '137****8159', orderTime: '2026-07-15 09:46', deliveryDate: '2026-08-08', planOrderDoneDate: '2026-08-01', purchaseStatus: '否', curStatus: '已排产', parallelState1: '待开料', parallelState2: '待五金', drawAmt: '18,420.00', endedDateReview: '2026-07-15 15:20', endedDateConfirm: '2026-07-16 09:08', endedDateSplitOrder: '2026-07-16 14:50', endedDateCost: '2026-07-15 11:30', ordrPayTm: '2026-07-15 13:10', packageFinishDate: '2026-07-17 10:25', finishDateFixedPrice: '2026-07-16 16:40', finishDateMainData: '2026-07-17 09:20', finishDateApply: '-', finishDateAuditing: '-', finishDateConfirm: '-', actualEndedDate: '-', planDateVacuumMolding: '-', planDateWardrobe: '2026-07-24', planDateCoverDoor: '-', planDateSlidingDoor: '-', planDateWood: '-', planDateBakingPaint: '-', planDateHardware: '2026-07-24', planDateBackboard: '2026-07-24', planDateDoorLeaf: '-', planDateDoorFrame: '-', finishDateDeal: '-', finishDateArrival: '-', partDepotIntoDate: '-', partDeliverDate: '-', endedDate: '-', suspendDate: '-', recoveryDate: '-', endSuspendReason: '-' },
];

const yesNo = ['', '是', '否'];
const channels = [['', '全部'], ['1', '天猫'], ['2', '京东'], ['3', '苏宁'], ['4', '唯品会'], ['5', '其他']];

function SelectField({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>;
}

export default function OrderTrackReport() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [submitted, setSubmitted] = useState<Filters>(initialFilters);
  const [toast, setToast] = useState('');
  const update = (key: keyof Filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const data = useMemo(() => rows.filter((row) => {
    const includes = (value: string, expected: string) => !expected || value.includes(expected);
    const channel = channels.find(([id]) => id === submitted.emallChannelCode)?.[1] ?? '';
    return includes(row.orderNo, submitted.orderNo) && includes(row.shopName, submitted.shopName) && includes(row.custname, submitted.custname)
      && (!submitted.isSample || row.isSample === submitted.isSample) && (!submitted.isEmallOrdr || row.isEmallOrdr === submitted.isEmallOrdr)
      && (!submitted.emallChannelCode || row.onlineRetailerScanalto === channel) && (!submitted.isActualDone || (submitted.isActualDone === '否' && row.actualEndedDate === '-'))
      && (!submitted.depotFilterQ || (submitted.depotFilterQ === '否' && row.partDepotIntoDate === '-'));
  }), [submitted]);
  const search = () => { setSubmitted(filters); setToast(''); };
  const exportData = () => { setToast('导出成功,请在导出列表中查看'); window.setTimeout(() => setToast(''), 3000); };

  return <div className="order-track-app">
    <header className="report-heading"><h1>订单跟踪报表</h1></header>
    <section className="filter-panel" aria-label="订单筛选条件">
      <div className="filters">
        <label>订单号<input value={filters.orderNo} placeholder="请输入" onChange={(e) => update('orderNo', e.target.value)} /></label>
        <label>是否上样<SelectField value={filters.isSample} onChange={(v) => update('isSample', v)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
        <label>是否电商<SelectField value={filters.isEmallOrdr} onChange={(v) => update('isEmallOrdr', v)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
        <label>电商渠道<SelectField value={filters.emallChannelCode} onChange={(v) => update('emallChannelCode', v)}>{channels.map(([value, label]) => <option value={value} key={value || 'all'}>{label}</option>)}</SelectField></label>
        <label>门店<input value={filters.shopName} placeholder="请输入" onChange={(e) => update('shopName', e.target.value)} /></label>
        <label>客户姓名<input value={filters.custname} placeholder="请输入" onChange={(e) => update('custname', e.target.value)} /></label>
        <label>产品类型<SelectField value={filters.prdLevel1Code} onChange={(v) => update('prdLevel1Code', v)}><option value="">全部</option><option value="whole">全屋定制</option><option value="kitchen">橱柜</option></SelectField></label>
        <label>接单时间<input type="date" value={`${filters.startDate.slice(0, 4)}-${filters.startDate.slice(4, 6)}-${filters.startDate.slice(6)}`} onChange={(e) => update('startDate', e.target.value.replaceAll('-', ''))} /></label>
        <label className="date-end">----至----<input type="date" value={`${filters.endDate.slice(0, 4)}-${filters.endDate.slice(4, 6)}-${filters.endDate.slice(6)}`} onChange={(e) => update('endDate', e.target.value.replaceAll('-', ''))} /></label>
        <label>销售类型<SelectField value={filters.cusLevel1Code} onChange={(v) => update('cusLevel1Code', v)}><option value="">全部</option><option value="retail">零售</option><option value="project">工程</option></SelectField></label>
        <label>订单属性<SelectField value={filters.orderPropertyCode} onChange={(v) => update('orderPropertyCode', v)}><option value="">全部</option><option value="1">常规单</option><option value="2">补件单</option></SelectField></label>
        <label>是否生产下线<SelectField value={filters.isActualDone} onChange={(v) => update('isActualDone', v)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
        <label>是否物流入库<SelectField value={filters.depotFilterQ} onChange={(v) => update('depotFilterQ', v)}>{yesNo.map((item) => <option value={item} key={item || 'all'}>{item || '全部'}</option>)}</SelectField></label>
      </div>
      <div className="filter-actions"><button type="button" className="primary" onClick={search}>查询</button><button type="button" className="primary" onClick={exportData}>导出</button></div>
    </section>
    <section className="table-panel" aria-label="订单跟踪列表">
      <div className="table-caption"><span>订单跟踪列表</span><span className="result-count">共 {data.length} 条</span></div>
      <div className="table-scroll"><table><thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{data.length ? data.map((row) => <tr key={row.orderNo}>{columns.map(([key]) => <td key={key} className={key === 'curStatus' ? 'status-cell' : ''}>{row[key]}</td>)}</tr>) : <tr><td className="empty" colSpan={columns.length}>暂无数据</td></tr>}</tbody></table></div>
      <footer className="pagination"><span>共 {data.length} 条</span><select defaultValue="50" aria-label="每页条数"><option value="50">50条/页</option></select><button type="button" disabled>‹</button><span className="page-current">1</span><button type="button" disabled>›</button></footer>
    </section>
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>;
}
