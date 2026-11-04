import JSZip from 'jszip';
import { FLUTTER_PROJECT_FILES } from '../flutterSource';

export async function downloadFlutterZip() {
  const zip = new JSZip();

  // Add all files (including android/ and ios/ for FlutLab)
  FLUTTER_PROJECT_FILES.forEach((f) => {
    zip.file(f.path, f.code);
  });

  const readme = `# Schmitt Detailer - Projeto Flutter para Poco F5 (Compatível com FlutLab.io)

Contém a estrutura oficial do Flutter completa:
- android/ (build.gradle, settings.gradle, app/build.gradle, AndroidManifest.xml)
- ios/ (Runner/Info.plist, Runner/AppDelegate.swift, Podfile)
- lib/ (main.dart, models, database Isar, services Google Calendar)
- pubspec.yaml

## Como gerar o APK no FlutLab.io:
1. Faça upload deste arquivo .zip no FlutLab.io
2. Clique no botão 'Build' > 'Android (.apk)'
3. Baixe o APK pronto diretamente no seu Poco F5!
`;
  zip.file('README.md', readme);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schmitt_detailer_flutlab_ready.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
