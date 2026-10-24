import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { seedVehicles } from '../lib/seed.mjs';

const require = createRequire(import.meta.url);
function loadJsx(path, imports = {}) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  const compiledModule = { exports: {} };
  const scopedRequire = name => Object.hasOwn(imports, name) ? imports[name] : require(name);
  new Function('module', 'exports', 'require', outputText)(compiledModule, compiledModule.exports, scopedRequire);
  return compiledModule.exports;
}

const ui = loadJsx('../app/components/ui.jsx');
const { default: VehicleDetail } = loadJsx('../app/components/VehicleDetail.jsx', {
  './ui': ui,
  './Finance': { __esModule: true, default: () => null },
});

function renderDetail(favoriteFeedback, favoriteLoginUrl) {
  const markup = renderToStaticMarkup(React.createElement(VehicleDetail, {
    vehicle: { ...seedVehicles[0], photos: [] }, favorite: false, favoriteFeedback, favoriteLoginUrl,
    onClose() {}, onFavorite() {}, onContact() {}, onNotice() {},
  }));
  const start = markup.indexOf('<dialog '), end = markup.indexOf('</dialog>');
  assert.ok(start >= 0 && end > start, 'the real native Modal is rendered');
  return markup.slice(start, end);
}

test('favorite persistence errors are announced inside the native vehicle dialog', () => {
  const dialog = renderDetail({ kind: 'error', message: 'A alteração não foi salva. Tente novamente.' });
  assert.match(dialog, /id="detail-favorite-feedback"[^>]*role="alert"/);
  assert.match(dialog, /A alteração não foi salva\. Tente novamente\./);
  assert.match(dialog, /aria-describedby="detail-favorite-feedback"/);
});

test('signed-out favorite feedback has a usable native sign-in link inside the dialog', () => {
  const loginUrl = '/signin-with-chatgpt?return_to=%2Fminha-garagem';
  const dialog = renderDetail({ kind: 'login', message: 'Entre com sua conta para guardar este veículo.' }, loginUrl);
  assert.match(dialog, /id="detail-favorite-feedback"[^>]*role="status"/);
  assert.ok(dialog.includes(`href="${loginUrl}" target="_top"`));
  assert.match(dialog, /Entrar com ChatGPT/);
});
