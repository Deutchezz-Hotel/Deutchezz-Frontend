/** A field paired with whether it passed validation, used to route focus. */
export interface FieldCheck {
  valid: boolean;
  el: HTMLElement | null;
}

/**
 * Scrolls the first invalid field into view and focuses it without moving the
 * whole scroll container unexpectedly. Returns true when a field was focused.
 */
export function focusFirstInvalid(fields: FieldCheck[]): boolean {
  const target = fields.find((field) => !field.valid)?.el;
  if (!target) return false;
  target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  target.focus({ preventScroll: true });
  return true;
}
