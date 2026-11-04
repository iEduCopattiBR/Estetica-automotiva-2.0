import { FlutterFile } from './types';

export const WIDGET_FILES: FlutterFile[] = [
  // 1. DuplicidadeDialog
  {
    path: 'lib/widgets/duplicidade_dialog.dart',
    name: 'duplicidade_dialog.dart',
    category: 'widget',
    description: 'Diálogo de alerta sobre possível duplicidade de cliente (mesmo nome ou celular)',
    code: `import 'package:flutter/material.dart';
import '../models/cliente_model.dart';
import '../app/theme.dart';

class DuplicidadeDialog extends StatelessWidget {
  final List<ClienteModel> duplicados;
  final VoidCallback onContinuarMesmoAssim;
  final Function(ClienteModel) onAbrirExistente;

  const DuplicidadeDialog({
    super.key,
    required this.duplicados,
    required this.onContinuarMesmoAssim,
    required this.onAbrirExistente,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFFFA726)),
      ),
      title: const Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Color(0xFFFFA726)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Atenção: Possível Duplicidade',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Já existe um cliente cadastrado com nome ou celular semelhante:',
            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 12),
          ...duplicados.take(2).map((c) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF1F1F26),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.nomeCompleto, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(c.celular, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => onAbrirExistente(c),
                  child: const Text('Ver', style: TextStyle(color: AppTheme.primaryRed, fontSize: 12)),
                ),
              ],
            ),
          )),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
            onContinuarMesmoAssim();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFFA726),
            foregroundColor: Colors.black,
          ),
          child: const Text('Salvar Mesmo Assim'),
        ),
      ],
    );
  }
}
`,
  },

  // 2. ConflitoHorarioDialog
  {
    path: 'lib/widgets/conflito_horario_dialog.dart',
    name: 'conflito_horario_dialog.dart',
    category: 'widget',
    description: 'Aviso claro de sobreposição de horário sem bloquear o usuário',
    code: `import 'package:flutter/material.dart';
import '../models/agendamento_model.dart';
import '../app/theme.dart';
import 'package:intl/intl.dart';

class ConflitoHorarioDialog extends StatelessWidget {
  final List<AgendamentoModel> conflitos;
  final VoidCallback onContinuar;

  const ConflitoHorarioDialog({
    super.key,
    required this.conflitos,
    required this.onContinuar,
  });

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('HH:mm');

    return AlertDialog(
      backgroundColor: AppTheme.cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFFFA726)),
      ),
      title: const Row(
        children: [
          Icon(Icons.schedule, color: Color(0xFFFFA726)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Aviso de Conflito de Horário',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Já existem agendamentos no mesmo intervalo:',
            style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
          ),
          const SizedBox(height: 12),
          ...conflitos.take(2).map((a) => Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF1F1F26),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.border),
            ),
            child: Text(
              'Atendimento: \${timeFmt.format(a.inicio)} até \${timeFmt.format(a.termino)}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
          )),
          const SizedBox(height: 8),
          const Text(
            'Deseja prosseguir com o agendamento mesmo com a sobreposição (encaixe)?',
            style: TextStyle(fontSize: 12, color: AppTheme.textLight),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Revisar Horário', style: TextStyle(color: AppTheme.textMuted)),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);
            onContinuar();
          },
          child: const Text('Manter Agendamento'),
        ),
      ],
    );
  }
}
`,
  },

  // 3. SyncBadge
  {
    path: 'lib/widgets/sync_badge.dart',
    name: 'sync_badge.dart',
    category: 'widget',
    description: 'Indicador visual de sincronização Google Calendar vs pendência local',
    code: `import 'package:flutter/material.dart';

class SyncBadge extends StatelessWidget {
  final bool isSynced;
  final String? syncSituacao;

  const SyncBadge({
    super.key,
    required this.isSynced,
    this.syncSituacao,
  });

  @override
  Widget build(BuildContext context) {
    if (isSynced || syncSituacao == 'sincronizado') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFF2E7D32).withOpacity(0.2),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFF2E7D32)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_done, size: 12, color: Color(0xFF81C784)),
            SizedBox(width: 4),
            Text('Google Agenda', style: TextStyle(fontSize: 10, color: Color(0xFF81C784), fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFFFFA726).withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFFFA726)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.cloud_off, size: 12, color: Color(0xFFFFA726)),
          SizedBox(width: 4),
          Text('Pendente Sync (Local)', style: TextStyle(fontSize: 10, color: Color(0xFFFFA726), fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
`,
  },
];
