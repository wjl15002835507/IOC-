import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const distDir = path.join(projectRoot, 'dist');
const prototypeDir = path.join(distDir, 'prototypes');
const assetsDir = path.join(distDir, 'assets');

fs.mkdirSync(prototypeDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

const runtimeFiles = [
  ['react/umd/react.production.min.js', 'react.production.min.js'],
  ['react-dom/umd/react-dom.production.min.js', 'react-dom.production.min.js'],
];

for (const [source, target] of runtimeFiles) {
  const sourcePath = path.join(projectRoot, 'node_modules', source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing browser runtime: ${sourcePath}`);
  }
  fs.copyFileSync(sourcePath, path.join(assetsDir, target));
}

const prototypeFiles = fs.readdirSync(prototypeDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const shell = ({ title, scriptPath }) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="../../" />
  <title>${escapeHtml(title)} - IOC原型</title>
  <style>
    html, body, #root { min-height: 100%; margin: 0; }
    #publish-error { display: none; padding: 24px; color: #b42318; font: 14px/1.6 Arial, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="publish-error">原型加载失败，请稍后刷新或查看 GitHub Actions 发布记录。</div>
  <script src="assets/react.production.min.js"></script>
  <script src="assets/react-dom.production.min.js"></script>
  <script>
    window.__AXHUB_DEFINE_COMPONENT__ = function (Component) {
      var root = document.getElementById('root');
      var element = React.createElement(Component);
      if (ReactDOM.createRoot) ReactDOM.createRoot(root).render(element);
      else ReactDOM.render(element, root);
    };
    window.addEventListener('error', function () {
      document.getElementById('publish-error').style.display = 'block';
    });
  </script>
  <script src="${escapeHtml(scriptPath)}"></script>
</body>
</html>
`;

const links = [];
for (const fileName of prototypeFiles) {
  const prototypeId = fileName.slice(0, -3);
  const outputDir = path.join(prototypeDir, prototypeId);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, 'index.html'),
    shell({ title: prototypeId, scriptPath: `prototypes/${fileName}` }),
    'utf8',
  );
  links.push(`<a href="./prototypes/${encodeURIComponent(prototypeId)}/">${escapeHtml(prototypeId)}</a>`);
}

const content = links.length > 0
  ? links.join('\n')
  : '<p>项目已经发布。创建第一个 Axhub 原型并推送后，预览入口会自动显示在这里。</p>';

fs.writeFileSync(path.join(distDir, 'index.html'), `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IOC原型</title>
  <style>
    body { margin: 0; background: #f6f7f9; color: #1d2939; font: 15px/1.6 "Microsoft YaHei", Arial, sans-serif; }
    main { max-width: 760px; margin: 64px auto; padding: 0 24px; }
    h1 { margin: 0 0 24px; font-size: 28px; }
    a { display: block; margin: 10px 0; padding: 14px 16px; border: 1px solid #d0d5dd; border-radius: 6px; background: #fff; color: #067647; text-decoration: none; }
    a:hover { border-color: #12b76a; }
  </style>
</head>
<body><main><h1>IOC原型</h1>${content}</main></body>
</html>
`, 'utf8');

fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
console.log(`Prepared GitHub Pages with ${prototypeFiles.length} prototype(s).`);
