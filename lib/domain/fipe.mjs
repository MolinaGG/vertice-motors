const idPattern = /^[1-9]\d{0,6}$/;
const yearPattern = /^(?:19\d{2}|20\d{2}|32000)-[1-9]$/;

export function parseFipeQuery(params) {
  const allowed = new Set(['brand', 'model', 'year']);
  for (const key of params.keys()) {
    if (!allowed.has(key) || params.getAll(key).length !== 1) throw new Error('Consulta inválida.');
  }
  const brand = params.get('brand'), model = params.get('model'), year = params.get('year');
  if ((brand !== null && !idPattern.test(brand)) || (model !== null && (!brand || !idPattern.test(model))) || (year !== null && (!model || !yearPattern.test(year)))) {
    throw new Error('Consulta inválida.');
  }
  let path = '/cars/brands', stage = 'brands';
  if (brand) { path += `/${brand}/models`; stage = 'models'; }
  if (model) { path += `/${model}/years`; stage = 'years'; }
  if (year) { path += `/${year}`; stage = 'price'; }
  return { stage, path };
}

function text(value, max = 240) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Resposta inválida do serviço.');
  return value.trim();
}

export function normalizeFipePayload(stage, payload) {
  if (['brands', 'models', 'years'].includes(stage)) {
    if (!Array.isArray(payload) || payload.length > 5000) throw new Error('Resposta inválida do serviço.');
    const seen = new Set();
    return payload.map(item => {
      const code = text(item?.code, 16), name = text(item?.name);
      if (!(stage === 'years' ? yearPattern : idPattern).test(code) || seen.has(code)) throw new Error('Resposta inválida do serviço.');
      seen.add(code);
      return { code, name: stage === 'years' ? name.replace(/^32000\b/, '0 km') : name };
    });
  }
  if (stage !== 'price' || !payload || Array.isArray(payload)) throw new Error('Resposta inválida do serviço.');
  const price = text(payload.price, 40), codeFipe = text(payload.codeFipe, 8);
  if (!/^R\$\s?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/.test(price) || Number(price.replace(/[^\d,]/g, '').replace(',', '.')) <= 0 || !/^\d{6}-\d$/.test(codeFipe) || payload.vehicleType !== 1 || !Number.isInteger(payload.modelYear) || !(payload.modelYear === 32000 || (payload.modelYear >= 1900 && payload.modelYear < 2100))) {
    throw new Error('Resposta inválida do serviço.');
  }
  return {
    vehicleType: 1, price, brand: text(payload.brand), model: text(payload.model),
    modelYear: payload.modelYear, fuel: text(payload.fuel, 80), codeFipe,
    referenceMonth: text(payload.referenceMonth, 80), fuelAcronym: text(payload.fuelAcronym, 8),
  };
}

const searchText = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function filterFipeModels(models, query) {
  const words = searchText(query).trim().split(/\s+/).filter(Boolean);
  return words.length ? models.filter(item => words.every(word => searchText(item.name).includes(word))) : models;
}

export function changeFipeSelection(selection, field, value) {
  if (field === 'brand') return { ...selection, brand: value, model: '', year: '', filter: '' };
  if (field === 'model') return { ...selection, model: value, year: '' };
  if (field === 'year' || field === 'filter') return { ...selection, [field]: value };
  return selection;
}

export function fipeResourceForKey(state, key) {
  if (key === null) return { phase: 'idle', data: null, error: null };
  return state?.key === key ? state : { phase: 'loading', data: null, error: null };
}
