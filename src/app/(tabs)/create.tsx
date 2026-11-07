import { Redirect } from 'expo-router';

/**
 * The center tab button opens `/compose` as a modal instead of switching tabs.
 * This route only exists so the tab can be registered; deep links land on the modal.
 */
export default function CreateTabRoute() {
  return <Redirect href="/compose" />;
}
