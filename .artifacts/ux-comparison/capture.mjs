const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const stage = process.argv[2] || 'before';
const output = join(fileURLToPath(new URL('.', import.meta.url)), stage);
await mkdir(output, { recursive: true });

const profile = { profileType: 'employee', userId: 1, username: 'ana', displayName: 'Ana Martins', fullName: 'Ana Martins', nif: '123', email: 'ana@example.test', phoneNumber: '910', address: 'Lisboa', companyId: 1, companyName: 'Forma Norte', roles: ['employee', 'architect'], availableCompanies: [], companyRole: 'owner', isArchitect: true, themePreference: 'light' };
const phases = [
  { id: 11, code: 'preliminary-study', label: 'Estudo Prévio', position: 0, isCurrent: false },
  { id: 12, code: 'licensing-project', label: 'Projeto de Licenciamento', position: 1, isCurrent: true },
  { id: 13, code: 'execution-project', label: 'Projeto de Execução', position: 2, isCurrent: false },
];
const project = { id: 1, companyId: 1, companyName: 'Forma Norte', title: 'Casa do Vale', code: 'CV-001', address: 'Rua do Vale 18, Lisboa', googleMapsUrl: null, isArchived: false, clients: [{ id: 7, displayName: 'Marta Silva' }], members: [{ employeeId: 3, displayName: 'Inês Costa', email: 'ines@example.test' }], phases, canEditTimeline: true, currentPhaseCode: 'licensing-project' };
const document = (id, phaseId, fileName, uploadedAt) => ({ id, phaseId, fileName, contentType: 'application/dxf', length: 8400000, status: 'Available', isVisible: true, createdBy: 1, createdByDisplayName: 'Ana Martins', createdAt: uploadedAt, uploadedAt, preview: { kind: 'drawing', sourceFormat: 'dxf' } });
const documents = [document('plan-old', 11, 'Estudo_Preliminar_R01.dxf', '2026-08-10T09:00:00Z'), document('plan-a', 12, 'Planta_Piso_0_R02.dxf', '2026-08-12T09:00:00Z'), document('plan-b', 12, 'Planta_Piso_0_R03.dxf', '2026-08-18T09:00:00Z')];
const path = (points, layerId = 'walls') => ({ layerId, style: { stroke: '#23332d', lineWeight: 0.6 }, closed: true, segments: points.map((point, index) => ({ kind: 'line', start: { x: point[0], y: point[1] }, end: { x: points[(index + 1) % points.length][0], y: points[(index + 1) % points.length][1] } })) });
const drawing = (id) => ({ schemaVersion: 1, converterVersion: 'fixture', documentId: id, sourceFormat: 'dxf', units: 'm', bounds: { minX: 0, minY: 0, maxX: 100, maxY: 68 }, layers: [], paths: [path([[4, 4], [96, 4], [96, 64], [4, 64]]), path([[8, 8], [43, 8], [43, 34], [8, 34]]), path([[45, 8], [91, 8], [91, 34], [45, 34]]), path([[8, 36], [52, 36], [52, 60], [8, 60]]), path([[54, 36], [91, 36], [91, 60], [54, 60]])], text: [{ layerId: 'labels', style: { stroke: '#23332d', lineWeight: 0.5 }, value: 'SALA', position: { x: 23, y: 20 }, height: 3, rotation: 0 }, { layerId: 'labels', style: { stroke: '#23332d', lineWeight: 0.5 }, value: 'COZINHA', position: { x: 62, y: 20 }, height: 3, rotation: 0 }], warnings: [] });
const notifications = { items: [], hasMore: false };

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
async function setup(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.addInitScript(() => {
    sessionStorage.setItem('racletty.auth.roles', JSON.stringify(['employee', 'architect']));
    sessionStorage.setItem('racletty.application.environment', 'development');
  });
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    const p = url.pathname;
    if (!p.startsWith('/api/')) return route.continue();
    let body = [];
    let status = 200;
    if (p === '/api/profile') body = profile;
    else if (p === '/api/projects/' && route.request().method() === 'GET') body = [project];
    else if (p === '/api/projects/1') body = project;
    else if (p === '/api/projects/1/documents') body = documents;
    else if (/^\/api\/projects\/1\/documents\/[^/]+\/drawing$/.test(p)) body = drawing(p.split('/')[5]);
    else if (p === '/api/projects/1/part-conversations') body = [];
    else if (p === '/api/projects/1/messages') body = { items: [], hasMore: false };
    else if (p === '/api/projects/members') body = [{ employeeId: 3, displayName: 'Inês Costa', email: 'ines@example.test' }];
    else if (p === '/api/clients/') body = [{ id: 7, displayName: 'Marta Silva', email: 'marta@example.test', projectCount: 1 }];
    else if (p === '/api/notifications/summary') body = { unreadCount: 0, pendingInvitationCount: 0, total: 0, projectUnreadCounts: [] };
    else if (p === '/api/notifications') body = notifications;
    else if (p === '/api/projects/' && route.request().method() === 'POST') { body = { error: 'O código já está em uso.', errors: { code: ['Este código já está em uso.'] } }; status = 409; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}
for (const [name, width, height, url] of [
  ['project-desktop', 1440, 900, '/projects/1'],
  ['project-tablet', 900, 900, '/projects/1'],
  ['project-mobile', 390, 844, '/projects/1'],
  ['dashboard-desktop', 1440, 900, '/dashboard'],
  ['create-desktop', 1440, 900, '/projects/new'],
]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await setup(page);
  await page.goto('http://localhost:5385' + url, { waitUntil: 'networkidle' });
  try { await page.locator('h1').first().waitFor({ timeout: 5000 }); }
  catch { console.log('PAGE', page.url(), (await page.locator('body').innerText()).slice(0, 1000), errors); throw new Error('No heading rendered'); }
  await page.evaluate(() => window.scrollTo(0, 0));
  if (name.includes('project-') && await page.locator('body').evaluate(element => element.scrollWidth > window.innerWidth)) errors.push(`${name}: horizontal overflow`);
  await page.screenshot({ path: join(output, name + '.png'), fullPage: true, animations: 'disabled' });
  if (stage === 'after' && name === 'project-desktop') {
    await page.getByRole('button', { name: 'Estudo Prévio' }).click();
    await page.getByText('Outra fase').waitFor();
    await page.screenshot({ path: join(output, 'project-other-phase.png'), fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Voltar à fase atual' }).click();
    await page.getByText('Fase atual', { exact: true }).last().waitFor();
  }
  if (stage === 'after' && name === 'create-desktop') {
    await page.getByLabel('Título').fill('Casa Nova');
    await page.getByLabel('Código').fill('CV-001');
    await page.getByRole('button', { name: 'Criar projeto' }).click();
    await page.getByText('Este código já está em uso.').waitFor();
    await page.screenshot({ path: join(output, 'create-error-desktop.png'), fullPage: true, animations: 'disabled' });
  }
  await context.close();
}
await writeFile(join(output, 'browser-errors.json'), JSON.stringify(errors, null, 2));
await browser.close();
console.log(`Captured ${stage}; browser errors: ${errors.length}`);
