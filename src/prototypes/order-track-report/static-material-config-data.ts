export type StaticConfigType = 'solution' | 'reason';
export type StaticMaterialType = 'static' | 'electromechanical';
export type StaticConfigItem = { id: number; name: string; enabled: boolean; createdAt: string; createdBy: string };
export type StaticMaterialConfigData = Record<StaticConfigType, Record<StaticMaterialType, StaticConfigItem[]>>;
export type AlertConditionBoundary = 'open' | 'closed';
export type AlertConditionOperator = 'range';
export type AlertCondition = { operator: AlertConditionOperator; min: number; max: number; minBoundary: AlertConditionBoundary; maxBoundary: AlertConditionBoundary };
export type AlertLevelConfigItem = { id: number; retention: AlertCondition; staticMonths: AlertCondition; level: string; severity: string };

export const STATIC_MATERIAL_CONFIG_STORAGE_KEY = 'ioc-static-material-config';
export const ALERT_LEVEL_CONFIG_STORAGE_KEY = 'ioc-alert-level-config';

const makeItems = (names: string[]): StaticConfigItem[] => names.map((name, index) => ({
  id: index + 1,
  name,
  enabled: true,
  createdAt: '2026-08-14 09:00',
  createdBy: '王俊杰',
}));

export const defaultStaticMaterialConfig: StaticMaterialConfigData = {
  solution: {
    static: makeItems(['生产留用', '售后留用', '材料替换', '暂时留存', '采购退货', '报废变卖', '开发新品', '开发特款']),
    electromechanical: makeItems(['生产留用']),
  },
  reason: {
    static: makeItems(['采购大于需求', '计划大于需求', '样品采购', '首批采购', '起订量采购', '停单扣款', '报废拆件', '材料退回', '物料替换', '分厂需求', '计划取消', '业务调整', '设备报废', '常规备料', '战略备料', '专项备料']),
    electromechanical: makeItems(['业务调整', '设备报废', '起订量采购', '物料替换', '材料退回']),
  },
};

export const defaultAlertLevelConfig: AlertLevelConfigItem[] = [
  { id: 1, retention: { operator: 'range', min: 0, max: 30, minBoundary: 'open', maxBoundary: 'open' }, staticMonths: { operator: 'range', min: 0, max: 3, minBoundary: 'open', maxBoundary: 'open' }, level: '-', severity: '正常' },
  { id: 2, retention: { operator: 'range', min: 30, max: 50, minBoundary: 'open', maxBoundary: 'open' }, staticMonths: { operator: 'range', min: 3, max: 6, minBoundary: 'open', maxBoundary: 'open' }, level: '3级', severity: '预警' },
  { id: 3, retention: { operator: 'range', min: 50, max: 70, minBoundary: 'open', maxBoundary: 'open' }, staticMonths: { operator: 'range', min: 6, max: 9, minBoundary: 'open', maxBoundary: 'open' }, level: '2级', severity: '警告' },
  { id: 4, retention: { operator: 'range', min: 70, max: 100, minBoundary: 'open', maxBoundary: 'open' }, staticMonths: { operator: 'range', min: 9, max: 120, minBoundary: 'open', maxBoundary: 'open' }, level: '1级', severity: '高危' },
];

const cloneDefaultConfig = () => JSON.parse(JSON.stringify(defaultStaticMaterialConfig)) as StaticMaterialConfigData;

export const readStaticMaterialConfig = (): StaticMaterialConfigData => {
  if (typeof window === 'undefined') return cloneDefaultConfig();
  try {
    const stored = window.localStorage.getItem(STATIC_MATERIAL_CONFIG_STORAGE_KEY);
    if (!stored) return cloneDefaultConfig();
    const parsed = JSON.parse(stored) as StaticMaterialConfigData;
    if (!parsed?.solution?.static || !parsed?.solution?.electromechanical || !parsed?.reason?.static || !parsed?.reason?.electromechanical) return cloneDefaultConfig();
    // Keep existing browser data while adding newly released system options.
    if (!parsed.solution.static.some(item => item.name === '暂时留存')) {
      parsed.solution.static.splice(3, 0, { id: Date.now(), name: '暂时留存', enabled: true, createdAt: '2026-08-20 09:00', createdBy: '系统' });
    }
    return parsed;
  } catch {
    return cloneDefaultConfig();
  }
};

