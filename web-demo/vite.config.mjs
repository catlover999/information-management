import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function loadEnvVars() {
  const envFile = path.join(repoRoot, '.env');
  const vars = {};
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq > 0) {
        const k = line.slice(0, eq).trim();
        let v = line.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        vars[k] = v;
      }
    }
  }

  let bundleFallbackKey = '';
  try {
    const bundlePath = path.join(repoRoot, 'android/app/src/main/assets/index.android.bundle');
    if (fs.existsSync(bundlePath)) {
      const bundleText = fs.readFileSync(bundlePath, 'utf8');
      const match = bundleText.match(/sk-or-v1-[a-zA-Z0-9]+/);
      if (match) {
        bundleFallbackKey = match[0];
      }
    }
  } catch {
    // ignore
  }

  return {
    OPENROUTER_API_KEY:
      process.env.OPENROUTER_API_KEY || vars.OPENROUTER_API_KEY || bundleFallbackKey || '',
    OPENROUTER_MODEL:
      process.env.OPENROUTER_MODEL || vars.OPENROUTER_MODEL || 'qwen/qwen3-vl-8b-instruct',
  };
}

function rnAssetRequirePlugin() {
  return {
    name: 'rn-asset-require-transform',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.tsx') && !id.endsWith('.ts') && !id.endsWith('.js')) {
        return null;
      }
      if (!code.includes('require(')) {
        return null;
      }
      let idx = 0;
      const imports = [];
      const transformed = code.replace(
        /require\(\s*(['"][^'"]+\.(?:png|jpg|jpeg|gif|webp|svg)['"])\s*\)/g,
        (_match, assetPathLiteral) => {
          const varName = `__rnAsset_${idx++}`;
          imports.push(`import ${varName} from ${assetPathLiteral};`);
          return varName;
        },
      );
      if (imports.length === 0) {
        return null;
      }
      return {
        code: `${imports.join('\n')}\n${transformed}`,
        map: null,
      };
    },
  };
}

const envVars = loadEnvVars();

export default defineConfig({
  root: __dirname,
  cacheDir: '/tmp/vite-cache',
  plugins: [rnAssetRequirePlugin(), react()],
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        jsx: 'react-jsx',
      },
    },
  },
  define: {
    'process.env.OPENROUTER_API_KEY': JSON.stringify(envVars.OPENROUTER_API_KEY),
    'process.env.OPENROUTER_MODEL': JSON.stringify(envVars.OPENROUTER_MODEL),
    __DEV__: true,
  },
  resolve: {
    alias: [
      {
        find: /^react-native$/,
        replacement: path.resolve(__dirname, 'shims/react-native.tsx'),
      },
      {
        find: /^react-native-safe-area-context$/,
        replacement: path.resolve(__dirname, 'shims/safe-area-context.tsx'),
      },
      {
        find: /^@react-navigation\/native$/,
        replacement: path.resolve(__dirname, 'shims/react-navigation-native.tsx'),
      },
      {
        find: /^@react-navigation\/bottom-tabs$/,
        replacement: path.resolve(__dirname, 'shims/react-navigation-bottom-tabs.tsx'),
      },
      {
        find: /^@react-native-async-storage\/async-storage$/,
        replacement: path.resolve(__dirname, 'shims/async-storage.ts'),
      },
      {
        find: /^@react-native-community\/datetimepicker$/,
        replacement: path.resolve(__dirname, 'shims/datetimepicker.tsx'),
      },
      {
        find: /^react-native-draglist$/,
        replacement: path.resolve(__dirname, 'shims/draglist.tsx'),
      },
      {
        find: /^react-native-vision-camera$/,
        replacement: path.resolve(__dirname, 'shims/vision-camera.tsx'),
      },
      {
        find: /^react-native-nitro-image$/,
        replacement: path.resolve(__dirname, 'shims/nitro-image.ts'),
      },
    ],
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    strictPort: true,
    allowedHosts: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
