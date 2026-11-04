import { FlutterFile } from './types';

export const REPOSITORY_FILES: FlutterFile[] = [
  // 1. VeiculoRepository
  {
    path: 'lib/repositories/veiculo_repository.dart',
    name: 'veiculo_repository.dart',
    category: 'repository',
    description: 'Repositório de veículos com filtro por cliente, placa e exclusão lógica',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/veiculo_model.dart';
import 'base_repository.dart';

class VeiculoRepository extends BaseRepository {
  Future<int> inserir(VeiculoModel veiculo) async {
    final db = await dbHelper.database;
    return await db.insert(
      DatabaseConstants.tableVeiculos,
      veiculo.toMap(),
      conflictAlgorithm: ConflictAlgorithm.fail,
    );
  }

  Future<int> atualizar(VeiculoModel veiculo) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableVeiculos,
      veiculo.toMap(),
      where: '\${DatabaseConstants.colVeiculoId} = ?',
      whereArgs: [veiculo.id],
    );
  }

  Future<int> excluirLogico(String id) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableVeiculos,
      {
        DatabaseConstants.colVeiculoExcluidoEm: DateTime.now().toIso8601String(),
        DatabaseConstants.colVeiculoAtualizadoEm: DateTime.now().toIso8601String(),
      },
      where: '\${DatabaseConstants.colVeiculoId} = ?',
      whereArgs: [id],
    );
  }

  Future<List<VeiculoModel>> listarPorCliente(String clienteId) async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableVeiculos,
      where: '\${DatabaseConstants.colVeiculoClienteId} = ? AND \${DatabaseConstants.colVeiculoExcluidoEm} IS NULL',
      whereArgs: [clienteId],
      orderBy: '\${DatabaseConstants.colVeiculoModelo} ASC',
    );
    return res.map((m) => VeiculoModel.fromMap(m)).toList();
  }

  Future<VeiculoModel?> buscarPorId(String id) async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableVeiculos,
      where: '\${DatabaseConstants.colVeiculoId} = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (res.isEmpty) return null;
    return VeiculoModel.fromMap(res.first);
  }
}
`,
  },

  // 2. ProdutoRepository
  {
    path: 'lib/repositories/produto_repository.dart',
    name: 'produto_repository.dart',
    category: 'repository',
    description: 'Repositório de produtos e insumos com cálculo de custo unitário e desativação',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/produto_model.dart';
import 'base_repository.dart';

class ProdutoRepository extends BaseRepository {
  Future<int> inserir(ProdutoModel produto) async {
    final db = await dbHelper.database;
    return await db.insert(
      DatabaseConstants.tableProdutos,
      produto.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<int> atualizar(ProdutoModel produto) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableProdutos,
      produto.toMap(),
      where: '\${DatabaseConstants.colProdutoId} = ?',
      whereArgs: [produto.id],
    );
  }

  Future<int> alternarStatusAtivo(String id, bool ativo) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableProdutos,
      {
        DatabaseConstants.colProdutoAtivo: ativo ? 1 : 0,
        DatabaseConstants.colProdutoAtualizadoEm: DateTime.now().toIso8601String(),
      },
      where: '\${DatabaseConstants.colProdutoId} = ?',
      whereArgs: [id],
    );
  }

  Future<List<ProdutoModel>> listarTodos({bool apenasAtivos = false}) async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableProdutos,
      where: apenasAtivos ? '\${DatabaseConstants.colProdutoAtivo} = 1' : null,
      orderBy: '\${DatabaseConstants.colProdutoNome} ASC',
    );
    return res.map((m) => ProdutoModel.fromMap(m)).toList();
  }

  Future<ProdutoModel?> buscarPorId(String id) async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableProdutos,
      where: '\${DatabaseConstants.colProdutoId} = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (res.isEmpty) return null;
    return ProdutoModel.fromMap(res.first);
  }

  Future<int> excluir(String id) async {
    final db = await dbHelper.database;
    return await db.delete(
      DatabaseConstants.tableProdutos,
      where: '\${DatabaseConstants.colProdutoId} = ?',
      whereArgs: [id],
    );
  }
}
`,
  },

  // 3. TipoServicoRepository (Combos com relação N:N de produtos)
  {
    path: 'lib/repositories/tipo_servico_repository.dart',
    name: 'tipo_servico_repository.dart',
    category: 'repository',
    description: 'Repositório de combos de serviço com lista de insumos e custo estimado',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/tipo_servico_model.dart';
import '../models/tipo_servico_produto_model.dart';
import '../models/produto_model.dart';
import 'base_repository.dart';

class TipoServicoRepository extends BaseRepository {
  Future<void> salvarCombo(TipoServicoModel combo, List<TipoServicoProdutoModel> produtosDoCombo) async {
    final db = await dbHelper.database;
    await db.transaction((txn) async {
      // 1. Salva ou atualiza o tipo de serviço
      await txn.insert(
        DatabaseConstants.tableTiposServico,
        combo.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      // 2. Remove produtos antigos do combo
      await txn.delete(
        DatabaseConstants.tableTipoServicoProdutos,
        where: '\${DatabaseConstants.colComboTipoServicoId} = ?',
        whereArgs: [combo.id],
      );

      // 3. Insere os novos produtos do combo
      for (final item in produtosDoCombo) {
        await txn.insert(
          DatabaseConstants.tableTipoServicoProdutos,
          item.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    });
  }

  Future<List<TipoServicoModel>> listarTodos({bool apenasAtivos = false}) async {
    final db = await dbHelper.database;
    final resServicos = await db.query(
      DatabaseConstants.tableTiposServico,
      where: apenasAtivos ? '\${DatabaseConstants.colTipoServicoAtivo} = 1' : null,
      orderBy: '\${DatabaseConstants.colTipoServicoNome} ASC',
    );

    final List<TipoServicoModel> lista = [];
    for (final map in resServicos) {
      final servicoId = map[DatabaseConstants.colTipoServicoId] as String;
      
      // Carrega produtos deste combo com join nos produtos para pegar custo unitário
      final resComboProd = await db.rawQuery('''
        SELECT cp.*, p.\${DatabaseConstants.colProdutoNome}, p.\${DatabaseConstants.colProdutoUnidade},
               p.\${DatabaseConstants.colProdutoPrecoEmbalagem}, p.\${DatabaseConstants.colProdutoQuantidadeEmbalagem},
               p.\${DatabaseConstants.colProdutoCustoUnitario}, p.\${DatabaseConstants.colProdutoAtivo},
               p.\${DatabaseConstants.colProdutoCriadoEm}, p.\${DatabaseConstants.colProdutoAtualizadoEm}
        FROM \${DatabaseConstants.tableTipoServicoProdutos} cp
        INNER JOIN \${DatabaseConstants.tableProdutos} p ON cp.\${DatabaseConstants.colComboProdutoId} = p.\${DatabaseConstants.colProdutoId}
        WHERE cp.\${DatabaseConstants.colComboTipoServicoId} = ?
      ''', [servicoId]);

      final produtos = resComboProd.map((r) {
        final prod = ProdutoModel(
          id: r[DatabaseConstants.colComboProdutoId] as String,
          nome: r[DatabaseConstants.colProdutoNome] as String,
          unidade: r[DatabaseConstants.colProdutoUnidade] as String,
          precoEmbalagem: (r[DatabaseConstants.colProdutoPrecoEmbalagem] as num).toDouble(),
          quantidadeEmbalagem: (r[DatabaseConstants.colProdutoQuantidadeEmbalagem] as num).toDouble(),
          custoUnitario: (r[DatabaseConstants.colProdutoCustoUnitario] as num).toDouble(),
          ativo: (r[DatabaseConstants.colProdutoAtivo] as int) == 1,
        );
        return TipoServicoProdutoModel.fromMap(r, produto: prod);
      }).toList();

      lista.add(TipoServicoModel.fromMap(map, produtos: produtos));
    }
    return lista;
  }

  Future<TipoServicoModel?> buscarPorId(String id) async {
    final lista = await listarTodos();
    try {
      return lista.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  Future<int> alternarStatusAtivo(String id, bool ativo) async {
    final db = await dbHelper.database;
    return await db.update(
      DatabaseConstants.tableTiposServico,
      {
        DatabaseConstants.colTipoServicoAtivo: ativo ? 1 : 0,
        DatabaseConstants.colTipoServicoAtualizadoEm: DateTime.now().toIso8601String(),
      },
      where: '\${DatabaseConstants.colTipoServicoId} = ?',
      whereArgs: [id],
    );
  }

  Future<void> excluir(String id) async {
    final db = await dbHelper.database;
    await db.transaction((txn) async {
      await txn.delete(
        DatabaseConstants.tableTipoServicoProdutos,
        where: '\${DatabaseConstants.colComboTipoServicoId} = ?',
        whereArgs: [id],
      );
      await txn.delete(
        DatabaseConstants.tableTiposServico,
        where: '\${DatabaseConstants.colTipoServicoId} = ?',
        whereArgs: [id],
      );
    });
  }
}
`,
  },

  // 4. HistoricoServicoRepository (com cópia imutável dos custos)
  {
    path: 'lib/repositories/historico_servico_repository.dart',
    name: 'historico_servico_repository.dart',
    category: 'repository',
    description: 'Repositório de histórico com gravação estática e congelada dos custos',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/historico_servico_model.dart';
import 'base_repository.dart';

class HistoricoServicoRepository extends BaseRepository {
  /// Grava o serviço registrando a cópia fiel dos custos naquele momento
  Future<int> registrarServico(HistoricoServicoModel historico) async {
    final db = await dbHelper.database;
    return await db.insert(
      DatabaseConstants.tableHistoricoServicos,
      historico.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Lista histórico por cliente em ordem cronológica decrescente
  Future<List<HistoricoServicoModel>> listarPorCliente(String clienteId) async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableHistoricoServicos,
      where: '\${DatabaseConstants.colHistClienteId} = ?',
      whereArgs: [clienteId],
      orderBy: '\${DatabaseConstants.colHistData} DESC',
    );
    return res.map((m) => HistoricoServicoModel.fromMap(m)).toList();
  }

  /// Lista todo o histórico para relatórios
  Future<List<HistoricoServicoModel>> listarTodos() async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableHistoricoServicos,
      orderBy: '\${DatabaseConstants.colHistData} DESC',
    );
    return res.map((m) => HistoricoServicoModel.fromMap(m)).toList();
  }
}
`,
  },

  // 5. AgendamentoRepository
  {
    path: 'lib/repositories/agendamento_repository.dart',
    name: 'agendamento_repository.dart',
    category: 'repository',
    description: 'Repositório de agendamentos com verificação de conflitos e sync_queue automática',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/agendamento_model.dart';
import '../models/sync_queue_model.dart';
import 'base_repository.dart';

class AgendamentoRepository extends BaseRepository {
  /// Cria agendamento localmente e já enfileira na sync_queue
  Future<void> criar(AgendamentoModel agendamento) async {
    final db = await dbHelper.database;
    await db.transaction((txn) async {
      await txn.insert(
        DatabaseConstants.tableAgendamentos,
        agendamento.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      final queueItem = SyncQueueModel(
        agendamentoId: agendamento.id,
        acao: 'insert',
      );
      await txn.insert(
        DatabaseConstants.tableSyncQueue,
        queueItem.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    });
  }

  /// Atualiza agendamento e enfileira 'update'
  Future<void> atualizar(AgendamentoModel agendamento) async {
    final db = await dbHelper.database;
    await db.transaction((txn) async {
      await txn.update(
        DatabaseConstants.tableAgendamentos,
        agendamento.copyWith(syncSituacao: 'pendente').toMap(),
        where: '\${DatabaseConstants.colAgendamentoId} = ?',
        whereArgs: [agendamento.id],
      );

      final queueItem = SyncQueueModel(
        agendamentoId: agendamento.id,
        acao: 'update',
      );
      await txn.insert(
        DatabaseConstants.tableSyncQueue,
        queueItem.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    });
  }

  /// Cancela agendamento e enfileira 'delete'
  Future<void> cancelar(String id) async {
    final db = await dbHelper.database;
    await db.transaction((txn) async {
      await txn.update(
        DatabaseConstants.tableAgendamentos,
        {
          DatabaseConstants.colAgendamentoSituacao: 'cancelado',
          DatabaseConstants.colAgendamentoSyncSituacao: 'pendente',
          DatabaseConstants.colAgendamentoAtualizadoEm: DateTime.now().toIso8601String(),
        },
        where: '\${DatabaseConstants.colAgendamentoId} = ?',
        whereArgs: [id],
      );

      final queueItem = SyncQueueModel(
        agendamentoId: id,
        acao: 'delete',
      );
      await txn.insert(
        DatabaseConstants.tableSyncQueue,
        queueItem.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace,
      );
    });
  }

  /// Lista agendamentos de um dia específico
  Future<List<AgendamentoModel>> listarDoDia(DateTime data) async {
    final db = await dbHelper.database;
    final startOfDay = DateTime(data.year, data.month, data.day, 0, 0, 0).toIso8601String();
    final endOfDay = DateTime(data.year, data.month, data.day, 23, 59, 59).toIso8601String();

    final res = await db.query(
      DatabaseConstants.tableAgendamentos,
      where: '\${DatabaseConstants.colAgendamentoInicio} >= ? AND \${DatabaseConstants.colAgendamentoInicio} <= ? AND \${DatabaseConstants.colAgendamentoSituacao} != ?',
      whereArgs: [startOfDay, endOfDay, 'cancelado'],
      orderBy: '\${DatabaseConstants.colAgendamentoInicio} ASC',
    );
    return res.map((m) => AgendamentoModel.fromMap(m)).toList();
  }

  /// Checa se há conflito de horário (sobreposição) com outro agendamento ativo
  Future<List<AgendamentoModel>> verificarConflitoHorario({
    required DateTime inicio,
    required DateTime termino,
    String? ignorarId,
  }) async {
    final db = await dbHelper.database;
    final inicioStr = inicio.toIso8601String();
    final terminoStr = termino.toIso8601String();

    String where = '''
      \${DatabaseConstants.colAgendamentoSituacao} != 'cancelado'
      AND \${DatabaseConstants.colAgendamentoInicio} < ?
      AND \${DatabaseConstants.colAgendamentoTermino} > ?
    ''';
    List<dynamic> args = [terminoStr, inicioStr];

    if (ignorarId != null) {
      where += ' AND \${DatabaseConstants.colAgendamentoId} != ?';
      args.add(ignorarId);
    }

    final res = await db.query(
      DatabaseConstants.tableAgendamentos,
      where: where,
      whereArgs: args,
    );
    return res.map((m) => AgendamentoModel.fromMap(m)).toList();
  }

  /// Atualiza confirmação de sincronização pelo Google Calendar
  Future<void> confirmarSincronizacao(String agendamentoId, String googleEventId) async {
    final db = await dbHelper.database;
    await db.update(
      DatabaseConstants.tableAgendamentos,
      {
        DatabaseConstants.colAgendamentoSyncSituacao: 'sincronizado',
        DatabaseConstants.colAgendamentoGoogleEventId: googleEventId,
        DatabaseConstants.colAgendamentoAtualizadoEm: DateTime.now().toIso8601String(),
      },
      where: '\${DatabaseConstants.colAgendamentoId} = ?',
      whereArgs: [agendamentoId],
    );
  }
}
`,
  },

  // 6. SyncQueueRepository
  {
    path: 'lib/repositories/sync_queue_repository.dart',
    name: 'sync_queue_repository.dart',
    category: 'repository',
    description: 'Repositório da fila de sincronização idempotente',
    code: `import 'package:sqflite/sqflite.dart';
import '../database/database_constants.dart';
import '../models/sync_queue_model.dart';
import 'base_repository.dart';

class SyncQueueRepository extends BaseRepository {
  Future<List<SyncQueueModel>> listarPendentes() async {
    final db = await dbHelper.database;
    final res = await db.query(
      DatabaseConstants.tableSyncQueue,
      orderBy: '\${DatabaseConstants.colSyncCriadoEm} ASC',
    );
    return res.map((m) => SyncQueueModel.fromMap(m)).toList();
  }

  Future<int> remover(String id) async {
    final db = await dbHelper.database;
    return await db.delete(
      DatabaseConstants.tableSyncQueue,
      where: '\${DatabaseConstants.colSyncId} = ?',
      whereArgs: [id],
    );
  }

  Future<int> registrarFalha(String id, String erro) async {
    final db = await dbHelper.database;
    return await db.rawUpdate('''
      UPDATE \${DatabaseConstants.tableSyncQueue}
      SET \${DatabaseConstants.colSyncTentativas} = \${DatabaseConstants.colSyncTentativas} + 1,
          \${DatabaseConstants.colSyncUltimoErro} = ?
      WHERE \${DatabaseConstants.colSyncId} = ?
    ''', [erro, id]);
  }
}
`,
  },

  // 7. FinanceiroRepository
  {
    path: 'lib/repositories/financeiro_repository.dart',
    name: 'financeiro_repository.dart',
    category: 'repository',
    description: 'Cálculo de ganhos, custos e lucro por período e tipo de serviço',
    code: `import '../database/database_constants.dart';
import 'base_repository.dart';

class ResumoFinanceiroItem {
  final String tipoServicoNome;
  final int quantidade;
  final double totalCobrado;
  final double totalCusto;
  final double lucro;

  ResumoFinanceiroItem({
    required this.tipoServicoNome,
    required this.quantidade,
    required this.totalCobrado,
    required this.totalCusto,
    required this.lucro,
  });
}

class FinanceiroRepository extends BaseRepository {
  Future<Map<String, dynamic>> obterResumoPorPeriodo({
    required DateTime inicio,
    required DateTime fim,
  }) async {
    final db = await dbHelper.database;
    final inicioStr = DateTime(inicio.year, inicio.month, inicio.day, 0, 0, 0).toIso8601String();
    final fimStr = DateTime(fim.year, fim.month, fim.day, 23, 59, 59).toIso8601String();

    // 1. Totais Gerais
    final resTotal = await db.rawQuery('''
      SELECT 
        COUNT(*) as total_atendimentos,
        COALESCE(SUM(\${DatabaseConstants.colHistValorCobrado}), 0) as total_cobrado,
        COALESCE(SUM(\${DatabaseConstants.colHistCustoProdutos}), 0) as total_custo
      FROM \${DatabaseConstants.tableHistoricoServicos}
      WHERE \${DatabaseConstants.colHistData} >= ? AND \${DatabaseConstants.colHistData} <= ?
        AND \${DatabaseConstants.colHistSituacao} = 'concluido'
    ''', [inicioStr, fimStr]);

    final totalCobrado = (resTotal.first['total_cobrado'] as num).toDouble();
    final totalCusto = (resTotal.first['total_custo'] as num).toDouble();
    final lucro = totalCobrado - totalCusto;
    final count = resTotal.first['total_atendimentos'] as int;

    // 2. Detalhamento por Tipo de Serviço
    final resDetalhes = await db.rawQuery('''
      SELECT 
        COALESCE(ts.\${DatabaseConstants.colTipoServicoNome}, h.\${DatabaseConstants.colHistDescricao}) as nome_servico,
        COUNT(*) as qtd,
        SUM(h.\${DatabaseConstants.colHistValorCobrado}) as cobrado,
        SUM(h.\${DatabaseConstants.colHistCustoProdutos}) as custo
      FROM \${DatabaseConstants.tableHistoricoServicos} h
      LEFT JOIN \${DatabaseConstants.tableTiposServico} ts ON h.\${DatabaseConstants.colHistTipoServicoId} = ts.\${DatabaseConstants.colTipoServicoId}
      WHERE h.\${DatabaseConstants.colHistData} >= ? AND h.\${DatabaseConstants.colHistData} <= ?
        AND h.\${DatabaseConstants.colHistSituacao} = 'concluido'
      GROUP BY nome_servico
      ORDER BY cobrado DESC
    ''', [inicioStr, fimStr]);

    final List<ResumoFinanceiroItem> itens = resDetalhes.map((r) {
      final cob = (r['cobrado'] as num).toDouble();
      final cus = (r['custo'] as num).toDouble();
      return ResumoFinanceiroItem(
        tipoServicoNome: r['nome_servico'] as String? ?? 'Serviço Personalizado',
        quantidade: r['qtd'] as int,
        totalCobrado: cob,
        totalCusto: cus,
        lucro: cob - cus,
      );
    }).toList();

    return {
      'total_atendimentos': count,
      'total_cobrado': totalCobrado,
      'total_custo': totalCusto,
      'lucro_real': lucro,
      'itens': itens,
    };
  }
}
`,
  },
];