export const saveStaticMaterialConfig = (data: StaticMaterialConfigData) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(STATIC_MATERIAL_CONFIG_STORAGE_KEY, JSON.stringify(data));
};

export const readAlertLevelConfig = (): AlertLevelConfigItem[] => {
  if (typeof window === 'undefined') return defaultAlertLevelConfig.map(item => ({ ...item }));
  try {
    const stored = window.localStorage.getItem(ALERT_LEVEL_CONFIG_STORAGE_KEY);
    if (!stored) return defaultAlertLevelConfig.map(item => ({ ...item }));
    const parsed = JSON.parse(stored) as AlertLevelConfigItem[];
    if (!Array.isArray(parsed) || parsed.length !== 4) {
      return defaultAlertLevelConfig.map(item => ({ ...item }));
    }
    return parsed.map((item, index) => {
      const source = item && typeof item === 'object' ? item : defaultAlertLevelConfig[index];
      return {
        ...defaultAlertLevelConfig[index],
        ...source,
        retention: normalizeAlertCondition(source.retention, defaultAlertLevelConfig[index].retention),
        staticMonths: normalizeAlertCondition(source.staticMonths, defaultAlertLevelConfig[index].staticMonths),
      };
    });
  } catch {
    return defaultAlertLevelConfig.map(item => ({ ...item }));
  }
};

export const normalizeAlertCondition = (value: unknown, fallback: AlertCondition): AlertCondition => {
  if (value && typeof value === 'object') {
    const candidate = value as Partial<AlertCondition>;
    const boundary = String((candidate as { boundary?: unknown }).boundary || '');
    const minBoundary = String((candidate as { minBoundary?: unknown }).minBoundary || '');
    const maxBoundary = String((candidate as { maxBoundary?: unknown }).maxBoundary || '');
    if (Number.isFinite(Number(candidate.min)) && Number.isFinite(Number(candidate.max)) && ['open', 'closed'].includes(minBoundary) && ['open', 'closed'].includes(maxBoundary)) {
      return {
        operator: 'range',
        min: Number(candidate.min),
        max: Number(candidate.max),
        minBoundary: minBoundary as AlertConditionBoundary,
        maxBoundary: maxBoundary as AlertConditionBoundary,
      };
    }
    if (Number.isFinite(Number(candidate.min)) && Number.isFinite(Number(candidate.max)) && ['open', 'closed'].includes(boundary)) {
      return {
        operator: 'range',
        min: Number(candidate.min),
        max: Number(candidate.max),
        minBoundary: boundary as AlertConditionBoundary,
        maxBoundary: boundary as AlertConditionBoundary,
      };
    }
    if (Number.isFinite(Number(candidate.min)) && ['lt', 'lte', 'between', 'gte', 'gt'].includes(String(candidate.operator))) {
      const min = String(candidate.operator) === 'lt' || String(candidate.operator) === 'lte' ? fallback.min : Number(candidate.min);
      const max = String(candidate.operator) === 'lt' || String(candidate.operator) === 'lte' ? Number(candidate.min) : (Number.isFinite(Number(candidate.max)) ? Number(candidate.max) : fallback.max);
      const operator = String(candidate.operator);
      return {
        operator: 'range',
        min,
        max,
        minBoundary: operator === 'gte' ? 'closed' : 'open',
        maxBoundary: operator === 'lte' ? 'closed' : 'open',
      };
    }
  }
  if (typeof value === 'string') {
    const numbers = value.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (numbers.length >= 2) return { operator: 'range', min: numbers[0], max: numbers[1], minBoundary: value.includes('[') ? 'closed' : 'open', maxBoundary: value.includes(']') ? 'closed' : 'open' };
    if ((value.includes('<') && !value.includes('≤')) || value.includes('小于')) return { operator: 'range', min: fallback.min, max: numbers[0] ?? fallback.max, minBoundary: fallback.minBoundary, maxBoundary: 'open' };
    if (value.includes('≤') || value.includes('不超过')) return { operator: 'range', min: fallback.min, max: numbers[0] ?? fallback.max, minBoundary: fallback.minBoundary, maxBoundary: 'closed' };
    if (value.includes('≥') || value.includes('以上') || value.includes('大于等于') || value.includes('不低于')) return { operator: 'range', min: numbers[0] ?? fallback.min, max: fallback.max, minBoundary: 'closed', maxBoundary: fallback.maxBoundary };
    if (value.includes('大于')) return { operator: 'range', min: numbers[0] ?? fallback.min, max: fallback.max, minBoundary: 'open', maxBoundary: fallback.maxBoundary };
  }
  return { ...fallback };
};

