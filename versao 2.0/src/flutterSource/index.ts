import type { FlutterFile } from './types';
import { REPOSITORY_FILES } from './repositoryFiles';
import { SERVICE_FILES } from './serviceFiles';
import { WIDGET_FILES } from './widgetFiles';
import { SCREEN_FILES } from './screenFiles';

export type { FlutterFile } from './types';

const BASE_PROJECT_FILES: FlutterFile[] = [
  // ==========================================
  // 1. CONFIGURAÇÃO DO PROJETO (pubspec.yaml)
  // ==========================================
  {
    path: 'pubspec.yaml',
    name: 'pubspec.yaml',
    category: 'config',
    description: 'Configuração do projeto com sqflite, chaves estrangeiras, UUID, Provider e Google APIs',
    code: `name: schmitt_detailer
description: "Schmitt Detailer - Aplicativo Android de Estética Automotiva Offline-First"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # Banco de Dados Local Offline-First (SQLite nativo robusto)
  sqflite: ^2.3.3+1
  path: ^1.9.0

  # Identificadores Únicos Estáveis (UUID v4 para sincronização idempotente)
  uuid: ^4.4.0

  # Gerência de Estado Reativa
  provider: ^6.1.2

  # Autenticação Google & Google Calendar API (googleapis)
  google_sign_in: ^6.2.1
  googleapis: ^13.2.0
  extension_google_sign_in_as_googleapis_auth: ^2.0.12

  # Tarefas em Segundo Plano (Sincronização periódica da agenda)
  workmanager: ^0.5.2

  # Notificações Locais e Fusos Horários
  flutter_local_notifications: ^17.1.2
  timezone: ^0.9.3

  # Verificação de Rede & Conectividade
  connectivity_plus: ^6.0.3

  # Armazenamento Seguro de Tokens OAuth 2.0 (sem segredos no código)
  flutter_secure_storage: ^9.2.2

  # Formatação de Datas e Moeda Brasileira (R$)
  intl: ^0.19.0
  google_fonts: ^6.2.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
`,
  },

  // ==========================================
  // 2. CONFIGURAÇÃO ANDROID (build.gradle)
  // ==========================================
  {
    path: 'android/app/build.gradle',
    name: 'build.gradle',
    category: 'android',
    description: 'Build Gradle com pacote com.schmitt.agenda_clientes e SDK 34',
    code: `plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
}

def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

def flutterVersionCode = localProperties.getProperty('flutter.versionCode')
if (flutterVersionCode == null) {
    flutterVersionCode = '1'
}

def flutterVersionName = localProperties.getProperty('flutter.versionName')
if (flutterVersionName == null) {
    flutterVersionName = '1.0'
}

android {
    namespace "com.schmitt.agenda_clientes"
    compileSdkVersion 34
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    defaultConfig {
        applicationId "com.schmitt.agenda_clientes"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        multiDexEnabled true
    }

    buildTypes {
        release {
            signingConfig signingConfigs.debug
            minifyEnabled false
            shrinkResources false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

flutter {
    source '../..'
}

dependencies {
    implementation 'androidx.window:window:1.2.0'
    implementation 'androidx.window:window-java:1.2.0'
}
`,
  },

  // ==========================================
  // 3. ANDROID MANIFEST (AndroidManifest.xml)
  // ==========================================
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    name: 'AndroidManifest.xml',
    category: 'android',
    description: 'Manifest com permissões de alarmes exatos, notificações, rede e boot',
    code: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.schmitt.agenda_clientes">

    <!-- Permissões de Rede para Sincronização Google Agenda -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Permissões para Notificações e Alarmes da Agenda (Android 12/13/14+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:label="Schmitt Detailer"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:allowBackup="true"
        android:supportsRtl="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>

        <!-- Receiver para reagendar notificações após reinicialização do dispositivo -->
        <receiver
            android:name="com.dexterous.flutterlocalnotifications.ScheduledNotificationBootReceiver"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED"/>
                <action android:name="android.intent.action.MY_PACKAGE_REPLACED"/>
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
                <action android:name="com.htc.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>

        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`,
  },

  // ==========================================
  // 4. CONSTANTES DO BANCO DE DADOS (database_constants.dart)
  // ==========================================
  {
    path: 'lib/database/database_constants.dart',
    name: 'database_constants.dart',
    category: 'database',
    description: 'Nomes de todas as 9 tabelas e colunas do SQLite parametrizadas',
    code: `/// Constantes das tabelas e colunas do SQLite para garantir consultas parametrizadas
/// e integridade referencial em todo o app Schmitt Detailer.
class DatabaseConstants {
  static const String databaseName = 'schmitt_detailer.db';
  static const int databaseVersion = 1;

  // 1. Clientes
  static const String tableClientes = 'clientes';
  static const String colClienteId = 'id';
  static const String colClienteNomeCompleto = 'nome_completo';
  static const String colClienteCelular = 'celular';
  static const String colClienteEnderecoCompleto = 'endereco_completo';
  static const String colClienteObservacoes = 'observacoes';
  static const String colClienteCriadoEm = 'criado_em';
  static const String colClienteAtualizadoEm = 'atualizado_em';
  static const String colClienteExcluidoEm = 'excluido_em';

  // 2. Veículos
  static const String tableVeiculos = 'veiculos';
  static const String colVeiculoId = 'id';
  static const String colVeiculoClienteId = 'cliente_id';
  static const String colVeiculoMarca = 'marca';
  static const String colVeiculoModelo = 'modelo';
  static const String colVeiculoAno = 'ano';
  static const String colVeiculoPlaca = 'placa';
  static const String colVeiculoObservacoes = 'observacoes';
  static const String colVeiculoCriadoEm = 'criado_em';
  static const String colVeiculoAtualizadoEm = 'atualizado_em';
  static const String colVeiculoExcluidoEm = 'excluido_em';

  // 3. Produtos
  static const String tableProdutos = 'produtos';
  static const String colProdutoId = 'id';
  static const String colProdutoNome = 'nome';
  static const String colProdutoUnidade = 'unidade'; // ml, g, unidade
  static const String colProdutoPrecoEmbalagem = 'preco_embalagem';
  static const String colProdutoQuantidadeEmbalagem = 'quantidade_embalagem';
  static const String colProdutoCustoUnitario = 'custo_unitario';
  static const String colProdutoAtivo = 'ativo'; // 1=ativo, 0=inativo
  static const String colProdutoCriadoEm = 'criado_em';
  static const String colProdutoAtualizadoEm = 'atualizado_em';

  // 4. Tipos de Serviço (Combos)
  static const String tableTiposServico = 'tipos_servico';
  static const String colTipoServicoId = 'id';
  static const String colTipoServicoNome = 'nome';
  static const String colTipoServicoPrecoPadrao = 'preco_padrao';
  static const String colTipoServicoAtivo = 'ativo';
  static const String colTipoServicoCriadoEm = 'criado_em';
  static const String colTipoServicoAtualizadoEm = 'atualizado_em';

  // 5. Relação Tipo de Serviço x Produtos do Combo
  static const String tableTipoServicoProdutos = 'tipo_servico_produtos';
  static const String colComboId = 'id';
  static const String colComboTipoServicoId = 'tipo_servico_id';
  static const String colComboProdutoId = 'produto_id';
  static const String colComboQuantidadeUsada = 'quantidade_usada';

  // 6. Histórico de Serviços (com cópia estática dos custos)
  static const String tableHistoricoServicos = 'historico_servicos';
  static const String colHistId = 'id';
  static const String colHistClienteId = 'cliente_id';
  static const String colHistVeiculoId = 'veiculo_id';
  static const String colHistTipoServicoId = 'tipo_servico_id';
  static const String colHistDescricao = 'descricao';
  static const String colHistData = 'data';
  static const String colHistObservacoesTecnicas = 'observacoes_tecnicas';
  static const String colHistValorCobrado = 'valor_cobrado';
  static const String colHistCustoProdutos = 'custo_produtos';
  static const String colHistProdutosSnapshotJson = 'produtos_snapshot_json';
  static const String colHistSituacao = 'situacao';
  static const String colHistCriadoEm = 'criado_em';

  // 7. Agendamentos
  static const String tableAgendamentos = 'agendamentos';
  static const String colAgendamentoId = 'id';
  static const String colAgendamentoClienteId = 'cliente_id';
  static const String colAgendamentoVeiculoId = 'veiculo_id';
  static const String colAgendamentoTipoServicoId = 'tipo_servico_id';
  static const String colAgendamentoInicio = 'inicio';
  static const String colAgendamentoTermino = 'termino';
  static const String colAgendamentoObservacoes = 'observacoes';
  static const String colAgendamentoSituacao = 'situacao'; // agendado, concluido, cancelado
  static const String colAgendamentoSyncSituacao = 'sync_situacao'; // pendente, sincronizado, erro
  static const String colAgendamentoGoogleEventId = 'google_event_id';
  static const String colAgendamentoCriadoEm = 'criado_em';
  static const String colAgendamentoAtualizadoEm = 'atualizado_em';

  // 8. Fila de Sincronização Local (sync_queue)
  static const String tableSyncQueue = 'sync_queue';
  static const String colSyncId = 'id';
  static const String colSyncAgendamentoId = 'agendamento_id';
  static const String colSyncAcao = 'acao'; // insert, update, delete
  static const String colSyncTentativas = 'tentativas';
  static const String colSyncUltimoErro = 'ultimo_erro';
  static const String colSyncCriadoEm = 'criado_em';

  // 9. Metadados de Sincronização (Tokens de paginação, syncToken)
  static const String tableSyncMetadata = 'sync_metadata';
  static const String colMetaChave = 'chave';
  static const String colMetaValor = 'valor';
}
`,
  },

  // ==========================================
  // 5. DATABASE HELPER COM FOREIGN KEYS E MIGRAÇÕES (database_helper.dart)
  // ==========================================
  {
    path: 'lib/database/database_helper.dart',
    name: 'database_helper.dart',
    category: 'database',
    description: 'Gerenciador SQLite com Foreign Keys ativas, migrações versionadas e consultas parametrizadas',
    code: `import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'database_constants.dart';

/// Gerenciador Singleton do banco de dados SQLite local.
/// Garante que:
/// 1. PRAGMA foreign_keys = ON; esteja sempre ativado;
/// 2. Migrações futuras sejam versionadas de forma segura;
/// 3. Todas as operações possam rodar 100% offline;
/// 4. Backup e restauração de dados possam ser realizados.
class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._internal();
  DatabaseHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null && _database!.isOpen) {
      return _database!;
    }
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final databasesPath = await getDatabasesPath();
    final path = join(databasesPath, DatabaseConstants.databaseName);

    debugPrint('[SQLite] Inicializando banco em: \$path (Versão \${DatabaseConstants.databaseVersion})');

    return await openDatabase(
      path,
      version: DatabaseConstants.databaseVersion,
      onConfigure: _onConfigure,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  /// CRÍTICO: Ativa integridade referencial com Chaves Estrangeiras no SQLite Android
  Future<void> _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON;');
    debugPrint('[SQLite] PRAGMA foreign_keys = ON executado com sucesso.');
  }

  /// Criação inicial de todas as 9 tabelas do sistema na versão 1
  Future<void> _onCreate(Database db, int version) async {
    debugPrint('[SQLite] Executando DDL de criação inicial (v\$version)...');

    await db.transaction((txn) async {
      // 1. Tabela Clientes (com exclusão lógica)
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableClientes} (
          \${DatabaseConstants.colClienteId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colClienteNomeCompleto} TEXT NOT NULL,
          \${DatabaseConstants.colClienteCelular} TEXT NOT NULL,
          \${DatabaseConstants.colClienteEnderecoCompleto} TEXT,
          \${DatabaseConstants.colClienteObservacoes} TEXT,
          \${DatabaseConstants.colClienteCriadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colClienteAtualizadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colClienteExcluidoEm} TEXT
        );
      ''');
      await txn.execute('CREATE INDEX idx_clientes_nome ON \${DatabaseConstants.tableClientes}(\${DatabaseConstants.colClienteNomeCompleto});');
      await txn.execute('CREATE INDEX idx_clientes_celular ON \${DatabaseConstants.tableClientes}(\${DatabaseConstants.colClienteCelular});');
      await txn.execute('CREATE INDEX idx_clientes_excluido ON \${DatabaseConstants.tableClientes}(\${DatabaseConstants.colClienteExcluidoEm});');

      // 2. Tabela Veículos (Chave Estrangeira para Clientes)
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableVeiculos} (
          \${DatabaseConstants.colVeiculoId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colVeiculoClienteId} TEXT NOT NULL,
          \${DatabaseConstants.colVeiculoMarca} TEXT NOT NULL,
          \${DatabaseConstants.colVeiculoModelo} TEXT NOT NULL,
          \${DatabaseConstants.colVeiculoAno} TEXT,
          \${DatabaseConstants.colVeiculoPlaca} TEXT,
          \${DatabaseConstants.colVeiculoObservacoes} TEXT,
          \${DatabaseConstants.colVeiculoCriadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colVeiculoAtualizadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colVeiculoExcluidoEm} TEXT,
          FOREIGN KEY (\${DatabaseConstants.colVeiculoClienteId}) 
            REFERENCES \${DatabaseConstants.tableClientes} (\${DatabaseConstants.colClienteId}) 
            ON DELETE RESTRICT
        );
      ''');
      await txn.execute('CREATE INDEX idx_veiculos_cliente ON \${DatabaseConstants.tableVeiculos}(\${DatabaseConstants.colVeiculoClienteId});');
      await txn.execute('CREATE INDEX idx_veiculos_placa ON \${DatabaseConstants.tableVeiculos}(\${DatabaseConstants.colVeiculoPlaca});');

      // 3. Tabela Produtos
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableProdutos} (
          \${DatabaseConstants.colProdutoId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colProdutoNome} TEXT NOT NULL,
          \${DatabaseConstants.colProdutoUnidade} TEXT NOT NULL,
          \${DatabaseConstants.colProdutoPrecoEmbalagem} REAL NOT NULL,
          \${DatabaseConstants.colProdutoQuantidadeEmbalagem} REAL NOT NULL,
          \${DatabaseConstants.colProdutoCustoUnitario} REAL NOT NULL,
          \${DatabaseConstants.colProdutoAtivo} INTEGER NOT NULL DEFAULT 1,
          \${DatabaseConstants.colProdutoCriadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colProdutoAtualizadoEm} TEXT NOT NULL
        );
      ''');
      await txn.execute('CREATE INDEX idx_produtos_nome ON \${DatabaseConstants.tableProdutos}(\${DatabaseConstants.colProdutoNome});');
      await txn.execute('CREATE INDEX idx_produtos_ativo ON \${DatabaseConstants.tableProdutos}(\${DatabaseConstants.colProdutoAtivo});');

      // 4. Tabela Tipos de Serviço (Combos)
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableTiposServico} (
          \${DatabaseConstants.colTipoServicoId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colTipoServicoNome} TEXT NOT NULL,
          \${DatabaseConstants.colTipoServicoPrecoPadrao} REAL NOT NULL,
          \${DatabaseConstants.colTipoServicoAtivo} INTEGER NOT NULL DEFAULT 1,
          \${DatabaseConstants.colTipoServicoCriadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colTipoServicoAtualizadoEm} TEXT NOT NULL
        );
      ''');
      await txn.execute('CREATE INDEX idx_tipos_servico_ativo ON \${DatabaseConstants.tableTiposServico}(\${DatabaseConstants.colTipoServicoAtivo});');

      // 5. Tabela Relação Tipo de Serviço x Produtos Usados no Combo
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableTipoServicoProdutos} (
          \${DatabaseConstants.colComboId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colComboTipoServicoId} TEXT NOT NULL,
          \${DatabaseConstants.colComboProdutoId} TEXT NOT NULL,
          \${DatabaseConstants.colComboQuantidadeUsada} REAL NOT NULL,
          FOREIGN KEY (\${DatabaseConstants.colComboTipoServicoId}) 
            REFERENCES \${DatabaseConstants.tableTiposServico} (\${DatabaseConstants.colTipoServicoId}) 
            ON DELETE CASCADE,
          FOREIGN KEY (\${DatabaseConstants.colComboProdutoId}) 
            REFERENCES \${DatabaseConstants.tableProdutos} (\${DatabaseConstants.colProdutoId}) 
            ON DELETE RESTRICT
        );
      ''');
      await txn.execute('CREATE INDEX idx_combo_servico ON \${DatabaseConstants.tableTipoServicoProdutos}(\${DatabaseConstants.colComboTipoServicoId});');

      // 6. Tabela Histórico de Serviços (grava cópia fiel e imutável dos custos no momento)
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableHistoricoServicos} (
          \${DatabaseConstants.colHistId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colHistClienteId} TEXT NOT NULL,
          \${DatabaseConstants.colHistVeiculoId} TEXT,
          \${DatabaseConstants.colHistTipoServicoId} TEXT,
          \${DatabaseConstants.colHistDescricao} TEXT NOT NULL,
          \${DatabaseConstants.colHistData} TEXT NOT NULL,
          \${DatabaseConstants.colHistObservacoesTecnicas} TEXT,
          \${DatabaseConstants.colHistValorCobrado} REAL NOT NULL,
          \${DatabaseConstants.colHistCustoProdutos} REAL NOT NULL,
          \${DatabaseConstants.colHistProdutosSnapshotJson} TEXT,
          \${DatabaseConstants.colHistSituacao} TEXT NOT NULL DEFAULT 'concluido',
          \${DatabaseConstants.colHistCriadoEm} TEXT NOT NULL,
          FOREIGN KEY (\${DatabaseConstants.colHistClienteId}) 
            REFERENCES \${DatabaseConstants.tableClientes} (\${DatabaseConstants.colClienteId}),
          FOREIGN KEY (\${DatabaseConstants.colHistVeiculoId}) 
            REFERENCES \${DatabaseConstants.tableVeiculos} (\${DatabaseConstants.colVeiculoId}),
          FOREIGN KEY (\${DatabaseConstants.colHistTipoServicoId}) 
            REFERENCES \${DatabaseConstants.tableTiposServico} (\${DatabaseConstants.colTipoServicoId})
        );
      ''');
      await txn.execute('CREATE INDEX idx_historico_cliente ON \${DatabaseConstants.tableHistoricoServicos}(\${DatabaseConstants.colHistClienteId});');
      await txn.execute('CREATE INDEX idx_historico_data ON \${DatabaseConstants.tableHistoricoServicos}(\${DatabaseConstants.colHistData});');

      // 7. Tabela Agendamentos
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableAgendamentos} (
          \${DatabaseConstants.colAgendamentoId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colAgendamentoClienteId} TEXT NOT NULL,
          \${DatabaseConstants.colAgendamentoVeiculoId} TEXT,
          \${DatabaseConstants.colAgendamentoTipoServicoId} TEXT,
          \${DatabaseConstants.colAgendamentoInicio} TEXT NOT NULL,
          \${DatabaseConstants.colAgendamentoTermino} TEXT NOT NULL,
          \${DatabaseConstants.colAgendamentoObservacoes} TEXT,
          \${DatabaseConstants.colAgendamentoSituacao} TEXT NOT NULL DEFAULT 'agendado',
          \${DatabaseConstants.colAgendamentoSyncSituacao} TEXT NOT NULL DEFAULT 'pendente',
          \${DatabaseConstants.colAgendamentoGoogleEventId} TEXT,
          \${DatabaseConstants.colAgendamentoCriadoEm} TEXT NOT NULL,
          \${DatabaseConstants.colAgendamentoAtualizadoEm} TEXT NOT NULL,
          FOREIGN KEY (\${DatabaseConstants.colAgendamentoClienteId}) 
            REFERENCES \${DatabaseConstants.tableClientes} (\${DatabaseConstants.colClienteId}),
          FOREIGN KEY (\${DatabaseConstants.colAgendamentoVeiculoId}) 
            REFERENCES \${DatabaseConstants.tableVeiculos} (\${DatabaseConstants.colVeiculoId}),
          FOREIGN KEY (\${DatabaseConstants.colAgendamentoTipoServicoId}) 
            REFERENCES \${DatabaseConstants.tableTiposServico} (\${DatabaseConstants.colTipoServicoId})
        );
      ''');
      await txn.execute('CREATE INDEX idx_agendamentos_inicio ON \${DatabaseConstants.tableAgendamentos}(\${DatabaseConstants.colAgendamentoInicio});');
      await txn.execute('CREATE INDEX idx_agendamentos_sync ON \${DatabaseConstants.tableAgendamentos}(\${DatabaseConstants.colAgendamentoSyncSituacao});');
      await txn.execute('CREATE INDEX idx_agendamentos_google ON \${DatabaseConstants.tableAgendamentos}(\${DatabaseConstants.colAgendamentoGoogleEventId});');

      // 8. Fila de Sincronização Local (sync_queue)
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableSyncQueue} (
          \${DatabaseConstants.colSyncId} TEXT PRIMARY KEY,
          \${DatabaseConstants.colSyncAgendamentoId} TEXT NOT NULL,
          \${DatabaseConstants.colSyncAcao} TEXT NOT NULL,
          \${DatabaseConstants.colSyncTentativas} INTEGER NOT NULL DEFAULT 0,
          \${DatabaseConstants.colSyncUltimoErro} TEXT,
          \${DatabaseConstants.colSyncCriadoEm} TEXT NOT NULL
        );
      ''');
      await txn.execute('CREATE INDEX idx_sync_queue_agendamento ON \${DatabaseConstants.tableSyncQueue}(\${DatabaseConstants.colSyncAgendamentoId});');

      // 9. Metadados de Sincronização
      await txn.execute('''
        CREATE TABLE \${DatabaseConstants.tableSyncMetadata} (
          \${DatabaseConstants.colMetaChave} TEXT PRIMARY KEY,
          \${DatabaseConstants.colMetaValor} TEXT
        );
      ''');

      debugPrint('[SQLite] Todas as 9 tabelas foram criadas com sucesso!');
    });
  }

  /// Gerenciamento de Migrações Versionadas
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    debugPrint('[SQLite] Migrando banco da versão \$oldVersion para a versão \$newVersion...');
    // Exemplo para futuras migrações incrementais:
    // if (oldVersion < 2) { ... migração v2 ... }
    // if (oldVersion < 3) { ... migração v3 ... }
  }

  /// Teste de integridade do banco: retorna se as FKs estão ativas e a contagem das tabelas
  Future<Map<String, dynamic>> checkDatabaseIntegrity() async {
    final db = await database;
    final pragmaFk = await db.rawQuery('PRAGMA foreign_keys;');
    final isFkEnabled = pragmaFk.isNotEmpty && pragmaFk.first.values.first == 1;

    final tables = [
      DatabaseConstants.tableClientes,
      DatabaseConstants.tableVeiculos,
      DatabaseConstants.tableProdutos,
      DatabaseConstants.tableTiposServico,
      DatabaseConstants.tableTipoServicoProdutos,
      DatabaseConstants.tableHistoricoServicos,
      DatabaseConstants.tableAgendamentos,
      DatabaseConstants.tableSyncQueue,
      DatabaseConstants.tableSyncMetadata,
    ];

    final Map<String, int> counts = {};
    for (final table in tables) {
      final res = await db.rawQuery('SELECT COUNT(*) as count FROM \$table');
      counts[table] = Sqflite.firstIntValue(res) ?? 0;
    }

    return {
      'foreign_keys_enabled': isFkEnabled,
      'database_version': DatabaseConstants.databaseVersion,
      'tables_count': counts,
    };
  }

  /// Exporta o arquivo SQLite local para backup (conforme Seção 10)
  Future<String> backupDatabase(String destinationDirectory) async {
    final db = await database;
    await db.close(); // Fecha temporariamente para garantir consistência
    final databasesPath = await getDatabasesPath();
    final sourcePath = join(databasesPath, DatabaseConstants.databaseName);

    final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
    final backupFileName = 'schmitt_backup_\$timestamp.db';
    final destinationPath = join(destinationDirectory, backupFileName);

    final sourceFile = File(sourcePath);
    await sourceFile.copy(destinationPath);

    // Reabre o banco após a cópia
    _database = await _initDatabase();
    debugPrint('[SQLite] Backup gerado com sucesso em: \$destinationPath');
    return destinationPath;
  }

  /// Restaura o arquivo SQLite a partir de um backup
  Future<bool> restoreDatabase(String backupPath) async {
    try {
      final backupFile = File(backupPath);
      if (!await backupFile.exists()) return false;

      final db = await database;
      await db.close();

      final databasesPath = await getDatabasesPath();
      final destinationPath = join(databasesPath, DatabaseConstants.databaseName);

      await backupFile.copy(destinationPath);
      _database = await _initDatabase();
      debugPrint('[SQLite] Banco restaurado a partir de: \$backupPath');
      return true;
    } catch (e) {
      debugPrint('[SQLite] Erro ao restaurar banco: \$e');
      _database = await _initDatabase();
      return false;
    }
  }

  Future<void> close() async {
    if (_database != null && _database!.isOpen) {
      await _database!.close();
      _database = null;
    }
  }
}
`,
  },

  // ==========================================
  // 6. MODELO DE CLIENTE (cliente_model.dart)
  // ==========================================
  {
    path: 'lib/models/cliente_model.dart',
    name: 'cliente_model.dart',
    category: 'model',
    description: 'Modelo do Cliente com UUID, campos obrigatórios e exclusão lógica',
    code: `import 'package:uuid/uuid.dart';

