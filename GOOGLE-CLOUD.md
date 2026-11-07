# Configuração do Google Cloud (uma vez só)

1. console.cloud.google.com > criar projeto "Schmitt Detailer".
2. APIs e serviços > Biblioteca > ativar "Google Calendar API".
3. Tela de permissão OAuth (Google Auth Platform > Branding / Público):
   - Tipo de usuário: Externo; nome do app: Schmitt Detailer; e-mail de suporte: o seu.
   - Público > Usuários de teste: adicione a(s) conta(s) Google que vão usar o app.
4. Clientes > Criar cliente > Tipo "Android":
   - Nome do pacote: com.schmitt.detailer
   - Impressão digital SHA-1: C8:AF:FF:6F:20:53:E5:F4:2E:A7:69:00:83:9C:78:F0:B5:9C:0D:EA
5. Acesso a dados (Escopos): adicione ".../auth/calendar".
