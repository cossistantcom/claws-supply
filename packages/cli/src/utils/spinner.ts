import ora from "ora";

type SpinnerLike = {
  start: (text?: string) => SpinnerLike;
  text: string;
  succeed: (text?: string) => SpinnerLike;
  fail: (text?: string) => SpinnerLike;
  stop: () => SpinnerLike;
};

const noopSpinner: SpinnerLike = {
  text: "",
  start() {
    return this;
  },
  succeed() {
    return this;
  },
  fail() {
    return this;
  },
  stop() {
    return this;
  },
};

export function createSpinner(options: { enabled: boolean; text: string }): SpinnerLike {
  if (!options.enabled) {
    noopSpinner.text = options.text;
    return noopSpinner;
  }

  return ora({
    text: options.text,
    spinner: "dots",
  }).start();
}