/// Modelo de Cliente com exclusão lógica e histórico.
/// Regra 1: id é UUID v4 estável.
class ClienteModel {
  final String id;
  final String nomeCompleto;
  final String celular;
  final String? enderecoCompleto;
  final String? observacoes;
  final DateTime criadoEm;
  final DateTime atualizadoEm;
  final DateTime? excluidoEm;

  ClienteModel({
    String? id,
    required this.nomeCompleto,
    required this.celular,
    this.enderecoCompleto,
    this.observacoes,
    DateTime? criadoEm,
    DateTime? atualizadoEm,
    this.excluidoEm,
  })  : id = id ?? const Uuid().v4(),
        criadoEm = criadoEm ?? DateTime.now(),
        atualizadoEm = atualizadoEm ?? DateTime.now();

  bool get isExcluido => excluidoEm != null;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nome_completo': nomeCompleto.trim(),
      'celular': celular.replaceAll(RegExp(r'[^0-9]'), ''),
      'endereco_completo': enderecoCompleto?.trim(),
      'observacoes': observacoes?.trim(),
      'criado_em': criadoEm.toIso8601String(),
      'atualizado_em': atualizadoEm.toIso8601String(),
      'excluido_em': excluidoEm?.toIso8601String(),
    };
  }

  factory ClienteModel.fromMap(Map<String, dynamic> map) {
    return ClienteModel(
      id: map['id'] as String,
      nomeCompleto: map['nome_completo'] as String,
      celular: map['celular'] as String,
      enderecoCompleto: map['endereco_completo'] as String?,
      observacoes: map['observacoes'] as String?,
      criadoEm: DateTime.parse(map['criado_em'] as String),
      atualizadoEm: DateTime.parse(map['atualizado_em'] as String),
      excluidoEm: map['excluido_em'] != null ? DateTime.parse(map['excluido_em'] as String) : null,
    );
  }

  ClienteModel copyWith({
    String? nomeCompleto,
    String? celular,
    String? enderecoCompleto,
    String? observacoes,
    DateTime? atualizadoEm,
    DateTime? excluidoEm,
  }) {
    return ClienteModel(
      id: id,
      nomeCompleto: nomeCompleto ?? this.nomeCompleto,
      celular: celular ?? this.celular,
      enderecoCompleto: enderecoCompleto ?? this.enderecoCompleto,
      observacoes: observacoes ?? this.observacoes,
      criadoEm: criadoEm,
      atualizadoEm: atualizadoEm ?? DateTime.now(),
      excluidoEm: excluidoEm,
    );
  }
}
`,
  },

  // ==========================================
  // 7. MODELO DE VEÍCULO (veiculo_model.dart)
  // ==========================================
  {
    path: 'lib/models/veiculo_model.dart',
    name: 'veiculo_model.dart',
    category: 'model',
    description: 'Modelo de Veículo com FK clienteId, placa e dados técnicos',
    code: `import 'package:uuid/uuid.dart';