export const formatAlertCondition = (condition: AlertCondition, unit: '%' | '个月') => {
  // Keep the display readable even when an older browser value is incomplete.
  const fallback: AlertCondition = unit === '%'
    ? { operator: 'range', min: 0, max: 30, minBoundary: 'open', maxBoundary: 'open' }
    : { operator: 'range', min: 0, max: 3, minBoundary: 'open', maxBoundary: 'open' };
  const normalized = normalizeAlertCondition(condition, fallback);
  const min = Number.isFinite(Number(normalized.min)) ? Number(normalized.min) : fallback.min;
  const max = Number.isFinite(Number(normalized.max)) ? Number(normalized.max) : min;
  const lowerBracket = normalized.minBoundary === 'closed' ? '[' : '(';
  const upperBracket = normalized.maxBoundary === 'closed' ? ']' : ')';
  return `${lowerBracket}${min}-${max}${unit}${upperBracket}`;
};

type AlertConditionRange = { lower: number; upper: number; lowerInclusive: boolean; upperInclusive: boolean };

const toAlertConditionRange = (condition: AlertCondition): AlertConditionRange | null => {
  if (!Number.isFinite(condition.min) || !Number.isFinite(condition.max) || condition.min >= condition.max) return null;
  return { lower: condition.min, upper: condition.max, lowerInclusive: condition.minBoundary === 'closed', upperInclusive: condition.maxBoundary === 'closed' };
};

const rangesOverlap = (left: AlertConditionRange, right: AlertConditionRange) => {
  const lower = Math.max(left.lower, right.lower);
  const upper = Math.min(left.upper, right.upper);
  if (lower < upper) return true;
  if (lower > upper) return false;
  // Adjacent ranges may share an endpoint; only two inclusive endpoints make
  // that shared point overlap.
  const leftIncludes = lower === left.lower ? left.lowerInclusive : left.upperInclusive;
  const rightIncludes = lower === right.lower ? right.lowerInclusive : right.upperInclusive;
  return leftIncludes && rightIncludes;
};

export const validateAlertLevelConfig = (levels: AlertLevelConfigItem[]) => {
  const dimensions: Array<{ key: 'retention' | 'staticMonths'; label: string }> = [
    { key: 'retention', label: '留存率' },
    { key: 'staticMonths', label: '静态月数' },
  ];
  for (const dimension of dimensions) {
    const ranges = levels.map((level, index) => ({ index, range: toAlertConditionRange(level[dimension.key]) }));
    for (const item of ranges) {
      if (!item.range) return `${dimension.label}第${item.index + 1}档的区间无效，请检查起止值`;
    }
    const validRanges = ranges as Array<{ index: number; range: AlertConditionRange }>;
    for (let left = 0; left < ranges.length; left += 1) {
      for (let right = left + 1; right < ranges.length; right += 1) {
        if (rangesOverlap(validRanges[left].range, validRanges[right].range)) {
          return `${dimension.label}第${left + 1}档与第${right + 1}档范围重叠，请调整后再保存`;
        }
      }
    }
  }
  return null;
};

export const saveAlertLevelConfig = (data: AlertLevelConfigItem[]) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(ALERT_LEVEL_CONFIG_STORAGE_KEY, JSON.stringify(data));
};

export const getEnabledConfigValues = (materialType: StaticMaterialType, configType: StaticConfigType) =>
  readStaticMaterialConfig()[configType][materialType].filter(item => item.enabled).map(item => item.name);
