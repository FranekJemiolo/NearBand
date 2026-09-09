import { defaultInstance } from './index';

const port = parseInt(process.env.PORT || '4000', 10);
defaultInstance.start(port).then(() => {
  // eslint-disable-next-line no-console
  console.log(`NearBand signaling server listening on port ${port}`);
});