/// Modelo de Veículo associado ao Cliente por chave estrangeira.
/// Regra 2: Cada cliente pode ter múltiplos veículos.
class VeiculoModel {
  final String id;
  final String clienteId;
  final String marca;
  final String modelo;
  final String? ano;
  final String? placa;
  final String? observacoes;
  final DateTime criadoEm;
  final DateTime atualizadoEm;
  final DateTime? excluidoEm;

  VeiculoModel({
    String? id,
    required this.clienteId,
    required this.marca,
    required this.modelo,
    this.ano,
    this.placa,
    this.observacoes,
    DateTime? criadoEm,
    DateTime? atualizadoEm,
    this.excluidoEm,
  })  : id = id ?? const Uuid().v4(),
        criadoEm = criadoEm ?? DateTime.now(),
        atualizadoEm = atualizadoEm ?? DateTime.now();

  String get descricaoCompleta {
    final buffer = StringBuffer('\$marca \$modelo');
    if (ano != null && ano!.isNotEmpty) buffer.write(' \$ano');
    if (placa != null && placa!.isNotEmpty) buffer.write(' (\${placa!.toUpperCase()})');
    return buffer.toString();
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'cliente_id': clienteId,
      'marca': marca.trim(),
      'modelo': modelo.trim(),
      'ano': ano?.trim(),
      'placa': placa?.trim().toUpperCase(),
      'observacoes': observacoes?.trim(),
      'criado_em': criadoEm.toIso8601String(),
      'atualizado_em': atualizadoEm.toIso8601String(),
      'excluido_em': excluidoEm?.toIso8601String(),
    };
  }

  factory VeiculoModel.fromMap(Map<String, dynamic> map) {
    return VeiculoModel(
      id: map['id'] as String,
      clienteId: map['cliente_id'] as String,
      marca: map['marca'] as String,
      modelo: map['modelo'] as String,
      ano: map['ano'] as String?,
      placa: map['placa'] as String?,
      observacoes: map['observacoes'] as String?,
      criadoEm: DateTime.parse(map['criado_em'] as String),
      atualizadoEm: DateTime.parse(map['atualizado_em'] as String),
      excluidoEm: map['excluido_em'] != null ? DateTime.parse(map['excluido_em'] as String) : null,
    );
  }

  VeiculoModel copyWith({
    String? clienteId,
    String? marca,
    String? modelo,
    String? ano,
    String? placa,
    String? observacoes,
    DateTime? atualizadoEm,
    DateTime? excluidoEm,
  }) {
    return VeiculoModel(
      id: id,
      clienteId: clienteId ?? this.clienteId,
      marca: marca ?? this.marca,
      modelo: modelo ?? this.modelo,
      ano: ano ?? this.ano,
      placa: placa ?? this.placa,
      observacoes: observacoes ?? this.observacoes,
      criadoEm: criadoEm,
      atualizadoEm: atualizadoEm ?? DateTime.now(),
      excluidoEm: excluidoEm,
    );
  }
}
`,
  },

  // ==========================================
  // 8. MODELO DE PRODUTO (produto_model.dart)
  // ==========================================
  {
    path: 'lib/models/produto_model.dart',
    name: 'produto_model.dart',
    category: 'model',
    description: 'Modelo de Insumo com cálculo automático de custo por unidade de medida',
    code: `import 'package:uuid/uuid.dart';

