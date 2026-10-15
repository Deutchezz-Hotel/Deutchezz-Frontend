import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from './problem';

function error(status: number, code?: string, extras: Record<string, unknown> = {}) {
  return new ApiError({ status, code, detail: 'backend detail', ...extras });
}

describe('ApiError.userMessage payment/early-check-out rules', () => {
  it('maps the check-in payment gate and appends the outstanding balance', () => {
    expect(error(409, 'booking.payment_required_before_checkin', { outstandingBalance: 30000 }).userMessage)
      .toBe('Record the payment, then check the guest in. Outstanding balance: ₦30,000.');
  });

  it('maps the check-out payment gate and appends the outstanding balance', () => {
    expect(error(409, 'booking.payment_required_before_checkout', { outstandingBalance: 45000 }).userMessage)
      .toBe('Record the payment, then check the guest out. Outstanding balance: ₦45,000.');
  });

  it('maps the early-check-out admin gate even though it is a 403', () => {
    expect(error(403, 'booking.early_checkout_requires_admin').userMessage)
      .toBe('Early check-outs need an administrator. Ask an administrator to approve this check-out.');
  });

  it('omits the balance when the extension is absent', () => {
    expect(error(409, 'booking.payment_required_before_checkin').userMessage)
      .toBe('Record the payment, then check the guest in.');
  });

  it('falls back to the backend detail for other 409s', () => {
    expect(error(409, 'booking.invalid_state').userMessage).toBe('backend detail');
  });

  it('falls back to the generic permission text for other 403s', () => {
    expect(error(403, 'other.forbidden').userMessage).toBe("You don't have permission to do that.");
  });
});

describe('toApiError', () => {
  it('wraps non-ApiError values as a connection failure', () => {
    const api = toApiError(new Error('boom'));
    expect(api.status).toBe(0);
    expect(api.userMessage).toContain("couldn't reach the server");
  });
});
