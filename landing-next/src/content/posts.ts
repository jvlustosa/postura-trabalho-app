export interface BlogPost {
  slug: string
  title: string
  metaTitle: string
  description: string
  ogDescription: string
  twitterDescription: string
  heroImage: string
  heroAlt: string
  tag: string
  tagIcon: string
  lead: string
  date: string
  readTime: string
  breadcrumbLabel: string
  body: string
  relatedSlugs: string[]
}

const posts: BlogPost[] = [
  {
    slug: 'postura-correta-sentado',
    title: 'Postura Correta para Sentar: Guia Completo',
    metaTitle: 'Postura Correta para Sentar: Guia Completo para Trabalho e Home Office | PosturaCerta',
    description: 'Trabalha de casa sentado o dia todo? Aprenda a postura correta na cadeira do home office, com ajustes simples que evitam dor lombar e no pescoço.',
    ogDescription: 'Trabalha de casa sentado o dia todo? Veja como ajustar a postura na cadeira do home office e evitar dor lombar e no pescoço.',
    twitterDescription: 'Trabalha de casa sentado o dia todo? Veja como ajustar a postura na cadeira e evitar dor nas costas.',
    heroImage: '/blog/assets/postura-correta-sentado-hero.jpg',
    heroAlt: 'Ilustração mostrando a postura correta para sentar no computador com linhas de alinhamento',
    tag: 'ERGONOMIA',
    tagIcon: 'Monitor',
    lead: 'Você trabalha de casa e passa mais de seis horas por dia sentado entre calls, entregas e sprints de concentração? Então já sabe como o corpo cobra no final do expediente: dor lombar, tensão no pescoço, ombros travados. No home office, ninguém te corrige — e a cadeira improvisada não ajuda. Este guia mostra, passo a passo, como manter a postura correta sentado e transformar seu setup de vilão em aliado.',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Postura Correta para Sentar',
    relatedSlugs: ['postura-correta', 'como-melhorar-postura', 'ergonomia-home-office'],
    body: `<h2>Por que a postura sentada importa tanto?</h2>

      <p>Quem faz home office facilmente ultrapassa 8 horas sentado por dia — são reuniões consecutivas, almoço rápido na mesma cadeira e aquele "só mais um e-mail" que vira mais uma hora na mesa improvisada. Quando a coluna perde o alinhamento natural durante essas horas, a pressão sobre os discos intervertebrais pode aumentar em até 40% comparado à posição em pé.</p>

      <p>O problema nem sempre aparece como uma dor aguda. Muitas vezes começa com um desconforto leve ao final da tarde, uma rigidez no pescoço que "passa sozinha" ou uma fadiga que parece desproporcional ao esforço. Com o tempo, esses sinais evoluem para dores crônicas, hérnias de disco e alterações posturais difíceis de reverter.</p>

      <p>A boa notícia é que a postura correta para sentar não exige equipamento caro nem sessões demoradas de alongamento. Exige consciência do posicionamento e alguns ajustes simples que cabem em qualquer mesa de trabalho.</p>

      <h2>Como é a postura correta para sentar</h2>

      <p>Pense na postura sentada como uma cadeia: cada segmento do corpo influencia o de cima e o de baixo. Quando um ponto sai do lugar, o restante compensa — e é essa compensação contínua que gera fadiga e dor. Veja a sequência de baixo para cima:</p>

      <p><strong>Pés:</strong> apoiados inteiramente no chão, com a planta toda em contato com a superfície. Se a cadeira for alta demais, use um apoio para os pés. Pés pendurados forçam a parte posterior da coxa e prejudicam a circulação.</p>

      <p><strong>Joelhos:</strong> flexionados em torno de 90°, formando um ângulo reto ou levemente maior. Evite que o assento pressione a parte de trás dos joelhos — deve haver uma folga de dois a três dedos entre a borda do assento e a dobra do joelho.</p>

      <p><strong>Quadril:</strong> encostado no fundo do assento, com o peso distribuído igualmente entre os dois lados. O quadril deve ficar na mesma altura dos joelhos ou ligeiramente acima. Quando o quadril fica mais baixo que os joelhos, a lombar tende a achatar, perdendo a curvatura natural.</p>

      <p><strong>Lombar:</strong> a curva natural da região lombar (lordose) precisa de apoio. Se a cadeira não tem suporte lombar, uma almofada firme ou até uma toalha enrolada resolvem. O apoio deve ficar na altura da cintura, preenchendo o espaço entre as costas e o encosto.</p>

      <p><strong>Ombros:</strong> relaxados, nem elevados perto das orelhas nem jogados para frente. Uma dica prática: levante os ombros até as orelhas, segure por dois segundos e solte. A posição em que eles caem naturalmente é onde devem ficar durante o trabalho.</p>

      <p><strong>Cabeça:</strong> alinhada com o tronco, como se um fio puxasse o topo do crânio para cima. O queixo fica levemente recolhido, sem projetar a cabeça para frente. Cada centímetro que a cabeça avança além do eixo do corpo adiciona cerca de 5 kg de carga sobre a cervical.</p>

      <p><strong>Olhos e tela:</strong> a borda superior do monitor deve ficar na altura dos olhos ou um pouco abaixo. A distância ideal é de um braço estendido. Se você trabalha com notebook, elevar a tela com um suporte e usar teclado externo faz toda a diferença.</p>

      <h2>Postura na cadeira: erros mais comuns</h2>

      <p>Conhecer a posição ideal é metade do caminho. A outra metade é identificar os hábitos que sabotam esse alinhamento sem que você perceba:</p>

      <ul>
        <li><strong>Cruzar as pernas:</strong> parece confortável, mas desalinha o quadril e a pelve, forçando a lombar a compensar. Se o impulso de cruzar for constante, geralmente indica que a cadeira está na altura errada.</li>
        <li><strong>Inclinar-se para frente:</strong> quem se aproxima muito do monitor curva a torácica e projeta a cabeça. Isso acontece bastante quando a tela está pequena demais ou o texto está em fonte reduzida.</li>
        <li><strong>Sentar na borda da cadeira:</strong> sem o apoio do encosto, toda a sustentação recai sobre a musculatura da lombar, que não aguenta esse papel por muitas horas seguidas.</li>
        <li><strong>Apoiar só um braço:</strong> gera uma assimetria sutil que, ao longo de meses, pode causar tensão unilateral no ombro e no pescoço.</li>
        <li><strong>Monitor muito baixo:</strong> notebooks sobre a mesa obrigam o pescoço a flexionar para baixo continuamente. É uma das causas mais frequentes de dor cervical no home office.</li>
      </ul>

      <h2>Ajustes rápidos que fazem diferença</h2>

      <p>Você não precisa trocar todo o mobiliário para melhorar a postura na cadeira. Pequenas correções no setup produzem resultado imediato:</p>

      <ol>
        <li><strong>Altura do monitor:</strong> empilhe livros ou use um suporte até que a borda superior da tela fique na linha dos olhos. Se usa dois monitores, posicione o principal diretamente à sua frente.</li>
        <li><strong>Altura da cadeira:</strong> ajuste para que os pés fiquem totalmente apoiados e os joelhos em 90°. Se a cadeira subir demais para alcançar a mesa, acrescente um apoio para os pés.</li>
        <li><strong>Posição do teclado e mouse:</strong> cotovelos flexionados em 90°, antebraços paralelos ao chão. Pulsos em posição neutra, sem dobrar para cima nem para baixo. Teclado e mouse devem ficar próximos o suficiente para não esticar os braços.</li>
        <li><strong>Pausas regulares:</strong> a melhor postura do mundo não substitui o movimento. Levante-se a cada 45–60 minutos, nem que seja para buscar água. Esses micro-intervalos reativam a circulação e aliviam a compressão dos discos.</li>
        <li><strong>Iluminação:</strong> luz insuficiente faz você se inclinar para a tela. Garanta iluminação adequada no ambiente e reduza reflexos no monitor para evitar essa aproximação involuntária.</li>
      </ol>

      <h2>Como o PosturaCerta ajuda</h2>

      <div class="article__cta-box">
        <h3>Monitore sua postura no home office automaticamente</h3>
        <p>
          Trabalhando de casa, não tem colega para avisar que você está curvado. O PosturaCerta faz esse papel: usa a webcam do seu computador para detectar quando a postura sai do alinhamento e envia um aviso discreto em tempo real. Você calibra sentado na sua melhor posição e o app faz o resto — sem gravar vídeo, sem nuvem, processamento 100% local na sua máquina.
        </p>
        <a
          class="button button--filled"
          href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio"
          target="_blank"
          rel="noopener noreferrer"
        >
          Quero o vitalício por R$ 149
        </a>
      </div>

      <p>Saber a postura certa para sentar é essencial — mas manter essa postura ao longo de 8 horas exige mais do que boa vontade. O corpo relaxa gradualmente, e quando você percebe já está curvado de novo. É nesse ponto que o monitoramento contínuo faz a diferença.</p>

      <p>O PosturaCerta funciona como um lembrete inteligente: não interrompe a cada minuto, mas avisa quando o desvio é real. A calibração personalizada respeita o seu biotipo — afinal, a postura correta de alguém com 1,60 m não é a mesma de quem tem 1,90 m. E o histórico de sessões mostra em que horários sua postura tende a piorar, permitindo ajustes no hábito com base em dados concretos.</p>

      <h2>Checklist: sua postura está certa agora?</h2>

      <p>Faça uma pausa rápida e confira cada item enquanto está sentado:</p>

      <ul>
        <li>Os dois pés estão apoiados no chão (ou em um apoio)?</li>
        <li>Seus joelhos formam um ângulo de aproximadamente 90°?</li>
        <li>O quadril está encostado no fundo do assento?</li>
        <li>A lombar tem apoio e mantém a curvatura natural?</li>
        <li>Os ombros estão relaxados, longe das orelhas?</li>
        <li>A cabeça está alinhada com o tronco, sem projetar para frente?</li>
        <li>A borda superior da tela está na altura dos olhos?</li>
        <li>Seus cotovelos estão em 90° e os punhos em posição neutra?</li>
      </ul>

      <p>Se marcou todos, parabéns — está na posição ideal. Se ajustou dois ou três pontos agora, isso é normal. O corpo desaprende rápido e reaprender exige repetição. A cada vez que você corrige conscientemente, o padrão se fortalece. Com o tempo (e com a ajuda de um monitor como o PosturaCerta), a postura correta para sentar deixa de ser esforço e vira reflexo.</p>`,
  },
  {
    slug: 'postura-correta',
    title: 'Postura Correta: O Que É, Por Que Importa e Como Manter',
    metaTitle: 'Postura Correta: O Que É, Por Que Importa e Como Manter no Dia a Dia | PosturaCerta',
    description: 'O que é postura correta e por que ela é essencial para quem trabalha de home office. Guia prático para manter o alinhamento e evitar dores crônicas.',
    ogDescription: 'O que é postura correta e por que é essencial para quem faz home office. Guia prático para manter o alinhamento no dia a dia de trabalho remoto.',
    twitterDescription: 'Postura correta para quem trabalha de casa: o que é, por que importa e como manter sem complicação.',
    heroImage: '/blog/assets/postura-correta-hero.jpg',
    heroAlt: 'Ilustração de alinhamento corporal e coluna vertebral com postura correta',
    tag: 'SAÚDE',
    tagIcon: 'HeartPulse',
    lead: 'Se você trabalha de home office, provavelmente já percebeu: no meio de uma call longa ou de um sprint de concentração, o corpo vai cedendo sozinho. Postura correta não é ficar rígido como um soldado — é encontrar o equilíbrio que permite passar horas produtivas sem que músculos e articulações paguem a conta no fim do dia.',
    date: '2026-05-18',
    readTime: '7 min',
    breadcrumbLabel: 'Postura Correta',
    relatedSlugs: ['postura-correta-sentado', 'postura-coluna', 'postura-errada'],
    body: `<h2>O que é postura correta, afinal?</h2>
      <p>Para quem passa o dia no computador — e no home office isso pode significar da primeira daily até aquela última tarefa depois do jantar — postura correta é o alinhamento do corpo que distribui a força da gravidade de maneira equilibrada por músculos, ligamentos e ossos. Nesse estado, a coluna vertebral mantém suas curvas naturais — a lordose cervical (pescoço), a cifose torácica (meio das costas) e a lordose lombar (lombar) — sem exageros ou achatamentos.</p>
      <p>Pense na coluna como uma mola em forma de S. Quando respeitamos essas curvas, ela absorve impactos e sustenta o peso da cabeça (que pesa entre 4 e 5 kg) com muito menos esforço. Quando forçamos uma posição retilínea — ou, no extremo oposto, quando relaxamos demais e curvamos as costas — essa mola perde eficiência e a musculatura precisa compensar.</p>
      <p>A postura correta não é uma posição única e estática. O corpo foi feito para se mover, e a melhor postura é aquela que você consegue variar ao longo do dia, sempre voltando para um alinhamento neutro como referência.</p>

      <h2>Por que manter a postura correta é tão difícil</h2>
      <p>Se manter uma boa postura fosse simples, não seria um problema tão comum. Vários fatores conspiraram contra nós:</p>
      <ul>
        <li><strong>A gravidade nunca descansa.</strong> Ela puxa seu corpo para baixo a cada segundo. Ao longo de horas sentado, a tendência natural é ceder — ombros caem para frente, queixo avança em direção à tela.</li>
        <li><strong>Músculos fadigam.</strong> Os músculos posturais profundos (como o transverso do abdômen e os multífidos da coluna) são feitos para trabalho prolongado, mas se estiverem fracos ou descondicionados, cansam rápido.</li>
        <li><strong>O ambiente sabota.</strong> Mesas muito baixas, cadeiras sem regulagem, monitores desalinhados — tudo isso empurra o corpo para compensações que, repetidas milhares de vezes, viram padrão.</li>
        <li><strong>O celular mudou a equação.</strong> Olhar para baixo por longos períodos impõe uma carga de até 27 kg na coluna cervical, segundo estudo publicado na revista <em>Surgical Technology International</em>.</li>
      </ul>
      <p>O ponto não é sentir culpa por ter uma postura ruim. É entender que o ambiente moderno dificulta ativamente a postura correta — e que, por isso, precisamos de estratégias conscientes para compensar.</p>

      <h2>Postura correta da coluna: o que a ciência diz</h2>
      <p>A coluna vertebral saudável apresenta três curvas fisiológicas que se equilibram como um sistema de amortecimento:</p>
      <ol>
        <li><strong>Lordose cervical</strong> — uma leve concavidade na região do pescoço, que permite sustentar a cabeça sobre os ombros.</li>
        <li><strong>Cifose torácica</strong> — uma suave convexidade na região média das costas, onde se conectam as costelas.</li>
        <li><strong>Lordose lombar</strong> — outra concavidade na parte baixa da coluna, essencial para absorver o peso do tronco.</li>
      </ol>
      <p>Pesquisas em biomecânica mostram que a postura correta da coluna é aquela que preserva essas curvas sem exagerá-las. Um estudo clássico de Nachemson, referência em ergonomia, demonstrou que a pressão nos discos intervertebrais muda drasticamente com a posição: sentado com as costas arredondadas, a carga nos discos lombares pode ser até 190% do peso corporal, contra cerca de 100% quando em pé com bom alinhamento.</p>
      <p>Em termos práticos, isso significa que o modo como você posiciona a coluna ao longo do dia tem impacto direto na saúde dos discos e na prevenção de hérnias e protrusões.</p>

      <h2>Postura correta sentado vs. em pé</h2>
      <p>Os princípios fundamentais são os mesmos — coluna neutra, ombros relaxados, cabeça sobre os ombros — mas a aplicação muda conforme a posição.</p>
      <h3>Sentado</h3>
      <ul>
        <li>Pés apoiados no chão ou em um suporte, joelhos próximos a 90°.</li>
        <li>Quadril encostado no fundo da cadeira, com apoio lombar preservando a lordose.</li>
        <li>Ombros soltos (não levantados em direção às orelhas) e antebraços paralelos ao chão.</li>
        <li>Topo do monitor na altura dos olhos, a cerca de um braço de distância.</li>
      </ul>
      <h3>Em pé</h3>
      <ul>
        <li>Peso distribuído igualmente entre os dois pés, joelhos levemente desbloqueados.</li>
        <li>Pelve em posição neutra — nem empinada para frente, nem encaixada demais.</li>
        <li>Orelha, ombro, quadril e tornozelo formando uma linha vertical quando vistos de lado.</li>
      </ul>
      <p>A alternância entre as duas posições é, segundo a ergonomia contemporânea, mais benéfica do que permanecer em qualquer uma delas por horas seguidas.</p>

      <h2>Sinais de que sua postura precisa de atenção</h2>
      <p>O corpo costuma avisar antes que a situação fique grave. Fique atento a estes sinais:</p>
      <ul>
        <li><strong>Dor no pescoço ou na nuca</strong> ao final do expediente, especialmente se piora ao longo da semana.</li>
        <li><strong>Dores de cabeça tensionais</strong> que começam na base do crânio e irradiam para a testa.</li>
        <li><strong>Ombros arredondados</strong> — quando você se vê de lado no espelho, os ombros parecem cair para frente.</li>
        <li><strong>Formigamento nas mãos</strong> ou braços, que pode indicar compressão de nervos na região cervical ou nos ombros.</li>
        <li><strong>Fadiga desproporcional</strong> — cansaço excessivo mesmo sem esforço físico intenso, causado pelo gasto energético de músculos compensando uma postura ineficiente.</li>
      </ul>
      <p>Se algum desses sinais é familiar, não precisa entrar em pânico. A maioria das disfunções posturais responde muito bem a mudanças de hábito, fortalecimento muscular e ajustes no ambiente de trabalho.</p>

      <h2>Como treinar o corpo para a postura correta</h2>
      <p>Corrigir a postura é, acima de tudo, um exercício de consciência. Não basta saber qual é a posição ideal — é preciso lembrar de adotá-la repetidamente, até que vire hábito. Três pilares ajudam nessa transição:</p>
      <h3>1. Consciência corporal</h3>
      <p>O primeiro passo é perceber quando a postura está desalinhada. Isso pode ser feito com lembretes periódicos — um timer no celular, um bilhete no monitor, ou uma ferramenta que monitora sua posição em tempo real. Sem essa percepção, nenhuma correção se sustenta.</p>
      <h3>2. Fortalecimento e mobilidade</h3>
      <p>Músculos posturais fracos não seguram o alinhamento por muito tempo. Exercícios como prancha, remada, glúteo ponte e alongamentos de peitoral e flexores de quadril fortalecem a cadeia posterior e abrem a cadeia anterior — exatamente o que a postura de quem trabalha sentado precisa.</p>
      <h3>3. Ambiente adequado</h3>
      <p>Nenhuma força de vontade compensa uma estação de trabalho mal montada. Ajuste a altura da cadeira, do monitor e do teclado. Se possível, alterne entre sentar e ficar em pé. Pequenos investimentos em ergonomia geram retorno desproporcional em conforto e saúde.</p>

      <div class="article__cta-box">
        <h3>PosturaCerta: seu parceiro de postura no home office</h3>
        <p>No escritório alguém poderia te cutucar, mas em casa você está por conta própria. O PosturaCerta usa a webcam do seu computador para monitorar sua postura em tempo real — 100% local, sem enviar dados para nenhum servidor. Quando detecta que você desalinhou durante aquela call longa, te avisa gentilmente para que você corrija antes que a dor apareça.</p>
        <a href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio" class="button button--filled">
          Quero experimentar o PosturaCerta
        </a>
      </div>

      <p>A diferença entre saber o que é postura correta e realmente mantê-la está nos pequenos lembretes ao longo do dia. Ferramentas de monitoramento, exercícios regulares e um ambiente bem ajustado formam o tripé que transforma conhecimento em hábito — e hábito em saúde de longo prazo.</p>`,
  },
  {
    slug: 'como-melhorar-postura',
    title: 'Como Melhorar a Postura: 7 Hábitos para o Dia a Dia',
    metaTitle: 'Como Melhorar a Postura: 7 Hábitos Que Funcionam no Dia a Dia | PosturaCerta',
    description: 'Como melhorar a postura no home office com 7 hábitos que encaixam na rotina de quem trabalha de casa. Dicas práticas de ergonomia e exercícios rápidos.',
    ogDescription: '7 hábitos para melhorar a postura no home office. Dicas que encaixam entre calls e entregas sem atrapalhar sua rotina.',
    twitterDescription: '7 hábitos para melhorar a postura de quem trabalha de casa. Encaixam na rotina sem parar tudo.',
    heroImage: '/blog/assets/como-melhorar-postura-hero.jpg',
    heroAlt: 'Ilustração de hábitos para melhorar a postura: alongamento, ergonomia e exercícios',
    tag: 'HÁBITOS',
    tagIcon: 'Sparkles',
    lead: 'Quem trabalha de home office sabe: entre uma reunião e outra, o corpo vai cedendo, e quando percebe já está curvado há horas. Postura não é algo que você corrige uma vez e esquece — é um hábito que se constrói dia após dia, encaixado na sua rotina remota. A boa notícia é que pequenas mudanças entre meetings, no almoço ou ao final do expediente já fazem uma diferença enorme.',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Como Melhorar a Postura',
    relatedSlugs: ['postura-correta', 'postura-correta-sentado', 'postura-errada'],
    body: `<p>Se você pesquisou <strong>como melhorar postura</strong>, provavelmente já sente os efeitos do home office no corpo: dor nas costas depois de um dia de calls, tensão no pescoço que piora com a semana, cansaço que parece desproporcional a ficar "só sentado". Esses sinais são o corpo pedindo atenção. E a solução não exige equipamentos caros nem academia — exige consciência e consistência dentro da rotina que você já tem.</p>

      <p>Reunimos aqui <strong>7 hábitos práticos</strong> que você pode começar a aplicar hoje para corrigir sua postura e proteger sua coluna a longo prazo.</p>

      <h2>1. Ajuste sua estação de trabalho</h2>

      <p>O ambiente em que você trabalha define boa parte da sua postura. Antes de pensar em exercícios, organize o básico:</p>

      <ul>
        <li><strong>Monitor na altura dos olhos</strong> — o topo da tela deve ficar alinhado com a linha dos seus olhos. Use um suporte ou livros para elevar o notebook.</li>
        <li><strong>Cadeira com apoio lombar</strong> — os pés devem tocar o chão e os joelhos ficar em ângulo de 90°. Se a cadeira não tiver suporte, uma almofada firme nas costas já ajuda.</li>
        <li><strong>Teclado e mouse próximos ao corpo</strong> — os cotovelos devem ficar próximos ao tronco, formando um ângulo de 90° ou um pouco mais.</li>
      </ul>

      <p>Quem trabalha em home office costuma improvisar na mesa da cozinha ou no sofá. Cada ajuste ergonômico — por menor que pareça — reduz a carga sobre músculos e articulações ao longo do dia.</p>

      <h2>2. Faça pausas a cada 40 minutos</h2>

      <p>Ficar sentado por horas seguidas é um dos maiores inimigos da postura. A cada 40 minutos, levante-se por pelo menos 2 a 3 minutos. Use esse tempo para:</p>

      <ul>
        <li>Caminhar até a cozinha ou o banheiro</li>
        <li>Fazer um alongamento rápido de pescoço e ombros</li>
        <li>Olhar para longe (a regra 20-20-20: a cada 20 minutos, olhe para algo a 20 pés de distância por 20 segundos)</li>
      </ul>

      <p>Micro-pausas quebram o ciclo de tensão acumulada e dão ao corpo a chance de se realinhar naturalmente. O difícil é lembrar — e é aí que a tecnologia ajuda (veja o hábito 4).</p>

      <h2>3. Fortaleça as costas e o core</h2>

      <p>Uma boa postura depende de musculatura forte para sustentá-la. Você não precisa ir à academia: exercícios simples, feitos em casa, já fazem diferença.</p>

      <ul>
        <li><strong>Prancha (30 a 60s)</strong> — fortalece o core inteiro, que é a base da postura.</li>
        <li><strong>Superman (3 × 12 repetições)</strong> — deitado de bruços, levante braços e pernas simultaneamente. Trabalha toda a cadeia posterior.</li>
        <li><strong>Retração escapular</strong> — sentado, puxe os ombros para trás e para baixo, apertando as escápulas. Segure 5 segundos, repita 10 vezes.</li>
      </ul>

      <p>Esses exercícios levam menos de 10 minutos e, feitos 3 vezes por semana, já trazem resultados visíveis em poucas semanas. Músculos fortes sustentam a coluna automaticamente — você não precisa "pensar" em ficar reto o tempo todo.</p>

      <h2>4. Use lembretes automáticos</h2>

      <p>Saber <strong>como corrigir postura</strong> é uma coisa; lembrar de fazer ao longo do dia é outra. A maioria das pessoas começa o dia com boa postura e, depois de uma hora focada no trabalho, já está curvada sobre a tela.</p>

      <p>É por isso que lembretes automáticos funcionam. O <strong>PosturaCerta</strong> usa a webcam do seu computador para monitorar sua postura em tempo real — 100% localmente, sem enviar nenhuma imagem para a nuvem. Quando detecta que você está curvado por tempo demais, envia um alerta discreto na tela.</p>

      <blockquote><p>A diferença entre saber o que fazer e realmente fazer está na consciência constante. Lembretes transformam intenção em ação.</p></blockquote>

      <p>Diferente de um alarme genérico, o PosturaCerta só alerta quando a postura realmente saiu do padrão, evitando notificações desnecessárias.</p>

      <h2>5. Preste atenção na postura ao usar o celular</h2>

      <p>Não adianta cuidar da postura no computador e destruí-la no celular. O chamado <em>text neck</em> — pescoço inclinado para baixo ao olhar o smartphone — coloca até 25 kg de pressão extra na coluna cervical.</p>

      <ul>
        <li>Levante o celular na altura dos olhos em vez de abaixar a cabeça</li>
        <li>Limite o tempo de uso contínuo (5 a 10 minutos por sessão)</li>
        <li>Alterne entre as mãos para evitar assimetrias musculares</li>
      </ul>

      <p>Pode parecer exagero, mas considere quanto tempo você passa no celular por dia. Pequenas mudanças nesse hábito aliviam significativamente a carga sobre o pescoço e os ombros.</p>

      <h2>6. Cuide da postura ao dormir</h2>

      <p>Sua postura não é definida apenas nas horas em que você está acordado. A posição em que você dorme — e a qualidade do colchão e travesseiro — impactam diretamente como sua coluna começa o dia seguinte.</p>

      <ul>
        <li><strong>De lado</strong> — use um travesseiro que preencha o espaço entre o ombro e a orelha, mantendo a coluna alinhada. Colocar um travesseiro entre os joelhos alivia a pressão no quadril.</li>
        <li><strong>De barriga para cima</strong> — use um travesseiro mais baixo e considere um apoio sob os joelhos para preservar a curva lombar natural.</li>
        <li><strong>De bruços</strong> — é a posição menos recomendada, pois força a rotação do pescoço. Se não conseguir mudar, use um travesseiro bem fino ou nenhum.</li>
      </ul>

      <p>Um colchão que afunda demais ou um travesseiro muito alto podem anular todo o esforço que você faz durante o dia. Vale investir nesses itens como parte do cuidado com a postura.</p>

      <h2>7. Comece pequeno e seja consistente</h2>

      <p>O erro mais comum de quem quer <strong>melhorar a postura</strong> é tentar mudar tudo de uma vez. Isso não funciona porque a postura é um hábito — e hábitos se constroem com repetição, não com esforço intenso.</p>

      <p>A técnica do <em>habit stacking</em> é útil aqui: vincule um hábito novo a algo que você já faz. Por exemplo:</p>

      <ul>
        <li>"Quando sentar para trabalhar → ajusto a cadeira e o monitor"</li>
        <li>"Quando pegar o café → faço uma retração escapular"</li>
        <li>"Quando abrir o notebook → ativo o PosturaCerta"</li>
      </ul>

      <p>Em vez de 7 mudanças simultâneas, escolha uma por semana. Em dois meses, todos esses hábitos estarão incorporados naturalmente à sua rotina.</p>

      <h2>Bônus: como o PosturaCerta transforma consciência em hábito</h2>

      <div class="article__cta-box">
        <h3>PosturaCerta — como ter alguém te corrigindo no home office</h3>
        <p>No escritório tinha o colega, o gestor passando atrás. Em casa, é só você e a tela. O PosturaCerta monitora sua postura pela webcam em tempo real, 100% offline e sem armazenar imagens. Alertas discretos entre uma task e outra — e silêncio quando está tudo bem.</p>
        <a href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio" class="button button--filled" target="_blank" rel="noopener">
          Quero o plano vitalício
        </a>
      </div>

      <p>A maioria das dicas sobre como melhorar postura depende da sua memória — e memória falha. O PosturaCerta resolve isso ao trazer consciência automática: você trabalha normalmente e o app cuida de avisar quando algo saiu do lugar.</p>

      <p>É gratuito para experimentar, roda no Linux, Windows e macOS, e toda a análise acontece no seu computador. Seus dados nunca saem da sua máquina.</p>`,
  },
  {
    slug: 'postura-coluna',
    title: 'Postura e Coluna: Como Proteger Sua Coluna no Trabalho',
    metaTitle: 'Postura e Coluna: Como Proteger Sua Coluna Vertebral no Trabalho | PosturaCerta',
    description: 'Como a postura no home office afeta sua coluna vertebral. Conheça o alinhamento ideal e aplique ajustes para prevenir dores e lesões no trabalho remoto.',
    ogDescription: 'Como a postura no home office afeta a coluna. Entenda o alinhamento ideal e previna dores no trabalho remoto.',
    twitterDescription: 'Sua coluna sofre com 8h sentado em casa? Saiba como proteger a coluna no home office com ajustes simples.',
    heroImage: '/blog/assets/postura-coluna-hero.jpg',
    heroAlt: 'Ilustração anatômica da coluna vertebral mostrando postura correta e pontos de pressão',
    tag: 'COLUNA',
    tagIcon: 'Bone',
    lead: 'Sua coluna vertebral não foi projetada para aguentar 8 horas por dia na mesma posição — muito menos no home office, onde a mesa da cozinha, o sofá ou aquela cadeira genérica viram seu "escritório". Descubra o que acontece quando a postura falha trabalhando de casa e como proteger a estrutura mais importante do seu corpo.',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Postura e Coluna',
    relatedSlugs: ['postura-correta', 'postura-correta-sentado', 'como-melhorar-postura'],
    body: `<h2>A relação entre postura e saúde da coluna</h2>
      <p>A coluna vertebral é composta por 33 vértebras distribuídas em cinco regiões: cervical (pescoço), torácica (meio das costas), lombar (parte baixa), sacral e coccígea. Juntas, essas estruturas formam curvaturas naturais em forma de "S" que distribuem o peso do corpo de maneira equilibrada e absorvem impactos.</p>
      <p>Quando a <strong>postura coluna</strong> está alinhada, a carga sobre os discos intervertebrais, músculos e ligamentos é mínima. O corpo funciona com economia de energia. Mas quem trabalha de casa sabe: sem a estrutura de um escritório corporativo — mesa na altura errada, cadeira sem regulagem, notebook no colo ou apoiado em pilhas de livros — manter esse alinhamento vira um desafio diário.</p>
      <p>O problema começa quando passamos horas em posições que distorcem essas curvaturas. No home office, isso acontece de forma ainda mais insidiosa: não há colega do lado percebendo que você está curvado, nem ergonomista fazendo ronda. A flexão excessiva para frente (cifose), a retificação da lordose lombar ou a inclinação lateral constante sobrecarregam estruturas que não estão preparadas para esse estresse prolongado.</p>

      <h2>O que acontece com a coluna quando a postura é ruim</h2>
      <p>Manter a postura inadequada por períodos longos desencadeia uma reação em cadeia no corpo:</p>
      <ul>
        <li><strong>Aumento da pressão discal:</strong> quando você se inclina para frente sem apoio lombar, a pressão nos discos da região L4-L5 pode aumentar até 190% em relação à posição deitada. Ao longo de meses, isso acelera a degeneração discal e pode levar a protrusões e hérnias.</li>
        <li><strong>Compressão nervosa:</strong> discos deslocados ou vértebras desalinhadas podem pressionar raízes nervosas, gerando dor irradiada para braços ou pernas (ciática, por exemplo).</li>
        <li><strong>Tensão muscular crônica:</strong> músculos como o trapézio superior e os eretores da espinha entram em fadiga constante para compensar a falta de alinhamento. O resultado são contraturas, pontos-gatilho e dor que não passa com analgésico.</li>
        <li><strong>Rigidez articular:</strong> a falta de movimento natural reduz a lubrificação das articulações facetárias, tornando a coluna mais rígida e vulnerável a lesões agudas.</li>
      </ul>
      <p>Esses efeitos não aparecem de um dia para o outro. Eles se acumulam silenciosamente — e quando a dor se manifesta, o quadro já está avançado.</p>

      <h2>Postura correta da coluna: alinhamento ideal</h2>
      <p>Entender a <strong>postura correta da coluna</strong> não exige decorar ângulos exatos. O princípio é simples: manter as três curvaturas naturais sem exageros nem retificações.</p>
      <ul>
        <li><strong>Cervical (pescoço):</strong> orelhas alinhadas acima dos ombros. O queixo levemente recolhido, sem projetar a cabeça para frente. A tela do computador deve ficar na altura dos olhos para evitar flexão cervical prolongada.</li>
        <li><strong>Torácica (meio das costas):</strong> ombros relaxados e levemente para trás, sem forçar. O peito aberto, evitando o padrão "corcunda" (cifose exagerada) que se instala após horas curvado sobre o teclado.</li>
        <li><strong>Lombar (parte baixa):</strong> a curvatura natural (lordose) preservada, com apoio do encosto da cadeira ou de um suporte lombar. O quadril posicionado no fundo do assento, formando ângulo próximo a 90–100° com as coxas.</li>
      </ul>
      <p>Pés apoiados no chão completam a cadeia: garantem estabilidade na pelve e evitam inclinação do tronco. Se seus pés não alcançam o chão, use um apoio.</p>

      <h2>Dor na coluna no trabalho: causas mais comuns</h2>
      <p>A <strong>dor coluna trabalho</strong> é uma das queixas mais frequentes em consultórios — e o ambiente de escritório é o principal cenário. As causas se repetem:</p>
      <ol>
        <li><strong>Tempo prolongado sentado:</strong> ficar mais de 50 minutos sem mudar de posição eleva drasticamente a pressão intradiscal. A maioria das pessoas ultrapassa esse limite várias vezes ao dia.</li>
        <li><strong>Ergonomia inadequada:</strong> monitor baixo demais, cadeira sem regulagem, mesa com altura errada. Cada centímetro fora do ideal se traduz em compensações posturais que sobrecarregam a coluna.</li>
        <li><strong>Estresse e tensão emocional:</strong> o estresse ativa os músculos da cintura escapular de forma crônica. O resultado são dores na cervical e no topo das costas que parecem "sem causa" — mas vêm diretamente da tensão acumulada.</li>
        <li><strong>Falta de fortalecimento:</strong> músculos do core fracos não oferecem suporte suficiente à coluna. Sem essa "cinta natural", toda a carga recai sobre as estruturas passivas (discos, ligamentos, cápsulas articulares).</li>
        <li><strong>Uso inadequado do celular:</strong> a "text neck" — inclinação da cabeça para olhar o celular — pode adicionar até 27 kg de carga na cervical. Multiplique isso por centenas de vezes ao dia.</li>
      </ol>

      <h2>5 ajustes para proteger a coluna no dia a dia</h2>
      <p>Não é preciso mudar radicalmente sua rotina. Pequenos ajustes consistentes fazem mais pela coluna do que intervenções esporádicas:</p>
      <ol>
        <li><strong>Levante a cada 45–50 minutos:</strong> defina lembretes (ou deixe o PosturaCerta fazer isso por você). Caminhe por 2 minutos, alongue os braços acima da cabeça, faça uma rotação suave do tronco.</li>
        <li><strong>Ajuste a altura do monitor:</strong> o topo da tela deve estar na linha dos olhos, a uma distância de um braço estendido. Isso elimina a flexão cervical e reduz a fadiga visual.</li>
        <li><strong>Use apoio lombar:</strong> se sua cadeira não tem suporte lombar adequado, uma toalha enrolada ou almofada pequena na região da curva lombar já resolve.</li>
        <li><strong>Fortaleça o core:</strong> exercícios como prancha, ponte de glúteos e dead bug, feitos 3 vezes por semana, constroem a musculatura estabilizadora que protege a coluna no dia a dia.</li>
        <li><strong>Alongue o peitoral e os flexores do quadril:</strong> essas cadeias musculares encurtam com o tempo sentado e puxam os ombros para frente e a pelve para trás. Alongá-las restaura o alinhamento natural.</li>
      </ol>

      <h2>Quando procurar um especialista</h2>
      <p>Nem toda dor nas costas precisa de médico — mas alguns sinais exigem atenção imediata:</p>
      <ul>
        <li>Dor que irradia para pernas ou braços com formigamento ou fraqueza</li>
        <li>Dor que piora progressivamente, sem melhora com repouso ou analgésicos</li>
        <li>Perda de controle da bexiga ou intestino</li>
        <li>Dor após trauma direto (queda, acidente)</li>
        <li>Dor noturna intensa que acorda você</li>
      </ul>
      <p>Nesses casos, procure um ortopedista ou fisiatra. Exames de imagem e avaliação clínica identificarão se há lesão estrutural que precisa de tratamento específico.</p>

      <blockquote>
        <p><strong>Aviso:</strong> este artigo tem caráter informativo e não substitui consulta médica. Se você sente dor persistente na coluna, procure um profissional de saúde qualificado para avaliação e diagnóstico.</p>
      </blockquote>

      <h2>PosturaCerta: prevenção no automático</h2>
      <div class="article__cta-box">
        <h3>Proteja sua coluna no home office — sem precisar lembrar</h3>
        <p>Trabalhando de casa, não tem ninguém pra avisar que você está torto há 40 minutos. O PosturaCerta monitora sua postura em tempo real pela webcam, direto no seu computador. 100% local, sem enviar dados para nenhum servidor. Quando a postura sai do alinhamento, você recebe um alerta discreto para corrigir antes que a dor apareça.</p>
        <a href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio" class="button button--filled" target="_blank" rel="noopener">
          Quero o plano vitalício
        </a>
      </div>`,
  },
  {
    slug: 'ergonomia-home-office',
    title: 'Ergonomia no Home Office: Monte um Espaço que Cuida de Você',
    metaTitle: 'Ergonomia no Home Office: Como Montar um Espaço que Cuida da Sua Postura | PosturaCerta',
    description: 'Checklist de ergonomia para home office: altura da mesa, posição do monitor, cadeira ideal e hábitos que protegem sua postura no trabalho remoto. Prático e direto.',
    ogDescription: 'Aprenda a aplicar ergonomia no home office: altura da mesa, posição do monitor, cadeira ideal e hábitos para proteger sua postura.',
    twitterDescription: 'Aprenda a aplicar ergonomia no home office: altura da mesa, posição do monitor, cadeira ideal e hábitos para proteger sua postura.',
    heroImage: '/blog/assets/ergonomia-home-office-hero.jpg',
    heroAlt: 'Setup ergonômico ideal de home office com cadeira, monitor e mesa ajustados',
    tag: 'HOME OFFICE',
    tagIcon: 'Home',
    lead: 'Você trocou o escritório pela mesa da sala, pelo quarto compartilhado ou por aquele canto improvisado entre a cama e o guarda-roupa. A liberdade do remoto veio — mas junto vieram dores que antes não existiam. A boa notícia: com ergonomia aplicada ao home office, dá pra trabalhar confortável sem gastar uma fortuna nem ter um cômodo exclusivo.',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Ergonomia no Home Office',
    relatedSlugs: ['postura-correta-sentado', 'como-melhorar-postura', 'postura-coluna'],
    body: `<h2>O que é ergonomia e por que importa no home office</h2>
      <p>Ergonomia é a ciência que adapta o ambiente de trabalho ao corpo humano — e não o contrário. No escritório corporativo, mesas, cadeiras e monitores costumam seguir normas técnicas. Em casa, a realidade é outra: mesa de jantar que serve de estação de trabalho, cadeira sem regulagem, notebook no colo durante reuniões. Quando o espaço é dividido com a família ou serve também de quarto, as limitações são ainda maiores.</p>
      <p>O resultado aparece em semanas: dores lombares, tensão no pescoço, formigamento nos punhos e fadiga visual. Segundo estudos de saúde ocupacional, profissionais em home office relatam 30% mais queixas musculoesqueléticas do que quem trabalha em ambientes ergonômicos. E quem está remoto há meses ou anos sente isso no corpo — mesmo sem perceber a causa.</p>
      <p>Aplicar ergonomia no home office não exige um orçamento de escritório corporativo. Exige consciência sobre posicionamento, distâncias e ângulos — ajustes que funcionam até no menor dos espaços e com orçamento apertado.</p>

      <h2>Checklist: mesa, cadeira e monitor</h2>
      <p>Esses três elementos formam a base do seu espaço de trabalho. Se eles estiverem errados, nenhum acessório vai compensar.</p>

      <h3>Mesa</h3>
      <ul>
        <li><strong>Altura ideal:</strong> entre 72 cm e 75 cm para a maioria das pessoas (cotovelos formam 90° ao digitar)</li>
        <li><strong>Profundidade:</strong> pelo menos 60 cm para manter o monitor na distância correta</li>
        <li>Antebraços devem repousar na superfície sem elevar os ombros</li>
      </ul>

      <h3>Cadeira</h3>
      <ul>
        <li><strong>Pés apoiados no chão</strong> com coxas paralelas ao solo</li>
        <li><strong>Encosto:</strong> suporte na curvatura lombar (a lordose natural)</li>
        <li><strong>Profundidade do assento:</strong> 2–3 dedos entre a borda e a parte de trás do joelho</li>
        <li>Braços da cadeira na mesma altura da mesa (ou levemente abaixo)</li>
      </ul>

      <h3>Monitor</h3>
      <ul>
        <li><strong>Distância:</strong> um braço esticado (50–70 cm)</li>
        <li><strong>Altura:</strong> topo da tela na linha dos olhos ou levemente abaixo</li>
        <li><strong>Inclinação:</strong> leve tilt para trás (10–20°) para reduzir reflexo e tensão cervical</li>
      </ul>
      <p>Se usa notebook sem monitor externo, um suporte para elevar a tela + teclado externo é obrigatório para manter o pescoço neutro.</p>

      <h2>Iluminação e temperatura</h2>
      <p>A ergonomia visual é tão importante quanto a postural. Iluminação inadequada causa fadiga ocular, dor de cabeça e aumenta a tendência de inclinar o tronco para se aproximar da tela.</p>
      <ul>
        <li><strong>Luz natural lateral</strong> — nunca atrás ou diretamente de frente para a tela</li>
        <li><strong>Luminária de mesa</strong> com temperatura de cor entre 4000K e 5000K (branco neutro)</li>
        <li>Evite trabalhar em ambientes escuros com a tela como única fonte de luz</li>
      </ul>
      <p>Quanto à temperatura, o conforto térmico fica entre 22°C e 26°C. Frio excessivo gera contração muscular involuntária, que acentua tensões no trapézio e nos ombros.</p>

      <h2>Acessórios que fazem diferença (sem gastar muito)</h2>
      <p>Você não precisa de um setup gamer para ter ergonomia. Alguns acessórios simples resolvem os problemas mais comuns:</p>
      <ul>
        <li><strong>Apoio lombar:</strong> uma almofada firme posicionada na curvatura lombar já melhora o suporte da cadeira</li>
        <li><strong>Suporte de notebook:</strong> modelos em alumínio ou até um suporte improvisado com livros elevam a tela para a altura dos olhos</li>
        <li><strong>Apoio de pés:</strong> essencial para quem tem a mesa alta demais e não consegue regular a cadeira</li>
        <li><strong>Teclado e mouse externos:</strong> permitem manter ombros relaxados e punhos em posição neutra</li>
        <li><strong>Fone com microfone:</strong> evita a postura de prender o celular entre orelha e ombro em reuniões</li>
      </ul>

      <h2>Pausas e movimento: a ergonomia invisível</h2>
      <p>O melhor setup do mundo não substitui o movimento. O corpo humano não foi projetado para ficar estático por horas. A ergonomia invisível é feita de micro-pausas e variação postural.</p>
      <ul>
        <li><strong>Regra 25/5:</strong> a cada 25 minutos de trabalho focado, levante-se por 5 minutos</li>
        <li><strong>Alongamentos ativos:</strong> rotação de ombros, extensão cervical e flexão lateral do tronco — 30 segundos por exercício</li>
        <li><strong>Variação postural:</strong> alterne entre sentado, em pé (se tiver mesa regulável) e breves caminhadas</li>
        <li><strong>Hidratação:</strong> além do benefício para a saúde, levantar para beber água cria pausas naturais</li>
      </ul>
      <p>O problema é que, no estado de concentração, esquecemos de tudo. É exatamente aí que a tecnologia pode ajudar.</p>

      <div class="article__cta-box">
        <h3>O guardião da sua postura no home office</h3>
        <p>Você ajustou o que podia no seu cantinho de trabalho em casa. Mas depois de duas horas de call ou daquela entrega urgente, quem avisa que você desmoronou na cadeira? O PosturaCerta usa sua webcam para monitorar sua postura em tempo real — 100% local, sem enviar dados — e alerta quando você sai da posição ideal. É o colega que cuida de você quando não tem mais ninguém olhando.</p>
        <a href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio" class="button button--filled">
          Quero o PosturaCerta
        </a>
      </div>

      <h2>Ergonomia no home office: resumo prático</h2>
      <p>Aqui está um checklist rápido para revisar seu espaço hoje:</p>
      <ol>
        <li><strong>Mesa:</strong> cotovelos em 90° ao digitar, antebraços apoiados</li>
        <li><strong>Cadeira:</strong> pés no chão, lombar apoiada, joelhos livres da borda do assento</li>
        <li><strong>Monitor:</strong> topo na linha dos olhos, a um braço de distância</li>
        <li><strong>Iluminação:</strong> luz natural lateral, luminária neutra, sem tela como única fonte</li>
        <li><strong>Acessórios:</strong> suporte de notebook + teclado externo se não usar monitor</li>
        <li><strong>Pausas:</strong> levantar a cada 25–30 min, alongar ombros e pescoço</li>
        <li><strong>Consciência postural:</strong> usar o PosturaCerta para manter o hábito mesmo quando o foco consome sua atenção</li>
      </ol>
      <p>Ergonomia no home office não é luxo — é prevenção. Cada ajuste que você faz hoje evita uma dor crônica amanhã. E com a combinação de ambiente bem montado + monitoramento inteligente, você trabalha mais confortável, mais produtivo e sem colocar sua saúde em risco.</p>`,
  },
  {
    slug: 'postura-errada',
    title: 'Postura Errada: Sinais, Consequências e Como Corrigir',
    metaTitle: 'Postura Errada: Sinais, Consequências e Como Corrigir Antes que Doa | PosturaCerta',
    description: 'Sinais de postura errada que quem trabalha de casa ignora: dor no pescoço, ombro travado, lombar queimando. Saiba como corrigir antes que vire crônico.',
    ogDescription: 'Trabalha de casa e sente dor no fim do dia? Esses são sinais de postura errada. Veja como corrigir antes que vire crônico.',
    twitterDescription: 'Sinais de postura errada que quem faz home office ignora. Corrija antes que vire dor crônica.',
    heroImage: '/blog/assets/postura-errada-hero.jpg',
    heroAlt: 'Comparação visual de postura errada vs postura correta ao sentar no computador',
    tag: 'PREVENÇÃO',
    tagIcon: 'ShieldAlert',
    lead: 'Quem trabalha de casa conhece o ciclo: começa o dia sentado direitinho, mas depois de horas entre calls, e-mails e entregas, percebe que está curvado, com o pescoço projetado e a lombar sem apoio nenhum. A postura errada se instala sem aviso — e quando você nota, já está doendo.',
    date: '2026-05-18',
    readTime: '6 min',
    breadcrumbLabel: 'Postura Errada',
    relatedSlugs: ['postura-correta', 'como-melhorar-postura', 'postura-coluna'],
    body: `<h2>Como saber se sua postura está errada</h2>
      <p>A postura errada raramente aparece de uma vez. No home office, ela se instala aos poucos durante o dia: um ombro que cai durante uma reunião longa, o queixo que avança para enxergar melhor a tela do notebook, a lombar que perde a curva porque a cadeira de casa não tem suporte. Sem ninguém do lado para avisar, o corpo vai compensando em silêncio.</p>
      <p>Faça um teste rápido agora mesmo, na sua estação de trabalho em casa: fique de lado diante de um espelho e observe três pontos. Seus ombros estão arredondados para a frente? Sua cabeça projeta para além da linha dos ombros? Sua pelve está inclinada para a frente, acentuando a curvatura lombar?</p>
      <p>Esses são os três padrões posturais mais comuns em quem trabalha sentado:</p>
      <ul>
        <li><strong>Ombros arredondados (cifose torácica):</strong> o peito se fecha, os músculos das costas se alongam em excesso e os peitorais encurtam.</li>
        <li><strong>Cabeça projetada para a frente:</strong> para cada centímetro de projeção, a coluna cervical suporta até 4,5 kg a mais de carga. É como carregar uma bola de boliche no pescoço.</li>
        <li><strong>Inclinação anterior da pelve:</strong> a lombar se arqueia demais, comprimindo discos e gerando tensão nos flexores do quadril.</li>
      </ul>
      <p>Se você identificou pelo menos um desses sinais, sua postura já está compensando. A boa notícia: quanto antes você percebe, mais fácil é corrigir.</p>

      <h2>Postura certa e errada: as diferenças que importam</h2>
      <p>Quando falamos em postura certa e errada, não existe uma posição perfeita e estática. Postura correta é um alinhamento dinâmico em que a coluna mantém suas curvas naturais — cervical, torácica e lombar — sem esforço excessivo de nenhum grupo muscular.</p>
      <p>Na prática, a diferença entre postura certa e errada se resume ao equilíbrio. Imagine uma linha reta descendo do ouvido até o tornozelo: na postura neutra, essa linha passa pelo ombro, quadril e joelho. Na postura errada, a cabeça vai para frente, os ombros caem e o quadril desalinha.</p>
      <p>As consequências desse desalinhamento não são apenas estéticas. Quando a coluna perde a neutralidade, cada articulação ao redor precisa compensar. Músculos que deveriam estabilizar passam a sustentar, ligamentos recebem carga que não foram projetados para aguentar e as articulações começam a desgastar de forma desigual.</p>

      <h2>Consequências da postura errada no longo prazo</h2>
      <p>A postura errada é silenciosa no curto prazo, mas devastadora no longo. As consequências se acumulam como juros compostos — e quando a conta chega, o problema já é sério.</p>
      <ul>
        <li><strong>Dor crônica:</strong> cervical, lombar e ombros são os primeiros a reclamar. A dor começa como um incômodo e evolui para algo que acompanha você o dia inteiro.</li>
        <li><strong>Cefaleia tensional:</strong> a tensão nos músculos do pescoço e trapézio irradia para a cabeça. Muitas dores de cabeça que parecem enxaqueca são, na verdade, consequência direta da postura errada.</li>
        <li><strong>Hérnia de disco:</strong> a pressão assimétrica sobre os discos intervertebrais, mantida por meses ou anos, pode levar a protrusões e hérnias — especialmente na lombar e na cervical.</li>
        <li><strong>Problemas respiratórios:</strong> com o peito fechado e os ombros para frente, o diafragma perde amplitude de movimento. A respiração fica superficial, reduzindo a oxigenação e aumentando o cansaço.</li>
        <li><strong>Impacto no humor e na energia:</strong> estudos mostram que a postura curvada está associada a níveis mais altos de cortisol e menor sensação de confiança. Não é coincidência que você se sente mais disposto quando se endireita.</li>
      </ul>
      <p>Nenhuma dessas consequências aparece do dia para a noite. Elas são resultado de meses e anos acumulando microlesões que o corpo tenta compensar — até não conseguir mais.</p>

      <h2>Por que a postura piora sem você perceber</h2>
      <p>Se a postura errada é tão prejudicial, por que a maioria das pessoas só percebe quando já está com dor? A resposta está na forma como o corpo se adapta.</p>
      <p><strong>Gravidade é implacável.</strong> Seu corpo luta contra ela o dia inteiro. Quando os músculos estabilizadores cansam, o esqueleto assume a carga — e aí começa o desalinhamento.</p>
      <p><strong>Telas capturam sua atenção.</strong> Ninguém senta errado de propósito. Mas quando o foco está no trabalho, no celular ou na série, o corpo escorrega para a posição de menor esforço. E menor esforço quase sempre significa postura errada.</p>
      <p><strong>Músculos fracos não sustentam.</strong> O core, os estabilizadores da escápula e os extensores da coluna precisam de força para manter o alinhamento. Sem exercício, eles atrofiam e a postura cede.</p>
      <p><strong>Falta de feedback.</strong> Esse é o fator mais subestimado. Sem alguém — ou algo — lembrando você, a postura errada se torna o novo normal. O cérebro recalibra e passa a interpretar a posição torta como neutra.</p>

      <h2>5 passos para corrigir a postura errada</h2>
      <p>Corrigir a postura errada não exige revolução. Exige consistência. Aqui estão os cinco passos mais eficazes:</p>
      <ol>
        <li><strong>Construa consciência corporal.</strong> O primeiro passo é perceber quando a postura sai do lugar. Defina lembretes a cada 30 minutos para fazer um "check-in postural" — ou use uma ferramenta que faça isso por você.</li>
        <li><strong>Ajuste sua ergonomia.</strong> Topo do monitor na altura dos olhos, pés apoiados no chão, cotovelos a 90 graus. Parece simples, mas esses ajustes removem a causa mecânica da postura errada.</li>
        <li><strong>Fortaleça os músculos certos.</strong> Exercícios para extensores da coluna, rotadores externos do ombro e core profundo (transverso abdominal) fazem mais pela postura do que horas de alongamento.</li>
        <li><strong>Faça pausas com movimento.</strong> A cada 50 minutos, levante-se, alongue o peito, estenda a coluna e caminhe por dois minutos. A melhor postura é a próxima postura.</li>
        <li><strong>Use monitoramento contínuo.</strong> Consciência sozinha não basta — porque o foco no trabalho sempre vence. Uma ferramenta que monitora sua postura em tempo real fecha o ciclo de feedback que falta.</li>
      </ol>

      <h2>PosturaCerta: o feedback que faltava</h2>
      <div class="article__cta-box">
        <h3>No home office, quem avisa que sua postura entortou?</h3>
        <p>Sem colegas por perto e sem ergonomista no escritório, a postura errada se instala livre. O PosturaCerta usa a webcam do seu computador para detectar quando você sai do alinhamento e te alerta em tempo real. Funciona 100% local — nenhuma imagem sai do seu computador.</p>
        <a href="https://wa.me/5512982218937?text=Tenho%20interesse%20no%20plano%20vital%C3%ADcio" class="button button--filled button--cta">
          Quero corrigir minha postura
        </a>
      </div>
      <p>Diferente de dicas que você esquece em cinco minutos, o PosturaCerta age no momento exato em que sua postura errada aparece. Ele preenche a lacuna entre saber o que fazer e realmente fazer — porque te avisa quando você mais precisa.</p>`,
  },
]

export function getAllPosts(): BlogPost[] {
  return posts
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug)
}