/// Modelo de Insumo/Produto usado nos combos e serviços automotivos.
/// Regra 3: Calcula automaticamente o custo por unidade fracionada (ex: por ml, por grama).
class ProdutoModel {
  final String id;
  final String nome;
  final String unidade; // 'ml', 'g', 'unidade'
  final double precoEmbalagem;
  final double quantidadeEmbalagem;
  final double custoUnitario; // Calculado: precoEmbalagem / quantidadeEmbalagem
  final bool ativo;
  final DateTime criadoEm;
  final DateTime atualizadoEm;

  ProdutoModel({
    String? id,
    required this.nome,
    required this.unidade,
    required this.precoEmbalagem,
    required this.quantidadeEmbalagem,
    double? custoUnitario,
    this.ativo = true,
    DateTime? criadoEm,
    DateTime? atualizadoEm,
  })  : id = id ?? const Uuid().v4(),
        custoUnitario = custoUnitario ?? (quantidadeEmbalagem > 0 ? precoEmbalagem / quantidadeEmbalagem : 0.0),
        criadoEm = criadoEm ?? DateTime.now(),
        atualizadoEm = atualizadoEm ?? DateTime.now();

  /// Calcula o custo de uma porção consumida
  double calcularCustoPorcao(double quantidadeUsada) {
    return quantidadeUsada * custoUnitario;
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nome': nome.trim(),
      'unidade': unidade.trim(),
      'preco_embalagem': precoEmbalagem,
      'quantidade_embalagem': quantidadeEmbalagem,
      'custo_unitario': custoUnitario,
      'ativo': ativo ? 1 : 0,
      'criado_em': criadoEm.toIso8601String(),
      'atualizado_em': atualizadoEm.toIso8601String(),
    };
  }

  factory ProdutoModel.fromMap(Map<String, dynamic> map) {
    return ProdutoModel(
      id: map['id'] as String,
      nome: map['nome'] as String,
      unidade: map['unidade'] as String,
      precoEmbalagem: (map['preco_embalagem'] as num).toDouble(),
      quantidadeEmbalagem: (map['quantidade_embalagem'] as num).toDouble(),
      custoUnitario: (map['custo_unitario'] as num).toDouble(),
      ativo: (map['ativo'] as int) == 1,
      criadoEm: DateTime.parse(map['criado_em'] as String),
      atualizadoEm: DateTime.parse(map['atualizado_em'] as String),
    );
  }

  ProdutoModel copyWith({
    String? nome,
    String? unidade,
    double? precoEmbalagem,
    double? quantidadeEmbalagem,
    bool? ativo,
    DateTime? atualizadoEm,
  }) {
    final novoPreco = precoEmbalagem ?? this.precoEmbalagem;
    final novaQtd = quantidadeEmbalagem ?? this.quantidadeEmbalagem;
    return ProdutoModel(
      id: id,
      nome: nome ?? this.nome,
      unidade: unidade ?? this.unidade,
      precoEmbalagem: novoPreco,
      quantidadeEmbalagem: novaQtd,
      custoUnitario: novaQtd > 0 ? novoPreco / novaQtd : 0.0,
      ativo: ativo ?? this.ativo,
      criadoEm: criadoEm,
      atualizadoEm: atualizadoEm ?? DateTime.now(),
    );
  }
}
`,
  },

  // ==========================================
  // 9. MODELO DE TIPO DE SERVIÇO / COMBO (tipo_servico_model.dart)
  // ==========================================
  {
    path: 'lib/models/tipo_servico_model.dart',
    name: 'tipo_servico_model.dart',
    category: 'model',
    description: 'Modelo de Combo/Tipo de Serviço com lista de insumos e margem estimada',
    code: `import 'package:uuid/uuid.dart';
