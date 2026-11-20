// Reactive state to coordinate standalone WhatsApp widget and unified speed-dial widget
type Listener = () => void;
let isUnifiedWidgetActive = false;
const listeners = new Set<Listener>();

export function setUnifiedWidgetActive(active: boolean) {
  if (isUnifiedWidgetActive !== active) {
    isUnifiedWidgetActive = active;
    listeners.forEach((l) => l());
  }
}

export function subscribeUnifiedWidget(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getUnifiedWidgetActive() {
  return isUnifiedWidgetActive;
}
