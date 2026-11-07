import { createAsyncThunk as rtkCreateAsyncThunk } from "@reduxjs/toolkit";

type ThunkArgs = Parameters<typeof rtkCreateAsyncThunk>;

function createTaggedAsyncThunk(...args: ThunkArgs) {
  const typePrefix = args[0];
  const thunk = rtkCreateAsyncThunk(...args);
  function tagged(arg: unknown, config?: unknown) {
    return Object.assign(thunk(arg as never, config as never), { typePrefix, arg });
  }
  return Object.assign(tagged, thunk);
}

createTaggedAsyncThunk.withTypes = rtkCreateAsyncThunk.withTypes;

export const createAsyncThunk = createTaggedAsyncThunk as typeof rtkCreateAsyncThunk;
