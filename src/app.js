import { createServer } from 'node:http';
import { URL } from 'node:url';
import { notFound } from './errors.js';
import { handleError, parseJsonBody, sendJson, setCorsHeaders } from './http.js';
import {
  addBorrower,
  createFixedDeposit,
  createLoan,
  deleteNotification,
  deleteBorrower,
  deleteRepayment,
  getFixedDeposit,
  getFDEarningsSchedule,
  getBorrower,
  getCollectionData,
  getLoan,
  getRepayment,
  getRepaymentSchedule,
  getStats,
  getSetting,
  listDeletedBorrowers,
  listFixedDeposits,
  listNotifications,
  listSettings,
  listBorrowers,
  listLoans,
  listRepayments,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  permanentlyDeleteBorrower,
  recordRepayment,
  requestPasswordReset,
  restoreBorrower,
  updateBorrower,
  updateFixedDeposit,
  updateLoan,
  upsertSetting,
} from './services.js';

const ok = (res, data, statusCode = 200) => sendJson(res, statusCode, { success: true, data });

const parseRoute = (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);
  return { url, pathParts };
};

const routeRequest = async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { url, pathParts } = parseRoute(req);

  if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'health') {
    ok(res, { status: 'ok', service: 'loan-management-api' });
    return;
  }

  if (pathParts[0] !== 'api') throw notFound('Route not found');

  const resource = pathParts[1];
  const id = pathParts[2];
  const subResource = pathParts[3];

  if (req.method === 'POST' && resource === 'auth' && id === 'login') {
    ok(res, await login(await parseJsonBody(req)));
    return;
  }

  if (req.method === 'POST' && resource === 'auth' && id === 'forgot-password') {
    ok(res, await requestPasswordReset(await parseJsonBody(req)));
    return;
  }

  if (req.method === 'GET' && resource === 'stats' && !id) {
    ok(res, await getStats());
    return;
  }

  if (req.method === 'GET' && resource === 'collection-data' && !id) {
    ok(res, await getCollectionData());
    return;
  }

  if (resource === 'borrowers') {
    if (req.method === 'GET' && !id) {
      const deleted = pathParts[2] === 'deleted' || url.searchParams.get('deleted') === 'true';
      return ok(res, deleted ? await listDeletedBorrowers() : await listBorrowers());
    }
    if (req.method === 'GET' && id === 'deleted') return ok(res, await listDeletedBorrowers());
    if (req.method === 'GET' && id) return ok(res, await getBorrower(id));
    if (req.method === 'POST' && !id) return ok(res, await addBorrower(await parseJsonBody(req)), 201);
    if ((req.method === 'PATCH' || req.method === 'PUT') && id && subResource === 'restore') return ok(res, await restoreBorrower(id));
    if ((req.method === 'DELETE') && id && subResource === 'permanent') return ok(res, await permanentlyDeleteBorrower(id));
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) return ok(res, await updateBorrower(id, await parseJsonBody(req)));
    if (req.method === 'DELETE' && id) return ok(res, await deleteBorrower(id));
  }

  if (resource === 'loans') {
    if (req.method === 'GET' && !id) return ok(res, await listLoans({ status: url.searchParams.get('status') || undefined }));
    if (req.method === 'GET' && id && subResource === 'schedule') return ok(res, await getRepaymentSchedule(id));
    if (req.method === 'GET' && id) return ok(res, await getLoan(id));
    if (req.method === 'POST' && !id) return ok(res, await createLoan(await parseJsonBody(req)), 201);
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) return ok(res, await updateLoan(id, await parseJsonBody(req)));
  }

  if (resource === 'repayments') {
    if (req.method === 'GET' && !id) return ok(res, await listRepayments({ loanId: url.searchParams.get('loanId') || undefined }));
    if (req.method === 'GET' && id) return ok(res, await getRepayment(id));
    if (req.method === 'POST' && !id) return ok(res, await recordRepayment(await parseJsonBody(req)), 201);
    if (req.method === 'DELETE' && id) return ok(res, await deleteRepayment(id));
  }

  if (resource === 'fixed-deposits') {
    if (req.method === 'GET' && !id) return ok(res, await listFixedDeposits({ status: url.searchParams.get('status') || undefined }));
    if (req.method === 'GET' && id && subResource === 'earnings') return ok(res, await getFDEarningsSchedule(id));
    if (req.method === 'GET' && id) return ok(res, await getFixedDeposit(id));
    if (req.method === 'POST' && !id) return ok(res, await createFixedDeposit(await parseJsonBody(req)), 201);
    if ((req.method === 'PATCH' || req.method === 'PUT') && id) return ok(res, await updateFixedDeposit(id, await parseJsonBody(req)));
  }

  if (resource === 'notifications') {
    if (req.method === 'GET' && !id) return ok(res, await listNotifications());
    if ((req.method === 'PATCH' || req.method === 'PUT') && id === 'read-all') return ok(res, await markAllNotificationsRead());
    if ((req.method === 'PATCH' || req.method === 'PUT') && id && subResource === 'read') return ok(res, await markNotificationRead(id));
    if (req.method === 'DELETE' && id) return ok(res, await deleteNotification(id));
  }

  if (resource === 'settings') {
    if (req.method === 'GET' && !id) return ok(res, await listSettings());
    if (req.method === 'GET' && id) return ok(res, await getSetting(id));
    if ((req.method === 'PUT' || req.method === 'PATCH') && id) return ok(res, await upsertSetting(id, await parseJsonBody(req)));
  }

  throw notFound('Route not found');
};

export const createApp = () => createServer(async (req, res) => {
  try {
    await routeRequest(req, res);
  } catch (error) {
    handleError(res, error);
  }
});