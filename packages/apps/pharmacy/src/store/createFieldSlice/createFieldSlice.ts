import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export function createFieldSlice<State extends object>(name: string, initialState: State) {
  return createSlice({
    name,
    initialState,
    reducers: {
      setField(state, action: PayloadAction<{ key: keyof State; value: State[keyof State] }>) {
        const draft = state as State;
        draft[action.payload.key] = action.payload.value;
      },
    },
  });
}
