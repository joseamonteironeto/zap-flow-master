# Tema WhatsApp claro e créditos no painel

## Objetivo
Atualizar todo o TudoZap para uma identidade clara inspirada no site oficial do WhatsApp, mantendo o modo escuro como opção, e adicionar uma apresentação elegante de créditos no painel com uma interface de recarga sem cobrança real.

## Implementação

### 1. Sistema de temas
- Redefinir os tokens semânticos globais para um tema claro padrão: superfícies brancas, fundos verdes muito suaves, texto verde-escuro e verde WhatsApp como destaque.
- Preservar e aprimorar o tema grafite atual sob a classe `.dark`.
- Criar um provedor de tema que aplica e persiste a escolha do usuário no navegador.
- Adicionar uma chave de alternância sol/lua no cabeçalho público e no topo do painel, com rótulo acessível e tooltip.
- Garantir que landing page, autenticação, mockups, sidebar, tabelas, modais e componentes mantenham contraste correto nos dois temas.

### 2. Créditos no painel
- Criar um componente compacto no canto superior direito com ícone, saldo demonstrativo e ação “Recarregar”.
- Em telas menores, condensar a apresentação sem ocultar o saldo.
- Criar um modal de recarga apenas visual, com opções de pacotes, resumo do pacote selecionado e botão de continuação claramente identificado como demonstração.
- Não alterar saldo, persistir transações nem integrar pagamento nesta etapa.

### 3. Polimento e validação
- Ajustar transparências, bordas, sombras e estados ativos para que a interface pareça nativa tanto no claro quanto no escuro.
- Atualizar os metadados ausentes da página inicial conforme a estrutura SEO existente.
- Validar a landing page e o painel em desktop e mobile, alternando os dois temas e abrindo o modal de créditos.

## Detalhes técnicos
- React Context para o tema, com `localStorage` apenas para a preferência visual e proteção contra inconsistência de hidratação.
- Tokens OKLCH em `src/styles.css`; nenhum valor de cor será colocado diretamente nos componentes.
- Componentes existentes de `Button`, `Dialog` e `Tooltip` serão reutilizados.
- A recarga real fica explicitamente fora do escopo desta etapa.
