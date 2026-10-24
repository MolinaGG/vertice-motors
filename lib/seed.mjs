const rows=[
 ['onix-2022','Chevrolet','Onix','LT 1.0',2022,2021,62900,38500,'Hatch','Manual','Vermelho','1.0 flex',true,'onix'],
 ['hb20-2021','Hyundai','HB20','Vision 1.0',2021,2020,58900,46200,'Hatch','Manual','Branco','1.0 flex',true,'hb20'],
 ['polo-2023','Volkswagen','Polo','Track 1.0',2023,2023,68900,24800,'Hatch','Manual','Prata','1.0 MPI flex',true,'polo'],
 ['argo-2022','Fiat','Argo','Drive 1.0',2022,2021,59900,41700,'Hatch','Manual','Cinza','1.0 flex',false,'argo'],
 ['kwid-2022','Renault','Kwid','Zen 1.0',2022,2021,42900,32600,'Hatch','Manual','Branco','1.0 flex',false,'kwid'],
 ['mobi-2023','Fiat','Mobi','Like 1.0',2023,2022,46900,27400,'Hatch','Manual','Preto','1.0 flex',false,'mobi'],
 ['prisma-2019','Chevrolet','Prisma','LT 1.4 AT',2019,2018,57900,68300,'Sedã','Automático','Prata','1.4 flex',false,'prisma'],
 ['hb20s-2022','Hyundai','HB20S','Vision 1.0',2022,2021,66900,36100,'Sedã','Manual','Cinza','1.0 flex',false,'hb20s'],
 ['versa-2021','Nissan','Versa','Sense 1.6 CVT',2021,2020,73900,49200,'Sedã','Automático','Branco','1.6 flex',false,'versa'],
 ['tcross-2022','Volkswagen','T-Cross','200 TSI AT',2022,2021,99900,43900,'SUV','Automático','Vermelho','1.0 turbo flex',true,'tcross'],
 ['tracker-2022','Chevrolet','Tracker','LT 1.0 Turbo AT',2022,2021,95900,39700,'SUV','Automático','Prata','1.0 turbo flex',false,'tracker'],
 ['strada-2022','Fiat','Strada','Freedom 1.3 CD',2022,2021,87900,52700,'Picape','Manual','Branco','1.3 flex',false,'strada']
];
export const seedVehicles=rows.map(([id,brand,model,version,year,manufacture_year,price,km,category,transmission,color,engine,featured,image])=>({id,brand,model,version,year,manufacture_year,price,km,category,transmission,fuel:'Flex',color,engine,featured,doors:4,seats:5,status:'available',archived:false,photos:[`/images/${image}.webp`,`/images/${image}-rear.webp`],equipment:['Ar-condicionado','Direção assistida','Vidros elétricos dianteiros','Sistema de som','Freios ABS','Airbags frontais'],description:`${model} ${version}: uma escolha para ${category==='SUV'?'quem quer espaço e versatilidade':category==='Sedã'?'levar sua rotina mais longe com conforto':category==='Picape'?'o trabalho e os planos de fim de semana':'viver a cidade com praticidade'}. Configuração, preço e histórico são ilustrativos; confirme todos os detalhes na visita.`,notes:'Anúncio demonstrativo. Equipamentos, condição documental e histórico devem ser confirmados na avaliação de um veículo real.'}));
export const seedSettings={name:'Vértice Motors',address:'Av. Horizonte, 1200 · São Paulo, SP (endereço fictício)',hours:'Segunda a sexta, 9h–18h · Sábado, 9h–14h',email:'contato@vertice.example',whatsapp:'',story:'Acreditamos que escolher um carro é escolher o que vem depois. A Vértice nasceu para tornar essa decisão mais clara: informações que você entende, tempo para conhecer cada detalhe e uma conversa sem pressa. Esta é uma loja fictícia criada para demonstrar uma experiência de compra mais cuidadosa.'};
