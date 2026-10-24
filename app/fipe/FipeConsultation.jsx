'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- Native links match the Vinext site's navigation. */

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, CarFront, Check, ChevronDown, CircleAlert, ExternalLink, Fuel, Hash, Info, LoaderCircle, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Brand } from '../components/ui';
import { changeFipeSelection, filterFipeModels, fipeResourceForKey } from '../../lib/domain/fipe.mjs';
import './fipe-account.css';

const OFFICIAL_URL = 'https://www.fipe.org.br/pt-br/indices/veiculos/';
const initialSelection = { brand: '', model: '', year: '', filter: '' };

function useFipeResource(query, attempt = 0) {
  const [state, setState] = useState(null);
  const [retry, setRetry] = useState(0);
  const key = query === null ? null : `${query}|${retry}|${attempt}`;

  useEffect(() => {
    if (key === null) return;
    const controller = new AbortController();
    let current = true;
    async function load() {
      try {
        const isQuote = new URLSearchParams(query || '').has('year');
        const response = await fetch(`/api/fipe${query ? `?${query}` : ''}`, { method: isQuote ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
        const body = await response.json();
        if (!response.ok) {
          const error = new Error(body.error?.message || 'Não foi possível carregar a consulta. Tente novamente.');
          error.code = body.error?.code;
          error.retryAfter = body.error?.retryAfter;
          throw error;
        }
        if (current) setState({ key, phase: 'success', data: body.data, error: null, savedToHistory: body.saved_to_history === true, historyError: typeof body.history_error === 'string' ? body.history_error : null, loginRequired: body.login_required === true });
      } catch (error) {
        if (current && error.name !== 'AbortError') setState({ key, phase: 'error', data: null, error });
      }
    }
    load();
    return () => { current = false; controller.abort(); };
  }, [key, query]);

  return { ...fipeResourceForKey(state, key), retry: () => setRetry(value => value + 1) };
}

function ResourceFeedback({ resource, emptyMessage, label }) {
  if (resource.phase === 'loading') return <p className="fipe-field-feedback" role="status"><LoaderCircle className="fipe-spin" size={14} />Carregando {label}…</p>;
  if (resource.phase === 'error') return <div className="fipe-field-error" role="alert"><p><CircleAlert size={15} />{resource.error.message}</p><button type="button" onClick={resource.retry}><RefreshCw size={13} />Tentar novamente</button><a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer">Consultar no site da FIPE<ExternalLink size={12} /></a></div>;
  if (resource.phase === 'success' && !resource.data?.length) return <p className="fipe-field-feedback">{emptyMessage}</p>;
  return null;
}

function SelectField({ id, label, number, value, onChange, disabled, placeholder, items, hint }) {
  return <div className="fipe-field">
    <label htmlFor={id}><span>{number}</span>{label}</label>
    <div className="fipe-select-wrap"><select id={id} value={value} onChange={onChange} disabled={disabled} required aria-describedby={hint ? `${id}-hint` : undefined}><option value="">{placeholder}</option>{items.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select><ChevronDown size={17} aria-hidden="true" /></div>
    {hint && <p id={`${id}-hint`} className="fipe-field-hint">{hint}</p>}
  </div>;
}

export default function FipeConsultation() {
  const [selection, setSelection] = useState(initialSelection);
  const [submittedQuery, setSubmittedQuery] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const brands = useFipeResource('');
  const models = useFipeResource(selection.brand ? `brand=${selection.brand}` : null);
  const years = useFipeResource(selection.brand && selection.model ? `brand=${selection.brand}&model=${selection.model}` : null);
  const quote = useFipeResource(submittedQuery, attempt);
  const filteredModels = useMemo(() => filterFipeModels(models.data || [], selection.filter), [models.data, selection.filter]);
  const selectedModel = (models.data || []).find(item => item.code === selection.model);
  // Keep a selected version visible when its search filter changes.
  const modelOptions = selectedModel && !filteredModels.some(item => item.code === selectedModel.code) ? [selectedModel, ...filteredModels] : filteredModels;
  const ready = Boolean(selection.brand && selection.model && selection.year);
  const price = quote.phase === 'success' ? quote.data : null;

  function choose(field, value) {
    setSelection(current => changeFipeSelection(current, field, value));
    if (field !== 'filter') setSubmittedQuery(null);
  }

  function consult(event) {
    event.preventDefault();
    if (!ready) return;
    setAttempt(value => value + 1);
    setSubmittedQuery(`brand=${selection.brand}&model=${selection.model}&year=${selection.year}`);
  }

  return <div className="fipe-page">
    <a href="#consulta-fipe" className="skip-link">Ir para a consulta FIPE</a>
    <header className="fipe-header"><a href="/" aria-label="Vértice Motors — início"><Brand /></a><div className="fipe-account-nav"><a className="fipe-garage-link" href="/minha-garagem">Minha garagem<ArrowUpRight size={13} /></a><a href="/#estoque" className="fipe-back"><ArrowLeft size={15} /><span>Voltar ao estoque</span></a></div></header>
    <main id="consulta-fipe">
      <section className="fipe-hero" aria-labelledby="fipe-title"><div className="fipe-hero-inner"><div><span className="eyebrow"><i />INFORMAÇÃO PARA O SEU PRÓXIMO PASSO</span><h1 id="fipe-title">Toda boa escolha<br />começa com <em>referência.</em></h1><p>Consulte a Tabela FIPE e conheça o preço médio de um carro. A versão certa, o ano-modelo e o mês fazem a diferença.</p></div><div className="fipe-hero-aside"><span className="fipe-outline-icon"><CarFront size={31} strokeWidth={1.2} /></span><strong>Consulta FIPE</strong><span>Carros · Referência nacional</span><div className="fipe-free"><Check size={13} />Consulta gratuita</div></div></div></section>
      <section className="fipe-workspace" aria-label="Consulta de preço médio de carros">
        <div className="fipe-form-card"><div className="fipe-section-label"><span>01 / SEU VEÍCULO</span><span><ShieldCheck size={13} />Sem dados pessoais</span></div><h2>Encontre a sua versão.</h2><p className="fipe-form-intro">Selecione os dados conforme o documento do veículo. O ano-modelo pode ser diferente do ano de fabricação.</p>
          <form onSubmit={consult}>
            <SelectField id="fipe-brand" label="Marca" number="01" value={selection.brand} onChange={event => choose('brand', event.target.value)} disabled={brands.phase !== 'success' || !brands.data?.length} placeholder={brands.phase === 'loading' ? 'Carregando marcas…' : 'Selecione a marca'} items={brands.data || []} />
            <ResourceFeedback resource={brands} label="marcas" emptyMessage="Nenhuma marca disponível no momento." />
            <div className="fipe-model-group"><div className="fipe-model-label"><label htmlFor="fipe-model-filter"><span>02</span>Modelo e versão</label>{models.phase === 'success' && <span>{models.data.length} versões</span>}</div><div className="fipe-search-wrap"><Search size={16} aria-hidden="true" /><input id="fipe-model-filter" type="search" value={selection.filter} onChange={event => choose('filter', event.target.value)} disabled={models.phase !== 'success' || !models.data?.length} placeholder="Digite para filtrar os modelos" autoComplete="off" maxLength={100} aria-describedby="fipe-model-hint" /></div><div className="fipe-select-wrap"><select id="fipe-model" aria-label="Selecione o modelo e a versão" value={selection.model} onChange={event => choose('model', event.target.value)} disabled={models.phase !== 'success' || !modelOptions.length} required aria-describedby="fipe-model-hint"><option value="">{!selection.brand ? 'Primeiro selecione a marca' : models.phase === 'loading' ? 'Carregando modelos…' : 'Selecione o modelo completo'}</option>{modelOptions.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select><ChevronDown size={17} aria-hidden="true" /></div><p id="fipe-model-hint" className="fipe-field-hint">Confira motorização, câmbio, número de portas e versão.</p>{models.phase === 'success' && selection.filter && <p className="fipe-filter-count" role="status">{filteredModels.length ? `${filteredModels.length} ${filteredModels.length === 1 ? 'versão encontrada' : 'versões encontradas'}` : 'Nenhuma versão encontrada. Tente outro termo.'}{selectedModel && !filteredModels.some(item => item.code === selectedModel.code) ? ' A versão selecionada continua disponível.' : ''}</p>}<ResourceFeedback resource={models} label="modelos" emptyMessage="Nenhum modelo encontrado para esta marca." /></div>
            <SelectField id="fipe-year" label="Ano-modelo e combustível" number="03" value={selection.year} onChange={event => choose('year', event.target.value)} disabled={years.phase !== 'success' || !years.data?.length} placeholder={!selection.model ? 'Primeiro selecione o modelo' : years.phase === 'loading' ? 'Carregando anos…' : 'Selecione o ano-modelo'} items={years.data || []} hint="Escolha o ano-modelo e o combustível exatos da versão." />
            <ResourceFeedback resource={years} label="anos disponíveis" emptyMessage="Nenhum ano disponível para esta versão." />
            <button type="submit" className="button button-red fipe-submit" disabled={!ready || quote.phase === 'loading'}>{quote.phase === 'loading' ? <><LoaderCircle className="fipe-spin" size={17} />Consultando referência…</> : <>Consultar valor FIPE<ArrowUpRight size={18} /></>}</button><p className="fipe-form-note">Consulta por marca, modelo e ano. Nenhuma placa é necessária.</p>
          </form>
        </div>
        <div className="fipe-result-column"><section className={`fipe-result-card ${price ? 'fipe-result-ready' : ''}`} aria-label="Resultado da consulta" aria-live="polite" aria-atomic="true" aria-busy={quote.phase === 'loading'}><div className="fipe-section-label"><span>02 / SUA REFERÊNCIA</span><span className="fipe-result-dot" /></div>
          {price ? <><div className="fipe-result-identity"><span>{price.brand}</span><h2>{price.model}</h2></div><div className="fipe-price-block"><span>PREÇO MÉDIO DE REFERÊNCIA</span><strong>{price.price}</strong><span className="fipe-reference-month"><CalendarDays size={15} />Referência: <b>{price.referenceMonth}</b></span></div><dl className="fipe-result-data"><div><dt><CarFront size={15} />Ano-modelo</dt><dd>{price.modelYear === 32000 ? '0 km' : price.modelYear}</dd></div><div><dt><Fuel size={15} />Combustível</dt><dd>{price.fuel}</dd></div><div><dt><Hash size={15} />Código FIPE</dt><dd>{price.codeFipe}</dd></div></dl><p className="fipe-result-note"><Info size={15} />Preço médio nacional. O valor de negociação pode variar conforme região, conservação e características do veículo.</p>{quote.savedToHistory ? <div className="fipe-history-status"><Check size={15}/><p>Consulta salva no seu histórico. <a href="/minha-garagem#historico">Ver Minha garagem<ArrowUpRight size={12}/></a></p></div> : quote.loginRequired ? <div className="fipe-history-status fipe-history-login"><Info size={15}/><p>Este resultado não foi salvo. <a href="/minha-garagem">Entre na Minha garagem</a> para guardar as próximas consultas.</p></div> : <div className="fipe-history-status fipe-history-unsaved"><CircleAlert size={15}/><p>O valor foi consultado, mas não foi salvo no histórico. {quote.historyError || 'O registro está indisponível no momento.'} <a href="/minha-garagem">Abrir Minha garagem<ArrowUpRight size={12}/></a></p></div>}</> : quote.phase === 'loading' ? <div className="fipe-result-placeholder"><span className="fipe-result-icon"><LoaderCircle className="fipe-spin" size={32} strokeWidth={1.2} /></span><h2>Buscando sua referência.</h2><p>Consultando o valor e o mês de referência para a versão selecionada.</p></div> : quote.phase === 'error' ? <div className="fipe-result-placeholder fipe-result-error"><span className="fipe-result-icon"><CircleAlert size={32} strokeWidth={1.2} /></span><h2>{quote.error.code === 'RATE_LIMITED' ? 'Uma breve pausa nas consultas.' : 'Referência indisponível.'}</h2><p>{quote.error.message}</p>{quote.error.retryAfter && <p className="fipe-retry-hint">Tente novamente em aproximadamente {Math.ceil(quote.error.retryAfter / 60)} {Math.ceil(quote.error.retryAfter / 60) === 1 ? 'minuto' : 'minutos'}.</p>}<button type="button" className="button button-white" onClick={quote.retry}><RefreshCw size={15} />Tentar novamente</button><a className="fipe-official-link" href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer">Abrir consulta oficial da FIPE<ExternalLink size={14} /></a></div> : <div className="fipe-result-placeholder"><span className="fipe-result-icon"><CarFront size={37} strokeWidth={1.1} /></span><span className="fipe-placeholder-dash" aria-hidden="true">R$ —</span><h2>O próximo passo<br />é conhecer o valor.</h2><p>Selecione a marca, a versão e o ano-modelo. Sua referência aparece aqui após a consulta.</p></div>}
        </section><div className="fipe-context-note"><Info size={19} strokeWidth={1.5} /><p><strong>Uma referência para decidir melhor.</strong>A Tabela FIPE expressa preços médios. Ela não substitui a avaliação individual nem representa uma oferta de compra ou venda.</p></div></div>
      </section>
      <section className="fipe-guide" aria-labelledby="fipe-guide-title"><div><span className="eyebrow"><i />ANTES DE COMPARAR</span><h2 id="fipe-guide-title">Os detalhes<br />mudam o <em>valor.</em></h2></div><div className="fipe-guide-items"><article><span>01</span><div><h3>Versão exata.</h3><p>Um mesmo modelo pode ter motores, câmbios e equipamentos diferentes. Confira a descrição completa.</p></div></article><article><span>02</span><div><h3>Ano-modelo.</h3><p>Use o ano-modelo do documento. Um carro fabricado em um ano pode pertencer ao modelo do ano seguinte.</p></div></article><article><span>03</span><div><h3>Mês de referência.</h3><p>Os preços são atualizados mensalmente. Compare valores do mesmo período e considere a condição do veículo.</p></div></article></div></section>
      <section className="fipe-source"><div><span className="fipe-source-label">SOBRE ESTA CONSULTA</span><p>Dados fornecidos por <a href="https://deividfortuna.github.io/fipe/v2/" target="_blank" rel="noopener noreferrer">Fipe API, de Deivid Fortuna<ExternalLink size={11} /></a>, um serviço terceiro independente da Fundação Instituto de Pesquisas Econômicas. A consulta é gratuita e sujeita à disponibilidade e aos limites do provedor.</p><p>A Vértice Motors é um projeto demonstrativo com catálogo fictício. Os valores consultados nesta página vêm do serviço de referência e não são vinculados automaticamente aos anúncios.</p></div><a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="fipe-official-button">Consultar no site da FIPE<ArrowUpRight size={18} /></a></section>
    </main><footer className="fipe-footer"><a href="/" aria-label="Voltar à Vértice Motors"><Brand /></a><span>SEMINOVOS. NOVAS HISTÓRIAS.</span><a href="/#estoque">Explore o estoque<ArrowUpRight size={14} /></a></footer>
  </div>;
}
