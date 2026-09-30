const handler = require('../api/check-payment');

describe('Vercel Serverless Function: check-payment', () => {
  it('should return 405 if method is not POST', async () => {
    const req = { method: 'GET', body: {} };
    let jsonResult;
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(data => jsonResult = data)
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(jsonResult.error).toBe('Method not allowed');
  });

  it('should return 400 if orderId is missing', async () => {
    const req = { method: 'POST', body: {} };
    let jsonResult;
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(data => jsonResult = data)
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(jsonResult.error).toBe('Missing orderId');
  });

  it('should return 500 if env vars are missing', async () => {
    const originalEnv = process.env;
    process.env = {}; // Clear env

    const req = { method: 'POST', body: { orderId: 'EB123' } };
    let jsonResult;
    const res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation(data => jsonResult = data)
    };

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonResult.error).toBe('Server configuration error');

    process.env = originalEnv; // Restore env
  });
});
