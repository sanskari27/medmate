let backHandler: (() => boolean) | null = null;

export function registerBack(handler: (() => boolean) | null) {
  backHandler = handler;
}

export function consumeBack(): boolean {
  return backHandler?.() ?? false;
}
