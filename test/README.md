# 🧪 Testes do FluxoEngine - Infinity Dialog

Este diretório contém os arquivos de teste para o sistema de fluxos de atendimento.

## 📁 Arquivos

- **`request.http`** - Arquivo principal com todos os testes HTTP
- **`get-fluxo-ids.js`** - Script para obter IDs dos fluxos do banco
- **`README.md`** - Este arquivo de instruções

## 🚀 Como Executar os Testes

### 1. Preparação
```bash
# Executar seeds para criar dados de teste
npm run seed:dev

# Iniciar servidor em modo desenvolvimento
npm run start:dev
```

### 2. Obter IDs dos Fluxos
```bash
# Executar script para obter IDs
node test/get-fluxo-ids.js
```

### 3. Executar Testes HTTP

Use o VS Code com a extensão **REST Client** ou qualquer cliente HTTP:

1. Abra o arquivo `test/request.http`
2. Clique em "Send Request" acima de cada teste
3. Execute na ordem recomendada

## 📋 Sequência Recomendada de Testes

### Teste Básico do Fluxo Principal
1. **Teste #1**: Listar todos os fluxos
2. **Teste #3**: Iniciar execução do fluxo principal
3. **Copie o `contexto_id`** da resposta do teste #3
4. **Teste #4**: Processar resposta "1" (substitua `{contexto_id}`)
5. **Teste #9**: Verificar status da execução

### Teste do Fluxo Secundário
6. **Teste #12**: Iniciar fluxo secundário (Suporte Técnico)
7. **Copie o `contexto_id`** da resposta do teste #12
8. **Teste #13**: Processar problema técnico (substitua `{contexto_id}`)

### Testes de Validação
9. **Teste #14**: Validar estrutura do fluxo
10. **Teste #15**: Obter configurações

## 🎯 Cenários de Teste

### Fluxo Principal - Menu de Opções
- **Resposta "1"** → Suporte Técnico → Fluxo Secundário
- **Resposta "2"** → Vendas → Finalização
- **Resposta "3"** → Financeiro → Finalização  
- **Resposta "4"** → Transferir Atendente → Fila + Finalização
- **Resposta inválida** → Volta ao menu

### ⚠️ IMPORTANTE - URLs Corrigidas:
- **Base URL**: `http://localhost:3000/api/v1/fluxo`
- **Processar Resposta**: Usa `contexto_id` (não `fluxo_id`)
- **Contexto ID**: Obtido ao iniciar execução (teste #3)

### Fluxo Secundário - Suporte Técnico
- **Qualquer resposta** → Coleta de problema → Finalização

## 🔧 IDs dos Fluxos (Atualizados)

- **Fluxo Principal**: `06d4771b-a27d-4eea-998d-a832613642b3`
- **Fluxo Secundário**: `071cbbe8-3f90-4d08-b2a3-cac1ab42cf6c`

> **Nota**: Os IDs podem mudar se você executar `npm run seed:dev` novamente. Use `node test/get-fluxo-ids.js` para obter os IDs atuais.

## 📊 Dados de Teste Criados

### Fluxos
- **Fluxo de Atendimento Principal** (8 etapas)
- **Fluxo de Suporte Técnico** (3 etapas)

### Interações
- 11 mensagens diferentes
- Sem variáveis dinâmicas `{{}}`

### Transações e Regras
- 9 transações
- 12 regras de transição
- Ações: `GO_TO_ETAPA`, `GO_TO_FLUXO`, `SEND_TO_QUEUE`

## 🐛 Troubleshooting

### Erro: "Fluxo não encontrado"
- Execute `npm run seed:dev` para criar os dados
- Verifique se o servidor está rodando

### Erro: "IDs inválidos"
- Execute `node test/get-fluxo-ids.js` para obter IDs atuais
- Atualize o arquivo `request.http` com os novos IDs

### Erro: "Servidor não responde"
- Verifique se o servidor está rodando: `npm run start:dev`
- Confirme se está na porta 3000

## 📝 Exemplo de Resposta Esperada

```json
{
  "success": true,
  "data": {
    "etapa_atual": "Menu de Opções",
    "mensagem": "Por favor, escolha uma das opções:\n1 - Suporte técnico\n2 - Vendas\n3 - Financeiro\n4 - Falar com atendente",
    "variaveis": {
      "canal": "whatsapp",
      "telefone": "+5511999999999"
    },
    "proxima_acao": "aguardando_resposta"
  }
}
```

## 🎉 Próximos Passos

Após testar o sistema básico, você pode:

1. **Implementar variáveis dinâmicas** com `{{}}`
2. **Adicionar validações** de entrada
3. **Criar mais fluxos** complexos
4. **Implementar APIs externas** e consultas DB
5. **Adicionar autenticação** e autorização

---

**Desenvolvido para o Infinity Dialog** 🚀
