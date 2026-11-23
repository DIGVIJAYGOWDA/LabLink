/** Lets any part of the app open the LabLink AI chat panel. */
export const OPEN_ASSISTANT_EVENT = 'lablink:open-assistant'

export function openAssistant() {
  window.dispatchEvent(new Event(OPEN_ASSISTANT_EVENT))
}
