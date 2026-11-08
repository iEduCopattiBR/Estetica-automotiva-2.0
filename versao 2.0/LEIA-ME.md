# Schmitt Detailer — projeto completo (versão 1.4.1)

App de agendamentos de estética automotiva (React + Vite dentro de um app Android).

## O que tem aqui
- `src/`            código do app (telas, serviços, sincronização com o Google Agenda, lembretes)
- `android/`        projeto Android (Gradle), chave de assinatura `schmitt.keystore`, notificações
- `public/`         ícones e arquivos públicos
- `.github/workflows/build-apk.yml`   gera o APK no GitHub (projeto na raiz do repositório)
- `EXEMPLO-workflow-projeto-em-subpasta.yml`   mesmo workflow, para quando o projeto fica na pasta "versao 2.0"
- `GOOGLE-CLOUD.md` configuração do Google Cloud (login com o Google Agenda)

## Gerar o APK
1. Suba tudo para um repositório no GitHub.
2. Aba Actions > Build APK > (Run workflow). Leva uns 3 a 8 minutos.
3. Baixe o artefato SchmittDetailer-apk (um zip com o app-release.apk dentro).
4. Instale no celular. Atualizações instalam por cima, sem perder dados (mesma chave de assinatura).

## Dados importantes
- Pacote: com.schmitt.detailer
- SHA-1 da chave: C8:AF:FF:6F:20:53:E5:F4:2E:A7:69:00:83:9C:78:F0:B5:9C:0D:EA
- Versão atual: 1.4.1 (versionCode 15)
- Agenda criada no Google Agenda: "Agenda de Clientes" (agendamentos e também clientes, serviços e insumos, guardados como eventos em 01/01/2000)
- Plano B para passar cadastros entre celulares: Configurações > Transferir cadastros (copiar e colar por WhatsApp)
- NÃO perca o arquivo android/app/schmitt.keystore: sem ele não dá para atualizar o app instalado.
