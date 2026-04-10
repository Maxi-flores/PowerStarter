declare module '@ui/*';
declare module '@plasmic/Homepage' {
  import type { ComponentType } from 'react';
  const Homepage: ComponentType<Record<string, unknown>>;
  export default Homepage;
}
