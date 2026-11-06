import { faultMessage } from "./faultMessage";

type WriteArgs<T> = {
  signedIn: boolean;
  fallback: string;
  pull?: boolean;
  reload: () => Promise<unknown>;
  rejectWithValue: (message: string) => unknown;
  work: () => Promise<T>;
};

export async function write<T>({
  signedIn,
  fallback,
  pull,
  reload,
  rejectWithValue,
  work,
}: WriteArgs<T>): Promise<T> {
  if (!signedIn) return rejectWithValue("Sign in required") as T;
  try {
    const result = await work();
    if (pull) await reload();
    return result;
  } catch (error: unknown) {
    try {
      await reload();
    } catch {
      // The session thunk records its own failure.
    }
    return rejectWithValue(faultMessage(error, fallback)) as T;
  }
}
