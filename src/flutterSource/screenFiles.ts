import { FlutterFile } from './types';

export const SCREEN_FILES: FlutterFile[] = [
  // 1. ClientesListScreen
  {
    path: 'lib/screens/clientes/clientes_list_screen.dart',
    name: 'clientes_list_screen.dart',
    category: 'ui',
    description: 'Tela de listagem e pesquisa offline de clientes por nome ou telefone',
    code: `import 'package:flutter/material.dart';
import '../../models/cliente_model.dart';
import '../../repositories/cliente_repository.dart';
import '../../app/theme.dart';
import 'cliente_form_screen.dart';
import 'cliente_details_screen.dart';

class ClientesListScreen extends StatefulWidget {
  const ClientesListScreen({super.key});

  @override
  State<ClientesListScreen> createState() => _ClientesListScreenState();
}

class _ClientesListScreenState extends State<ClientesListScreen> {
  final _repository = ClienteRepository();
  final _searchController = TextEditingController();
  List<ClienteModel> _clientes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _carregarClientes();
  }

  Future<void> _carregarClientes() async {
    setState(() => _isLoading = true);
    final termo = _searchController.text.trim();
    final list = termo.isEmpty
        ? await _repository.listarAtivos()
        : await _repository.pesquisar(termo);
    setState(() {
      _clientes = list;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes • Schmitt Detailer'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              onChanged: (_) => _carregarClientes(),
              decoration: InputDecoration(
                hintText: 'Pesquisar por nome ou celular...',
                prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _carregarClientes();
                        },
                      )
                    : null,
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed))
                : _clientes.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.people_outline, size: 48, color: AppTheme.textMuted),
                            const SizedBox(height: 12),
                            Text(
                              _searchController.text.isEmpty
                                  ? 'Nenhum cliente cadastrado no momento.'
                                  : 'Nenhum cliente encontrado.',
                              style: const TextStyle(color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _clientes.length,
                        itemBuilder: (context, index) {
                          final c = _clientes[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              onTap: () async {
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => ClienteDetailsScreen(clienteId: c.id)),
                                );
                                _carregarClientes();
                              },
                              leading: CircleAvatar(
                                backgroundColor: AppTheme.primaryRed.withOpacity(0.2),
                                child: Text(
                                  c.nomeCompleto.substring(0, 1).toUpperCase(),
                                  style: const TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.bold),
                                ),
                              ),
                              title: Text(c.nomeCompleto, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(c.celular, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                              trailing: const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final atualizado = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ClienteFormScreen()),
          );
          if (atualizado == true) _carregarClientes();
        },
        backgroundColor: AppTheme.primaryRed,
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: const Text('Novo Cliente', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
`,
  },

  // 2. ClienteFormScreen (com alerta de duplicidade)
  {
    path: 'lib/screens/clientes/cliente_form_screen.dart',
    name: 'cliente_form_screen.dart',
    category: 'ui',
    description: 'Cadastro e edição de cliente com verificação de duplicidade e validações',
    code: `import 'package:flutter/material.dart';
import '../../models/cliente_model.dart';
import '../../repositories/cliente_repository.dart';
import '../../widgets/duplicidade_dialog.dart';
import '../../app/theme.dart';
import 'cliente_details_screen.dart';

class ClienteFormScreen extends StatefulWidget {
  final ClienteModel? clienteParaEditar;

  const ClienteFormScreen({super.key, this.clienteParaEditar});

  @override
  State<ClienteFormScreen> createState() => _ClienteFormScreenState();
}

class _ClienteFormScreenState extends State<ClienteFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _repository = ClienteRepository();

  late TextEditingController _nomeController;
  late TextEditingController _celularController;
  late TextEditingController _enderecoController;
  late TextEditingController _observacoesController;

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nomeController = TextEditingController(text: widget.clienteParaEditar?.nomeCompleto ?? '');
    _celularController = TextEditingController(text: widget.clienteParaEditar?.celular ?? '');
    _enderecoController = TextEditingController(text: widget.clienteParaEditar?.enderecoCompleto ?? '');
    _observacoesController = TextEditingController(text: widget.clienteParaEditar?.observacoes ?? '');
  }

  Future<void> _submeter() async {
    if (!_formKey.currentState!.validate()) return;

    final nome = _nomeController.text.trim();
    final celular = _celularController.text.trim();

    // Regra 1: Verificar duplicidade ao cadastrar
    if (widget.clienteParaEditar == null) {
      final duplicados = await _repository.verificarPossivelDuplicidade(
        nome: nome,
        celular: celular,
      );

      if (duplicados.isNotEmpty && mounted) {
        showDialog(
          context: context,
          builder: (ctx) => DuplicidadeDialog(
            duplicados: duplicados,
            onContinuarMesmoAssim: _salvarNoBanco,
            onAbrirExistente: (existente) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => ClienteDetailsScreen(clienteId: existente.id)),
              );
            },
          ),
        );
        return;
      }
    }

    _salvarNoBanco();
  }

  Future<void> _salvarNoBanco() async {
    setState(() => _isSaving = true);
    try {
      if (widget.clienteParaEditar == null) {
        final novo = ClienteModel(
          nomeCompleto: _nomeController.text,
          celular: _celularController.text,
          enderecoCompleto: _enderecoController.text.isEmpty ? null : _enderecoController.text,
          observacoes: _observacoesController.text.isEmpty ? null : _observacoesController.text,
        );
        await _repository.inserir(novo);
      } else {
        final editado = widget.clienteParaEditar!.copyWith(
          nomeCompleto: _nomeController.text,
          celular: _celularController.text,
          enderecoCompleto: _enderecoController.text,
          observacoes: _observacoesController.text,
        );
        await _repository.atualizar(editado);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao salvar: \$e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdicao = widget.clienteParaEditar != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEdicao ? 'Editar Cliente' : 'Novo Cliente'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nomeController,
              decoration: const InputDecoration(
                labelText: 'Nome Completo *',
                prefixIcon: Icon(Icons.person, color: AppTheme.textMuted),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o nome completo' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _celularController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Celular / WhatsApp *',
                prefixIcon: Icon(Icons.phone, color: AppTheme.textMuted),
                hintText: '(11) 98765-4321',
              ),
              validator: (v) => (v == null || v.trim().length < 8) ? 'Informe um telefone válido' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _enderecoController,
              decoration: const InputDecoration(
                labelText: 'Endereço Completo (usado no Google Agenda)',
                prefixIcon: Icon(Icons.location_on, color: AppTheme.textMuted),
                hintText: 'Rua, número, bairro, cidade',
              ),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _observacoesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Observações Gerais',
                prefixIcon: Icon(Icons.notes, color: AppTheme.textMuted),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSaving ? null : _submeter,
              child: _isSaving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(isEdicao ? 'Atualizar Dados' : 'Cadastrar Cliente'),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },

  // 3. ClienteDetailsScreen (Veículos, Histórico, Exclusão Lógica)
  {
    path: 'lib/screens/clientes/cliente_details_screen.dart',
    name: 'cliente_details_screen.dart',
    category: 'ui',
    description: 'Detalhes completos do cliente, múltiplos veículos, histórico de atendimentos e exclusão lógica',
    code: `import 'package:flutter/material.dart';
import '../../models/cliente_model.dart';
import '../../models/veiculo_model.dart';
import '../../models/historico_servico_model.dart';
import '../../repositories/cliente_repository.dart';
import '../../repositories/veiculo_repository.dart';
import '../../repositories/historico_servico_repository.dart';
import '../../app/theme.dart';
import '../veiculos/veiculo_form_screen.dart';
import '../historico/registrar_servico_screen.dart';
import 'cliente_form_screen.dart';
import 'package:intl/intl.dart';

class ClienteDetailsScreen extends StatefulWidget {
  final String clienteId;

  const ClienteDetailsScreen({super.key, required this.clienteId});

  @override
  State<ClienteDetailsScreen> createState() => _ClienteDetailsScreenState();
}

class _ClienteDetailsScreenState extends State<ClienteDetailsScreen> {
  final _clienteRepo = ClienteRepository();
  final _veiculoRepo = VeiculoRepository();
  final _historicoRepo = HistoricoServicoRepository();

  ClienteModel? _cliente;
  List<VeiculoModel> _veiculos = [];
  List<HistoricoServicoModel> _historico = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  Future<void> _carregarDados() async {
    setState(() => _isLoading = true);
    final c = await _clienteRepo.buscarPorId(widget.clienteId);
    final v = await _veiculoRepo.listarPorCliente(widget.clienteId);
    final h = await _historicoRepo.listarPorCliente(widget.clienteId);
    setState(() {
      _cliente = c;
      _veiculos = v;
      _historico = h;
      _isLoading = false;
    });
  }

  Future<void> _confirmarExclusaoLogica() async {
    final confirmou = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardBg,
        title: const Text('Excluir Cliente?'),
        content: const Text(
          'O cliente será desativado do sistema com segurança (exclusão lógica), mantendo intacto todo o histórico financeiro passado.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Confirmar Exclusão'),
          ),
        ],
      ),
    );

    if (confirmou == true) {
      await _clienteRepo.excluirLogico(widget.clienteId);
      if (mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: AppTheme.primaryRed)));
    }

    if (_cliente == null) {
      return const Scaffold(body: Center(child: Text('Cliente não encontrado')));
    }

    final currencyFmt = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
    final dateFmt = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(
        title: Text(_cliente!.nomeCompleto),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => ClienteFormScreen(clienteParaEditar: _cliente)),
              );
              _carregarDados();
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
            onPressed: _confirmarExclusaoLogica,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Card de Dados Pessoais
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.phone, size: 18, color: AppTheme.primaryRed),
                      const SizedBox(width: 8),
                      Text(_cliente!.celular, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  if (_cliente!.enderecoCompleto != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.location_on, size: 18, color: AppTheme.textMuted),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_cliente!.enderecoCompleto!, style: const TextStyle(fontSize: 13))),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Seção Veículos
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text('Veículos do Cliente', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              TextButton.icon(
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => VeiculoFormScreen(clienteId: _cliente!.id)),
                  );
                  _carregarDados();
                },
                icon: const Icon(Icons.add, size: 16, color: AppTheme.primaryRed),
                label: const Text('Adicionar', style: TextStyle(color: AppTheme.primaryRed)),
              ),
            ],
          ),
          if (_veiculos.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('Nenhum veículo cadastrado.', style: TextStyle(color: AppTheme.textMuted)),
              ),
            )
          else
            ..._veiculos.map((v) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: const Icon(Icons.directions_car, color: AppTheme.primaryRed),
                title: Text(v.descricaoCompleta, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: v.observacoes != null ? Text(v.observacoes!, style: const TextStyle(fontSize: 12)) : null,
              ),
            )),

          const SizedBox(height: 20),

          // Seção Histórico de Serviços Concluídos
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text('Histórico de Atendimentos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              TextButton.icon(
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => RegistrarServicoScreen(
                        clienteId: _cliente!.id,
                        veiculos: _veiculos,
                      ),
                    ),
                  );
                  _carregarDados();
                },
                icon: const Icon(Icons.add_task, size: 16, color: AppTheme.primaryRed),
                label: const Text('Registrar', style: TextStyle(color: AppTheme.primaryRed)),
              ),
            ],
          ),
          if (_historico.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('Nenhum serviço registrado ainda.', style: TextStyle(color: AppTheme.textMuted)),
              ),
            )
          else
            ..._historico.map((h) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Text(h.descricao, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        Text(dateFmt.format(h.data), style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Text('Cobrado: \${currencyFmt.format(h.valorCobrado)}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('Custo: \${currencyFmt.format(h.custoProdutos)}', style: const TextStyle(color: Colors.amber, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            )),
        ],
      ),
    );
  }
}
`,
  },

  // 4. VeiculoFormScreen
  {
    path: 'lib/screens/veiculos/veiculo_form_screen.dart',
    name: 'veiculo_form_screen.dart',
    category: 'ui',
    description: 'Cadastro de veículos vinculado ao cliente por chave estrangeira',
    code: `import 'package:flutter/material.dart';
