export type TrackOrderProgressState = "complete" | "current" | "pending";

export type TrackOrderProgressStep = {
  label: string;
  state: TrackOrderProgressState;
};
