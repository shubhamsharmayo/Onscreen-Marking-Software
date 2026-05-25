import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  annotationStore: [],
  commentStore: [],
  marksStore: [], // ✅ New store added
  // status:[]
};

const annotationSlice = createSlice({
  name: "annotation",
  initialState,
  reducers: {
    // ---------- Annotations ----------
    addAnnotation: (state, action) => {
      state.annotationStore.push({ ...action.payload, synced: false });
    },
    updateAnnotation: (state, action) => {
      const index = state.annotationStore.findIndex(
        (a) => a.timeStamps === action.payload.timeStamps
      );
      if (index !== -1) {
        state.annotationStore[index] = {
          ...state.annotationStore[index],
          ...action.payload,
          synced: false,
        };
      }
    },
    deleteAnnotation: (state, action) => {
      const { id } = action.payload;
      state.annotationStore = state.annotationStore.filter((a) => a.id !== id);
    },
    markAnnotationsSynced: (state, action) => {
      const { ids } = action.payload;
      state.annotationStore = state.annotationStore.map((a) =>
        ids.includes(a.id) ? { ...a, synced: true } : a
      );
    },

    // ---------- Comments ----------
    addComment: (state, action) => {
      state.commentStore.push({ ...action.payload, synced: false });
    },
    updateComment: (state, action) => {
      const index = state.commentStore.findIndex(
        (c) => c.id === action.payload.id
      );
      if (index !== -1) {
        state.commentStore[index] = {
          ...state.commentStore[index],
          ...action.payload,
          synced: false,
        };
      }
    },
    deleteComment: (state, action) => {
      const { id } = action.payload;
      state.commentStore = state.commentStore.filter((c) => c.id !== id);
    },
    markCommentsSynced: (state, action) => {
      const { ids } = action.payload;
      state.commentStore = state.commentStore.map((c) =>
        ids.includes(c.id) ? { ...c, synced: true } : c
      );
    },

    // ---------- Marks ----------
    addMark: (state, action) => {
      state.marksStore.push({ ...action.payload, synced: false });
    },
    updateMark: (state, action) => {
      const index = state.marksStore.findIndex(
        (m) => m.id === action.payload.id
      );
      if (index !== -1) {
        state.marksStore[index] = {
          ...state.marksStore[index],
          ...action.payload,
          synced: false,
        };
      }
    },
    deleteMark: (state, action) => {
      const { id } = action.payload;
      state.marksStore = state.marksStore.filter((m) => m.id !== id);
    },
    markMarksSynced: (state, action) => {
      const { ids } = action.payload;
      state.marksStore = state.marksStore.map((m) =>
        ids.includes(m.id) ? { ...m, synced: true } : m
      );
    },

    // ---------- Bulk Load ----------
    // setAnnotationsAndCommentsAndMarks: (state, action) => {
    //   state.annotationStore = (action.payload.annotationStore || []).map((a) => ({
    //     ...a,
    //     synced: true,
    //   }));
    //   state.commentStore = (action.payload.commentStore || []).map((c) => ({
    //     ...c,
    //     synced: true,
    //   }));
    //   state.marksStore = (action.payload.marksStore || []).map((m) => ({
    //     ...m,
    //     synced: true,
    //   }));
    // },

    setAnnotationsAndCommentsAndMarks: (state, action) => {
      const incomingAnnotations = action.payload.annotationStore || [];
      const incomingComments = action.payload.commentStore || [];
      const incomingMarks = action.payload.marksStore || [];

      // ✅ MERGE ANNOTATIONS
      incomingAnnotations.forEach((newA) => {
        const exists = state.annotationStore.find((a) => a.id === newA.id);
        if (!exists) {
          state.annotationStore.push({ ...newA, synced: true });
        }
      });

      // ✅ MERGE COMMENTS
      incomingComments.forEach((newC) => {
        const exists = state.commentStore.find((c) => c.id === newC.id);
        if (!exists) {
          state.commentStore.push({ ...newC, synced: true });
        }
      });

      // ✅ MERGE MARKS
      incomingMarks.forEach((newM) => {
        const exists = state.marksStore.find((m) => m.id === newM.id);
        if (!exists) {
          state.marksStore.push({ ...newM, synced: true });
        }
      });
    },
  },
});

export const {
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  markAnnotationsSynced,
  addComment,
  updateComment,
  deleteComment,
  markCommentsSynced,
  addMark,
  updateMark,
  deleteMark,
  markMarksSynced,
  setAnnotationsAndCommentsAndMarks,
} = annotationSlice.actions;

export default annotationSlice.reducer;
