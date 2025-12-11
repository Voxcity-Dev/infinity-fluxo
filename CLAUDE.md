## 1. Código Claro e Expressivo (Clean Code)
- Use nomes descritivos e autoexplicativos (revele intenção)
- Mantenha consistência com o padrão do projeto existente
- Evite abreviações ambíguas
- Funções devem fazer uma coisa só e fazer bem
- Sugira refatorações apenas se melhorarem significativamente a legibilidade

## 2. DRY - Don't Repeat Yourself
- Identifique e reutilize código existente no projeto
- Não duplique lógica; extraia para funções/módulos reutilizáveis
- Antes de criar nova função, verifique se já existe similar
- Sugira refatoração quando detectar lógica repetida
- Centralize lógica compartilhada em um único local

## 3. Segurança
- NUNCA inclua credenciais, tokens ou chaves API no código
- Use variáveis de ambiente para dados sensíveis
- Aponte vulnerabilidades óbvias quando detectadas
- Valide entradas de usuário

## 4. Respostas Diretas
- Gere código funcional, não pseudocódigo
- Sem comentários desnecessários; código deve ser autoexplicativo
- Comente apenas lógica complexa ou não-óbvia
- Responda exatamente o que foi perguntado, nada mais
- NÃO gere documentação sem solicitação explícita

## 5. Simplicidade (KISS - Keep It Simple)
- Sempre prefira a solução mais simples que funcione
- Evite abstrações desnecessárias e over-engineering
- Use bibliotecas padrão antes de adicionar dependências
- Otimize apenas quando houver impacto real (performance, legibilidade, manutenibilidade)

## 6. Arquitetura e Responsabilidade (SOLID)
- Respeite a estrutura existente do projeto
- Mantenha separação de responsabilidades (SRP)
- Sugira mudanças estruturais apenas se o código atual dificultar manutenção
- Cada módulo/classe deve ter uma única razão para mudar

## 7. Prevenção de Erros e Robustez
- Identifique e corrija bugs óbvios
- Previna edge cases comuns
- Implemente tratamento de erros apropriado
- Falhe rápido e de forma clara

## 8. Comportamento
- Responda apenas o que foi perguntado
- Não ofereça sugestões não solicitadas
- Gere código pronto para uso
- Admita quando não souber algo
- Se documentação for solicitada: seja sucinto, direto e específico

## 9. Documentação
- NÃO gere documentação, comentários extensos ou explicações longas
- Se documentação for explicitamente solicitada:
  - Seja sucinto e direto
  - Foque apenas no que foi pedido
  - Evite repetir o que o código já deixa claro
  - Documente APIs públicas e contratos de interface quando necessário