import 'tipo_servico_produto_model.dart';

/// Modelo de Combo de Serviço Automotivo (ex: Vitrificação, Polimento, Higienização).
/// Regra 3: Apresenta preço cobrado padrão, lista de insumos e calcula custo e margem.
class TipoServicoModel {
  final String id;
  final String nome;
  final double precoPadrao;
  final bool ativo;
  final List<TipoServicoProdutoModel> produtosDoCombo;
  final DateTime criadoEm;
  final DateTime atualizadoEm;

  TipoServicoModel({
    String? id,
    required this.nome,
    required this.precoPadrao,
    this.ativo = true,
    List<TipoServicoProdutoModel>? produtosDoCombo,
    DateTime? criadoEm,
    DateTime? atualizadoEm,
  })  : id = id ?? const Uuid().v4(),
        produtosDoCombo = produtosDoCombo ?? [],
        criadoEm = criadoEm ?? DateTime.now(),
        atualizadoEm = atualizadoEm ?? DateTime.now();

  /// Calcula o custo total estimado dos produtos consumidos neste combo
  double get custoEstimadoProdutos {
    return produtosDoCombo.fold(0.0, (acc, item) => acc + item.custoItem);
  }

  /// Lucro bruto estimado
  double get lucroBrutoEstimado => precoPadrao - custoEstimadoProdutos;

  /// Margem estimada em percentual (0 a 100%)
  double get margemEstimadaPercentual {
    if (precoPadrao <= 0) return 0.0;
    return (lucroBrutoEstimado / precoPadrao) * 100;
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nome': nome.trim(),
      'preco_padrao': precoPadrao,
      'ativo': ativo ? 1 : 0,
      'criado_em': criadoEm.toIso8601String(),
      'atualizado_em': atualizadoEm.toIso8601String(),
    };
  }

  factory TipoServicoModel.fromMap(Map<String, dynamic> map, {List<TipoServicoProdutoModel>? produtos}) {
    return TipoServicoModel(
      id: map['id'] as String,
      nome: map['nome'] as String,
      precoPadrao: (map['preco_padrao'] as num).toDouble(),
      ativo: (map['ativo'] as int) == 1,
      produtosDoCombo: produtos ?? [],
      criadoEm: DateTime.parse(map['criado_em'] as String),
      atualizadoEm: DateTime.parse(map['atualizado_em'] as String),
    );
  }

  TipoServicoModel copyWith({
    String? nome,
    double? precoPadrao,
    bool? ativo,
    List<TipoServicoProdutoModel>? produtosDoCombo,
    DateTime? atualizadoEm,
  }) {
    return TipoServicoModel(
      id: id,
      nome: nome ?? this.nome,
      precoPadrao: precoPadrao ?? this.precoPadrao,
      ativo: ativo ?? this.ativo,
      produtosDoCombo: produtosDoCombo ?? this.produtosDoCombo,
      criadoEm: criadoEm,
      atualizadoEm: atualizadoEm ?? DateTime.now(),
    );
  }
}
`,
  },

  // ==========================================
  // 10. MODELO DE PRODUTO NO COMBO (tipo_servico_produto_model.dart)
  // ==========================================
  {
    path: 'lib/models/tipo_servico_produto_model.dart',
    name: 'tipo_servico_produto_model.dart',
    category: 'model',
    description: 'Item de produto associado a um tipo de serviço com quantidade',
    code: `import 'package:uuid/uuid.dart';
