/** An expected failure, identified by its `type` so callers can match on it. */
export interface TypedError<Type extends string = string> {
  readonly message: string;
  readonly type: Type;
}
