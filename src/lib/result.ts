export interface Err<E> {
  readonly error: E;
  readonly ok: false;
}

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export type Result<T, E> = Err<E> | Ok<T>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = <E>(error: E): Err<E> => ({ error, ok: false });