import 'produto_model.dart';

/// Item da relação entre Tipo de Serviço e Produto, especificando a quantidade usada.
class TipoServicoProdutoModel {
  final String id;
  final String tipoServicoId;
  final String produtoId;
  final double quantidadeUsada;
  final ProdutoModel? produto;

  TipoServicoProdutoModel({
    String? id,
    required this.tipoServicoId,
    required this.produtoId,
    required this.quantidadeUsada,
    this.produto,
  }) : id = id ?? const Uuid().v4();

  double get custoItem {
    if (produto == null) return 0.0;
    return produto!.calcularCustoPorcao(quantidadeUsada);
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tipo_servico_id': tipoServicoId,
      'produto_id': produtoId,
      'quantidade_usada': quantidadeUsada,
    };
  }

  factory TipoServicoProdutoModel.fromMap(Map<String, dynamic> map, {ProdutoModel? produto}) {
    return TipoServicoProdutoModel(
      id: map['id'] as String,
      tipoServicoId: map['tipo_servico_id'] as String,
      produtoId: map['produto_id'] as String,
      quantidadeUsada: (map['quantidade_usada'] as num).toDouble(),
      produto: produto,
    );
  }
}
`,
  },

  // ==========================================
  // 11. MODELO DE HISTÓRICO DE SERVIÇO (historico_servico_model.dart)
  // ==========================================
  {
    path: 'lib/models/historico_servico_model.dart',
    name: 'historico_servico_model.dart',
    category: 'model',
    description: 'Histórico com cópia estática e imutável dos custos no momento da gravação',
    code: `import 'dart:convert';
import 'package:uuid/uuid.dart';

/// Registro de Histórico de Serviço Concluído ou em Andamento.
/// Regra 3 e 4: Grava UMA CÓPIA ESTÁTICA dos custos no momento da realização,
/// garantindo que reajustes futuros nos produtos nunca alterem o histórico financeiro passado.
class HistoricoServicoModel {
  final String id;
  final String clienteId;
  final String? veiculoId;
  final String? tipoServicoId;
  final String descricao;
  final DateTime data;
  final String? observacoesTecnicas;
  final double valorCobrado;
  final double custoProdutos; // Cópia dos custos no momento do registro
  final String? produtosSnapshotJson; // Detalhes dos insumos usados congelados
  final String situacao; // 'concluido', 'em_andamento', 'cancelado'
  final DateTime criadoEm;

  HistoricoServicoModel({
    String? id,
    required this.clienteId,
    this.veiculoId,
    this.tipoServicoId,
    required this.descricao,
    required this.data,
    this.observacoesTecnicas,
    required this.valorCobrado,
    required this.custoProdutos,
    this.produtosSnapshotJson,
    this.situacao = 'concluido',
    DateTime? criadoEm,
  })  : id = id ?? const Uuid().v4(),
        criadoEm = criadoEm ?? DateTime.now();

  double get lucroReal => valorCobrado - custoProdutos;

  List<Map<String, dynamic>> get produtosSnapshotList {
    if (produtosSnapshotJson == null || produtosSnapshotJson!.isEmpty) return [];
    try {
      final decoded = jsonDecode(produtosSnapshotJson!);
      if (decoded is List) {
        return List<Map<String, dynamic>>.from(decoded);
      }
    } catch (_) {}
    return [];
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'cliente_id': clienteId,
      'veiculo_id': veiculoId,
      'tipo_servico_id': tipoServicoId,
      'descricao': descricao.trim(),
      'data': data.toIso8601String(),
      'observacoes_tecnicas': observacoesTecnicas?.trim(),
      'valor_cobrado': valorCobrado,
      'custo_produtos': custoProdutos,
      'produtos_snapshot_json': produtosSnapshotJson,
      'situacao': situacao,
      'criado_em': criadoEm.toIso8601String(),
    };
  }

  factory HistoricoServicoModel.fromMap(Map<String, dynamic> map) {
    return HistoricoServicoModel(
      id: map['id'] as String,
      clienteId: map['cliente_id'] as String,
      veiculoId: map['veiculo_id'] as String?,
      tipoServicoId: map['tipo_servico_id'] as String?,
      descricao: map['descricao'] as String,
      data: DateTime.parse(map['data'] as String),
      observacoesTecnicas: map['observacoes_tecnicas'] as String?,
      valorCobrado: (map['valor_cobrado'] as num).toDouble(),
      custoProdutos: (map['custo_produtos'] as num).toDouble(),
      produtosSnapshotJson: map['produtos_snapshot_json'] as String?,
      situacao: map['situacao'] as String? ?? 'concluido',
      criadoEm: DateTime.parse(map['criado_em'] as String),
    );
  }
}
`,
  },

  // ==========================================
  // 12. MODELO DE AGENDAMENTO (agendamento_model.dart)
  // ==========================================
  {
    path: 'lib/models/agendamento_model.dart',
    name: 'agendamento_model.dart',
    category: 'model',
    description: 'Modelo de Agendamento com validação de horários e flags de sync',
    code: `import 'package:uuid/uuid.dart';

/// Modelo de Agendamento da oficina Schmitt Detailer.
/// Regra 6: Salva offline imediatamente.
/// Possui id estável (UUID) e vínculo com id do evento no Google Calendar.
class AgendamentoModel {
  final String id;
  final String clienteId;
  final String? veiculoId;
  final String? tipoServicoId;
  final DateTime inicio;
  final DateTime termino;
  final String? observacoes;
  final String situacao; // 'agendado', 'concluido', 'cancelado'
  final String syncSituacao; // 'pendente', 'sincronizado', 'erro'
  final String? googleEventId;
  final DateTime criadoEm;
  final DateTime atualizadoEm;

  AgendamentoModel({
    String? id,
    required this.clienteId,
    this.veiculoId,
    this.tipoServicoId,
    required this.inicio,
    required this.termino,
    this.observacoes,
    this.situacao = 'agendado',
    this.syncSituacao = 'pendente',
    this.googleEventId,
    DateTime? criadoEm,
    DateTime? atualizadoEm,
  })  : assert(termino.isAfter(inicio), 'O término do agendamento deve ser posterior ao início.'),
        id = id ?? const Uuid().v4(),
        criadoEm = criadoEm ?? DateTime.now(),
        atualizadoEm = atualizadoEm ?? DateTime.now();

  Duration get duracao => termino.difference(inicio);

  bool get isSincronizado => syncSituacao == 'sincronizado';

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'cliente_id': clienteId,
      'veiculo_id': veiculoId,
      'tipo_servico_id': tipoServicoId,
      'inicio': inicio.toIso8601String(),
      'termino': termino.toIso8601String(),
      'observacoes': observacoes?.trim(),
      'situacao': situacao,
      'sync_situacao': syncSituacao,
      'google_event_id': googleEventId,
      'criado_em': criadoEm.toIso8601String(),
      'atualizado_em': atualizadoEm.toIso8601String(),
    };
  }

  factory AgendamentoModel.fromMap(Map<String, dynamic> map) {
    return AgendamentoModel(
      id: map['id'] as String,
      clienteId: map['cliente_id'] as String,
      veiculoId: map['veiculo_id'] as String?,
      tipoServicoId: map['tipo_servico_id'] as String?,
      inicio: DateTime.parse(map['inicio'] as String),
      termino: DateTime.parse(map['termino'] as String),
      observacoes: map['observacoes'] as String?,
      situacao: map['situacao'] as String? ?? 'agendado',
      syncSituacao: map['sync_situacao'] as String? ?? 'pendente',
      googleEventId: map['google_event_id'] as String?,
      criadoEm: DateTime.parse(map['criado_em'] as String),
      atualizadoEm: DateTime.parse(map['atualizado_em'] as String),
    );
  }

  AgendamentoModel copyWith({
    String? clienteId,
    String? veiculoId,
    String? tipoServicoId,
    DateTime? inicio,
    DateTime? termino,
    String? observacoes,
    String? situacao,
    String? syncSituacao,
    String? googleEventId,
    DateTime? atualizadoEm,
  }) {
    return AgendamentoModel(
      id: id,
      clienteId: clienteId ?? this.clienteId,
      veiculoId: veiculoId ?? this.veiculoId,
      tipoServicoId: tipoServicoId ?? this.tipoServicoId,
      inicio: inicio ?? this.inicio,
      termino: termino ?? this.termino,
      observacoes: observacoes ?? this.observacoes,
      situacao: situacao ?? this.situacao,
      syncSituacao: syncSituacao ?? this.syncSituacao,
      googleEventId: googleEventId ?? this.googleEventId,
      criadoEm: criadoEm,
      atualizadoEm: atualizadoEm ?? DateTime.now(),
    );
  }
}
`,
  },

  // ==========================================
  // 13. MODELO DA FILA DE SYNC (sync_queue_model.dart)
  // ==========================================
  {
    path: 'lib/models/sync_queue_model.dart',
    name: 'sync_queue_model.dart',
    category: 'model',
    description: 'Item da fila de sincronização idempotente (sync_queue)',
    code: `import 'package:uuid/uuid.dart';