import '../../models/veiculo_model.dart';
import '../../repositories/veiculo_repository.dart';
import '../../app/theme.dart';

class VeiculoFormScreen extends StatefulWidget {
  final String clienteId;

  const VeiculoFormScreen({super.key, required this.clienteId});

  @override
  State<VeiculoFormScreen> createState() => _VeiculoFormScreenState();
}

class _VeiculoFormScreenState extends State<VeiculoFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _repository = VeiculoRepository();

  final _marcaController = TextEditingController();
  final _modeloController = TextEditingController();
  final _anoController = TextEditingController();
  final _placaController = TextEditingController();
  final _observacoesController = TextEditingController();

  bool _isSaving = false;

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    try {
      final veiculo = VeiculoModel(
        clienteId: widget.clienteId,
        marca: _marcaController.text,
        modelo: _modeloController.text,
        ano: _anoController.text.isEmpty ? null : _anoController.text,
        placa: _placaController.text.isEmpty ? null : _placaController.text,
        observacoes: _observacoesController.text.isEmpty ? null : _observacoesController.text,
      );
      await _repository.inserir(veiculo);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao salvar veículo: \$e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Novo Veículo')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _marcaController,
              decoration: const InputDecoration(labelText: 'Marca (ex: BMW, Porsche, Audi) *'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe a marca' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _modeloController,
              decoration: const InputDecoration(labelText: 'Modelo (ex: 320i M Sport) *'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o modelo' : null,
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _anoController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Ano (ex: 2024)'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _placaController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: const InputDecoration(labelText: 'Placa (ex: BRA2E19)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _observacoesController,
              decoration: const InputDecoration(labelText: 'Observações do Veículo'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSaving ? null : _salvar,
              child: const Text('Cadastrar Veículo'),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },

  // 5. RegistrarServicoScreen (com cópia imutável dos custos)
  {
    path: 'lib/screens/historico/registrar_servico_screen.dart',
    name: 'registrar_servico_screen.dart',
    category: 'ui',
    description: 'Registro de atendimento com gravação estática congelada dos custos no momento',
    code: `import 'dart:convert';
import 'package:flutter/material.dart';
import '../../models/veiculo_model.dart';
import '../../models/tipo_servico_model.dart';
import '../../models/historico_servico_model.dart';
import '../../repositories/tipo_servico_repository.dart';
import '../../repositories/historico_servico_repository.dart';
import '../../app/theme.dart';
import 'package:intl/intl.dart';

class RegistrarServicoScreen extends StatefulWidget {
  final String clienteId;
  final List<VeiculoModel> veiculos;

  const RegistrarServicoScreen({super.key, required this.clienteId, required this.veiculos});

  @override
  State<RegistrarServicoScreen> createState() => _RegistrarServicoScreenState();
}

class _RegistrarServicoScreenState extends State<RegistrarServicoScreen> {
  final _tipoServicoRepo = TipoServicoRepository();
  final _historicoRepo = HistoricoServicoRepository();

  List<TipoServicoModel> _combosDisponiveis = [];
  TipoServicoModel? _comboSelecionado;
  VeiculoModel? _veiculoSelecionado;

  final _descricaoController = TextEditingController();
  final _valorCobradoController = TextEditingController();
  final _custoProdutosController = TextEditingController();
  final _observacoesController = TextEditingController();

  DateTime _dataRealizacao = DateTime.now();

  @override
  void initState() {
    super.initState();
    if (widget.veiculos.isNotEmpty) _veiculoSelecionado = widget.veiculos.first;
    _carregarCombos();
  }

  Future<void> _carregarCombos() async {
    final list = await _tipoServicoRepo.listarTodos(apenasAtivos: true);
    setState(() => _combosDisponiveis = list);
  }

  void _aoSelecionarCombo(TipoServicoModel? combo) {
    setState(() {
      _comboSelecionado = combo;
      if (combo != null) {
        _descricaoController.text = combo.nome;
        _valorCobradoController.text = combo.precoPadrao.toStringAsFixed(2);
        _custoProdutosController.text = combo.custoEstimadoProdutos.toStringAsFixed(2);
      }
    });
  }

  Future<void> _salvar() async {
    final valor = double.tryParse(_valorCobradoController.text.replaceAll(',', '.')) ?? 0.0;
    final custo = double.tryParse(_custoProdutosController.text.replaceAll(',', '.')) ?? 0.0;

    // Regra 3: Congela a cópia fiel dos custos e dos insumos naquele momento
    String? snapshotJson;
    if (_comboSelecionado != null) {
      final snapshot = _comboSelecionado!.produtosDoCombo.map((p) => {
        'produto_id': p.produtoId,
        'produto_nome': p.produto?.nome,
        'quantidade_usada': p.quantidadeUsada,
        'custo_unitario_momento': p.produto?.custoUnitario,
        'custo_total_item': p.custoItem,
      }).toList();
      snapshotJson = jsonEncode(snapshot);
    }

    final historico = HistoricoServicoModel(
      clienteId: widget.clienteId,
      veiculoId: _veiculoSelecionado?.id,
      tipoServicoId: _comboSelecionado?.id,
      descricao: _descricaoController.text,
      data: _dataRealizacao,
      observacoesTecnicas: _observacoesController.text.isEmpty ? null : _observacoesController.text,
      valorCobrado: valor,
      custoProdutos: custo,
      produtosSnapshotJson: snapshotJson,
      situacao: 'concluido',
    );

    await _historicoRepo.registrarServico(historico);
    if (mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Atendimento')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<TipoServicoModel>(
            decoration: const InputDecoration(labelText: 'Puxar Combo de Serviço'),
            value: _comboSelecionado,
            items: _combosDisponiveis.map((c) => DropdownMenuItem(value: c, child: Text(c.nome))).toList(),
            onChanged: _aoSelecionarCombo,
          ),
          const SizedBox(height: 14),
          if (widget.veiculos.isNotEmpty) ...[
            DropdownButtonFormField<VeiculoModel>(
              decoration: const InputDecoration(labelText: 'Veículo Atendido'),
              value: _veiculoSelecionado,
              items: widget.veiculos.map((v) => DropdownMenuItem(value: v, child: Text(v.descricaoCompleta))).toList(),
              onChanged: (v) => setState(() => _veiculoSelecionado = v),
            ),
            const SizedBox(height: 14),
          ],
          TextFormField(
            controller: _descricaoController,
            decoration: const InputDecoration(labelText: 'Descrição do Serviço *'),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _valorCobradoController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Valor Cobrado (R\$) *'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _custoProdutosController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Custo Insumos (R\$)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppTheme.border)),
            title: Text('Data do Serviço: \${dateFmt.format(_dataRealizacao)}'),
            trailing: const Icon(Icons.calendar_today, size: 18),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _dataRealizacao,
                firstDate: DateTime(2020),
                lastDate: DateTime.now(),
              );
              if (d != null) setState(() => _dataRealizacao = d);
            },
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _salvar,
            child: const Text('Concluir e Gravar Cópia dos Custos'),
          ),
        ],
      ),
    );
  }
}
`,
  },

  // 6. ResumoFinanceiroScreen
  {
    path: 'lib/screens/financeiro/resumo_financeiro_screen.dart',
    name: 'resumo_financeiro_screen.dart',
    category: 'ui',
    description: 'Resumo Financeiro com ganhos, custos dos produtos e lucro real por período',
    code: `import 'package:flutter/material.dart';
import '../../repositories/financeiro_repository.dart';
import '../../app/theme.dart';
import 'package:intl/intl.dart';

class ResumoFinanceiroScreen extends StatefulWidget {
  const ResumoFinanceiroScreen({super.key});

  @override
  State<ResumoFinanceiroScreen> createState() => _ResumoFinanceiroScreenState();
}

class _ResumoFinanceiroScreenState extends State<ResumoFinanceiroScreen> {
  final _financeiroRepo = FinanceiroRepository();

  DateTime _dataInicio = DateTime(DateTime.now().year, DateTime.now().month, 1);
  DateTime _dataFim = DateTime.now();
  String _filtroPeriodo = 'mes'; // 'dia', 'mes', 'custom'

  Map<String, dynamic>? _dados;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _carregarResumo();
  }

  Future<void> _carregarResumo() async {
    setState(() => _isLoading = true);
    final res = await _financeiroRepo.obterResumoPorPeriodo(inicio: _dataInicio, fim: _dataFim);
    setState(() {
      _dados = res;
      _isLoading = false;
    });
  }

  void _selecionarPeriodo(String tipo) {
    final now = DateTime.now();
    setState(() {
      _filtroPeriodo = tipo;
      if (tipo == 'dia') {
        _dataInicio = DateTime(now.year, now.month, now.day);
        _dataFim = now;
      } else if (tipo == 'mes') {
        _dataInicio = DateTime(now.year, now.month, 1);
        _dataFim = now;
      }
    });
    _carregarResumo();
  }

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');

    return Scaffold(
      appBar: AppBar(title: const Text('Resumo Financeiro')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Filtros
          Row(
            children: [
              _buildFiltroBtn('Hoje', 'dia'),
              const SizedBox(width: 8),
              _buildFiltroBtn('Este Mês', 'mes'),
            ],
          ),
          const SizedBox(height: 16),

          if (_isLoading)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: AppTheme.primaryRed)))
          else ...[
            // KPI Cards
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Ganhos Cobrados', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                          const SizedBox(height: 6),
                          Text(
                            currencyFmt.format(_dados!['total_cobrado']),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Custo Insumos', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                          const SizedBox(height: 6),
                          Text(
                            currencyFmt.format(_dados!['total_custo']),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.amber),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Card Destaque de Lucro Real
            Card(
              color: const Color(0xFF1B1B22),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.primaryRed)),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Lucro Líquido Real', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textMuted)),
                        const SizedBox(height: 4),
                        Text(
                          currencyFmt.format(_dados!['lucro_real']),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: AppTheme.primaryRed),
                        ),
                      ],
                    ),
                    Text('\${_dados!['total_atendimentos']} atendimentos', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            const Text('Lucro por Tipo de Serviço', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 10),

            ...((_dados!['itens'] as List<ResumoFinanceiroItem>)).map((item) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(item.tipoServicoNome, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('\${item.quantidade} realizados • Custo: \${currencyFmt.format(item.totalCusto)}', style: const TextStyle(fontSize: 12)),
                trailing: Text(currencyFmt.format(item.lucro), style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
              ),
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildFiltroBtn(String label, String tipo) {
    final ativo = _filtroPeriodo == tipo;
    return ElevatedButton(
      onPressed: () => _selecionarPeriodo(tipo),
      style: ElevatedButton.styleFrom(
        backgroundColor: ativo ? AppTheme.primaryRed : const Color(0xFF1E1E24),
        foregroundColor: Colors.white,
      ),
      child: Text(label),
    );
  }
}
`,
  },

  // 7. AgendamentoFormScreen (com validação e conflito)
  {
    path: 'lib/screens/agendamentos/agendamento_form_screen.dart',
    name: 'agendamento_form_screen.dart',
    category: 'ui',
    description: 'Fluxo completo de agendamento offline com validação início < término e detecção de conflitos',
    code: `import 'package:flutter/material.dart';
import '../../models/agendamento_model.dart';
import '../../models/cliente_model.dart';
import '../../models/veiculo_model.dart';
import '../../models/tipo_servico_model.dart';
import '../../repositories/agendamento_repository.dart';
import '../../repositories/cliente_repository.dart';
import '../../repositories/veiculo_repository.dart';
import '../../repositories/tipo_servico_repository.dart';
import '../../widgets/conflito_horario_dialog.dart';
import '../../app/theme.dart';
import 'package:intl/intl.dart';

class AgendamentoFormScreen extends StatefulWidget {
  final AgendamentoModel? agendamentoParaEditar;

  const AgendamentoFormScreen({super.key, this.agendamentoParaEditar});

  @override
  State<AgendamentoFormScreen> createState() => _AgendamentoFormScreenState();
}

class _AgendamentoFormScreenState extends State<AgendamentoFormScreen> {
  final _agendamentoRepo = AgendamentoRepository();
  final _clienteRepo = ClienteRepository();
  final _veiculoRepo = VeiculoRepository();
  final _tipoServicoRepo = TipoServicoRepository();

  List<ClienteModel> _clientes = [];
  List<VeiculoModel> _veiculos = [];
  List<TipoServicoModel> _servicos = [];

  ClienteModel? _clienteSelecionado;
  VeiculoModel? _veiculoSelecionado;
  TipoServicoModel? _servicoSelecionado;

  DateTime _data = DateTime.now();
  TimeOfDay _horaInicio = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _horaTermino = const TimeOfDay(hour: 12, minute: 0);
  final _observacoesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _carregarDadosIniciais();
  }

  Future<void> _carregarDadosIniciais() async {
    final cList = await _clienteRepo.listarAtivos();
    final sList = await _tipoServicoRepo.listarTodos(apenasAtivos: true);
    setState(() {
      _clientes = cList;
      _servicos = sList;
    });
  }

  Future<void> _aoMudarCliente(ClienteModel? cliente) async {
    setState(() {
      _clienteSelecionado = cliente;
      _veiculoSelecionado = null;
    });
    if (cliente != null) {
      final vList = await _veiculoRepo.listarPorCliente(cliente.id);
      setState(() => _veiculos = vList);
    }
  }

  DateTime _combinarDataHora(DateTime d, TimeOfDay t) {
    return DateTime(d.year, d.month, d.day, t.hour, t.minute);
  }

  Future<void> _submeter() async {
    if (_clienteSelecionado == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Selecione um cliente')));
      return;
    }

    final inicio = _combinarDataHora(_data, _horaInicio);
    final termino = _combinarDataHora(_data, _horaTermino);

    // Validação de término anterior ao início (Regra 6)
    if (!termino.isAfter(inicio)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro: O horário de término deve ser após o início.')),
      );
      return;
    }

    // Checagem de Conflito de Horário
    final conflitos = await _agendamentoRepo.verificarConflitoHorario(
      inicio: inicio,
      termino: termino,
      ignorarId: widget.agendamentoParaEditar?.id,
    );

    if (conflitos.isNotEmpty && mounted) {
      showDialog(
        context: context,
        builder: (_) => ConflitoHorarioDialog(
          conflitos: conflitos,
          onContinuar: _salvarAgendamento,
        ),
      );
      return;
    }

    _salvarAgendamento();
  }

  Future<void> _salvarAgendamento() async {
    final inicio = _combinarDataHora(_data, _horaInicio);
    final termino = _combinarDataHora(_data, _horaTermino);

    final agendamento = AgendamentoModel(
      id: widget.agendamentoParaEditar?.id,
      clienteId: _clienteSelecionado!.id,
      veiculoId: _veiculoSelecionado?.id,
      tipoServicoId: _servicoSelecionado?.id,
      inicio: inicio,
      termino: termino,
      observacoes: _observacoesController.text.isEmpty ? null : _observacoesController.text,
      situacao: widget.agendamentoParaEditar?.situacao ?? 'agendado',
      syncSituacao: 'pendente',
    );

    if (widget.agendamentoParaEditar == null) {
      await _agendamentoRepo.criar(agendamento);
    } else {
      await _agendamentoRepo.atualizar(agendamento);
    }

    if (mounted) Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(title: const Text('Novo Agendamento')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<ClienteModel>(
            decoration: const InputDecoration(labelText: 'Cliente *'),
            value: _clienteSelecionado,
            items: _clientes.map((c) => DropdownMenuItem(value: c, child: Text(c.nomeCompleto))).toList(),
            onChanged: _aoMudarCliente,
          ),
          const SizedBox(height: 14),
          if (_veiculos.isNotEmpty) ...[
            DropdownButtonFormField<VeiculoModel>(
              decoration: const InputDecoration(labelText: 'Veículo (Opcional)'),
              value: _veiculoSelecionado,
              items: _veiculos.map((v) => DropdownMenuItem(value: v, child: Text(v.descricaoCompleta))).toList(),
              onChanged: (v) => setState(() => _veiculoSelecionado = v),
            ),
            const SizedBox(height: 14),
          ],
          DropdownButtonFormField<TipoServicoModel>(
            decoration: const InputDecoration(labelText: 'Tipo de Serviço'),
            value: _servicoSelecionado,
            items: _servicos.map((s) => DropdownMenuItem(value: s, child: Text(s.nome))).toList(),
            onChanged: (s) => setState(() => _servicoSelecionado = s),
          ),
          const SizedBox(height: 14),
          ListTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppTheme.border)),
            title: Text('Data: \${dateFmt.format(_data)}'),
            trailing: const Icon(Icons.calendar_today, size: 18),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _data,
                firstDate: DateTime.now().subtract(const Duration(days: 30)),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (d != null) setState(() => _data = d);
            },
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: ListTile(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppTheme.border)),
                  title: Text('Início: \${_horaInicio.format(context)}'),
                  onTap: () async {
                    final t = await showTimePicker(context: context, initialTime: _horaInicio);
                    if (t != null) setState(() => _horaInicio = t);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ListTile(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: AppTheme.border)),
                  title: Text('Término: \${_horaTermino.format(context)}'),
                  onTap: () async {
                    final t = await showTimePicker(context: context, initialTime: _horaTermino);
                    if (t != null) setState(() => _horaTermino = t);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _observacoesController,
            decoration: const InputDecoration(labelText: 'Observações do Atendimento'),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _submeter,
            child: const Text('Salvar no SQLite Local'),
          ),
        ],
      ),
    );
  }
}
`,
  },

  // 8. HomeAgendaScreen
  {
    path: 'lib/screens/home_agenda_screen.dart',
    name: 'home_agenda_screen.dart',
    category: 'ui',
    description: 'Agenda do dia com cards de atendimento, sincronização e navegação rápida',
    code: `import 'package:flutter/material.dart';
import '../models/agendamento_model.dart';
import '../models/cliente_model.dart';
import '../repositories/agendamento_repository.dart';
import '../repositories/cliente_repository.dart';
import '../services/sync_manager.dart';
import '../widgets/sync_badge.dart';
import '../app/theme.dart';
import 'agendamentos/agendamento_form_screen.dart';
import 'package:intl/intl.dart';

class HomeAgendaScreen extends StatefulWidget {
  const HomeAgendaScreen({super.key});

  @override
  State<HomeAgendaScreen> createState() => _HomeAgendaScreenState();
}

class _HomeAgendaScreenState extends State<HomeAgendaScreen> {
  final _agendamentoRepo = AgendamentoRepository();
  final _clienteRepo = ClienteRepository();

  DateTime _diaSelecionado = DateTime.now();
  List<AgendamentoModel> _agendamentos = [];
  Map<String, ClienteModel> _clientesMap = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _carregarAgenda();
  }

  Future<void> _carregarAgenda() async {
    setState(() => _isLoading = true);
    final list = await _agendamentoRepo.listarDoDia(_diaSelecionado);
    final cMap = <String, ClienteModel>{};
    for (final a in list) {
      if (!cMap.containsKey(a.clienteId)) {
        final c = await _clienteRepo.buscarPorId(a.clienteId);
        if (c != null) cMap[a.clienteId] = c;
      }
    }
    setState(() {
      _agendamentos = list;
      _clientesMap = cMap;
      _isLoading = false;
    });
  }

  Future<void> _sincronizar() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sincronizando com Google Agenda...')),
    );
    final res = await SyncManager.instance.sincronizarAgora();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(res['mensagem'] as String)),
    );
    _carregarAgenda();
  }

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('HH:mm');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agenda • Schmitt Detailer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sincronizar Google Agenda',
            onPressed: _sincronizar,
          ),
        ],
      ),
      body: Column(
        children: [
          // Header com Data
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: AppTheme.cardBg,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text(
                  DateFormat('EEEE, d MMMM', 'pt_BR').format(_diaSelecionado),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Text('\${_agendamentos.length} atendimentos', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed))
                : _agendamentos.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.event_available, size: 48, color: AppTheme.textMuted),
                            const SizedBox(height: 12),
                            const Text('Nenhum agendamento para este dia.', style: TextStyle(color: AppTheme.textMuted)),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () async {
                                await Navigator.push(context, MaterialPageRoute(builder: (_) => const AgendamentoFormScreen()));
                                _carregarAgenda();
                              },
                              child: const Text('Agendar Primeiro Serviço'),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _agendamentos.length,
                        itemBuilder: (context, index) {
                          final a = _agendamentos[index];
                          final cliente = _clientesMap[a.clienteId];

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.between,
                                    children: [
                                      Text(
                                        '\${timeFmt.format(a.inicio)} - \${timeFmt.format(a.termino)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                                      ),
                                      SyncBadge(isSynced: a.isSincronizado, syncSituacao: a.syncSituacao),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    cliente?.nomeCompleto ?? 'Cliente',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  if (cliente?.enderecoCompleto != null) ...[
                                    const SizedBox(height: 4),
                                    Text(cliente!.enderecoCompleto!, style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                                  ],
                                  if (a.observacoes != null) ...[
                                    const SizedBox(height: 6),
                                    Text('Obs: \${a.observacoes!}', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic)),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const AgendamentoFormScreen()));
          _carregarAgenda();
        },
        backgroundColor: AppTheme.primaryRed,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
`,
  },

  // 10. ServicosListScreen
  {
    path: 'lib/screens/servicos/servicos_list_screen.dart',
    name: 'servicos_list_screen.dart',
    category: 'ui',
    description: 'Listagem e gerenciamento de serviços com valores, insumos e margem de lucro',
    code: `import 'package:flutter/material.dart';
import '../../models/tipo_servico_model.dart';
import '../../repositories/tipo_servico_repository.dart';
import '../../app/theme.dart';
import 'servico_form_screen.dart';
import '../produtos/produtos_list_screen.dart';

class ServicosListScreen extends StatefulWidget {
  const ServicosListScreen({super.key});

  @override
  State<ServicosListScreen> createState() => _ServicosListScreenState();
}

class _ServicosListScreenState extends State<ServicosListScreen> {
  final _repository = TipoServicoRepository();
  List<TipoServicoModel> _servicos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() => _isLoading = true);
    final list = await _repository.listarTodos();
    setState(() {
      _servicos = list;
      _isLoading = false;
    });
  }

  Future<void> _excluir(TipoServicoModel servico) async {
    final conf = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir Serviço?'),
        content: Text('Deseja realmente excluir o serviço "\${servico.nome}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (conf == true) {
      await _repository.excluir(servico.id);
      _carregar();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Serviço excluído com sucesso')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Serviços • Schmitt Detailer'),
        actions: [
          IconButton(
            icon: const Icon(Icons.inventory_2_outlined),
            tooltip: 'Gerenciar Insumos & Produtos',
            onPressed: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const ProdutosListScreen()));
              _carregar();
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed))
          : _servicos.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.build_outlined, size: 48, color: AppTheme.textMuted),
                      const SizedBox(height: 12),
                      const Text('Nenhum serviço cadastrado.', style: TextStyle(color: AppTheme.textMuted)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () async {
                          await Navigator.push(context, MaterialPageRoute(builder: (_) => const ServicoFormScreen()));
                          _carregar();
                        },
                        child: const Text('Criar Primeiro Serviço'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _servicos.length,
                  itemBuilder: (context, index) {
                    final s = _servicos[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Expanded(
                                  child: Text(
                                    s.nome,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ),
                                Text(
                                  'R\$ \${s.precoPadrao.toStringAsFixed(2)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                                ),
                              ],
                            ),
                            if (s.produtos.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: s.produtos.map((cp) {
                                  final pNome = cp.produto?.nome ?? 'Produto';
                                  final pUn = cp.produto?.unidade ?? 'ml';
                                  return Chip(
                                    labelPadding: const EdgeInsets.symmetric(horizontal: 4),
                                    label: Text('\$pNome: \${cp.quantidadeUtilizada.toStringAsFixed(0)} \$pUn', style: const TextStyle(fontSize: 10)),
                                    backgroundColor: AppTheme.surfaceDark,
                                  );
                                }).toList(),
                              ),
                            ],
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.between,
                              children: [
                                Text(
                                  'Custo Insumos: R\$ \${s.custoEstimadoTotal.toStringAsFixed(2)}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.primaryRed),
                                ),
                                Text(
                                  'Margem: \${s.margemLucroPrevista.toStringAsFixed(1)}%',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.successGreen, fontWeight: FontWeight.bold),
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 18),
                                      onPressed: () async {
                                        await Navigator.push(context, MaterialPageRoute(builder: (_) => ServicoFormScreen(servicoParaEditar: s)));
                                        _carregar();
                                      },
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                      onPressed: () => _excluir(s),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryRed,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const ServicoFormScreen()));
          _carregar();
        },
      ),
    );
  }
}
`,
  },

  // 11. ServicoFormScreen
  {
    path: 'lib/screens/servicos/servico_form_screen.dart',
    name: 'servico_form_screen.dart',
    category: 'ui',
    description: 'Criação e edição de serviço com produtos utilizados, doses e valor cobrado',
    code: `import 'package:flutter/material.dart';
import '../../models/tipo_servico_model.dart';
import '../../models/tipo_servico_produto_model.dart';
import '../../models/produto_model.dart';
import '../../repositories/tipo_servico_repository.dart';
import '../../repositories/produto_repository.dart';
import '../../app/theme.dart';

class ServicoFormScreen extends StatefulWidget {
  final TipoServicoModel? servicoParaEditar;

  const ServicoFormScreen({super.key, this.servicoParaEditar});

  @override
  State<ServicoFormScreen> createState() => _ServicoFormScreenState();
}

class _ServicoFormScreenState extends State<ServicoFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _servicoRepo = TipoServicoRepository();
  final _produtoRepo = ProdutoRepository();

  late TextEditingController _nomeController;
  late TextEditingController _precoController;

  List<ProdutoModel> _todosProdutos = [];
  List<TipoServicoProdutoModel> _itensDoCombo = [];
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nomeController = TextEditingController(text: widget.servicoParaEditar?.nome ?? '');
    _precoController = TextEditingController(
      text: widget.servicoParaEditar != null ? widget.servicoParaEditar!.precoPadrao.toStringAsFixed(2) : '',
    );
    _carregarDados();
  }

  Future<void> _carregarDados() async {
    final prods = await _produtoRepo.listarTodos(apenasAtivos: true);
    setState(() {
      _todosProdutos = prods;
      if (widget.servicoParaEditar != null) {
        _itensDoCombo = List.from(widget.servicoParaEditar!.produtos);
      }
      _isLoading = false;
    });
  }

  void _adicionarItem() {
    if (_todosProdutos.isEmpty) return;
    final primeiro = _todosProdutos.first;
    setState(() {
      _itensDoCombo.add(TipoServicoProdutoModel(
        tipoServicoId: widget.servicoParaEditar?.id ?? '',
        produtoId: primeiro.id,
        quantidadeUtilizada: 50.0,
        produto: primeiro,
      ));
    });
  }

  double get _custoTotalInsumos {
    double total = 0;
    for (final item in _itensDoCombo) {
      final p = _todosProdutos.firstWhere((prod) => prod.id == item.produtoId, orElse: () => item.produto ?? _todosProdutos.first);
      total += p.custoUnitario * item.quantidadeUtilizada;
    }
    return total;
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    try {
      final preco = double.tryParse(_precoController.text.replaceAll(',', '.')) ?? 0.0;
      final servico = widget.servicoParaEditar != null
          ? widget.servicoParaEditar!.copyWith(
              nome: _nomeController.text.trim(),
              precoPadrao: preco,
            )
          : TipoServicoModel(
              nome: _nomeController.text.trim(),
              precoPadrao: preco,
            );

      final itensAtualizados = _itensDoCombo.map((i) => i.copyWith(tipoServicoId: servico.id)).toList();
      await _servicoRepo.salvarCombo(servico, itensAtualizados);

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao salvar: \$e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final precoCobrado = double.tryParse(_precoController.text.replaceAll(',', '.')) ?? 0.0;
    final lucroPrevisto = precoCobrado - _custoTotalInsumos;
    final margemPct = precoCobrado > 0 ? (lucroPrevisto / precoCobrado) * 100 : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.servicoParaEditar != null ? 'Editar Serviço' : 'Novo Serviço'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _nomeController,
                    decoration: const InputDecoration(labelText: 'Nome do Serviço (ex: Lavagem Técnica) *'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o nome' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _precoController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Preço Padrão Cobrado (R\$) *'),
                    onChanged: (_) => setState(() {}),
                    validator: (v) => (v == null || double.tryParse(v.replaceAll(',', '.')) == null) ? 'Informe um valor válido' : null,
                  ),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text('Insumos Utilizados no Combo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      TextButton.icon(
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Adicionar Insumo'),
                        onPressed: _adicionarItem,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_itensDoCombo.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('Nenhum insumo configurado para este combo.', style: TextStyle(color: AppTheme.textMuted)),
                    )
                  else
                    ..._itensDoCombo.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final item = entry.value;
                      final prodSelecionado = _todosProdutos.firstWhere(
                        (p) => p.id == item.produtoId,
                        orElse: () => _todosProdutos.first,
                      );

                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: DropdownButton<String>(
                                  isExpanded: true,
                                  value: item.produtoId,
                                  items: _todosProdutos.map((p) => DropdownMenuItem(value: p.id, child: Text(p.nome, overflow: TextOverflow.ellipsis))).toList(),
                                  onChanged: (novoId) {
                                    if (novoId == null) return;
                                    setState(() {
                                      _itensDoCombo[idx] = item.copyWith(
                                        produtoId: novoId,
                                        produto: _todosProdutos.firstWhere((p) => p.id == novoId),
                                      );
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                flex: 1,
                                child: TextFormField(
                                  initialValue: item.quantidadeUtilizada.toStringAsFixed(0),
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: prodSelecionado.unidade,
                                    isDense: true,
                                  ),
                                  onChanged: (val) {
                                    final qtd = double.tryParse(val) ?? 0.0;
                                    setState(() {
                                      _itensDoCombo[idx] = item.copyWith(quantidadeUtilizada: qtd);
                                    });
                                  },
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close, color: Colors.redAccent, size: 18),
                                onPressed: () {
                                  setState(() => _itensDoCombo.removeAt(idx));
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceDark,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primaryRed.withOpacity(0.3)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            const Text('Custo Estimado dos Insumos:', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                            Text('R\$ \${_custoTotalInsumos.toStringAsFixed(2)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryRed)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            const Text('Margem de Lucro Prevista:', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                            Text('\${margemPct.toStringAsFixed(1)}% (R\$ \${lucroPrevisto.toStringAsFixed(2)})', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.successGreen)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _salvar,
                    child: Text(widget.servicoParaEditar != null ? 'Salvar Alterações' : 'Cadastrar Serviço'),
                  ),
                ],
              ),
            ),
    );
  }
}
`,
  },

  // 12. ProdutosListScreen
  {
    path: 'lib/screens/produtos/produtos_list_screen.dart',
    name: 'produtos_list_screen.dart',
    category: 'ui',
    description: 'Gestão de insumos e produtos com custos unitários por dose',
    code: `import 'package:flutter/material.dart';
import '../../models/produto_model.dart';
import '../../repositories/produto_repository.dart';
import '../../app/theme.dart';
import 'produto_form_screen.dart';

class ProdutosListScreen extends StatefulWidget {
  const ProdutosListScreen({super.key});

  @override
  State<ProdutosListScreen> createState() => _ProdutosListScreenState();
}

class _ProdutosListScreenState extends State<ProdutosListScreen> {
  final _repository = ProdutoRepository();
  List<ProdutoModel> _produtos = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  Future<void> _carregar() async {
    setState(() => _isLoading = true);
    final list = await _repository.listarTodos();
    setState(() {
      _produtos = list;
      _isLoading = false;
    });
  }

  Future<void> _excluir(ProdutoModel produto) async {
    final conf = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Excluir Insumo?'),
        content: Text('Deseja realmente excluir "\${produto.nome}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryRed),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (conf == true) {
      await _repository.excluir(produto.id);
      _carregar();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Insumo excluído')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Insumos & Estoque')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed))
          : _produtos.isEmpty
              ? const Center(child: Text('Nenhum insumo cadastrado.', style: TextStyle(color: AppTheme.textMuted)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _produtos.length,
                  itemBuilder: (context, index) {
                    final p = _produtos[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        title: Text(p.nome, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('R\$ \${p.precoEmbalagem.toStringAsFixed(2)} por \${p.quantidadeEmbalagem.toStringAsFixed(0)} \${p.unidade}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'R\$ \${p.custoUnitario.toStringAsFixed(4)}/\${p.unidade}',
                              style: const TextStyle(color: AppTheme.successGreen, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 18),
                              onPressed: () => _excluir(p),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.primaryRed,
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute(builder: (_) => const ProdutoFormScreen()));
          _carregar();
        },
      ),
    );
  }
}
`,
  },

  // 13. ProdutoFormScreen
  {
    path: 'lib/screens/produtos/produto_form_screen.dart',
    name: 'produto_form_screen.dart',
    category: 'ui',
    description: 'Formulário de cadastro de insumo com cálculo automático de custo por dose',
    code: `import 'package:flutter/material.dart';
import '../../models/produto_model.dart';
import '../../repositories/produto_repository.dart';
import '../../app/theme.dart';

class ProdutoFormScreen extends StatefulWidget {
  const ProdutoFormScreen({super.key});

  @override
  State<ProdutoFormScreen> createState() => _ProdutoFormScreenState();
}

class _ProdutoFormScreenState extends State<ProdutoFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _repository = ProdutoRepository();

  final _nomeController = TextEditingController();
  final _precoController = TextEditingController();
  final _quantidadeController = TextEditingController();
  String _unidade = 'ml';
  bool _isSaving = false;

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    try {
      final preco = double.tryParse(_precoController.text.replaceAll(',', '.')) ?? 0.0;
      final qtd = double.tryParse(_quantidadeController.text.replaceAll(',', '.')) ?? 1.0;
      final custoUnitario = qtd > 0 ? preco / qtd : 0.0;

      final p = ProdutoModel(
        nome: _nomeController.text.trim(),
        unidade: _unidade,
        precoEmbalagem: preco,
        quantidadeEmbalagem: qtd,
        custoUnitario: custoUnitario,
        ativo: true,
      );

      await _repository.inserir(p);
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erro ao salvar: \$e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Novo Insumo')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nomeController,
              decoration: const InputDecoration(labelText: 'Nome do Insumo (ex: Shampoo V-Floc) *'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Informe o nome' : null,
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: _unidade,
              decoration: const InputDecoration(labelText: 'Unidade de Medida *'),
              items: const [
                DropdownMenuItem(value: 'ml', child: Text('Mililitros (ml)')),
                DropdownMenuItem(value: 'g', child: Text('Gramas (g)')),
                DropdownMenuItem(value: 'unidade', child: Text('Unidade (un)')),
              ],
              onChanged: (v) => setState(() => _unidade = v ?? 'ml'),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _precoController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Preço Pago (R\$) *'),
                    validator: (v) => (v == null || double.tryParse(v.replaceAll(',', '.')) == null) ? 'Inválido' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _quantidadeController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(labelText: 'Volume/Qtd (\$_unidade) *'),
                    validator: (v) => (v == null || double.tryParse(v.replaceAll(',', '.')) == null) ? 'Inválido' : null,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSaving ? null : _salvar,
              child: const Text('Salvar Insumo no Estoque'),
            ),
          ],
        ),
      ),
    );
  }
}
`,
  },

  // 9. MainNavigationScreen
  {
    path: 'lib/screens/main_navigation_screen.dart',
    name: 'main_navigation_screen.dart',
    category: 'ui',
    description: 'Navegação principal com abas de Agenda, Clientes, Serviços & Combos e Financeiro',
    code: `import 'package:flutter/material.dart';
import 'home_agenda_screen.dart';
import 'clientes/clientes_list_screen.dart';
import 'servicos/servicos_list_screen.dart';
import 'financeiro/resumo_financeiro_screen.dart';
import '../app/theme.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _telas = const [
    HomeAgendaScreen(),
    ClientesListScreen(),
    ServicosListScreen(),
    ResumoFinanceiroScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _telas[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        backgroundColor: AppTheme.cardBg,
        indicatorColor: AppTheme.primaryRed.withOpacity(0.2),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today, color: AppTheme.primaryRed),
            label: 'Agenda',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people, color: AppTheme.primaryRed),
            label: 'Clientes',
          ),
          NavigationDestination(
            icon: Icon(Icons.build_outlined),
            selectedIcon: Icon(Icons.build, color: AppTheme.primaryRed),
            label: 'Serviços',
          ),
          NavigationDestination(
            icon: Icon(Icons.attach_money_outlined),
            selectedIcon: Icon(Icons.attach_money, color: AppTheme.primaryRed),
            label: 'Financeiro',
          ),
        ],
      ),
    );
  }
}
`,
  },
];

