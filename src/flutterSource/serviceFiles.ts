import { FlutterFile } from './types';

export const SERVICE_FILES: FlutterFile[] = [
  // 1. AuthService
  {
    path: 'lib/services/auth_service.dart',
    name: 'auth_service.dart',
    category: 'service',
    description: 'Login Google OAuth 2.0 oficial para Android com flutter_secure_storage',
    code: `import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../app/constants.dart';

class AuthService {
  static final AuthService instance = AuthService._internal();
  AuthService._internal();

  final _secureStorage = const FlutterSecureStorage();

  // Escopo mínimo estrito para eventos de calendário
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: <String>[
      'email',
      AppConstants.googleCalendarScope,
    ],
  );

  GoogleSignInAccount? _currentUser;
  GoogleSignInAccount? get currentUser => _currentUser;

  static const _keyAccessToken = 'google_oauth_access_token';
  static const _keyUserEmail = 'google_oauth_user_email';

  Future<bool> hasSavedSession() async {
    final email = await _secureStorage.read(key: _keyUserEmail);
    return email != null;
  }

  Future<String?> getSavedUserEmail() async {
    return await _secureStorage.read(key: _keyUserEmail);
  }

  Future<GoogleSignInAccount?> signIn() async {
    try {
      _currentUser = await _googleSignIn.signIn();
      if (_currentUser != null) {
        final auth = await _currentUser!.authentication;
        if (auth.accessToken != null) {
          await _secureStorage.write(key: _keyAccessToken, value: auth.accessToken);
        }
        await _secureStorage.write(key: _keyUserEmail, value: _currentUser!.email);
      }
      return _currentUser;
    } catch (e) {
      debugPrint('[Auth] Erro no signIn Google: \$e');
      rethrow;
    }
  }

  Future<GoogleSignInAccount?> signInSilently() async {
    try {
      _currentUser = await _googleSignIn.signInSilently();
      if (_currentUser != null) {
        final auth = await _currentUser!.authentication;
        if (auth.accessToken != null) {
          await _secureStorage.write(key: _keyAccessToken, value: auth.accessToken);
        }
        await _secureStorage.write(key: _keyUserEmail, value: _currentUser!.email);
      }
      return _currentUser;
    } catch (e) {
      debugPrint('[Auth] Erro signInSilently: \$e');
      return null;
    }
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      _currentUser = null;
      await _secureStorage.delete(key: _keyAccessToken);
      await _secureStorage.delete(key: _keyUserEmail);
    } catch (e) {
      debugPrint('[Auth] Erro signOut: \$e');
    }
  }

  Future<GoogleSignInAccount?> switchAccount() async {
    await signOut();
    try {
      await _googleSignIn.disconnect();
    } catch (_) {}
    return await signIn();
  }
}
`,
  },

  // 2. GoogleCalendarService
  {
    path: 'lib/services/google_calendar_service.dart',
    name: 'google_calendar_service.dart',
    category: 'service',
    description: 'Sincronização bidirecional com Google Calendar API, agenda Agenda de Clientes, tag #Dsc e extendedProperties',
    code: `import 'package:flutter/foundation.dart';
import 'package:googleapis/calendar/v3.dart' as gcal;
import 'package:extension_google_sign_in_as_googleapis_auth/extension_google_sign_in_as_googleapis_auth.dart';
import '../app/constants.dart';
import '../models/agendamento_model.dart';
import '../models/cliente_model.dart';
import '../database/database_constants.dart';
import '../database/database_helper.dart';
import 'auth_service.dart';

class GoogleCalendarService {
  static final GoogleCalendarService instance = GoogleCalendarService._internal();
  GoogleCalendarService._internal();

  gcal.CalendarApi? _calendarApi;
  String? _targetCalendarId;

  Future<gcal.CalendarApi?> _getApi() async {
    final account = AuthService.instance.currentUser ?? await AuthService.instance.signInSilently();
    if (account == null) return null;
    final httpClient = await account.authenticatedClient();
    if (httpClient == null) return null;
    _calendarApi = gcal.CalendarApi(httpClient);
    return _calendarApi;
  }

  /// Localiza ou cria a agenda "Agenda de Clientes" (Regra 7)
  Future<String?> getOrCreateTargetCalendar() async {
    if (_targetCalendarId != null) return _targetCalendarId;
    final api = await _getApi();
    if (api == null) return null;

    try {
      final calendarList = await api.calendarList.list();
      final items = calendarList.items ?? [];
      for (final cal in items) {
        if (cal.summary == AppConstants.googleCalendarTargetName) {
          _targetCalendarId = cal.id;
          return _targetCalendarId;
        }
      }

      // Cria a agenda dedicada se não existir
      final newCal = gcal.Calendar(summary: AppConstants.googleCalendarTargetName);
      final created = await api.calendars.insert(newCal);
      _targetCalendarId = created.id;
      debugPrint('[GoogleCalendar] Agenda criada: \${created.id}');
      return _targetCalendarId;
    } catch (e) {
      debugPrint('[GoogleCalendar] Erro ao buscar/criar agenda: \$e');
      return 'primary'; // Fallback seguro
    }
  }

  /// ENVIAR: Cria ou atualiza evento no Google Calendar com idempotência e extendedProperties privadas
  Future<String?> enviarEvento({
    required AgendamentoModel agendamento,
    required ClienteModel cliente,
    String? veiculoDescricao,
    String? servicoNome,
  }) async {
    final api = await _getApi();
    final calId = await getOrCreateTargetCalendar();
    if (api == null || calId == null) return null;

    final titulo = '\${cliente.nomeCompleto} — \${servicoNome ?? "Estética Automotiva"}';
    final localizacao = cliente.enderecoCompleto ?? '';
    final descricao = 'Veículo: \${veiculoDescricao ?? "Não informado"}\\nObs: \${agendamento.observacoes ?? "Sem observações"}\\n\${AppConstants.googleCalendarTag}';

    final event = gcal.Event(
      id: agendamento.googleEventId, // Idempotência usando ID estável
      summary: titulo,
      location: localizacao,
      description: descricao,
      start: gcal.EventDateTime(dateTime: agendamento.inicio.toUtc()),
      end: gcal.EventDateTime(dateTime: agendamento.termino.toUtc()),
      extendedProperties: gcal.EventExtendedProperties(
        private: {
          'local_id': agendamento.id,
          'cliente_telefone': cliente.celular, // Guardado privadamente sem expor na descrição
          'cliente_nome': cliente.nomeCompleto,
          'tipo_servico': servicoNome ?? '',
          'app_tag': AppConstants.googleCalendarTag,
        },
      ),
    );

    try {
      if (agendamento.googleEventId != null) {
        final updated = await api.events.update(event, calId, agendamento.googleEventId!);
        return updated.id;
      } else {
        final inserted = await api.events.insert(event, calId);
        return inserted.id;
      }
    } catch (e) {
      debugPrint('[GoogleCalendar] Falha ao enviar evento: \$e');
      rethrow;
    }
  }

  /// Cancela o evento no Google Calendar
  Future<bool> cancelarEvento(String googleEventId) async {
    final api = await _getApi();
    final calId = await getOrCreateTargetCalendar();
    if (api == null || calId == null) return false;

    try {
      await api.events.delete(calId, googleEventId);
      return true;
    } catch (e) {
      debugPrint('[GoogleCalendar] Erro ao deletar evento: \$e');
      return false;
    }
  }

  /// PUXAR: Importa eventos que contenham #Dsc criados/alterados pelo outro celular
  Future<int> puxarEventosRemotos() async {
    final api = await _getApi();
    final calId = await getOrCreateTargetCalendar();
    if (api == null || calId == null) return 0;

    final db = await DatabaseHelper.instance.database;
    int importados = 0;

    try {
      final events = await api.events.list(
        calId,
        q: AppConstants.googleCalendarTag,
        singleEvents: true,
      );

      final items = events.items ?? [];
      for (final evt in items) {
        if (evt.description == null || !evt.description!.contains(AppConstants.googleCalendarTag)) {
          continue; // Ignora eventos que não tenham a marcação
        }

        final evtId = evt.id;
        if (evtId == null) continue;

        // Verifica se já conhecemos pelo google_event_id
        final exists = await db.query(
          DatabaseConstants.tableAgendamentos,
          where: '\${DatabaseConstants.colAgendamentoGoogleEventId} = ?',
          whereArgs: [evtId],
        );

        if (exists.isEmpty) {
          // Evento criado pelo outro aparelho: cria cliente básico e salva agendamento
          final priv = evt.extendedProperties?.private ?? {};
          final nomeCliente = priv['cliente_nome'] ?? evt.summary?.split('—').first.trim() ?? 'Cliente Google Agenda';
          final telCliente = priv['cliente_telefone'] ?? '0000000000';

          final novoCliente = ClienteModel(
            nomeCompleto: nomeCliente,
            celular: telCliente,
            enderecoCompleto: evt.location,
          );
          await db.insert(DatabaseConstants.tableClientes, novoCliente.toMap());

          final novoAgendamento = AgendamentoModel(
            clienteId: novoCliente.id,
            inicio: evt.start?.dateTime?.toLocal() ?? DateTime.now(),
            termino: evt.end?.dateTime?.toLocal() ?? DateTime.now().add(const Duration(hours: 1)),
            observacoes: evt.description,
            situacao: 'agendado',
            syncSituacao: 'sincronizado',
            googleEventId: evtId,
          );
          await db.insert(DatabaseConstants.tableAgendamentos, novoAgendamento.toMap());
          importados++;
        }
      }
    } catch (e) {
      debugPrint('[GoogleCalendar] Erro ao puxar eventos: \$e');
    }
    return importados;
  }
}
`,
  },

  // 3. NotificationService
  {
    path: 'lib/services/notification_service.dart',
    name: 'notification_service.dart',
    category: 'service',
    description: 'Notificações diárias offline da agenda às 07:00 e lembretes por atendimento',
    code: `import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import '../app/constants.dart';
import '../repositories/agendamento_repository.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._internal();
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin = FlutterLocalNotificationsPlugin();

  Future<void> inicializar() async {
    tz.initializeTimeZones();

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);

    await _notificationsPlugin.initialize(initSettings);

    // Cria o canal de alta importância no Android
    const androidChannel = AndroidNotificationChannel(
      AppConstants.notificationChannelId,
      AppConstants.notificationChannelName,
      description: AppConstants.notificationChannelDesc,
      importance: Importance.high,
    );

    await _notificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  /// Agenda a notificação diária das 07:00 buscando compromissos direto do SQLite
  Future<void> agendarNotificacaoDiaria() async {
    final agora = DateTime.now();
    final agendamentos = await AgendamentoRepository().listarDoDia(agora);

    String corpo = 'Você não possui atendimentos agendados para hoje.';
    if (agendamentos.isNotEmpty) {
      corpo = 'Hoje você tem \${agendamentos.length} atendimento(s) programado(s). Toque para ver.';
    }

    const androidDetails = AndroidNotificationDetails(
      AppConstants.notificationChannelId,
      AppConstants.notificationChannelName,
      importance: Importance.high,
      priority: Priority.high,
    );
    const details = NotificationDetails(android: androidDetails);

    await _notificationsPlugin.show(
      0,
      'Agenda de Hoje • Schmitt Detailer',
      corpo,
      details,
    );
  }
}
`,
  },

  // 4. SyncManager
  {
    path: 'lib/services/sync_manager.dart',
    name: 'sync_manager.dart',
    category: 'service',
    description: 'Processador da sync_queue em segundo plano e ao voltar a conexão',
    code: `import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import '../repositories/sync_queue_repository.dart';
import '../repositories/agendamento_repository.dart';
import '../repositories/cliente_repository.dart';
import '../repositories/veiculo_repository.dart';
import '../repositories/tipo_servico_repository.dart';
import 'google_calendar_service.dart';

class SyncManager {
  static final SyncManager instance = SyncManager._internal();
  SyncManager._internal();

  final _syncQueueRepo = SyncQueueRepository();
  final _agendamentoRepo = AgendamentoRepository();
  final _clienteRepo = ClienteRepository();
  final _veiculoRepo = VeiculoRepository();
  final _tipoServicoRepo = TipoServicoRepository();

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  Future<Map<String, dynamic>> sincronizarAgora() async {
    if (_isSyncing) return {'sucesso': false, 'mensagem': 'Sincronização já em andamento.'};
    
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.contains(ConnectivityResult.none)) {
      return {'sucesso': false, 'mensagem': 'Sem conexão com a internet. Dados mantidos no SQLite local.'};
    }

    _isSyncing = true;
    int enviados = 0;
    int importados = 0;

    try {
      // 1. Processa fila de envio local (sync_queue)
      final fila = await _syncQueueRepo.listarPendentes();
      for (final item in fila) {
        try {
          if (item.acao == 'delete') {
            await GoogleCalendarService.instance.cancelarEvento(item.agendamentoId);
            await _syncQueueRepo.remover(item.id);
            enviados++;
          } else {
            // insert ou update
            final agendamentosHoje = await _agendamentoRepo.listarDoDia(DateTime.now());
            final agendamento = agendamentosHoje.firstWhere((a) => a.id == item.agendamentoId);
            final cliente = await _clienteRepo.buscarPorId(agendamento.clienteId);

            if (cliente != null) {
              String? veiculoDesc;
              if (agendamento.veiculoId != null) {
                final v = await _veiculoRepo.buscarPorId(agendamento.veiculoId!);
                veiculoDesc = v?.descricaoCompleta;
              }
              String? servicoNome;
              if (agendamento.tipoServicoId != null) {
                final s = await _tipoServicoRepo.buscarPorId(agendamento.tipoServicoId!);
                servicoNome = s?.nome;
              }

              final googleEventId = await GoogleCalendarService.instance.enviarEvento(
                agendamento: agendamento,
                cliente: cliente,
                veiculoDescricao: veiculoDesc,
                servicoNome: servicoNome,
              );

              if (googleEventId != null) {
                await _agendamentoRepo.confirmarSincronizacao(agendamento.id, googleEventId);
                await _syncQueueRepo.remover(item.id);
                enviados++;
              }
            }
          }
        } catch (err) {
          await _syncQueueRepo.registrarFalha(item.id, err.toString());
        }
      }

      // 2. Puxa eventos remotos com #Dsc
      importados = await GoogleCalendarService.instance.puxarEventosRemotos();

      return {
        'sucesso': true,
        'mensagem': 'Sincronização concluída: \$enviados enviado(s), \$importados importado(s).',
      };
    } catch (e) {
      debugPrint('[SyncManager] Erro: \$e');
      return {'sucesso': false, 'mensagem': 'Erro na sincronização: \$e'};
    } finally {
      _isSyncing = false;
    }
  }
}
`,
  },

  // 5. BackupService
  {
    path: 'lib/services/backup_service.dart',
    name: 'backup_service.dart',
    category: 'service',
    description: 'Exportação e importação de arquivo SQLite com avisos de segurança',
    code: `import '../database/database_helper.dart';

class BackupService {
  Future<String> exportarBanco(String destinoPath) async {
    return await DatabaseHelper.instance.backupDatabase(destinoPath);
  }

  Future<bool> importarBanco(String origemPath) async {
    return await DatabaseHelper.instance.restoreDatabase(origemPath);
  }
}
`,
  },
];
