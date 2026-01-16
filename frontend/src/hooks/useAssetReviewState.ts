import { useReducer, useCallback } from 'react';

/**
 * Modal identifiers for the asset review page.
 */
export type ModalType =
  | 'approve'
  | 'revision'
  | 'upload'
  | 'edit'
  | 'delete'
  | 'compare'
  | null;

/**
 * Rectangle for spatial annotations.
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * State shape for asset review page.
 */
export interface AssetReviewState {
  // Modal state (only one modal at a time)
  activeModal: ModalType;

  // Panel visibility
  showTimeline: boolean;
  showAllVersionsComments: boolean;
  showActionsMenu: boolean;

  // Annotation state
  isDrawing: boolean;
  currentRect: Rectangle | null;
  selectedRect: Rectangle | null;
  selectedCommentId: string | null;

  // Video playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // PDF state
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  pdfFitMode: 'width' | 'height' | 'none';

  // Loading states
  isLocking: boolean;
}

/**
 * Actions for state reducer.
 */
type AssetReviewAction =
  | { type: 'OPEN_MODAL'; modal: ModalType }
  | { type: 'CLOSE_MODAL' }
  | { type: 'TOGGLE_TIMELINE' }
  | { type: 'TOGGLE_ALL_VERSIONS_COMMENTS' }
  | { type: 'TOGGLE_ACTIONS_MENU' }
  | { type: 'CLOSE_ACTIONS_MENU' }
  | { type: 'START_DRAWING'; rect: Rectangle }
  | { type: 'UPDATE_DRAWING'; rect: Rectangle }
  | { type: 'FINISH_DRAWING'; rect: Rectangle | null }
  | { type: 'CANCEL_DRAWING' }
  | { type: 'SET_SELECTED_RECT'; rect: Rectangle | null }
  | { type: 'SET_SELECTED_COMMENT'; commentId: string | null }
  | { type: 'SET_IS_PLAYING'; isPlaying: boolean }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_CURRENT_PAGE'; page: number }
  | { type: 'SET_TOTAL_PAGES'; totalPages: number }
  | { type: 'SET_ZOOM_LEVEL'; zoomLevel: number }
  | { type: 'SET_PDF_FIT_MODE'; fitMode: 'width' | 'height' | 'none' }
  | { type: 'SET_IS_LOCKING'; isLocking: boolean }
  | { type: 'RESET_ANNOTATION' };

const initialState: AssetReviewState = {
  activeModal: null,
  showTimeline: false,
  showAllVersionsComments: false,
  showActionsMenu: false,
  isDrawing: false,
  currentRect: null,
  selectedRect: null,
  selectedCommentId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  currentPage: 1,
  totalPages: 1,
  zoomLevel: 1,
  pdfFitMode: 'width',
  isLocking: false,
};

function reducer(state: AssetReviewState, action: AssetReviewAction): AssetReviewState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, activeModal: action.modal, showActionsMenu: false };

    case 'CLOSE_MODAL':
      return { ...state, activeModal: null };

    case 'TOGGLE_TIMELINE':
      return { ...state, showTimeline: !state.showTimeline };

    case 'TOGGLE_ALL_VERSIONS_COMMENTS':
      return { ...state, showAllVersionsComments: !state.showAllVersionsComments };

    case 'TOGGLE_ACTIONS_MENU':
      return { ...state, showActionsMenu: !state.showActionsMenu };

    case 'CLOSE_ACTIONS_MENU':
      return { ...state, showActionsMenu: false };

    case 'START_DRAWING':
      return {
        ...state,
        isDrawing: true,
        currentRect: action.rect,
        selectedCommentId: null,
      };

    case 'UPDATE_DRAWING':
      return { ...state, currentRect: action.rect };

    case 'FINISH_DRAWING':
      return {
        ...state,
        isDrawing: false,
        currentRect: null,
        selectedRect: action.rect,
      };

    case 'CANCEL_DRAWING':
      return { ...state, isDrawing: false, currentRect: null };

    case 'SET_SELECTED_RECT':
      return { ...state, selectedRect: action.rect };

    case 'SET_SELECTED_COMMENT':
      return { ...state, selectedCommentId: action.commentId };

    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.isPlaying };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.time };

    case 'SET_DURATION':
      return { ...state, duration: action.duration };

    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.page };

    case 'SET_TOTAL_PAGES':
      return { ...state, totalPages: action.totalPages };

    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.zoomLevel, pdfFitMode: 'none' };

    case 'SET_PDF_FIT_MODE':
      return { ...state, pdfFitMode: action.fitMode };

    case 'SET_IS_LOCKING':
      return { ...state, isLocking: action.isLocking };

    case 'RESET_ANNOTATION':
      return {
        ...state,
        selectedRect: null,
        selectedCommentId: null,
      };

    default:
      return state;
  }
}

