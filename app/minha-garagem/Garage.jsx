'use client';
/* eslint-disable @next/next/no-html-link-for-pages -- Native anchors preserve the Sites authentication flow. */

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, CarFront, Check, CircleAlert, Heart, History, LoaderCircle, LogOut, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react';
import { Brand, Photo, money, number } from '../components/ui';
import useGarage from '../components/useGarage';
import { legacyFavoriteCandidates } from '../components/useGarageState.mjs';

function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function EmptyState({ icon: Icon, title, children, href, action }) {
  return <div className="garage-empty"><span><Icon size={28} strokeWidth={1.3} /></span><h3>{title}</h3><p>{children}</p><a className="button button-dark" href={href}>{action}<ArrowUpRight size={16} /></a></div>;
}

export default function Garage({ loginUrl, logoutUrl, nativeAuthenticated = false }) {
  const garage = useGarage();
  return <GarageView key={garage.account?.user.userId || garage.phase} garage={garage} loginUrl={loginUrl} logoutUrl={logoutUrl} nativeAuthenticated={nativeAuthenticated} />;
}

function GarageView({ garage, loginUrl, logoutUrl, nativeAuthenticated }) {
  const account = garage.account;
  const [notice, setNotice] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [legacy, setLegacy] = useState({ phase: 'idle', vehicles: [], error: null });
  const legacyGeneration = useRef(0);
  const userId = account?.user?.userId;

  useEffect(() => () => { legacyGeneration.current += 1; }, []);

  async function remove(id) {
    const result = await garage.removeFavorite(id);
    if (result.ok) setNotice('Favorito removido da sua garagem.');
  }

  async function deleteEntry(id) {
    const result = await garage.deleteHistory(id);
    if (result.ok) setNotice('Consulta excluída do seu histórico.');
  }

  async function clear() {
    const result = await garage.clearHistory();
    if (result.ok) { setConfirmClear(false); setNotice('Histórico apagado.'); }
  }

  async function inspectLegacy() {
    if (garage.phase !== 'success' || !userId) return;
    const current = ++legacyGeneration.current;
    setLegacy({ phase: 'loading', vehicles: [], error: null });
    try {
      // Reading this device's old list is an explicit choice after identity is known.
      const raw = localStorage.getItem('vertice-favorites');
      const response = await fetch('/api/catalog', { cache: 'no-store', credentials: 'same-origin' });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.vehicles)) throw new Error('Não foi possível conferir os favoritos deste navegador. Tente novamente.');
      if (current !== legacyGeneration.current) return;
      setLegacy({ phase: 'ready', vehicles: legacyFavoriteCandidates(raw, body.vehicles, garage.favoriteIds), error: null });
    } catch (error) {
      if (current === legacyGeneration.current) setLegacy({ phase: 'error', vehicles: [], error: error.message || 'O navegador não permitiu acessar os favoritos antigos.' });
    }
  }

  async function importLegacy() {
    const result = await garage.importFavorites(legacy.vehicles.map(vehicle => vehicle.id));
    if (result.ok) {
      setLegacy({ phase: 'idle', vehicles: [], error: null });
      await garage.retry();
    }
  }

  const historyPending = garage.pendingKeys.some(key => key.startsWith('history:'));
  const unavailable = account?.favoriteIds.filter(id => !account.favoriteVehicles.some(vehicle => vehicle.id === id)) || [];

  return <div className="garage-page">
    <a href="#minha-garagem" className="skip-link">Ir para Minha garagem</a>
    <header className="garage-header"><a href="/" aria-label="Vértice Motors — início"><Brand /></a><nav aria-label="Navegação da garagem"><a href="/#estoque">Estoque</a><a href="/fipe">Tabela FIPE</a><a href="/minha-garagem" aria-current="page">Minha garagem</a></nav>{(nativeAuthenticated || garage.phase === 'success') && <a className="garage-signout" href={account?.logoutUrl || logoutUrl} target="_top"><LogOut size={15} />Sair</a>}</header>
    <main id="minha-garagem">
      <section className="garage-hero"><div className="garage-shell"><a href="/#estoque" className="garage-back"><ArrowLeft size={14} />Voltar ao estoque</a><div className="garage-hero-grid"><div><span className="eyebrow"><i />MINHA GARAGEM</span><h1>Seu próximo passo.<br /><em>Do seu jeito.</em></h1><p>Seus carros favoritos e as referências que ajudam a escolher. Tudo reunido para continuar de onde parou.</p></div><div className="garage-account-card"><span className="garage-account-icon"><CarFront size={28} strokeWidth={1.2} /></span>{garage.phase === 'success' ? <><span className="garage-account-kicker">CONECTADO COM CHATGPT</span><strong>{account.user.displayName}</strong><p><ShieldCheck size={13} />Uma garagem só sua.</p></> : <><span className="garage-account-kicker">SEU ESPAÇO VÉRTICE</span><strong>{garage.phase === 'loading' ? 'Abrindo sua garagem…' : 'Guarde suas escolhas.'}</strong><p>Favoritos e histórico vinculados à sua conta.</p></>}</div></div></div></section>

      <div className="garage-shell garage-content">
        {garage.phase === 'loading' && <section className="garage-loading" aria-label="Carregando garagem" aria-busy="true"><p role="status"><LoaderCircle size={18} className="garage-spin" />Carregando seus favoritos e consultas…</p><div aria-hidden="true"><span /><span /><span /></div></section>}
        {garage.phase === 'anonymous' && <section className="garage-access"><span className="garage-access-icon"><Heart size={31} strokeWidth={1.3} /></span><span className="eyebrow">SUAS ESCOLHAS ACOMPANHAM VOCÊ</span><h2>Entre. Seu próximo<br />carro pode estar aqui.</h2><p>Conecte sua conta ChatGPT para guardar favoritos e retomar suas consultas FIPE em um só lugar.</p><a href={garage.loginUrl || loginUrl} target="_top" className="button button-red">Entrar com ChatGPT<ArrowUpRight size={17} /></a><a href="/#estoque" className="garage-secondary-link">Explorar o estoque<ArrowUpRight size={14} /></a></section>}
        {garage.phase === 'error' && <section className="garage-access garage-load-error" role="alert"><span className="garage-access-icon"><CircleAlert size={31} strokeWidth={1.3} /></span><span className="eyebrow">UMA PAUSA NO CAMINHO</span><h2>Sua garagem está<br />indisponível agora.</h2><p>{garage.error}</p><button className="button button-dark" onClick={garage.retry}><RefreshCw size={16} />Tentar novamente</button><a href="/#estoque" className="garage-secondary-link">Continuar explorando<ArrowUpRight size={14} /></a></section>}

        {garage.phase === 'success' && <>
          <nav className="garage-overview" aria-label="Seções da garagem"><a href="#favoritos"><Heart size={21} strokeWidth={1.5} /><span><strong>{account.favoriteIds.length}</strong> {account.favoriteIds.length === 1 ? 'favorito' : 'favoritos'}</span><ArrowUpRight size={18} /></a><a href="#historico"><History size={22} strokeWidth={1.5} /><span><strong>{account.history.length}</strong> {account.history.length === 1 ? 'consulta FIPE' : 'consultas FIPE'}</span><ArrowUpRight size={18} /></a><div><ShieldCheck size={21} strokeWidth={1.5} /><p>Escolhas vinculadas<br />à sua conta conectada.</p></div></nav>
          {garage.mutationError && <div className="garage-alert" role="alert"><CircleAlert size={17} /><p>{garage.mutationError} A alteração não foi confirmada.</p></div>}
          {notice && <div className="garage-notice" role="status"><Check size={17} /><p>{notice}</p><button type="button" onClick={() => setNotice('')} aria-label="Dispensar aviso"><X size={16} /></button></div>}

          <section id="favoritos" className="garage-section" aria-labelledby="garage-favorites-title"><div className="garage-section-heading"><div><span className="eyebrow"><i />01 / UM OLHAR ESPECIAL</span><h2 id="garage-favorites-title">Seus <em>favoritos.</em></h2><p>Os carros que merecem uma segunda olhada.</p></div><a className="garage-section-link" href="/#estoque">Explorar mais carros<ArrowUpRight size={17} /></a></div>
            {account.favoriteIds.length ? <><div className="garage-favorites-grid">{account.favoriteVehicles.map(vehicle => <article className="garage-vehicle" key={vehicle.id}><div className="garage-vehicle-image"><a href={`/?vehicle=${encodeURIComponent(vehicle.id)}#estoque`} aria-label={`Ver ${vehicle.brand} ${vehicle.model} ${vehicle.version}`}>{vehicle.photos?.[0] ? <Photo src={vehicle.photos[0]} alt={`${vehicle.brand} ${vehicle.model} — imagem ilustrativa`} width="900" height="600" loading="lazy" /> : <div className="garage-no-photo"><CarFront size={30} />Imagem indisponível</div>}</a><button type="button" className="garage-remove-favorite" disabled={garage.favoritePending(vehicle.id)} aria-busy={garage.favoritePending(vehicle.id)} onClick={() => remove(vehicle.id)} aria-label={`Remover ${vehicle.brand} ${vehicle.model} dos favoritos`}>{garage.favoritePending(vehicle.id) ? <LoaderCircle size={17} className="garage-spin" /> : <Heart size={17} fill="currentColor" />}</button><span>IMAGEM ILUSTRATIVA</span></div><div className="garage-vehicle-body"><div className="garage-vehicle-brand"><span>{vehicle.brand}</span><span>{vehicle.year}</span></div><h3>{vehicle.model}<small>{vehicle.version}</small></h3><p>{number(vehicle.km)} km <span>·</span> {vehicle.transmission}</p><strong>{money(vehicle.price)}</strong><small className="garage-demo-price">À vista · valor demonstrativo</small><a href={`/?vehicle=${encodeURIComponent(vehicle.id)}#estoque`}>Conhecer este carro<ArrowUpRight size={17} /></a></div></article>)}</div>{unavailable.length > 0 && <div className="garage-unavailable"><h3>{unavailable.length === 1 ? 'Um favorito está fora do estoque.' : 'Alguns favoritos estão fora do estoque.'}</h3><p>Você pode removê-los da sua lista.</p>{unavailable.map((id, index) => <div key={id}><span>Favorito indisponível {unavailable.length > 1 ? index + 1 : ''}</span><button type="button" disabled={garage.favoritePending(id)} onClick={() => remove(id)}>Remover<Trash2 size={13} /></button></div>)}</div>}</> : <EmptyState icon={Heart} title="O próximo favorito está por aí." href="/#estoque" action="Encontrar meu próximo carro">Toque no coração de um veículo para guardar sua escolha nesta garagem.</EmptyState>}
          </section>

          <section id="historico" className="garage-section garage-history-section" aria-labelledby="garage-history-title"><div className="garage-section-heading"><div><span className="eyebrow"><i />02 / REFERÊNCIAS PARA DECIDIR</span><h2 id="garage-history-title">Seu histórico <em>FIPE.</em></h2><p>Consultas concluídas com registro confirmado na sua conta.</p></div><a className="garage-section-link" href="/fipe">Fazer uma consulta<ArrowUpRight size={17} /></a></div>
            {account.history.length > 0 ? <><div className="garage-history-toolbar"><span><History size={14} />{account.history.length} {account.history.length === 1 ? 'referência salva' : 'referências salvas'}</span><button type="button" disabled={historyPending} onClick={() => setConfirmClear(true)}><Trash2 size={14} />Apagar histórico</button></div>{confirmClear && <div className="garage-confirm" role="group" aria-label="Confirmar exclusão de todo o histórico"><div><strong>Apagar todas as consultas salvas?</strong><p>Esta ação remove o histórico da sua conta e não pode ser desfeita.</p></div><div><button type="button" disabled={historyPending} className="button button-outline" onClick={() => setConfirmClear(false)}>Cancelar</button><button type="button" disabled={historyPending} className="button button-red" onClick={clear}>{historyPending ? <LoaderCircle size={15} className="garage-spin" /> : <Trash2 size={15} />}Sim, apagar histórico</button></div></div>}<div className="garage-history-list">{account.history.map(entry => { const result = entry.result || {}; const pending = garage.pendingKeys.includes(`history:${entry.id}`); return <article className="garage-history-card" key={entry.id}><div className="garage-history-main"><div className="garage-history-meta"><span>{result.brand}</span><time dateTime={entry.created_at}><CalendarDays size={12} />{dateLabel(entry.created_at)}</time></div><h3>{result.model}</h3><div className="garage-history-tags"><span>{result.modelYear === 32000 ? '0 km' : result.modelYear}</span><span>{result.fuel}</span></div><dl><div><dt>Código FIPE</dt><dd>{result.codeFipe}</dd></div><div><dt>Mês de referência</dt><dd>{result.referenceMonth}</dd></div></dl></div><div className="garage-history-value"><span>PREÇO MÉDIO DE REFERÊNCIA</span><strong>{result.price}</strong><button type="button" disabled={pending || garage.pendingKeys.includes('history:clear')} aria-busy={pending} onClick={() => deleteEntry(entry.id)} aria-label={`Excluir consulta ${result.model}, ${result.modelYear}, de ${dateLabel(entry.created_at)}`}>{pending ? <LoaderCircle size={14} className="garage-spin" /> : <Trash2 size={14} />}Excluir consulta</button></div></article>; })}</div><p className="garage-history-note">Valores relativos ao mês indicado em cada consulta. A referência FIPE pode variar ao longo do tempo e não representa o preço de venda de um veículo.</p></> : <EmptyState icon={History} title="Uma boa escolha começa com referência." href="/fipe" action="Consultar Tabela FIPE">As consultas FIPE concluídas e salvas aparecem aqui. Consultas indisponíveis não são adicionadas ao histórico.</EmptyState>}
          </section>

          <section className="garage-import" aria-labelledby="garage-import-title"><div><span className="garage-import-icon"><Heart size={19} /></span><h3 id="garage-import-title">Já tinha favoritos neste navegador?</h3><p>Confira a lista antiga antes de escolher adicioná-la à conta de <strong>{account.user.displayName}</strong>.</p></div>{legacy.phase === 'idle' || legacy.phase === 'error' ? <button type="button" className="button button-outline" onClick={inspectLegacy}>Conferir favoritos antigos<ArrowUpRight size={15} /></button> : legacy.phase === 'loading' ? <p role="status"><LoaderCircle size={16} className="garage-spin" />Conferindo favoritos…</p> : null}{legacy.phase === 'error' && <p className="garage-import-feedback" role="alert">{legacy.error}</p>}{legacy.phase === 'ready' && <div className="garage-import-review">{legacy.vehicles.length > 0 ? <><p>Estes veículos serão adicionados à sua conta:</p><ul>{legacy.vehicles.map(vehicle => <li key={vehicle.id}>{vehicle.brand} {vehicle.model} <span>{vehicle.version} · {vehicle.year}</span></li>)}</ul><div><button type="button" className="button button-red" disabled={garage.pendingKeys.includes('import')} onClick={importLegacy}>{garage.pendingKeys.includes('import') ? <LoaderCircle size={15} className="garage-spin" /> : <Heart size={15} />}Adicionar {legacy.vehicles.length} {legacy.vehicles.length === 1 ? 'favorito' : 'favoritos'} à minha conta</button><button type="button" className="garage-secondary-link" disabled={garage.pendingKeys.includes('import')} onClick={() => setLegacy({ phase: 'idle', vehicles: [], error: null })}>Cancelar</button></div></> : <p>Nenhum favorito antigo disponível para importar. Sua conta já pode incluir os veículos desta lista.</p>}</div>}</section>
        </>}
      </div>
    </main>
    <footer className="garage-footer"><a href="/" aria-label="Vértice Motors — início"><Brand /></a><p>SEMINOVOS. NOVAS HISTÓRIAS.</p><a href="/#estoque">Encontre seu próximo caminho<ArrowUpRight size={15} /></a><small>Projeto demonstrativo. Estoque, preços de anúncios e imagens ilustrativos.</small></footer>
  </div>;
}
