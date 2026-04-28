import { authenticate, authorize } from '../../src/middlewares/auth';
import { signToken } from '../../src/utils/jwt';
import { Request, Response } from 'express';

function makeReq(headers: Record<string, string> = {}, user?: any): Request {
  return { headers, user } as unknown as Request;
}
const res = {} as Response;

describe('middlewares/auth', () => {
  it('rejette si pas de token', (done) => {
    authenticate(makeReq(), res, (err: any) => {
      expect(err.status).toBe(401);
      done();
    });
  });

  it('accepte un Bearer valide', (done) => {
    const token = signToken({ sub: 1, email: 'a@b.c', role: 'CLIENT' });
    const req = makeReq({ authorization: 'Bearer ' + token });
    authenticate(req, res, (err: any) => {
      expect(err).toBeUndefined();
      expect(req.user?.sub).toBe(1);
      done();
    });
  });

  it('autorise les roles attendus', (done) => {
    const req = makeReq({}, { sub: 1, email: 'a@b.c', role: 'ADMIN' });
    authorize('ADMIN')(req, res, (err: any) => {
      expect(err).toBeUndefined();
      done();
    });
  });

  it('refuse un mauvais role', (done) => {
    const req = makeReq({}, { sub: 1, email: 'a@b.c', role: 'CLIENT' });
    authorize('ADMIN')(req, res, (err: any) => {
      expect(err.status).toBe(403);
      done();
    });
  });
});
