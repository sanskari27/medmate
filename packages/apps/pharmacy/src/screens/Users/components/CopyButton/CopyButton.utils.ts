export function copyText(text: string, done: () => void) {
  navigator.clipboard?.writeText(text).then(done, done);
}
