import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import evaluatorSlice from "./evaluatorSlice";
import annotationSlice from "./annotationSlice";
import syncMiddleware from './syncMiddleware'

const store = configureStore({
  reducer: {
    auth: authSlice,
    evaluator: evaluatorSlice,
    annotation: annotationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(syncMiddleware),
});

export default store;
