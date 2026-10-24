export function simulateFinance(price, entry, months, rate) {
 if([price,entry,months,rate].some(v=>!['number','string'].includes(typeof v)||typeof v==='string'&&!v.trim()))throw new Error('Preencha preço, entrada, prazo e taxa.');
 const values=[price,entry,months,rate].map(Number);
 [price,entry,months,rate]=values;
 if(values.some(v=>!Number.isFinite(v))||price<=0||price>10000000||entry<0||entry>price||!Number.isInteger(months)||months<1||months>240||rate<0||rate>20)throw new Error('Confira preço, entrada, prazo e taxa.');
 const financed=price-entry,i=rate/100;
 const payment=financed===0?0:i===0?financed/months:financed*i/(-Math.expm1(-months*Math.log1p(i)));
 const installments=payment*months;
 return {financed,payment,installments,interest:installments-financed,total:installments+entry};
}
