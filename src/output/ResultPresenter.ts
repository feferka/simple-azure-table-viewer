export interface ResultPresenter {
  readonly isEmpty: boolean;
  show(): Promise<void>;
}