/// Item da fila de sincronização (sync_queue).
/// Regra 7: Garante idempotência e re-tentativa caso a internet caia.
class SyncQueueModel {
  final String id;
  final String agendamentoId;
  final String acao; // 'insert', 'update', 'delete'
  final int tentativas;
  final String? ultimoErro;
  final DateTime criadoEm;

  SyncQueueModel({
    String? id,
    required this.agendamentoId,
    required this.acao,
    this.tentativas = 0,
    this.ultimoErro,
    DateTime? criadoEm,
  })  : id = id ?? const Uuid().v4(),
        criadoEm = criadoEm ?? DateTime.now();

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'agendamento_id': agendamentoId,
      'acao': acao,
      'tentativas': tentativas,
      'ultimo_erro': ultimoErro,
      'criado_em': criadoEm.toIso8601String(),
    };
  }

  factory SyncQueueModel.fromMap(Map<String, dynamic> map) {
    return SyncQueueModel(
      id: map['id'] as String,
      agendamentoId: map['agendamento_id'] as String,
      acao: map['acao'] as String,
      tentativas: map['tentativas'] as int? ?? 0,
      ultimoErro: map['ultimo_erro'] as String?,
      criadoEm: DateTime.parse(map['criado_em'] as String),
    );
  }
}
`,
  },

  // ==========================================
  // 14. CONSTANTES GERAIS DO APP (constants.dart)
  // ==========================================
  {
    path: 'lib/app/constants.dart',
    name: 'constants.dart',
    category: 'app',
    description: 'Constantes de negócio, marcação #Dsc e nome da Google Agenda',
    code: `/// Constantes de negócio da empresa Schmitt Detailer
class AppConstants {
  static const String appName = 'Schmitt Detailer';
  static const String appPackage = 'com.schmitt.agenda_clientes';

  // Regra 7: Marcação obrigatória nos eventos da Google Agenda
  static const String googleCalendarTag = '#Dsc';
  static const String googleCalendarTargetName = 'Agenda de Clientes';

  // Escopo mínimo estrito do Google Calendar OAuth 2.0
  static const String googleCalendarScope = 'https://www.googleapis.com/auth/calendar.events';

  // Notificações diárias locais (Regra 8)
  static const int notificationDailyHour = 7;
  static const int notificationDailyMinute = 0;
  static const String notificationChannelId = 'schmitt_agenda_channel';
  static const String notificationChannelName = 'Agenda Schmitt Detailer';
  static const String notificationChannelDesc = 'Lembretes e compromissos diários da oficina';
}
`,
  },

  // ==========================================
  // 15. TEMA VISUAL MATERIAL 3 (theme.dart)
  // ==========================================
  {
    path: 'lib/app/theme.dart',
    name: 'theme.dart',
    category: 'app',
    description: 'Design System Material 3 escuro automotivo (#0D0D11, vermelho #E50914)',
    code: `import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Tema Escuro Automotivo Premium (Material 3)
class AppTheme {
  static const Color primaryRed = Color(0xFFE50914);
  static const Color darkRed = Color(0xFFB3060F);
  static const Color background = Color(0xFF0D0D11);
  static const Color cardBg = Color(0xFF16161B);
  static const Color surface = Color(0xFF1F1F26);
  static const Color border = Color(0xFF282832);
  static const Color textLight = Color(0xFFF4F4F6);
  static const Color textMuted = Color(0xFF9E9EA8);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.dark(
        primary: primaryRed,
        onPrimary: Colors.white,
        secondary: Color(0xFFFFA726),
        surface: cardBg,
        onSurface: textLight,
        error: Color(0xFFCF6679),
      ),
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        ThemeData.dark().textTheme,
      ).apply(
        bodyColor: textLight,
        displayColor: textLight,
      ),
      cardTheme: CardTheme(
        color: cardBg,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border, width: 1),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: textLight,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        iconTheme: IconThemeData(color: textLight),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryRed,
          foregroundColor: Colors.white,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF131317),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryRed, width: 1.5),
        ),
        labelStyle: const TextStyle(color: textMuted, fontSize: 13),
        hintStyle: const TextStyle(color: Color(0xFF6E6E78), fontSize: 13),
      ),
    );
  }
}
`,
  },

  // ==========================================
  // 16. BASE REPOSITORY (base_repository.dart)
  // ==========================================
  {
    path: 'lib/repositories/base_repository.dart',
    name: 'base_repository.dart',
    category: 'repository',
    description: 'Contrato base para repositórios SQLite locais',
    code: `import '../database/database_helper.dart';