/**
 * Hook for managing asset review page state with useReducer.
 * Consolidates 18+ individual useState calls into a single reducer.
 */
export function useAssetReviewState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Modal actions
  const openModal = useCallback((modal: ModalType) => {
    dispatch({ type: 'OPEN_MODAL', modal });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Panel actions
  const toggleTimeline = useCallback(() => {
    dispatch({ type: 'TOGGLE_TIMELINE' });
  }, []);

  const toggleAllVersionsComments = useCallback(() => {
    dispatch({ type: 'TOGGLE_ALL_VERSIONS_COMMENTS' });
  }, []);

  const toggleActionsMenu = useCallback(() => {
    dispatch({ type: 'TOGGLE_ACTIONS_MENU' });
  }, []);

  const closeActionsMenu = useCallback(() => {
    dispatch({ type: 'CLOSE_ACTIONS_MENU' });
  }, []);

  // Drawing actions
  const startDrawing = useCallback((rect: Rectangle) => {
    dispatch({ type: 'START_DRAWING', rect });
  }, []);

  const updateDrawing = useCallback((rect: Rectangle) => {
    dispatch({ type: 'UPDATE_DRAWING', rect });
  }, []);

  const finishDrawing = useCallback((rect: Rectangle | null) => {
    dispatch({ type: 'FINISH_DRAWING', rect });
  }, []);

  const cancelDrawing = useCallback(() => {
    dispatch({ type: 'CANCEL_DRAWING' });
  }, []);

  const setSelectedRect = useCallback((rect: Rectangle | null) => {
    dispatch({ type: 'SET_SELECTED_RECT', rect });
  }, []);

  const setSelectedCommentId = useCallback((commentId: string | null) => {
    dispatch({ type: 'SET_SELECTED_COMMENT', commentId });
  }, []);

  const resetAnnotation = useCallback(() => {
    dispatch({ type: 'RESET_ANNOTATION' });
  }, []);

  // Playback actions
  const setIsPlaying = useCallback((isPlaying: boolean) => {
    dispatch({ type: 'SET_IS_PLAYING', isPlaying });
  }, []);

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', time });
  }, []);

  const setDuration = useCallback((duration: number) => {
    dispatch({ type: 'SET_DURATION', duration });
  }, []);

  // Loading actions
  const setIsLocking = useCallback((isLocking: boolean) => {
    dispatch({ type: 'SET_IS_LOCKING', isLocking });
  }, []);

  // PDF actions
  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', page });
  }, []);

  const setTotalPages = useCallback((totalPages: number) => {
    dispatch({ type: 'SET_TOTAL_PAGES', totalPages });
  }, []);

  const setZoomLevel = useCallback((zoomLevel: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel });
  }, []);

  const setPdfFitMode = useCallback((fitMode: 'width' | 'height' | 'none') => {
    dispatch({ type: 'SET_PDF_FIT_MODE', fitMode });
  }, []);

  return {
    state,
    // Modal
    openModal,
    closeModal,
    // Panels
    toggleTimeline,
    toggleAllVersionsComments,
    toggleActionsMenu,
    closeActionsMenu,
    // Drawing/Annotation
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    setSelectedRect,
    setSelectedCommentId,
    resetAnnotation,
    // Playback
    setIsPlaying,
    setCurrentTime,
    setDuration,
    // PDF
    setCurrentPage,
    setTotalPages,
    setZoomLevel,
    setPdfFitMode,
    // Loading
    setIsLocking,
  };
}
