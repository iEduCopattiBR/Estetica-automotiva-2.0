export interface FlutterFile {
  path: string;
  name: string;
  category: 'config' | 'database' | 'model' | 'repository' | 'service' | 'ui' | 'android' | 'app' | 'widget' | 'provider';
  code: string;
  description: string;
}
