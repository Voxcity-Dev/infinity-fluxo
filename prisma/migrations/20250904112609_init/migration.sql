-- CreateEnum
CREATE TYPE "SCHEMA"."NodeType" AS ENUM ('START', 'DIALOG', 'END');

-- CreateEnum
CREATE TYPE "SCHEMA"."FluxoConfiguracaoChave" AS ENUM ('SEND_MESSAGE', 'INVALID_RESPONSE_MESSAGE', 'TIMEOUT_MINUTES', 'QUEUE_DEFAULT', 'USER_DEFAULT', 'MAX_RETRIES', 'AUTO_ASSIGNMENT', 'END_FLOW_ON_CONDITION');

-- CreateEnum
CREATE TYPE "SCHEMA"."InteracaoTipo" AS ENUM ('MESSAGE', 'IMAGE', 'AUDIO', 'VIDEO', 'FILE', 'BUTTON', 'SET_VARIABLE', 'GET_VARIABLE', 'API_CALL', 'DB_QUERY');

-- CreateEnum
CREATE TYPE "SCHEMA"."TipoAcao" AS ENUM ('GO_TO_ETAPA', 'GO_TO_FLUXO', 'END_FLUXO', 'SEND_TO_QUEUE', 'SEND_TO_USER', 'SET_VARIABLE', 'GET_VARIABLE', 'API_CALL', 'DB_QUERY');

-- CreateTable
CREATE TABLE "SCHEMA"."etapas" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fluxo_id" UUID NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "tipo" "SCHEMA"."NodeType" NOT NULL,
    "interacoes_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "etapas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."fluxo_configuracoes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fluxo_id" UUID NOT NULL,
    "chave" "SCHEMA"."FluxoConfiguracaoChave" NOT NULL,
    "valor" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "fluxo_configuracoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."fluxos" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "fluxos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."interacoes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "tenant_id" UUID NOT NULL,
    "tipo" "SCHEMA"."InteracaoTipo" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "url_midia" VARCHAR(500),
    "metadados" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "interacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."transacoes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "etapa_id" UUID NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SCHEMA"."transacao_regras" (
    "id" UUID NOT NULL,
    "transacao_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "input" VARCHAR(50) NOT NULL,
    "action" "SCHEMA"."TipoAcao" NOT NULL,
    "next_etapa_id" UUID,
    "next_fluxo_id" UUID,
    "queue_id" UUID,
    "user_id" UUID,
    "variable_name" VARCHAR(50),
    "variable_value" VARCHAR(50),
    "api_endpoint" VARCHAR(50),
    "db_query" VARCHAR(50),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "transacao_regras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "etapas_tenant_id_fluxo_id_tipo_idx" ON "SCHEMA"."etapas"("tenant_id", "fluxo_id", "tipo");

-- CreateIndex
CREATE INDEX "fluxo_configuracoes_tenant_id_fluxo_id_chave_idx" ON "SCHEMA"."fluxo_configuracoes"("tenant_id", "fluxo_id", "chave");

-- CreateIndex
CREATE INDEX "fluxos_tenant_id_nome_idx" ON "SCHEMA"."fluxos"("tenant_id", "nome");

-- CreateIndex
CREATE INDEX "interacoes_tenant_id_tipo_idx" ON "SCHEMA"."interacoes"("tenant_id", "tipo");

-- CreateIndex
CREATE INDEX "transacoes_tenant_id_etapa_id_idx" ON "SCHEMA"."transacoes"("tenant_id", "etapa_id");

-- CreateIndex
CREATE INDEX "transacao_regras_tenant_id_transacao_id_idx" ON "SCHEMA"."transacao_regras"("tenant_id", "transacao_id");

-- AddForeignKey
ALTER TABLE "SCHEMA"."etapas" ADD CONSTRAINT "etapas_fluxo_id_fkey" FOREIGN KEY ("fluxo_id") REFERENCES "SCHEMA"."fluxos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."etapas" ADD CONSTRAINT "etapas_interacoes_id_fkey" FOREIGN KEY ("interacoes_id") REFERENCES "SCHEMA"."interacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."fluxo_configuracoes" ADD CONSTRAINT "fluxo_configuracoes_fluxo_id_fkey" FOREIGN KEY ("fluxo_id") REFERENCES "SCHEMA"."fluxos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."transacoes" ADD CONSTRAINT "transacoes_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "SCHEMA"."etapas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SCHEMA"."transacao_regras" ADD CONSTRAINT "transacao_regras_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "SCHEMA"."transacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