/// Interface base para repositórios com acesso seguro ao DatabaseHelper
abstract class BaseRepository {
  final DatabaseHelper dbHelper = DatabaseHelper.instance;
}
`,
  },

  // ==========================================
  // 17. REPOSITÓRIO DE CLIENTES BASE (cliente_repository.dart)
  // ==========================================
  {
    path: 'lib/repositories/cliente_repository.dart',
    name: 'cliente_repository.dart',
    category: 'repository',
    description: 'Repositório de clientes com busca offline, duplicidade e exclusão lógica',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/cliente_model.dart';
import 'base_repository.dart';

/// Repositório de acesso e manipulação de clientes no SQLite local.
class ClienteRepository extends BaseRepository {
  /// Insere um novo cliente
  Future<int> inserir(ClienteModel cliente) async {
    final db = await dbHelper.database;
    return await db.insert(
      DatabaseConstants.tableClientes,
      cliente.toMap(),
      conflictAlgorithm: ConflictAlgorithm.fail,
    );
  }

  /// Atualiza cliente existente
  Future<int> atualizar(ClienteModel cliente) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableClientes,
      cliente.toMap(),
      where: '\${DatabaseConstants.colClienteId} = ?',
      whereArgs: [cliente.id],
    );
  }

  /// Exclusão lógica: nunca apaga de verdade no SQLite
  Future<int> excluirLogico(String id) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableClientes,
      {
        DatabaseConstants.colClienteExcluidoEm: DateTime.now().toIso8601String(),
        DatabaseConstants.colClienteAtualizadoEm: DateTime.now().toIso8601String(),
      },
      where: '\${DatabaseConstants.colClienteId} = ?',
      whereArgs: [id],
    );
  }

  /// Busca cliente por ID
  Future<ClienteModel?> buscarPorId(String id) async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableClientes,
      where: '\${DatabaseConstants.colClienteId} = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (res.isEmpty) return null;
    return ClienteModel.fromMap(res.first);
  }

  /// Lista todos os clientes ativos (não excluídos)
  Future<List<ClienteModel>> listarAtivos() async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableClientes,
      where: '\${DatabaseConstants.colClienteExcluidoEm} IS NULL',
      orderBy: '\${DatabaseConstants.colClienteNomeCompleto} ASC',
    );
    return res.map((m) => ClienteModel.fromMap(m)).toList();
  }

  /// Pesquisa offline por nome ou telefone
  Future<List<ClienteModel>> pesquisar(String termo) async {
    final db = await dbHelper.database;
    final queryTerm = '%\$termo%';
    final digitsTerm = '%'+termo.replaceAll(RegExp(r'[^0-9]'), '')+'%';

    final res = await db.query(
      DatabaseConstants.tableClientes,
      where: '(\${DatabaseConstants.colClienteNomeCompleto} LIKE ? OR \${DatabaseConstants.colClienteCelular} LIKE ?) AND \${DatabaseConstants.colClienteExcluidoEm} IS NULL',
      whereArgs: [queryTerm, digitsTerm],
      orderBy: '\${DatabaseConstants.colClienteNomeCompleto} ASC',
    );
    return res.map((m) => ClienteModel.fromMap(m)).toList();
  }

  /// Verifica duplicidade de cliente por nome ou celular
  Future<List<ClienteModel>> verificarPossivelDuplicidade({
    required String nome,
    required String celular,
    String? ignorarId,
  }) async {
    final db = await dbHelper.database;
    final cleanPhone = celular.replaceAll(RegExp(r'[^0-9]'), '');

    String where = '(\${DatabaseConstants.colClienteNomeCompleto} LIKE ? OR \${DatabaseConstants.colClienteCelular} = ?) AND \${DatabaseConstants.colClienteExcluidoEm} IS NULL';
    List<dynamic> args = ['%\$nome%', cleanPhone];

    if (ignorarId != null) {
      where += ' AND \${DatabaseConstants.colClienteId} != ?';
      args.add(ignorarId);
    }

    final res = await db.query(
      DatabaseConstants.tableClientes,
      where: where,
      whereArgs: args,
    );
    return res.map((m) => ClienteModel.fromMap(m)).toList();
  }
}
`,
  },

  // ==========================================
  // 18. TELA HOME DE DIAGNÓSTICO (home_screen.dart)
  // ==========================================
  {
    path: 'lib/screens/home_screen.dart',
    name: 'home_screen.dart',
    category: 'ui',
    description: 'Tela inicial da Etapa 1 exibindo diagnóstico SQLite e tabelas criadas',
    code: `import 'package:flutter/material.dart';
import '../database/database_helper.dart';
import '../database/database_constants.dart';
import '../app/theme.dart';

/// Tela inicial da Etapa 1: Estrutura e Banco de Dados.
/// Apresenta o status em tempo real do banco SQLite, Foreign Keys e tabelas criadas.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<Map<String, dynamic>> _integrityFuture;

  @override
  void initState() {
    super.initState();
    _recarregarStatus();
  }

  void _recarregarStatus() {
    setState(() {
      _integrityFuture = DatabaseHelper.instance.checkDatabaseIntegrity();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Schmitt Detailer • Etapa 1'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _recarregarStatus,
            tooltip: 'Atualizar Verificação',
          ),
        ],
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _integrityFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed));
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 12),
                    Text(
                      'Erro ao abrir banco SQLite: \${snapshot.error}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.redAccent),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _recarregarStatus,
                      child: const Text('Tentar Novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          final data = snapshot.data ?? {};
          final fkEnabled = data['foreign_keys_enabled'] as bool? ?? false;
          final version = data['database_version'] as int? ?? 1;
          final tables = (data['tables_count'] as Map<String, int>?) ?? {};

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header do App
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primaryRed.withOpacity(0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryRed.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.storage, color: AppTheme.primaryRed),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Estrutura & Banco SQLite',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'Etapa 1 Concluída • 100% Offline-First',
                                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(color: AppTheme.border),
                    const SizedBox(height: 8),
                    _buildInfoRow('Arquivo:', DatabaseConstants.databaseName),
                    _buildInfoRow('Versão do Schema:', 'v\$version'),
                    _buildInfoRow(
                      'Chaves Estrangeiras (PRAGMA):',
                      fkEnabled ? 'ATIVAS (ON)' : 'INATIVAS',
                      isSuccess: fkEnabled,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              const Text(
                'Tabelas Criadas com Integridade Referencial:',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textLight),
              ),
              const SizedBox(height: 10),

              // Lista das 9 Tabelas
              ...tables.entries.map((entry) {
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    dense: true,
                    leading: const Icon(Icons.table_chart_outlined, color: AppTheme.textMuted, size: 20),
                    title: Text(
                      entry.key,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Text(
                        '\${entry.value} registros',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF131318),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 20),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Pronto para a Etapa 2: Telas de Cadastro, Edição e Busca de Clientes.',
                        style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool? isSuccess}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.between,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
          Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isSuccess == null
                  ? AppTheme.textLight
                  : (isSuccess ? Colors.green : Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}
`,
  },

  // ==========================================
  // 19. APLICAÇÃO FLUTTER (app.dart)
  // ==========================================
  {
    path: 'lib/app/app.dart',
    name: 'app.dart',
    category: 'app',
    description: 'MaterialApp com suporte a português do Brasil e navegação principal',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'theme.dart';
import 'constants.dart';
import '../screens/main_navigation_screen.dart';

/// MaterialApp configurado com tema automotivo escuro e localização pt_BR
class SchmittDetailerApp extends StatelessWidget {
  const SchmittDetailerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('pt', 'BR'),
      ],
      home: const MainNavigationScreen(),
    );
  }
}
`,
  },

  // ==========================================
  // 20. ENTRYPOINT PRINCIPAL (main.dart)
  // ==========================================
  {
    path: 'lib/main.dart',
    name: 'main.dart',
    category: 'app',
    description: 'Inicialização de dependências, SQLite, notificações e injeção de Providers',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'database/database_helper.dart';
import 'repositories/cliente_repository.dart';
import 'repositories/veiculo_repository.dart';
import 'repositories/produto_repository.dart';
import 'repositories/tipo_servico_repository.dart';
import 'repositories/historico_servico_repository.dart';
import 'repositories/agendamento_repository.dart';
import 'repositories/financeiro_repository.dart';
import 'services/notification_service.dart';
import 'services/auth_service.dart';
import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Configura barra de navegação e status para tema escuro
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0D0D11),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Inicializa o banco de dados SQLite local garantindo PRAGMA foreign_keys = ON
  debugPrint('[Main] Inicializando banco SQLite Schmitt Detailer...');
  await DatabaseHelper.instance.database;

  // Inicializa o serviço de notificações locais
  try {
    await NotificationService.instance.inicializar();
  } catch (e) {
    debugPrint('[Main] Erro ao inicializar notificações: \$e');
  }

  // Tenta autenticação silenciosa caso já haja sessão do Google
  try {
    AuthService.instance.signInSilently();
  } catch (_) {}

  runApp(
    MultiProvider(
      providers: [
        Provider<ClienteRepository>(create: (_) => ClienteRepository()),
        Provider<VeiculoRepository>(create: (_) => VeiculoRepository()),
        Provider<ProdutoRepository>(create: (_) => ProdutoRepository()),
        Provider<TipoServicoRepository>(create: (_) => TipoServicoRepository()),
        Provider<HistoricoServicoRepository>(create: (_) => HistoricoServicoRepository()),
        Provider<AgendamentoRepository>(create: (_) => AgendamentoRepository()),
        Provider<FinanceiroRepository>(create: (_) => FinanceiroRepository()),
      ],
      child: const SchmittDetailerApp(),
    ),
  );
}
`,
  },
];

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  ...BASE_PROJECT_FILES,
  ...REPOSITORY_FILES,
  ...SERVICE_FILES,
  ...WIDGET_FILES,
  ...SCREEN_FILES,
];

