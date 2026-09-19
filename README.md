# Visualização e Análise de Estruturas em Árvores Avançadas

Implementação de uma aplicação web interativa em React com TypeScript para o estudo, visualização em tempo real e análise de complexidade de estruturas de dados hierárquicas avançadas (Trie, Árvore Patricia, Splay Tree, Treap e KD-Tree). Trabalho de aprofundamento prático e experimental da disciplina de Algoritmos e Estruturas de Dados — CEFET-MG.

## 📋 Sumário
- [O que são Árvores Avançadas?](#-o-que-são-árvores-avançadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Objetivos](#-objetivos)
- [Descrição do Problema](#-descrição-do-problema)
- [Estruturas de Dados Abordadas](#-estruturas-de-dados-abordadas)
- [Inicialização e Execução](#-inicialização-e-execução)
- [Experimentos e Resultados (Benchmarks)](#-experimentos-e-resultados-benchmarks)
- [Limitações da Aplicação](#-limitações-da-aplicação)
- [Considerações Finais](#-considerações-finais)
- [Autor do Projeto](#-autor-do-projeto)


## 🤔 O que são Árvores Avançadas?

As estruturas hierárquicas tradicionais, como as Árvores Binárias de Busca (BST) e as árvores perfeitamente balanceadas (AVL), são fundamentais na Computação, mas possuem restrições quando submetidas a cenários específicos, como indexação maciça de *strings*, acessos temporais altamente desiguais ou mapeamentos geográficos bidimensionais.

As **Árvores Avançadas** exploram estratégias alternativas para resolver esses gargalos. A Trie e a Patricia, por exemplo, não analisam chaves completas, mas navegam pelos prefixos das palavras. A Splay Tree abdica do balanceamento rígido em favor do desempenho a longo prazo focado em repetição de acessos. A Treap introduz entropia e aleatoriedade para escapar de dados enviesados. E a KD-Tree quebra a comparação tradicional para fatiar hiperplanos cartesianos.

Neste trabalho, o foco é a implementação destas estruturas e a comprovação matemática e visual das suas vantagens mecânicas através de *benchmarking* executado no próprio navegador.


## 📂 Estrutura do Projeto

O projeto foi construído com base num ecossistema moderno em TypeScript e React.

```bash
.
├── src/
│   ├── components/      # Componentes UI (Cartões, Badges, Botões)
│   ├── core/            # Motor de simulação de passos (Step Player)
│   ├── experiments/     # Módulos de Benchmark, geradores estocásticos e medições
│   ├── hooks/           # Lógica de controle do rastreamento visual
│   ├── pages/           # Páginas individuais (Home, Trie, Patricia, Splay, Treap, KD-Tree, Experimentos)
│   ├── structures/      # Implementação bruta das cinco classes de árvores avançadas
│   ├── visualization/   # Algoritmos de Layout (TreeCanvas, CartesianPlane)
│   ├── App.tsx          # Roteamento principal
│   └── main.tsx         # Ponto de entrada (Vite/React)
├── index.html           # Template base da aplicação
├── package.json         # Dependências (React, TypeScript, Vite)
├── tsconfig.json        # Configurações do compilador TS
└── vite.config.ts       # Configurações do empacotador
```


## 🎯 Objetivos

O objetivo deste projeto é construir, tipar fortemente em TypeScript e validar experimentalmente estruturas não convencionais de armazenamento, com destaque para a visualização dinâmica (Step Player). 

Além da análise do comportamento assintótico, o projeto também tem como objetivo aplicar e consolidar práticas de engenharia de software de ponta, como arquitetura de imutabilidade de estados (Snapshots), separação de domínios (Core vs Visualization) e Renderização Reativa baseada em Canvas, superando o conceito de simples programas de terminal.


## 🧩 Descrição do Problema

O projeto avalia cinco cenários divergentes de indexação que causam degradação ou ineficiência em árvores binárias padronizadas:

*   **Acesso Temporal Assimétrico:** A lei de Pareto (80% das requisições acessam 20% dos dados).
*   **Textos com alto fator de similaridade:** Milhares de palavras que compartilham a mesma raiz.
*   **Restrições Extremas de Memória (RAM):** Sobrecarga causada por ponteiros ociosos.
*   **Conjuntos Iniciais Sequenciais:** Inserção em ordem alfabética (pior caso em árvores ingênuas).
*   **Deteção de Proximidade (Nearest Neighbor):** Busca de proximidade em ambientes bidimensionais.


## 💿 Estruturas de Dados Abordadas

### 1. Trie
Baseada em Maps, a Trie consome caracteres individualmente e marca pontos finais das strings. Permite buscas independentes de N, orientadas puramente pelo tamanho da palavra (L).

### 2. Árvore Patricia
Uma versão severamente compactada da Trie. Utiliza algoritmos de segmentação (split) em tempo real para unificar ramificações não divergentes, reduzindo a alocação de nós drasticamente.

### 3. Splay Tree
Estrutura autoajustável. Prescinde de rastrear variáveis de altura. Utiliza ciclos recursivos de rotações complexas (Zig, Zig-Zig, Zig-Zag) para promover o nó pesquisado para a raiz, garantindo latência quase imediata para buscas repetidas subsequentes.

### 4. Treap (Tree + Heap)
Uma simbiose perfeita. Cada nó aloca uma Chave (respeitando a BST) e uma Prioridade Aleatória (respeitando o Heap Max/Min). Escuda a árvore contra inserções viciadas apostando nas leis da probabilidade para manter o formato achato logarítmico.

### 5. KD-Tree
O particionador bidimensional. Alterna o domínio de comparação entre a coordenada X e Y a cada nível de profundidade atingido, servindo como a matriz de referência para poda espacial.


## 🔧 Inicialização e Execução

⚠️ **Requisito:** Ambiente com Node.js (versão recente) instalado.

```bash
# Clone o repositório
$ git clone https://github.com/Bernardo-Lebron/AEDSII-arvores
$ cd arvores-avancadas

# Instale as dependências
$ npm install

# Inicialize o servidor de desenvolvimento Vite (compilação TypeScript + Hot Reload)
$ npm run dev
```
Após o build, acesse o link (geralmente `http://localhost:5173`) disponibilizado no terminal.


## 🧪 Experimentos e Resultados (Benchmarks)

Foram executados testes de larga escala (até 100.000 elementos indexados), isolando o tempo, as rotações e a pegada de memória. A seguir, destacam-se os resultados mais determinantes para a análise da eficácia.

### 1. A Otimização Massiva de RAM (Patricia vs Trie)
*   **Comportamento:** A inserção das 100.000 strings aleatórias revelou a superioridade da Patricia face à Trie padronizada.
*   **Resultados Brutos:** A Trie clássica alocou a impressionante marca de 457.225 nós. Ao unificar prefixos contíguos (ex: `atleti` em vez de gerar um nó solitário para cada letra subsequente), o mecanismo de Split/Merge da Patricia compactou toda a matriz de indexação utilizando apenas 127.205 nós.
*   **Conclusão:** O custo de RAM evitado dita a Patricia como o padrão mandatário atual em roteamentos.

### 2. A Anomalia Estocástica e o RNG (Treap)
*   **Comportamento:** O comportamento na busca da Treap validou graficamente as variações geradas por matrizes de probabilidade em vez de cálculos numéricos exatos (como a árvore AVL).
*   **Resultados Brutos:** Na faixa dos 10.000 elementos, a pesquisa incorreu em notórios 9.100 ms, ao passo que no conjunto massivo de 100.000, a procura concluiu em ínfimos 0.900 ms.
*   **Conclusão:** Numa subamostra intermédia, o Gerador Numérico Aleatório (RNG) produziu sementes infelizes na alocação da Fila de Prioridades (Heap), forçando degradação isolada em altura. Quando os dados expandiram, a Lei dos Grandes Números forçou um esmagamento estocástico e garantiu o balanceamento logarítmico estável.

### 3. A Dificuldade da Remoção Espacial (KD-Tree)
*   **Comportamento:** Perante a exclusão simultânea, a KD-Tree penalizou severamente o processador (tempo absoluto medido de 3.100 ms para a mesma carga, o dobro de outras estruturas).
*   **Conclusão:** Como a remoção de um ponto exige a recalibração recursiva e alternada dos eixos cartesianos subsequentes, o motor é forçado a reestruturar todo o ramo geográfico inferior.


## ⛔ Limitações da Aplicação

O sistema apresenta algumas restrições decorrentes da implementação em React (browser-side):

### 1. Desvios (Warm-up e GC)
**O Motor V8:** Como o TypeScript/JavaScript funciona numa arquitetura JIT (Compilação Tardia) baseada no motor V8, os testes iniciais podem expor anomalias ligeiras não relacionadas à complexidade ciclomática da árvore, mas oriundas das paralisações súbitas da RAM causadas pelo processo limpa-memória (Garbage Collector).

### 2. Limitações de Renderização no DOM
**A visualização das topologias (TreeCanvas)** funciona otimamente num limite razoável (30 a 50 nós). Árvores profundas causam cruzamentos de arestas pela falta de um algoritmo de força eletrostática para o afastamento lateral generalizado e saturam a área de *clipping* do navegador, tornando os testes estritamente teóricos para grandes simulações (acima de 5.000 nós) onde a parte gráfica fica ausente.


## 🏁 Considerações Finais

O projeto demonstrou que a eficiência na computação moderna depende diretamente de alinhar a estrutura de dados correta ao problema específico. As análises experimentais confirmaram que estruturas avançadas superam as limitações das árvores binárias clássicas em cenários de alta similaridade textual, acessos temporais assimétricos e buscas espaciais, unindo rigor teórico e validação prática.


## 👤 Autor do Projeto

**Projeto desenvolvido por Bernardo Lebron**  
Estudante de Engenharia de Computação – CEFET-MG

**💻 Ambiente de Desenvolvimento**
*   **Computador:** Samsung Galaxy Book4 Pro
*   **Sistema Operacional Principal:** Zorin OS (Linux) / Ubuntu
*   **Multi-boot Workspace**
*   **Displays:** AOC AGON 24" (144Hz) acoplado via UGREEN USB-C Hub